# ADR-0006: In-memory grid cache for Open-Meteo

**Date**: 2026-10-05
**Status**: accepted
**Deciders**: Daria, Claude

## Context

Every `GET /api/ocean` called Open-Meteo, so N viewers meant N upstream calls. Open-Meteo updates about every 15 minutes, marine values are often null near coasts, and the BFF must never show an error screen (see "Failure behaviour" in CLAUDE.md).

## Decision

`server/ocean/cache.ts` keeps a plain in-memory `Map` keyed by a 0.1 degree grid cell (`CACHE` in `server/constants.ts`). Entries live 15 minutes. Raw values are stored per cell and merged so a null keeps the last good value. A failed refetch serves the stale entry. Concurrent requests for one cell share one upstream promise. The map is capped at 500 cells, evicting the oldest. A separate Hono middleware (`server/middleware/cacheControl.ts`) adds `Cache-Control: public, max-age=300` to 200 responses only.

## Alternatives Considered

### Alternative 1: Cache as Hono middleware

- **Pros**: fits the framework's idiom.
- **Cons**: harder to unit test; the cache needs keys, merging and eviction, not just header work.
- **Why not**: kept as a plain function; middleware is used only for the cross-cutting header.

### Alternative 2: Redis or other external store

- **Pros**: survives restarts, shared across instances.
- **Cons**: new infrastructure for a small app; the data is cheap to refetch.
- **Why not**: same reasoning as ADR-0003 (no database). Revisit if the server runs on several instances.

## Consequences

### Positive

- Upstream load is bounded by the number of cells, not viewers.
- Nulls and outages are absorbed server-side; the client never sees them.

### Negative

- Worst-case staleness is about 20 minutes (5 min browser max-age on top of the 15 min TTL).
- The cache is lost on server restart.

### Risks

- While Open-Meteo is down, every request for a stale cell retries upstream (deduped to one call at a time per cell). Add a short retry backoff if this becomes a problem.
