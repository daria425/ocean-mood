// Existing demo settings, grouped here without changing their values.
export const DEMO_LOCATION = { lat: 35, lon: -40 };

export const RESTING = {
  amplitude: 0.2, wavelength: 0.5, speed: 0.4,
  dirX: 0.8, dirY: 0.6, palette: 0.3,
};

export const WAVE = {
  amplitudeBase: 0.15, amplitudeScale: 1.6,
  frequencyBase: 0.5, frequencyScale: 1.5,
  speedBase: 0.4, speedScale: 2,
};

export const SCENE = {
  maxPixelRatio: 2,
  camera: { fov: 55, near: 0.1, far: 100, position: [0, -9, 5], target: [0, 0, 0] },
  mesh: { width: 30, height: 30, segments: 90 },
} as const;
