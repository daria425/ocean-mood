# ADR-0005: Mapping and normalization on the server

**Date**: 2026-10-02
**Status**: accepted
**Deciders**: Daria, Claude

## Context

The first plan put the `mapping` layer (ocean values -> visual params) in the client. Now that the BFF exists, the user wants the frontend as dumb as possible.

## Decision

The server owns mapping and normalization. `GET /api/ocean` returns `{ location, time, params }` where each param is a 0..1 scalar or, for compass directions, a unit vector `{x, y}`. The map lives in `server/mapping.ts`; ranges live in `server/constants.ts`. Nulls are replaced server-side (resting sea for now). The client still eases between polls and defines colour palettes, reading `color_palette` (0 cold .. 1 warm).

## Alternatives Considered

### Alternative 1: Mapping in the client

- **Pros**: tuning needs no server round trip or redeploy.
- **Cons**: logic split across two places; raw values leak to the scene layer.
- **Why not**: the user prefers a dumb client with one source of truth.

## Consequences

### Positive

- One place to retune the look's inputs; the client gets stable, named params.
- Direction vectors avoid the 359 -> 1 degree wrap when easing.

### Negative

- Tuning by eye needs the server running (hot reload keeps this quick).

### Risks

- Direction convention (wave "from" vs current "to") is unverified; check Open-Meteo docs when tuning.
