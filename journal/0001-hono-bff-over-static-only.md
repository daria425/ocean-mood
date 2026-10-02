# ADR-0001: Hono BFF instead of a static-only app

**Date**: 2026-10-02
**Status**: accepted
**Deciders**: Daria, Claude

## Context

The app began as a static site because Open-Meteo allows CORS. SoundCloud integration needs OAuth with a client secret and per-user tokens, which cannot live in the browser. A server also lets us cache Open-Meteo responses so many viewers do not each hit the upstream API.

## Decision

We use a Hono and TypeScript backend-for-frontend in `server/` in the same repo. The client talks only to the BFF, never directly to Open-Meteo or SoundCloud. The client stays vanilla TypeScript and three.js.

## Alternatives Considered

### Alternative 1: Static-only app

- **Pros**: no server to host, simplest deploy.
- **Cons**: cannot hold the SoundCloud client secret or tokens, no upstream caching.
- **Why not**: SoundCloud OAuth requires a server.

### Alternative 2: FastAPI (Python)

- **Pros**: already familiar, Python audio libraries available.
- **Cons**: two languages, duplicated types for the 8 ocean values, two toolchains.
- **Why not**: not rejected on performance; shared TypeScript types and a single toolchain were preferred. Server-side audio analysis is not planned.

### Alternative 3: Next.js

- **Pros**: API routes and easy Vercel deploy.
- **Cons**: heavier than needed for a single-canvas art piece.
- **Why not**: the UI is one canvas and one label, so a full framework adds weight without benefit.

## Consequences

### Positive

- Secrets and tokens stay server-side.
- Shared types between client and server.
- Upstream calls can be cached.
- Node-portable, so hosting can change later.

### Negative

- A server to host and operate.
- Hono is new to the team, so it is built step by step with explanations.

### Risks

- React may become attractive if the v2 audio-selection UI grows. Mitigation: revisit then; the BFF is independent of the client framework.
