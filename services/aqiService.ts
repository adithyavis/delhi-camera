import { GOOGLE_MAPS_API_KEY } from '../constants';

// Cache with 10-minute TTL
const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  value: number;
  timestamp: number;
}

const aqiCache = new Map<string, CacheEntry>();

const getCacheKey = (lat: number, lng: number): string => `${lat},${lng}`;

export const fetchAQI = async (lat: number, lng: number): Promise<number | null> => {
  const cacheKey = getCacheKey(lat, lng);
  const cached = aqiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const response = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: {
            latitude: lat,
            longitude: lng,
          },
          extraComputations: ['LOCAL_AQI'],
        }),
      },
    );

    if (!response.ok) {
      console.error('Google AQI API error:', response.status);
      return cached?.value ?? null;
    }

    const json = await response.json();
    const indexes = json.indexes || [];

    let aqi: number | null = null;

    const indiaAqi = indexes.find((idx: any) => idx.code === 'ind_cpcb');
    if (indiaAqi?.aqi) {
      aqi = indiaAqi.aqi;
    } else {
      const uaqi = indexes.find((idx: any) => idx.code === 'uaqi');
      if (uaqi?.aqi) {
        aqi = uaqi.aqi;
      } else if (indexes.length > 0 && indexes[0].aqi) {
        aqi = indexes[0].aqi;
      }
    }

    // Cache the result
    if (aqi !== null) {
      aqiCache.set(cacheKey, { value: aqi, timestamp: Date.now() });
    }

    return aqi;
  } catch (error) {
    console.error('Failed to fetch AQI:', error);
    return cached?.value ?? null;
  }
};
