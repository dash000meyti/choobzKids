import type { CSSProperties, ReactNode } from "react";
import { Bubble } from "@/components/ui/Bubble";
import { Doodle } from "@/components/ui/Doodle";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StampBadge } from "@/components/ui/StampBadge";
import { grainStyle } from "@/lib/grain";
import { CALLOUT_LABELS, type CalloutKind } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/*
 * Article callouts (DESIGN.md §7.3, docs/CONTENT-FORMAT.md «Callouts»). Each prints its plain
 * label, then the author's title when it says more than the label:
 *   TIP      «نکته»            mint bubble + a pencil sprout
 *   NOTE     «توضیح»           raised paper + info icon
 *   WARNING  «نکتهٔ ایمنی»      raised paper with a 4px accent rule at inline-start (never an anar fill)
 *   WORKSHOP «از کارگاه چوبز»  a grained wood face with the stamp «تجربهٔ دست‌اول»
 *   EXPERT   «نگاه متخصص»      raised paper + book icon. The expert's avatar and name appear only
 *                               once real reviewer data exists (honesty rule): never invented here.
 * MYTH has its own component (MythFact).
 */

type CalloutProps = {
  kind: CalloutKind;
  title?: string;
  children?: ReactNode;
};

const ICON: Record<Exclude<CalloutKind, "tip">, IconName> = {
  note: "info",
  warning: "warning",
  workshop: "saw",
  expert: "book",
};

const FACE: Record<Exclude<CalloutKind, "tip">, string> = {
  note: "bg-raised shadow-paper",
  warning: "bg-raised shadow-paper border-s-4 border-accent",
  workshop: "grain bg-wood",
  expert: "bg-raised shadow-paper",
};

const LABEL_TONE: Record<CalloutKind, string> = {
  tip: "text-success",
  note: "text-muted",
  warning: "text-accent",
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
      <p className={cn("flex items-center gap-2 text-sm font-bold", LABEL_TONE[kind])}>
        {kind === "tip" ? (
          <Doodle name="sprout" tone="inherit" className="h-[1.35em] w-auto" />
        ) : (
          <Icon name={ICON[kind]} className="size-[1.15em]" />
        )}
        <span>{label}</span>
      </p>
      {title ? <p className="mt-1 text-base leading-relaxed font-bold text-ink">{title}</p> : null}
    </>
  );
}

const BODY = "mt-2 text-base leading-[1.85] [&>*+*]:mt-3";

export function Callout({ kind, title, children }: CalloutProps) {
  const head = headline(kind, title);

  if (kind === "tip") {
    return (
      <Bubble role="note" data-block="" size="lg">
        <Heading kind={kind} {...head} />
        <div className={BODY}>{children}</div>
      </Bubble>
    );
  }

  return (
    <div
      role="note"
      data-block=""
      className={cn("relative rounded-bit px-5 py-4 sm:px-6 sm:py-5", FACE[kind])}
      style={kind === "workshop" ? (grainStyle(`workshop-${head.title ?? head.label}`) as CSSProperties) : undefined}
    >
      {kind === "workshop" ? (
        <StampBadge className="absolute -top-3 end-4">تجربهٔ دست‌اول</StampBadge>
      ) : null}
      <Heading kind={kind} {...head} />
      <div className={BODY}>{children}</div>
    </div>
  );
}
