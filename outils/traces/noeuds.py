# Bouts et embranchements du squelette de chaque forme (coordonnées dans le repère 1000 × 600 du tableau)
import json, numpy as np
from squelette import analyse
from scipy import ndimage
formes = [tuple(x[:2]) for x in json.load(open("formes.json"))]
for L, f in formes:
    a, sq, pts = analyse(L, f)
    k = ndimage.convolve(sq.astype(int), np.ones((3, 3), int), mode="constant") - 1
    ys, xs = np.nonzero(sq & (k == 1)); bouts = sorted(set((int(x), int(y)) for x, y in zip(xs, ys)))
    ys, xs = np.nonzero(sq & (k >= 3)); emb = list(zip(xs.tolist(), ys.tolist()))
    # regroupe les pixels d'embranchement voisins
    gr = []
    for p in emb:
        for g in gr:
            if abs(g[0][0] - p[0]) < 6 and abs(g[0][1] - p[1]) < 6: g.append(p); break
        else: gr.append([p])
    emb = [(round(np.mean([q[0] for q in g])), round(np.mean([q[1] for q in g]))) for g in gr]
    print(f"{L} {f:7s} bouts {bouts}  embr {emb}  points {[(round(x), round(y)) for x, y, t in pts]}")
