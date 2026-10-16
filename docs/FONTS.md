# Fonts for choobz.kids: verified selection

Status: decided for Phase 1 (front end). Verified on 2026-10-16.
Scope: Persian-first (`lang="fa" dir="rtl"`) site for a premium-yet-playful wooden-toy brand. Everything is self-hosted. There are no runtime requests to Google Fonts, CDNs or GitHub.

Sizes are KiB (1024 bytes) of the actual `.woff2` file we would ship.

---

## 1. TL;DR: the recommended pairing

| Role | Font | Version | Why | Ship file (in `src/fonts/`) | Size |
|---|---|---|---|---|---|
| **Body / UI** | **Estedad** (variable `wght` 100–900), with `ss01` "Arabic Round Dots" on | 8.5 (2026‑03) | Very readable monoline Persian sans with complete Persian coverage. It has feature-based Latin→Persian digits (`ss20`) and tabular digits (`tnum`). Round dots echo wooden beads. It is less overused than Vazirmatn. | `estedad/estedad-fa-wght.woff2` | **50.5** |
| **Display / headlines** | **Ario**, style "Dots 1" | 2.0.1 (2026‑08) | A chunky, warm, Persian-native display face built on Estedad's skeleton, so the two harmonize. Its merged "carved" dots feel hand-cut, like wooden cut-outs. It has swash ک/گ (`ss02`/`swsh`) for hero lines. It is brand new, so almost nobody in Iran uses it yet. | `ario/ario-dots1-fa.woff2` | **19.0** |
| **Accent / handwritten notes, stickers, price tags** | **Mikhak**, instanced to wght 600, dot-style 1, **`KSHD` (kashida) axis kept 100–200** | 3.4 | A friendly semi-handwritten face by the same designer as Estedad (Amin Abedi). Its live kashida-stretch axis gives us an animatable signature micro-interaction that no other Iranian kids brand has. | `mikhak/mikhak-fa-600-kshd.woff2` | **26.3** |
| Latin companion | **None needed.** Estedad and Ario include good Latin and 0–9. The **CHOOBZ wordmark should be an inline SVG** (custom lettering, 0 font bytes). | — | — | — | 0 |

**Budget:** 95.8 KiB in total. Only **69.5 KiB is critical** (Estedad + Ario are preloaded). Mikhak is not preloaded because it is only used for small accents.
For comparison, Vazirmatn alone from the official package is 108 KiB, and the Fontsource Arabic+Latin split of Vazirmatn is 78 KiB.

A visual proof of the pairing, rendered from the exact subset files with headless Chromium, is described in §4. Everything in the table was checked both with fontTools and visually.

---

## 2. How this was verified

* **Downloads:** files were fetched into a scratch directory outside the repo. Sources were `npm pack` (Fontsource 5.3.x, `vazirmatn@33.0.3`, `sahel-font`, `shabnam-font`, `samim-font`, `parastoo-font`, `gandom-font`, `tanha-font`, `nahid-font`, `next-persian-fonts@1.2.0`) and GitHub releases via `gh` (Estedad 8.5, Mikhak 3.4, Arad 2.5.1, Ario 2.0.1, AQ Normal Sans 1.0.0, Fandogh, Oi).
* **Automated check:** a Python script using fontTools 4.60.2 checked each font for:
  * **Persian letters** in the cmap: پ چ ژ گ ک(U+06A9) ی(U+06CC) ۀ آ أ ؤ ئ ء, and the base Arabic letters.
  * **ZWNJ** U+200C, ZWJ, LRM and RLM.
  * **Persian digits** U+06F0–06F9, **punctuation** ، ؛ ؟ « » ٪ ٫ ٬, **harakat** U+064B–0652/0670/0654, **kashida** U+0640, **﷼** U+FDFC, and Latin A–Z a–z 0–9.
  * **۴ ۵ ۶ vs Arabic ٤ ٥ ٦:** whether they map to the *same glyph* or an *identical outline* (outlines were hashed with a RecordingPen).
  * **Layout tables:** GSUB scripts and language systems, and the presence of `init/medi/fina/rlig` and GPOS `mark/mkmk/kern`.
  * **Digit-related substitutions:** every GSUB single or alternate lookup was walked to find which feature maps Latin `four` → `uni06F4`, Arabic `٤` → `۴`, or `۴` → Urdu or tabular forms.
  * **Other data:** `fvar` axes and instances, metrics (UPM, hhea/typo/win line-heights, USE_TYPO_METRICS), the license and copyright name records, and Reserved Font Names.
* **Size measurement:** sizes were measured from a real `pyftsubset` run using the exact Unicode set in §5.3, with `--layout-features='*' --no-hinting --name-IDs='*' --flavor=woff2`.
* **Visual check:** a specimen was rendered in headless Chromium on macOS with `lang="fa" dir="rtl"`. It covered a sentence with ZWNJ words, isolated Persian letters, `۰۱۲۳۴۵۶۷۸۹` vs `٠١٢٣٤٥٦٧٨٩` vs `0123456789`, `۱٬۲۵۰٬۰۰۰ تومان`, `۵۰٪`, kashida, and final, medial and isolated `ی`/`ک`. **This step was necessary:** the cmap and outline test passes Alexandria, Lemonada and Baloo Bhaijaan 2, but they render Persian wrongly (§3.2).

---

## 3. Verified comparison

### 3.1 Table

Legend:
* **۴۵۶:** ✓ = a distinct Persian glyph exists (cmap/outline test). = = the same glyph as Arabic ٤٥٦ (wrong). ≡ = an identical outline (wrong). ∅ = missing.
* **Visual:** ✓ = Persian forms render correctly in Chromium. ✗ = a rendering bug (see §3.2). — = not rendered in the specimen.
* **ZWNJ "missing":** the font has no glyph for U+200C. Browsers still handle it, because it is default-ignorable and joining still breaks. It *can* show as tofu in non-browser renderers such as OG-image generators and PDF tools.
* **"ۀ missing":** HarfBuzz can usually compose it from ه + ٔ (U+0654). This is a soft gap.
* **Shipped KiB:** the file(s) as published (for Fontsource, the Arabic + Latin subset files).
* **Subset KiB:** our fa+latin subset (§5.3).

| Font | Source @ version | Role | Shaping | ۴۵۶ | Visual | Gaps found | Axes | Latin→fa digits via font | `tnum` | Shipped KiB | Subset KiB | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Estedad** | GitHub `aminabedi68/Estedad` 8.5 | body + headline | ✓ | ✓✓✓ | ✓ | none | wght 100–900 | **`ss20`** (+`aalt`) | ✓ (fa + latin) | 118 (woff2) | **50.5** | **Recommended body** |
| Estedad | `@fontsource-variable/estedad@5.3.0` (also 8.5) | body | ✓ | ✓✓✓ | ✓ | **stylistic sets stripped** (no ss01–03, ss20) | wght 100–900 | — | ✓ | 82 (2 files) | 43 | Fallback source only |
| **Ario** (Dots1–4 = 4 files) | GitHub `MohamadDarvishi/Ario` 2.0.1 | display | ✓ | ✓✓✓ | ✓ | no U+2212 (minus) | static (designed heavy, wght class 400) | **`ss01`** | ✓ | 24 (woff2) | **19.0** | **Recommended display** |
| **Mikhak** | GitHub `aminabedi68/Mikhak` 3.4 | accent / handwritten | ✓ | ✓✓✓ | ✓ | none (LRM/RLM/﷼ absent; harmless) | DSTY 0–2.9, wght 100–900, **KSHD 100–200** | — | — | 65 (woff2) | 48 full VF / **26.3** at wght 600 + KSHD | **Recommended accent** |
| Arad | GitHub `MohamadDarvishi/Arad` 2.5.1 (2026‑10‑07) | body + display | ✓ | ✓✓✓ | ✓ | none; **RFN "Arad"** | wght 100–1000, DSTY 1–3 | **`ss01`** | ✓ | 107 (woff2) | 86.5 (both axes) / 76.9 (wght 300–1000 only) | **Alternative A** |
| Vazirmatn | npm `vazirmatn@33.0.3` | body | ✓ | ✓✓✓ | ✓ | none | wght 100–900 | **`ss01`** | ✓ | 108 | 59.0 | **Alternative B** body (but ubiquitous in Iran) |
| Vazirmatn Round‑Dots | npm `vazirmatn@33.0.3` `Round-Dots/` | body | ✓ | ✓✓✓ | ✓ | none | wght 100–900 | `ss01` | ✓ | 109 | 55.9 (wght 300–800) | Alternative B (preferred cut) |
| Vazirmatn | `@fontsource-variable/vazirmatn@5.3.0` | body | ✓ | ✓✓✓ | ✓ | `ss01` stripped by split | wght 100–900 | — | ✓ | 78 | 51 | OK, but loses ss01 |
| Lalezar | `@fontsource/lalezar@5.3.0` | display | ✓ | ✓✓✓ | ✓ | no ZWNJ glyph | static | — | — | 67 | 36 (2 files) | Alt B display; **overused in Iran** |
| Oi | `@fontsource/oi@5.3.0` / GitHub `kosbarts/Oi` | ultra-fat display | ✓ | ✓✓✓ | ✓ | no ZWNJ, no ٪ | static | — | — | 42 | 32 | Spice for 1–3-word stickers only |
| Marhey | `@fontsource-variable/marhey@5.3.0` | playful display | ✓ | ✓✓✓ | ✓ (medial ی cramped: «پیچ» reads «پچ») | no ZWNJ, no ۀ | wght 300–700 | — | — | 51 | 39 | Usable with care; Arabic-centric |
| Baloo Bhaijaan 2 | `@fontsource-variable/baloo-bhaijaan-2@5.3.0` | display | ✓ | ✓✓✓ | **✗** final ی dotted («يي»); ۴ correct only through `locl` FAR | — | wght 400–800 | — | — | 71 | 49 | **Reject** for Persian |
| Alexandria | `@fontsource-variable/alexandria@5.3.0` | display | ✓ | ✓✓✓ | **✗** ۴ drawn in Urdu form (reads like ۳) | no ZWNJ, no ۀ | wght 100–900 | — | — | 60 | 43 | **Reject** |
| Lemonada | `@fontsource-variable/lemonada@5.3.0` | display | ✓ | ✓✓✓ | **✗** ۴ Urdu form | no ZWNJ, no ۀ | wght 300–700 | — | — | 67 | 51 | **Reject** |
| Reem Kufi / Fun (COLR) / Ink (SVG) | `@fontsource(-variable)/reem-kufi*` | display | ✓ | ✓=✓ | **✗** ۵ = Arabic ٥ | no ZWNJ, no ٪٫٬ | wght 400–700 | — | — | 28–34 | 21–22 | **Reject** |
| Zain | `@fontsource/zain@5.3.0` (2024) | body/display | ✓ | ≡≡≡ | ✗ | Persian digits identical to Arabic | static | — | — | 49 | 36 | **Reject** |
| Readex Pro | `@fontsource-variable/readex-pro` | body | ✓ | ∅ | ✗ | **no پ چ ژ گ ک ی, no ۰–۹** | wght 160–700 | — | — | 53 | 40 | **Reject** |
| Playpen Sans Arabic | `@fontsource-variable/playpen-sans-arabic` | handwritten | ✓ | ✓✓✓ | ✓ | no ۀ | wght 100–800 | — | — | 286 | **232** | Too heavy |
| Noto Sans Arabic | `@fontsource-variable/noto-sans-arabic` | body | ✓ | ✓✓✓ | ✓ | none | wght 100–900 (+wdth) | — (`pnum`/`tnum`) | ✓ | 192 | 58 | Solid but generic, tall line box (2.11) |
| Noto Naskh Arabic | `@fontsource-variable/noto-naskh-arabic` | serif body | ✓ (no kern) | ✓✓✓ | ✓ | none | wght 400–700 | — | ✓ | 111 | 36 | Not on-brand (book/naskh) |
| Noto Kufi Arabic | `@fontsource-variable/noto-kufi-arabic` | display | ✓ (no kern) | ✓✓✓ | — | none | wght 100–900 | — | ✓ | 150 | 49 | Generic |
| IBM Plex Sans Arabic | `@fontsource/ibm-plex-sans-arabic` | body | ✓ | ✓✓✓ | ✓ | no ZWNJ | static ×7 | — | — | 60 / weight | 30 / weight | Corporate tone |
| Rubik (Arabic) | `@fontsource-variable/rubik` | body | ✓ | ✓✓✓ | ✓ | no ZWNJ, no ۀ | wght 300–900 | — | — | 66 | 45 | Arabic-centric, short line box |
| Changa / Cairo / El Messiri / Kufam | Fontsource variable | display | ✓ | ✓✓✓ | — | no ZWNJ (and no ۀ for Changa/Cairo/El Messiri) | wght | — | — | 44–89 | 32–52 | Arabic-centric, not distinctive |
| Rakkas / Blaka / Badeen Display / Jomhuria / Katibeh / Mirza | Fontsource static | display | ✓ | ✓✓✓ | — | various (no ZWNJ / ۀ; Blaka has no kashida) | static | — | — | 21–55 | 15–34 | Off-brand (calligraphic, blackletter or poster) |
| Aref Ruqaa Ink | `@fontsource/aref-ruqaa-ink` | accent | ✓ | ✓✓✓ | — | SVG color font, RFN | static | — | — | 130 | — | Too heavy, calligraphic |
| Gulzar (Nastaliq) | `@fontsource/gulzar` | accent | ✓ | ✓✓✓ | — | no ۀ ٪٫٬, no kashida | static | — | — | 228 | 157 | Too heavy |
| Vibes | `@fontsource/vibes` | accent | ✓ | ✓✓✓ | ✗ (poor Persian look) | no ZWNJ, ۀ | static | — | — | 33 | 26 | Reject |
| Fandogh | GitHub `aminabedi68/Fandogh` | decorative | **✗ no init/medi/fina** | ✓≡≡ | ✗ letters do not join | many | static | — | — | 26 | 6 | **Reject** |
| Handjet | `@fontsource-variable/handjet` | pixel | ✗ (no `arab` script tag) | ✓✓✓ | — | — | wght, ELGR, ELSH | — | — | 16 | 10 | Off-brand |
| AQ Normal Sans | GitHub `AzadQalam/normal-sans` 1.0.0 (2025‑12) | body | ✓ | ✓✓✓ | ✓ | no LRM/RLM; RFN | wght 100–900 | `ss01` | ✓ | 79 | 31 | Too new (4★), conservative |
| Sahel VF | `sahel-font@3.4.0` | body | ✓ | ✓✓✓ | — | **no Latin 0–9**; known VF mark-placement bug (README) | wght 400–900 | — | — | 37 | 33 | Outdated (2020) |
| Shabnam / Samim / Parastoo / Gandom / Tanha / Nahid | npm `*-font` (Rastikerdar) | body / serif / accent | ✓ | ✓✓✓ | ✓ | none (statics); mixed OFL + Bitstream Vera + PD licensing | static | — | — | 35–45 / weight | 24–33 | Legacy (2017–2020) |
| Latin: Fredoka / DynaPuff / Baloo 2 / Grandstander / Bricolage Grotesque / Fraunces | `@fontsource-variable/*@5.3.0` latin file | Latin only | n/a | n/a | n/a | no Arabic script (expected) | wght (+wdth etc.) | n/a | — | 29 / 36 / 32 / 41 / 40 / 35 | — | Optional (§6) |

Metrics, as the natural line box `(ascender − descender + lineGap) / UPM` from hhea:
* Estedad 1.525 (USE_TYPO_METRICS on)
* Ario 1.379
* Mikhak 1.66 (Windows `usWin*` 1.952)
* Vazirmatn 1.562 (win 1.709)
* Arad 1.432
* Lalezar 1.567
* Noto Sans Arabic 2.11

### 3.2 Findings the cmap test alone would have missed

1. **Alexandria and Lemonada** draw U+06F4 in the **Urdu** shape, which reads as ۳ to Iranians. The outline is "distinct from ٤", so an automated check passes it. It fails visually.
2. **Baloo Bhaijaan 2** renders **final ی with two dots** (Arabic yeh style) even in a `lang="fa"` page. Its Persian ۴ appears only through `locl` on the FAR language system: with `lang="ar"` or no `lang`, you get the Urdu form.
3. **Reem Kufi (all cuts)** maps ۵ to the same glyph as Arabic ٥. **Zain** maps ۴۵۶ to identical outlines as ٤٥٦.
4. **Fontsource / Google-hosted splits strip features we need.**
   * `@fontsource-variable/vazirmatn` lacks `ss01`.
   * `@fontsource-variable/estedad` lacks `ss01`–`ss03` (round, square and rect dots) and `ss20` (Latin→Persian digits).
   * The cause: the Arabic and Latin glyphs live in different files, so cross-script substitutions cannot exist, and the Google build drops the stylistic sets. **Use upstream files and build one combined fa+latin subset.**
5. **Estedad 8.5 has a non-standard `avar`:** it maps 0 → −0.1. Browsers render it fine, but `fontTools.varLib.instancer` refuses to range-limit it. Ship the full 100–900 range (only 50.5 KiB anyway).
6. **`tabular-nums` with Persian prices** spreads `۱٬۲۵۰٬۰۰۰` very wide, because the separators become tabular too. Use `tnum` only in tables, counters and timers, never for inline prices.
7. Ario has a glyph `uni065B` with an invalid advance (65534). It lies outside our subset, so it is removed by subsetting.

### 3.3 Glyph features of the recommended fonts (from the `name` table)

* **Estedad:**
  * `ss01` Arabic Round Dots, `ss02` Square Dots, `ss03` Rect Dots
  * `ss10` isolated Alef‑Lam ligature
  * `ss11`/`ss12` Latin alternate a/g
  * **`ss20` Latin to Farsi digits**
  * `tnum` (Persian and Latin), `onum`/`sups`/`subs`/`sinf`/`frac` (Latin), `zero`, `smcp`/`c2sc`
  * `locl` URD
* **Ario:**
  * **`ss01` digit substitution (Arabic and English → Persian)**
  * **`ss02` = `swsh` swash Kaf and Gaf**
  * `ss03` reversed Yeh
  * `tnum`, `locl` FAR/URD
  * Four dot styles are shipped as separate files (Dots1–4).
* **Mikhak:**
  * `ss01` alternate گ
  * axes `DSTY` (dot style 0–2.9), `wght` 100–900, **`KSHD` kashida 100–200** (stretches joins live)
* **Arad (Alt A):**
  * `ss01` Persian digits, `ss02`/`swsh` swash Kaf and Gaf, `ss03` reversed Yeh, `ss04` "Rial, Toman and Derham symbols" (named in font; trigger sequence not verified), `tnum`
  * axes `wght` 100–1000 and `DSTY` 1–3

---

## 4. Visual proof (what was rendered)

* **Headline:** Ario Dots1 64px with `ss02` (swash ک):
  اسباب‌بازی‌های چوبی، رفیقِ کودکی
* **Body:** Estedad 18px, line-height 1.85, `ss01` round dots, with ZWNJ words, ؛ and ۱ تا ۶.
* **Note:** Mikhak 600, rotated −3°, at `KSHD` 100 and 200.
* **Wordmark:** CHOOBZ kids in Ario's Latin.

All letters joined correctly. ZWNJ (نیم‌فاصله) broke joins correctly. ۴۵۶ rendered in Persian forms. ٬ rendered as the thousands separator. `ss20`/`ss01` converted 2026 → ۲۰۲۶. `tnum` aligned ۱۱۱ / ۸۸۸.

---

## 5. Implementation (recommended pairing)

### 5.1 Where to get the files (exact sources)

| Font | Primary source (use this) | Upstream file to subset | sha256 of upstream file | Alternative npm source |
|---|---|---|---|---|
| Estedad 8.5 | GitHub release `aminabedi68/Estedad`, tag **`8.5`**, asset `Estedad-v8.5.zip` (1,512,537 B) | `Estedad-v8.5/Estedad[wght].ttf` | `3134e31a27d58e615967e714c7799fbfa2de952876f8597b33dc57ffe0e99d03` | `next-persian-fonts@1.2.0` → `estedad/Estedad-VF.woff2` (120,924 B, v8.5, all features intact; verified). **Not** `@fontsource-variable/estedad`, which has its stylistic sets stripped. |
| Ario 2.0.1 | GitHub release `MohamadDarvishi/Ario`, tag **`2.0.1`**, asset `Ario_2.0.1.zip` (895,671 B) | `Main_Fonts/Ario-Dots1.ttf` (or `Main_Fonts/Webfonts/Ario-Dots1.woff2`, 24,932 B, if you skip subsetting) | `b721f51428a5f9f70b152b7537a1033abe115217bc246ab416c3f8e7b3be5edd` | not on npm |
| Mikhak 3.4 | GitHub release `aminabedi68/Mikhak`, tag **`3.4`**, asset `Mikhak-v3.4.zip` (4,759,758 B) | `Mikhak-v3.4/Variable/Mikhak[DSTY,KSHD,wght].ttf` | `9a089b44b53b54cc005e318505db179d0ff591e7114fa4b875c673e73d6e88bc` | `next-persian-fonts@1.2.0` → `mikhak/Mikhak-VF.woff2` (66,668 B) |

The release zips **do not contain license files**. Copy each repo's `LICENSE` (OFL‑1.1) into `src/fonts/LICENSES/`.
Fonts are built **once on a developer machine** and the `.woff2` outputs are **committed**. The Docker build therefore needs no network (GitHub is slow or unreliable from Iran).

### 5.2 Target layout in the repo

```
src/fonts/
  estedad/estedad-fa-wght.woff2        50.5 KiB   wght 100–900, all GSUB features
  ario/ario-dots1-fa.woff2             19.0 KiB   static, all GSUB features
  mikhak/mikhak-fa-600-kshd.woff2      26.3 KiB   wght fixed 600, DSTY fixed 1, KSHD axis 100–200
  LICENSES/Estedad-OFL.txt  Ario-OFL.txt  Mikhak-OFL.txt
  PROVENANCE.md                        versions, sha256 of sources, build command
```

### 5.3 Build script (reference; run once and commit the outputs)

```bash
#!/usr/bin/env bash
# scripts/fonts/build.sh: reproducible Persian webfont build. Requires: python3, gh (or curl).
set -euo pipefail
OUT=src/fonts; W=$(mktemp -d)
python3 -m venv "$W/venv"; "$W/venv/bin/pip" install -q 'fonttools==4.60.2' brotli
PY="$W/venv/bin/python -I"

gh release download 8.5   -R aminabedi68/Estedad    -p 'Estedad-v8.5.zip' -D "$W"
gh release download 2.0.1 -R MohamadDarvishi/Ario   -p 'Ario_2.0.1.zip'   -D "$W"
gh release download 3.4   -R aminabedi68/Mikhak     -p 'Mikhak-v3.4.zip'  -D "$W"
for z in "$W"/*.zip; do $PY -c 'import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$z" "$W/x"; done

# Persian core + basic Latin + the punctuation that Intl.NumberFormat('fa-IR') emits (٪ ٫ ٬ U+200E U+2212)
U='U+0020-007E,U+00A0,U+00A9,U+00AB,U+00AE,U+00B0,U+00BB,U+00D7,U+00F7,U+060C,U+061B,U+061F,U+0621-063A,U+0640-0655,U+0660-066D,U+0670,U+067E,U+0686,U+0698,U+06A9,U+06AF,U+06C0,U+06CC,U+06D4,U+06F0-06F9,U+200C-200F,U+2010-2011,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2039-203A,U+20AC,U+2122,U+2212,U+25CC,U+FD3E-FD3F,U+FDFC'
sub() { $PY -m fontTools.subset "$1" --unicodes="$U" --layout-features='*' --no-hinting --name-IDs='*' --flavor=woff2 --output-file="$2"; }

mkdir -p "$OUT"/{estedad,ario,mikhak,LICENSES}
sub "$W/x/Estedad-v8.5/Estedad[wght].ttf"   "$OUT/estedad/estedad-fa-wght.woff2"
sub "$W/x/Main_Fonts/Ario-Dots1.ttf"        "$OUT/ario/ario-dots1-fa.woff2"
$PY -m fontTools.varLib.instancer "$W/x/Mikhak-v3.4/Variable/Mikhak[DSTY,KSHD,wght].ttf" wght=600 DSTY=1 -o "$W/mikhak-600.ttf"
sub "$W/mikhak-600.ttf"                     "$OUT/mikhak/mikhak-fa-600-kshd.woff2"

for r in aminabedi68/Estedad:Estedad MohamadDarvishi/Ario:Ario aminabedi68/Mikhak:Mikhak; do
  gh api "repos/${r%%:*}/license" --jq .content | base64 -d > "$OUT/LICENSES/${r##*:}-OFL.txt"
done
```

The Unicode set includes ك U+0643 and ي U+064A, so Arabic-keyboard input still renders. The CMS must still **normalize ي→ی and ك→ک** for search consistency (see §7.6).

### 5.4 Loading with `next/font/local` (Next.js 16)

```ts
// src/app/fonts.ts
import localFont from 'next/font/local';

const fallback = ['system-ui', 'Segoe UI', 'Tahoma', 'sans-serif'];

export const fontBody = localFont({
  src: [{ path: '../fonts/estedad/estedad-fa-wght.woff2', weight: '100 900', style: 'normal' }],
  variable: '--ff-body', display: 'swap', preload: true, fallback, adjustFontFallback: false,
});
export const fontDisplay = localFont({
  src: [{ path: '../fonts/ario/ario-dots1-fa.woff2', weight: '400', style: 'normal' }],
  variable: '--ff-display', display: 'swap', preload: true, fallback, adjustFontFallback: false,
});
export const fontHand = localFont({
  src: [{ path: '../fonts/mikhak/mikhak-fa-600-kshd.woff2', weight: '600', style: 'normal' }],
  variable: '--ff-hand', display: 'swap', preload: false, fallback, adjustFontFallback: false,
});
// layout.tsx: <html lang="fa" dir="rtl" className={`${fontBody.variable} ${fontDisplay.variable} ${fontHand.variable}`}>
```

* `adjustFontFallback` is disabled because Next computes size-adjust from Latin metrics, which is wrong for Persian. CLS is controlled by **explicit line-heights** and the **preload** of the two critical files (about 70 KiB, which arrives before first paint on 4G).
* Do not put `font-feature-settings` in the `@font-face` declarations: Chromium ignores that descriptor. Set features on elements.

### 5.5 Tailwind v4 tokens

```css
/* globals.css */
@import "tailwindcss";
@theme inline {
  --font-sans:    var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;
  --font-display: var(--ff-display), var(--ff-body), system-ui, sans-serif;
  --font-hand:    var(--ff-hand), var(--ff-body), system-ui, sans-serif;
}
html { font-family: var(--font-sans); font-synthesis: none; font-feature-settings: "ss01"; /* Estedad round dots */ }
:where(:lang(fa), [dir="rtl"]) { letter-spacing: 0; }          /* never track Arabic script */
.font-display { font-weight: 400; font-feature-settings: "ss02"; } /* Ario: real weight is 400, swash ک/گ */
```

* The next/font variables use the `--ff-*` prefix so they never collide with Tailwind's `--font-*` theme tokens. A collision would create a self-referencing variable.
* `font-synthesis: none` matters. Ario is a single file whose weight class is 400 although it is visually black. Without this rule, a `font-bold` on it would produce **faux bold**.

---

## 6. Alternatives

**Alternative A: "one variable family" (Arad + Mikhak).**
Arad 2.5.1 VF (`wght` 100–1000 plus a `DSTY` dot-style axis 1–3) serves both body and display.
* **Features:** swash ک/گ, `ss01` Persian digits, `tnum`, a Toman/Rial symbol set.
* **Size:** one critical file of **86.5 KiB** (both axes) or **76.9 KiB** (wght 300–1000, DSTY dropped), plus Mikhak 26.3. That is about **103–113 KiB in total**, of which 77–87 is critical.
* **Pros:** one request, and the dot-style axis can be animated (dots morph on hover, a strong signature).
* **Cons:** less headline character than Ario, a bigger critical file, and a very fresh release (2026‑10‑07).
* **License:** the LICENSE reserves the name **"Arad"**, so **rename the family in the subset** (for example "Choobz Sans" via fontTools `name` records), or ship the upstream WOFF2 unmodified. Its zip has non-UTF-8 filenames; extract it with Python `zipfile`, not `unzip`.

**Alternative B: "classic and safe" (Vazirmatn Round-Dots + Lalezar + Mikhak).**
* **Body:** Vazirmatn RD VF (`vazirmatn@33.0.3`, `Round-Dots/fonts/variable/Vazirmatn-RD[wght].ttf`, instanced to wght 300–800). It is the most battle-tested Persian UI font and has `ss01` digits. Size: **55.9 KiB**.
* **Display:** Lalezar, by Borna Izadpanah: Persian-native, bold and correct. Use `@fontsource/lalezar@5.3.0` `files/lalezar-arabic-400-normal.woff2` + `lalezar-latin-400-normal.woff2` (67 KiB as published, about 36 KiB re-subset), or the TTF from `google/fonts` `ofl/lalezar`.
* **Accent:** Mikhak (26.3 KiB).
* **Total:** about **118 KiB**.
* **Downside:** both Vazirmatn and Lalezar are **everywhere** in Iranian web and Instagram design, which conflicts with the "unrepeatable" brief.

**Optional spice (any option):** **Oi** (`@fontsource/oi@5.3.0`, or GitHub `kosbarts/Oi`, about 32 KiB subset). It is an ultra-fat, joyful display face, correct for Persian. Use it only for 1–3-word stickers or giant numerals, lazy-loaded.

**Optional Latin companion:** none is required.
* **Fredoka** (`@fontsource-variable/fredoka@5.3.0` → `files/fredoka-latin-wght-normal.woff2`, 29 KiB, wght 300–700) if English taglines need a rounded toy voice.
* **DynaPuff** (`@fontsource-variable/dynapuff`, 36 KiB) for bubbly.
* **Bricolage Grotesque** (40 KiB) for an editorial, premium Latin voice.

Fontsource Latin files are fine to copy as-is. Their Latin features are intact.

---

## 7. Rendering rules for Persian (apply site-wide)

### 7.1 `lang` and `dir`
`<html lang="fa" dir="rtl">` is **mandatory**.
* HarfBuzz maps `fa` to the OpenType FAR language system, which drives `locl`. Some fonts only show the Persian ۴ under FAR.
* Screen readers pick a Persian voice.
* Answer engines and generative engines read the language from it.

Mark English islands with `<span lang="en" dir="ltr">`.

### 7.2 Line-height
Never leave it at `normal`. Persian has tall ascenders (ط ک گ ل), deep descenders (ی ن ج ر) and stacked marks. Also, Mac (hhea) and Windows (`usWin`) line boxes differ, for example Mikhak 1.66 vs 1.95. An explicit value removes both cross-platform drift and swap-time CLS.

| Text | Size | line-height |
|---|---|---|
| Body prose (Estedad) | 16–18px | **1.8–1.9** |
| UI and cards | 14–16px | 1.55–1.65 |
| Headlines (Ario) | 32–96px | **1.25–1.35** (natural 1.38). Never below 1.2, or the dots of ک/گ/ی collide across lines. Do not clip with `overflow:hidden` or `background-clip:text` without padding. |
| Handwritten notes (Mikhak) | 18–28px | 1.5–1.6 |
| Kids' reading text with harakat (اعراب) | — | **≥ 2.0** |

Use `text-wrap: balance` for headlines and `text-wrap: pretty` for prose; both work for Persian. Use `text-align: start`, not `justify`. Chromium justifies Persian by widening spaces, not with kashida.

### 7.3 Letter-spacing
`letter-spacing` **must be 0** for Arabic script. Non-zero tracking disables ligatures in Chromium and opens gaps between joined letters in Firefox and Safari.
* Ban Tailwind `tracking-*` on Persian elements. Allow it only on `[lang=en]` Latin labels.
* For "stretched" Persian, use **Mikhak's `KSHD` axis** or Ario's `swsh`, never tracking.

### 7.4 Kashida (ـ U+0640)
**Never type kashida into real content.** «چـوب» ≠ «چوب» for search, answer engines and copy/paste.
* For decorative stretch, use `font-variation-settings: "KSHD" 200` (Mikhak). It is purely visual, so the DOM text stays clean.
* If literal kashida is unavoidable, render a decorative copy with `aria-hidden="true"` next to the clean text.
* Animating `font-variation-settings` triggers layout on every frame. Keep it to short, fixed-size elements (`contain: layout`), keep it off INP-critical paths, and respect `prefers-reduced-motion`.

### 7.5 ZWNJ (نیم‌فاصله U+200C)
Keep it in the content (می‌خواهم، اسباب‌بازی‌ها). All three recommended fonts contain a ZWNJ glyph (verified).
* For OG images (`next/og`/Satori) and any SVG or PDF generation, test Persian shaping. Satori's complex-script support is limited. Prefer pre-rendered OG images, or text converted to outlines.

### 7.6 Normalization (SEO, AEO and GEO)
Normalize stored text, slugs and search queries:
* ي → ی, ك → ک
* ٠–٩ → ۰–۹ (in display text)
* strip U+0640
* fold sequences of ZWNJ

The CMS should do this in Phase 2. Keep the visible text in the DOM; never render words as images or icon-fonts.

### 7.7 Numerals
* **Persian digits in visible text: convert in code.** This is the primary, font-independent method. It works with every font, including Mikhak, which has no digit feature.
  ```ts
  // src/lib/format.ts
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  export const toFaDigits = (v: string | number) =>
    String(v).replace(/[0-9]/g, d => FA[+d]).replace(/[٠-٩]/g, d => FA[d.charCodeAt(0) - 0x0660]);
  export const faNum = new Intl.NumberFormat('fa-IR');                 // 1250000.5 → ۱٬۲۵۰٬۰۰۰٫۵ (U+066C, U+066B), verified in Node 22
  export const toman = (n: number) => `${faNum.format(n)} تومان`;
  export const faDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long', timeZone: 'Asia/Tehran' }); // → ۲۴ مهر ۱۴۰۵
  ```
  `Intl` emits ٪ (U+066A) for percent and **U+200E + U+2212** for negatives. Both are in our subset. Ario lacks U+2212, which falls back to Estedad; that is acceptable.
* **Machine-readable values stay Latin** for structured data and answer engines:
  * `<data value="1250000">۱٬۲۵۰٬۰۰۰ تومان</data>`
  * `<time datetime="2026-10-16">۲۴ مهر ۱۴۰۵</time>`
  * JSON-LD `"price": "12500000", "priceCurrency": "IRR"`. Toman has no ISO 4217 code, so give the IRR value (×10).
* **Font-feature fallback**, only for text you cannot normalize (for example legacy CMS HTML):
  * Estedad: `font-feature-settings: "ss01", "ss20"`
  * Ario: `"ss01", "ss02"`
  * Vazirmatn and Arad: `"ss01"`

  These render Latin 0–9 as Persian while the DOM keeps Latin digits. They work only with upstream combined files (not Fontsource splits). They also convert digits inside Latin strings such as SKUs, so scope them to a class.
* **Remember that `font-feature-settings` does not merge.** A child declaration replaces the parent's whole list, so always restate it, for example `"ss01", "tnum"`. Prefer the `font-variant-numeric` longhand where it exists (`tabular-nums` → `tnum`), because longhands compose.
* **`tnum`:** supported for Persian digits in Estedad, Ario, Arad and Vazirmatn. Use it for **tables, countdowns and quantity steppers only**; it looks wrong on inline prices (see §3.2). `pnum`, `lnum` and `onum` do not apply to Persian digits in these fonts, which are proportional by default.

### 7.8 Weights and axes
* Use `font-weight` for `wght`. Do not set `"wght"` inside `font-variation-settings`, which overrides it and breaks inheritance.
* Ario is weight 400 only. Combined with `font-synthesis: none`, that prevents faux bold.

---

## 8. Licensing

* **Estedad, Ario, Mikhak:** SIL OFL‑1.1 (verified from the GitHub license API and the `name` ID 13 record). Commercial web use is allowed.
* **Our obligations:**
  1. Keep the license text with the font files (`src/fonts/LICENSES/`). Optionally link it from a `/licenses` page.
  2. Keep the copyright and license `name` records. The build passes `--name-IDs='*'`.
  3. A subset is a Modified Version, so it stays under OFL and must not use a Reserved Font Name.
* **Reserved Font Names:**
  * Estedad and Mikhak: none.
  * The Ario repo LICENSE reserves **"Arad"**; it was copied from Arad and does not name "Ario". Keeping "Ario" is compliant.
  * **Arad** (Alternative A) **must be renamed** in any subset.
  * AQ Normal Sans, Aref Ruqaa and Fandogh also carry RFNs.
* **Commercial, not evaluated (note only):** Kalameh, Peyda, Dana, Yekan Bakh, IRANSans X, Morabba and Ravi are Fontiran or vendor-licensed, typically per domain or app. They cannot be bundled in an open repo without a purchased license.
* **Unresolved names:**
  * **"Abar":** no open-licensed release found on GitHub, npm or the web as of 2026‑10‑16. Treat it as commercial or unknown.
  * **Koodak:** non-OFL ("BVL") license, so excluded.

---

## 9. Reproducing the verification

* **Analysis:** a fontTools script checked cmap, digit glyph and outline identity, GSUB/GPOS and digit-substitution lookups, `fvar`, metrics, license and subset size.
* **Visual check:** HTML specimens were rendered with Playwright's `chrome-headless-shell` (`--allow-file-access-from-files`, `lang="fa" dir="rtl"`).
* **Where they live:** both were kept in the session scratch directory and are not part of the repo. Re-run them whenever a font version changes, using the method in §2. The minimum visual test string is:

  `۰۱۲۳۴۵۶۷۸۹ · ٠١٢٣٤٥٦٧٨٩ · پیچ کیک یی ی · می‌خواهم · ۱٬۲۵۰٬۰۰۰ تومان · ۵۰٪`

  Check that ۴ is not ۳-like, that final ی is dotless, and that medial ی is legible.
