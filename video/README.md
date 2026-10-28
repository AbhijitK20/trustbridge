# Video pipeline

Scene-by-scene video for the TrustBridge pitch.

## Built outputs
| File | What |
|---|---|
| `out/trustbridge-flat.mp4` | 36s, 1080p. Code-animated 2D/3D-style characters (no real people), cut to the VO, 0.35s between lines. |
| `out/trustbridge-people.mp4` | 50s, 1080p. Photoreal people in scenes 1–6 and 10, product UI in 7–9. |
| `out/trustbridge-pitch.mp4` | 50s, 1080p. Fully code-rendered kinetic/UI version. |

`make_flat_video.py` renders the flat cut frame by frame with Pillow: scene length = VO line + 0.35s,
so there is no dead air. It also muxes the 10 VO clips at exact scene starts.

Rebuild:
```bash
python3 make_flat_video.py
```

The people frames come from `gen_people_frames.py` (Pollinations Sana, free tier limited to
1 image / 45s per IP), are cropped to 16:9 by `mix_frames.py`, animated with `stills_to_clips.sh`,
voiced with `edge-tts`, and assembled with `assemble.sh`.

Rebuild the people cut:
```bash
python3 gen_people_frames.py
python3 mix_frames.py
DUR=5 bash stills_to_clips.sh stills_mixed clips_people
VO=vo/01.mp3,vo/02.mp3,vo/03.mp3,vo/04.mp3,vo/05.mp3,vo/06.mp3,vo/07.mp3,vo/08.mp3,vo/09.mp3,vo/10.mp3 \
bash assemble.sh out/trustbridge-people.mp4 clips_people/scene*.mp4
```

Rebuild the UI cut:
```bash
python3 make_frames.py
DUR=5 bash stills_to_clips.sh stills clips
VO=vo/01.mp3,...,vo/10.mp3 bash assemble.sh out/trustbridge-pitch.mp4
```

## Flow
1. Generate the 10 clips with the prompts in `prompts.md` (OpenArt 20k credits or Creative Fabrica 25k coins, Seedance model).
2. Download them as `scene01.mp4` … `scene10.mp4` into `clips/`.
3. Put voiceover files in `vo/` (one per scene, or one full track).
4. Put an optional music bed at `music/bed.mp3`.
5. Run `assemble.sh`.

## Commands

Full auto (globs `clips/*.mp4` in sorted order, single VO track):
```bash
VO=vo/full.mp3 MUSIC=music/bed.mp3 bash assemble.sh out/trustbridge-pitch.mp4
```

Per-scene VO alignment:
```bash
VO=vo/01.mp3,vo/02.mp3,vo/03.mp3,vo/04.mp3,vo/05.mp3,vo/06.mp3,vo/07.mp3,vo/08.mp3,vo/09.mp3,vo/10.mp3 \
bash assemble.sh out/trustbridge-pitch.mp4
```

Vertical version:
```bash
W=1080 H=1920 bash assemble.sh out/trustbridge-pitch-vertical.mp4
```

Burn subtitles:
```bash
SUBS=out/subs.srt bash assemble.sh out/trustbridge-pitch.mp4
```

Explicit clip list:
```bash
bash assemble.sh out/pitch.mp4 clips/scene01.mp4 clips/scene02.mp4 clips/scene03.mp4
```

## What the script handles
- Heterogeneous clips: different resolutions, fps, SAR, and clips with no audio track.
- Pads/letterboxes every clip to the target frame instead of stretching.
- Voiceover padded to each scene, music ducked under the voice.
- Output H.264 + AAC, 30 fps.

## Free voiceover
```bash
uv tool install edge-tts
edge-tts --voice en-IN-PrabhatNeural --text "He paid. Or so I thought." --write-media vo/01.mp3
```

## Repos worth using
| Repo | Why |
|---|---|
| `entrepreneurshiphacks123/tenframe` | storyboard contact sheet → Seedance → VO → ffmpeg. Cloned at `refs/tenframe`. Needs `FAL_API_KEY` + `OPENAI_API_KEY`. |
| `ZeroLu/awesome-seedance` | curated Seedance 2.0 prompt patterns, multi-shot timing syntax. |
| `YouMind-OpenLab/awesome-seedance-2-prompts` | 2000+ prompts, character consistency tips. |
| `harry0703/MoneyPrinterTurbo` | full auto shorts from a topic (stock footage + TTS), not Seedance. |
| `chatfire-AI/huobao-drama` | one-sentence → full short drama with storyboard pipeline. |

Note: OpenArt and Creative Fabrica credits are web-UI only. Every repo above needs its own API key
(fal.ai, BytePlus ModelArk, OpenAI). The scripts here work with clips you download from the web UI.
