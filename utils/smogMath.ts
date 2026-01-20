import { AQI_LEVELS } from '../constants';
import { AQIResult, SmogParams } from '../types';

export const getAQIInfo = (aqi: number): AQIResult => {
  const level = AQI_LEVELS.find((l) => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
  return {
    value: aqi,
    category: level.label,
    color: level.color,
  };
};

export const calculateSmogParams = (aqi: number, forceNoHaze: boolean = false): SmogParams => {
  if (forceNoHaze) {
    return { opacity: 0, blur: 0, color: 'rgba(200, 200, 180, 0)' };
  }

  let opacity = 0;
  let blur = 0;

  if (aqi <= 50) {
    opacity = 0;
    blur = 0;
  } else if (aqi <= 100) {
    opacity = 0.05;
    blur = 0.2;
  } else if (aqi <= 200) {
    opacity = 0.3;
    blur = 1.5;
  } else if (aqi <= 300) {
    opacity = 0.45;
    blur = 3.0;
  } else {
    // Severe case: 301+
    const ratio = Math.min((aqi - 300) / 400, 1);
    opacity = 1.0 + ratio * 0.1;
    blur = 8.0 + ratio * 4.0;
  }
  return {
    opacity,
    blur,
    color: `rgba(185, 180, 165, ${opacity})`,
  };
};
