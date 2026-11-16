#!/usr/bin/env bash
# Download Google Fonts (latin subset, woff2) into <film-dir>/fonts and print the matching
# `faces` entries for film.config.js.
#   fetch-fonts.sh <film-dir> "Poppins:400,500,600,700" "Pacifico:400"
set -euo pipefail
dir="$1"; shift
mkdir -p "$dir/fonts"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
echo "faces: ["
for spec in "$@"; do
  fam="${spec%%:*}"; weights="${spec#*:}"; [ "$weights" = "$spec" ] && weights=400
  slug=$(echo "$fam" | tr 'A-Z ' 'a-z-')
  for w in ${weights//,/ }; do
    css=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?family=${fam// /+}:wght@${w}&display=block")
    # take the block labelled /* latin */ (not latin-ext)
    url=$(printf '%s\n' "$css" | awk '/\/\* latin \*\//{f=1} f&&/src:/{match($0,/https:[^)]+/);print substr($0,RSTART,RLENGTH);exit}')
    [ -z "$url" ] && url=$(printf '%s\n' "$css" | grep -oE 'https://[^)]+\.woff2' | tail -1)
    out="fonts/${slug}-${w}.woff2"
    curl -fsS -o "$dir/$out" "$url"
    echo "  { family: '$fam', src: '$out', weight: $w },"
  done
done
echo "],"
