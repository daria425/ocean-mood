export const SERVER = {
  port: 8787,
} as const;

export const OPEN_METEO = {
  url: "https://marine-api.open-meteo.com/v1/marine",
  timeoutMs: 8000,
  variables: [
    "wave_height",
    "wave_direction",
    "wave_period",
    "sea_level_height_msl",
    "sea_surface_temperature",
    "ocean_current_velocity",
    "ocean_current_direction",
  ],
} as const;
