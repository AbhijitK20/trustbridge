#!/usr/bin/env python3
import argparse, json, os, re, sys, time, urllib.parse, urllib.request

OUT = "video/stills_people"
STYLE = ("cinematic film still, 35mm lens, shallow depth of field, natural light, teal-orange grade, "
         "photorealistic, Indian setting, third-person camera, no text, no logos, no watermark")

SCENES = [
    ("Wide shot inside a small Indian office at night: two men at a desk. A young man in a navy shirt sits with a laptop; "
     "an older man in a white polo stands and taps his phone, paying him. Warm lamp, teal shadows, photorealistic."),
    ("Wide shot: the young man in the navy shirt works at his laptop and hands a folder of files to the older man in the white "
     "polo, who stands to leave. Morning light, small Indian office."),
    ("Medium shot: the young man in the navy shirt alone at his desk, staring at his phone, shocked. He grips his hair with one "
     "hand, panicking. Cold blue light, night office."),
    ("Wide shot inside a small Indian boutique: a young woman in an olive green kurta scans a QR code on the counter with her "
     "phone. The shopkeeper in a white polo and gold chain smiles and holds a shopping bag. Daylight."),
    ("Wide shot on an Indian street: the same young woman in the olive green kurta stands in front of a boutique with the shutter "
     "half closed. She holds her phone to her ear, panicking. Harsh afternoon sun."),
    ("Wide shot in a cybercrime police office: the young man in the navy shirt and the young woman in the olive kurta sit side "
     "by side, both holding phones, exhausted. An officer takes notes behind them. Fluorescent light."),
    ("Close shot of two hands holding a smartphone with a glowing escrow screen and shield icon. In the background the man in the "
     "navy shirt and the man in the white polo sit across a desk, relieved. Warm light."),
    ("Medium shot: the young man in the navy shirt shakes hands with the older man in the white polo across a desk. Both smile, "
     "relieved. A phone glows on the desk. Bright Indian office."),
    ("Wide shot at a doorstep: the young woman in the olive kurta opens a cardboard box and smiles at a delivery agent in a cap, "
     "who taps his phone. Golden hour."),
    ("Wide shot in a bright modern office: a young Indian man in a green shirt and a young Indian woman in a yellow kurta "
     "stand side by side, smiling at the camera, confident. Clean white wall, soft daylight, photorealistic."),
]


def fetch(prompt, seed, width=1280, height=800):
    q = urllib.parse.quote(prompt)
    url = (f"https://image.pollinations.ai/prompt/{q}?width={width}&height={height}"
           f"&seed={seed}&nologo=true")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", type=int, default=0)
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--delay", type=float, default=47)
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    todo = [args.only] if args.only else list(range(args.start, 11))
    for n in todo:
        prompt = SCENES[n - 1] + ". " + STYLE
        seed = 700 + n
        path = os.path.join(OUT, f"scene{n:02d}.jpg")
        for attempt in range(6):
            try:
                raw = fetch(prompt, seed)
                if len(raw) < 20000:
                    raise ValueError(f"short response {len(raw)}")
                open(path, "wb").write(raw)
                print(f"scene{n:02d} ok {len(raw)} bytes", flush=True)
                break
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", "ignore")
                m = re.search(r"Retry after (\d+)s", body)
                wait = int(m.group(1)) + 3 if m else (20 if e.code >= 500 else args.delay)
                print(f"scene{n:02d} {e.code}, waiting {wait}s", flush=True)
                time.sleep(wait)
            except Exception as e:
                print(f"scene{n:02d} error {e}, retrying", flush=True)
                time.sleep(10)
        if n != todo[-1]:
            time.sleep(args.delay)


if __name__ == "__main__":
    main()
