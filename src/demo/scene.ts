// Three.js objects, material inputs, resizing, and drawing live here.
import * as THREE from "three";
import { SCENE } from "./constants";
import {
  advancePhase,
  getWaterSettings,
  type DemoParams,
} from "./calculations";
import { waterVertexShader, waterFragmentShader, sheetVertexShader, sheetFragmentShader } from "./shaders";
import { WATER, SHEET } from "./waterSettings";

function createFloatingSheet(waterMaterial: THREE.ShaderMaterial) {
  const material = new THREE.ShaderMaterial({
    vertexShader: sheetVertexShader,
    fragmentShader: sheetFragmentShader,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      // Sharing these uniform objects keeps both surfaces in the same rhythm.
      uPhase: waterMaterial.uniforms.uPhase,
      uFrequency: waterMaterial.uniforms.uFrequency,
      uDirection: waterMaterial.uniforms.uDirection,
      uCrossSwell: waterMaterial.uniforms.uCrossSwell,
      uWarmth: waterMaterial.uniforms.uWarmth,
      uAmplitude: { value: waterMaterial.uniforms.uAmplitude.value * SHEET.waveHeight },
      uColdColor: { value: new THREE.Color(SHEET.coldColor) },
      uWarmColor: { value: new THREE.Color(SHEET.warmColor) },
      uBrightness: { value: SHEET.brightness },
      uOpacity: { value: SHEET.opacity },
    },
  });
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET.width, SHEET.depth, SHEET.segmentsX, SHEET.segmentsY),
    material,
  );
  sheet.position.set(SHEET.offsetX, SHEET.offsetY, SHEET.altitude);
  sheet.visible = SHEET.visible;
  return sheet;
}

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

  scene.add(createFloatingSheet(material));

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
