import Link from "@/components/ui/Link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./GlossaryLink.module.css";

/*
 * A glossary mention (SEO.md §4.6, DESIGN.md §7.3): a real, server-rendered link to
 * /glossary/{slug} with a dotted underline. On hover-capable devices whose browser supports
 * anchor positioning, hovering or focusing it opens a small paper card with the definition.
 * The card is CSS generated content from `data-definition`, so the sentence stays out of the
 * paragraph's text (passages quote cleanly) and out of the link's accessible name.
 * On touch the tap simply navigates.
 */

type GlossaryLinkProps = {
  href: string;
  /** Glossary slug. */
  term: string;
  definition?: string;
  /** Set by the auto-linker for first mentions (vs. an author's explicit `term:` link). */
  auto?: boolean;
  children: ReactNode;
};

export function GlossaryLink({ href, term, definition, auto, children }: GlossaryLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn("term", styles.term)}
      data-term={term}
      data-auto={auto ? "" : undefined}
      data-definition={definition || undefined}
    >
      {children}
    </Link>
  );
}
