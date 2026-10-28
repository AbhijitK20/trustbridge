#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="$HOME/Downloads/WhatsApp Video 2026-10-28 at 07.52.24.mp4"
O="video/overlays"
OUT="video/out/freelancer-cut.mp4"

ffmpeg -y -v error \
  -i "$SRC" \
  -loop 1 -i "$O/title.png" \
  -loop 1 -i "$O/hud_paid.png" \
  -loop 1 -i "$O/hud_await.png" \
  -loop 1 -i "$O/bubble1.png" \
  -loop 1 -i "$O/bubble2.png" \
  -loop 1 -i "$O/bubble_blocked.png" \
  -loop 1 -i "$O/stamp.png" \
  -loop 1 -i "$O/counter.png" \
  -loop 1 -i "$O/endcard.png" \
  -loop 1 -i "$O/dimmer.png" \
  -i video/vo/01.mp3 -i video/vo/02.mp3 -i video/vo/03.mp3 -i video/vo/10.mp3 \
  -filter_complex "\
[0:v]split=4[v0][v1][v2][v3];\
[v0]trim=2:12,setpts=PTS-STARTPTS,scale=2400:-1,crop=1920:1080,zoompan=z='min(zoom+0.00040,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,setsar=1[s0];\
[v1]trim=57:67,setpts=PTS-STARTPTS,scale=2400:-1,crop=1920:1080,zoompan=z='min(zoom+0.00040,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,setsar=1[s1];\
[v2]trim=74:84,setpts=PTS-STARTPTS,scale=2400:-1,crop=1920:1080,zoompan=z='min(zoom+0.00045,1.11)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,setsar=1[s2];\
[v3]trim=87:92.5,setpts=PTS-STARTPTS,scale=2400:-1,crop=1920:1080,zoompan=z='min(zoom+0.00035,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,setsar=1[s3];\
[s0][s1][s2][s3]concat=n=4:v=1:a=0,eq=contrast=1.08:saturation=1.12:brightness=-0.02,colorbalance=rs=-0.04:bs=0.06,vignette=PI/5,noise=alls=4:allf=t+u[base];\
[1:v]format=rgba,setpts=PTS+0.4/TB,fade=t=in:st=0.4:d=0.4:alpha=1,fade=t=out:st=3.4:d=0.4:alpha=1[o1];\
[2:v]format=rgba,setpts=PTS+4/TB,fade=t=in:st=4:d=0.35:alpha=1,fade=t=out:st=11.6:d=0.4:alpha=1[o2];\
[3:v]format=rgba,setpts=PTS+12/TB,fade=t=in:st=12:d=0.35:alpha=1,fade=t=out:st=19.5:d=0.4:alpha=1[o3];\
[4:v]format=rgba,setpts=PTS+11/TB,fade=t=in:st=11:d=0.35:alpha=1,fade=t=out:st=17.4:d=0.3:alpha=1[o4];\
[5:v]format=rgba,setpts=PTS+16.4/TB,fade=t=in:st=16.4:d=0.3:alpha=1,fade=t=out:st=20:d=0.3:alpha=1[o5];\
[6:v]format=rgba,setpts=PTS+20.6/TB,fade=t=in:st=20.6:d=0.35:alpha=1,fade=t=out:st=25.6:d=0.35:alpha=1[o6];\
[7:v]format=rgba,setpts=PTS+25.4/TB,fade=t=in:st=25.4:d=0.25:alpha=1,fade=t=out:st=29.8:d=0.3:alpha=1[o7];\
[8:v]format=rgba,setpts=PTS+25.4/TB,fade=t=in:st=25.4:d=0.3:alpha=1,fade=t=out:st=29.8:d=0.3:alpha=1[o8];\
[10:v]format=rgba,setpts=PTS+30.2/TB,fade=t=in:st=30.2:d=0.4:alpha=1[o10];\
[9:v]format=rgba,setpts=PTS+30.5/TB,fade=t=in:st=30.5:d=0.45:alpha=1[o9];\
[base][o1]overlay=0:0:enable='between(t,0.4,3.8)'[b1];\
[b1][o2]overlay=0:0:enable='between(t,4,12)'[b2];\
[b2][o3]overlay=0:0:enable='between(t,12,20)'[b3];\
[b3][o4]overlay=0:0:enable='between(t,11,17.7)'[b4];\
[b4][o5]overlay=0:0:enable='between(t,16.4,20.3)'[b5];\
[b5][o6]overlay=0:0:enable='between(t,20.6,26)'[b6];\
[b6][o7]overlay=x='8*sin(55*t)':y='6*cos(47*t)':enable='between(t,25.4,30)'[b7];\
[b7][o8]overlay=0:0:enable='between(t,25.4,30)'[b8];\
[b8][o10]overlay=0:0:enable='between(t,30.2,35.5)'[b9];\
[b9][o9]overlay=0:0:enable='between(t,30.5,35.5)'[vout];\
[0:a]atrim=0:35.5,asetpts=PTS-STARTPTS,volume=0.35,afade=t=in:d=1,afade=t=out:st=33:d=2.5[amb];\
[11:a]adelay=700|700,volume=1.6[a1];\
[12:a]adelay=10400|10400,volume=1.6[a2];\
[13:a]adelay=20500|20500,volume=1.6[a3];\
[14:a]adelay=30200|30200,volume=1.6[a4];\
[amb][a1][a2][a3][a4]amix=inputs=5:normalize=0,alimiter=limit=0.95[aout]" \
  -map "[vout]" -map "[aout]" -t 35.5 -r 30 -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k "$OUT"

echo "saved $OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
