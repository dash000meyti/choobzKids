import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export async function GET() {
  await connection(); // never prerender the health check
  db.get(sql`select 1`);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
