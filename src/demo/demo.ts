// DISPOSABLE: a first look at the pipeline (BFF -> params -> shader).
// One wireframe plane, waves computed on the GPU. Not the real scene.
import * as THREE from 'three';

// Calm fallback so the sea shows even if the server is not running.
const RESTING = { amplitude: 0.2, wavelength: 0.5, speed: 0.4, dirX: 0.8, dirY: 0.6, palette: 0.3 };

async function loadParams(): Promise<typeof RESTING> {
  try {
    const res = await fetch('/api/ocean?lat=35&lon=-40');
    if (!res.ok) return RESTING;
    const { params: p } = await res.json();
    return {
      amplitude: p.mesh_amplitude,
      wavelength: p.mesh_wavelength,
      speed: p.mesh_wave_speed,
      dirX: p.mesh_direction.x,
      dirY: p.mesh_direction.y,
      palette: p.color_palette,
    };
  } catch {
    return RESTING;
  }
}

// Vertex shader: "where does this point go?" Runs once per vertex, on the GPU.
const vertexShader = /* glsl */ `
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
const fragmentShader = /* glsl */ `
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

export async function startDemo(parent: HTMLElement) {
  const params = await loadParams();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  parent.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, -9, 5);
  camera.lookAt(0, 0, 0);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPhase: { value: 0 },
      uAmplitude: { value: 0.15 + params.amplitude * 1.6 },
      uFrequency: { value: 0.5 + (1 - params.wavelength) * 1.5 },
      uDirection: { value: new THREE.Vector2(params.dirX, params.dirY) },
      uWarmth: { value: params.palette },
    },
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 90, 90), material));

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let phase = 0;
  renderer.setAnimationLoop(() => {
    phase += clock.getDelta() * (0.4 + params.speed * 2); // integrate speed -> phase
    material.uniforms.uPhase.value = phase;
    renderer.render(scene, camera);
  });
}
