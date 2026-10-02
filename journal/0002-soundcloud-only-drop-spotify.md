# ADR-0002: SoundCloud only, drop Spotify

**Date**: 2026-10-02
**Status**: accepted
**Deciders**: Daria, Claude

## Context

Audio reactivity needs real audio data. Since 2024-11-27, new Spotify apps get 403 on audio-features, audio-analysis, recommendations and 30-second previews, and raw audio is not exposed. SoundCloud offers a stream endpoint (`GET /tracks/{id}/stream`) via OAuth 2.1 with PKCE, with tokens lasting about an hour and single-use refresh tokens.

## Decision

v1 builds SoundCloud backend endpoints only: auth start and callback, token refresh, playlists, likes, now-playing and stream access. There is no frontend for it in v1. Spotify is dropped.

## Alternatives Considered

### Alternative 1: Spotify as well

- **Pros**: large catalogue.
- **Cons**: no audio analysis or raw audio for new apps, so it cannot drive the visuals.
- **Why not**: it could only supply metadata and playback state.

### Alternative 2: Both services

- **Pros**: more choice for users.
- **Cons**: doubles the auth and endpoint work for little gain.
- **Why not**: Spotify adds no usable audio signal.

## Consequences

### Positive

- One integration to build and maintain.
- A real audio stream is available for Web Audio analysis.

### Negative

- SoundCloud app registration requires an Artist Pro account.
- Users must have SoundCloud content.

### Risks

- Browser analysis of the stream may be blocked by CORS or the track's streamable flag. Mitigation: verify early, and proxy the stream through the BFF if needed.
