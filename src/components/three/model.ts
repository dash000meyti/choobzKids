import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { planeAxes } from "@/components/illustrations/project";
import type { Manifest, Part, Tone, Vec3 } from "@/components/illustrations/manifests/types";
import { woodMaterials, type Finish } from "./materials";

/*
 * Builds a three.js model from a product manifest (the same parts that draw the 2D views).
 * Manifest space is millimetres with x → right, y ↑ up and z → away from the viewer; the root
 * group mirrors z (three.js handles the negative determinant) and scales to metres.
 */

const PAINT: Partial<Record<Tone, string>> = {
  char: "#2A1E16",
  anar: "#B23A26",
  paper: "#FFFBF3",
  asal: "#C8955A",
  ink: "#33251B",
};

export type ProductModel = {
  root: THREE.Group;
  /** Size in metres (x, y, z as drawn). */
  size: THREE.Vector3;
  /** 0 = assembled, 1 = fully exploded. */
  setExplode: (t: number) => void;
  setPlatformLevel: (mm: number) => void;
  dispose: () => void;
};

const svg = new SVGLoader();

function shapesFrom(d: string): THREE.Shape[] {
  const data = svg.parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="#000" fill-rule="evenodd"/></svg>`,
  );
  return data.paths.flatMap((p) => SVGLoader.createShapes(p));
}

function basis(u: Vec3, v: Vec3, n: Vec3, origin: Vec3) {
  return new THREE.Matrix4()
    .makeBasis(new THREE.Vector3(...u), new THREE.Vector3(...v), new THREE.Vector3(...n))
    .setPosition(new THREE.Vector3(...origin));
}

/**
 * Parts that exist physically in the built product: skip 2D stand-ins (`explodesAs`), parts that
 * only appear on the flat cutting sheet, and drawing aids such as wall/floor lines (ink cords).
 */
function physical(part: Part) {
  if (part.explodesAs) return false;
  const views = part.only;
  if (views && !views.includes("assembled") && !views.includes("exploded")) return false;
  if (part.hideIn?.includes("assembled") && part.hideIn?.includes("exploded")) return false;
  if (part.kind === "cord" && (part.tone === "ink" || part.tone === "char")) return false;
  return true;
}

export function buildProductModel(manifest: Manifest, opts: { finish?: Finish; pose?: string } = {}): ProductModel {
  const mats = woodMaterials(opts.finish ?? "natural");
  const geometries: THREE.BufferGeometry[] = [];
  const root = new THREE.Group();
  root.name = manifest.key;
  const inner = new THREE.Group();
  root.add(inner);
  root.scale.set(0.001, 0.001, -0.001);

  const flip = Boolean(opts.pose && manifest.poses?.[opts.pose]?.flipY);
  if (flip) {
    inner.rotation.z = Math.PI;
    inner.position.set(manifest.size.w, manifest.size.h, 0);
  }

  const movers: { obj: THREE.Object3D; base: THREE.Vector3; offset: THREE.Vector3; platform: boolean }[] = [];
  const platformParts = new Set(manifest.platform?.parts ?? []);

  for (const part of manifest.parts) {
    if (!physical(part)) continue;
    const obj = buildPart(part, mats, geometries);
    if (!obj) continue;
    obj.name = part.id;
    inner.add(obj);
    const offset = manifest.exploded?.[part.id] ?? [0, 0, 0];
    movers.push({
      obj,
      base: obj.position.clone(),
      offset: new THREE.Vector3(...offset),
      platform: platformParts.has(part.id),
    });
  }

  let explode = 0;
  let lift = 0;
  const apply = () => {
    for (const m of movers) {
      m.obj.position.copy(m.base).addScaledVector(m.offset, explode);
      if (m.platform) m.obj.position.y += lift;
    }
  };

  return {
    root,
    size: new THREE.Vector3(manifest.size.w / 1000, manifest.size.h / 1000, manifest.size.d / 1000),
    setExplode(t) {
      explode = THREE.MathUtils.clamp(t, 0, 1);
      apply();
    },
    setPlatformLevel(mm) {
      lift = manifest.platform ? mm - manifest.platform.level : 0;
      apply();
    },
    dispose() {
      for (const g of geometries) g.dispose();
    },
  };
}

function buildPart(part: Part, mats: ReturnType<typeof woodMaterials>, geometries: THREE.BufferGeometry[]) {
  if (part.kind === "panel" || part.kind === "extrusion") {
    const axes = planeAxes(part.kind === "panel" ? part.plane : "XY");
    const outline = part.kind === "panel" ? part.outline : part.profile;
    const thickness = part.kind === "panel" ? part.t : part.depth;
    const shapes = shapesFrom(outline + " " + (part.holes ?? ""));
    if (!shapes.length) return null;

    const group = new THREE.Group();
    const m = basis(axes.u, axes.v, axes.n, part.origin);
    group.applyMatrix4(m);

    if (thickness > 0) {
      // Router-rounded edges: a small bevel kept inside the true outline and thickness.
      const r = Math.min(1.6, thickness / 4);
      const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: Math.max(thickness - 2 * r, 0.01),
        bevelEnabled: true,
        bevelThickness: r,
        bevelSize: r,
        bevelOffset: -r,
        bevelSegments: 2,
        curveSegments: 18,
      });
      geo.translate(0, 0, r);
      geometries.push(geo);

      // Grain follows the long axis of the face.
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const across = bb.max.x - bb.min.x > (bb.max.y - bb.min.y) * 1.15;
      const faceMat = part.face === "edge" ? mats.endGrain : across ? mats.faceAcross : mats.face;
      const sideMat = part.band === "wood" ? mats.face : mats.edge;
      const mesh = new THREE.Mesh(geo, [faceMat, sideMat]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // Painted details (the duck's eye, coloured holds, crayon tips…) sit just proud of the face.
    for (const detail of part.details ?? []) {
      const hex = detail.fill ? PAINT[detail.fill] : undefined;
      if (!hex) continue;
      const dShapes = shapesFrom(detail.d);
      if (!dShapes.length) continue;
      const g = new THREE.ShapeGeometry(dShapes, 12);
      geometries.push(g);
      const mesh = new THREE.Mesh(g, mats.paint(hex));
      mesh.position.z = -0.25;
      mesh.scale.z = -1; // face the viewer (the visible face is at depth 0)
      group.add(mesh);
    }
    return group;
  }

  if (part.kind === "rod") {
    const from = new THREE.Vector3(...part.from);
    const to = new THREE.Vector3(...part.to);
    const len = from.distanceTo(to);
    const geo = new THREE.CylinderGeometry(part.d / 2, part.d / 2, len, 32, 1);
    geometries.push(geo);
    const mesh = new THREE.Mesh(geo, [mats.rod, mats.endGrain, mats.endGrain]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const holder = new THREE.Group();
    holder.position.copy(from).add(to).multiplyScalar(0.5);
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    holder.add(mesh);
    return holder;
  }

  if (part.kind === "cord") {
    const pts = part.points.map((p) => new THREE.Vector3(...p));
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i + 3 < pts.length; i += 3) {
      path.add(new THREE.CubicBezierCurve3(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]));
    }
    if (!path.curves.length) return null;
    const geo = new THREE.TubeGeometry(path, 64, 1.8, 8, false);
    geometries.push(geo);
    const mesh = new THREE.Mesh(geo, part.tone && PAINT[part.tone] ? mats.paint(PAINT[part.tone]!) : mats.cord);
    mesh.castShadow = true;
    return mesh;
  }
  return null;
}

/*
 * Catalogue models. Most keys are a single manifest; the room set is staged from the real
 * pieces it contains (its 2D manifest is a flat composition that only works as a drawing).
 */
type Placement = { key: string; x: number; z: number; rotY?: number };

const ROOM_SET: Placement[] = [
  { key: "montessori-shelf", x: 0, z: 650 },
  { key: "front-facing-bookshelf", x: 980, z: 820 },
  { key: "wall-art-roll", x: 1660, z: 900 },
  { key: "kids-table-chair", x: 350, z: 0 },
  { key: "learning-tower", x: 1750, z: 120, rotY: -0.35 },
];

export function buildCatalogModel(
  key: string,
  getManifest: (key: string) => Manifest | null,
  opts: { finish?: Finish; pose?: string } = {},
): ProductModel | null {
  if (key !== "room-set") {
    const m = getManifest(key);
    return m ? buildProductModel(m, opts) : null;
  }
  const root = new THREE.Group();
  root.name = key;
  const parts = ROOM_SET.flatMap((p) => {
    const m = getManifest(p.key);
    if (!m) return [];
    const model = buildProductModel(m, opts);
    const holder = new THREE.Group();
    holder.position.set(p.x / 1000, 0, -p.z / 1000);
    holder.rotation.y = p.rotY ?? 0;
    holder.add(model.root);
    root.add(holder);
    return [model];
  });
  const box = new THREE.Box3().setFromObject(root);
  return {
    root,
    size: box.getSize(new THREE.Vector3()),
    setExplode: (t) => parts.forEach((p) => p.setExplode(t)),
    setPlatformLevel: (mm) => parts.forEach((p) => p.setPlatformLevel(mm)),
    dispose: () => parts.forEach((p) => p.dispose()),
  };
}
