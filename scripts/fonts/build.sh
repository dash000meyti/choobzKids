#!/usr/bin/env bash
# Reproducible Persian webfont build (see docs/FONTS.md). Run once; outputs are committed.
# Requires: python3, gh (authenticated) — GitHub is not needed in the Docker build.
set -euo pipefail
OUT=src/fonts; W=$(mktemp -d)
python3 -m venv "$W/venv"; "$W/venv/bin/pip" install -q 'fonttools==4.60.2' brotli
PY="$W/venv/bin/python -I"

gh release download 8.5   -R aminabedi68/Estedad    -p 'Estedad-v8.5.zip' -D "$W"
gh release download 2.0.1 -R MohamadDarvishi/Ario   -p 'Ario_2.0.1.zip'   -D "$W"
gh release download 3.4   -R aminabedi68/Mikhak     -p 'Mikhak-v3.4.zip'  -D "$W"
for z in "$W"/*.zip; do $PY -c 'import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$z" "$W/x"; done

shasum -a 256 "$W/x/Estedad-v8.5/Estedad[wght].ttf" "$W/x/Main_Fonts/Ario-Dots1.ttf" "$W/x/Mikhak-v3.4/Variable/Mikhak[DSTY,KSHD,wght].ttf"

# Persian core + basic Latin + punctuation emitted by Intl.NumberFormat('fa-IR')
U='U+0020-007E,U+00A0,U+00A9,U+00AB,U+00AE,U+00B0,U+00B7,U+00BB,U+00D7,U+00F7,U+060C,U+061B,U+061F,U+0621-063A,U+0640-0655,U+0660-066D,U+0670,U+067E,U+0686,U+0698,U+06A9,U+06AF,U+06C0,U+06CC,U+06D4,U+06F0-06F9,U+200C-200F,U+2010-2011,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2039-203A,U+2190-2193,U+20AC,U+2122,U+2212,U+25CC,U+FD3E-FD3F,U+FDFC'
sub() { $PY -m fontTools.subset "$1" --unicodes="$U" --layout-features='*' --no-hinting --name-IDs='*' --flavor=woff2 --output-file="$2"; }

mkdir -p "$OUT"/{estedad,ario,mikhak,LICENSES}
sub "$W/x/Estedad-v8.5/Estedad[wght].ttf"   "$OUT/estedad/estedad-fa-wght.woff2"
sub "$W/x/Main_Fonts/Ario-Dots1.ttf"        "$OUT/ario/ario-dots1-fa.woff2"
$PY -m fontTools.varLib.instancer "$W/x/Mikhak-v3.4/Variable/Mikhak[DSTY,KSHD,wght].ttf" wght=600 DSTY=1 -o "$W/mikhak-600.ttf"
sub "$W/mikhak-600.ttf"                     "$OUT/mikhak/mikhak-fa-600-kshd.woff2"

for r in aminabedi68/Estedad:Estedad MohamadDarvishi/Ario:Ario aminabedi68/Mikhak:Mikhak; do
  gh api "repos/${r%%:*}/license" --jq .content | base64 -d > "$OUT/LICENSES/${r##*:}-OFL.txt"
done
rm -rf "$W"
ls -la "$OUT"/*/
