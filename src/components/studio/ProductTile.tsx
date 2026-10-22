import Link from "@/components/ui/Link";
import type { ProductCardData } from "@/db/queries/catalog";
import type { SiteSettings } from "@/db/queries/settings";
import { cn } from "@/lib/utils";
import { Actions } from "./Actions";
import { PriceLine } from "./PriceLine";
import { Render, type RenderAngle } from "./Render";

/*
 * A product tile in the Apple home-page manner: headline, one line, two actions, the render.
 * `size="hero"` is a full-width stage under studio light; `entrance` plays the on-load rise (the
 * first tile only); other tiles reveal as they scroll in. `tone="night"` flips it to black.
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
  entrance = false,
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
  /** Play the staggered on-load entrance (the first hero only). */
  entrance?: boolean;
}) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  const href = `/product/${product.slug}`;
  const hero = size === "hero";
  const rise = (delay: number) =>
    entrance ? { className: "rise", style: { "--rise-delay": `${delay}ms` } as React.CSSProperties } : { className: "" };
  return (
    <article
      className={cn(
        "group relative flex flex-col items-center overflow-hidden text-center",
        tone === "night" ? "theme-night" : tone === "white" ? "bg-bg" : hero ? "spotlight" : "bg-surface",
        hero
          ? "px-gutter pt-14 lg:min-h-[calc(100svh-var(--spacing-header-lg))] lg:justify-center lg:pt-16"
          : "reveal rounded-none px-6 pt-14 md:rounded-[1.75rem] lg:pt-16",
      )}
    >
      {eyebrow && (
        <p {...rise(0)} className={cn("eyebrow mb-2", rise(0).className)}>
          {eyebrow}
        </p>
      )}
      <Heading
        {...rise(80)}
        className={cn("headline", hero ? "text-[2.75rem] sm:text-display" : "text-[2rem] lg:text-[2.75rem]", rise(80).className)}
      >
        <Link href={href} className="after:absolute after:inset-0 after:content-['']">
          {title ?? product.name}
        </Link>
      </Heading>
      <p
        {...rise(160)}
        className={cn("text-muted", hero ? "mt-4 text-lead lg:mt-6 lg:text-[1.875rem] lg:leading-snug" : "mt-3 text-lead", rise(160).className)}
      >
        {tagline}
      </p>
      <div {...rise(240)} className={cn("flex flex-col items-center", rise(240).className)}>
        <PriceLine price={product.price} from={product.variantCount > 1} snapppay={snapppay} className="mt-3 text-sm" />
        <Actions learnHref={href} buyHref={`${href}#buy`} className="relative z-[1] mt-6" />
      </div>
      <div
        style={entrance ? ({ "--rise-delay": "320ms" } as React.CSSProperties) : undefined}
        className={cn(
          "relative mt-10 w-full pb-10",
          // On desktop the hero product is sized from the screen height, so headline, actions and
          // product all fit in the first view.
          hero
            ? "max-w-[50rem] [--tile-box:5/4] md:[--tile-box:16/10] lg:max-w-[clamp(30rem,calc((100svh_-_30rem)*1.6),50rem)]"
            : "max-w-[32rem]",
          entrance && "rise-product",
        )}
      >
        <div className={cn("transition-transform duration-[900ms] ease-[var(--ease-out-expo)]", !hero && "group-hover:scale-[1.035]")}>
          <Render
            productKey={product.illustration ?? product.slug}
            angle={angle}
            alt={`${product.name}، تصویر سه‌بعدی از روی ابعاد واقعی`}
            sizes={hero ? "(min-width: 1024px) 800px, 92vw" : "(min-width: 768px) 512px, 92vw"}
            priority={priority}
            // Hero tiles stand taller on phones, where a 16:10 box leaves the product small.
            box={hero ? "var(--tile-box)" : "4 / 3"}
          />
        </div>
      </div>
    </article>
  );
}
