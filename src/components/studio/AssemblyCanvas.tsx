"use client";

import { useEffect, useRef, useState } from "react";
import { canAutoRunLive3D, motionAllowed, nextFrame, whenIdle } from "@/components/three/capable";

/*
 * The «از ورق تخته، تا اتاق کودک» stage. On desktop-class machines the learning tower's real parts
 * fly together in live 3D as the section scrolls (three.js loads only when the section is near).
 * Everywhere else — phones, tablets, slow networks — the same story plays with two studio stills,
 * the exploded parts crossfading into the assembled tower: no three.js, no main-thread cost.
 * With reduced motion the assembled still simply stands there.
 */

type Props = {
  productKey: string;
  /** The assembled still: poster, no-JS frame and the end of the image story. */
  children: React.ReactNode;
  /** The exploded still for the image story. */
  exploded: React.ReactNode;
};

/** Scroll progress of the story: the section while the stage is sticky (wide screens), else the stage itself. */
function progressOf(host: HTMLElement): number {
  const section = host.closest("section") ?? host;
  const vh = window.innerHeight;
  if (window.matchMedia("(min-width: 64rem)").matches) {
    const rect = section.getBoundingClientRect();
    const travel = rect.height - vh;
    return travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
  }
  // Stacked layout: starts as the stage's middle enters the screen, assembled by the time it is
  // a fifth from the top (the easing in the callers finishes it at ~60% of that travel).
  const rect = host.getBoundingClientRect();
  const mid = rect.top + rect.height / 2;
  return Math.min(1, Math.max(0, (vh - mid) / (vh * 0.8)));
}

export function AssemblyCanvas({ productKey, children, exploded }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"poster" | "images" | "live">("poster");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !motionAllowed()) return;

    let disposed = false;
    let cleanup = () => {};

    /* Image story: one CSS variable, written at most once per frame. */
    const startImages = () => {
      setMode("images");
      let raf = 0;
      const draw = () => {
        raf = 0;
        const p = progressOf(host);
        const t = Math.min(1, Math.max(0, (p - 0.05) / 0.55));
        host.style.setProperty("--assemble", (1 - Math.pow(1 - t, 3)).toFixed(3));
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(draw);
      };
      draw();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      cleanup = () => {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        cancelAnimationFrame(raf);
      };
    };

    /* Live 3D: built when idle, shaders compiled before the first frame, shadow refreshed on settle. */
    const startLive = async () => {
      const [{ createStudio }, { buildCatalogModel }, { getManifest }] = await Promise.all([
        import("@/components/three/studio"),
        import("@/components/three/model"),
        import("@/components/illustrations/manifests"),
      ]);
      if (disposed) return;
      // Each step gets a frame of its own, so start-up never blocks scrolling for long.
      await nextFrame();
      if (disposed) return;
      const studio = createStudio(canvas);
      await nextFrame();
      if (disposed) {
        studio.dispose();
        return;
      }
      const model = buildCatalogModel(productKey, getManifest);
      if (!model) {
        studio.dispose();
        startImages();
        return;
      }
      studio.stage.add(model.root);

      // Frame once on the exploded state so the camera never moves while parts travel.
      model.setExplode(1);
      const sizeCanvas = () => {
        const r = canvas.getBoundingClientRect();
        studio.resize(Math.max(1, r.width), Math.max(1, r.height));
        studio.frame(model.root, "hero", 1.02);
      };
      sizeCanvas();
      await studio.compile();
      if (disposed) {
        model.dispose();
        studio.dispose();
        return;
      }

      let last = -1;
      let raf = 0;
      let settle: ReturnType<typeof setTimeout> | undefined;
      const draw = () => {
        raf = 0;
        const p = progressOf(host);
        if (Math.abs(p - last) < 0.0005) return;
        last = p;
        // Exploded at the top, seated by 60% of the section, with a slow quarter-turn of the model.
        const t = Math.min(1, Math.max(0, (p - 0.05) / 0.55));
        model.setExplode(1 - (1 - Math.pow(1 - t, 3)));
        model.root.rotation.y = (0.5 - p) * 0.6;
        studio.shadowsChanged();
        studio.render();
        // The contact shadow reads pixels back from the GPU: refresh it once scrolling settles.
        clearTimeout(settle);
        settle = setTimeout(() => {
          void studio.updateShadow().then(() => !disposed && studio.render());
        }, 140);
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(draw);
      };
      await nextFrame();
      await studio.updateShadow();
      await nextFrame();
      if (disposed) {
        model.dispose();
        studio.dispose();
        return;
      }
      draw();
      setMode("live");

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
        clearTimeout(settle);
        model.dispose();
        studio.dispose();
      };
    };

    const live = canAutoRunLive3D();
    let cancelIdle = () => {};
    // If WebGL is refused or the GPU drops the context, the image story takes over.
    const fallBack = () => {
      if (disposed) return;
      cleanup();
      cleanup = () => {};
      startImages();
    };
    canvas.addEventListener("webglcontextlost", fallBack);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (live) cancelIdle = whenIdle(() => void startLive().catch(fallBack));
        else startImages();
      },
      { rootMargin: live ? "300px 0px" : "100px 0px" },
    );
    io.observe(host);
    return () => {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", fallBack);
      io.disconnect();
      cancelIdle();
      cleanup();
    };
  }, [productKey]);

  const images = mode === "images";
  return (
    <div ref={hostRef} className="relative h-full w-full" style={{ "--assemble": 0 } as React.CSSProperties}>
      {images ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center will-change-[opacity,transform]"
          style={{ opacity: "calc(1 - var(--assemble))", transform: "scale(calc(1.06 - var(--assemble) * 0.06))" }}
        >
          {exploded}
        </div>
      ) : null}
      <div
        className="absolute inset-0 grid place-items-center transition-opacity duration-500"
        style={mode === "live" ? { opacity: 0 } : images ? { opacity: "var(--assemble)", transition: "none" } : undefined}
      >
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full transition-opacity duration-500"
        style={{ opacity: mode === "live" ? 1 : 0 }}
      />
    </div>
  );
}
