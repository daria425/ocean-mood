export type Coords = { lat: number; lon: number };

// Turns the raw query strings into numbers, or returns null if they are not
// valid coordinates. Pure function: no Hono in here, so it is easy to test.
export function parseCoords(latRaw: string | undefined, lonRaw: string | undefined): Coords | null {
  if (!latRaw || !lonRaw) return null;
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}
