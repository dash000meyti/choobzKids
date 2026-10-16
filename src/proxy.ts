import Database from "better-sqlite3";
import { NextResponse, type NextRequest } from "next/server";
import { resolveDatabasePath } from "@/db/open";

/*
 * URL normalisation and CMS redirects in ONE hop (SEO.md §7.4, TECH.md §3.2). Runs on Node.js.
 * 1. Collapse `//`, drop the trailing slash, lowercase Latin letters, Arabic ي/ى/ك → Persian ی/ک.
 * 2. Look the normalised path up in the `redirects` table (Persian vanity paths by a folded key).
 * 3. Redirect once to the final target (query kept), answer 410 for removed content, or pass.
 * `skipTrailingSlashRedirect` is set in next.config.ts so Next adds no hop of its own.
 */

type Rule = { to: string; status: number };

const REFRESH_MS = 30_000; // CMS edits are visible within 30 s
let snapshot: { at: number; rules: Map<string, Rule> } | null = null;

/** The redirects table, re-read at most every 30 s. A missing or locked DB never breaks requests. */
function redirectRules(now: number): Map<string, Rule> {
  if (snapshot && now - snapshot.at < REFRESH_MS) return snapshot.rules;
  let rules = snapshot?.rules ?? new Map<string, Rule>();
  try {
    const sqlite = new Database(resolveDatabasePath(), { readonly: true, fileMustExist: true });
    try {
      const rows = sqlite.prepare("select from_path, to_path, status_code from redirects").all() as {
        from_path: string;
        to_path: string;
        status_code: number;
      }[];
      rules = new Map(rows.map((r) => [r.from_path, { to: r.to_path, status: r.status_code }]));
    } finally {
      sqlite.close();
    }
  } catch {
    // Keep serving with the previous snapshot.
  }
  snapshot = { at: now, rules };
  return rules;
}

/** Canonical form of a decoded path. */
function normalizePath(path: string): string {
  let p = path.replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return (
    p
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[A-Z]+/g, (m) => m.toLowerCase()) || "/"
  );
}

const FOLD: Record<string, string> = { ي: "ی", ى: "ی", ئ: "ی", ك: "ک", ة: "ه", ۀ: "ه", ؤ: "و", أ: "ا", إ: "ا", ٱ: "ا", آ: "ا" };

/**
 * Lookup key for Persian vanity paths (SEO.md §6.5 `searchKey`): letters folded, diacritics,
 * tatweel and bidi marks removed, ZWNJ and punctuation → single spaces, digits → Latin.
 */
function vanityKey(path: string): string {
  return path
    .normalize("NFC")
    .replace(/[يىئكةۀؤأإٱآ]/g, (c) => FOLD[c])
    .replace(/[\u064B-\u065F\u0670]/g, "") // harakat, superscript alef, hamza above
    .replace(/\u0640/g, "") // tatweel
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "") // bidi controls
    .replace(/[\u200C\u200D]/g, " ") // ZWNJ / ZWJ
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

const GONE_HTML =
  '<!doctype html><html lang="fa-IR" dir="rtl"><meta charset="utf-8"><title>این صفحه حذف شده است</title>' +
  '<p>این صفحه برای همیشه حذف شده است. <a href="/shop">فروشگاه چوبز</a></p></html>';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Encoded separators would change the path's shape once decoded; leave those to the 404.
  if (/%(?:2f|5c|3f|23)/i.test(pathname)) return NextResponse.next();

  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return NextResponse.next(); // malformed escape → plain 404
  }
  const path = normalizePath(decoded);

  const rules = redirectRules(Date.now());
  const rule = rules.get(path) ?? (/[\u0080-\uffff]/.test(path) ? rules.get(vanityKey(path)) : undefined);

  if (rule?.status === 410) {
    return new NextResponse(GONE_HTML, {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }

  const target = rule && rule.to !== path ? rule.to : path !== decoded ? encodePath(path) : null;
  if (!target) return NextResponse.next();

  const destination = new URL(target, request.url);
  if (!destination.search) destination.search = search;
  const status = rule && [301, 302, 307, 308].includes(rule.status) ? rule.status : 301;
  return NextResponse.redirect(destination, status);
}

export const config = {
  matcher: [
    // Pages only: skip Next internals, uploads, APIs, Markdown/Torob endpoints and any file with an extension
    // we serve (robots.txt, sitemaps, llms*.txt, manifest, icons, public assets).
    "/((?!_next/|media/|api/|torob_api/|md/|\\.well-known/|.*\\.(?:txt|xml|webmanifest|ico|png|jpe?g|webp|avif|gif|svg|woff2?|ttf|mp4|webm|pdf|json)$).*)",
  ],
};
