// RIBBON PLAYGROUND — save to reload. These shape the art; the BFF still owns
// the current -> speed/length/direction mapping. Start with one layer below.
export const RIBBON = {
  visible: true,
  length: 26, // World-space length at minimum current; higher reaches farther.
  lengthRange: 12, // Extra length added by normalized ribbon_length (0..1).
  width: 0.55, // Full strip/halo width; try 0.2–1.2 for thread -> silk.
  lift: 1.2, // Height of the broad flowing bends; try 0.3–2.5.
  bends: 1.1, // Number of broad bends along the strip.
  slope: -0.12, // Vertical tilt along its length; negative falls toward its end.
  depthSway: 0.65, // Sideways weaving in the horizontal ocean plane.
  twist: 0.6, // How much the strip rolls between vertical and horizontal.
  speedBase: 0.12, // Gentle resting motion, in phase radians/second.
  speedRange: 0.65, // Extra motion from normalized ribbon_speed.
  motionSpeed: 0.6, // Overall artistic speed multiplier; 0 freezes the ribbon.
  brightness: 1.4, // Light intensity; try 0.5–2.
  opacity: 0.65, // Overall translucency; try 0.2–0.8.
  coreWidth: 0.12, // Fraction of half-width occupied by the bright thread.
  glowStrength: 0.28, // Soft coloured light around the core; 0 removes halo.
  colorCycles: 1.1, // Rainbow repeats along the length.
  coldHue: 0.48, // Palette phase for cold water; shift 0..1 to explore colours.
  warmHue: 0.05, // Palette phase for warm water (same palette input as sheets).
  shimmer: 0.18, // Strength of soft travelling highlights; 0 = even light.
  segments: 192, // Geometry detail along the curve, created once at startup.
  // x/y place the ribbon over the ocean; z is altitude. scale changes its size.
  // phase offsets its bends; hue offsets its rainbow. Add entries to experiment.
  layers: [{ x: 0, y: 5, z: 4.2, scale: 1, phase: 0, hue: 0 }],
};
