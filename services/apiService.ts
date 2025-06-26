
import type { FeatureCollection } from 'geojson';
import type { DailyRateLimitInfo, IsochroneCacheData } from '../types';
import { 
  ORS_DAILY_LIMIT, 
  ORS_MINUTE_LIMIT, 
  LOCALSTORAGE_ORS_DAILY_RATE_LIMIT_KEY, 
  LOCALSTORAGE_ORS_ISOCHRONE_CACHE_KEY,
  LOCALSTORAGE_ORS_API_KEY // Import new constant
} from '../constants';

let minuteRequestTimestamps: number[] = [];

const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(LOCALSTORAGE_ORS_API_KEY);
  }
  return null;
};

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

const getDailyRateInfo = (): DailyRateLimitInfo => {
  const storedInfo = localStorage.getItem(LOCALSTORAGE_ORS_DAILY_RATE_LIMIT_KEY);
  let info: DailyRateLimitInfo = storedInfo ? JSON.parse(storedInfo) : { count: 0, lastReset: getTodayDateString() };
  
  if (info.lastReset !== getTodayDateString()) {
    info = { count: 0, lastReset: getTodayDateString() };
    localStorage.setItem(LOCALSTORAGE_ORS_DAILY_RATE_LIMIT_KEY, JSON.stringify(info));
  }
  return info;
};

const incrementDailyCount = (): void => {
  const info = getDailyRateInfo();
  info.count += 1;
  localStorage.setItem(LOCALSTORAGE_ORS_DAILY_RATE_LIMIT_KEY, JSON.stringify(info));
};

const checkMinuteRateLimit = (): boolean => {
  const now = Date.now();
  minuteRequestTimestamps = minuteRequestTimestamps.filter(ts => now - ts < 60000); // Keep last minute's timestamps
  return minuteRequestTimestamps.length < ORS_MINUTE_LIMIT;
};

const recordMinuteRequest = (): void => {
  minuteRequestTimestamps.push(Date.now());
};

const getIsochroneCache = (): IsochroneCacheData => {
  const cache = localStorage.getItem(LOCALSTORAGE_ORS_ISOCHRONE_CACHE_KEY);
  return cache ? JSON.parse(cache) : {};
};

const storeInIsochroneCache = (key: string, data: FeatureCollection): void => {
  const cache = getIsochroneCache();
  cache[key] = data;
  localStorage.setItem(LOCALSTORAGE_ORS_ISOCHRONE_CACHE_KEY, JSON.stringify(cache));
};

export const getIsochrone = async (
  lat: number,
  lng: number,
  timeInMinutes: number,
  options: { forceRefetch?: boolean } = {}
): Promise<{ data?: FeatureCollection; error?: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { error: "Openrouteservice API key is not set. Please configure it in the Settings." };
  }

  const cacheKey = `isochrone-${lat}-${lng}-${timeInMinutes}`;
  const cache = getIsochroneCache();

  if (!options.forceRefetch && cache[cacheKey]) {
    return { data: cache[cacheKey] };
  }

  const dailyInfo = getDailyRateInfo();
  if (dailyInfo.count >= ORS_DAILY_LIMIT) {
    // This check remains to prevent attempting a request if local daily quota is already hit.
    // ORS itself might have different daily limits or reset times.
    return { error: `Daily API request limit (${ORS_DAILY_LIMIT}) locally tracked has been met. Please try again tomorrow. Last reset: ${dailyInfo.lastReset}` };
  }

  if (!checkMinuteRateLimit()) {
    // This check remains for local minute rate limiting.
    return { error: `Minute API request limit (${ORS_MINUTE_LIMIT}) locally tracked has been met. Please try again in a minute.` };
  }
  
  console.log(
    `INFO: Attempting ORS API query. Current local minute count: ${minuteRequestTimestamps.length}/${ORS_MINUTE_LIMIT}, Local daily count: ${getDailyRateInfo().count}/${ORS_DAILY_LIMIT}.`
  );

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/isochrones/foot-walking', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        locations: [[lng, lat]],
        range: [timeInMinutes * 60],
        range_type: 'time',
      }),
    });

    if (response.ok) {
      // Successful request, increment quotas
      incrementDailyCount();
      recordMinuteRequest();
      const data: FeatureCollection = await response.json();
      storeInIsochroneCache(cacheKey, data);
      return { data };
    } else {
      // Request failed (e.g., 400, 401, 403, 404, 429, 5xx)
      // DO NOT increment quotas for any failed request.
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error("ORS API Error:", response.status, errorData);
      let errorMessage = `API Error: ${response.status} - ${errorData.error?.message || response.statusText}`;

      if (response.status === 401 || response.status === 403) {
        errorMessage += " This might be due to an invalid or unauthorized API key. Please check it in Settings.";
      } else if (response.status === 429) {
        errorMessage += " Rate limit exceeded on the Openrouteservice server.";
      }
      return { error: errorMessage };
    }

  } catch (err) {
    // Network error or other fetch-related issue.
    // DO NOT increment quotas for these errors either.
    console.error("Fetch error for isochrone:", err);
    return { error: `Network error or failed to fetch isochrone: ${err instanceof Error ? err.message : String(err)}` };
  }
};

export const getCurrentMinuteRequestCount = (): number => {
  const now = Date.now();
  const currentMinuteTimestamps = minuteRequestTimestamps.filter(ts => now - ts < 60000);
  return currentMinuteTimestamps.length;
};

export const getCurrentDailyRequestCount = (): number => {
  return getDailyRateInfo().count;
};
