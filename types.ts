
export enum AQICategory {
  GOOD = 'Good',
  SATISFACTORY = 'Satisfactory',
  MODERATE = 'Moderate',
  POOR = 'Poor',
  VERY_POOR = 'Very Poor',
  SEVERE = 'Severe',
  UNKNOWN = 'Unknown'
}

export interface CityData {
  id: string;
  name: string;
  stationId: string;
  forceNoHaze?: boolean;
}

export interface AQIResult {
  value: number;
  category: AQICategory;
  color: string;
}

export interface SmogParams {
  opacity: number;
  blur: number;
  color: string;
}
