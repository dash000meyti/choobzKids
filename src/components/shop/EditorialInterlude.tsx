import type { ShopGuide } from "@/db/queries/shop";
import type { RoomCardData } from "@/db/queries/cards";
import { illustrationSize } from "@/components/illustrations/sizes";
import { RoomCard } from "@/components/shop/RoomCard";
import { Icon } from "@/components/ui/Icon";
import { IntentLink } from "@/components/ui/IntentLink";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./EditorialInterlude.module.css";

/*
 * EditorialInterlude (DESIGN.md §6.1): the two-column slot ProductGrid drops into every 8th
 * place of the default view, so a mother browsing the shelves meets a guide or a ready room
 * between the cards. FilterBar hides it as soon as the view is filtered or sorted.
 *   guide → a kraft notebook (the guide stationery of ArticleCard) with the guide's drawing,
 *           «راهنمای انتخاب», the title and «۱۶ دقیقه مطالعه ←»; the whole card links to it.
 *   room  → the shared RoomCard.
 */

export type InterludeItem = { kind: "guide"; guide: ShopGuide } | { kind: "room"; room: RoomCardData };

export function EditorialInterlude({ item, className }: { item: InterludeItem; className?: string }) {
  if (item.kind === "room") return <RoomCard room={item.room} className={className} />;
  return <GuideNote guide={item.guide} className={className} />;
}

function GuideNote({ guide, className }: { guide: ShopGuide; className?: string }) {
  return (
    <article className={cn("@container relative h-full overflow-hidden rounded-bit", styles.note, className)}>
      <div className="flex h-full items-center gap-4 p-4 ps-5 @min-[28rem]:gap-6 @min-[28rem]:p-5 @min-[28rem]:ps-6">
        {guide.illustration ? <Drawing illustration={guide.illustration} /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Icon name="book" className="size-4" />
            {guide.isPillar ? "راهنمای کامل انتخاب" : "راهنمای انتخاب"}
          </p>
          <h3 className="line-clamp-3 text-base font-bold text-ink @min-[28rem]:text-lg">
            <IntentLink href={`/mag/${guide.slug}`} transitionTypes={["nav-forward"]} className={styles.link}>
              {guide.title}
            </IntentLink>
          </h3>
          {guide.excerpt ? (
            <p className="hidden text-sm text-ink @min-[28rem]:line-clamp-2">{guide.excerpt}</p>
          ) : null}
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-sm text-ink">
            <Icon name="clock" className="size-4" />
            <span>{toFaDigits(guide.readingMinutes)} دقیقه مطالعه</span>
            <span aria-hidden="true" className="link-mark ms-auto font-semibold">
              بخوانید ←
            </span>
          </p>
        </div>
      </div>
      <span aria-hidden="true" className={styles.band} />
    </article>
  );
}

function Drawing({ illustration }: { illustration: string }) {
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    <span aria-hidden="true" className="relative block aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-arch bg-surface inset-shadow-tray @min-[28rem]:w-32 @min-[36rem]:w-40">
      <span className="contact-shadow absolute inset-x-[18%] bottom-[6%] h-[8%] rounded-[50%]" />
      <span className="absolute inset-x-[14%] top-[16%] bottom-[9%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
        <img
          src={illustrationUrl(illustration, "assembled")}
          width={width}
          height={height}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-contain object-bottom"
        />
      </span>
    </span>
  );
}
