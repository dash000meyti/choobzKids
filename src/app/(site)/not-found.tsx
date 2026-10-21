import type { Metadata } from "next";
import { NotFoundPage } from "@/components/layout/NotFoundPage";

/* notFound() anywhere in the site: the (site) layout already draws the chrome. */

export const metadata: Metadata = {
  title: "این صفحه پیدا نشد",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage />;
}
