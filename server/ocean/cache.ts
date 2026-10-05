import { CACHE, OPEN_METEO } from '../constants.js';
import type { Coords } from './coords.js';
import { fetchMarineCurrent } from './openMeteo.js';
import type { MarineCurrentResponse } from './types.js';

type Entry = { raw: MarineCurrentResponse; fetchedAt: number };

// Plain in-memory Map, one entry per grid cell. A Map iterates in insertion
// order, which is what makes "evict the oldest" cheap below.
const entries = new Map<string, Entry>();

// Upstream calls currently running, per cell. Concurrent requests for the same
// cell await the same promise instead of each calling Open-Meteo.
const inFlight = new Map<string, Promise<MarineCurrentResponse>>();

const snap = (n: number) => (Math.round(n / CACHE.gridStepDeg) * CACHE.gridStepDeg).toFixed(CACHE.gridDecimals);

function toCell({ lat, lon }: Coords): { key: string; cell: Coords } {
  const latSnapped = snap(lat);
  const lonSnapped = snap(lon);
  return {
    key: `${latSnapped},${lonSnapped}`,
    cell: { lat: Number(latSnapped), lon: Number(lonSnapped) },
  };
}

// Hold last good values: a variable that came back null keeps its earlier value.
function mergeLastGood(previous: MarineCurrentResponse | undefined, fresh: MarineCurrentResponse): MarineCurrentResponse {
  if (!previous) return fresh;
  const current = { ...fresh.current };
  for (const variable of OPEN_METEO.variables) {
    current[variable] = fresh.current[variable] ?? previous.current[variable];
  }
  return { ...fresh, current };
}

function store(key: string, entry: Entry) {
  entries.delete(key); // re-insert so a refreshed cell counts as newest
  entries.set(key, entry);
  if (entries.size > CACHE.maxEntries) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
}

async function refresh(key: string, cell: Coords, previous: Entry | undefined): Promise<MarineCurrentResponse> {
  const fresh = await fetchMarineCurrent(cell);
  const raw = mergeLastGood(previous?.raw, fresh);
  store(key, { raw, fetchedAt: Date.now() });
  return raw;
}

// Fresh entry -> from memory. Stale or missing -> one shared upstream call.
// If that fails and we have an old entry, serve it; otherwise rethrow.
export async function getMarineCurrent(coords: Coords): Promise<MarineCurrentResponse> {
  const { key, cell } = toCell(coords);
  const cached = entries.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE.ttlMs) return cached.raw;

  let pending = inFlight.get(key);
  if (!pending) {
    pending = refresh(key, cell, cached).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }

  try {
    return await pending;
  } catch (err) {
    if (!cached) throw err;
    console.error('refresh failed, serving stale entry:', err);
    return cached.raw;
  }
}
