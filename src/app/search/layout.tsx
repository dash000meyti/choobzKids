import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

/*
 * /search lives outside (site): it reads searchParams, so it renders at request time and is
 * exempt from the static-site contract. Never indexed, but its links are followed (SEO.md §7.5).
 */

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
