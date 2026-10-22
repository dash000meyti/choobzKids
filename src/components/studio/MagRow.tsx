import Link from "@/components/ui/Link";
import type { ArticleCardData } from "@/db/queries/cards";
import { toFaDigits } from "@/lib/format";
import { Render } from "./Render";

/* «مجله چوبز» teaser: three editorial cards, quiet and typographic. */
export function MagRow({ posts }: { posts: ArticleCardData[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="mag-title" className="mx-auto max-w-[75rem] px-gutter pb-section">
      <div className="reveal flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">مجله چوبز</p>
          <h2 id="mag-title" className="headline mt-2 text-[2rem] lg:text-[3rem]">
            راهنمای پدر و مادرها.
          </h2>
        </div>
        <Link href="/mag" className="link-arrow hidden shrink-0 text-sm sm:inline">
          همهٔ مطالب
        </Link>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <li key={p.id} className="reveal">
            <Link href={`/mag/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(0_0_0/0.25)]">
              <div className="mx-auto w-3/5 pt-6 transition-transform duration-500 group-hover:scale-[1.03]">
                {p.illustration && <Render productKey={p.illustration} alt="" sizes="(min-width: 768px) 220px, 55vw" box="4 / 3" />}
              </div>
              <div className="flex flex-1 flex-col p-6 pt-2">
                <p className="text-xs font-semibold text-muted">
                  {p.topic?.name} · {toFaDigits(p.readingMinutes)} دقیقه
                </p>
                <h3 className="mt-2 text-lg font-bold leading-snug">{p.title}</h3>
                {p.tldr && <p className="mt-2 line-clamp-3 text-sm text-muted">{p.tldr}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/mag" className="link-arrow mt-6 inline-block text-sm sm:hidden">
        همهٔ مطالب
      </Link>
    </section>
  );
}
