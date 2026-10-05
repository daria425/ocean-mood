# Design

## The Scene: Bioluminescent Depths

The viewport is a window into dark, otherworldly ocean. The space feels infinite yet intimate—like standing in an abyss that glows from within. All elements are translucent, wireframed, or luminous. Nothing is opaque; nothing sits flat. Light comes from the geometries themselves, not from external sources.

The background is deep: a gradient from near-black (dark teal, indigo) that holds the color shifts. No harsh edges. No skyline. The horizon is the water-plane, barely distinct but present.

---

## The Four Layers

Ocean Mood builds from four visual elements, layered and moving in concert. Each responds to the live ocean data but moves with its own fluidity and timing.

### 1. Wireframe Wave Mesh
**The foundation of the scene.** A translucent, undulating mesh that represents the sea surface and its motion.

- **Form**: Grid of vertices forming rolling hills and valleys. Curves are smooth and organic, never angular.
- **Visual**: Fine wireframe lines in pale cyan or cool glass-blue. Fills are translucent, barely visible—the frame is the substance.
- **Motion**: Swells travel across the mesh in a dominant direction. The height of the peaks responds to wave energy; the frequency and speed respond to wave period. When the ocean is calm, the mesh is glassy and still. During storms, it churns and peaks sharply.
- **Parallax**: Mesh sits at mid-depth. Camera pan creates parallax through its layers.
- **Lighting**: Gentle volumetric glow along ridges; the mesh catches ambient light as if lit by phosphorescence.

### 2. Iridescent Flow Ribbons  
**The poetry of current.** Long, flowing ribbon-like forms that represent water current velocity and direction.

- **Form**: Smooth, sinuous curves that twist and flow. Think of silk scarves in water, or aurora borealis trails.
- **Visual**: Multi-colored with smooth gradients—pink to magenta to blue to cyan to green, flowing within each ribbon. Colors shift slowly and shimmer. The ribbons have a glowing, translucent core with softer edges that fade to transparency.
- **Motion**: Ribbons flow and swirl in the direction of the current. Speed is tied to ocean current velocity. Multiple ribbons move in parallel, overlapping and weaving. They breathe and pulse gently.
- **Interaction**: Camera pan doesn't "cut" ribbons; they flow across the viewport as the camera moves, suggesting depth and continuity beyond the frame.
- **Contrast**: Ribbons are the primary accent color; they catch and hold attention. They're the most vibrant element.

### 3. Glass Orbs and Wireframe Spheres
**The stillness and punctuation.** Scattered through the scene at varying depths, these spheres feel like bubbles, buoys, or captured moments.

- **Form**: Perfect and geometric; transparent glass spheres and wireframe icospheres. Mix of sizes—large spheres (center of attention) and small ones (background detail).
- **Visual**: Glass spheres are clear with a subtle internal luminescence, as if holding faint color or light. Wireframe spheres are drawn in pale blue or soft white, fine-lined, never solid.
- **Motion**: Spheres bob and drift with subtle vertical and horizontal motion. Motion is slower than ribbons, more meditative. They respond to sea level height (vertical offset) and current velocity (slow drift).
- **Depth**: Layered at different z-depths so some are closer (larger, more prominent) and some are distant (smaller, hazier).

### 4. Sparkle Particles  
**The shimmer and life.** Tiny, bright points that dance and drift through the entire scene.

- **Form**: Point sprites or small glowing dots. No shape; pure light.
- **Visual**: Bright white or pale cyan, with soft halos. They glow. They fade in and out gradually.
- **Motion**: Particles drift and swirl, following invisible currents. They respond to ocean current velocity (faster drift when currents are strong) and direction. Density and speed of drift varies with data conditions.
- **Effect**: When the ocean is calm, particles drift slowly and sparsely. When dynamic, they become a swirling, dancing cloud.
- **Depth**: Distributed across all z-depths; they connect foreground and background visually.

---

## Color System

The palette is data-driven but artistic. A single value—**sea surface temperature**—maps to the overall color world. The mapping is intuitive yet poetic.

### Cold Ocean (0.0 — calm, cool temperature)
- Dominant colors: Deep teals, indigos, cool cyan, soft violet
- Mood: Serene, Arctic, ancient
- Ribbon gradients: Magenta → Blue → Cyan
- Orbs: Clear glass with faint cool glow
- Particles: Pale cyan, sparse

### Warm Ocean (1.0 — active, warm temperature)  
- Dominant colors: Coral, amber, warm amber-green, sunset pink
- Mood: Alive, tropical, energetic
- Ribbon gradients: Pink → Coral → Amber-green
- Orbs: Glass with warm internal glow
- Particles: Warm white, denser

### Transitions
The shift between states is smooth, no snaps. A 5-degree shift in ocean temperature eases the palette over the entire scene across ~2–3 minutes. Colors are iridescent, always shimmering slightly, so the gradients feel alive even in stasis.

---

## Movement & Animation Language

Motion is the heartbeat of the piece. Everything moves, but not chaotically.

### Principles
- **Breathing, not bouncing**: Motion is fluid and organic. Waves swell and retreat like lungs. Ribbons flow like living things.
- **Layered timing**: Each element has a different temporal scale. Mesh responds fastest (wave period ~5–15 sec). Ribbons flow steadily (drift over 20–60 sec). Spheres bob slowly (10–30 sec cycles). Particles sparkle and drift (sub-second flickers, slow drift).
- **Easing**: All transitions ease (no pops). Data updates ease in over 3–5 seconds. Animation curves are smooth (cubic ease-in-out or custom splines).
- **Feedback to data**: When ocean conditions change (new data poll), the mesh responds first and most dramatically. Ribbons speed up or slow down. Spheres shift altitude. Particles intensify or calm. The entire scene is saying "something changed" without any text.

### Specific Animations
- **Mesh**: Continuous wave propagation. Height and frequency update with data. Smooth sine/cosine wave travel.
- **Ribbons**: Sinusoidal flow along their length, with overall drift direction from current heading. Weaving motion (slight perpendicular sway) for organic feel.
- **Spheres**: Gentle bobbing (vertical sine wave at slow frequency). Drift perpendicular to current (slow, drawn-out curves). Rotation (very subtle, barely perceptible).
- **Particles**: Wandering motion (brownian-like drift), affected by current direction and speed. Birth and death (fade in/out over 0.5–2 sec). Sparkle (brightness flicker at 1–3 Hz).

---

## Interaction: Camera Pan & Parallax

The viewer has one power: **pan the camera through the scene**.

- **Mouse/Touch**: Drag left/right or up/down to pan the camera. Smooth, responsive. Parallax depth means elements move at different rates—foreground ribbons move more than background spheres.
- **Feel**: Panning is like swimming slowly through the scene. Elements don't snap; they glide. Drag sensitivity is gentle (not a FPS; slow, contemplative).
- **Bounds**: Camera pans smoothly and wraps or bounces at edges (optional), maintaining the sense of an infinite scene beyond the viewport.
- **Mobile**: Touch drag works identically. Single-touch drag, no multi-touch gestures.

No zoom, no rotation, no keyboard controls. The interface is invisible. Panning is optional; the scene is beautiful while still.

---

## Responsive Scaling

The scene adapts to screen size and device capability without losing its soul.

### Desktop (1920×1080 and up)
- Full detail: all mesh vertices, ribbon density, sphere count, particle effects
- Bloom and glow effects enabled
- 60fps target
- Parallax depth maximum

### Tablet (768–1200px)
- Moderate detail: mesh resolution reduced ~30%, fewer ribbons, sphere count reduced
- Bloom at reduced intensity
- 60fps target
- Parallax maintained but slightly compressed

### Mobile (< 768px)
- Lean quality: mesh simplified further (~50% vertices), 1–2 ribbons, fewer spheres, particle count reduced
- Bloom disabled or very subtle
- 60fps target (60fps on capable phones, 30fps fallback)
- Parallax depth compressed; viewport still pans smoothly

### Guiding Principle
At all scales, the **visual language is identical**. The mesh moves, ribbons flow, spheres drift, particles sparkle—in the same mood and style. We remove detail, not meaning. A mobile viewer feels the same ocean, just painted with a lighter brush.

---

## The Moment: Full Scene Behavior

### On Load
The scene fades in quietly over ~1 second. No splash screen. The mesh is still or gently swaying. Ribbons flow. Spheres are visible. Particles drift. The label (lat, lon, time) appears in the lower corner, subtle and timeless.

### Continuous
Everything moves. The eye can rest on any element and find its own rhythm, or pan through and be guided by the overall flow. The scene is never boring because it's never still.

### On Data Update  
When new ocean data arrives (~15 min intervals):
1. The mesh responds: amplitude or frequency shifts over 3–5 sec
2. Ribbon flow accelerates or decelerates
3. Spheres rise or fall
4. Particles shift density or drift speed
5. Colors ease toward the new temperature
6. The entire transition is felt, not read

The viewer experiences the change as the ocean itself changing, not as a "UI refresh."

### Calming State (No Data for Long Period)
If data fetch stalls, the scene doesn't error. It holds its last state and continues moving with gentle, meditative motion. The scene is peaceful regardless; no UI breaks it.

---

## Visual Palette Reference (Poetic, not Exact Hex)

These are directions, not specifications.

**Cool Palette (Cold Ocean)**
- Deep ocean base: near-black with cool teal undertone
- Mesh wireframe: pale cyan (#0AFFFF-ish)  
- Ribbons: magenta → violet → dark blue (cool, iridescent)
- Sphere glow: faint cool blue
- Particles: pale cyan, sparse glow

**Warm Palette (Warm Ocean)**
- Deep ocean base: near-black with warm indigo undertone
- Mesh wireframe: warm cyan, pale peachy-white
- Ribbons: coral → amber-pink → seafoam green (warm, iridescent)
- Sphere glow: warm amber or coral blush
- Particles: warm white, denser glow

**Always**: Iridescence, luminescence, translucence. Never flat. Never opaque. Glow and shimmer.

---

## Accessibility & Refinements

- **Motion**: All motion is smooth and non-jarring. No flashing elements.
- **Color alone**: Motion and luminance carry meaning in addition to color (e.g., intensity of glow, speed of drift) so viewers with color blindness still perceive change.
- **Performance**: Adaptive quality ensures the scene runs smoothly across devices, not freeze or stutter.
- **Simplicity**: No text, no menus, no UI chrome. The scene is the interface.
