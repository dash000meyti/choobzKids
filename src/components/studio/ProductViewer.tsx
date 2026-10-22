"use client";

import { useEffect, useRef, useState } from "react";
import { canAutoRunLive3D, nextFrame, whenIdle } from "@/components/three/capable";

/*
 * «از هر زاویه» — an interactive 3D view of the product built from its manifest: drag to turn,
 * buttons for the assembled / exploded state and the finish. The server-rendered still (children)
 * is the poster. three.js (~180 KB gzip) loads only when the visitor taps «نمای سه‌بعدی», or by
 * itself on desktop-class machines once the viewer is on screen; hovering the button warms it.
 */

const warm = () => Promise.all([import("three"), import("@/components/three/studio"), import("@/components/three/model")]);

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
  const [requested, setRequested] = useState(false);
  const [failed, setFailed] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [finish, setFinish] = useState<Finish>("natural");

  // Desktop-class machines start by themselves once the viewer is actually on screen.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || requested || !canAutoRunLive3D()) return;
    let cancelIdle = () => {};
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cancelIdle = whenIdle(() => setRequested(true));
    });
    io.observe(host);
    return () => {
      io.disconnect();
      cancelIdle();
    };
  }, [requested]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !requested) return;

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
      // Each step gets a frame of its own, so start-up never blocks scrolling for long.
      await nextFrame();
      if (disposed) return;
      const studio = createStudio(canvas);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      await nextFrame();
      let model = disposed ? null : buildCatalogModel(productKey, getManifest);
      if (!model) {
        studio.dispose();
        return;
      }
      studio.stage.add(model.root);
      model.setExplode(1);
      const size = () => {
        const r = canvas.getBoundingClientRect();
        studio.resize(Math.max(1, r.width), Math.max(1, r.height));
      };
      size();
      studio.frame(model.root, "hero", 1.0);
      model.setExplode(0);
      await studio.compile();
      await studio.updateShadow();
      if (disposed) {
        model.dispose();
        studio.dispose();
        return;
      }

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
      // One slow turn to show it is alive, then rest: no rendering while nobody touches it.
      const stopSpin = setTimeout(() => (controls.autoRotate = false), 9000);

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
          studio.shadowsChanged();
          // The contact shadow reads pixels back from the GPU: refresh it when the parts come to rest.
          if (Math.abs(target - explode) <= 0.001) void studio.updateShadow().then(kick);
        }
        studio.render();
        // Through kick() so at most one frame is ever queued: controls.update() above fires
        // "change" (→ kick) while auto-rotating, and scheduling here as well doubled the frames
        // queued every frame (1, 2, 4, 8…) until the page froze and the GPU dropped the context.
        if (visible && (controls.autoRotate || moving || Math.abs(target - explode) > 0.001)) kick();
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
          void studio.updateShadow().then(kick);
        },
      };

      const onResize = () => {
        size();
        kick();
      };
      window.addEventListener("resize", onResize);
      cleanup = () => {
        clearTimeout(stopSpin);
        window.removeEventListener("resize", onResize);
        io.disconnect();
        cancelAnimationFrame(raf);
        controls.dispose();
        model?.dispose();
        studio.dispose();
      };
    };

    // A GPU that drops the context (or refuses one) leaves the still in place instead of a blank box.
    const onLost = () => {
      setLive(false);
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    start().catch(onLost);
    return () => {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      cleanup();
    };
  }, [productKey, requested]);

  const segment = "h-9 rounded-full px-4 text-sm font-semibold transition-colors";
  return (
    <div ref={hostRef}>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-[56rem]">
        <div className="absolute inset-0 grid place-items-center transition-opacity duration-500" style={{ opacity: live ? 0 : 1 }}>
          {children}
        </div>
        {!live && !failed ? (
          <button
            type="button"
            onClick={() => setRequested(true)}
            onPointerEnter={() => void warm()}
            onFocus={() => void warm()}
            onTouchStart={() => void warm()}
            disabled={requested}
            className="absolute inset-x-0 bottom-2 mx-auto flex h-11 w-fit items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-bg transition-opacity disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
              <path d="M4 7.5 12 12l8-4.5M12 12v9" />
            </svg>
            {requested ? "در حال آماده‌سازی…" : "نمای سه‌بعدی"}
          </button>
        ) : null}
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
