import { Coordinates } from '../types/attendance';

export interface NominatimAddress {
  amenity?: string;
  building?: string;
  office?: string;
  shop?: string;
  leisure?: string;
  tourism?: string;
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  residential?: string;
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimResponse {
  place_id?: number;
  licence?: string;
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  category?: string;
  type?: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}

/**
 * Cleanly formats a raw Nominatim response into a concise, human-readable place name.
 * Avoids raw coordinates, redundant municipal counties, or country suffixes.
 */
export function formatNominatimPlace(data: NominatimResponse | null | undefined): string | null {
  if (!data || typeof data !== 'object') return null;
  if (data.error) return null;

  const addr: NominatimAddress = data.address || {};

  // 1. Primary named POI / venue / facility / campus
  const primaryName =
    (data.name && typeof data.name === 'string' && data.name.trim()) ||
    (addr.amenity && typeof addr.amenity === 'string' && addr.amenity.trim()) ||
    (addr.building && typeof addr.building === 'string' && addr.building.trim()) ||
    (addr.office && typeof addr.office === 'string' && addr.office.trim()) ||
    (addr.shop && typeof addr.shop === 'string' && addr.shop.trim()) ||
    (addr.leisure && typeof addr.leisure === 'string' && addr.leisure.trim()) ||
    (addr.tourism && typeof addr.tourism === 'string' && addr.tourism.trim()) ||
    null;

  // 2. Street address
  const houseNumber = addr.house_number ? String(addr.house_number).trim() : '';
  const road = addr.road ? String(addr.road).trim() : '';
  const street = houseNumber && road ? `${houseNumber} ${road}` : road || houseNumber;

  // 3. Suburb / Neighbourhood
  const suburb =
    (addr.suburb && String(addr.suburb).trim()) ||
    (addr.neighbourhood && String(addr.neighbourhood).trim()) ||
    (addr.residential && String(addr.residential).trim()) ||
    (addr.city_district && String(addr.city_district).trim()) ||
    '';

  // 4. City / Town
  const city =
    (addr.city && String(addr.city).trim()) ||
    (addr.town && String(addr.town).trim()) ||
    (addr.municipality && String(addr.municipality).trim()) ||
    (addr.village && String(addr.village).trim()) ||
    '';

  // Assemble distinct components from specific to general
  const parts: string[] = [];
  if (primaryName) {
    parts.push(primaryName);
  }
  if (street && !parts.some((p) => p.toLowerCase() === street.toLowerCase())) {
    parts.push(street);
  }
  if (suburb && !parts.some((p) => p.toLowerCase() === suburb.toLowerCase())) {
    parts.push(suburb);
  }
  if (city && !parts.some((p) => p.toLowerCase() === city.toLowerCase())) {
    parts.push(city);
  }

  if (parts.length > 0) {
    return parts.join(', ');
  }

  // Fallback to top 2-3 segments of display_name
  if (typeof data.display_name === 'string' && data.display_name.trim()) {
    const segments = data.display_name
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length > 0) {
      return segments.slice(0, 3).join(', ');
    }
  }

  return null;
}

class ReverseGeocodingService {
  private cache: Map<string, string | null> = new Map();
  private lastRequestTimestamp: number = 0;
  private readonly minRequestIntervalMs: number = 1000; // Nominatim policy: max 1 req/sec
  private readonly timeoutMs: number = 6000; // 6-second timeout

  /**
   * Generates a stable cache key based on coordinate precision (~10m).
   */
  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(4)},${lon.toFixed(4)}`;
  }

  /**
   * Resolves detected GPS coordinates into a readable place name using OpenStreetMap Nominatim.
   * Never throws: handles network drops, timeouts, 429s, and empty responses safely.
   */
  async lookupPlaceName(coords: Coordinates): Promise<string | null> {
    const { latitude, longitude } = coords;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return null;
    }

    const cacheKey = this.getCacheKey(latitude, longitude);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    // Rate-limiting throttle for Nominatim usage compliance
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTimestamp = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // e.g. 429 Rate Limit or 503 Service Unavailable
        this.cache.set(cacheKey, null);
        return null;
      }

      const data: NominatimResponse = await response.json();
      const placeName = formatNominatimPlace(data);

      this.cache.set(cacheKey, placeName);
      return placeName;
    } catch {
      clearTimeout(timeoutId);
      // Network failure, timeout, or abort - do not throw
      this.cache.set(cacheKey, null);
      return null;
    }
  }

  /**
   * Clears in-memory cache (primarily for unit tests).
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const reverseGeocodingService = new ReverseGeocodingService();
