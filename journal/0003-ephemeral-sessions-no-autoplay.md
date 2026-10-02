# ADR-0003: Ephemeral in-memory sessions, no autoplay

**Date**: 2026-10-02
**Status**: accepted
**Deciders**: Daria, Claude

## Context

The intended experience is peaceful: opening the URL should show only the sea. The only user state is the SoundCloud connection and the current track. Re-adding a track after closing the window is a quick step and acceptable.

## Decision

SoundCloud tokens live in a server-side in-memory `Map` keyed by a session-cookie ID. The cookie is an httpOnly session cookie that expires when the browser closes. There is no database. Audio never plays unless the viewer asks for it.

## Alternatives Considered

### Alternative 1: Encrypted cookie session

- **Pros**: stateless server.
- **Cons**: single-use refresh tokens make concurrent refreshes tricky.
- **Why not**: more complexity than the use case needs.

### Alternative 2: Persistent store (SQLite or Redis)

- **Pros**: sessions survive restarts.
- **Cons**: another component to run, and it persists connections the user may not want kept.
- **Why not**: overkill, and it works against the ephemeral, peaceful default.

## Consequences

### Positive

- No database and nothing persisted beyond the visit.
- Simple to implement and reason about.

### Negative

- A server restart or closing the window means reconnecting.
- In-memory state does not scale across multiple server instances.

### Risks

- Multi-instance hosting would break sessions. Mitigation: pick hosting accordingly, or move to a shared store later.
