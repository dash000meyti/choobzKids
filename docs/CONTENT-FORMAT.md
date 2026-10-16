# Content format (Markdown conventions)

Long-form bodies (posts, product descriptions, category/topic intros, pages) are stored as
**GitHub-flavoured Markdown** in SQLite and rendered on the server. The same conventions are
used by the phase-2 CMS editor, so seed content and editor content render identically.

## Structure rules (SEO / AEO / GEO)

- Never use `#` (H1) inside a body: the page title is the only H1.
- `##` (H2) headings are **questions** the reader would ask («برج یادگیری از چند سالگی مناسب است؟»).
- The **first paragraph after every H2 is the direct answer** in 40–60 words, self-contained and quotable.
  The renderer styles `h2 + p` as an "answer" paragraph.
- `###` (H3) for sub-points. Headings get stable `id` anchors automatically (TOC + deep links).
- Keep paragraphs short (2–4 sentences). Prefer lists and tables for facts.
- Every number (age, cm, minutes, %) that is not a Choobz product spec carries a source:
  name the source in the sentence («طبق راهنمای WHO…») and list it in the post's `sources`.
- Never invent Choobz statistics, customer counts, certificates, awards or test results.
  Product facts must match `seed/content/products.json`.
- Use ZWNJ (نیم‌فاصله, U+200C) correctly: می‌شود، اسباب‌بازی‌ها، کتاب‌خانه.
  Use Persian ی (U+06CC) and ک (U+06A9), never Arabic ي/ك. Never type kashida (ـ).
- Write digits as Persian digits (۰–۹) in prose. URLs, slugs and code stay Latin.

## Internal links (resolved at render time)

Do not hard-code site paths. Use these link schemes; the renderer maps them to real URLs,
so links keep working if routes change:

| Markdown | Links to |
|---|---|
| `[متن](product:learning-tower)` | product page |
| `[متن](category:climbing)` | shop category |
| `[متن](post:pikler-triangle-guide)` | article |
| `[متن](topic:movement)` | topic hub |
| `[متن](term:pikler-triangle)` | glossary term |
| `[متن](page:shipping)` | static page |
| `[متن](https://…)` | external link (opens with rel="noopener") |

## Callouts

GitHub alert syntax. The optional text after the marker on the same line is the callout title.

```md
> [!TIP] یک پیشنهاد کاربردی
> متن نکته…

> [!NOTE]
> توضیح تکمیلی…

> [!WARNING] نکتهٔ ایمنی
> هشدار ایمنی…

> [!WORKSHOP] از کارگاه چوبز
> تجربهٔ دست‌اول کارگاه دربارهٔ ساخت/چوب/پرداخت…

> [!EXPERT] نگاه متخصص
> توضیح علمی با ذکر منبع…

> [!MYTH] باور رایج
> **باور:** …
> **واقعیت:** …
```

A plain blockquote (no marker) renders as a **pull quote**.

## Blocks (directives)

```md
::product{slug="pikler-triangle"}
```
Embeds a product card (image, name, price, age, link). Use 1–3 per article, each after the
section where the product naturally answers the reader's need.

```md
::products{slugs="learning-tower,kids-table-chair,montessori-shelf"}
```
A small product row (2–4 items), e.g. at the end of a checklist.

```md
:::steps
1. **عنوان گام** — توضیح گام…
2. **عنوان گام** — توضیح گام…
:::
```
A numbered step list (rendered as a visual stepper and marked up as HowTo steps).

```md
::illustration{name="learning-tower" caption="برج یادگیری کنار کانتر آشپزخانه"}
```
Inline brand illustration (keys in `src/db/seed/types.ts` → `IllustrationKey`).

## Tables and checklists

GFM tables for comparisons (first column = the thing compared; keep cells short).
GFM task lists render as a printable checklist:

```md
- [ ] تشک محکم و هم‌اندازهٔ تخت
- [ ] قفسهٔ کوتاه برای ۴ تا ۶ اسباب‌بازی
```
