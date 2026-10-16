import type { NextConfig } from "next";

/*
 * See docs/TECH.md §2.2. The public site is fully static (ensureStatic = 'navigation' on the
 * (site) layout) and revalidated on demand by cache tags.
 */

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // eNamad's seal is the only third-party request (lazy, below the fold).
  "img-src 'self' data: blob: https://trustseal.enamad.ir",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.aparat.com https://trustseal.enamad.ir",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,

  cacheLife: {
    // CMS-edited content: on-demand tags do the real work; time-based is a safety net.
    content: { stale: 300, revalidate: 60 * 60 * 24, expire: 60 * 60 * 24 * 365 },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 320],
    qualities: [60, 75, 90],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    maximumDiskCacheSize: 2_000_000_000,
    maximumResponseBody: 15_000_000,
    localPatterns: [{ pathname: "/media/**", search: "" }],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  experimental: {
    // Tailwind output is small; inlining removes the render-blocking CSS request on first visits.
    inlineCss: true,
    agentUpgrade: process.env.CI ? false : "security",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          // Let nginx/Caddy stream responses instead of buffering them.
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
      {
        // /public files are not content-hashed: cache for a day, serve stale while revalidating.
        source: "/(textures|illustrations|light)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=2592000" }],
      },
      {
        source: "/(marks|icons|endpaper).svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=2592000" }],
      },
    ];
  },
};

export default nextConfig;
