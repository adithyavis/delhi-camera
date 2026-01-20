import { WAQI_TOKEN } from '../constants';

export const fetchAQI = async (stationId: string): Promise<number | null> => {
  try {
    const response = await fetch(`https://api.waqi.info/feed/@${stationId}/?token=${WAQI_TOKEN}`);
    const json = await response.json();
    if (json.status === 'ok') {
      return json.data.aqi;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch AQI:', error);
    return null;
  }
};
