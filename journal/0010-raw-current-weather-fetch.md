# ADR-0010: Add a raw current-weather fetch; defer visual integration

**Date**: 2026-10-06
**Status**: accepted
**Deciders**: Daria, Codex

## Context

Daria wants to explore atmospheric weather as another possible input to Ocean Mood. The artistic use and normalization ranges are undecided. The existing marine-to-visual contract should continue serving the scene independently.

## Decision

Keep `fetchWeatherDetail(coords)` as a standalone server-side fetch of raw current conditions from Open-Meteo's weather endpoint, requesting `temperature_2m`, `precipitation`, `is_day`, `wind_speed_10m`, `cloud_cover` and `snowfall`. Share the existing HTTP timeout and error handling with the marine fetch, and define a separate weather response type. Defer calling the function from a route, weather caching/fallbacks, normalization, mapping and frontend consumption until the visual purpose is chosen.

## Alternatives Considered

### Integrate weather into the ocean response now

- **Pros**: Makes weather immediately available to the scene.
- **Cons**: Requires premature decisions about visual parameters, failure handling and caching.
- **Why not**: Daria explicitly wants to explore the artistic use before defining that contract.

## Consequences

### Positive

- A small typed fetch is available for later experiments without coupling weather availability to the marine scene.
- Marine mapping and rendering remain unchanged.

### Negative

- The weather function has no production caller yet; adding it does not cause an extra request when opening the artwork.
- Type assertions describe the expected response but do not validate upstream JSON at runtime.

### Risks

- Raw values can be null; future integration must decide fallback and normalization behavior.
- Weather grid selection is still the API default. Choose land/sea/nearest deliberately before integrating ocean weather.
- Current precipitation reflects the response's `current.interval`; use returned units and interval when designing normalization.

Reference: [Open-Meteo weather API documentation](https://open-meteo.com/en/docs).
