#!/usr/bin/env bash
# Reproducible Persian webfont build (see src/fonts/PROVENANCE.md). Run once; outputs are committed.
# Requires: python3, npm (registry access) — nothing here runs in the Docker build.
set -euo pipefail
cd "$(dirname "$0")/../.."
W=$(mktemp -d); trap 'rm -rf "$W"' EXIT
python3 -m venv "$W/venv"; "$W/venv/bin/pip" install -q 'fonttools==4.60.2' brotli
PY="$W/venv/bin/python"

(cd "$W" && npm pack vazirmatn@33.0.3 --silent >/dev/null && tar -xzf vazirmatn-33.0.3.tgz)
V="$W/package"
shasum -a 256 "$V/fonts/variable/Vazirmatn[wght].ttf" "$V/fonts/ttf/Vazirmatn-Bold.ttf"

# Persian core + basic Latin + punctuation emitted by Intl.NumberFormat('fa-IR')
U='U+0020-007E,U+00A0,U+00A9,U+00AB,U+00AE,U+00B0,U+00B7,U+00BB,U+00D7,U+00F7,U+060C,U+061B,U+061F,U+0621-063A,U+0640-0655,U+0660-066D,U+0670,U+067E,U+0686,U+0698,U+06A9,U+06AF,U+06C0,U+06CC,U+06D4,U+06F0-06F9,U+200C-200F,U+2010-2011,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2039-203A,U+2190-2193,U+20AC,U+2122,U+2212,U+25CC,U+FD3E-FD3F,U+FDFC'
sub() { "$PY" -I -m fontTools.subset "$1" --unicodes="$U" --layout-features='*' --no-hinting --name-IDs='*' "${@:3}" --output-file="$2"; }

mkdir -p src/fonts/vazirmatn src/fonts/LICENSES assets/og
# Web: one variable file, every weight.
sub "$V/fonts/variable/Vazirmatn[wght].ttf" src/fonts/vazirmatn/vazirmatn-fa-wght.woff2 --flavor=woff2
# Share cards (sharp/Pango): a static Bold TTF, since Pango picks faces by family + weight.
sub "$V/fonts/ttf/Vazirmatn-Bold.ttf" assets/og/Vazirmatn-Bold.ttf
cp "$V/OFL.txt" src/fonts/LICENSES/Vazirmatn-OFL.txt
ls -la src/fonts/vazirmatn assets/og
