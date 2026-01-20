import React from 'react';
import { AQIResult } from '../types';

interface AQIIndicatorProps {
  info: AQIResult;
}

const AQIIndicator: React.FC<AQIIndicatorProps> = ({ info }) => {
  return (
    <div
      className="px-6 py-2.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-2xl backdrop-blur-sm border border-white/20"
      style={{ backgroundColor: `${info.color}CC` }}
    >
      <span className="text-lg">AQI: {info.value}</span>
      <span className="opacity-60">•</span>
      <span className="text-lg uppercase tracking-tight">{info.category}</span>
    </div>
  );
};

export default AQIIndicator;
