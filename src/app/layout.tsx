import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { SITE_URL } from "@/lib/env";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6EC" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1612" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa-IR" dir="rtl" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
