/*
 * Runs in the background after container start (docker/entrypoint.sh): waits for the server,
 * revalidates tag 'site' so build-time pages re-render from the volume DB (TECH.md §2.9), then
 * warms the pages and the image optimizer cache so first visitors never wait for either.
 *
 * Image warm-up: every /_next/image variant in every sitemap page's srcset is requested once as
 * AVIF (what current browsers get) and once as WebP, one at a time so real visitors keep the CPU.
 * The cache lives on the volume (/data/cache/images), so after the first deploy almost every
 * request is already a hit and the pass finishes in seconds.
 */
const port = process.env.PORT ?? "3000";
const base = `http://127.0.0.1:${port}`;
const log = (...args: unknown[]) => console.log("[postdeploy]", ...args);
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(`${base}/api/health`)).ok) break;
  } catch {}
  await pause(500);
}

const res = await fetch(`${base}/api/revalidate`, {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET ?? ""}`, "content-type": "application/json" },
  body: JSON.stringify({ tags: ["site"] }),
});
log("revalidate", res.status);

const text = async (path: string) => {
  try {
    const r = await fetch(base + path);
    return r.ok ? await r.text() : "";
  } catch {
    return "";
  }
};

/** Paths from the sitemap index and its child sitemaps (absolute URLs → paths on this server). */
async function sitemapPaths(): Promise<string[]> {
  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const children = locs(await text("/sitemap.xml"));
  const pages = new Set<string>(["/", "/shop", "/mag"]);
  for (const child of children) for (const p of locs(await text(child))) pages.add(p);
  return [...pages];
}

const pages = await sitemapPaths();
const variants = new Set<string>();
for (const page of pages) {
  const html = await text(page);
  for (const m of html.matchAll(/\/_next\/image\?[^"\s,]+/g)) variants.add(m[0].replaceAll("&amp;", "&"));
}
log(`pages warmed: ${pages.length}, image variants: ${variants.size}`);

const started = Date.now();
let done = 0;
for (const accept of ["image/avif,image/webp,*/*", "image/webp,*/*"]) {
  for (const v of variants) {
    try {
      const r = await fetch(base + v, { headers: { accept } });
      await r.arrayBuffer();
    } catch {}
    if (++done % 200 === 0) log(`images ${done}/${variants.size * 2}`);
  }
}
log(`images warmed in ${Math.round((Date.now() - started) / 1000)}s`);
export {};
