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

export function pill(kind: "primary" | "ghost" | "light" = "primary", size: "md" | "lg" = "md") {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98]",
    size === "lg" ? "h-12 px-7 text-base" : "h-10 px-5 text-sm",
    kind === "primary" && "bg-accent text-on-accent hover:bg-accent-press",
    kind === "ghost" && "text-link ring-1 ring-current ring-inset hover:bg-link hover:text-bg",
    kind === "light" && "bg-bg text-ink hover:bg-surface",
  );
}
