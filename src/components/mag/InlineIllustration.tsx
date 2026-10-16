import { illustrationSize, illustrationSource } from "@/components/illustrations/sizes";
import type { IllustrationKey } from "@/db/seed/types";
import type { IllustrationView } from "@/lib/markdown";
import { illustrationUrl } from "@/lib/utils";

/*
 * `::illustration{name caption}` (docs/CONTENT-FORMAT.md): a manifest drawing as a plain lazy
 * <img> in a figure (DESIGN.md §10.3, never inline SVG in a body). The alt says what is drawn;
 * the caption, when given, says why it is here.
 */

const DRAWN: Record<IllustrationKey, string> = {
  "learning-tower": "برج یادگیری",
  "pikler-triangle": "مثلث پیکلر",
  "pikler-arch": "آرک پیکلر",
  "swedish-ladder": "نردبان سوئدی",
  "climbing-hex": "پنل‌های شش‌ضلعی صعود",
  "balance-board": "تخته تعادل",
  "front-facing-bookshelf": "کتابخانهٔ روبه‌رو",
  "wall-art-roll": "رول نقاشی دیواری",
  "kids-table-chair": "میز و صندلی کودک",
  "montessori-shelf": "قفسهٔ مونته‌سوری",
  "rainbow-stacker": "رنگین‌کمان چوبی",
  "duck-pull-toy": "اردک چرخ‌دار چوبی",
  "wooden-blocks": "مکعب‌های ساختنی چوبی",
  "room-set": "پک اتاق مونته‌سوری",
};

const VIEW_NOTE: Record<IllustrationView, string> = {
  assembled: "",
  exploded: "، قطعه‌ها جدا از هم",
  ortho: "، نمای روبه‌رو و کنار",
  flat: "، قطعه‌ها روی ورق",
};

type InlineIllustrationProps = {
  name: string;
  caption?: string;
  view?: IllustrationView;
};

export function InlineIllustration({ name, caption, view = "assembled" }: InlineIllustrationProps) {
  const subject = DRAWN[name as IllustrationKey];
  if (!subject) return null; // the pipeline already reported the unknown key
  const { width, height } = illustrationSize(name, view);
  const source = illustrationSource(name) === "dxf" ? "طرح دقیق از روی نقشهٔ برش" : "طرح از روی ابعاد واقعی";

  return (
    <figure data-block="">
      <div className="rounded-bit-lg bg-surface px-4 py-6 sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
        <img
          src={illustrationUrl(name, view)}
          width={width}
          height={height}
          alt={`طرح ${subject}${VIEW_NOTE[view]}`}
          loading="lazy"
          decoding="async"
          className="mx-auto block h-auto max-h-[22rem] w-auto max-w-full"
        />
      </div>
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-muted">
        {caption ? <span className="text-ink">{caption}</span> : null}
        <span className="text-xs">{source}</span>
      </figcaption>
    </figure>
  );
}
