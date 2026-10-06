// WATER PLAYGROUND — edit a value, save, and Vite reloads the preview.
// These are artistic multipliers, not changes to the server's data mapping.
//  Parameter             What it changes
// ━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  swellHeight           Higher = taller waves
// ────────────────────  ────────────────────────────────────────────
//  swellLength           Higher = broader waves
// ────────────────────  ────────────────────────────────────────────
//  motionSpeed           Animation speed; 0 freezes it
// ────────────────────  ────────────────────────────────────────────
//  rippleStrength        0 = smoothest; higher adds surface texture
// ────────────────────  ────────────────────────────────────────────
//  reflectionStrength    Highlight brightness
// ────────────────────  ────────────────────────────────────────────
//  reflectionSoftness    Lower = sharper highlights
// ────────────────────  ────────────────────────────────────────────
//  iridescence           Strength of rainbow colour shifts

// COMPOSITION — fraction is measured from the bottom of any viewport.
export const FRAMING = {
  waterScreenFraction: 1 / 6, // Try 0.1–0.35: higher = more water on screen.
  cameraHeight: 1.2, // Height above water; try 0.8–2.5.
};

// wireframe: true exposes the underlying geometry.
export const WATER = {
  // Shape / motion
  swellHeight: 0.85, // Try 0.3–1.8: lower = flatter, higher = deeper swells.
  swellLength: 1.8, // Try 0.7–3: higher = broader, more widely spaced waves.
  motionSpeed: 0.35, // Try 0–1: 0 freezes motion; higher = faster.
  crossSwell: 0.22, // Try 0–0.5: secondary waves crossing the main swell.
  rippleStrength: 0.008, // Try 0–0.15: 0 = polished glass, higher = textured water.
  rippleScale: 5, // Try 2–10: higher = smaller ripples.

  // Surface / colour
  reflectionStrength: 1.1, // Try 0–1.5: brightness of the soft reflected bands.
  reflectionSoftness: 0.16, // Try 0.1–0.7: lower = sharper, higher = softer bands.
  iridescence: 0.18, // Try 0–0.6: colour shift across the curved surface.
  surfaceBrightness: 0.35, // Try 0.2–1.2: base water brightness.
  distanceFade: 0.055, // Try 0.01–0.08: higher = fades into darkness sooner.
  coldColor: "#101049",
  warmColor: "#97bccb",
  backgroundColor: "#02080c",

  // Comparison / quality
  wireframe: false, // true shows the SAME water geometry as lines.
  size: 100,
  segments: 240,
};

// FLOATING SHEETS — shared settings apply to all three.
export const SHEET = {
  visible: true, // false lets you compare with water alone.
  width: 16, // Try 5–16.
  depth: 5, // Try 3–10.
  altitude: 4, // Try 1–4; too low may intersect the water.
  offsetX: 0, // Move left/right.
  offsetY: -5, // Higher = farther from the camera.
  waveHeight: 1, // Relative to water swells; try 0.3–1.5.
  brightness: 0.65, // Try 0.2–1.5.
  opacity: 0.22, // Try 0.1–0.4: lower keeps overlapping lines softer.
  lineWidth: 1.0, // Full core width in drawing-buffer pixels; try 0.4–1.2.
  lineSoftness: 1.0, // Antialiased edge transition in pixels; higher = softer.
  glowWidth: 2.2, // Halo reach in pixels; try 1–4 (local shader glow, not bloom).
  glowStrength: 0.2, // Halo opacity relative to the core; 0 removes the halo.
  crestBrightness: 0.55, // Extra light on high swells; 0 gives uniform threads.
  coldColor: "#1ae6ff",
  warmColor: "#ff8c66",
  segmentsX: 48,
  segmentsY: 24,
  // Offsets ADD to the shared position above. Scale multiplies width/depth.
  // Higher y = farther away; higher z = higher above the water.
  layers: [
    { x: -3, y: 2, z: -3, scale: 1 },
    { x: 4, y: 7, z: -2, scale: 1 },
    { x: -0.5, y: 12, z: -2.5, scale: 1.2 },
  ],
};
