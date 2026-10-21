import { getRoomPreset } from "@/db/queries/rooms";
import { tag } from "@/lib/cache-tags";
import { ogResponse } from "@/lib/og";

/*
 * Share card for one ready-made room: the preset name under a one-line kicker, rendered by the
 * sharp/Pango card (correct Persian shaping). Cached with the room tag, so a renamed preset
 * gets a fresh card.
 */

export const alt = "چیدمان آمادهٔ اتاق مونته‌سوری با وسایل چوبی چوبز";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const KICKER = "چیدمان آمادهٔ اتاق مونته‌سوری";

export default async function Image({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  const room = await getRoomPreset(preset);
  return ogResponse(room?.name ?? "اتاقش رو بچین", KICKER, [tag.rooms]);
}
