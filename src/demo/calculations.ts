import { WAVE, type RESTING } from './constants';

export type DemoParams = typeof RESTING;

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
