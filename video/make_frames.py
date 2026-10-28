#!/usr/bin/env python3
import math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

W, H = 1920, 1080
OUT = "video/stills"
FONT_B = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_K = "/usr/share/fonts/truetype/noto/NotoSans-Black.ttf"
FONT_M = "/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"

BG1 = (5, 8, 16)
BG2 = (11, 20, 36)
TEAL = (45, 212, 191)
AMBER = (251, 191, 36)
RED = (248, 113, 113)
WHITE = (226, 232, 240)
MUTED = (148, 163, 184)
PANEL = (15, 23, 42)
LINE = (30, 41, 59)

def font(p, s):
    return ImageFont.truetype(p, s)

def vgrad(w, h, top, bottom):
    a = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        t = y / max(1, h - 1)
        for c in range(3):
            a[y, :, c] = int(top[c] * (1 - t) + bottom[c] * t)
    return Image.fromarray(a, "RGB")

def radial_glow(size, center, radius, color, strength):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2)
    mask = np.clip(1 - d / radius, 0, 1) ** 2 * strength
    layer = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        layer[:, :, c] = color[c]
    return Image.fromarray(layer.astype(np.uint8), "RGB"), (mask * 255).astype(np.uint8)

def add_glow(img, center, radius, color, strength):
    g, m = radial_glow(img.size, center, radius, color, strength)
    img.paste(g, (0, 0), Image.fromarray(m, "L"))

def grain(img, amount=10):
    a = np.array(img).astype(np.int16)
    n = np.random.default_rng(7).normal(0, amount, (img.height, img.width, 1))
    a = np.clip(a + n, 0, 255).astype(np.uint8)
    return Image.fromarray(a, "RGB")

def base(scene_seed=1):
    img = vgrad(W, H, BG1, BG2)
    add_glow(img, (1550, 180), 900, (20, 120, 110), 0.55)
    add_glow(img, (250, 950), 800, (120, 70, 20), 0.35)
    d = ImageDraw.Draw(img, "RGBA")
    for x in range(0, W, 80):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 8), width=1)
    for y in range(0, H, 80):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 8), width=1)
    return img, d

def txt(d, xy, s, f, fill, anchor="la", spacing=10):
    d.multiline_text(xy, s, font=f, fill=fill, anchor=anchor, spacing=spacing)

def rrect(d, box, r, fill=None, outline=None, width=2):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def vignette(img, strength=0.55):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    m = np.clip((d - 0.55) / 0.9, 0, 1) ** 1.6 * strength
    a = np.array(img).astype(np.float32)
    a *= (1 - m[..., None])
    return Image.fromarray(a.astype(np.uint8), "RGB")

def check(d, cx, cy, r, color):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    d.line([(cx - r * 0.45, cy), (cx - r * 0.1, cy + r * 0.38), (cx + r * 0.5, cy - r * 0.38)], fill=(5, 8, 16), width=max(4, r // 6), joint="curve")

def scene01():
    img, d = base()
    txt(d, (140, 250), "FREELANCE DEAL  ·  02:00 AM", font(FONT_M, 26), TEAL)
    txt(d, (140, 320), "He paid.", font(FONT_K, 120), WHITE)
    txt(d, (140, 450), "Or so I thought.", font(FONT_K, 120), MUTED)
    txt(d, (140, 640), "₹15,000 sent upfront.\nWork delivered in good faith.", font(FONT_R, 38), MUTED, spacing=14)
    px, py, pw, ph = 1330, 170, 380, 740
    add_glow(img, (px + pw // 2, py + ph // 2), 420, (30, 160, 140), 0.5)
    d = ImageDraw.Draw(img, "RGBA")
    rrect(d, [px, py, px + pw, py + ph], 54, (8, 13, 24, 255), (70, 90, 110, 255), 4)
    rrect(d, [px + 18, py + 18, px + pw - 18, py + ph - 18], 42, (10, 17, 30, 255), None)
    txt(d, (px + pw // 2, py + 90), "UPI", font(FONT_M, 30), MUTED, "ma")
    txt(d, (px + pw // 2, py + 165), "₹15,000", font(FONT_K, 76), WHITE, "ma")
    check(d, px + pw // 2, py + 330, 62, TEAL)
    txt(d, (px + pw // 2, py + 420), "PAYMENT SUCCESSFUL", font(FONT_M, 24), TEAL, "ma")
    txt(d, (px + pw // 2, py + 480), "Rahul S.   |   Arjun", font(FONT_R, 30), MUTED, "ma")
    rrect(d, [px + 40, py + 560, px + pw - 40, py + 650], 22, (15, 25, 40, 255), (45, 60, 80, 255), 2)
    txt(d, (px + pw // 2, py + 588), "“Payment done bhai,", font(FONT_R, 26), WHITE, "ma")
    txt(d, (px + pw // 2, py + 622), "send the files.”", font(FONT_R, 26), WHITE, "ma")
    return vignette(grain(img))

def scene02():
    img, d = base()
    txt(d, (140, 250), "THE DELIVERY", font(FONT_M, 26), TEAL)
    txt(d, (140, 320), "All files delivered.", font(FONT_K, 110), WHITE)
    txt(d, (140, 470), "Logo. Brand guide. Final reel.\nEverything he asked for.", font(FONT_R, 38), MUTED, spacing=14)
    x, y, w = 1080, 190, 680
    files = [("final_logo.ai", "48 MB"), ("brand_guide.pdf", "12 MB"), ("reel_v3.mp4", "310 MB"), ("source.zip", "1.2 GB")]
    for i, (name, size) in enumerate(files):
        yy = y + i * 130
        rrect(d, [x, yy, x + w, yy + 104], 22, (15, 25, 42, 255), (40, 55, 75, 255), 2)
        d.rectangle([x + 28, yy + 30, x + 72, yy + 74], fill=(45, 212, 191, 40), outline=TEAL, width=2)
        txt(d, (x + 96, yy + 30), name, font(FONT_M, 26), WHITE)
        txt(d, (x + 96, yy + 64), size + "  ·  uploaded", font(FONT_R, 22), MUTED)
        txt(d, (x + w - 40, yy + 40), "DONE", font(FONT_M, 20), TEAL, "ra")
    rrect(d, [x, 760, x + w, 800], 20, (30, 41, 59, 255))
    rrect(d, [x, 760, x + w, 800], 20, TEAL)
    txt(d, (x, 830), "UPLOAD COMPLETE  ·  100%", font(FONT_M, 24), TEAL)
    return vignette(grain(img))

def scene03():
    img, d = base(3)
    add_glow(img, (W // 2, H // 2), 700, (80, 20, 20), 0.35)
    d = ImageDraw.Draw(img, "RGBA")
    x, y, w, h = 460, 190, 1000, 560
    rrect(d, [x, y, x + w, y + h], 28, (10, 16, 28, 255), (35, 45, 60, 255), 2)
    d.ellipse([x + 36, y + 30, x + 52, y + 46], fill=(248, 113, 113, 255))
    d.ellipse([x + 60, y + 30, x + 76, y + 46], fill=(251, 191, 36, 255))
    d.ellipse([x + 84, y + 30, x + 100, y + 46], fill=(45, 212, 191, 255))
    txt(d, (x + w // 2, y + 28), "RAHUL S.", font(FONT_M, 22), MUTED, "ma")
    rrect(d, [x + 300, y + 110, x + 940, y + 190], 22, (20, 60, 60, 255), None)
    txt(d, (x + 620, y + 135), "Files sent. Please check.", font(FONT_R, 28), WHITE, "ma")
    rrect(d, [x + 520, y + 215, x + 940, y + 275], 22, (20, 60, 60, 255), None)
    txt(d, (x + 730, y + 232), "Hello?", font(FONT_R, 28), WHITE, "ma")
    rrect(d, [x + 170, y + 310, x + 830, y + 380], 18, (60, 20, 24, 255), (120, 40, 46, 255), 2)
    txt(d, (x + 500, y + 330), "!  This account can no longer receive messages.", font(FONT_R, 26), RED, "ma")
    for i in range(3):
        rrect(d, [x + 170 + i * 18, y + 420, x + 230 + i * 18, y + 480], 14, (30, 41, 59, 255))
    txt(d, (W // 2, 800), "Then…  silence.", font(FONT_K, 86), WHITE, "ma")
    txt(d, (W // 2, 910), "Advance gone. Work gone. No reply.", font(FONT_R, 34), MUTED, "ma")
    return vignette(grain(img), 0.7)

def qr(d, x, y, cell, n=21):
    rnd = random.Random(42)
    d.rectangle([x, y, x + n * cell, y + n * cell], fill=(255, 255, 255))
    for i in range(n):
        for j in range(n):
            if rnd.random() < 0.46:
                d.rectangle([x + i * cell, y + j * cell, x + (i + 1) * cell, y + (j + 1) * cell], fill=(8, 12, 20))
    for (ox, oy) in [(0, 0), (n - 7, 0), (0, n - 7)]:
        d.rectangle([x + ox * cell, y + oy * cell, x + (ox + 7) * cell, y + (oy + 7) * cell], fill=(255, 255, 255))
        d.rectangle([x + (ox + 1) * cell, y + (oy + 1) * cell, x + (ox + 6) * cell, y + (oy + 6) * cell], fill=(8, 12, 20))
        d.rectangle([x + (ox + 2) * cell, y + (oy + 2) * cell, x + (ox + 5) * cell, y + (oy + 5) * cell], fill=(255, 255, 255))

def scene04():
    img, d = base(4)
    txt(d, (140, 250), "THE QR DEAL", font(FONT_M, 26), AMBER)
    txt(d, (140, 320), "She paid.", font(FONT_K, 120), WHITE)
    txt(d, (140, 450), "On a QR code.", font(FONT_K, 120), MUTED)
    txt(d, (140, 640), "₹2,000 for a product.\nSeller promised same-day delivery.", font(FONT_R, 38), MUTED, spacing=14)
    x, y, w, h = 1240, 150, 470, 780
    add_glow(img, (x + w // 2, y + h // 2), 420, (160, 120, 30), 0.45)
    d = ImageDraw.Draw(img, "RGBA")
    rrect(d, [x, y, x + w, y + h], 36, (245, 247, 250, 255), None)
    qr(d, x + 95, y + 90, 13)
    txt(d, (x + w // 2, y + 470), "SCAN & PAY", font(FONT_M, 22), (60, 70, 85), "ma")
    txt(d, (x + w // 2, y + 520), "₹2,000", font(FONT_K, 78), (10, 15, 25), "ma")
    check(d, x + w // 2, y + 650, 40, (16, 140, 120))
    txt(d, (x + w // 2, y + 720), "PAYMENT RECEIVED", font(FONT_M, 22), (16, 120, 105), "ma")
    return vignette(grain(img))

def scene05():
    img, d = base(5)
    x, y, w, h = 1120, 130, 620, 800
    rrect(d, [x, y, x + w, y + h], 24, (12, 18, 30, 255), (40, 50, 65, 255), 2)
    for i in range(14):
        xx = x + 20 + i * 42
        d.rectangle([xx, y + 20, xx + 26, y + h - 20], fill=(20, 30, 45, 255))
    rrect(d, [x + 130, y + 300, x + w - 130, y + 430], 16, (30, 20, 20, 255), (120, 50, 50, 255), 3)
    txt(d, (x + w // 2, y + 340), "CLOSED", font(FONT_K, 56), RED, "ma")
    txt(d, (x + w // 2, y + 392), "SHUTTER DOWN", font(FONT_M, 20), MUTED, "ma")
    txt(d, (140, 300), "THE GHOST", font(FONT_M, 26), RED)
    txt(d, (140, 365), "Seller gone.", font(FONT_K, 120), WHITE)
    txt(d, (140, 500), "Number unreachable.\nOrder never shipped.", font(FONT_R, 40), MUTED, spacing=14)
    rrect(d, [140, 650, 800, 740], 20, (25, 18, 22, 255), (90, 40, 45, 255), 2)
    txt(d, (172, 675), "Calling seller…   no answer", font(FONT_R, 28), RED)
    return vignette(grain(img), 0.65)

def scene06():
    img, d = base(6)
    d.line([(W // 2, 120), (W // 2, 960)], fill=(60, 75, 95, 180), width=2)
    txt(d, (W // 2, 130), "BOTH SIDES OF THE SAME COIN", font(FONT_M, 26), AMBER, "ma")
    txt(d, (480, 300), "FREELANCER", font(FONT_M, 26), TEAL, "ma")
    txt(d, (480, 370), "₹15,000", font(FONT_K, 96), WHITE, "ma")
    txt(d, (480, 500), "lost after delivery", font(FONT_R, 32), MUTED, "ma")
    txt(d, (1440, 300), "BUYER", font(FONT_M, 26), AMBER, "ma")
    txt(d, (1440, 370), "₹2,000", font(FONT_K, 96), WHITE, "ma")
    txt(d, (1440, 500), "lost after payment", font(FONT_R, 32), MUTED, "ma")
    rrect(d, [W // 2 - 300, 680, W // 2 + 300, 830], 26, (30, 20, 24, 255), (120, 50, 55, 255), 3)
    txt(d, (W // 2, 710), "SCAMMED", font(FONT_K, 74), RED, "ma")
    txt(d, (W // 2, 900), "No proof. No recourse. No trust.", font(FONT_R, 34), MUTED, "ma")
    return vignette(grain(img))

def scene07():
    img, d = base(7)
    add_glow(img, (W // 2, 540), 760, (25, 160, 140), 0.45)
    d = ImageDraw.Draw(img, "RGBA")
    x, y, w, h = 360, 170, 1200, 740
    rrect(d, [x, y, x + w, y + h], 32, (10, 18, 30, 255), (45, 70, 85, 255), 3)
    txt(d, (x + 60, y + 50), "TRUSTBRIDGE  ·  PROTECTED DEAL", font(FONT_M, 24), TEAL)
    txt(d, (x + 60, y + 105), "₹17,000", font(FONT_K, 92), WHITE)
    rrect(d, [x + w - 380, y + 60, x + w - 60, y + 120], 30, (12, 60, 55, 255), (45, 212, 191, 255), 2)
    txt(d, (x + w - 220, y + 78), "HELD IN TRUST LOCK", font(FONT_M, 18), TEAL, "ma")
    steps = [("1", "Paid", True), ("2", "Work delivered", True), ("3", "Release", False)]
    for i, (n, label, done) in enumerate(steps):
        cx = x + 190 + i * 410
        cy = y + 330
        color = TEAL if done else (70, 85, 105)
        d.ellipse([cx - 46, cy - 46, cx + 46, cy + 46], fill=(12, 28, 40, 255), outline=color, width=4)
        if done:
            check(d, cx, cy, 30, TEAL)
        else:
            txt(d, (cx, cy), n, font(FONT_B, 34), color, "mm")
        txt(d, (cx, cy + 80), label, font(FONT_B, 30), WHITE if done else MUTED, "ma")
        if i < 2:
            d.line([(cx + 60, cy), (cx + 350, cy)], fill=(45, 212, 191, 160), width=4)
    txt(d, (x + 60, y + 560), "Money is held until the work is proven.\nReleased only when both sides agree.", font(FONT_R, 34), MUTED, spacing=14)
    txt(d, (x + 60, y + 675), "Auto-release after the review window  ·  Human dispute desk", font(FONT_M, 20), TEAL)
    return vignette(grain(img))

def notif(img, d, title, body, color):
    x, y, w, h = 560, 300, 800, 300
    add_glow(img, (W // 2, y + h // 2), 500, (30, 150, 130), 0.4)
    d = ImageDraw.Draw(img, "RGBA")
    rrect(d, [x, y, x + w, y + h], 30, (12, 22, 34, 255), (50, 70, 85, 255), 2)
    d.ellipse([x + 50, y + 60, x + 130, y + 140], fill=(16, 60, 55, 255), outline=color, width=3)
    check(d, x + 90, y + 100, 26, color)
    txt(d, (x + 160, y + 60), title, font(FONT_B, 40), WHITE)
    txt(d, (x + 160, y + 118), body, font(FONT_R, 28), MUTED)
    return d

def scene08():
    img, d = base(8)
    txt(d, (W // 2, 130), "FREELANCER PROTECTED", font(FONT_M, 26), TEAL, "ma")
    d = notif(img, d, "Payment released to you", "₹15,000  ·  Arjun  →  TrustBridge escrow", TEAL)
    txt(d, (W // 2, 680), "Delivered. Approved. Paid.", font(FONT_K, 72), WHITE, "ma")
    txt(d, (W // 2, 790), "No chasing. No ghosting.", font(FONT_R, 34), MUTED, "ma")
    return vignette(grain(img))

def scene09():
    img, d = base(9)
    txt(d, (W // 2, 130), "BUYER PROTECTED", font(FONT_M, 26), AMBER, "ma")
    d = notif(img, d, "Delivery confirmed", "₹2,000 released  ·  Meera  →  Seller", TEAL)
    txt(d, (W // 2, 680), "Paid into escrow, not to a stranger.", font(FONT_K, 58), WHITE, "ma")
    txt(d, (W // 2, 780), "Refund if it never arrives.", font(FONT_R, 34), MUTED, "ma")
    return vignette(grain(img))

def shield(d, cx, cy, s, color):
    pts = [(cx, cy - s), (cx + s * 0.82, cy - s * 0.62), (cx + s * 0.72, cy + s * 0.28),
           (cx, cy + s), (cx - s * 0.72, cy + s * 0.28), (cx - s * 0.82, cy - s * 0.62)]
    d.polygon(pts, fill=(12, 30, 34), outline=color)
    d.line([(cx - s * 0.45, cy), (cx - s * 0.05, cy + s * 0.35), (cx + s * 0.5, cy - s * 0.4)], fill=color, width=max(6, s // 10), joint="curve")

def scene10():
    img, d = base(10)
    add_glow(img, (W // 2, 430), 620, (25, 160, 140), 0.55)
    d = ImageDraw.Draw(img, "RGBA")
    shield(d, W // 2, 330, 110, TEAL)
    txt(d, (W // 2, 500), "TRUSTBRIDGE", font(FONT_K, 118), WHITE, "ma")
    txt(d, (W // 2, 650), "Verify first. Protect the deal.", font(FONT_R, 46), TEAL, "ma")
    txt(d, (W // 2, 760), "ESCROW   ·   VERIFICATION   ·   DISPUTES", font(FONT_M, 24), MUTED, "ma")
    rrect(d, [W // 2 - 260, 840, W // 2 + 260, 920], 40, (14, 60, 55, 255), (45, 212, 191, 255), 2)
    txt(d, (W // 2, 862), "trustbridge-abhithe.vercel.app", font(FONT_M, 24), TEAL, "ma")
    return vignette(grain(img), 0.5)

SCENES = [scene01, scene02, scene03, scene04, scene05, scene06, scene07, scene08, scene09, scene10]

def main():
    os.makedirs(OUT, exist_ok=True)
    for i, fn in enumerate(SCENES, 1):
        img = fn()
        p = os.path.join(OUT, f"scene{i:02d}.png")
        img.save(p, quality=95)
        print("wrote", p)

if __name__ == "__main__":
    main()
