"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/*
 * A nav link that knows when it is the current section and says so with aria-current="page"
 * (DESIGN.md §4.2: the dock's active tab is a bead plus weight, never colour alone). The chrome
 * lives in a persistent layout, so only the client knows the path. Every (site) route is
 * prerendered with complete params, so the server HTML already carries the right state.
 */

type NavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** `exact` for home; `prefix` marks the whole section. */
  match?: "exact" | "prefix";
  /** More section roots that count as this link (e.g. /product for «فروشگاه»). */
  also?: readonly string[];
  /** Where the link points while on the home page (e.g. «سن به سن» → #height-door). */
  homeHref?: string;
};

function within(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function NavLink({ href, match = "prefix", also, homeHref, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const current = match === "exact" ? pathname === href : within(pathname, href) || !!also?.some((root) => within(pathname, root));
  return <Link {...props} href={onHome && homeHref ? homeHref : href} aria-current={current ? "page" : undefined} />;
}
