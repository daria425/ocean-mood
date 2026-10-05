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

