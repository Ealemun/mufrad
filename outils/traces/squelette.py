# Squelette (ligne médiane) de chaque forme de lettre rendue par la police, pour poser les tracés sur la vraie lettre.
import json, numpy as np
from PIL import Image, ImageDraw, ImageFont
from skimage.morphology import skeletonize
from scipy import ndimage

def charger(L, f):
    a = np.array(Image.open(f"g_{L}_{f}.png"))[:, :, 3]
    return a

def analyse(L, f):
    a = charger(L, f); m = a > 100
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    tailles = ndimage.sum(m, lab, range(1, n + 1))
    boites = ndimage.find_objects(lab)
    # un point (ou une paire de points collés) : petite boîte ; le corps : le reste
    est_point = [ (b[0].stop - b[0].start) <= 60 and (b[1].stop - b[1].start) <= 110 and tailles[i] < tailles.max() * 0.6 for i, b in enumerate(boites)]
    corps = np.isin(lab, [i + 1 for i in range(n) if not est_point[i]])
    sq = skeletonize(corps)
    points = []
    for i in range(n):
        if est_point[i]:
            ys, xs = np.nonzero(lab == i + 1); points.append((float(xs.mean()), float(ys.mean()), int(tailles[i])))
    return a, sq, points

def planche(formes, sortie, col=4, cell=400):
    rows = (len(formes) + col - 1) // col
    im = Image.new("RGB", (col * cell, rows * cell), "white"); d = ImageDraw.Draw(im)
    fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
    for idx, (L, f) in enumerate(formes):
        a, sq, pts = analyse(L, f)
        ys, xs = np.nonzero(a > 30); x0, x1, y0, y1 = xs.min() - 30, xs.max() + 30, ys.min() - 30, ys.max() + 30
        x0 -= x0 % 50; y0 -= y0 % 50
        s = min((cell - 20) / (x1 - x0), (cell - 30) / (y1 - y0))
        ox, oy = (idx % col) * cell + 10, (idx // col) * cell + 22
        tuile = Image.new("RGB", (int((x1 - x0) * s) + 1, int((y1 - y0) * s) + 1), "white"); td = ImageDraw.Draw(tuile)
        # lettre en gris
        g = Image.fromarray(255 - (a[y0:y1, x0:x1] * 0.35).astype(np.uint8)).resize(tuile.size)
        tuile.paste(g.convert("RGB"))
        td = ImageDraw.Draw(tuile)
        for gx in range(int(x0), int(x1), 25):
            td.line([((gx - x0) * s, 0), ((gx - x0) * s, tuile.size[1])], fill=(200, 220, 255) if gx % 50 else (140, 170, 240), width=1)
        for gy in range(int(y0), int(y1), 25):
            td.line([(0, (gy - y0) * s), (tuile.size[0], (gy - y0) * s)], fill=(200, 220, 255) if gy % 50 else (140, 170, 240), width=1)
        yy, xx = np.nonzero(sq)
        for X, Y in zip(xx, yy):
            td.point(((X - x0) * s, (Y - y0) * s), fill=(220, 30, 30))
        for (X, Y, t) in pts:
            td.ellipse([((X - x0) * s - 3, (Y - y0) * s - 3), ((X - x0) * s + 3, (Y - y0) * s + 3)], fill=(30, 120, 30))
            td.text(((X - x0) * s + 5, (Y - y0) * s - 5), f"{X:.0f},{Y:.0f}", fill=(30, 120, 30), font=fnt)
        for gx in range(int(x0), int(x1), 50): td.text(((gx - x0) * s + 2, 2), str(gx), fill=(60, 90, 200), font=fnt)
        for gy in range(int(y0), int(y1), 50): td.text((2, (gy - y0) * s + 2), str(gy), fill=(60, 90, 200), font=fnt)
        im.paste(tuile, (ox, oy)); d.text((ox, oy - 16), f"{L}  {f}", fill="black", font=fnt)
    im.save(sortie)

if __name__ == "__main__":
    import sys
    formes = [tuple(x[:2]) for x in json.load(open("formes.json"))]
    sel = sys.argv[2].split(",") if len(sys.argv) > 2 else None
    if sel: formes = [x for x in formes if x[0] in sel]
    planche(formes, sys.argv[1])
