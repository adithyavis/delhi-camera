import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { calculateSmogParams } from '../utils/smogMath';

interface CameraViewProps {
  aqi: number;
  forceNoHaze?: boolean;
  onCapture: (dataUrl: string) => void;
}

const smogVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const smogFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform float uBlur;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec4 texColor = texture2D(tDiffuse, vUv);

    // Height-based density gradient (more smog toward top/horizon, but still visible at bottom)
    // Base of 0.4 ensures foreground has visible smog, gradient adds more toward horizon
    float heightFactor = 0.4 + 0.6 * smoothstep(0.0, 0.7, vUv.y);

    // Multi-layer animated noise for organic movement
    vec2 p1 = vUv * 3.0 + vec2(uTime * 0.02, uTime * 0.01);
    vec2 p2 = vUv * 5.0 - vec2(uTime * 0.015, uTime * 0.025);
    vec2 p3 = vUv * 8.0 + vec2(uTime * 0.008, -uTime * 0.012);

    // Layered noise for realistic turbulence
    float n1 = fbm(p1);
    float n2 = fbm(p2 + n1 * 0.5);
    float n3 = fbm(p3 + n2 * 0.3);
    float combinedNoise = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15);

    // Final density combines height gradient with noise variation
    float baseDensity = uIntensity * heightFactor;
    float noisyDensity = baseDensity * (0.6 + combinedNoise * 0.4);

    // Clamp density
    float density = clamp(noisyDensity, 0.0, 0.85);

    // Color mixing with smog
    vec3 smogMix = mix(texColor.rgb, uColor, density);

    // Desaturation effect (pollution washes out colors)
    float luminance = dot(smogMix, vec3(0.299, 0.587, 0.114));
    float desatAmount = density * 0.5;
    smogMix = mix(smogMix, vec3(luminance), desatAmount);

    // Slight contrast reduction for hazy atmosphere
    smogMix = mix(smogMix, vec3(0.5), density * 0.15);

    gl_FragColor = vec4(smogMix, 1.0);
  }
`;

const CameraView: React.FC<CameraViewProps> = ({ aqi, forceNoHaze, onCapture }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API not supported in this browser. Please use HTTPS.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');

        try {
          await videoRef.current.play();
          setIsCameraActive(true);
          setNeedsUserGesture(false);
        } catch (playError) {
          console.warn('Autoplay prevented, waiting for user gesture', playError);
          setNeedsUserGesture(true);
        }
      }
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please enable it in settings.');
      } else {
        setError(`Error accessing camera: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleManualStart = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsCameraActive(true);
        setNeedsUserGesture(false);
      } catch (e) {
        console.error('Manual start failed', e);
      }
    }
  };

  const aqiRef = useRef(aqi);
  const forceNoHazeRef = useRef(forceNoHaze);

  useEffect(() => {
    aqiRef.current = aqi;
    forceNoHazeRef.current = forceNoHaze;
  }, [aqi, forceNoHaze]);

  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    if (rendererRef.current) return;

    const container = containerRef.current;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const videoTexture = new THREE.VideoTexture(videoRef.current);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTextureRef.current = videoTexture;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: videoTexture },
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uBlur: { value: 0 },
        uColor: { value: new THREE.Color(0xb9b4a5) },
      },
      vertexShader: smogVertexShader,
      fragmentShader: smogFragmentShader,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    materialRef.current = material;

    startCamera();

    let frameId: number;
    const animate = (time: number) => {
      if (materialRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        const params = calculateSmogParams(aqiRef.current, forceNoHazeRef.current);

        materialRef.current.uniforms.uTime.value = time * 0.001;
        materialRef.current.uniforms.uIntensity.value = params.opacity;
        materialRef.current.uniforms.uBlur.value = params.blur;

        const colorMatch = params.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
        if (colorMatch) {
          materialRef.current.uniforms.uColor.value.setRGB(
            parseInt(colorMatch[1]) / 255,
            parseInt(colorMatch[2]) / 255,
            parseInt(colorMatch[3]) / 255,
          );
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      material.dispose();
      geometry.dispose();
      videoTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      rendererRef.current = null;
    };
  }, []);

  const capture = () => {
    if (rendererRef.current) {
      const dataUrl = rendererRef.current.domElement.toDataURL('image/jpeg', 0.95);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);
      onCapture(dataUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black"
    >
      {isFlashing && <div className="absolute inset-0 bg-black z-50 pointer-events-none" />}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0.01,
          pointerEvents: 'none',
          top: 0,
          left: 0,
        }}
      />

      {!isCameraActive && !error && !needsUserGesture && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-white/60 text-sm font-medium tracking-wide uppercase">
              Waking up Lens...
            </p>
          </div>
        </div>
      )}

      {needsUserGesture && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <button
            onClick={handleManualStart}
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg shadow-2xl active:scale-95 transition-transform"
          >
            Start Camera
          </button>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-black/95 z-50">
          <div className="max-w-xs text-white">
            <div className="mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-xl font-bold mb-2">Access Denied</p>
            <p className="text-white/60 text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 text-white underline text-sm"
            >
              Try Reloading
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center z-20 pointer-events-auto">
        <button
          onClick={capture}
          disabled={!isCameraActive}
          className={`group relative flex items-center justify-center w-20 h-20 transition-all ${
            !isCameraActive ? 'opacity-50 grayscale' : 'active:scale-90'
          }`}
        >
          <div className="absolute inset-0 rounded-full bg-white/30 backdrop-blur-sm border-4 border-white"></div>
          <div className="w-14 h-14 rounded-full bg-white shadow-lg group-active:bg-gray-200 transition-colors"></div>
        </button>
      </div>
    </div>
  );
};

export default CameraView;
