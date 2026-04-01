export interface GeocodeResult {
  city: string;
  latitude: number;
  longitude: number;
}

/**
 * Converts a city name or address string to lat/lng coordinates.
 * Uses OpenStreetMap Nominatim — free, no API key required.
 *
 * ⚠️ Nominatim rate limit: 1 req/sec. Call only on form submit, never on keypress.
 */
export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PawTaker/1.0 (pawtaker.dev@gmail.com)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || data.length === 0) return null;

    const first = data[0];
    return {
      city: query.trim(),
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
    };
  } catch (error) {
    console.error('[geocodeCity] Error:', error);
    return null;
  }
}
