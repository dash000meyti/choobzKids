import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

// Every public route must be fully static; the build fails if request-time work sneaks in (TECH.md §2.5).
export const ensureStatic = "navigation";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
