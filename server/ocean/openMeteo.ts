import { OPEN_METEO } from '../constants.js';
import type { Coords } from './coords.js';
import type { MarineCurrentResponse } from './types.js';

// Calls Open-Meteo and returns its JSON untouched. The cast is a promise to
// the compiler, not a runtime check. Throws on any failure;
// the route decides how to turn that into an HTTP response.
export async function fetchMarineCurrent({ lat, lon }: Coords): Promise<MarineCurrentResponse> {
  const url = new URL(OPEN_METEO.url);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', OPEN_METEO.variables.join(','));

  const res = await fetch(url, { signal: AbortSignal.timeout(OPEN_METEO.timeoutMs) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  return (await res.json()) as MarineCurrentResponse;
}
