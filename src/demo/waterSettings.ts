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
