# ADR-0004: Drop wave_peak_period

**Date**: 2026-10-02
**Status**: accepted
**Deciders**: Daria, Claude

## Context

Live checks of the Open-Meteo marine API (`current=`) at four open-ocean and coastal points all returned `null` for `wave_peak_period`, with unit `"undefined"`. The other seven variables returned values.

## Decision

The app uses 7 ocean variables. `wave_peak_period` is removed from the data layer and the mapping. The "second, slower swell layer" is no longer tied to a variable; it can be re-added, driven by another variable or derived, later.

## Alternatives Considered

### Alternative 1: Keep it and rely on null handling

- **Pros**: works automatically if Open-Meteo starts returning it.
- **Cons**: a permanently dead input in the mapping.
- **Why not**: nothing to feel or tune today.

### Alternative 2: Derive the swell layer from wave_period

- **Pros**: keeps the layered look.
- **Cons**: a mapping decision that belongs to the visual tuning phase.
- **Why not**: deferred to the user.

## Consequences

### Positive

- Every mapped input has real data.

### Negative

- One fewer visual driver for now.

### Risks

- None significant; easy to re-add.
