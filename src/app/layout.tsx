import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { getSettings } from "@/db/queries/settings";
import { SITE_URL } from "@/lib/env";
import { graph, JsonLd, siteNodes } from "@/lib/jsonld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "چوبز کیدز | وسایل چوبی مونته‌سوری و پیکلر", template: "%s | چوبز کیدز" },
  description:
    "برج یادگیری، مثلث پیکلر و اسباب‌بازی چوبی ساخت کارگاه چوبز، همراه با راهنماهای تخصصی برای والدین.",
  applicationName: "چوبز کیدز",
  openGraph: { type: "website", locale: "fa_IR", siteName: "چوبز کیدز" },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  // No alternates.canonical here: it would be inherited by every page (TECH.md gotcha 7).
};

export const viewport: Viewport = {
  // Light by default; ThemeToggle/ThemeScript switch this to black when the visitor picks dark.
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Site-wide JSON-LD (OnlineStore with its shipping/return policies, Brand, WebSite); page graphs
  // reference these @ids. A cached query, so it is part of every prerendered shell.
  const settings = await getSettings();
  return (
    <html lang="fa-IR" dir="rtl" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <JsonLd data={graph(siteNodes(settings))} />
        {children}
      </body>
    </html>
  );
}
