import { Button } from "@/components/ui/Button";
import { CartGlyph } from "@/components/layout/NavIcons";
import { cn } from "@/lib/utils";
import type { CartConfig } from "./CartProvider";

/*
 * The empty cart (DESIGN.md §4.7, §11.2 #4): the only place «گاری» appears, as flavour; the
 * label everywhere else is «سبد خرید». Three category links get the mother moving again.
 */
export function EmptyCart({ links, className }: { links: CartConfig["emptyLinks"]; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-10 text-center", className)}>
      <CartGlyph parcels={0} className="size-20 text-muted" />
      <p className="max-w-[22ch] text-lead font-semibold text-ink">گاریِ تاتی خالیه! بریم یه چیزی بذاریم توش؟</p>
      {links.length ? (
        <ul className="flex flex-wrap justify-center gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <Button href={link.href} variant="wood" size="sm" grainSeed={link.href}>
                {link.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
