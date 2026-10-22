import Link from "@/components/ui/Link";
import { cn } from "@/lib/utils";

/** The pair of calls to action under every product headline: «بیشتر بدانید ‹» and a «خرید» pill. */
export function Actions({
  learnHref,
  buyHref,
  buyLabel = "خرید",
  learnLabel = "بیشتر بدانید",
  className,
  prefetch,
}: {
  learnHref?: string;
  buyHref?: string;
  buyLabel?: string;
  learnLabel?: string;
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-6 gap-y-3", className)}>
      {buyHref && (
        <Link href={buyHref} prefetch={prefetch} className={pill("primary")}>
          {buyLabel}
        </Link>
      )}
      {learnHref && (
        <Link href={learnHref} prefetch={prefetch} className={pill("ghost")}>
          {learnLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * Pill buttons. Primary: ink fill (white on dark sections). Ghost: a quiet hairline ring in the
 * text colour, so it reads as well on white, studio grey and black tiles.
 */
export function pill(kind: "primary" | "ghost" | "light" = "primary", size: "md" | "lg" = "md") {
  return cn(
    "inline-flex items-center justify-center rounded-full font-medium transition-[background-color,color,box-shadow,transform] duration-300 ease-out active:scale-[0.97]",
    size === "lg" ? "h-[3.25rem] px-8 text-[1.0625rem]" : "h-11 px-6 text-[0.9375rem]",
    kind === "primary" && "bg-accent text-on-accent hover:bg-accent-press",
    kind === "ghost" &&
      "text-ink ring-1 ring-inset ring-[color-mix(in_oklab,var(--ink)_30%,transparent)] hover:bg-ink hover:text-bg hover:ring-ink",
    kind === "light" && "bg-bg text-ink hover:bg-surface",
  );
}
