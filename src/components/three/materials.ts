import * as THREE from "three";

/*
 * Procedural birch-plywood materials. Everything is generated on a canvas at runtime, so the
 * 3D viewer ships no texture downloads. Units: the model is in millimetres and texture repeat
 * is expressed per millimetre (ExtrudeGeometry's UVs are in shape units).
 */

export type Finish = "natural" | "white" | "sage" | "terracotta" | "sky" | "mustard";

const FACE: Record<Finish, string> = {
  natural: "#EAD7B6",
  white: "#F4F0E8",
  sage: "#C9D7C2",
  terracotta: "#E3B9A4",
  sky: "#C4D9E3",
  mustard: "#EBCF86",
};

/** Small deterministic PRNG so every build renders the same board. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

/** Rotary-cut birch veneer: soft long grain, faint flecks, gentle tone drift. */
function veneerCanvas(base: string, seed: number, painted: boolean) {
  const [c, g] = canvas(1024, 1024);
  const rnd = mulberry32(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 1024);

  // Broad, very soft tone bands (figure).
  for (let i = 0; i < 9; i++) {
    const x = rnd() * 1024;
    const w = 80 + rnd() * 220;
    const grad = g.createLinearGradient(x - w, 0, x + w, 0);
    const a = painted ? 0.025 : 0.06 + rnd() * 0.05;
    grad.addColorStop(0, "rgba(150,100,50,0)");
    grad.addColorStop(0.5, `rgba(150,100,50,${a})`);
    grad.addColorStop(1, "rgba(150,100,50,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 1024);
  }

  // Fine grain lines running the long axis (v), wavering a little.
  const lines = painted ? 70 : 170;
  for (let i = 0; i < lines; i++) {
    const x0 = rnd() * 1024;
    const amp = 2 + rnd() * 10;
    const freq = 0.002 + rnd() * 0.006;
    const phase = rnd() * Math.PI * 2;
    g.strokeStyle = `rgba(120,78,40,${(painted ? 0.02 : 0.08) + rnd() * (painted ? 0.03 : 0.12)})`;
    g.lineWidth = 0.6 + rnd() * 1.6;
    g.beginPath();
    for (let y = -8; y <= 1032; y += 8) {
      const x = x0 + Math.sin(y * freq + phase) * amp;
      if (y < 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  // Birch "flecks" (pith flecks / small knots), very subtle.
  if (!painted) {
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 1024;
      const y = rnd() * 1024;
      g.fillStyle = `rgba(110,70,35,${0.06 + rnd() * 0.08})`;
      g.beginPath();
      g.ellipse(x, y, 1 + rnd() * 2, 3 + rnd() * 9, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  return c;
}

/** Laminated edge: alternating light veneers and thin darker glue lines (≈1.4 mm per ply). */
function plyEdgeCanvas(seed: number) {
  const [c, g] = canvas(256, 256);
  const rnd = mulberry32(seed);
  const plies = 8; // one texture tile = 8 plies
  const h = 256 / plies;
  for (let i = 0; i < plies; i++) {
    const light = i % 2 === 0;
    const tone = light ? 240 - rnd() * 6 : 218 - rnd() * 12;
    g.fillStyle = `rgb(${tone},${Math.round(tone * 0.88)},${Math.round(tone * 0.72)})`;
    g.fillRect(0, i * h, 256, h);
    // Glue line between plies.
    g.fillStyle = "rgba(92,58,28,0.85)";
    g.fillRect(0, i * h, 256, 2.2);
  }
  // Fine end-grain texture.
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(110,70,35,${rnd() * 0.12})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 0.8);
  }
  return c;
}

function texture(c: HTMLCanvasElement, repeatPerMm: [number, number], color: boolean) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatPerMm[0], repeatPerMm[1]);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type WoodMaterials = {
  face: THREE.MeshPhysicalMaterial;
  /** Face with the grain turned 90° (horizontal parts). */
  faceAcross: THREE.MeshPhysicalMaterial;
  edge: THREE.MeshPhysicalMaterial;
  rod: THREE.MeshPhysicalMaterial;
  endGrain: THREE.MeshPhysicalMaterial;
  cord: THREE.MeshPhysicalMaterial;
  paint: (hex: string) => THREE.MeshPhysicalMaterial;
  dispose: () => void;
};

const cache = new Map<Finish, WoodMaterials>();

export function woodMaterials(finish: Finish = "natural"): WoodMaterials {
  const hit = cache.get(finish);
  if (hit) return hit;
  const painted = finish !== "natural";
  const veneer = veneerCanvas(FACE[finish], 7, painted);
  const ply = plyEdgeCanvas(11);

  // 1024 px of veneer covers ~700 mm of board.
  const faceMap = texture(veneer, [1 / 700, 1 / 700], true);
  const acrossMap = faceMap.clone();
  acrossMap.rotation = Math.PI / 2;
  acrossMap.needsUpdate = true;
  // Extrude side UVs: u runs along the contour, v through the thickness (mm). 8 plies ≈ 11 mm.
  const edgeMap = texture(ply, [1 / 300, 1 / 11], true);

  const common = { roughness: painted ? 0.62 : 0.55, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color("#fff3df") };
  const face = new THREE.MeshPhysicalMaterial({ ...common, map: faceMap, clearcoat: painted ? 0.15 : 0.08, clearcoatRoughness: 0.6 });
  const faceAcross = face.clone();
  faceAcross.map = acrossMap;
  const edge = new THREE.MeshPhysicalMaterial({ roughness: 0.7, map: edgeMap, sheen: 0.2 });
  const rod = new THREE.MeshPhysicalMaterial({ ...common, color: painted ? FACE[finish] : "#E6CFA8", map: faceMap });
  const endGrain = new THREE.MeshPhysicalMaterial({ roughness: 0.8, color: "#D8B98A" });
  const cord = new THREE.MeshPhysicalMaterial({ roughness: 0.9, color: "#B23A26", sheen: 0.6, sheenColor: new THREE.Color("#ff9b85") });

  const paints = new Map<string, THREE.MeshPhysicalMaterial>();
  const paint = (hex: string) => {
    let m = paints.get(hex);
    if (!m) {
      m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.55, clearcoat: 0.2 });
      paints.set(hex, m);
    }
    return m;
  };

  const set: WoodMaterials = {
    face,
    faceAcross,
    edge,
    rod,
    endGrain,
    cord,
    paint,
    dispose() {
      for (const m of [face, faceAcross, edge, rod, endGrain, cord, ...paints.values()]) m.dispose();
      for (const t of [faceMap, acrossMap, edgeMap]) t.dispose();
      cache.delete(finish);
    },
  };
  cache.set(finish, set);
  return set;
}
