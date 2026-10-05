import type { OceanVariable } from "./ocean/types.js";

// Every visual parameter the client can receive. Typed so a typo in the map
// below is a compile error.
export const PARAM_NAMES = [
  "mesh_amplitude",
  "mesh_wavelength",
  "mesh_wave_speed",
  "mesh_direction",
  "bubble_altitude",
  "horizon_level",
  "color_palette", // 0 = cold .. 1 = warm; the client defines the actual palettes
  "ribbon_speed",
  "ribbon_length",
  "ribbon_density",
  "ribbon_direction",
  "particle_drift_speed",
  "particle_drift_direction",
] as const;

export type ParamName = (typeof PARAM_NAMES)[number];

// THE mapping: which ocean variable drives which visual parameters.
// Rewiring a variable is an edit to this object only.
export const VARIABLES_TO_PARAMS_MAP: Record<OceanVariable, readonly ParamName[]> = {
  wave_height: ["mesh_amplitude"],
  wave_period: ["mesh_wavelength", "mesh_wave_speed"],
  wave_direction: ["mesh_direction"],
  sea_level_height_msl: ["bubble_altitude", "horizon_level"],
  sea_surface_temperature: ["color_palette"],
  ocean_current_velocity: [
    "ribbon_speed",
    "ribbon_length",
    "ribbon_density",
    "particle_drift_speed",
  ],
  ocean_current_direction: ["ribbon_direction", "particle_drift_direction"],
};
