"use client";

import { useEffect, useRef, useState } from "react";

/*
 * «از هر زاویه» — an interactive 3D view of the product built from its manifest: drag to turn,
 * buttons for the assembled / exploded state and the finish. three.js loads only when the viewer
 * nears the viewport; the server-rendered still (children) is the poster and the fallback.
 */

type Finish = "natural" | "white";

export function ProductViewer({
  productKey,
  finishes = ["natural"],
  children,
}: {
  productKey: string;
  finishes?: Finish[];
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ setExplode: (v: boolean) => void; setFinish: (f: Finish) => void } | null>(null);
  const [live, setLive] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [finish, setFinish] = useState<Finish>("natural");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    if ("lite" in document.documentElement.dataset) return;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const [THREE, { OrbitControls }, { createStudio }, { buildCatalogModel }, { getManifest }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
        import("@/components/three/studio"),
        import("@/components/three/model"),
        import("@/components/illustrations/manifests"),
      ]);
      if (disposed) return;
      const studio = createStudio(canvas);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let model = buildCatalogModel(productKey, getManifest);
      if (!model) return;
      studio.stage.add(model.root);
      model.setExplode(1);
      const size = () => {
        const r = canvas.getBoundingClientRect();
        studio.resize(Math.max(1, r.width), Math.max(1, r.height));
      };
      size();
      studio.frame(model.root, "hero", 1.0);
      model.setExplode(0);
      studio.updateShadow();

      const controls = new OrbitControls(studio.camera, canvas);
      controls.target.copy(new THREE.Box3().setFromObject(model.root).getCenter(new THREE.Vector3()));
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
      controls.autoRotate = !reduce;
      controls.autoRotateSpeed = 0.6;
      controls.update();
      controls.addEventListener("start", () => (controls.autoRotate = false));

      let explode = 0;
      let target = 0;
      let raf = 0;
      let visible = true;
      const tick = () => {
        raf = 0;
        const moving = controls.update();
        if (Math.abs(target - explode) > 0.001) {
          explode += (target - explode) * (reduce ? 1 : 0.12);
          model!.setExplode(explode);
          studio.updateShadow();
        }
        studio.render();
        if (visible && (controls.autoRotate || moving || Math.abs(target - explode) > 0.001)) raf = requestAnimationFrame(tick);
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      controls.addEventListener("change", kick);
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) kick();
      });
      io.observe(canvas);
      kick();
      setLive(true);

      api.current = {
        setExplode(v) {
          target = v ? 1 : 0;
          kick();
        },
        setFinish(f) {
          const next = buildCatalogModel(productKey, getManifest, { finish: f });
          if (!next || !model) return;
          next.setExplode(explode);
          next.root.rotation.copy(model.root.rotation);
          studio.stage.remove(model.root);
          model.dispose();
          model = next;
          studio.stage.add(model.root);
          studio.updateShadow();
          kick();
        },
      };

      const onResize = () => {
        size();
        kick();
      };
      window.addEventListener("resize", onResize);
      cleanup = () => {
        window.removeEventListener("resize", onResize);
        io.disconnect();
        cancelAnimationFrame(raf);
        controls.dispose();
        model?.dispose();
        studio.dispose();
      };
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(host);
    return () => {
      disposed = true;
      io.disconnect();
      cleanup();
    };
  }, [productKey]);

  const segment = "h-9 rounded-full px-4 text-sm font-semibold transition-colors";
  return (
    <div ref={hostRef}>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-[56rem]">
        <div className="absolute inset-0 grid place-items-center transition-opacity duration-500" style={{ opacity: live ? 0 : 1 }}>
          {children}
        </div>
        <canvas
          ref={canvasRef}
          aria-label="نمای سه‌بعدی؛ برای چرخاندن بکشید"
          className="absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-500 active:cursor-grabbing"
          style={{ opacity: live ? 1 : 0 }}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3" hidden={!live}>
        <div role="group" aria-label="نما" className="flex rounded-full bg-surface p-1">
          {[
            { v: false, label: "مونتاژشده" },
            { v: true, label: "نمای انفجاری" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={exploded === o.v}
              onClick={() => {
                setExploded(o.v);
                api.current?.setExplode(o.v);
              }}
              className={`${segment} ${exploded === o.v ? "bg-bg text-ink shadow-sm" : "text-muted"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {finishes.length > 1 && (
          <div role="group" aria-label="رنگ" className="flex rounded-full bg-surface p-1">
            {finishes.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={finish === f}
                onClick={() => {
                  setFinish(f);
                  api.current?.setFinish(f);
                }}
                className={`${segment} ${finish === f ? "bg-bg text-ink shadow-sm" : "text-muted"}`}
              >
                {f === "natural" ? "چوب طبیعی" : "سفید"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
