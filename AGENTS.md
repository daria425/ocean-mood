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

- **Client:** Vite + vanilla TypeScript + three.js. No React / R3F / Next.js for now: the UI is one canvas and one label. Revisit only if the v2 audio-selection UI (connect, playlist/likes picker) grows into real app UI.
- **Server (BFF):** Hono + TypeScript in `server/` in the same repo. Vite dev proxies `/api` to it. The user has not used Hono before, so build it **step by step** (start with a hello-world route) and **explain each Hono concept and the reason for each decision as it is introduced**.
- Why Hono over FastAPI: one language and shared types across client and server (e.g. the shape of the 7 ocean values), one toolchain, and portability (Node now, serverless or Workers later). FastAPI was a valid alternative, not rejected on performance.
- Custom shaders (GLSL) where useful; postprocessing (e.g. bloom) is allowed
- The client talks **only to the BFF**, never directly to Open-Meteo or SoundCloud.
- Target: **desktop and mobile equally**. Use adaptive quality tiers (particle counts, mesh resolution, pixel ratio, bloom on/off) and handle touch.

## Backend (BFF)

Purpose: keep secrets and tokens server-side, cache upstream calls, and give the client one stable API.

- **Open-Meteo proxy:** the BFF fetches marine data and caches it so many viewers do not each hit the upstream API. The client calls e.g. `GET /api/ocean?lat=&lon=` and receives the normalized set of 7 values.
- **SoundCloud (v1 backend only, no frontend). DEFERRED until a polished non-audio-reactive UI exists (no Artist Pro purchase yet):** user OAuth 2.1 with PKCE (needed because playlists and likes are supported from the start). Build the endpoints now (auth start/callback, token refresh, now-playing / playlist / likes / stream access). **No connect button or any UI in v1**; the UI is designed later together with audio reactivity. Client secret and tokens never reach the browser.
- **Spotify is dropped.** New apps get 403 on audio-features, audio-analysis and previews since 2024-11-27, and raw audio is not available, so it cannot drive the visuals.
- **Token storage:** ephemeral, in-memory `Map` on the server keyed by a session-cookie ID. The cookie is a session cookie (gone when the browser closes), httpOnly. No database. A server restart or closing the window means the user reconnects.
- **No autoplay, ever.** Opening the URL shows only the sea. Audio is strictly opt-in: the experience should be peaceful by default.
- Facts to verify against SoundCloud docs before building: stream endpoint is `GET /tracks/{id}/stream` with an OAuth token; tokens last about 1 hour and refresh tokens are single-use (concurrent refreshes need care); app registration requires an Artist Pro account; check CORS and whether Web Audio can analyse the stream (it may need to be proxied through the BFF).

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
- **Failure behaviour:** on null values or fetch failure, **hold the last good values**. On a cold start with no data, use a calm "resting sea" default preset. Never show an error screen. Marine data is often null near coasts, so handle nulls per variable.

## Architecture principles

- Layers: BFF (`server/`: upstream fetch, cache, auth) -> client `data` (call BFF, normalize, ease) -> `mapping` (values -> visual params) -> `scene` (three.js).
- **Mapping is one declarative, swappable file.** The user will tune and experiment with it, so rewiring a variable to a different visual property must be a small edit. No mapping logic scattered through scene code.
- Normalize raw values to 0..1 (with sensible ranges and clamping) before they reach the scene.
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

## v2 (planned, not now)

- A small **audio file drop input** accepting audio files, plus the **SoundCloud track selection UI** (connect, pick from playlists/likes or add a track) built on the v1 backend endpoints. Make the visualization audio-reactive via Web Audio `AnalyserNode`: e.g. waveform or spectrum rendering, object scales mapped to amplitude, beat detection driving pulses.
- v1 builds only the SoundCloud backend, not the UI or the reactivity, but leaves room: the scene parameter object should be able to accept an extra audio-derived channel later.

## v3 (idea, much later)

- Play a track in SoundCloud itself (another tab or app) and have the visualization react to it, instead of setting everything up inside the browser. The in-browser track selection UI from v2 is the in-between state.
- Feasibility is unverified. Capturing another tab's audio (e.g. `getDisplayMedia` tab audio) is Chromium-desktop only and conflicts with the mobile-equal goal, so this needs its own investigation.

## Open questions

- Which hardcoded coordinate for v1? Pick an open-ocean point that reliably returns non-null marine data, and **confirm with the user**.
- Exact refresh interval and easing duration.
- How user location input will eventually work (search box, globe click, geolocation).
- Colour palette details and fonts for the label.
- Hosting for the Hono server (not yet decided; stack is Node-portable).
- SoundCloud: can the stream be analysed in the browser, or must the BFF proxy it? Do we have an Artist Pro account for app registration?
## Commands

- `npm run dev:server`: Hono server on http://localhost:8787 (tsx watch)
- Client commands (`dev`, `build`, `preview`) to be added when Vite is scaffolded.
