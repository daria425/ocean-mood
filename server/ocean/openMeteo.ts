import { OPEN_METEO } from "../constants.js";
import type { Coords } from "./coords.js";
import type { MarineCurrentResponse, WeatherDetailResponse } from "./types.js";

// Calls Open-Meteo and returns its JSON untouched. The cast is a promise to
// the compiler, not a runtime check. Throws on any failure;
// the route decides how to turn that into an HTTP response.

async function fetchOpenMeteo<T>(url: URL): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(OPEN_METEO.timeoutMs),
  });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  return (await res.json()) as T;
}
export async function fetchMarineCurrent({
  lat,
  lon,
}: Coords): Promise<MarineCurrentResponse> {
  const url = new URL(OPEN_METEO.current_url);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", OPEN_METEO.current_variables.join(","));

  return fetchOpenMeteo<MarineCurrentResponse>(url);
}

// Raw current weather only; route, cache and visual normalization are deferred.
export async function fetchWeatherDetail({
  lat,
  lon,
}: Coords): Promise<WeatherDetailResponse> {
  const url = new URL(OPEN_METEO.weather_detail_url);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    OPEN_METEO.weather_detail_variables.join(","),
  );
  return fetchOpenMeteo<WeatherDetailResponse>(url);
}
