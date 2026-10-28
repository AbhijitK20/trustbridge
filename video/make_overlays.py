#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
OUT = "video/overlays"
FK = "/usr/share/fonts/truetype/noto/NotoSans-Black.ttf"
FB = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FM = "/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"
TEAL, RED, WHITE, MUTED, AMBER = (45, 212, 191), (248, 113, 113), (235, 240, 250), (150, 165, 185), (251, 191, 36)
os.makedirs(OUT, exist_ok=True)

def canvas():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))

def font(p, s):
    return ImageFont.truetype(p, s)

def save(im, name):
    im.save(os.path.join(OUT, name))

def title():
    im = canvas(); d = ImageDraw.Draw(im)
    d.rounded_rectangle([88, 96, 1010, 400], radius=20, fill=(6, 11, 20, 165))
    d.text((110, 120), "CASE FILE 01", font=font(FM, 24), fill=TEAL)
    d.text((110, 170), "THE FREELANCER", font=font(FK, 96), fill=WHITE)
    d.text((112, 300), "₹15,000 advance  ·  2 AM  ·  files delivered", font=font(FR, 34), fill=MUTED)
    d.rectangle([112, 370, 620, 375], fill=TEAL)
    save(im, "title.png")

def hud(status, color, name):
    im = canvas(); d = ImageDraw.Draw(im)
    d.rectangle([80, 84, 1840, 85], fill=(255, 255, 255, 28))
    d.text((84, 42), "DEAL #TB-2041", font=font(FM, 20), fill=MUTED)
    d.text((1836, 42), status, font=font(FM, 20), fill=color, anchor="ra")
    save(im, name)

def dimmer():
    im = Image.new("RGBA", (W, H), (4, 7, 14, 190))
    save(im, "dimmer.png")

def bubble(name, text, color, y, w=640):
    im = canvas(); d = ImageDraw.Draw(im)
    x = 1830 - w
    h = 92
    d.rounded_rectangle([x, y, x + w, y + h], radius=26, fill=(16, 42, 40, 240), outline=color, width=2)
    d.polygon([(x + w - 30, y + h - 2), (x + w + 24, y + h + 26), (x + w - 60, y + h - 2)], fill=(16, 42, 40, 240))
    d.text((x + 28, y + h // 2), text, font=font(FR, 30), fill=color, anchor="lm")
    save(im, name)

def bubble_red():
    im = canvas(); d = ImageDraw.Draw(im)
    x, y, w, h = 1120, 760, 710, 100
    d.rounded_rectangle([x, y, x + w, y + h], radius=26, fill=(56, 16, 22, 245), outline=RED, width=3)
    d.polygon([(x + w - 30, y + h - 2), (x + w + 24, y + h + 28), (x + w - 70, y + h - 2)], fill=(56, 16, 22, 245))
    d.text((x + 28, y + h // 2), "This account can no longer receive messages.", font=font(FR, 26), fill=RED, anchor="lm")
    save(im, "bubble_blocked.png")

def stamp():
    im = Image.new("RGBA", (900, 360), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([6, 6, 894, 354], radius=26, outline=RED, width=10)
    d.rounded_rectangle([26, 26, 874, 334], radius=18, outline=(248, 113, 113, 120), width=3)
    d.text((450, 120), "GHOSTED", font=font(FK, 120), fill=RED, anchor="mm")
    d.text((450, 250), "ADVANCE LOST  ·  ₹15,000", font=font(FM, 24), fill=(248, 113, 113, 220), anchor="mm")
    im = im.rotate(-7, expand=True, resample=Image.BICUBIC)
    big = canvas()
    big.alpha_composite(im, (510, 360))
    save(big, "stamp.png")

def endcard():
    im = canvas(); d = ImageDraw.Draw(im)
    d.rounded_rectangle([360, 150, 1560, 930], radius=36, fill=(8, 12, 22, 245), outline=(45, 212, 191, 180), width=2)
    cx = 960
    pts = [(cx, 250), (cx + 78, 288), (cx + 68, 390), (cx, 470), (cx - 68, 390), (cx - 78, 288)]
    d.polygon(pts, fill=(10, 34, 34, 255), outline=TEAL)
    d.line([(cx - 38, 350), (cx - 5, 382), (cx + 44, 312)], fill=TEAL, width=10, joint="curve")
    d.text((cx, 540), "TRUSTBRIDGE", font=font(FK, 92), fill=WHITE, anchor="ma")
    d.text((cx, 670), "Verify first. Protect the deal.", font=font(FR, 40), fill=TEAL, anchor="ma")
    d.text((cx, 780), "escrow  ·  verification  ·  disputes", font=font(FM, 22), fill=MUTED, anchor="ma")
    save(im, "endcard.png")

def counter():
    im = canvas(); d = ImageDraw.Draw(im)
    d.text((120, 840), "MONEY RECOVERED", font=font(FM, 20), fill=MUTED)
    d.text((120, 874), "₹0", font=font(FK, 76), fill=RED)
    save(im, "counter.png")

title()
hud("STATUS: PAID", TEAL, "hud_paid.png")
hud("STATUS: AWAITING REPLY", AMBER, "hud_await.png")
dimmer()
bubble("bubble1.png", "Files sent. Please check.", TEAL, 740)
bubble("bubble2.png", "Hello?", TEAL, 846, 360)
bubble_red(); stamp(); endcard(); counter()
print("overlays written")
