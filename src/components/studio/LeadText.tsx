import { sentences } from "./Highlight";

/*
 * A long intro (SEO copy on hubs) shown the calm way: its first sentence as the lead, the rest
 * folded behind «بیشتر بخوانید». Folded text stays in the HTML, so search engines still read it.
 */
export function LeadText({ text, className }: { text: string; className?: string }) {
  const all = sentences(text.replace(/[*_#>]/g, ""));
  const [first, ...rest] = all;
  if (!first) return null;
  return (
    <div className={className}>
      <p className="text-[1.0625rem] leading-8 text-muted lg:text-[1.125rem]">{first}</p>
      {rest.length ? (
        <details className="group mt-2">
          <summary className="link-arrow inline-flex cursor-pointer list-none text-[0.9375rem] [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">بیشتر بخوانید</span>
            <span className="hidden group-open:inline">بستن</span>
          </summary>
          <p className="mt-3 text-[0.9375rem] leading-8 text-muted">{rest.join(" ")}</p>
        </details>
      ) : null}
    </div>
  );
}
