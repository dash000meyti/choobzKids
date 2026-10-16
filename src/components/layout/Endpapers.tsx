import type { CSSProperties } from "react";
import { EndpaperPattern } from "@/components/illustrations/EndpaperPattern";
import { fnv1a } from "@/lib/utils";
import styles from "./Endpapers.module.css";

/*
 * The top of the night footer (DESIGN.md §4.6): the 48px endpaper strip of ply-cut toys, then a
 * strip of night sky with paper stars and, at inline-end, a little learning-tower house with its
 * window lit: where Tati's thread leads. Fixed night colours; purely decorative.
 * Stars twinkle on three periods (4 s, 6.5 s, 9 s; opacity only) where motion is allowed.
 */

const PERIODS = [4, 6.5, 9];

/* Positions come from a hash, never Math.random, so every render draws the same sky. */
const STARS = Array.from({ length: 22 }, (_, i) => {
  const h = fnv1a(`footer-star-${i}`);
  return {
    x: 3 + (h % 770) / 10, // 3–80% from inline-start, leaving the house its corner
    y: 10 + ((h >>> 10) % 70), // 10–80% down the strip
    size: (h >>> 17) % 3 === 0 ? 3 : 2,
    period: PERIODS[i % PERIODS.length],
    delay: ((h >>> 20) % 40) / 10,
  };
});

function LitHouse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="footer-house-glow">
          <stop offset="0" stopColor="#F2B93B" stopOpacity="0.5" />
          <stop offset="1" stopColor="#F2B93B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="36" cy="36" r="26" fill="url(#footer-house-glow)" />
      {/* A learning tower with a roof: two rails, steps, and the window between them. */}
      <path d="M12 27 36 7l24 20" fill="none" stroke="#E8D3AE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 25h34v37H19z" fill="#D9BE92" stroke="#9C6B3A" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M19 49h34M19 56h34" stroke="#9C6B3A" strokeWidth="1.5" />
      <rect x="29" y="31" width="14" height="12" rx="2" fill="#F2B93B" />
      <path d="M36 31v12M29 37h14" stroke="#C8955A" strokeWidth="1.2" />
    </svg>
  );
}

export function Endpapers() {
  return (
    <div aria-hidden="true">
      <EndpaperPattern />
      <div className={styles.sky}>
        {STARS.map((star, i) => (
          <span
            key={i}
            className={styles.star}
            style={
              {
                insetInlineStart: `${star.x}%`,
                insetBlockStart: `${star.y}%`,
                inlineSize: star.size,
                blockSize: star.size,
                "--twinkle": `${star.period}s`,
                "--twinkle-delay": `-${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}
        <LitHouse className={styles.house} />
      </div>
    </div>
  );
}
