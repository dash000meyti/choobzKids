/*
 * A classic inline <script> for pre-paint DOM fixes (Jalali month labels, `?age=` radios…),
 * per Next's "preventing flash before hydration" guide. The browser runs it while parsing the
 * server HTML; on the client React renders it as inert `text/plain`, so it never runs twice and
 * React does not warn about rendering a script. Keep each script ≤ 150 bytes (DESIGN.md §10.2).
 *
 * `html` must be a constant authored in code. Never interpolate user or DB strings into it
 * without JSON.stringify.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
