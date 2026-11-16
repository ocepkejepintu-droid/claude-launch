#!/usr/bin/env bash
# Start a new film folder from the example config.
#   new-film.sh <film-dir>
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$1"
[ -e "$1/film.config.js" ] && { echo "$1/film.config.js already exists"; exit 1; }
cp "$SKILL/examples/tidepool/film.config.js" "$1/film.config.js"
echo "created $1/film.config.js — edit brand + scenes, fetch fonts with scripts/fetch-fonts.sh, then run scripts/make.sh $1 --preview"
