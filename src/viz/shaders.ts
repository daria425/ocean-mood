// Vertex shader: "where does this point go?" Runs once per vertex, on the GPU.
export const vertexShader = /* glsl */ `
  uniform float uPhase;       // wave phase, integrated on the CPU (never speed * time)
  uniform float uAmplitude;
  uniform float uFrequency;
  uniform vec2  uDirection;
  varying float vHeight;

  void main() {
    vec3 p = position;
    float along = dot(p.xy, uDirection);               // distance along the swell direction
    float h = sin(along * uFrequency - uPhase)
            + 0.5 * sin(along * uFrequency * 2.1 - uPhase * 1.3 + p.x * 0.3);
    p.z += h * uAmplitude;
    vHeight = h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// Fragment shader: "what colour is this pixel?" Cool teal -> warm coral by uWarmth.
export const fragmentShader = /* glsl */ `
  uniform float uWarmth;
  varying float vHeight;

  void main() {
    vec3 cold = vec3(0.1, 0.9, 1.0);
    vec3 warm = vec3(1.0, 0.55, 0.4);
    vec3 colour = mix(cold, warm, uWarmth);
    float glow = 0.35 + 0.35 * (vHeight * 0.5 + 0.5);  // crests are brighter
    gl_FragColor = vec4(colour * glow, glow);
  }
`;

// Shared by both stages so the visible shape and its shading stay in agreement.
// Each wave adds height plus its slope in x/y. The slope gives the surface normal.
const waveFunctions = /* glsl */ `
  uniform float uPhase;
  uniform float uAmplitude;
  uniform float uFrequency;
  uniform vec2 uDirection;
  uniform float uCrossSwell;
  uniform float uRippleStrength;
  uniform float uRippleScale;

  vec3 wave(vec2 p, vec2 direction, float frequency, float phase, float amplitude) {
    float angle = dot(p, direction) * frequency - phase;
    return vec3(sin(angle) * amplitude,
      cos(angle) * amplitude * frequency * direction);
  }

  vec3 surface(vec2 p) {
    vec2 d = normalize(uDirection);
    vec2 across = vec2(-d.y, d.x);
    vec3 result = wave(p, d, uFrequency, uPhase, uAmplitude);
    result += wave(p, normalize(d + across * 0.8), uFrequency * 1.65,
      uPhase * 0.83 + 1.7, uAmplitude * uCrossSwell);
    result += wave(p, normalize(d - across * 0.45), uFrequency * 0.63,
      uPhase * 0.61 + 3.1, uAmplitude * 0.28);
    return result;
  }
`;

// Same wave function and phase as the water; its separate mesh sits above it.
export const sheetVertexShader = /* glsl */ `
  ${waveFunctions}
  attribute vec3 aBarycentric;
  varying vec3 vBarycentric;
  varying float vCrest;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vBarycentric = aBarycentric;
    vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
    float height = surface(world.xy).x;
    // Normalize by the sum of swell amplitudes: brightness follows the crest
    // without changing when the upstream amplitude makes the whole sheet taller.
    vCrest = height / max(uAmplitude * (1.28 + uCrossSwell), 0.0001);
    world.z += height;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const sheetFragmentShader = /* glsl */ `
  uniform float uWarmth;
  uniform vec3 uColdColor;
  uniform vec3 uWarmColor;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uLineWidth;       // Core thickness in drawing-buffer pixels.
  uniform float uLineSoftness;    // Smooth transition at each core edge.
  uniform float uGlowWidth;       // Soft halo radius, confined to the sheet.
  uniform float uGlowStrength;    // Halo intensity relative to the thread.
  uniform float uCrestBrightness; // Extra luminance on the high parts of a swell.
  varying vec3 vBarycentric;
  varying float vCrest;
  varying vec2 vUv;
  void main() {
    // Fade the perimeter so the sheet has no hard rectangular border.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.15), vUv)
      * smoothstep(vec2(0.0), vec2(0.15), 1.0 - vUv);
    // Barycentric values reach zero at triangle edges. Divide by their
    // screen-space gradient to measure distance in pixels at any perspective.
    vec3 gradient = max(sqrt(dFdx(vBarycentric) * dFdx(vBarycentric)
      + dFdy(vBarycentric) * dFdy(vBarycentric)), vec3(0.00001));
    vec3 distances = vBarycentric / gradient;
    float distanceToEdge = min(distances.x, min(distances.y, distances.z));
    float halfWidth = uLineWidth * 0.5;
    float core = 1.0 - smoothstep(max(0.0, halfWidth - uLineSoftness * 0.5),
      halfWidth + uLineSoftness * 0.5, distanceToEdge);
    float halo = exp(-pow(distanceToEdge / max(uGlowWidth, 0.001), 2.0));
    // Keep dense distant triangles from turning into a glowing solid fill.
    float separation = smoothstep(0.0, 2.0, 1.0 / max(max(gradient.x,
      gradient.y), gradient.z));
    float light = core + halo * uGlowStrength * separation;
    float crest = smoothstep(0.0, 0.85, vCrest);
    vec3 color = mix(uColdColor, uWarmColor, uWarmth) * uBrightness
      * (1.0 + crest * uCrestBrightness);
    gl_FragColor = vec4(color, uOpacity * edge.x * edge.y * light);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Vertex shader: bend the actual plane into broad, smooth swells.
export const waterVertexShader = /* glsl */ `
  ${waveFunctions}
  varying vec3 vWorldPosition;
  void main() {
    vec3 p = position;
    p.z += surface(p.xy).x;
    vWorldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
  }
`;

// Fragment shader: shade the slope, rather than just colouring wave height.
// The reflected bands are an invented light environment, not scene reflections.
export const waterFragmentShader = /* glsl */ `
  ${waveFunctions}
  uniform float uWarmth;
  uniform vec3 uColdColor;
  uniform vec3 uWarmColor;
  uniform vec3 uBackgroundColor;
  uniform float uReflectionStrength;
  uniform float uReflectionSoftness;
  uniform float uIridescence;
  uniform float uSurfaceBrightness;
  uniform float uDistanceFade;
  varying vec3 vWorldPosition;

  void main() {
    vec3 shape = surface(vWorldPosition.xy);
    vec3 ripples = wave(vWorldPosition.xy, normalize(vec2(0.8, 0.6)),
      uFrequency * uRippleScale, uPhase * 1.4, uRippleStrength);
    ripples += wave(vWorldPosition.xy, normalize(vec2(-0.4, 0.9)),
      uFrequency * uRippleScale * 1.37, uPhase * 1.1, uRippleStrength * 0.45);
    vec2 slope = shape.yz + ripples.yz;
    vec3 normal = normalize(vec3(-slope, 1.0));
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = max(dot(normal, viewDirection), 0.0);
    // Fresnel: a surface reflects more strongly when viewed at a grazing angle.
    float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);
    vec3 reflected = reflect(-viewDirection, normal);
    float softness = max(uReflectionSoftness, 0.02);
    float band = exp(-pow((reflected.z - 0.3) / softness, 2.0));
    band *= 0.25 + 0.75 * pow(0.5 + 0.5 * sin(reflected.x * 3.0 + 0.6), 2.0);
    float narrowBand = exp(-pow((reflected.z - 0.65) / (softness * 0.45), 2.0));
    vec3 base = mix(uColdColor, uWarmColor, uWarmth);
    vec3 reflectionTint = mix(vec3(0.32, 0.65, 0.72), vec3(0.65, 0.72, 0.68), uWarmth);
    vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67)
      + reflected.z * 0.5 + reflected.x * 0.12));
    vec3 color = base * uSurfaceBrightness * (0.4 + 0.6 * normal.z);
    color += reflectionTint * (band + narrowBand * 0.25)
      * (0.3 + fresnel * 0.7) * uReflectionStrength;
    color += rainbow * uIridescence * band * (0.08 + fresnel * 0.25);
    float distanceToCamera = length(cameraPosition - vWorldPosition);
    float visibility = exp(-distanceToCamera * uDistanceFade);
    color = mix(uBackgroundColor, color, visibility);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// A fixed strip becomes a flowing 3D curve on the GPU. uLength stretches its
// reach, uDirection sets current heading, and uPhase carries continuous motion.
export const ribbonVertexShader = /* glsl */ `
  uniform float uPhase;
  uniform float uLength;
  uniform vec2 uDirection;
  uniform float uWidth;
  uniform float uLift;
  uniform float uBends;
  uniform float uSlope;
  uniform float uDepthSway;
  uniform float uTwist;
  varying vec2 vUv;
  varying float vRoll;
  void main() {
    vUv = uv;
    float t = uv.x;
    float along = (t - 0.5) * uLength;
    float angle = t * 6.283185 * uBends - uPhase;
    vec2 heading = uDirection / max(length(uDirection), 0.0001);
    vec2 across = vec2(-heading.y, heading.x);
    vec3 center = vec3(heading * along + across * sin(angle * 0.7) * uDepthSway,
      sin(angle) * uLift + sin(angle * 1.7 + 0.8) * uLift * 0.18 + along * uSlope);
    // Roll the cross-section gently; taper ends so the ribbon dissolves.
    float roll = sin(angle * 0.6 + 1.0) * uTwist;
    vRoll = roll;
    vec3 side = vec3(across * sin(roll), cos(roll));
    float taper = pow(max(sin(t * 3.141593), 0.0), 0.6);
    vec3 p = center + side * (uv.y - 0.5) * uWidth * taper;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// Local glow needs no postprocessing: a bright core fades into a broad halo.
// Palette follows ocean warmth; the moving hue/highlights follow ribbon phase.
export const ribbonFragmentShader = /* glsl */ `
  uniform float uPhase;
  uniform float uWarmth;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uCoreWidth;
  uniform float uGlowStrength;
  uniform float uColorCycles;
  uniform float uColdHue;
  uniform float uWarmHue;
  uniform float uHueOffset;
  uniform float uShimmer;
  varying vec2 vUv;
  varying float vRoll;
  void main() {
    float across = abs(vUv.y * 2.0 - 1.0);
    float core = exp(-pow(across / max(uCoreWidth, 0.001), 2.0));
    float halo = exp(-across * across * 4.0) * (1.0 - smoothstep(0.7, 1.0, across));
    float ends = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, 1.0 - vUv.x);
    float hue = vUv.x * uColorCycles - uPhase * 0.08
      + mix(uColdHue, uWarmHue, uWarmth) + uHueOffset + vRoll * 0.08;
    vec3 rainbow = 0.5 + 0.5 * cos(6.283185 * (hue + vec3(0.0, 0.33, 0.67)));
    vec3 color = mix(rainbow, vec3(1.0), core * 0.35);
    float shimmer = 1.0 - uShimmer * (0.5 + 0.5 * sin(vUv.x * 25.0 - uPhase * 1.8));
    gl_FragColor = vec4(color * uBrightness * shimmer,
      (core + halo * uGlowStrength) * ends * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
