#!/usr/bin/env python3
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

W, H, FPS = 1920, 1080, 30
OUT = "video/out/trustbridge-flat.mp4"
VO = [f"video/vo/{i:02d}.mp3" for i in range(1, 11)]
FB = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FK = "/usr/share/fonts/truetype/noto/NotoSans-Black.ttf"
FR = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FM = "/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"

BG1, BG2 = (6, 9, 18), (12, 22, 40)
TEAL, AMBER, RED = (45, 212, 191), (251, 191, 36), (248, 113, 113)
WHITE, MUTED = (232, 238, 248), (150, 165, 185)
PANEL, LINE = (16, 25, 43), (38, 52, 72)
SKIN = [(232, 180, 138), (206, 150, 110), (176, 124, 86)]
HAIR = [(28, 28, 34), (44, 32, 26), (20, 22, 28)]

def font(p, s):
    return ImageFont.truetype(p, s)

def clamp01(x):
    return max(0.0, min(1.0, x))

def ease(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3

def back(x):
    x = clamp01(x)
    s = 1.70158
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2

def lerp(a, b, t):
    return a + (b - a) * t

def mix(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))

def alpha(c, a):
    return (c[0], c[1], c[2], int(clamp01(a) * 255))

def bg():
    base = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        t = y / H
        base[y, :, :] = [int(BG1[i] * (1 - t) + BG2[i] * t) for i in range(3)]
    img = Image.fromarray(base, "RGB")
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(glow, "RGBA")
    d.ellipse([W - 900, -500, W + 500, 700], fill=(20, 110, 100, 90))
    d.ellipse([-500, H - 500, 600, H + 500], fill=(110, 70, 20, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    img = Image.blend(img, Image.fromarray(np.clip(np.array(img).astype(np.int16) + np.array(glow).astype(np.int16), 0, 255).astype(np.uint8)), 0.55)
    d = ImageDraw.Draw(img, "RGBA")
    for x in range(0, W, 80):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 7))
    for y in range(0, H, 80):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 7))
    return img

BG = None

def rr(d, box, r, fill=None, outline=None, width=2):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def circ(d, cx, cy, r, fill=None, outline=None, width=2):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=outline, width=width)

def capsule(d, p1, p2, w, fill):
    d.line([p1, p2], fill=fill, width=w, joint="curve")
    for p in (p1, p2):
        circ(d, p[0], p[1], w // 2, fill)

def txt(d, xy, s, f, fill, anchor="la", spacing=8):
    d.multiline_text(xy, s, font=f, fill=fill, anchor=anchor, spacing=spacing)

def head(d, cx, cy, r, skin, hair, style="short", expr="neutral", a=1.0):
    col = alpha(skin, a)
    circ(d, cx, cy, r, col)
    hc = alpha(hair, a)
    if style == "long":
        d.pieslice([cx - r - 3, cy - r - 5, cx + r + 3, cy + r * 0.9], 180, 360, fill=hc)
        rr(d, [cx - r - 2, cy - r * 0.4, cx - r * 0.55, cy + r * 0.95], 10, hc)
        rr(d, [cx + r * 0.55, cy - r * 0.4, cx + r + 2, cy + r * 0.95], 10, hc)
    elif style == "bun":
        d.pieslice([cx - r - 3, cy - r - 5, cx + r + 3, cy + r], 180, 360, fill=hc)
        circ(d, cx, cy - r * 1.15, r * 0.35, hc)
    else:
        d.pieslice([cx - r - 3, cy - r - 5, cx + r + 3, cy + r * 0.7], 180, 360, fill=hc)
    ey = cy + r * 0.08
    ex = r * 0.36
    ec = alpha((20, 22, 30), a)
    if expr == "shock":
        circ(d, cx - ex, ey, r * 0.11, ec)
        circ(d, cx + ex, ey, r * 0.11, ec)
        d.ellipse([cx - r * 0.18, cy + r * 0.26, cx + r * 0.18, cy + r * 0.58], fill=ec)
    elif expr == "happy":
        d.arc([cx - ex - r * 0.14, ey - r * 0.16, cx - ex + r * 0.14, ey + r * 0.16], 200, 340, fill=ec, width=max(3, int(r * 0.08)))
        d.arc([cx + ex - r * 0.14, ey - r * 0.16, cx + ex + r * 0.14, ey + r * 0.16], 200, 340, fill=ec, width=max(3, int(r * 0.08)))
        d.arc([cx - r * 0.34, cy + r * 0.12, cx + r * 0.34, cy + r * 0.56], 10, 170, fill=ec, width=max(3, int(r * 0.08)))
    elif expr == "sad":
        circ(d, cx - ex, ey, r * 0.09, ec)
        circ(d, cx + ex, ey, r * 0.09, ec)
        d.arc([cx - r * 0.3, cy + r * 0.34, cx + r * 0.3, cy + r * 0.66], 190, 350, fill=ec, width=max(3, int(r * 0.07)))
    else:
        circ(d, cx - ex, ey, r * 0.09, ec)
        circ(d, cx + ex, ey, r * 0.09, ec)
        d.line([(cx - r * 0.16, cy + r * 0.42), (cx + r * 0.16, cy + r * 0.42)], fill=ec, width=max(3, int(r * 0.07)))

def person(d, x, y, s, shirt, skin, hair, style="short", expr="neutral", a=1.0, arm_l=None, arm_r=None, legs=True):
    sh = alpha(shirt, a)
    sk = alpha(skin, a)
    hc = alpha(hair, a)
    torso = [x - 46 * s, y - 300 * s, x + 46 * s, y - 140 * s]
    rr(d, torso, int(26 * s), sh)
    if legs:
        capsule(d, (x - 22 * s, y - 150 * s), (x - 26 * s, y), int(18 * s), alpha(mix(shirt, (10, 12, 20), 0.45), a))
        capsule(d, (x + 22 * s, y - 150 * s), (x + 26 * s, y), int(18 * s), alpha(mix(shirt, (10, 12, 20), 0.45), a))
    sl = (x - 44 * s, y - 272 * s)
    sr = (x + 44 * s, y - 272 * s)
    hl = arm_l if arm_l else (x - 70 * s, y - 160 * s)
    hr = arm_r if arm_r else (x + 70 * s, y - 160 * s)
    capsule(d, sl, hl, int(15 * s), sk)
    capsule(d, sr, hr, int(15 * s), sk)
    circ(d, hl[0], hl[1], int(12 * s), sk)
    circ(d, hr[0], hr[1], int(12 * s), sk)
    head(d, x, y - 352 * s, int(46 * s), skin, hair, style, expr, a)

def phone(d, x, y, w, h, a=1.0, screen=TEAL, glyph="₹"):
    rr(d, [x - w / 2, y - h / 2, x + w / 2, y + h / 2], int(w * 0.16), alpha((8, 12, 22), a), alpha((90, 110, 130), a), 3)
    rr(d, [x - w / 2 + 8, y - h / 2 + 8, x + w / 2 - 8, y + h / 2 - 8], int(w * 0.12), alpha(screen, a * 0.18))
    txt(d, (x, y - h * 0.1), glyph, font(FK, int(h * 0.34)), alpha(screen, a), "mm")

def desk(d, x1, x2, y, a=1.0):
    rr(d, [x1, y, x2, y + 240], 18, alpha((22, 32, 48), a))
    rr(d, [x1, y, x2, y + 30], 14, alpha((34, 48, 68), a))
    d.line([(x1 + 40, y + 60), (x1 + 40, y + 220)], fill=alpha((16, 24, 38), a), width=3)

def bubble(d, x, y, w, h, text, fg, bgc, a=1.0, fs=28):
    rr(d, [x, y, x + w, y + h], int(h * 0.42), alpha(bgc, a))
    txt(d, (x + 24, y + h / 2), text, font(FR, fs), alpha(fg, a), "lm")

def check(d, cx, cy, r, color, a=1.0):
    circ(d, cx, cy, r, alpha(color, a))
    d.line([(cx - r * 0.45, cy), (cx - r * 0.08, cy + r * 0.38), (cx + r * 0.5, cy - r * 0.38)], fill=alpha((6, 10, 18), a), width=max(4, r // 6), joint="curve")

def coin(d, cx, cy, r, a=1.0):
    circ(d, cx, cy, r, alpha(AMBER, a))
    circ(d, cx, cy, r * 0.72, alpha((250, 210, 90), a))
    txt(d, (cx, cy), "₹", font(FB, int(r * 1.1)), alpha((90, 60, 10), a), "mm")

def shield(d, cx, cy, s, color, a=1.0):
    pts = [(cx, cy - s), (cx + s * 0.82, cy - s * 0.62), (cx + s * 0.72, cy + s * 0.28), (cx, cy + s), (cx - s * 0.72, cy + s * 0.28), (cx - s * 0.82, cy - s * 0.62)]
    d.polygon(pts, fill=alpha((10, 28, 34), a), outline=alpha(color, a))
    d.line([(cx - s * 0.4, cy), (cx - s * 0.05, cy + s * 0.32), (cx + s * 0.46, cy - s * 0.36)], fill=alpha(color, a), width=max(6, int(s // 9)), joint="curve")

def qr(d, x, y, cell, n=17, a=1.0):
    d.rectangle([x, y, x + n * cell, y + n * cell], fill=alpha((245, 247, 250), a))
    rnd = np.random.default_rng(11)
    for i in range(n):
        for j in range(n):
            if rnd.random() < 0.44:
                d.rectangle([x + i * cell, y + j * cell, x + (i + 1) * cell, y + (j + 1) * cell], fill=alpha((10, 14, 22), a))
    for ox, oy in [(0, 0), (n - 5, 0), (0, n - 5)]:
        d.rectangle([x + ox * cell, y + oy * cell, x + (ox + 5) * cell, y + (oy + 5) * cell], fill=alpha((245, 247, 250), a))
        d.rectangle([x + (ox + 1) * cell, y + (oy + 1) * cell, x + (ox + 4) * cell, y + (oy + 4) * cell], fill=alpha((10, 14, 22), a))

def headline(d, eyebrow, title, sub, color=TEAL, y=150, t=1.0):
    txt(d, (120, y), eyebrow, font(FM, 26), alpha(color, t))
    txt(d, (120, y + 48), title, font(FK, 104), alpha(WHITE, t))
    if sub:
        txt(d, (120, y + 190), sub, font(FR, 36), alpha(MUTED, t), spacing=12)

def progress_bar(d, p):
    d.rectangle([0, 0, W, 5], fill=(20, 28, 42))
    d.rectangle([0, 0, int(W * p), 5], fill=TEAL)

def office_bg(d, a=1.0):
    rr(d, [0, 0, W, H], 0, alpha((10, 16, 28), a))
    rr(d, [1180, 170, 1750, 640], 18, alpha((16, 30, 46), a), alpha((40, 60, 80), a), 3)
    d.line([(1465, 170), (1465, 640)], fill=alpha((40, 60, 80), a), width=3)
    d.line([(1180, 405), (1750, 405)], fill=alpha((40, 60, 80), a), width=3)

def shadow(d, x, y, w=150, a=1.0):
    d.ellipse([x - w / 2, y - 14, x + w / 2, y + 14], fill=alpha((0, 0, 0), 0.5 * a))

def scene1(d, p, t):
    office_bg(d)
    a = 1.0
    rx = 1320
    arm = (lerp(rx + 40, rx - 105, ease(p / 0.35)), lerp(700, 560, ease(p / 0.35)))
    shadow(d, rx, 855)
    person(d, rx, 850, 1.0, (226, 232, 242), SKIN[0], HAIR[0], "short", "happy" if p > 0.5 else "neutral", a, arm_l=(rx - 60, 710), arm_r=arm)
    phone(d, arm[0], arm[1], 74, 126, a, TEAL, "₹")
    shadow(d, 720, 835)
    person(d, 720, 830, 0.95, (34, 62, 104), SKIN[1], HAIR[2], "bun", "happy" if p > 0.45 else "neutral", a, arm_l=(690, 690), arm_r=(760, 690))
    desk(d, 380, 1800, 760, a)
    if 0.15 < p < 0.8:
        cp = clamp01((p - 0.15) / 0.5)
        cx = lerp(1270, 780, cp)
        cy = 560 - math.sin(cp * math.pi) * 120
        coin(d, cx, cy, 26, a)
    if p > 0.45:
        k = back((p - 0.45) / 0.25)
        pw, ph = 250 * k, 140 * k
        rr(d, [1560 - pw / 2, 660 - ph / 2, 1560 + pw / 2, 660 + ph / 2], 18, alpha((12, 40, 38), a * k), alpha(TEAL, a * k), 3)
        txt(d, (1560, 638), "₹15,000", font(FB, int(40 * k)), alpha(WHITE, a * k), "mm")
        txt(d, (1560, 688), "PAID", font(FM, int(20 * k)), alpha(TEAL, a * k), "mm")
    headline(d, "THE FREELANCE DEAL  ·  02:00 AM", "He paid.", "₹15,000 upfront. Work delivered in good faith.", TEAL, 150, ease(p / 0.2))

def scene2(d, p, t):
    office_bg(d)
    shadow(d, 720, 835)
    person(d, 720, 830, 0.95, (34, 62, 104), SKIN[1], HAIR[2], "bun", "happy", 1.0, arm_l=(700, 690), arm_r=(780, 690))
    shadow(d, 1320, 855)
    person(d, 1320, 850, 1.0, (226, 232, 242), SKIN[0], HAIR[0], "short", "neutral", 1.0, arm_l=(1290, 700), arm_r=(1360, 700))
    desk(d, 380, 1800, 760)
    for i in range(4):
        q = clamp01((p - 0.1 - i * 0.08) / 0.4)
        if q <= 0:
            continue
        fx = lerp(840, 1210, ease(q))
        fy = 660 - math.sin(q * math.pi) * 120 - i * 26
        rr(d, [fx - 34, fy - 42, fx + 34, fy + 42], 10, alpha((30, 45, 66), 1.0), alpha(TEAL, 1.0), 2)
        d.line([(fx - 18, fy - 12), (fx + 18, fy - 12)], fill=alpha(TEAL, 0.8), width=4)
        d.line([(fx - 18, fy + 4), (fx + 6, fy + 4)], fill=alpha(MUTED, 0.8), width=4)
    if p > 0.55:
        check(d, 1520, 540, 46, TEAL, back((p - 0.55) / 0.25))
    headline(d, "THE DELIVERY", "All files delivered.", "Logo. Brand guide. Final reel. Everything he asked for.", TEAL, 150, ease(p / 0.2))

def scene3(d, p, t):
    office_bg(d, 0.55)
    shadow(d, 640, 845)
    person(d, 640, 840, 0.95, (34, 62, 104), SKIN[1], HAIR[2], "bun", "shock" if p > 0.6 else "sad", 1.0,
           arm_l=(560, 470) if p > 0.6 else (610, 700), arm_r=(720, 470) if p > 0.6 else (670, 700))
    if p > 0.65:
        for i in range(2):
            q = (p - 0.65) * 4 - i * 0.3
            if 0 < q < 1:
                circ(d, 700 + i * 34, 430 + q * 60, 10, alpha(TEAL, 0.9 * (1 - q)))
    x, y, w = 980, 260, 760
    rr(d, [x, y, x + w, y + 430], 22, alpha((10, 16, 28), 0.96), alpha((40, 54, 74), 1), 2)
    txt(d, (x + w / 2, y + 34), "RAHUL S.", font(FM, 20), alpha(MUTED, 1), "ma")
    bubble(d, x + 300, y + 90, 420, 62, "Files sent. Please check.", WHITE, (20, 58, 58), 1)
    if p > 0.25:
        bubble(d, x + 430, y + 172, 290, 58, "Hello?", WHITE, (20, 58, 58), 1)
    if p > 0.32:
        bubble(d, x + 55, y + 252, 680, 70, "!  This account can no longer receive messages.", RED, (58, 18, 24), 1, 24)
    if p > 0.75:
        for i in range(3):
            q = (p - 0.75) * 3 - i * 0.15
            circ(d, x + 130 + i * 34, y + 360, 8, alpha(MUTED, clamp01(q)))
    headline(d, "THE GHOST", "Then, silence.", "Advance gone. Work gone. No reply.", RED, 150, ease(p / 0.2))

def scene4(d, p, t):
    rr(d, [0, 0, W, H], 0, (14, 20, 30))
    rr(d, [1080, 160, 1800, 780], 20, (26, 34, 44), (60, 70, 80), 2)
    for i in range(4):
        rr(d, [1110, 200 + i * 130, 1770, 300 + i * 130], 10, (38, 46, 58))
        for j in range(5):
            rr(d, [1130 + j * 120, 220 + i * 130, 1210 + j * 120, 280 + i * 130], 6, (58, 70, 86))
    shadow(d, 1380, 805)
    person(d, 1380, 800, 0.95, (226, 232, 242), SKIN[0], HAIR[0], "short", "happy", 1.0, arm_l=(1330, 690), arm_r=(1430, 690))
    desk(d, 940, 1830, 800)
    qx, qy = 1040, 660
    qr(d, qx, qy, 9, 15, 1.0)
    scan = clamp01((p - 0.1) / 0.6)
    d.rectangle([qx - 6, qy + scan * 135 - 3, qx + 141, qy + scan * 135 + 3], fill=alpha(TEAL, 0.9))
    bx = 760
    armx = lerp(bx + 60, 900, ease(p / 0.5))
    shadow(d, bx, 885)
    person(d, bx, 880, 0.98, (96, 116, 76), SKIN[2], HAIR[1], "long", "neutral", 1.0, arm_l=(710, 720), arm_r=(armx, 700))
    phone(d, armx + 20, 700, 64, 108, 1.0, AMBER, "₹")
    if p > 0.55:
        k = back((p - 0.55) / 0.25)
        rr(d, [1160, 380, 1160 + 300 * k, 380 + 110 * k], 18, alpha((44, 34, 8), 0.95), alpha(AMBER, 1), 3)
        txt(d, (1310, 412), "₹2,000", font(FB, int(38 * k)), alpha(WHITE, 1), "mm")
        txt(d, (1310, 458), "RECEIVED", font(FM, int(18 * k)), alpha(AMBER, 1), "mm")
    headline(d, "THE QR DEAL", "She paid too.", "On a QR code. Same-day delivery promised.", AMBER, 150, ease(p / 0.2))

def scene5(d, p, t):
    rr(d, [0, 0, W, H], 0, (14, 20, 30))
    rr(d, [1080, 160, 1800, 780], 20, (26, 34, 44), (60, 70, 80), 2)
    drop = ease((p - 0.05) / 0.55)
    for i in range(12):
        x = 1095 + i * 58
        y2 = 160 + drop * 620
        rr(d, [x, 160, x + 34, y2], 6, (44, 54, 68))
    if p > 0.55:
        rr(d, [1240, 380, 1640, 500], 14, (40, 22, 26), RED, 3)
        txt(d, (1440, 418), "CLOSED", font(FK, 54), RED, "mm")
        txt(d, (1440, 470), "SHUTTER DOWN", font(FM, 16), MUTED, "mm")
    person(d, 760, 880, 0.98, (96, 116, 76), SKIN[2], HAIR[1], "long", "shock" if p > 0.6 else "sad", 1.0,
           arm_l=(690, 480) if p > 0.6 else (710, 720), arm_r=(860, 680))
    phone(d, 870, 660, 64, 108, 1.0, RED, "!")
    if p > 0.5:
        for i in range(3):
            q = (p - 0.5) * 2.5 - i * 0.2
            if 0 < q < 1:
                d.arc([820 - q * 40, 610 - q * 40, 820 + q * 40, 610 + q * 40], 200, 340, fill=alpha(RED, 1 - q), width=4)
    headline(d, "THE GHOST", "Seller gone.", "Number unreachable. Order never shipped.", RED, 150, ease(p / 0.2))

def scene6(d, p, t):
    d.rectangle([0, 0, W / 2, H], fill=(12, 18, 30))
    d.rectangle([W / 2, 0, W, H], fill=(14, 20, 32))
    d.line([(W / 2, 120), (W / 2, 980)], fill=(60, 75, 95), width=2)
    shadow(d, 480, 905, 170)
    person(d, 480, 900, 0.9, (34, 62, 104), SKIN[1], HAIR[2], "bun", "shock", 1.0, arm_l=(400, 560), arm_r=(560, 560))
    shadow(d, 1440, 905, 170)
    person(d, 1440, 900, 0.9, (96, 116, 76), SKIN[2], HAIR[1], "long", "shock", 1.0, arm_l=(1360, 560), arm_r=(1520, 560))
    txt(d, (480, 300), "FREELANCER", font(FM, 24), alpha(TEAL, 1), "ma")
    txt(d, (480, 350), "₹15,000 lost", font(FB, 40), WHITE, "ma")
    txt(d, (1440, 300), "BUYER", font(FM, 24), alpha(AMBER, 1), "ma")
    txt(d, (1440, 350), "₹2,000 lost", font(FB, 40), WHITE, "ma")
    if p > 0.35:
        k = back((p - 0.35) / 0.3)
        rr(d, [W / 2 - 300 * k, 640, W / 2 + 300 * k, 800], 24, (46, 18, 24), RED, 3)
        txt(d, (W / 2, 690), "SCAMMED", font(FK, int(64 * k)), RED, "ma")
    txt(d, (W / 2, 120), "BOTH SIDES OF THE SAME COIN", font(FM, 24), alpha(AMBER, 1), "ma")

def scene7(d, p, t):
    rr(d, [0, 0, W, H], 0, (10, 15, 26))
    cx, cy = 1450, 540
    glow = back(clamp01(p / 0.3))
    shield(d, cx, cy, 130 * glow, TEAL, 1)
    if p > 0.3:
        q = ease((p - 0.3) / 0.4)
        coin(d, cx + 82, lerp(320, cy - 55, q), 20, 1)
    if p > 0.45:
        rr(d, [cx - 240, cy + 120, cx + 240, cy + 300], 20, alpha((10, 40, 38), 1), alpha(TEAL, 1), 3)
        txt(d, (cx, cy + 160), "HELD IN TRUST LOCK", font(FM, 20), TEAL, "ma")
        txt(d, (cx, cy + 230), "₹17,000", font(FK, 54), WHITE, "ma")
    steps = ["Paid", "Delivered", "Release"]
    for i, label in enumerate(steps):
        x = 800 + i * 340
        y = 900
        done = p > 0.5 + i * 0.12
        circ(d, x, y, 32, (12, 30, 38), TEAL if done else (60, 75, 95), 3)
        if done:
            check(d, x, y, 20, TEAL, 1)
        else:
            txt(d, (x, y), str(i + 1), font(FB, 22), MUTED, "mm")
        txt(d, (x, y + 54), label, font(FB, 22), WHITE if done else MUTED, "ma")
    headline(d, "TRUSTBRIDGE", "So we built escrow.", "For deals made in chat, email and job boards.", TEAL, 150, ease(p / 0.2))

def scene8(d, p, t):
    rr(d, [0, 0, W, H], 0, (10, 15, 26))
    x, y, w, h = 560, 300, 800, 420
    rr(d, [x, y, x + w, y + h], 24, (12, 24, 34), (50, 80, 90), 3)
    for i in range(3):
        coin(d, x + 200 + i * 200, y + 140 + (i % 2) * 40, 40, 1)
    fillw = (w - 80) * ease(p / 0.85)
    rr(d, [x + 40, y + 290, x + w - 40, y + 326], 18, (24, 40, 54))
    rr(d, [x + 40, y + 290, x + 40 + fillw, y + 326], 18, TEAL)
    txt(d, (x + w / 2, y + 360), "WORK PROVEN", font(FM, 20), TEAL, "ma")
    rr(d, [x + w / 2 - 26, y - 20, x + w / 2 + 26, y + 40], 10, (18, 34, 46), TEAL, 3)
    txt(d, (W / 2, 150), "PROTECTED DEAL", font(FM, 24), TEAL, "ma")
    txt(d, (W / 2, 200), "Money held until the work is proven.", font(FK, 62), WHITE, "ma")
    txt(d, (W / 2, 950), "Auto-release after the review window  ·  Human dispute desk", font(FM, 20), MUTED, "ma")

def scene9(d, p, t):
    rr(d, [0, 0, W, H], 0, (10, 15, 26))
    cx, cy = W / 2, 430
    shield(d, cx, cy, 140, TEAL, 1)
    body = lerp(140, 140, p)
    if p > 0.3:
        q = ease((p - 0.3) / 0.5)
        coin(d, lerp(cx, 1500, q), lerp(cy, 700, q), 26, 1)
    if p > 0.55:
        check(d, 1500, 700, 36, TEAL, back((p - 0.55) / 0.2))
    for i, (x, label) in enumerate([(W / 2 - 420, "Buyer approves"), (W / 2 + 420, "Seller delivers")]):
        done = p > 0.2 + i * 0.15
        circ(d, x, 760, 30, (12, 30, 38), TEAL if done else (60, 75, 95), 3)
        if done:
            check(d, x, 760, 19, TEAL, 1)
        txt(d, (x, 820), label, font(FB, 24), WHITE if done else MUTED, "ma")
    headline(d, "BOTH SIDES AGREE", "Released only when both agree.", "No chasing. No ghosting.", TEAL, 150, ease(p / 0.2))

def scene10(d, p, t):
    rr(d, [0, 0, W, H], 0, (8, 12, 22))
    glow = 1 + 0.02 * math.sin(t * 3)
    shield(d, W / 2, 330, 110, TEAL, 1)
    txt(d, (W / 2, 480), "TRUSTBRIDGE", font(FK, 110), WHITE, "ma")
    txt(d, (W / 2, 630), "Verify first. Protect the deal.", font(FR, 42), TEAL, "ma")
    rr(d, [W / 2 - 300, 760, W / 2 + 300, 840], 40, (14, 60, 55), TEAL, 2)
    txt(d, (W / 2, 782), "trustbridge-abhithe.vercel.app", font(FM, 22), TEAL, "ma")
    txt(d, (W / 2, 900), "ESCROW   ·   VERIFICATION   ·   DISPUTES", font(FM, 20), MUTED, "ma")

SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8, scene9, scene10]

def dur(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path])
    return float(out.strip())

def main():
    global BG
    BG = bg()
    durs = [dur(p) + 0.35 for p in VO]
    durs[-1] += 0.5
    starts = []
    t = 0.0
    for x in durs:
        starts.append(t)
        t += x
    total = t

    silent = "video/out/_flat_silent.mp4"
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", silent]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    nframes = int(total * FPS)
    for f in range(nframes):
        gt = f / FPS
        scene_i = 0
        for i, (s, du) in enumerate(zip(starts, durs)):
            if s <= gt < s + du or i == len(starts) - 1:
                scene_i = i
                break
        p = clamp01((gt - starts[scene_i]) / durs[scene_i])
        img = BG.copy().convert("RGBA")
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov, "RGBA")
        SCENES[scene_i](d, p, gt - starts[scene_i])
        progress_bar(d, gt / total)
        if p < 0.06:
            a = int(255 * (1 - p / 0.06))
            d.rectangle([0, 0, W, H], fill=(6, 9, 18, a))
        if p > 0.94:
            a = int(255 * ((p - 0.94) / 0.06))
            d.rectangle([0, 0, W, H], fill=(6, 9, 18, a))
        img = Image.alpha_composite(img, ov).convert("RGB")
        proc.stdin.write(img.tobytes())
    proc.stdin.close()
    proc.wait()

    inputs = ["-i", silent]
    for p in VO:
        inputs += ["-i", p]
    fc = []
    for i, s in enumerate(starts):
        ms = int((s + 0.05) * 1000)
        fc.append(f"[{i+1}:a]aresample=48000,adelay={ms}|{ms}[a{i}]")
    fc.append("".join(f"[a{i}]" for i in range(len(VO))) + f"amix=inputs={len(VO)}:normalize=0[a]")
    subprocess.check_call(["ffmpeg", "-y", "-v", "error"] + inputs + ["-filter_complex", ";".join(fc),
                          "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", OUT])
    print("saved", OUT, f"{total:.2f}s", "scenes:", [round(x, 2) for x in durs])
    os.remove(silent)

if __name__ == "__main__":
    main()
