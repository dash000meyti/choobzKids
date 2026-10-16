import { KraftTag } from "./KraftTag";

/*
 * «نمونه» on seed sample content (reviews, UGC) outside production (BUILD-GUIDE "Content honesty").
 * The caller decides visibility with IS_PRODUCTION_CONTENT; samples never render in production.
 */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <KraftTag size="sm" className={className}>
      نمونه
    </KraftTag>
  );
}
