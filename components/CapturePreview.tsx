import React, { useEffect } from 'react';

interface CapturePreviewProps {
  image: string;
  onClose: () => void;
}

const CapturePreview: React.FC<CapturePreviewProps> = ({ image, onClose }) => {
  useEffect(() => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `delhi-camera-${new Date().getTime()}.jpg`;
    link.click();
  }, [image]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="fixed bottom-0 left-0 z-[60] flex flex-col items-end">
      <div className="relative w-3/12 h-3/12 flex flex-col">
        <div className="flex-grow flex items-center justify-end p-4">
          <img
            src={image}
            alt="Captured"
            className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
          />
        </div>
      </div>
    </div>
  );
};

export default CapturePreview;
