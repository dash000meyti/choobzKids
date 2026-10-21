import type { ReactNode } from "react";
import { Bubble } from "@/components/ui/Bubble";
import { Mark } from "@/components/ui/Mark";

/*
 * «خلاصه در یک نگاه» (DESIGN.md §7.3 #5, SEO.md §4.3): the answer-first summary as a mint bubble,
 * 3–5 bullets that each stand on their own. The first bullet carries the defining sentence and
 * is prefixed «جواب کوتاه:» (the AEO target). The first key number gets the mother's mustard
 * swash — the one swash of the viewport.
 */

type TldrProps = {
  items: string[];
  className?: string;
};

/** A Persian number with its unit, e.g. «۱۸ ماهگی», «۸ تا ۱۸ ماهگی», «۸۴ درصد». */
const KEY_NUMBER =
  /[۰-۹]+(?:[٫٬][۰-۹]+)*(?:\s(?:تا|و)\s[۰-۹]+(?:[٫٬][۰-۹]+)*)?(?:\s?(?:٪|درصد|ماهگی|ماهه|ماه|سالگی|ساله|سال|سانتی‌متر|سانت|کیلوگرم|کیلو|روز|دقیقه))?/;

function withSwash(text: string): ReactNode {
  const match = KEY_NUMBER.exec(text);
  if (!match) return text;
  const start = match.index;
  const end = start + match[0].length;
  return (
    <>
      {text.slice(0, start)}
      <Mark>{match[0]}</Mark>
      {text.slice(end)}
    </>
  );
}

export function Tldr({ items, className }: TldrProps) {
  if (!items.length) return null;
  const swashAt = items.findIndex((item) => KEY_NUMBER.test(item));
  return (
    <Bubble as="section" size="lg" id="tldr" aria-labelledby="tldr-h" className={className}>
      <h2 id="tldr-h" className="text-lg font-bold text-ink">
        خلاصه در یک نگاه
      </h2>
      <ul className="mt-3 flex flex-col gap-2.5 text-base text-ink">
        {items.map((item, index) => (
          <li key={index} className="relative ps-5">
            <span aria-hidden="true" className="absolute start-0 top-[0.7em] size-2 rounded-full bg-success opacity-80" />
            {index === 0 ? <strong className="font-bold">جواب کوتاه: </strong> : null}
            {index === swashAt ? withSwash(item) : item}
          </li>
        ))}
      </ul>
    </Bubble>
  );
}
