import { CityData, AQICategory } from './types';

export const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN;

export const CITIES: CityData[] = [
  { id: 'delhi', name: 'Delhi', stationId: '10118' },
  { id: 'bangalore', name: 'Bangalore', stationId: '8190' },
  { id: 'mangalore', name: 'Mangalore', stationId: '13719', forceNoHaze: true },
];

export const AQI_LEVELS = [
  { max: 50, label: AQICategory.GOOD, color: '#4ade80' }, // Green-400
  { max: 100, label: AQICategory.SATISFACTORY, color: '#84cc16' }, // Lime-500
  { max: 200, label: AQICategory.MODERATE, color: '#eab308' }, // Yellow-500
  { max: 300, label: AQICategory.POOR, color: '#f97316' }, // Orange-500
  { max: 400, label: AQICategory.VERY_POOR, color: '#ef4444' }, // Red-500
  { max: Infinity, label: AQICategory.SEVERE, color: '#7f1d1d' }, // Red-900
];
