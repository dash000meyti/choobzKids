/*
 * Runs in the background after container start (docker/entrypoint.sh): waits for the server,
 * then revalidates tag 'site' so build-time pages re-render from the volume DB (TECH.md §2.9).
 */
const port = process.env.PORT ?? "3000";
const base = `http://127.0.0.1:${port}`;

for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(`${base}/api/health`)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const res = await fetch(`${base}/api/revalidate`, {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET ?? ""}`, "content-type": "application/json" },
  body: JSON.stringify({ tags: ["site"] }),
});
console.log("[postdeploy] revalidate", res.status);

// Warm the most important URLs so first visitors never pay the blocking render.
for (const p of ["/", "/shop", "/mag"]) {
  await fetch(base + p).catch(() => undefined);
}
export {};
