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
  ribbonVertexShader,
  ribbonFragmentShader,
} from "./shaders";
import { RIBBON } from "./ribbonSettings";
import { WATER, SHEET, FRAMING } from "./waterSettings";

// Each triangle needs its own three corners for barycentric edge distances.
// Width/depth and segment counts set the lattice; live wave params deform it
// later in the vertex shader, so changing inputs never rebuilds this geometry.
function createSheetGeometry(layer: (typeof SHEET.layers)[number]) {
  const plane = new THREE.PlaneGeometry(
    SHEET.width * layer.scale, SHEET.depth * layer.scale,
    SHEET.segmentsX, SHEET.segmentsY,
  );
  const geometry = plane.toNonIndexed();
  plane.dispose();
  const count = geometry.getAttribute("position").count;
  const corners = new Float32Array(count * 3);
  for (let vertex = 0; vertex < count; vertex++) {
    corners[vertex * 3 + vertex % 3] = 1;
  }
  geometry.setAttribute("aBarycentric", new THREE.BufferAttribute(corners, 3));
  return geometry;
}

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
    wireframe: false,
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
      uLineWidth: { value: SHEET.lineWidth },
      uLineSoftness: { value: SHEET.lineSoftness },
      uGlowWidth: { value: SHEET.glowWidth },
      uGlowStrength: { value: SHEET.glowStrength },
      uCrestBrightness: { value: SHEET.crestBrightness },
    },
  });
  const sheet = new THREE.Mesh(
    createSheetGeometry(layer),
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

// A layer supplies placement/variation; live params supply current and warmth.
// The strip is allocated once; the shader bends it every frame using uniforms.
function createRibbon(params: SceneParams, layer: (typeof RIBBON.layers)[number]) {
  const material = new THREE.ShaderMaterial({
    vertexShader: ribbonVertexShader, fragmentShader: ribbonFragmentShader,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPhase: { value: layer.phase },
      uLength: { value: RIBBON.length + params.ribbonLength * RIBBON.lengthRange },
      uDirection: { value: new THREE.Vector2(params.ribbonDirX, params.ribbonDirY) },
      uWarmth: { value: params.palette },
      uWidth: { value: RIBBON.width }, uLift: { value: RIBBON.lift },
      uBends: { value: RIBBON.bends }, uSlope: { value: RIBBON.slope },
      uDepthSway: { value: RIBBON.depthSway }, uTwist: { value: RIBBON.twist },
      uBrightness: { value: RIBBON.brightness }, uOpacity: { value: RIBBON.opacity },
      uCoreWidth: { value: RIBBON.coreWidth }, uGlowStrength: { value: RIBBON.glowStrength },
      uColorCycles: { value: RIBBON.colorCycles },
      uColdHue: { value: RIBBON.coldHue }, uWarmHue: { value: RIBBON.warmHue },
      uHueOffset: { value: layer.hue }, uShimmer: { value: RIBBON.shimmer },
    },
  });
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, RIBBON.segments, 1), material);
  ribbon.position.set(layer.x, layer.y, layer.z);
  ribbon.scale.setScalar(layer.scale);
  ribbon.visible = RIBBON.visible;
  // CPU bounds describe the tiny source plane, not the shader-deformed strip.
  ribbon.frustumCulled = false;
  return ribbon;
}

// Defaults are resolved once here; every geometry builder gets complete inputs.
export function createScene(
  parent: HTMLElement,
  initialParams: Partial<SceneParams> = {},
): SceneController {
  const params: SceneParams = { ...RESTING, ...initialParams };
  let wave = getWaterSettings(params);
  let ribbonSpeed = params.ribbonSpeed;

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
  const ribbons = RIBBON.layers.map((layer) => createRibbon(params, layer));
  scene.add(...ribbons);

  // Shared uniforms carry spacing, direction and colour to all sheets.
  // Sheet amplitude is separate so its artistic height multiplier is retained.
  const updateParams = (next: SceneParams) => {
    wave = getWaterSettings(next);
    ribbonSpeed = next.ribbonSpeed;
    for (const ribbon of ribbons) {
      const inputs = ribbon.material.uniforms;
      inputs.uLength.value = RIBBON.length + next.ribbonLength * RIBBON.lengthRange;
      inputs.uDirection.value.set(next.ribbonDirX, next.ribbonDirY);
      inputs.uWarmth.value = next.palette;
    }
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
    const dt = clock.getDelta();
    phase = advancePhase(phase, dt, wave.speed);
    // Integrate current speed independently: changes never reset ribbon phase.
    const flowSpeed = (RIBBON.speedBase + ribbonSpeed * RIBBON.speedRange) * RIBBON.motionSpeed;
    for (const ribbon of ribbons) {
      const input = ribbon.material.uniforms.uPhase;
      input.value = advancePhase(input.value, dt, flowSpeed);
    }
    water.material.uniforms.uPhase.value = phase;
    renderer.render(scene, camera);
  });

  return {
    updateParams,
    // Release the loop and GPU resources when the owning view is removed.
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      for (const mesh of [water, ...sheets, ...ribbons]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
