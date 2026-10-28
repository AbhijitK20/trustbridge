#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-video/out/trustbridge-pitch.mp4}"
shift || true
CLIPS=("$@")

if [ ${#CLIPS[@]} -eq 0 ]; then
  mapfile -t CLIPS < <(find video/clips -maxdepth 1 -type f \( -name '*.mp4' -o -name '*.mov' -o -name '*.webm' \) | sort)
fi
[ ${#CLIPS[@]} -eq 0 ] && { echo "no clips found in video/clips"; exit 1; }

W="${W:-1920}"
H="${H:-1080}"
FPS="${FPS:-30}"
VO="${VO:-}"
MUSIC="${MUSIC:-}"
MUSIC_VOL="${MUSIC_VOL:-0.18}"
SUBS="${SUBS:-}"
CRF="${CRF:-18}"
WD="$(mktemp -d)"
trap 'rm -rf "$WD"' EXIT

dur() { ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"; }

norm() {
  local src="$1" dst="$2"
  if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$src" | grep -q .; then
    ffmpeg -y -v error -i "$src" \
      -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS}" \
      -af "aresample=48000,aformat=channel_layouts=stereo" \
      -c:v libx264 -preset veryfast -crf "$CRF" -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$dst"
  else
    ffmpeg -y -v error -i "$src" -f lavfi -i anullsrc=r=48000:cl=stereo \
      -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS}" \
      -c:v libx264 -preset veryfast -crf "$CRF" -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$dst"
  fi
}

: > "$WD/list.txt"
for i in "${!CLIPS[@]}"; do
  norm "${CLIPS[$i]}" "$WD/n$i.mp4"
  echo "file '$WD/n$i.mp4'" >> "$WD/list.txt"
done

ffmpeg -y -v error -f concat -safe 0 -i "$WD/list.txt" -c copy "$WD/base.mp4"
TOTAL="$(dur "$WD/base.mp4")"

if [ -n "$VO" ]; then
  if [[ "$VO" == *,* ]]; then
    IFS=',' read -ra SEGS <<< "$VO"
    inputs=(); fc=""; maps=""
    for i in "${!CLIPS[@]}"; do
      d="$(dur "$WD/n$i.mp4")"
      seg="${SEGS[$i]:-${SEGS[${#SEGS[@]}-1]}}"
      inputs+=(-i "$seg")
      fc+="[$i:a]apad,atrim=0:${d},asetpts=PTS-STARTPTS[s$i];"
      maps+="[s$i]"
    done
    ffmpeg -y -v error "${inputs[@]}" -filter_complex "${fc}${maps}concat=n=${#CLIPS[@]}:v=0:a=1[vo]" -map "[vo]" "$WD/vo.m4a"
  else
    ffmpeg -y -v error -i "$VO" -af "apad" -t "$TOTAL" -c:a aac "$WD/vo.m4a"
  fi
else
  ffmpeg -y -v error -f lavfi -i anullsrc=r=48000:cl=stereo -t "$TOTAL" -c:a aac "$WD/vo.m4a"
fi

if [ -n "$MUSIC" ]; then
  ffmpeg -y -v error -i "$WD/base.mp4" -i "$WD/vo.m4a" -i "$MUSIC" -filter_complex \
    "[1:a]volume=1.4,asplit=2[vo1][vo2];[2:a]aloop=loop=-1:size=2147483647,atrim=0:${TOTAL},asetpts=PTS-STARTPTS,volume=${MUSIC_VOL}[mus];[mus][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[musd];[0:a]volume=0.15[amb];[amb][musd][vo2]amix=inputs=3:duration=first:normalize=0[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$WD/mixed.mp4"
else
  ffmpeg -y -v error -i "$WD/base.mp4" -i "$WD/vo.m4a" -filter_complex \
    "[1:a]volume=1.4[vo];[0:a]volume=0.15[amb];[amb][vo]amix=inputs=2:duration=first:normalize=0[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$WD/mixed.mp4"
fi

mkdir -p "$(dirname "$OUT")"
if [ -n "$SUBS" ]; then
  ffmpeg -y -v error -i "$WD/mixed.mp4" -vf "subtitles=${SUBS}:force_style='FontName=DejaVu Sans,FontSize=20,PrimaryColour=&H00FFFFFF,BorderStyle=1,Outline=2,Shadow=0,MarginV=48'" \
    -c:v libx264 -preset veryfast -crf "$CRF" -pix_fmt yuv420p -c:a copy "$OUT"
else
  cp "$WD/mixed.mp4" "$OUT"
fi

echo "saved $OUT ($(dur "$OUT")s ${W}x${H})"
