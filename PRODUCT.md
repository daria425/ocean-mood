# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Explorers and data enthusiasts who want to feel and experience live ocean conditions as generative art rather than read them as numbers. Audiences include people discovering unexpected beauty in scientific data, as well as viewers using the piece for ambient visual experience or reflection.

## Product Purpose

Ocean Mood translates live marine sensor data (wave height, direction, temperature, currents) into a real-time, immersive 3D visualization. The purpose is art first—to transform raw data into emotion and movement—not to inform or dashboard. The scene breathes with the ocean; the viewer brings their own interpretation.

## Positioning

Ocean Mood is generative art driven by live data, not a weather dashboard or data-viz tool. The uniqueness: each scene is parameterized by real marine conditions (not random), yet the rendering is pure aesthetics—iridescent geometry, flowing ribbons, particles—with no charts, gauges, or numeric readouts. The viewer never sees raw numbers; they feel the data through color, motion, and form.

## Operating Context

- **View**: Fullscreen canvas, desktop and mobile equally
- **Interaction**: Pan through the scene with mouse drag (desktop) or touch drag (mobile); camera parallax through layered geometry
- **Refresh**: Live data polls (~15 min); transitions ease smoothly between states
- **Location**: v1 hardcoded to one open-ocean coordinate; user location input deferred to v2
- **Label**: Small, unobtrusive lat/lon/timestamp always visible; styled later
- **Audio**: v1 is visual-only and strictly opt-in (audio reactivity deferred to v2)

## Capabilities and Constraints

### Capabilities
- Real-time marine data fetch and visualization
- Smooth easing between data states (no jumps)
- Responsive rendering on desktop and mobile
- Pan/parallax camera interaction
- Four distinct visual layers: wireframe wave mesh, iridescent ribbons, glass orbs/spheres, particle swirls

### Constraints
- Data source: Open-Meteo Marine API (7 live variables, no forecast in v1)
- Location: Fixed coordinate for v1 (hardcoded); infrastructure ready for dynamic location later
- No dashboard, charts, or numeric UI
- Data null handling: on null or fetch failure, hold last good value or use "resting sea" default
- Mobile support: adaptive quality tiers (particle counts, mesh resolution, pixel ratio, bloom on/off)
- One canvas, one fullscreen label—minimal chrome by design
- Stack: Vite + vanilla TypeScript + three.js, shader-first (client, ADR-0008); Hono + TypeScript BFF (server)

### Technical Notes
- Data mapping is a guide, not law (CLAUDE.md starting point; tune by eye during implementation)
- BFF owns data fetching, caching (in-memory grid cache, 15 min TTL), and parameter normalization (0..1 scalars, compass directions as unit vectors)
- Client-side scene modules are independent (waves, ribbons, orbs, particles); each consumes a shared parameter object
- Custom GLSL shaders and postprocessing (bloom, etc.) are in scope

## Constraints and Trade-offs
- **Desktop vs. mobile**: Desktop fidelity prioritized; mobile scales gracefully downward (particle counts, mesh resolution, bloom on/off)
- **Real-time vs. cached**: 15-min refresh interval balances freshness with cache stability; easing duration TBD
- **Authoring complexity**: Artist-grade animation and material work required; no low-effort alternatives

## Evidence on Hand

- `inspo/ui-1.png`: Primary visual reference—dark luminous seascape with wireframe meshes, rainbow ribbons, glass bubbles, wire spheres, sparkle particles
- `inspo/tentacles.jpg`: Secondary reference for neon flow and ribbon motion
- `CLAUDE.md`: Full architecture, data source details, v1 mapping table, v2/v3 roadmap
- `server/constants.ts`, `server/mapping.ts`, `server/ocean/cache.ts`: Data pipeline and normalization infrastructure started

## Product Principles

1. **Art first, never a dashboard.** Marine data is a parameter for generative visuals, never the subject. No charts, numbers, or data-panel UI.
2. **Peaceful immersion by default.** The experience opens silently and calmly; audio (v2+) and interaction are strictly opt-in. No error screens; hold last-good-value on failure.
3. **Smooth, responsive presence.** Real-time data eases seamlessly between poll cycles; scene never jumps. Mobile is equal, not an afterthought.
4. **One clear visual language.** Four coordinated layers (mesh, ribbon, sphere, particle) move together; each variable drives one intuitive property. The viewer feels the data, not reads it.

## Visual Vision

Ocean Mood is a wall-mounted artwork: dark, luminous, iridescent. The scene is built from translucent geometries (wireframe meshes, glass spheres, flowing ribbons) that glow from within. It feels like looking into bioluminescent depths—ancient, alive, otherworldly. Colors shift from cool (teals, indigos, violets) when the ocean is calm to warm (ambers, corals, greens) during dynamic conditions. Movement is organic and hypnotic: waves swell and retreat, ribbons flow and curl, particles drift and sparkle. A viewer should forget they're looking at data and simply feel the presence of the sea.

## Accessibility & Inclusion

- **Platform**: Mobile and desktop equally (no platform exclusion)
- **Motion**: No autoplaying animation on page load; canvas is opt-in interaction
- **Cognitive load**: No text-heavy UI, menus, or data tables; the scene itself is the interface
- **Color**: Rainbow iridescence as primary property (not sole indicator); luminance and motion also carry meaning
