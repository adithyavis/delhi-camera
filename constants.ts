import { CityData, AQICategory } from './types';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_API_KEY;

export const CITIES: CityData[] = [
  { id: 'delhi', name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { id: 'bangalore', name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { id: 'mangalore', name: 'Mangalore', lat: 12.9141, lng: 74.856, forceNoHaze: true },
];

export const AQI_LEVELS = [
  { max: 50, label: AQICategory.GOOD, color: '#4ade80' }, // Green-400
  { max: 100, label: AQICategory.SATISFACTORY, color: '#84cc16' }, // Lime-500
  { max: 200, label: AQICategory.MODERATE, color: '#eab308' }, // Yellow-500
  { max: 300, label: AQICategory.POOR, color: '#f97316' }, // Orange-500
  { max: 400, label: AQICategory.VERY_POOR, color: '#ef4444' }, // Red-500
  { max: Infinity, label: AQICategory.SEVERE, color: '#7f1d1d' }, // Red-900
];
