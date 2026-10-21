import fs from "node:fs/promises";
import path from "node:path";

/** Dev-only: saves a rendered PNG from /studio into public/renders/raw. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { name, dataUrl } = (await req.json()) as { name: string; dataUrl: string };
  if (!/^[a-z0-9-]+$/.test(name) || !dataUrl.startsWith("data:image/png;base64,")) {
    return new Response("Bad request", { status: 400 });
  }
  const dir = path.join(process.cwd(), "public", "renders", "raw");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}.png`), Buffer.from(dataUrl.split(",")[1], "base64"));
  return Response.json({ ok: true });
}
