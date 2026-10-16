"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { StepperControl } from "@/components/ui/StepperControl";
import { TabularNumber } from "@/components/ui/TabularNumber";
import { DrawingImg } from "@/components/layout/DrawingImg";
import { toast } from "@/components/layout/Toaster";
import { formatToman } from "@/lib/format";
import { cn, mediaUrl } from "@/lib/utils";
import { useCartConfig } from "./CartProvider";
import { MAX_LINE_QTY, removeItem, restoreItem, setQty, type CartItem, type LineStatus } from "./store";

/*
 * One cart line (DESIGN.md §4.7), shared by the drawer and /cart: a 64px stage thumb, the name as
 * a link, variant and engraving, the line price in tabular digits, a stepper and «×».
 * Removing is instant and undoable from the toast («از سبد برداشته شد · برگردون»).
 */

type CartLineProps = {
  item: CartItem;
  status?: LineStatus;
  className?: string;
};

const THUMB = 64;

function Thumb({ item }: { item: CartItem }) {
  return (
    <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-bit-sm bg-surface p-1.5">
      {item.imagePath ? (
        <Image
          src={mediaUrl(item.imagePath)}
          width={THUMB}
          height={THUMB}
          sizes={`${THUMB}px`}
          alt=""
          className="size-full object-contain"
        />
      ) : item.illustration ? (
        <DrawingImg illustration={item.illustration} size={52} className="size-full" />
      ) : (
        <Icon name="parcel" className="size-7 text-muted" />
      )}
    </span>
  );
}

function AvailabilityNote({ status, bale }: { status: LineStatus; bale: string | null }) {
  if (!status.available) {
    return (
      <p className="text-xs font-semibold text-muted">
        فعلاً تموم شده
        {bale ? (
          <>
            {" · "}
            <a href={bale} target="_blank" rel="noopener" className="link-mark text-ink">
              توی بله بپرس کی آماده می‌شه
            </a>
          </>
        ) : null}
      </p>
    );
  }
  if (status.availability === "made_to_order") return <p className="text-xs text-muted">ساخت سفارشی</p>;
  if (status.availability === "preorder") return <p className="text-xs text-muted">پیش‌سفارش</p>;
  return null;
}

export function CartLine({ item, status, className }: CartLineProps) {
  const { bale } = useCartConfig();
  const engraving = item.addons?.engraving;
  const previous = status?.previousPriceToman;
  const priceChanged = previous != null && previous !== item.priceToman;
  const unavailable = status?.available === false;

  const remove = () => {
    const removed = removeItem(item.key);
    if (removed) toast("از سبد برداشته شد", { label: "برگردون", onClick: () => restoreItem(removed) }, "trash");
  };

  return (
    <li className={cn("flex gap-3 py-4", className)}>
      <Thumb item={item} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={`/product/${item.slug}`} className="link-mark text-sm leading-snug font-bold text-ink">
              {item.name}
            </Link>
            {item.variantName ? <p className="text-xs text-muted">{item.variantName}</p> : null}
            {engraving ? (
              <p className="text-xs text-muted">
                حک اسم: <bdi className="font-semibold text-ink">{engraving}</bdi>
              </p>
            ) : null}
          </div>
          <IconButton icon="close" label={`حذف ${item.name} از سبد`} size="sm" onClick={remove} className="-mt-1 shrink-0" />
        </div>

        {priceChanged ? (
          <p className="flex items-start gap-1.5 text-xs text-ink">
            <Icon name="info" className="mt-0.5 size-4 text-info" />
            <span>قیمت این وسیله از وقتی گذاشتیش توی سبد عوض شده: {formatToman(item.priceToman)}</span>
          </p>
        ) : null}
        {status ? <AvailabilityNote status={status} bale={bale} /> : null}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <StepperControl
            value={item.qty}
            min={1}
            max={MAX_LINE_QTY}
            label={`تعداد ${item.name}`}
            onChange={(qty) => setQty(item.key, qty)}
          />
          <p className="text-end leading-tight">
            <span className={cn("text-sm font-bold", unavailable ? "text-muted line-through decoration-1" : "text-ink")}>
              <TabularNumber value={item.priceToman * item.qty} /> <span className="text-xs font-semibold">تومان</span>
            </span>
            {item.qty > 1 ? (
              <span className="block text-2xs text-muted">
                هر عدد <TabularNumber value={item.priceToman} /> تومان
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </li>
  );
}
