import type { ReactNode } from "react";
import { Bubble } from "@/components/ui/Bubble";

/*
 * A plain Markdown blockquote → pull quote (DESIGN.md §7.3): Mikhak `text-lg` in a mint bubble
 * with large decorative «» marks, and the speaker when the quote's last line was «— نام».
 * The marks are typography, aria-hidden; the quote text stays plain HTML.
 */

const MARK = "pointer-events-none absolute font-display text-[2.75rem] leading-none text-success/40 select-none";

export function PullQuote({ cite, children }: { cite?: string; children?: ReactNode }) {
  return (
    <figure data-block="">
      <Bubble as="blockquote" size="lg" className="font-accent text-lg">
        <span aria-hidden="true" className={`${MARK} start-3 top-2`}>
          «
        </span>
        <div className="ps-6 pe-4 [&>*+*]:mt-3">{children}</div>
        <span aria-hidden="true" className={`${MARK} end-3 bottom-0`}>
          »
        </span>
      </Bubble>
      {cite ? <figcaption className="ps-6 text-sm text-muted">— {cite}</figcaption> : null}
    </figure>
  );
}
