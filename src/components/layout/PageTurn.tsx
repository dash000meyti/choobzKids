import { ViewTransition, type ReactNode } from "react";

/*
 * «ورق‌زدن» (DESIGN.md §9.6): the page turn between routes. Each page.tsx wraps its own content in
 * <PageTurn> (never the persistent layout, which must not turn). Links tagged
 * `transitionTypes={["nav-forward"]}` lift the old page toward the spine on the right, as in a
 * right-bound Persian book; `["nav-back"]` (breadcrumbs, back links) turns it the other way.
 * Untagged navigations do not animate. The keyframes live in globals.css; reduced motion and
 * «حرکت آرام» get a 120 ms cross-fade.
 */
export function PageTurn({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "turn-forward", "nav-back": "turn-back", default: "none" }}
      exit={{ "nav-forward": "turn-forward", "nav-back": "turn-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
