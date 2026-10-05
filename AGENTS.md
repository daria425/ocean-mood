# Ocean Mood

A web app that turns live marine data into **generative digital art**. It is **NOT a weather dashboard**: no charts, gauges, numeric readouts or data panels. Ocean values are parameters for an artwork, nothing more.

Visual reference: `inspo/ui-1.png`. It shows a dark, luminous, iridescent sea with:

- translucent wireframe wave meshes
- long rainbow flow ribbons
- glass bubbles and wire spheres
- sparkling particle swirls

## How we work (IMPORTANT)

The user stays in the loop. No autonomous "software factory" mode.

1. For any non-trivial task, propose a short plan first and wait for approval.
2. Implement **one small slice at a time**.
3. After each slice, run the dev server and show the result (screenshot or description) and **stop**. Wait for the user's OK before the next slice.
4. Do not commit, install dependencies, or change the mapping or look without asking.
5. Visual decisions belong to the user. Offer options, don't silently pick.

Use architecture-doc skill when logging a decision and check this file for any changes needed to keep it up to date with project state

In a fresh session, check for contents of the journal/ dir first (ADRs, indexed in journal/README.md) to see latest state and decisions made

General code style:

- Functions should follow SRP where possible
- Use constants.json or .js file for single values, grouped by theme if necessary so that they can be easily switched when possible

## Stack

- **Client:** Vite + vanilla TypeScript + three.js (WebGL2), **shader-first** (ADR-0008): motion is computed on the GPU in small custom shaders; the CPU only eases params and updates uniforms. No React / R3F / Next.js for now: the UI is one canvas, one label and later a mic opt-in control. Revisit only if the UI grows into real app UI.
- **Server (BFF):** Hono + TypeScript in `server/` in the same repo. Vite dev proxies `/api` to it. The user has not used Hono before, so build it **step by step** (start with a hello-world route) and **explain each Hono concept and the reason for each decision as it is introduced**.
- Why Hono over FastAPI: one language and shared types across client and server (e.g. the shape of the 7 ocean values), one toolchain, and portability (Node now, serverless or Workers later). FastAPI was a valid alternative, not rejected on performance.
- Custom shaders (GLSL) are the default way to animate each layer; bloom via a lightweight post-processing pass, off on low tiers. Integrate speeds into a phase on the CPU (never send speed \* time) so data changes never jump the scene. GLSL is new to the user: build one layer at a time and explain each shader as it is introduced.
- The client talks **only to the BFF**, never directly to Open-Meteo.
- Target: **desktop and mobile equally**. Use adaptive quality tiers (particle counts, mesh resolution, pixel ratio, bloom on/off) and handle touch.

## Backend (BFF)

Purpose: cache upstream calls, own the mapping, and give the client one stable API.

- **Open-Meteo proxy:** the BFF fetches marine data, applies the mapping and caches it so many viewers do not each hit the upstream API. The client calls e.g. `GET /api/ocean?lat=&lon=` and receives `{ location, time, params }`: ready-to-use visual params (0..1 scalars, directions as unit vectors), never raw ocean values.
- **No autoplay, ever.** Opening the URL shows only the sea. Audio is strictly opt-in (the mic is never requested until the viewer asks): the experience should be peaceful by default.
- **Cache:** `server/ocean/cache.ts` (ADR-0006): in-memory `Map` per 0.1° grid cell, 15 min TTL, last-good-value merge on raw data, stale-on-failure, in-flight dedupe, 500-cell cap. Tunables live in `CACHE` in `server/constants.ts`. `server/middleware/cacheControl.ts` adds `Cache-Control: max-age` (5 min) to 200 responses.

## Data source

Open-Meteo Marine API: https://open-meteo.com/en/docs/marine-weather-api

The original snippet used the Python SDK (`current.Variables(0).Value()`). The BFF calls the REST/JSON endpoint with `current=` and the same 7 variables (`wave_peak_period` was dropped: Open-Meteo returns null for it in `current`) (the browser never calls Open-Meteo itself):

| Variable (API name)       | Meaning                           |
| ------------------------- | --------------------------------- |
| `wave_height`             | Wave height                       |
| `wave_direction`          | Wave direction                    |
| `wave_period`             | Wave period                       |
| `sea_level_height_msl`    | Sea level height (mean sea level) |
| `sea_surface_temperature` | Sea surface temperature           |
| `ocean_current_velocity`  | Ocean current velocity            |
| `ocean_current_direction` | Ocean current direction           |

Verify exact parameter names against the docs when writing the fetch.

### Data decisions

- **Live "now" only.** No forecast or history in v1. Fetch current values, refresh periodically (~15 min; check the model's actual update cadence), and **ease smoothly** from old to new values. The scene must never jump.
- Keep the data layer shaped so hourly forecast scrubbing could be added later without a refactor, but do not build it now.
- **Location is a variable, not a constant.** v1 hardcodes one coordinate, but the renderer must only consume a `{lat, lon}` provided through an interface, and never know where it came from. User-chosen location input comes later (design TBD).
- **Failure behaviour:** on null values or fetch failure, **hold the last good values**. On a cold start with no data, use a calm "resting sea" default preset. Never show an error screen. Marine data is often null near coasts, so handle nulls per variable. The server substitutes nulls (resting sea now; last good value per grid cell once the cache exists), so the client never sees a null.

## Architecture principles

- Layers: BFF (`server/`: upstream fetch, **mapping and normalization**, cache, auth) -> client `data` (call BFF, ease between polls) -> `scene` (three.js). The client is deliberately dumb: it draws `params`. Only colour palettes are defined client-side, picked from the `color_palette` value (0 cold .. 1 warm).
- **Mapping is one declarative, swappable file: `server/mapping.ts`** (variable -> param names), with scaling ranges in `server/constants.ts` (`VARIABLE_SPECS`). Rewiring a variable to a different visual property must be a small edit. No mapping logic scattered through scene code. See ADR-0005.
- Raw values are normalized to 0..1 (clamped) on the server; compass directions become unit vectors so easing never wraps at 360.
- Scene modules are independent layers (waves, ribbons, orbs, particles) that each consume the shared parameter object.
- The scene exposes a single parameter object (including a slot for audio, see v2) so new input sources plug in without scene rewrites.

## v1 mapping (starting point, to be tuned by eye)

| Variable                  | Drives                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `wave_height`             | Wireframe mesh swell amplitude                                                                                      |
| `wave_period`             | Mesh wave speed and wavelength                                                                                      |
| `wave_direction`          | Direction the mesh swells travel                                                                                    |
| `sea_level_height_msl`    | Bubble and sphere altitude and bobbing, plus the horizon / water-plane level                                        |
| `sea_surface_temperature` | Colour palette: cold gives teal, blue and violet; warm gives amber, coral and green. Always iridescent and luminous |
| `ocean_current_velocity`  | Ribbon speed, length and density, plus particle drift speed                                                         |
| `ocean_current_direction` | Heading of the ribbons and particles                                                                                |

The mapping is **loosely literal**: each value drives one intuitive visual property so you can _feel_ the data, but it's art first. There is no legend.

## v1 scene elements

All four elements from the inspo are in scope:

1. Translucent wireframe wave mesh
2. Iridescent flow ribbons
3. Glass bubbles and wireframe spheres
4. Sparkle particle swirls

## UI / interaction (v1)

- Fullscreen canvas, otherwise minimal chrome.
- One small, unobtrusive label: **lat, lon + time**. It is unstyled for now and will be styled later, so keep the markup simple and easy to restyle.
- **Pan through the scene** with the mouse (touch drag on mobile). This is a camera pan/parallax through the scene, not a free orbit/zoom.
- No charts, numbers, units or dashboards.

Current status:
Small basic demo of API response processed into mesh added
What's still missing is everything else:

- Wave mesh: a proper version with barycentric glowing lines, layered swells and the glow along the ridges.
- Ribbons: the iridescent flow ribbons.
- Orbs: the glass orbs and wire spheres.
- Particles: the sparkle particles.
- Bloom and tiers: bloom, quality tiers and camera pan.

## v2 (planned, not now)

- **Microphone audio input, entirely in the browser** (ADR-0007). The viewer opts in; the browser listens to whatever is playing in the room (`getUserMedia` -> Web Audio `AnalyserNode`). No server involvement, nothing is uploaded or stored. Make the visualization audio-reactive: e.g. spectrum bands, amplitude driving object scales, beat detection driving pulses.
- Request the mic with `echoCancellation`, `noiseSuppression` and `autoGainControl` set to false (they degrade music analysis). Needs a secure context (HTTPS or localhost) and a user gesture to start the `AudioContext` (iOS). Never connect the analyser to the speakers (feedback).
- v1 does not build this, but leaves room: the scene parameter object should be able to accept an extra audio-derived channel (a few smoothed bands and a level) later.

## Open questions

- Which hardcoded coordinate for v1? Pick an open-ocean point that reliably returns non-null marine data, and **confirm with the user**.
- Exact refresh interval and easing duration.
- How user location input will eventually work (search box, globe click, geolocation).
- Colour palette details and fonts for the label.
- Hosting for the Hono server (not yet decided; stack is Node-portable).

## Commands

- `npm run dev:server`: Hono server on http://localhost:8787 (tsx watch)
- `npm test`: vitest (`test/`); `npm run test:watch` to watch
- Client commands (`dev`, `build`, `preview`) to be added when Vite is scaffolded.
