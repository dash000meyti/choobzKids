import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/*
 * robots.txt (SEO.md §5.2). A crawler that matches a named group ignores `*`, so every allowed
 * bot is listed with the SAME rules; otherwise a named `Allow: /` would re-open /search and the
 * facet URLs to it. Only Bytespider is blocked.
 */

const FACETS = ["sort", "age", "skill", "price", "in_stock", "q"];
const DISALLOW = [
  "/api/",
  "/torob_api/",
  "/md/",
  "/search",
  "/cart",
  "/checkout",
  "/account",
  // Exact parameter names: "age=" must never match inside "page=".
  ...FACETS.flatMap((p) => [`/*?${p}=`, `/*&${p}=`]),
];
const ALLOWED = [
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-Video",
  "Storebot-Google",
  "Google-Extended",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "YandexBot",
  "*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ALLOWED,
        allow: "/",
        disallow: DISALLOW,
        other: { "Content-Signal": "search=yes, ai-input=yes, ai-train=yes" },
      },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
