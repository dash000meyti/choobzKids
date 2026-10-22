"use client";

/*
 * A classic inline <script> for pre-paint DOM fixes (theme, Jalali month labels, `?age=` radios…),
 * per Next's "preventing flash before hydration" guide. The browser runs it while parsing the
 * server HTML; on the client React renders it as inert `text/plain`, so it never runs twice and
 * React does not warn about rendering a script. It must be a Client Component: rendered as a
 * Server Component, the `typeof window` check only ever ran on the server, so client renders
 * (soft navigations, Strict Mode's dev remount of <head>) got an executable script and the
 * «Encountered a script tag» warning. Keep each script small (DESIGN.md §10.2).
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
