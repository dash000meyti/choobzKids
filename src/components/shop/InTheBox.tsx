import Link from "@/components/ui/Link";
import { illustrationSize } from "@/components/illustrations/sizes";
import type { ProductPageData } from "@/db/queries/product";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";

/*
 * «توی جعبه چی هست؟» (DESIGN.md §6.3 block 15): the box contents beside a small exploded drawing,
 * the assembly time when the workshop has confirmed it ⚑ (`assemblyMinutes`), and the assembly
 * guide when a how-to post features this product.
 */

type InTheBoxProps = {
  product: Pick<ProductPageData["product"], "name" | "illustration" | "inTheBox" | "assemblyMinutes">;
  /** Slug of a how-to post for this product, if one exists. */
  howtoSlug?: string | null;
  className?: string;
};

export function InTheBox({ product, howtoSlug, className }: InTheBoxProps) {
  if (!product.inTheBox.length) return null;
  const key = product.illustration;
  const drawing = key ? illustrationSize(key, "exploded") : null;
  return (
    <section aria-labelledby="box-title" className={cn("flex flex-col gap-5", className)}>
      <SectionHeader id="box-title" size="content" title="توی جعبه چی هست؟" />
      <div className="flex items-start gap-5">
        <ul className="flex flex-1 flex-col gap-2.5">
          {product.inTheBox.map((item) => (
            <li key={item} className="flex items-start gap-3 text-base text-ink">
              <span aria-hidden="true" className="mt-1 grid size-6 shrink-0 place-items-center rounded-bit-xs bg-surface text-ink">
                <Icon name="parcel" className="size-4" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        {key && drawing ? (
          <span className="hidden w-32 shrink-0 rounded-bit bg-surface p-3 sm:block lg:w-40">
            {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
            <img
              src={illustrationUrl(key, "exploded")}
              width={drawing.width}
              height={drawing.height}
              alt={`قطعه‌های ${product.name}، جدا از هم`}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </span>
        ) : null}
      </div>
      {product.assemblyMinutes || howtoSlug ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink">
          {product.assemblyMinutes ? (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Icon name="clock" className="size-5 text-success" />
              زمان نصب: حدود {toFaDigits(product.assemblyMinutes)} دقیقه
            </span>
          ) : null}
          {howtoSlug ? (
            <Link href={`/mag/${howtoSlug}`} className="link-mark font-semibold">
              راهنمای نصب گام‌به‌گام ←
            </Link>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
