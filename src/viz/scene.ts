// Three.js objects, material inputs, resizing, and drawing live here.
import * as THREE from "three";
import { RESTING, SCENE } from "./constants";
import type { SceneParams, SceneController } from "./params";
import {
  advancePhase,
  getWaterSettings,
  getFramedCameraTarget,
} from "./calculations";
import {
  waterVertexShader,
  waterFragmentShader,
  sheetVertexShader,
  sheetFragmentShader,
} from "./shaders";
import { WATER, SHEET, FRAMING } from "./waterSettings";

// Params drive the same swell and palette as the water. Layer offsets/scale
// control placement; SHEET.waveHeight controls this sheet's relative swell.
function createFloatingSheet(
  params: SceneParams,
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
        value: getWaterSettings(params).amplitude * SHEET.waveHeight,
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

// Params control height, spacing, direction and palette; WATER keeps the
// user-tuned material and geometry settings separate from those live inputs.
function createWaterLayer(params: SceneParams) {
  const wave = getWaterSettings(params);
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

// Defaults are resolved once here; every geometry builder gets complete inputs.
export function createScene(
  parent: HTMLElement,
  initialParams: Partial<SceneParams> = {},
): SceneController {
  const params: SceneParams = { ...RESTING, ...initialParams };
  let wave = getWaterSettings(params);

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

  const water = createWaterLayer(params);
  scene.add(water);

  const sheets = SHEET.layers.map((layer) =>
    createFloatingSheet(params, water.material, layer),
  );
  scene.add(...sheets);

  // Shared uniforms carry spacing, direction and colour to all sheets.
  // Sheet amplitude is separate so its artistic height multiplier is retained.
  const updateParams = (next: SceneParams) => {
    wave = getWaterSettings(next);
    const uniforms = water.material.uniforms;
    uniforms.uAmplitude.value = wave.amplitude;
    uniforms.uFrequency.value = wave.frequency;
    uniforms.uDirection.value.set(next.dirX, next.dirY);
    uniforms.uWarmth.value = next.palette;
    for (const sheet of sheets) {
      sheet.material.uniforms.uAmplitude.value = wave.amplitude * SHEET.waveHeight;
    }
  };

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

  return {
    updateParams,
    // Release the loop and GPU resources when the owning view is removed.
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      for (const mesh of [water, ...sheets]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
