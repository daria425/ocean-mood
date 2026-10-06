// Three.js objects, material inputs, resizing, and drawing live here.
import * as THREE from "three";
import { SCENE } from "./constants";
import {
  advancePhase,
  getWaterSettings,
  getFramedCameraTarget,
  type DemoParams,
} from "./calculations";
import {
  waterVertexShader,
  waterFragmentShader,
  sheetVertexShader,
  sheetFragmentShader,
} from "./shaders";
import { WATER, SHEET, FRAMING } from "./waterSettings";

function createFloatingSheet(
  waterMaterial: THREE.ShaderMaterial,
  layer: (typeof SHEET.layers)[number],
) {
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
      uAmplitude: {
        value: waterMaterial.uniforms.uAmplitude.value * SHEET.waveHeight,
      },
      uColdColor: { value: new THREE.Color(SHEET.coldColor) },
      uWarmColor: { value: new THREE.Color(SHEET.warmColor) },
      uBrightness: { value: SHEET.brightness },
      uOpacity: { value: SHEET.opacity },
    },
  });
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(
      SHEET.width * layer.scale,
      SHEET.depth * layer.scale,
      SHEET.segmentsX,
      SHEET.segmentsY,
    ),
    material,
  );
  sheet.position.set(
    SHEET.offsetX + layer.x,
    SHEET.offsetY + layer.y,
    SHEET.altitude + layer.z,
  );
  sheet.visible = SHEET.visible;
  return sheet;
}

function createWaterLayer(
  wave: ReturnType<typeof getWaterSettings>,
  params: DemoParams,
) {
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
  return new THREE.Mesh(
    new THREE.PlaneGeometry(
      WATER.size,
      WATER.size,
      WATER.segments,
      WATER.segments,
    ),
    material,
  );
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
  camera.position.z = FRAMING.cameraHeight;
  camera.up.set(0, 0, 1); // This scene uses z as altitude.
  camera.lookAt(...getFramedCameraTarget());

  const water = createWaterLayer(wave, params);
  scene.add(water);

  for (const layer of SHEET.layers) {
    scene.add(createFloatingSheet(water.material, layer));
  }

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
    water.material.uniforms.uPhase.value = phase;
    renderer.render(scene, camera);
  });
}
