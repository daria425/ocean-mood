import type { OceanVariable, VariableSpec } from "./ocean/types.js";

export const SERVER = {
  port: 8787,
} as const;

// Decimal places kept in the params sent to the client (strips float noise).
export const OUTPUT_DECIMALS = 3;

export const OPEN_METEO = {
  current_url: "https://marine-api.open-meteo.com/v1/marine",
  weather_detail_url: "https://api.open-meteo.com/v1/forecast",
  timeoutMs: 8000,
  current_variables: [
    "wave_height",
    "wave_direction",
    "wave_period",
    "sea_level_height_msl",
    "sea_surface_temperature",
    "ocean_current_velocity",
    "ocean_current_direction",
  ],
  weather_detail_variables: [
    "temperature_2m",
    "precipitation",
    "is_day",
    "wind_speed_10m",
    "cloud_cover",
    "snowfall",
  ],
} as const;

export const CACHE = {
  // Requests are snapped to this grid so nearby viewers share one entry.
  gridStepDeg: 0.1,
  gridDecimals: 1, // decimals of gridStepDeg, used for the key and upstream coords
  ttlMs: 15 * 60 * 1000, // Open-Meteo updates about every 15 minutes
  maxEntries: 500, // caps memory; the oldest cell is evicted first
  browserMaxAgeSec: 5 * 60, // Cache-Control max-age for browsers/CDNs; below ttlMs so data stays fresh
} as const;

// How each raw variable is scaled to 0..1 (scalars) or turned into a unit
// vector (compass directions). min/max are clamped; `invert` flips the result.
export const VARIABLE_SPECS = {
  wave_height: { kind: "scalar", min: 0, max: 6 }, // m
  wave_direction: { kind: "direction" }, // compass degrees
  wave_period: { kind: "scalar", min: 3, max: 16 }, // s
  sea_level_height_msl: { kind: "scalar", min: -3, max: 3 }, // m
  sea_surface_temperature: { kind: "scalar", min: -2, max: 32 }, // °C, cold -> warm
  ocean_current_velocity: { kind: "scalar", min: 0, max: 5 }, // km/h
  ocean_current_direction: { kind: "direction" }, // compass degrees
} as const satisfies Record<OceanVariable, VariableSpec>;

// Raw values used when Open-Meteo returns null (land, coast) and we have no
// earlier good value yet: a calm "resting sea".
export const RESTING_SEA: Record<OceanVariable, number> = {
  wave_height: 1,
  wave_direction: 270,
  wave_period: 8,
  sea_level_height_msl: 0,
  sea_surface_temperature: 18,
  ocean_current_velocity: 1,
  ocean_current_direction: 90,
};
