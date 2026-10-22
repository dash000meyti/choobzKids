/*
 * Site fonts (Fontiran, licensed): IRANSansX for text and UI, Kalameh Bold for large headlines.
 * The @font-face rules live in globals.css and the files in public/fonts (with their license notes).
 * Only the two files the first screen needs are preloaded, as plain <link>s in <head> so the
 * browser fetches them from the first bytes of HTML; the other IRANSansX weights load on use.
 */
export const PRELOADED_FONTS = ["/fonts/iransansx/IRANSansXFaNum-Regular.woff2", "/fonts/kalameh/KalamehWebFaNum-Bold.woff2"] as const;

export function FontPreloads() {
  return (
    <>
      {PRELOADED_FONTS.map((href) => (
        <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
      ))}
    </>
  );
}
