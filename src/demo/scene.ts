// Three.js objects, material inputs, resizing, and drawing live here.
import * as THREE from "three";
import { SCENE } from "./constants";
import {
  advancePhase,
  getWaterSettings,
  type DemoParams,
} from "./calculations";
import { waterVertexShader, waterFragmentShader } from "./shaders";
import { WATER } from "./waterSettings";

export function createScene(parent: HTMLElement, params: DemoParams) {
  const wave = getWaterSettings(params);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, SCENE.maxPixelRatio),
  );
  parent.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WATER.backgroundColor);
  const camera = new THREE.PerspectiveCamera(
    SCENE.camera.fov,
    1,
    SCENE.camera.near,
    SCENE.camera.far,
  );
  camera.position.set(...SCENE.camera.position);
  camera.lookAt(...SCENE.camera.target);

  const material = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    wireframe: WATER.wireframe,
    uniforms: {
      uPhase: { value: 0 },
      uAmplitude: { value: wave.amplitude },
      uFrequency: { value: wave.frequency },
      uDirection: { value: new THREE.Vector2(params.dirX, params.dirY) },
      uWarmth: { value: params.palette },
      uCrossSwell: { value: WATER.crossSwell },
      uRippleStrength: { value: WATER.rippleStrength },
      uRippleScale: { value: WATER.rippleScale },
      uReflectionStrength: { value: WATER.reflectionStrength },
      uReflectionSoftness: { value: WATER.reflectionSoftness },
      uIridescence: { value: WATER.iridescence },
      uSurfaceBrightness: { value: WATER.surfaceBrightness },
      uDistanceFade: { value: WATER.distanceFade },
      uColdColor: { value: new THREE.Color(WATER.coldColor) },
      uWarmColor: { value: new THREE.Color(WATER.warmColor) },
      uBackgroundColor: { value: new THREE.Color(WATER.backgroundColor) },
    },
  });
  scene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        WATER.size,
        WATER.size,
        WATER.segments,
        WATER.segments,
      ),
      material,
    ),
  );

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  let phase = 0;
  renderer.setAnimationLoop(() => {
    phase = advancePhase(phase, clock.getDelta(), wave.speed);
    material.uniforms.uPhase.value = phase;
    renderer.render(scene, camera);
  });
}
