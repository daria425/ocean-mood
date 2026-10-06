import type { OPEN_METEO } from "../constants.js";
import type { ParamName } from "../mapping.js";

export type OceanVariable = (typeof OPEN_METEO.current_variables)[number];

// Shape of Open-Meteo's marine response for our `current=` request.
// Any value can be null (e.g. on land or near coasts).
// Example:
//{"location":{"lat":35.042,"lon":-40.042},
// "time":"2026-10-05T08:45",
// "params":{"mesh_amplitude":0.187,
//           "mesh_direction":{"x":0.326,"y":0.946},
//           "mesh_wavelength":0.469,
//           "mesh_wave_speed":0.469,
//           "bubble_altitude":0.535,
//           "horizon_level":0.535,
//           "color_palette":0.844,
//           "ribbon_speed":0.12,
//           "ribbon_length":0.12,
//           "ribbon_density":0.12,
//           "particle_drift_speed":0.12,
//           "ribbon_direction":{"x":0.829,"y":-0.559},
//           "particle_drift_direction":{"x":0.829,"y":-0.559}
// }
//}
export type MarineCurrentResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: { time: string; interval: string } & Record<
    OceanVariable,
    string
  >;
  current: { time: string; interval: number } & Record<
    OceanVariable,
    number | null
  >;
};

export type WeatherDetailResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: { time: string; interval: string } & Record<
    OceanVariable,
    string
  >;
  current: { time: string; interval: number } & Record<
    OceanVariable,
    number | null
  >;
};

// How one raw variable is turned into a client-ready value.
export type VariableSpec =
  | { kind: "scalar"; min: number; max: number; invert?: boolean }
  | { kind: "direction" };

// A direction as a unit vector (avoids the 359deg -> 1deg wrap when easing).
export type Vector = { x: number; y: number };
export type ParamValue = number | Vector;

// What GET /api/ocean returns to the client.
export type OceanResponse = {
  location: { lat: number; lon: number };
  time: string;
  params: Record<ParamName, ParamValue>;
};
