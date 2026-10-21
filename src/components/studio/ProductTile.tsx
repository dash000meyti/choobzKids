import Link from "next/link";
import type { ProductCardData } from "@/db/queries/catalog";
import type { SiteSettings } from "@/db/queries/settings";
import { cn } from "@/lib/utils";
import { Actions } from "./Actions";
import { PriceLine } from "./PriceLine";
import { Render, type RenderAngle } from "./Render";

/*
 * A product tile in the Apple home-page manner: headline, one line, two actions, the render.
 * `size="hero"` is the full-width first tile; `tone="night"` flips it to black.
 */
export function ProductTile({
  product,
  title,
  tagline,
  eyebrow,
  angle = "hero",
  size = "half",
  tone = "light",
  snapppay,
  priority = false,
  headingLevel = 2,
}: {
  product: ProductCardData;
  title?: string;
  tagline: string;
  eyebrow?: string;
  angle?: RenderAngle;
  size?: "hero" | "half";
  tone?: "light" | "night" | "white";
  snapppay: SiteSettings["snapppay"];
  priority?: boolean;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  const href = `/product/${product.slug}`;
  const hero = size === "hero";
  return (
    <article
      className={cn(
        "relative flex flex-col items-center overflow-hidden text-center",
        tone === "night" ? "theme-night" : tone === "white" ? "bg-bg" : "bg-surface",
        hero ? "px-gutter pt-12 lg:pt-14" : "rounded-none px-6 pt-12 md:rounded-[1.75rem] lg:pt-14",
      )}
    >
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <Heading className={cn("headline", hero ? "text-3xl lg:text-display" : "text-2xl lg:text-[2.75rem]")}>
        <Link href={href} className="after:absolute after:inset-0 after:content-['']">
          {title ?? product.name}
        </Link>
      </Heading>
      <p className={cn("mt-2 text-muted", hero ? "text-lead lg:text-[1.75rem] lg:leading-snug" : "text-lead")}>{tagline}</p>
      <PriceLine price={product.price} from={product.variantCount > 1} snapppay={snapppay} className="mt-2 text-sm" />
      <Actions learnHref={href} buyHref={`${href}#buy`} className="relative z-[1] mt-5" prefetch />
      <div className={cn("relative mt-8 w-full pb-8", hero ? "max-w-[44rem]" : "max-w-[30rem]")}>
        <Render
          productKey={product.illustration ?? product.slug}
          angle={angle}
          alt={`${product.name}، تصویر سه‌بعدی از روی ابعاد واقعی`}
          sizes={hero ? "(min-width: 1024px) 704px, 92vw" : "(min-width: 768px) 480px, 92vw"}
          priority={priority}
          box={hero ? "16 / 10" : "4 / 3"}
        />
      </div>
    </article>
  );
}
