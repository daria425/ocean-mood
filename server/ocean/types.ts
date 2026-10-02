import type { OPEN_METEO } from '../constants.js';

export type OceanVariable = (typeof OPEN_METEO.variables)[number];

// Shape of Open-Meteo's marine response for our `current=` request.
// Any value can be null (e.g. on land or near coasts).
export type MarineCurrentResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: { time: string; interval: string } & Record<OceanVariable, string>;
  current: { time: string; interval: number } & Record<OceanVariable, number | null>;
};
