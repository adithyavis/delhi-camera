import React from 'react';
import { AQI_LEVELS } from '../constants';

interface LegendProps {
  currentAqi: number;
  onClose: () => void;
}

const Legend: React.FC<LegendProps> = ({ currentAqi, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">AQI Legend</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-scroll flex-shrink-1 flex flex-col">
          {AQI_LEVELS.map((level, idx) => {
            const rangeText =
              idx === 0
                ? `0 - ${level.max}`
                : idx === AQI_LEVELS.length - 1
                ? `${AQI_LEVELS[idx - 1].max}+`
                : `${AQI_LEVELS[idx - 1].max + 1} - ${level.max}`;

            const isCurrent =
              currentAqi <= level.max && (idx === 0 || currentAqi > AQI_LEVELS[idx - 1].max);

            return (
              <div
                key={level.label}
                className={`flex items-center p-3 rounded-xl transition-all ${
                  isCurrent ? 'bg-gray-100 ring-2 ring-blue-500 ring-inset' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg mr-4 flex-shrink-0"
                  style={{ backgroundColor: level.color }}
                ></div>
                <div className="flex-grow">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {rangeText}
                  </div>
                  <div className="text-base font-bold text-gray-800 leading-tight">
                    {level.label}
                  </div>
                </div>
                {isCurrent && (
                  <div className="text-blue-500 font-bold text-sm bg-blue-50 px-2 py-1 rounded-md">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-gray-50 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Smog effect is dynamically calculated based on real-time air quality data.
          </p>
        </div>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default Legend;
