import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CALLOUT_LABELS, type CalloutKind } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/*
 * Article callouts (DESIGN.md §7.3, docs/CONTENT-FORMAT.md «Callouts»), Studio style: a quiet
 * grey card, a small line icon and the plain label, then the author's title when it says more:
 *   TIP «نکته» (sprout) · NOTE «توضیح» (info) · WARNING «نکتهٔ ایمنی» (warning, eyebrow colour)
 *   WORKSHOP «از کارگاه چوبز» (saw, with «تجربهٔ دست‌اول») · EXPERT «نگاه متخصص» (book). The
 *   expert's avatar and name appear only once real reviewer data exists (honesty rule).
 * MYTH has its own component (MythFact).
 */

type CalloutProps = {
  kind: CalloutKind;
  title?: string;
  children?: ReactNode;
};

const ICON: Record<CalloutKind, IconName> = {
  tip: "sprout",
  note: "info",
  warning: "warning",
  workshop: "saw",
  expert: "book",
};

const LABEL_TONE: Record<CalloutKind, string> = {
  tip: "text-ink",
  note: "text-muted",
  warning: "text-eyebrow",
  workshop: "text-ink",
  expert: "text-muted",
};

/** «از کارگاه چوبز: هدیه را…» → label «از کارگاه چوبز», title «هدیه را…». A title equal to the label is dropped. */
function headline(kind: CalloutKind, title: string | undefined): { label: string; title: string | null } {
  const label = CALLOUT_LABELS[kind];
  const text = title?.trim();
  if (!text || text === label) return { label, title: null };
  if (text.startsWith(label)) {
    const rest = text.slice(label.length).replace(/^[\s:：،—–-]+/, "");
    return { label, title: rest || null };
  }
  return { label, title: text };
}

function Heading({ kind, label, title }: { kind: CalloutKind; label: string; title: string | null }) {
  return (
    <>
      <p className={cn("flex items-center gap-2 text-sm font-semibold", LABEL_TONE[kind])}>
        <Icon name={ICON[kind]} className="size-[1.15em]" />
        {label}
        {kind === "workshop" ? <span className="font-normal text-muted">· تجربهٔ دست‌اول</span> : null}
      </p>
      {title ? <p className="mt-1.5 text-base leading-snug font-bold text-ink">{title}</p> : null}
    </>
  );
}

const BODY = "mt-2 text-base leading-[1.85] text-muted [&>*+*]:mt-3 [&_strong]:text-ink";

export function Callout({ kind, title, children }: CalloutProps) {
  const head = headline(kind, title);
  return (
    <div role="note" data-block="" className="rounded-[1.5rem] bg-surface px-6 py-5 sm:px-7 sm:py-6">
      <Heading kind={kind} {...head} />
      <div className={BODY}>{children}</div>
    </div>
  );
}
