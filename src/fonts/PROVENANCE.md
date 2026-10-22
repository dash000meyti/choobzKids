# Font provenance

## Site fonts (proprietary, Fontiran — licensed by the owner)

| File | Family | Edition | Notes |
|---|---|---|---|
| `public/fonts/iransansx/IRANSansXFaNum-{Regular,DemiBold,Bold}.woff2` | IRANSansX Pro | Persian numerals, webfont (2023) | text and UI |
| `public/fonts/kalameh/KalamehWebFaNum-Bold.woff2` | Kalameh Eco | Persian numerals, webfont (2022) | large headlines |

Used exactly as delivered (no subsetting or conversion). Each folder carries Fontiran's
`FontLicense.txt`: write the 6-digit license code in place of `(.....)` before going live.

## Share-card font (open)

| File | Upstream | Version | License |
|---|---|---|---|
| `assets/og/Vazirmatn-Bold.ttf` (sharp/Pango share cards) | npm `vazirmatn` — `fonts/ttf/Vazirmatn-Bold.ttf`, subset by `scripts/fonts/build.sh` | 33.0.3 | OFL-1.1 (`src/fonts/LICENSES/Vazirmatn-OFL.txt`) |
