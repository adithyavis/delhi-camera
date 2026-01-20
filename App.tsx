import React, { useState, useEffect, useCallback } from 'react';
import { CITIES } from './constants';
import { CityData, AQIResult } from './types';
import { fetchAQI } from './services/aqiService';
import { getAQIInfo } from './utils/smogMath';
import CameraView from './components/CameraView';
import CitySelector from './components/CitySelector';
import AQIIndicator from './components/AQIIndicator';
import Legend from './components/Legend';
import CapturePreview from './components/CapturePreview';

const App: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<CityData>(CITIES[0]);
  const [aqiValue, setAqiValue] = useState<number | null>(null);
  const [aqiInfo, setAqiInfo] = useState<AQIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const loadAQI = useCallback(async (city: CityData) => {
    setLoading(true);
    const value = await fetchAQI(city.lat, city.lng);
    setAqiValue(value);
    if (value !== null) {
      setAqiInfo(getAQIInfo(value));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAQI(selectedCity);
    // Refresh every 10 minutes
    const interval = setInterval(() => loadAQI(selectedCity), 600000);
    return () => clearInterval(interval);
  }, [selectedCity, loadAQI]);

  const handleCapture = (dataUrl: string) => {
    setCapturedImage(dataUrl);
  };

  return (
    <div
      className="relative w-full bg-black flex flex-col items-center justify-center overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {/* Background Camera Feed */}
      <CameraView
        aqi={aqiValue || 0}
        forceNoHaze={selectedCity.forceNoHaze}
        onCapture={handleCapture}
      />

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full p-6 flex flex-col items-center pointer-events-none">
        <div className="text-white text-lg font-bold mb-4 drop-shadow-lg pointer-events-auto">
          Delhi Camera
        </div>

        <div className="w-full max-w-xs flex flex-col items-center gap-3 pointer-events-auto">
          <CitySelector cities={CITIES} selectedCity={selectedCity} onSelect={setSelectedCity} />

          {loading ? (
            <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm animate-pulse">
              Fetching AQI...
            </div>
          ) : aqiInfo ? (
            <AQIIndicator info={aqiInfo} />
          ) : (
            <div className="bg-red-500/80 px-4 py-2 rounded-full text-white text-sm">
              AQI Unavailable
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className="absolute left-0 w-full flex justify-between items-center px-10 pointer-events-none"
        style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => setIsLegendOpen(true)}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto active:scale-95 transition-transform"
          aria-label="Show Legend"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </button>

        {/* Shutter Button is in CameraView for better interaction but we could put it here */}
        <div className="w-12"></div>
      </div>

      {/* Modals */}
      {capturedImage && (
        <CapturePreview image={capturedImage} onClose={() => setCapturedImage(null)} />
      )}

      {isLegendOpen && <Legend currentAqi={aqiValue || 0} onClose={() => setIsLegendOpen(false)} />}
    </div>
  );
};

export default App;
