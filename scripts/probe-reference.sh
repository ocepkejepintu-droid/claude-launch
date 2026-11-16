#!/usr/bin/env bash
# Study a reference video before designing: contact sheets, hard-cut detection, loudness.
#   probe-reference.sh <video file | direct .mp4 URL | x.com/twitter status URL> [out-dir]
# Then look at out-dir/sheet-*.jpg.
set -euo pipefail
src="$1"; out="${2:-reference}"; mkdir -p "$out"
if [[ "$src" =~ (x|twitter)\.com/([^/]+)/status/([0-9]+) ]]; then
  api="https://api.fxtwitter.com/${BASH_REMATCH[2]}/status/${BASH_REMATCH[3]}"
  src=$(curl -fsS "$api" | python3 -c 'import sys,json
m=json.load(sys.stdin)["tweet"]["media"]["all"][0]
v=[f for f in m.get("formats",[]) if f.get("container")=="mp4"]
print(sorted(v,key=lambda f:f.get("bitrate",0))[-2 if len(v)>1 else -1]["url"])')
fi
if [[ "$src" =~ ^https?:// ]]; then curl -fsSL -o "$out/ref.mp4" "$src" || { echo "download blocked: save the video yourself and pass the file path"; exit 1; }; src="$out/ref.mp4"; fi
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
echo "duration: ${dur}s"
step=$(python3 -c "print(max(1.0, float('$dur')/30))")
rm -rf "$out/frames"; mkdir -p "$out/frames"
ffmpeg -v error -i "$src" -vf "fps=1/$step,scale=640:-1" "$out/frames/f_%03d.jpg"
n=$(ls "$out/frames" | wc -l)
ffmpeg -v error -y -start_number 1 -i "$out/frames/f_%03d.jpg" -frames:v 1 -vf "tile=3x5" "$out/sheet-1.jpg"
[ "$n" -gt 15 ] && ffmpeg -v error -y -start_number 16 -i "$out/frames/f_%03d.jpg" -frames:v 1 -vf "tile=3x5" "$out/sheet-2.jpg"
echo "contact sheets: $out/sheet-*.jpg (one frame every ${step}s)"
cuts=$(ffmpeg -v error -i "$src" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -oE "pts_time:[0-9.]+" | cut -d: -f2 | tr '\n' ' ')
echo "hard cuts (scene>0.3): ${cuts:-none — all transitions are continuous}"
ffmpeg -nostats -i "$src" -vn -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | sed 's/^ */loudness: /' || echo "loudness: no audio"
