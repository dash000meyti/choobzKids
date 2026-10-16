#!/usr/bin/env bash
# TTF subsets for the sharp/Pango OG renderer (docs/TECH.md §4.9, docs/FONTS.md §5.3).
# Same sources and Unicode set as scripts/fonts/build.sh, but plain TTF (Pango/FreeType support
# for WOFF2 is not guaranteed) and Estedad pinned to one static weight. Run once; outputs are committed.
# Requires: python3, gh (authenticated) — GitHub is not needed in the Docker build.
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=assets/og; W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT
python3 -m venv "$W/venv"; "$W/venv/bin/pip" install -q 'fonttools==4.60.2'
PY="$W/venv/bin/python -I"

gh release download 8.5   -R aminabedi68/Estedad  -p 'Estedad-v8.5.zip' -D "$W"
gh release download 2.0.1 -R MohamadDarvishi/Ario -p 'Ario_2.0.1.zip'   -D "$W"
for z in "$W"/*.zip; do $PY -c 'import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$z" "$W/x"; done

shasum -a 256 "$W/x/Estedad-v8.5/Estedad[wght].ttf" "$W/x/Main_Fonts/Ario-Dots1.ttf"

# Persian core + basic Latin + punctuation emitted by Intl.NumberFormat('fa-IR') (identical to build.sh)
U='U+0020-007E,U+00A0,U+00A9,U+00AB,U+00AE,U+00B0,U+00BB,U+00D7,U+00F7,U+060C,U+061B,U+061F,U+0621-063A,U+0640-0655,U+0660-066D,U+0670,U+067E,U+0686,U+0698,U+06A9,U+06AF,U+06C0,U+06CC,U+06D4,U+06F0-06F9,U+200C-200F,U+2010-2011,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2039-203A,U+20AC,U+2122,U+2212,U+25CC,U+FD3E-FD3F,U+FDFC'
# + U+00B7 «·», the separator DESIGN.md's kickers use («مجله چوبز · راهنمای خرید»)
U="$U,U+00B7"
sub() { $PY -m fontTools.subset "$1" --unicodes="$U" --layout-features='*' --no-hinting --name-IDs='*' --output-file="$2"; }

mkdir -p "$OUT"
sub "$W/x/Main_Fonts/Ario-Dots1.ttf" "$OUT/Ario-Dots1.ttf"
# A static Bold instance: Pango picks faces by family + weight, and a variable font's default
# instance would otherwise win. --update-name-table renames the instance from the STAT table.
$PY -m fontTools.varLib.instancer "$W/x/Estedad-v8.5/Estedad[wght].ttf" wght=700 --update-name-table -o "$W/estedad-700.ttf"
sub "$W/estedad-700.ttf" "$OUT/Estedad-Bold.ttf"

# Fontconfig sees only these two files: no system fallback, and no "Cannot load default config
# file" warning in the slim image. The absolute dir is the container path (/app); the relative
# one resolves next to this file so local renders use the same fonts.
cat > "$OUT/fonts.conf" <<'XML'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>/app/assets/og</dir>
  <dir prefix="relative">.</dir>
  <cachedir>/tmp/fontconfig</cachedir>
</fontconfig>
XML

# The family/weight Pango must be asked for (src/lib/og.ts). A mismatch falls back silently.
$PY - "$OUT/Ario-Dots1.ttf" "$OUT/Estedad-Bold.ttf" <<'PY'
import sys
from fontTools.ttLib import TTFont
for f in sys.argv[1:]:
    t = TTFont(f)
    n = t["name"]
    fam = n.getDebugName(16) or n.getDebugName(1)
    sub = n.getDebugName(17) or n.getDebugName(2)
    print(f"{f}: family={fam!r} style={sub!r} weight={t['OS/2'].usWeightClass} fvar={'fvar' in t}")
PY
ls -la "$OUT"
