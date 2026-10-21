import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { getProductCardsBySlugs, type ProductCardData } from "@/db/queries/catalog";
import { getArticleCardsBySlugs, listRoomCards, type ArticleCardData, type RoomCardData } from "@/db/queries/cards";
import {
  categories,
  communityPhotos,
  faqs,
  media,
  postProducts,
  posts,
  productAddons,
  productMedia,
  productRelations,
  products,
  productVariants,
  reviews,
  roomPresetItems,
  roomPresets,
  type Dimensions,
  type MediaKind,
  type ProductSpec,
} from "@/db/schema";
import { tag } from "@/lib/cache-tags";
import { IS_PRODUCTION_CONTENT } from "@/lib/env";

/*
 * Everything the product page (/product/{slug}, DESIGN.md §6.3) renders, in one cached read:
 * the product and its category, variants, gallery media, add-ons, product FAQs, approved
 * reviews and consented family photos, plus the cards of the related products, the guides that
 * feature it and the ready-made rooms it stands in. The page, its metadata, the JSON-LD and the
 * Torob tags all come from this one entry, so they can never disagree (SEO.md §6.1 d).
 *
 * Sample reviews and photos (seed demo content) are only returned outside production.
 * Dates are ISO strings so every piece can be handed to client islands as plain data.
 */

export type Availability = (typeof products.$inferSelect)["availability"];

export type ProductVariantData = {
  id: number;
  name: string;
  sku: string | null;
  /** Toman: the variant's own price, or the product price. */
  price: number;
  /** The variant row's own price; null when it inherits the product price (JSON-LD input). */
  ownPrice: number | null;
  options: Record<string, string>;
  swatch: string | null;
  /** Preselect query without "?", e.g. "color=white"; `variant={id}` when the row has none. */
  query: string;
  /** The raw `urlParam` (null = none), for the JSON-LD builder's own fallback. */
  urlParam: string | null;
  /** A sold-out variant of an in-stock product is out of stock; otherwise the product's. */
  availability: Availability;
};

export type ProductMediaData = {
  id: number;
  path: string;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  credit: string | null;
  dominantColor: string | null;
  kind: MediaKind;
};

export type ProductAddonData = {
  id: number;
  key: "engraving";
  name: string;
  priceToman: number;
  maxChars: number | null;
};

export type ProductFaqData = { id: number; question: string; answer: string };

export type ProductReviewData = {
  id: number;
  authorName: string;
  city: string | null;
  childAge: string | null;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  isSample: boolean;
  createdAt: string;
  image: ProductMediaData | null;
};

export type FamilyPhotoData = {
  id: number;
  caption: string | null;
  customerName: string | null;
  city: string | null;
  isSample: boolean;
  image: ProductMediaData;
};

export type ProductRoomData = RoomCardData & {
  /** Where this product stands in that room (`room_preset_items.slot`). */
  slot: string;
};

export type ProductPageData = {
  product: {
    id: number;
    slug: string;
    name: string;
    subtitle: string | null;
    summary: string;
    description: string;
    sku: string | null;
    /** Toman. */
    price: number;
    compareAtPrice: number | null;
    availability: Availability;
    leadTimeDays: number | null;
    ageMinMonths: number | null;
    ageMaxMonths: number | null;
    skills: string[];
    material: string | null;
    finish: string | null;
    dimensions: Dimensions | null;
    weightKg: number | null;
    maxLoadKg: number | null;
    highlights: string[];
    specs: ProductSpec[];
    inTheBox: string[];
    safetyNotes: string | null;
    careNotes: string | null;
    warrantyMonths: number | null;
    assemblyMinutes: number | null;
    alternateNames: string[];
    guaranteeText: string | null;
    torobEnabled: boolean;
    illustration: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalPath: string | null;
    noindex: boolean;
    publishedAt: string | null;
    updatedAt: string;
  };
  category: { id: number; slug: string; name: string };
  /** Picker order; the first one is the default selection. */
  variants: ProductVariantData[];
  /** Gallery order (photos and cut-outs; drawings come from the manifest). */
  media: ProductMediaData[];
  addons: ProductAddonData[];
  faqs: ProductFaqData[];
  /** Approved, newest first; samples only outside production. */
  reviews: ProductReviewData[];
  familyPhotos: FamilyPhotoData[];
  /** `product_relations.kind = 'related'`, published only. */
  related: ProductCardData[];
  /** `kind = 'bundle'`: pieces that complete the room with this one. */
  bundle: ProductCardData[];
  /** `kind = 'upsell'`: accessories offered beside the add-to-cart button (e.g. «+ رمپ»). */
  accessories: ProductCardData[];
  /** Slugs of products this one is an accessory for (they list it as `upsell`). */
  accessoryForSlugs: string[];
  /** Published guides featuring this product, the ones it leads first (see rankGuides). */
  guides: ArticleCardData[];
  /** Every published post that features it (JSON-LD `subjectOf`). */
  articleSlugs: string[];
  /** Published how-to posts featuring it (assembly guides), newest first. */
  howtoSlugs: string[];
  /** Ready-made rooms this product stands in. */
  rooms: ProductRoomData[];
};

const iso = (date: Date | null) => (date ? date.toISOString() : null);

const MEDIA_COLUMNS = {
  id: media.id,
  path: media.path,
  width: media.width,
  height: media.height,
  alt: media.alt,
  caption: media.caption,
  credit: media.credit,
  dominantColor: media.dominantColor,
  kind: media.kind,
};

/** At most three guides: the pillar + two, as DESIGN.md §6.3 block 19 asks. */
const GUIDE_LIMIT = 3;

type GuideLink = { slug: string; position: number; isPillar: boolean; productCount: number; publishedAt: Date | null };

/**
 * Guides where this product is the lead subject come first (it is listed first in the post),
 * then the more focused ones (fewer products featured), pillars before regular posts on a tie,
 * newest last. «برج یادگیری چیست؟» beats a gift guide that merely mentions the tower.
 */
function rankGuides(links: GuideLink[]): string[] {
  return [...links]
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.productCount - b.productCount ||
        Number(b.isPillar) - Number(a.isPillar) ||
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
    )
    .map((link) => link.slug);
}

function variantAvailability(product: Availability, stock: number): Availability {
  return product === "in_stock" && stock <= 0 ? "out_of_stock" : product;
}

function loadProductPage(slug: string) {
  const row = db
    .select({
      product: products,
      category: { id: categories.id, slug: categories.slug, name: categories.name },
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .get();
  if (!row) return null;
  const { product: p, category } = row;

  const variants: ProductVariantData[] = db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, p.id))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.id))
    .all()
    .map((v) => {
      const urlParam = v.urlParam?.trim().replace(/^\?/, "") || null;
      return {
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price ?? p.price,
        ownPrice: v.price,
        options: v.options,
        swatch: v.swatch,
        query: urlParam ?? `variant=${v.id}`,
        urlParam,
        availability: variantAvailability(p.availability, v.stock),
      };
    });

  const gallery: ProductMediaData[] = db
    .select(MEDIA_COLUMNS)
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(and(eq(productMedia.productId, p.id), inArray(media.kind, ["photo", "cutout"])))
    .orderBy(asc(productMedia.sortOrder), asc(media.id))
    .all();

  const addons: ProductAddonData[] = db
    .select({
      id: productAddons.id,
      key: productAddons.key,
      name: productAddons.name,
      priceToman: productAddons.priceToman,
      maxChars: productAddons.maxChars,
    })
    .from(productAddons)
    .where(and(eq(productAddons.productId, p.id), eq(productAddons.status, "published")))
    .orderBy(asc(productAddons.id))
    .all();

  const productFaqs: ProductFaqData[] = db
    .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "product"), eq(faqs.scopeId, p.id)))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();

  // Nothing that could show a child renders without written consent (DESIGN.md Appendix A).
  const reviewRows = db
    .select({ review: reviews, image: MEDIA_COLUMNS, imageConsent: media.consentAt })
    .from(reviews)
    .leftJoin(media, eq(media.id, reviews.mediaId))
    .where(
      and(
        eq(reviews.productId, p.id),
        eq(reviews.status, "approved"),
        IS_PRODUCTION_CONTENT ? eq(reviews.isSample, false) : undefined,
      ),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .all();
  const productReviews: ProductReviewData[] = reviewRows.map(({ review: r, image, imageConsent }) => ({
    id: r.id,
    authorName: r.authorName,
    city: r.city,
    childAge: r.childAge,
    rating: Math.min(5, Math.max(1, r.rating)),
    title: r.title,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase,
    isSample: r.isSample,
    createdAt: r.createdAt.toISOString(),
    image: image?.id != null && (r.consentAt || imageConsent) ? (image as ProductMediaData) : null,
  }));

  const familyPhotos: FamilyPhotoData[] = db
    .select({ photo: communityPhotos, image: MEDIA_COLUMNS })
    .from(communityPhotos)
    .innerJoin(media, eq(media.id, communityPhotos.mediaId))
    .where(
      and(
        eq(communityPhotos.productId, p.id),
        or(isNotNull(communityPhotos.consentAt), isNotNull(media.consentAt)),
        IS_PRODUCTION_CONTENT ? eq(communityPhotos.isSample, false) : undefined,
      ),
    )
    .orderBy(asc(communityPhotos.sortOrder), asc(communityPhotos.id))
    .all()
    .map(({ photo, image }) => ({
      id: photo.id,
      caption: photo.caption,
      customerName: photo.customerName,
      city: photo.city,
      isSample: photo.isSample,
      image: image as ProductMediaData,
    }));

  // Relations both ways: what this product points at, and who lists it as their accessory.
  const relations = db
    .select({ relatedSlug: products.slug, kind: productRelations.kind })
    .from(productRelations)
    .innerJoin(products, eq(products.id, productRelations.relatedId))
    .where(and(eq(productRelations.productId, p.id), eq(products.status, "published")))
    .orderBy(asc(productRelations.sortOrder))
    .all()
    .filter((r) => r.relatedSlug !== p.slug);
  const accessoryForSlugs = db
    .select({ slug: products.slug })
    .from(productRelations)
    .innerJoin(products, eq(products.id, productRelations.productId))
    .where(
      and(eq(productRelations.relatedId, p.id), eq(productRelations.kind, "upsell"), eq(products.status, "published")),
    )
    .all()
    .map((r) => r.slug);

  const featuring = db
    .select({
      postId: postProducts.postId,
      slug: posts.slug,
      format: posts.format,
      isPillar: posts.isPillar,
      publishedAt: posts.publishedAt,
      position: postProducts.sortOrder,
    })
    .from(postProducts)
    .innerJoin(posts, eq(posts.id, postProducts.postId))
    .where(and(eq(postProducts.productId, p.id), eq(posts.status, "published")))
    .all();
  const productCounts = new Map<number, number>();
  if (featuring.length) {
    const counts = db
      .select({ postId: postProducts.postId })
      .from(postProducts)
      .where(inArray(postProducts.postId, featuring.map((f) => f.postId)))
      .all();
    for (const { postId } of counts) productCounts.set(postId, (productCounts.get(postId) ?? 0) + 1);
  }
  const guideSlugs = rankGuides(
    featuring.map((f) => ({
      slug: f.slug,
      position: f.position,
      isPillar: f.isPillar,
      productCount: productCounts.get(f.postId) ?? 1,
      publishedAt: f.publishedAt,
    })),
  );
  const howtoSlugs = featuring
    .filter((f) => f.format === "howto")
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .map((f) => f.slug);

  const roomSlots = db
    .select({ slug: roomPresets.slug, slot: roomPresetItems.slot })
    .from(roomPresetItems)
    .innerJoin(roomPresets, eq(roomPresets.id, roomPresetItems.presetId))
    .where(and(eq(roomPresetItems.productId, p.id), eq(roomPresets.status, "published")))
    .all();

  return {
    product: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      summary: p.summary,
      description: p.description,
      sku: p.sku,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      availability: p.availability,
      leadTimeDays: p.leadTimeDays,
      ageMinMonths: p.ageMinMonths,
      ageMaxMonths: p.ageMaxMonths,
      skills: p.skills,
      material: p.material,
      finish: p.finish,
      dimensions: p.dimensions,
      weightKg: p.weightKg,
      maxLoadKg: p.maxLoadKg,
      highlights: p.highlights,
      specs: p.specs,
      inTheBox: p.inTheBox,
      safetyNotes: p.safetyNotes,
      careNotes: p.careNotes,
      warrantyMonths: p.warrantyMonths,
      assemblyMinutes: p.assemblyMinutes,
      alternateNames: p.alternateNames,
      guaranteeText: p.guaranteeText,
      torobEnabled: p.torobEnabled,
      illustration: p.illustration,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      canonicalPath: p.canonicalPath,
      noindex: p.noindex,
      publishedAt: iso(p.publishedAt),
      updatedAt: p.updatedAt.toISOString(),
    },
    category,
    variants,
    media: gallery,
    addons,
    faqs: productFaqs,
    reviews: productReviews,
    familyPhotos,
    relations,
    accessoryForSlugs,
    guideSlugs,
    articleSlugs: featuring.map((f) => f.slug),
    howtoSlugs,
    roomSlots,
  };
}

/** The product page for a published slug, or null (the page answers 404). */
export async function getProductPage(slug: string): Promise<ProductPageData | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.categories, tag.media, tag.reviews, tag.faqs, tag.posts, tag.rooms, tag.community);
  const data = loadProductPage(slug);
  if (!data) return null;
  cacheTag(tag.product(data.product.id));

  const { relations, guideSlugs, roomSlots, ...page } = data;
  const slugsOf = (kind: (typeof relations)[number]["kind"]) => relations.filter((r) => r.kind === kind).map((r) => r.relatedSlug);
  const bundleSlugs = slugsOf("bundle");
  // A product appears once per page (its card morph name is unique): bundle pieces win.
  const relatedSlugs = slugsOf("related").filter((s) => !bundleSlugs.includes(s));

  const [related, bundle, accessories, guides, allRooms] = await Promise.all([
    getProductCardsBySlugs(relatedSlugs),
    getProductCardsBySlugs(bundleSlugs),
    getProductCardsBySlugs(slugsOf("upsell")),
    getArticleCardsBySlugs(guideSlugs.slice(0, GUIDE_LIMIT)),
    roomSlots.length ? listRoomCards() : Promise.resolve([]),
  ]);
  // Shelf order, as /rooms lists them.
  const slotByRoom = new Map(roomSlots.map((r) => [r.slug, r.slot]));
  const rooms = allRooms.flatMap((room) => {
    const slot = slotByRoom.get(room.slug);
    return slot ? [{ ...room, slot }] : [];
  });

  return { ...page, related, bundle, accessories, guides, rooms };
}

/** Every published product slug, for generateStaticParams. */
export async function listProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products);
  return db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.status, "published"))
    .orderBy(asc(products.sortOrder), asc(products.id))
    .all()
    .map((r) => r.slug);
}
