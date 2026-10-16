-- Site search (SEO.md §6.5, §7.5). Not modelled in schema.ts: drizzle-kit has no FTS5 support.
-- Rebuilt from the content tables by rebuildSearchIndex() (src/db/seed/search-index.ts).
--   kind     product | category | room | post | topic | term
--   ref_id   id in that kind's table; slug builds the URL
--   label    display title as written; hint = one short display line (category, topic, tagline…)
--   title, keywords, body  the Persian search key (searchKey(): folded letters, no harakat,
--            ZWNJ as a space, Latin digits, lower case) plus the ZWNJ-joined spelling of every
--            compound, so «اسباب‌بازی» matches «اسباب بازی» and «اسباببازی».
CREATE VIRTUAL TABLE `search_index` USING fts5(
  kind UNINDEXED,
  ref_id UNINDEXED,
  slug UNINDEXED,
  label UNINDEXED,
  hint UNINDEXED,
  title,
  keywords,
  body,
  tokenize = 'unicode61 remove_diacritics 2',
  prefix = '2 3'
);
