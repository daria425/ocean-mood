// Three.js objects, material inputs, resizing, and drawing live here.
import * as THREE from 'three';
import { SCENE } from './constants';
import { advancePhase, getWaveSettings, type DemoParams } from './calculations';
import { vertexShader, fragmentShader } from './shaders';

export function createScene(parent: HTMLElement, params: DemoParams) {
  const wave = getWaveSettings(params);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE.maxPixelRatio));
  parent.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(SCENE.camera.fov, 1, SCENE.camera.near, SCENE.camera.far);
  camera.position.set(...SCENE.camera.position);
  camera.lookAt(...SCENE.camera.target);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPhase: { value: 0 },
      uAmplitude: { value: wave.amplitude },
      uFrequency: { value: wave.frequency },
      uDirection: { value: new THREE.Vector2(params.dirX, params.dirY) },
      uWarmth: { value: params.palette },
    },
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(SCENE.mesh.width, SCENE.mesh.height, SCENE.mesh.segments, SCENE.mesh.segments), material));

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
    phase = advancePhase(phase, clock.getDelta(), wave.speed);
    material.uniforms.uPhase.value = phase;
    renderer.render(scene, camera);
  });
}
