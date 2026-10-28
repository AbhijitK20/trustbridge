#!/usr/bin/env python3
import os, shutil
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
SRC_PEOPLE = "video/stills_people"
SRC_UI = "video/stills"
OUT = "video/stills_mixed"
FB = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FK = "/usr/share/fonts/truetype/noto/NotoSans-Black.ttf"
FM = "/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"

os.makedirs(OUT, exist_ok=True)

def fit(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    crop_h = int(w * 9 / 16)
    if h > crop_h:
        im = im.crop((0, 0, w, crop_h))
    im = im.resize((W, H), Image.LANCZOS)
    return im

for i in list(range(1, 7)) + [10]:
    src = os.path.join(SRC_PEOPLE, f"scene{i:02d}.jpg")
    im = fit(src)
    if i == 10:
        d = ImageDraw.Draw(im, "RGBA")
        for y in range(H - 320, H):
            a = int(200 * (y - (H - 320)) / 320)
            d.line([(0, y), (W, y)], fill=(5, 8, 16, a))
        d.text((W // 2, H - 235), "TRUSTBRIDGE", font=ImageFont.truetype(FK, 88), fill=(255, 255, 255), anchor="ma")
        d.text((W // 2, H - 125), "Verify first. Protect the deal.", font=ImageFont.truetype(FB, 38), fill=(45, 212, 191), anchor="ma")
    im.save(os.path.join(OUT, f"scene{i:02d}.png"))

for i in (7, 8, 9):
    shutil.copy(os.path.join(SRC_UI, f"scene{i:02d}.png"), os.path.join(OUT, f"scene{i:02d}.png"))

print("wrote", len(os.listdir(OUT)), "frames to", OUT)
