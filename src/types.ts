
import type { LatLng } from 'leaflet';
import type { FeatureCollection } from 'geojson';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string; // Emoji
  isVisible: boolean;
  generateIsochrones: boolean; // New property
}

export interface Point {
  id: string;
  categoryId: string;
  lat: number;
  lng: number;
  isVisible: boolean;
  name?: string; // Optional name for the point
}

export interface IsochroneFetchResult {
  geojson?: FeatureCollection;
  error?: string;
}

// Data stored in localStorage for API rate limiting
export interface DailyRateLimitInfo {
  count: number;
  lastReset: string; // YYYY-MM-DD
}

export interface IsochroneCacheData {
  [key: string]: FeatureCollection;
}