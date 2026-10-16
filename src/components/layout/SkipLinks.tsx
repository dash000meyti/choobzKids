/*
 * Skip links (DESIGN.md §5, §11.2): the first two stops for keyboard and switch users,
 * «رفتن به محتوای اصلی» and «مستقیم به فروشگاه». Hidden until focused, then a raised slip at
 * the top inline-start corner, above everything.
 */

const LINK =
  "fixed start-3 top-3 z-(--z-skip) -translate-y-[200%] rounded-bit-sm bg-raised px-4 py-3 text-sm font-bold text-ink shadow-ply " +
  "focus-visible:translate-y-0 focus:translate-y-0";

export function SkipLinks() {
  return (
    <div>
      <a href="#main" className={LINK}>
        رفتن به محتوای اصلی
      </a>
      <a href="/shop" className={LINK}>
        مستقیم به فروشگاه
      </a>
    </div>
  );
}
