import type { Metadata, Viewport } from "next";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { FontPreloads } from "@/lib/fonts";
import { SiteShell } from "@/components/layout/SiteShell";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

/*
 * URLs that match no route at all (experimental.globalNotFound). Next serves this page on its own,
 * bypassing the root layout, so it brings the document, theme, styles and site chrome. notFound()
 * inside the site renders app/(site)/not-found.tsx instead.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "این صفحه پیدا نشد | چوبز کیدز",
  robots: { index: false, follow: true },
};

export const viewport: Viewport = {
  // Light by default; ThemeToggle/ThemeScript switch this to black when the visitor picks dark.
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function GlobalNotFound() {
  return (
    <html lang="fa-IR" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <FontPreloads />
        <ThemeScript />
      </head>
      <body>
        <SiteShell>
          <NotFoundPage />
        </SiteShell>
      </body>
    </html>
  );
}
