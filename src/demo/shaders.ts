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
