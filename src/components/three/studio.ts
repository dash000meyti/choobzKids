import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";

/*
 * A product photo studio: soft image-based light, a key light from the upper right, a blurred
 * contact shadow on an invisible floor, transparent background. Used by the live viewers and by
 * the offline render page that produces the catalogue shots.
 *
 * `quality: "live"` (the default) is what a phone can afford: a smaller contact-shadow texture read
 * back asynchronously, and pixel ratio ≤ 1.5. `"studio"` is the offline catalogue rig. Post-processing (ambient
 * occlusion) is passed in by the offline bench (./studio-ao), so live pages never download it.
 */

/** Post-processing for offline renders (see ./studio-ao). */
export type PostFactory = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
) => { render: () => void; setSize: (w: number, h: number) => void; reframe: (radius: number) => void };

export type Angle = "hero" | "front" | "side" | "top" | "low";

const ANGLES: Record<Angle, { az: number; el: number }> = {
  hero: { az: -32, el: 16 }, // three-quarter from the front-left, like a product photo
  front: { az: 0, el: 6 },
  side: { az: -82, el: 8 },
  top: { az: -28, el: 48 },
  low: { az: -24, el: 4 },
};

export type Studio = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  stage: THREE.Group;
  frame: (object: THREE.Object3D, angle?: Angle | { az: number; el: number }, padding?: number) => void;
  /** Re-prints the contact shadow; resolves once it is ready to render (async readback in live mode). */
  updateShadow: () => Promise<void>;
  /** Compiles every shader (scene, contact shadow, shadow map) ahead of the first visible frame. */
  compile: () => Promise<void>;
  render: () => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
};

export function createStudio(
  canvas: HTMLCanvasElement,
  {
    quality = "live",
    pixelRatio = Math.min(window.devicePixelRatio, quality === "live" ? 1.5 : 2),
    preserveDrawingBuffer = false,
    post,
  }: {
    quality?: "live" | "studio";
    pixelRatio?: number;
    preserveDrawingBuffer?: boolean;
    post?: PostFactory;
  } = {},
): Studio {
  const live = quality === "live";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer, powerPreference: live ? "default" : "high-performance" });
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.16;
  // The shadow map is identical in live and studio mode: every lighter variant we tried (no shadow
  // map, a smaller map, fewer blur samples, manual updates) made Chrome's GPU process (ANGLE/Metal)
  // drop the WebGL context once the parts were exploded.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 50);

  // Key light from the upper right-front; soft cast shadow on the floor.
  const key = new THREE.DirectionalLight("#fff4e6", 2.3);
  key.position.set(1.6, 3.2, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 24;
  key.shadow.blurSamples = 24;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.002;
  const fill = new THREE.DirectionalLight("#eaf0ff", 0.35);
  fill.position.set(-2.5, 1.2, 1.5);
  scene.add(key, key.target, fill);

  const stage = new THREE.Group();
  scene.add(stage);

  const floorShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({ opacity: 0.09, transparent: true }),
  );
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.receiveShadow = true;
  scene.add(floorShadow);

  // Contact shadow: depth from below, blurred twice, printed on a plane (after drei's ContactShadows).
  const RES = live ? 256 : 512;
  const contact = {
    rt: new THREE.WebGLRenderTarget(RES, RES),
    blurRt: new THREE.WebGLRenderTarget(RES, RES),
    cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    plane: new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false }),
    ),
    blurPlane: new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2)),
    depthMat: new THREE.MeshDepthMaterial(),
    hBlur: new THREE.ShaderMaterial(HorizontalBlurShader),
    vBlur: new THREE.ShaderMaterial(VerticalBlurShader),
  };
  contact.rt.texture.generateMipmaps = false;
  contact.blurRt.texture.generateMipmaps = false;
  contact.plane.rotation.x = -Math.PI / 2;
  contact.plane.position.y = 0.0005;
  // The blurred depth is copied into a DataTexture: sampling the render target directly left the plane blank.
  const shadowPixels = new Uint8Array(RES * RES * 4);
  const shadowTex = new THREE.DataTexture(shadowPixels, RES, RES);
  shadowTex.magFilter = THREE.LinearFilter;
  shadowTex.minFilter = THREE.LinearFilter;
  // The upward-looking shadow camera sees the floor mirrored front-to-back.
  shadowTex.wrapT = THREE.RepeatWrapping;
  shadowTex.repeat.set(1, -1);
  shadowTex.offset.set(0, 1);
  (contact.plane.material as THREE.MeshBasicMaterial).map = shadowTex;
  contact.plane.renderOrder = 1;
  contact.cam.rotation.x = Math.PI / 2;
  contact.blurPlane.visible = false;
  contact.depthMat.onBeforeCompile = (shader) => {
    shader.uniforms.darkness = { value: 1.35 };
    shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader.replace(
      "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
      "gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );",
    )}`;
  };
  contact.depthMat.depthTest = false;
  contact.depthMat.side = THREE.DoubleSide;
  contact.depthMat.depthWrite = false;
  scene.add(contact.plane, contact.blurPlane);

  const blur = (amount: number) => {
    contact.blurPlane.visible = true;
    contact.blurPlane.material = contact.hBlur;
    contact.hBlur.uniforms.tDiffuse.value = contact.rt.texture;
    contact.hBlur.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(contact.blurRt);
    renderer.render(contact.blurPlane, contact.cam);
    contact.blurPlane.material = contact.vBlur;
    contact.vBlur.uniforms.tDiffuse.value = contact.blurRt.texture;
    contact.vBlur.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(contact.rt);
    renderer.render(contact.blurPlane, contact.cam);
    contact.blurPlane.visible = false;
  };

  const updateShadow = async () => {
    const box = new THREE.Box3().setFromObject(stage);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const span = Math.max(size.x, size.z) * 1.6 + 0.2;
    contact.plane.scale.set(span, span, 1);
    contact.plane.position.set(center.x, 0.0005, center.z);
    contact.blurPlane.scale.set(span, 1, span);
    contact.blurPlane.position.set(center.x, 0.0001, center.z);
    contact.cam.left = -span / 2;
    contact.cam.right = span / 2;
    contact.cam.top = span / 2;
    contact.cam.bottom = -span / 2;
    contact.cam.near = 0;
    contact.cam.far = Math.min(0.35, size.y * 0.6 + 0.05);
    contact.cam.position.set(center.x, -0.003, center.z);
    contact.cam.updateProjectionMatrix();

    floorShadow.scale.set(span * 2, span * 2, 1);
    floorShadow.position.set(center.x, 0, center.z);
    key.target.position.copy(center);
    const cam = key.shadow.camera as THREE.OrthographicCamera;
    const r = Math.max(size.x, size.y, size.z) * 1.5;
    cam.left = -r;
    cam.right = r;
    cam.top = r;
    cam.bottom = -r;
    cam.near = 0.1;
    cam.far = 10;
    key.position.copy(center).add(new THREE.Vector3(0.9, 3.6, 1.8));
    cam.updateProjectionMatrix();

    const bg = scene.background;
    scene.background = null;
    const visible = contact.plane.visible;
    contact.plane.visible = false;
    floorShadow.visible = false;
    scene.overrideMaterial = contact.depthMat;
    const clear = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(contact.rt);
    renderer.clear();
    renderer.render(scene, contact.cam);
    scene.overrideMaterial = null;
    // Spread the footprint into a soft pool; the second pass removes blur banding.
    blur(9);
    blur(5);
    blur(2);
    // Live views read the pixels back asynchronously (PBO + fence), so the main thread never waits
    // for the GPU; the offline bench reads synchronously and renders straight after.
    const readback = live ? renderer.readRenderTargetPixelsAsync(contact.rt, 0, 0, RES, RES, shadowPixels) : null;
    if (!live) renderer.readRenderTargetPixels(contact.rt, 0, 0, RES, RES, shadowPixels);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clear);
    contact.plane.visible = visible;
    floorShadow.visible = true;
    scene.background = bg;
    if (readback) await readback;
    shadowTex.needsUpdate = true;
  };

  const frame: Studio["frame"] = (object, angle = "hero", padding = 1.12) => {
    const a = typeof angle === "string" ? ANGLES[angle] : angle;
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const az = THREE.MathUtils.degToRad(a.az);
    const el = THREE.MathUtils.degToRad(a.el);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const dist = (sphere.radius * padding) / Math.sin(Math.min(vFov, hFov) / 2);
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.lookAt(center);
    camera.near = dist / 50;
    camera.far = dist * 4;
    camera.updateProjectionMatrix();
    postFx?.reframe(sphere.radius);
  };

  const postFx = post ? post(renderer, scene, camera) : null;

  return {
    renderer,
    scene,
    camera,
    stage,
    frame,
    updateShadow,
    compile: async () => {
      // Scene materials, then the contact-shadow pipeline (depth override + both blur passes), all
      // through KHR_parallel_shader_compile where available, so the first frame compiles nothing.
      await renderer.compileAsync(scene, camera);
      const helper = new THREE.Scene();
      const quad = new THREE.PlaneGeometry(1, 1);
      helper.add(new THREE.Mesh(quad, contact.depthMat), new THREE.Mesh(quad, contact.hBlur), new THREE.Mesh(quad, contact.vBlur));
      await renderer.compileAsync(helper, contact.cam);
      quad.dispose();
      // The shadow map's own programs only compile when it first renders: do that in a frame of its own.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      renderer.render(scene, camera);
    },
    render: () => (postFx ? postFx.render() : renderer.render(scene, camera)),
    resize(w, h) {
      renderer.setSize(w, h, false);
      postFx?.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose() {
      contact.rt.dispose();
      shadowTex.dispose();
      contact.blurRt.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
