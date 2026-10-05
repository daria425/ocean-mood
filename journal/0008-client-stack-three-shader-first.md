# ADR-0008: Client stack: vanilla TypeScript + three.js, shader-first

**Date**: 2026-10-05
**Status**: accepted
**Deciders**: Daria, Claude

## Context

The product is generative art: smooth, luminous, iridescent, on desktop and mobile equally. The client is one canvas, one label and (later) a mic opt-in control. The look needs custom materials (wireframe glow, iridescence, glass fresnel), bloom and thousands of moving points. The data layer eases about 13 values every poll and the scene must never jump.

## Decision

Vite + vanilla TypeScript + three.js on WebGL2, built **shader-first**: each of the four layers is a small custom shader material that computes its own motion on the GPU as a function of time and the shared params. The CPU only eases the param values each frame and updates uniforms (inputs the shader reads). Bloom comes from a lightweight post-processing pass (pmndrs `postprocessing`, to be verified on a real phone), disabled on low quality tiers.

Concretely:

- **Wave mesh**: dense plane displaced in the vertex shader by summed directional waves; wireframe drawn with barycentric coordinates in the fragment shader (thin, antialiased, glowing lines).
- **Ribbons**: instanced strips with flow computed in the vertex shader; iridescence from a cosine colour palette plus a fresnel hue shift.
- **Orbs**: instanced spheres with a fake-glass fresnel shader and additive blending (not `MeshPhysicalMaterial` transmission, too heavy for mobile). Wire spheres reuse the barycentric wireframe.
- **Particles**: `THREE.Points` whose position is a pure function of seed and time; no GPGPU.
- Additive blending without depth writes gives the luminous look and avoids transparency sorting.
- **Never-jump rule**: speeds are integrated on the CPU into a phase (`phase += speed * dt`) and the phase is sent to the shader. Sending `speed * time` would make waves visibly jump whenever speed changes.
- **Quality tiers**: a frame-time governor lowers pixel ratio and counts when the frame rate drops.
- **Audio later** (ADR-0007): smoothed analyser bands become a few more uniforms in the same params object.

## Alternatives Considered

### Alternative 1: three.js via React Three Fiber (+ drei)

- **Pros**: declarative scene, nice if the UI grows into real app UI.
- **Cons**: our scene is imperative per-frame uniform updates, so React's reconciliation adds bundle size and mobile cost without helping; one more abstraction between us and the shaders.
- **Why not**: the UI is a label and a button. Revisit if the UI grows.

### Alternative 2: Raw WebGL / ogl / regl

- **Pros**: smallest bundle, full control.
- **Cons**: we would hand-write cameras, instancing, render targets and bloom.
- **Why not**: three.js gives those for free while still letting us write our own shaders.

### Alternative 3: WebGPU / three's TSL node materials

- **Pros**: modern, compute shaders, shaders written in JS.
- **Cons**: fallback paths and mobile support add risk; we do not need compute for v1.
- **Why not**: revisit later; shader-first on WebGL2 ports over conceptually.

### Alternative 4: CPU-animated three.js (move vertices and objects in JS each frame)

- **Pros**: no shader code to learn.
- **Cons**: thousands of vertices and particles per frame on the main thread stutters on phones; this is the main enemy of "smooth".
- **Why not**: the GPU does this work for free; it is the reason the stack is shader-first.

## Consequences

### Positive

- Smooth at high vertex and particle counts, including mobile.
- Data updates become uniform changes only, so easing them is trivial.
- Look and feel live in a few small shader files that are easy to tune by eye.

### Negative

- GLSL has to be written and debugged (small programs, but hard to step through).
- Shader errors show up at runtime in the browser console.

### Risks

- Bloom cost on phones. Mitigation: measure; lower resolution or turn off on low tiers.
- Learning curve for GLSL. Mitigation: shaders are built one layer at a time, each kept short and explained as it is introduced.
