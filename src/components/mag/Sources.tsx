import type { Source } from "@/db/schema";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * «منابع» (DESIGN.md §7.3 #10, SEO.md §4.3): the numbered source list. Each entry is anchored
 * `cite-{n}` for in-text footnotes «[۱]», names the publisher and title, and links out. The same
 * list becomes Article.citation in the JSON-LD.
 */

type SourcesProps = {
  sources: Source[];
  className?: string;
};

export const SOURCES_SECTION_ID = "sources";
export const SOURCES_TITLE = "منابع";

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function Sources({ sources, className }: SourcesProps) {
  if (!sources.length) return null;
  return (
    <section id={SOURCES_SECTION_ID} aria-labelledby="sources-h" className={cn("flex flex-col gap-4", className)}>
      <h2 id="sources-h" className="text-xl font-extrabold text-ink">
        {SOURCES_TITLE}
      </h2>
      <ol className="flex flex-col gap-3 text-sm text-muted">
        {sources.map((source, index) => {
          const host = hostOf(source.url);
          return (
            <li key={source.url + index} id={`cite-${index + 1}`} className="flex gap-2.5">
              <span aria-hidden="true" className="shrink-0 font-semibold text-ink tabular-nums">
                [{toFaDigits(index + 1)}]
              </span>
              <p className="min-w-0 break-words">
                {source.publisher ? (
                  <>
                    <bdi className="font-semibold text-ink">{source.publisher}</bdi>
                    {"، "}
                  </>
                ) : null}
                <cite className="not-italic">
                  <a href={source.url} target="_blank" rel="noopener" className="link-mark text-ink">
                    <bdi>{source.title}</bdi>
                  </a>
                </cite>
                {host ? (
                  <>
                    {" "}
                    <bdi lang="en" dir="ltr" className="text-xs">
                      ({host})
                    </bdi>
                  </>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
