"use client";

import { useEffect, useRef, useState } from "react";
import { getManifest } from "@/components/illustrations/manifests";
import type { Finish } from "./materials";
import { buildCatalogModel, type ProductModel } from "./model";
import { createStudio, type Angle, type Studio } from "./studio";

/*
 * Dev-only render bench (/studio). Renders a product at catalogue resolution with a transparent
 * background and saves it to public/renders/raw/{key}-{angle}[-{finish}][-exploded].png.
 */

const ANGLES: Angle[] = ["hero", "front", "side", "top", "low"];
const W = 1600;
const H = 2000;

export function StudioBench({ keys }: { keys: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<Studio | null>(null);
  const modelRef = useRef<ProductModel | null>(null);
  const [key, setKey] = useState(keys[0]);
  const [angle, setAngle] = useState<Angle>("hero");
  const [finish, setFinish] = useState<Finish>("natural");
  const [explode, setExplode] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const studio = createStudio(canvasRef.current!, { pixelRatio: 1, preserveDrawingBuffer: true, ao: true });
    studio.resize(W, H);
    studioRef.current = studio;
    (window as unknown as { __studio: Studio }).__studio = studio;
    return () => studio.dispose();
  }, []);

  const show = (k: string, a: Angle, f: Finish, e: number) => {
    const studio = studioRef.current;
    if (!studio) return;
    const model = buildCatalogModel(k, getManifest, { finish: f });
    if (!model) return;
    modelRef.current?.dispose();
    studio.stage.clear();
    model.setExplode(e);
    studio.stage.add(model.root);
    modelRef.current = model;
    studio.frame(model.root, a);
    studio.updateShadow();
    studio.render();
  };

  useEffect(() => show(key, angle, finish, explode), [key, angle, finish, explode]);

  const save = async (name: string) => {
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    await fetch("/api/studio", { method: "POST", body: JSON.stringify({ name, dataUrl }) });
    setLog((l) => [...l, name]);
  };

  const renderAll = async () => {
    for (const k of keys) {
      for (const a of ANGLES) {
        show(k, a, "natural", 0);
        await save(`${k}-${a}`);
      }
      show(k, "hero", "natural", 1);
      await save(`${k}-hero-exploded`);
      for (const f of ["white"] as Finish[]) {
        show(k, "hero", f, 0);
        await save(`${k}-hero-${f}`);
      }
    }
    show(key, angle, finish, explode);
  };

  return (
    <div dir="ltr" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, padding: 16, background: "#f5f5f7", minHeight: "100vh", fontFamily: "system-ui" }}>
      <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
        <select value={key} onChange={(e) => setKey(e.target.value)}>
          {keys.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select value={angle} onChange={(e) => setAngle(e.target.value as Angle)}>
          {ANGLES.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select value={finish} onChange={(e) => setFinish(e.target.value as Finish)}>
          {(["natural", "white", "sage", "terracotta", "sky", "mustard"] as Finish[]).map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <label>
          explode {explode}
          <input type="range" min={0} max={1} step={0.05} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
        </label>
        <button onClick={() => save(`${key}-${angle}${finish !== "natural" ? `-${finish}` : ""}${explode ? "-exploded" : ""}`)}>save</button>
        <button id="render-all" onClick={renderAll}>render all</button>
        <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 640, aspectRatio: "4 / 5", background: "#fff", borderRadius: 12 }} />
    </div>
  );
}
