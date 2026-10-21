import { cn } from "@/lib/utils";

/*
 * «نمونه» on seed sample content (reviews, UGC) outside production (BUILD-GUIDE "Content honesty").
 * The caller decides visibility with IS_PRODUCTION_CONTENT; samples never render in production.
 */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full bg-raised px-2.5 text-xs font-semibold text-muted ring-1 ring-line ring-inset",
        className,
      )}
    >
      نمونه
    </span>
  );
}
