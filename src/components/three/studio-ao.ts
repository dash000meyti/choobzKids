import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import type { PostFactory } from "./studio";

/*
 * Ground-truth ambient occlusion for the offline catalogue renders (dev-only /studio bench).
 * Kept out of ./studio so the live viewers never download the post-processing code.
 */
export const aoPost: PostFactory = (renderer, scene, camera) => {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera, undefined, new THREE.Color(0x000000), 0));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.blendIntensity = 0.9;
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  return {
    render: () => composer.render(),
    setSize: (w, h) => composer.setSize(w, h),
    reframe: (radius) => gtao.updateGtaoMaterial({ radius: radius * 0.12, distanceExponent: 1.4, thickness: 1.2, scale: 1 }),
  };
};
