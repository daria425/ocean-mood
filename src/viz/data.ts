// Calm fallback so the sea shows even if the server is not running.
import { DEMO_LOCATION, RESTING } from './constants';

export async function loadParams(): Promise<typeof RESTING> {
  try {
    const res = await fetch(`/api/ocean?lat=${DEMO_LOCATION.lat}&lon=${DEMO_LOCATION.lon}`);
    if (!res.ok) return RESTING;
    const { params: p } = await res.json();
    return {
      amplitude: p.mesh_amplitude,
      wavelength: p.mesh_wavelength,
      speed: p.mesh_wave_speed,
      dirX: p.mesh_direction.x,
      dirY: p.mesh_direction.y,
      palette: p.color_palette,
    };
  } catch {
    return RESTING;
  }
}

