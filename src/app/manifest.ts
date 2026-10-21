import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/** Web app manifest (RTL, fa-IR). Colours match the light page paper token (--color-shir). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "چوبز",
    description: "اسباب‌بازی و وسایل چوبی مونته‌سوری کودک، ساخت کارگاه چوبز",
    lang: SITE.inLanguage,
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
