import Form from "next/form";
import { Button } from "@/components/ui/Button";
import { Kicker } from "@/components/ui/Kicker";
import { TextInput } from "@/components/ui/TextInput";
import { cn } from "@/lib/utils";
import styles from "./MagHero.module.css";

/*
 * «مجله چوبز» masthead (DESIGN.md §7.1): a kraft notebook cover held shut by an elastic band,
 * a pencil resting on its lower edge, and a paper label carrying the two-layer heading. Under
 * the label, the big question box is a plain GET form to /search, so it works without JS.
 * The age tabs (AgeTabs) sit right below and overlap the cover's bottom edge.
 */

type MagHeroProps = {
  className?: string;
};

export const MAG_H1 = "مجله چوبز: بازی، رشد و اتاق کودک";

/** `<title>` and description of /mag (SEO.md §2.3); /mag/page/{n} appends « — صفحهٔ n». */
export const MAG_SEO = {
  title: "مجله چوبز | راهنمای بازی، رشد و اتاق کودک",
  description:
    "راهنماهای مونته‌سوری، پیکلر، بازی آزاد و چیدمان اتاق کودک ۰ تا ۶ سال؛ به زبان ساده، با منبع و با تجربهٔ کارگاه چوبز در ساخت وسایل چوبی کودک.",
} as const;

export function MagHero({ className }: MagHeroProps) {
  return (
    <header className={cn(styles.cover, className)}>
      <span aria-hidden="true" className={styles.band} />
      <div className={styles.label}>
        <Kicker decorative>
          بازی · کشف · رشد
        </Kicker>
        <h1 className="mt-1 font-display text-3xl text-ink text-balance">{MAG_H1}</h1>
        <p className="mt-3 max-w-prose text-base text-muted sm:text-lead">
          راهنماهای ساده و منبع‌دار برای مامان‌ها و باباها؛ از مونته‌سوری و پیکلر تا چیدمان اتاق، بازی آزاد و هدیهٔ
          کودک ۰ تا ۶ سال.
        </p>
      </div>

      <Form action="/search" role="search" aria-label="پرسیدن از مجله" className={styles.ask}>
        <label htmlFor="mag-ask" className="text-sm font-bold text-ink sm:text-base">
          سؤالت رو بپرس…
        </label>
        <div className="flex items-stretch gap-2">
          <TextInput
            id="mag-ask"
            name="q"
            type="search"
            size="lg"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
            placeholder="مثلاً: برج یادگیری از چند سالگی؟"
            className="min-w-0 flex-1 bg-raised"
          />
          <Button type="submit" variant="primary" size="lg" iconStart="search" className="max-sm:w-14! max-sm:px-0!">
            <span className="max-sm:sr-only">بپرس</span>
          </Button>
        </div>
      </Form>

      <Pencil className={styles.pencil} />
    </header>
  );
}

/* The pencil on the cover (story layer): birch body with honey stripes, graphite tip, eraser. */
function Pencil({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 220 20" className={className}>
      {/* Drawn tip-left; mirrored under LTR so the tip always points to inline-end. */}
      <path d="M2 10 22 3.5v13z" className={styles.wood} />
      <path d="M2 10 8.5 7.9v4.2z" className={styles.graphite} />
      <rect x="22" y="3.5" width="160" height="13" className={styles.body} />
      <rect x="22" y="7.2" width="160" height="1.6" className={styles.stripe} />
      <rect x="22" y="11.2" width="160" height="1.6" className={styles.stripe} />
      <rect x="182" y="3" width="14" height="14" rx="1.5" className={styles.ferrule} />
      <path d="M196 3h14a6 6 0 0 1 6 6v2a6 6 0 0 1-6 6h-14z" className={styles.eraser} />
    </svg>
  );
}
