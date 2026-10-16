import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { glossaryTerms } from "@/db/schema";
import { tag } from "@/lib/cache-tags";
import type { GlossaryEntry } from "@/lib/markdown";

/*
 * The slice of the glossary the Markdown renderer needs: names to match first mentions
 * (SEO.md §4.6) and the one-sentence definition for the hover card (DESIGN.md §7.3).
 */
export async function listGlossaryLinkTerms(): Promise<GlossaryEntry[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary);
  return db
    .select({
      slug: glossaryTerms.slug,
      term: glossaryTerms.term,
      definition: glossaryTerms.definition,
      alternateNames: glossaryTerms.alternateNames,
    })
    .from(glossaryTerms)
    .orderBy(asc(glossaryTerms.slug))
    .all();
}
