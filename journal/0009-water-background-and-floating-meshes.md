# ADR-0009: Continuous water background with floating mesh sheets

**Date**: 2026-10-05
**Status**: accepted
**Deciders**: Daria, Codex

## Context

The current demo draws a single wireframe wave plane. The primary reference combines a water surface with separate, suspended wave meshes. Daria approved a mix of these forms as the scene's background composition and wants the appearance determined before implementation.

## Decision

Use a continuous 3D water surface as the background/foundation, with floating wireframe mesh sheets above it. Both consume the existing mesh wave parameters; reuse or closely share the wave-setting calculations rather than introduce a separate marine-data mapping. The material, framing, relative motion, and exact implementation remain to be agreed before building.

## Alternatives Considered

### Continuous sea only

- **Pros**: coherent ocean surface and simpler composition.
- **Cons**: lacks the suspended mesh forms in the reference.
- **Why not**: Daria chose the mixed composition.

### Suspended sheets only

- **Pros**: abstract, layered composition.
- **Cons**: lacks the continuous water foundation Daria wants.
- **Why not**: Daria chose the mixed composition.

## Consequences

### Positive

- Water and wire sheets can express the same ocean conditions through different materials.
- The continuous surface establishes depth beneath the floating artwork.

### Negative

- An additional surface needs its own material and rendering budget.

### Risks

- Water can compete with luminous foreground layers; balance its contrast during visual review.
- Shared inputs need not produce visually identical motion; relative scale and phase remain design choices.

## Reference and Pending Design

- [Creating a Stylized 3D Water Shader](https://gameidea.org/2026/02/01/creating-a-stylized-3d-water-shader/) is a technical reference supplied by Daria, not an approved implementation or final look.
- This decision does not approve changes to palettes, mapping, lighting, transparency, or the existing demo.
