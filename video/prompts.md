# TrustBridge — 50s pitch film (Seedance / OpenArt / CF Studio)

**Format:** 16:9, 5s per scene, 10 scenes → trim to ~40s in edit. Re-generate at 9:16 for Reels.

## Global style block — append to every prompt
```
Cinematic realistic, 35mm lens, shallow depth of field, warm Indian city tones, teal-orange grade,
natural practical lighting, smooth gimbal movement, 16:9, 5 seconds, no text, no logos, no watermark
```

## Negative prompt — use every scene
```
warped hands, extra fingers, face morphing, flicker, jitter, subtitles, watermark, logo, cartoon, low quality
```

## Characters — repeat the exact wording for consistency
- **ARJUN** — 28, Indian male, short black hair, light stubble, navy blue shirt (freelancer)
- **MEERA** — 26, Indian female, long dark hair tied back, olive green kurta (buyer)
- **RAHUL** — 30, Indian male, clean shaven, white polo, gold chain (client / seller)

---

## Scene 1 — Hook
```
ARJUN, 28, Indian male, short black hair, light stubble, navy blue shirt, sits at a cluttered desk at 2 AM,
lit only by laptop glow. He smiles and leans back as his phone lights up with a UPI payment success screen.
Slow push-in on his relieved face, then rack focus to the phone. Moody blue night, warm desk lamp.
```

## Scene 2 — Work delivered
```
ARJUN uploads final design files on his laptop and hits send. Screen shows "Files delivered".
He stretches, satisfied. Side profile, soft window light of early morning, slow orbit around him.
```

## Scene 3 — Ghosted
```
ARJUN's chat app shows messages bouncing back: "This account can no longer receive messages."
Close-up of his smile fading. He refreshes the app twice. Camera slowly pushes in on his eyes.
Cold light on face, silence.
```

## Scene 4 — The other side
```
MEERA, 26, Indian female, long dark hair tied back, olive green kurta, stands at a small boutique counter.
She scans a UPI QR code on the counter with her phone, payment success animation, hands over a bag.
Bright daylight, handheld, warm and cheerful.
```

## Scene 5 — Seller vanishes
```
MEERA stands outside the same shop, shutter half down, phone to her ear, call not connecting.
She looks at a "closed" board, then at her payment receipt. Slow dolly back, harsh afternoon sun,
empty street. Her shoulders drop.
```

## Scene 6 — Two victims
```
Split screen: left, ARJUN at his desk staring at an empty wallet screen; right, MEERA on a pavement
staring at a failed order. Both exhale at the same time. Centered symmetry, muted tones, subtle camera float.
```

## Scene 7 — Platform reveal
```
Close-up of a phone screen showing an escrow payment interface: money marked "Held in Trust Lock",
a progress bar with three steps — Paid, Work Delivered, Released. A finger taps "Release".
Clean UI glow reflected on a calm face. Macro detail, shallow focus.
```

## Scene 8 — Freelancer protected
```
ARJUN receives a notification: "Payment released to you." He smiles and shakes hands with RAHUL,
30, Indian male, clean shaven, white polo, gold chain, across the desk. Confident handshake,
warm backlight, slow push-in on the clasped hands.
```

## Scene 9 — Buyer protected
```
MEERA unboxes her order at her doorstep, smiles, and taps "Confirm delivery" on her phone.
The seller's phone pings with "Funds released." Two-shot: buyer and seller nodding at each other.
Golden hour, soft lens flare.
```

## Scene 10 — CTA
```
ARJUN and MEERA stand side by side, phones in hand, looking at camera with quiet confidence.
Camera pulls back to reveal a clean minimal studio backdrop with empty negative space for a logo.
Bright, optimistic, hero framing.
```

---

## Voiceover
| Scene | Line |
|---|---|
| 1 | He paid. Or so I thought. |
| 2 | I delivered everything. |
| 3 | Then… silence. |
| 4 | She paid too. On a QR code. |
| 5 | And the seller disappeared. |
| 6 | Both sides. Same fear. |
| 7 | So we built escrow for real life. |
| 8 | Money held until work is proven. |
| 9 | Released only when both agree. |
| 10 | TrustBridge. Verify first. Protect the deal. |

---

## Generation order
1. Generate Scene 1, screenshot a good frame.
2. Use it as the character reference for Scenes 2, 3, 6, 8, 10.
3. Repeat for MEERA (Scenes 4, 5, 9).
4. Keep 5s clips; trim in the edit.
5. Cut on motion (hand raise, door close, tap) for seamless transitions.

## Assembly
```bash
bash video/stills_to_clips.sh video/stills video/clips      # only if you generated images
VO="video/vo/01.mp3,video/vo/02.mp3,video/vo/03.mp3,video/vo/04.mp3,video/vo/05.mp3,video/vo/06.mp3,video/vo/07.mp3,video/vo/08.mp3,video/vo/09.mp3,video/vo/10.mp3" \
MUSIC=video/music/bed.mp3 SUBS=video/out/subs.srt \
bash video/assemble.sh video/out/trustbridge-pitch.mp4
```
