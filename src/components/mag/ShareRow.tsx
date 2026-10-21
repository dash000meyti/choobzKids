import { cn } from "@/lib/utils";
import { ShareButton } from "./ShareButton";

/*
 * «اشتراک‌گذاری» row (DESIGN.md §7.3 #14): the system share sheet where the browser has one, and
 * «کپی لینک» everywhere. Both share the canonical URL of the page.
 */

type ShareRowProps = {
  url: string;
  title: string;
  className?: string;
};

export function ShareRow({ url, title, className }: ShareRowProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <p className="text-sm font-semibold text-muted">این مطلب به کار کسی می‌آید؟</p>
      <div className="flex flex-wrap items-center gap-2">
        <ShareButton mode="share" url={url} title={title} />
        <ShareButton mode="copy" url={url} title={title} />
      </div>
    </div>
  );
}
