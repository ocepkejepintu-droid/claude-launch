#!/usr/bin/env bash
# One command from film folder to MP4.
#   make.sh <film-dir>                      full render: 1920x1080, 60 fps, PNG frames, score, H.264
#   make.sh <film-dir> --preview            fast draft: 960x540, 15 fps, JPEG frames (a few minutes)
#   make.sh <film-dir> --from 12 --to 28    re-render only that time range into the existing frames, then re-encode
# Options: --fps N  --workers N  --out file.mp4  --no-music
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
FILM="$(cd "$1" && pwd)"; shift
PREVIEW=0; FPS=60; WORKERS=4; OUT=""; FROM=""; TO=""; MUSIC=1
while [ $# -gt 0 ]; do case "$1" in
  --preview) PREVIEW=1; FPS=15 ;; --fps) FPS="$2"; shift ;; --workers) WORKERS="$2"; shift ;;
  --out) OUT="$2"; shift ;; --from) FROM="$2"; shift ;; --to) TO="$2"; shift ;; --no-music) MUSIC=0 ;;
  *) echo "unknown option $1"; exit 1 ;; esac; shift; done

B="$FILM/.build"; mkdir -p "$B"
cp "$SKILL"/template/{film.html,styles.css,engine.js,scenes.js} "$B/"
cp "$FILM/film.config.js" "$B/"
for d in fonts assets; do [ -d "$FILM/$d" ] && rm -rf "$B/$d" && cp -r "$FILM/$d" "$B/$d"; done

echo "▸ timeline + sound cues"
node "$SKILL/scripts/cues.js" "$B" "$B/cues.json"
if [ "$MUSIC" = 1 ]; then echo "▸ score"; python3 "$SKILL/scripts/score.py" "$B/cues.json" "$B/score.wav"; fi

if [ "$PREVIEW" = 1 ]; then FR="$B/frames-preview"; EXT=jpg; RFLAGS="--scale 0.5 --jpeg"; else FR="$B/frames"; EXT=png; RFLAGS=""; fi
RANGE=""; [ -n "$FROM" ] && RANGE="$RANGE --from $FROM"; [ -n "$TO" ] && RANGE="$RANGE --to $TO"
[ -z "$RANGE" ] && rm -rf "$FR"
echo "▸ frames → $FR"
node "$SKILL/scripts/render.js" "$B" "$FR" --fps "$FPS" --workers "$WORKERS" $RFLAGS $RANGE

[ -z "$OUT" ] && OUT="$FILM/$( [ "$PREVIEW" = 1 ] && echo film-preview.mp4 || echo film.mp4 )"
echo "▸ encode → $OUT"
AUDIO=(); [ "$MUSIC" = 1 ] && AUDIO=(-i "$B/score.wav" -c:a aac -b:a 256k -af "loudnorm=I=-16:TP=-1.5:LRA=11" -shortest)
CRF=16; PRESET=slow; [ "$PREVIEW" = 1 ] && CRF=22 && PRESET=veryfast
ffmpeg -v error -y -framerate "$FPS" -i "$FR/f_%05d.$EXT" "${AUDIO[@]}" -c:v libx264 -preset $PRESET -crf $CRF -tune film \
  -pix_fmt yuv420p -profile:v high -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size -of compact "$OUT"
