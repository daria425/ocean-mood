import { WAVE, SCENE, type RESTING } from './constants';
import { WATER, FRAMING } from './waterSettings';

export type DemoParams = typeof RESTING;

// Aim above the horizon so it falls near the bottom of the viewport.
// Vertical FOV is independent of aspect ratio, so portrait keeps the same framing.
export function getFramedCameraTarget(): [number, number, number] {
  const [x, y] = SCENE.camera.target;
  const distance = Math.hypot(x - SCENE.camera.position[0], y - SCENE.camera.position[1]);
  const fraction = Math.min(0.45, Math.max(0.05, FRAMING.waterScreenFraction));
  const slope = (1 - 2 * fraction) * Math.tan(SCENE.camera.fov * Math.PI / 360);
  return [x, y, FRAMING.cameraHeight + distance * slope];
}

// Convert normalized demo inputs into the existing drawing ranges.
export function getWaveSettings(params: DemoParams) {
  return {
    amplitude: WAVE.amplitudeBase + params.amplitude * WAVE.amplitudeScale,
    frequency: WAVE.frequencyBase + (1 - params.wavelength) * WAVE.frequencyScale,
    speed: WAVE.speedBase + params.speed * WAVE.speedScale,
  };
}

// Accumulating phase keeps motion continuous instead of using speed * time.
export function advancePhase(phase: number, deltaSeconds: number, speed: number) {
  return phase + deltaSeconds * speed;
}

export function getWaterSettings(params: DemoParams) {
  const wave = getWaveSettings(params);
  return {
    amplitude: wave.amplitude * WATER.swellHeight,
    frequency: wave.frequency / Math.max(WATER.swellLength, 0.01),
    speed: wave.speed * WATER.motionSpeed,
  };
}
