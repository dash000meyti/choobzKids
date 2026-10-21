"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Live 3D assembly for the «از ورق تخته، تا اتاق کودک» story: the learning tower's real parts
 * fly together as the section scrolls. three.js and the model are imported only when the
 * section approaches the viewport, and never on reduced-motion / lite devices — the server-
 * rendered still (children) stays as the poster and fallback.
 */

type Props = { productKey: string; children: React.ReactNode };

export function AssemblyCanvas({ productKey, children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const root = document.documentElement;
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      root.dataset.motion === "reduce" ||
      "lite" in root.dataset;
    if (reduce) return;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const [{ createStudio }, { buildCatalogModel }, { getManifest }] = await Promise.all([
        import("@/components/three/studio"),
        import("@/components/three/model"),
        import("@/components/illustrations/manifests"),
      ]);
      if (disposed) return;
      const studio = createStudio(canvas);
      const model = buildCatalogModel(productKey, getManifest);
      if (!model) return;
      studio.stage.add(model.root);

      // Frame once on the exploded state so the camera never moves while parts travel.
      model.setExplode(1);
      const sizeCanvas = () => {
        const r = canvas.getBoundingClientRect();
        studio.resize(Math.max(1, r.width), Math.max(1, r.height));
        studio.frame(model.root, "hero", 1.02);
      };
      sizeCanvas();

      const section = host.closest("section") ?? host;
      let last = -1;
      let raf = 0;
      const draw = () => {
        raf = 0;
        const rect = section.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
        if (Math.abs(p - last) < 0.0005) return;
        last = p;
        // Exploded at the top, seated by 60% of the section, with a slow quarter-turn of the camera.
        const t = Math.min(1, Math.max(0, (p - 0.05) / 0.55));
        const ease = 1 - Math.pow(1 - t, 3);
        model.setExplode(1 - ease);
        model.root.rotation.y = (0.5 - p) * 0.6;
        studio.updateShadow();
        studio.render();
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(draw);
      };
      draw();
      setLive(true);

      const onResize = () => {
        sizeCanvas();
        last = -1;
        schedule();
      };
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", onResize);
      cleanup = () => {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        model.dispose();
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
      { rootMargin: "600px 0px" },
    );
    io.observe(host);
    return () => {
      disposed = true;
      io.disconnect();
      cleanup();
    };
  }, [productKey]);

  return (
    <div ref={hostRef} className="relative h-full w-full">
      <div className="absolute inset-0 grid place-items-center transition-opacity duration-500" style={{ opacity: live ? 0 : 1 }}>
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full transition-opacity duration-500"
        style={{ opacity: live ? 1 : 0 }}
      />
    </div>
  );
}
