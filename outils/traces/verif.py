# Planche de contrôle : la lettre de la police en gris, et par-dessus le chemin tracé (du bleu au rouge = du début à la fin),
# le départ de chaque trait (rond numéroté) et ses points.
import json, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
ch = json.load(open("chemins.json")); fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
sel = [tuple(s.split(":")) for s in sys.argv[2].split(",")] if len(sys.argv) > 2 else [(L, f) for L in ch for f in ch[L]]
col, cell = 4, 400; rows = (len(sel) + col - 1) // col
im = Image.new("RGB", (col * cell, rows * cell), "white"); d = ImageDraw.Draw(im)
for n, (L, f) in enumerate(sel):
    a = np.array(Image.open(f"g_{L}_{f}.png"))[:, :, 3]; ys, xs = np.nonzero(a > 30)
    x0, y0 = xs.min() - 30, ys.min() - 30; w = max(xs.max() - x0 + 30, ys.max() - y0 + 30); s = (cell - 24) / w
    tu = Image.fromarray(255 - (a[y0:y0 + w, x0:x0 + w] * 0.3).astype(np.uint8)).convert("RGB").resize((int(w * s), int(w * s)))
    td = ImageDraw.Draw(tu); P = lambda p: ((p[0] - x0) * s, (p[1] - y0) * s)
    traits = ch[L][f]; tot = sum(len(t) for t in traits); k = 0
    for i, tr in enumerate(traits):
        if len(tr) == 1:
            x, y = P(tr[0]); td.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(200, 0, 120), width=3); td.text((x + 7, y - 18), str(i + 1), fill=(200, 0, 120), font=fnt); continue
        for p, q in zip(tr, tr[1:]):
            t = k / max(1, tot); k += 1; td.line([P(p), P(q)], fill=(int(40 + 215 * t), 60, int(255 - 215 * t)), width=3)
        x, y = P(tr[0]); td.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(20, 20, 20)); td.text((x - 4, y - 8), str(i + 1), fill="white", font=fnt)
        k += 1
    ox, oy = (n % col) * cell + 12, (n // col) * cell + 20
    im.paste(tu, (ox, oy)); d.text((ox, oy - 18), f"{L} {f}", fill="black", font=fnt)
im.save(sys.argv[1])
