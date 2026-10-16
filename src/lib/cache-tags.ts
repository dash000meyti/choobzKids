/*
 * One place for the cache-tag taxonomy (TECH.md §2.3). Readers call cacheTag(...) with these;
 * the phase-2 CMS calls updateTag/revalidateTag with the same values.
 * Tag by id (not slug) so a slug change cannot orphan entries; also tag the collection.
 */
export const tag = {
  site: "site",
  settings: "settings",
  products: "products",
  product: (id: number) => `product:${id}`,
  categories: "categories",
  reviews: "reviews",
  posts: "posts",
  post: (id: number) => `post:${id}`,
  topics: "topics",
  authors: "authors",
  glossary: "glossary",
  faqs: "faqs",
  pages: "pages",
  rooms: "rooms",
  community: "community",
  workshop: "workshop",
  media: "media",
  og: "og",
} as const;
