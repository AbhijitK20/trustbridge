#!/usr/bin/env bash
set -euo pipefail

IN_DIR="${1:-video/stills}"
OUT_DIR="${2:-video/clips}"
DUR="${DUR:-5}"
W="${W:-1920}"
H="${H:-1080}"
FPS="${FPS:-30}"
ZOOM="${ZOOM:-1.12}"

SW=$(awk "BEGIN{printf \"%d\", $W*1.3}")
SH=$(awk "BEGIN{printf \"%d\", $H*1.3}")
FRAMES=$(awk "BEGIN{printf \"%d\", $DUR*$FPS}")
STEP=$(awk "BEGIN{printf \"%.5f\", ($ZOOM-1)/$FRAMES}")

mkdir -p "$OUT_DIR"
shopt -s nullglob
files=("$IN_DIR"/*.png "$IN_DIR"/*.jpg "$IN_DIR"/*.jpeg "$IN_DIR"/*.webp)
[ ${#files[@]} -eq 0 ] && { echo "no stills in $IN_DIR"; exit 1; }

i=0
for f in "${files[@]}"; do
  i=$((i+1))
  out="$OUT_DIR/$(printf 'scene%02d.mp4' "$i")"
  ffmpeg -y -v error -loop 1 -i "$f" -f lavfi -i anullsrc=r=48000:cl=stereo \
    -vf "scale=${SW}:${SH}:force_original_aspect_ratio=increase,crop=${SW}:${SH},zoompan=z='min(zoom+${STEP},${ZOOM})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${FRAMES}:s=${W}x${H}:fps=${FPS},setsar=1" \
    -t "$DUR" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$out"
  echo "wrote $out"
done
