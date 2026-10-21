import type { Metadata } from "next";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { SiteShell } from "@/components/layout/SiteShell";

/* URLs that match no route render here, in the root layout only, so this brings the site chrome. */

export const metadata: Metadata = {
  title: "این صفحه پیدا نشد",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundPage />
    </SiteShell>
  );
}
