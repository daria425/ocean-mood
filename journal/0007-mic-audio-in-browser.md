# ADR-0007: Audio input from the microphone, in the browser

**Date**: 2026-10-05
**Status**: accepted
**Deciders**: Daria, Claude

## Context

ADR-0002 planned SoundCloud OAuth endpoints so the visuals could react to a streamed track. That needs an Artist Pro account to register an app, a server-side token store (ADR-0003), and a connect/playlist UI. The actual goal is simpler: play a tune anywhere and have the scene react to it.

## Decision

Drop SoundCloud (and Spotify) entirely. Audio reactivity will come from the microphone: `getUserMedia` -> `MediaStreamAudioSourceNode` -> `AnalyserNode`, all in the frontend. The BFF has no part in it, and no audio leaves the device. The mic is requested only after an explicit user action (no autoplay rule carries over from ADR-0003). Nothing is built in v1; the scene params keep a slot for an audio channel.

## Alternatives Considered

### Alternative 1: SoundCloud stream analysis

- **Pros**: clean digital signal, in-app track picking.
- **Cons**: Artist Pro for registration, OAuth and token storage, CORS/stream-analysis uncertainty, playlist UI.
- **Why not**: heavy machinery for a feature the mic gives for free.

### Alternative 2: Tab/system audio capture (`getDisplayMedia`)

- **Pros**: clean signal without room noise.
- **Cons**: Chromium desktop only; conflicts with the mobile-equal goal.
- **Why not**: can be added later as a bonus input on top of the same `AnalyserNode`.

### Alternative 3: Audio file drop

- **Pros**: clean signal, trivial.
- **Cons**: user must have the file.
- **Why not**: not rejected; may be added later as another source feeding the same analyser.

## Consequences

### Positive

- No backend, accounts, tokens, sessions or secrets for audio.
- Works on mobile and desktop wherever the browser allows mic access.
- Any source (Spotify, vinyl, live instruments) works.

### Negative

- Room noise and speaker quality affect the signal.
- Needs a secure context (HTTPS or localhost) and a user gesture to start the `AudioContext` (iOS).

### Risks

- Browser echo cancellation, noise suppression and auto gain muddy music analysis. Mitigation: request the mic with all three set to false.
- Mic permission prompt can scare viewers. Mitigation: explicit opt-in control, no prompt on load, and no audio ever uploaded.
