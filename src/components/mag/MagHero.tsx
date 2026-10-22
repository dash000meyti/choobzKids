import Form from "next/form";
import { cn } from "@/lib/utils";

/*
 * «مجله چوبز» masthead, Studio style: eyebrow, a large headline, one line of promise and a
 * search field (a plain GET form to /search, so it works without JS).
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
    <header className={cn("pb-10 pt-6 text-center lg:pb-14 lg:pt-10", className)}>
      <p className="eyebrow">مجله چوبز</p>
      <h1 className="headline mx-auto mt-2 max-w-[48rem] text-3xl lg:text-[4.5rem]">{MAG_H1}</h1>
      <p className="mx-auto mt-4 max-w-[40rem] text-lead text-muted">
        راهنماهای ساده و منبع‌دار برای پدر و مادرها؛ از مونته‌سوری و پیکلر تا چیدمان اتاق، بازی آزاد و هدیهٔ کودک ۰ تا ۶
        سال.
      </p>
      <Form action="/search" prefetch={false} role="search" aria-label="جستجو در مجله" className="mx-auto mt-8 flex max-w-[34rem] items-center gap-2">
        <label htmlFor="mag-ask" className="sr-only">
          سؤالتان را بپرسید
        </label>
        <input
          id="mag-ask"
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={80}
          placeholder="مثلاً: برج یادگیری از چند سالگی؟"
          className="h-12 min-w-0 flex-1 rounded-full bg-surface px-5 text-base text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus"
        />
        <button type="submit" className="h-12 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent">
          جستجو
        </button>
      </Form>
    </header>
  );
}
