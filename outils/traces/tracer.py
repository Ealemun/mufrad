# Trace les chemins des formes de lettres le long du squelette de la police, à partir de quelques points de passage.
# Entrée : jalons.py (FORMES = {lettre: {forme: [trait, ...]}}, un trait = liste de jalons [x, y], parcourus dans l'ordre).
# Sortie : chemins.json, prêts pour js/tableau-lettres.js (points de passage [x, y], du départ à l'arrivée).
import json, heapq, numpy as np
from scipy import ndimage
from squelette import analyse
from jalons import FORMES   # points de passage choisis à la main (voir jalons.py)

def points_lettre(a, pts):
    """Centres des points de la lettre : une tache de deux points collés est coupée en deux ; ordre : de droite à gauche,
    et pour trois points, les deux du bas d'abord puis celui qui les coiffe."""
    m = a > 100; lab, n = ndimage.label(m, structure=np.ones((3, 3))); centres = []
    for (x, y, t) in pts:
        i = lab[int(round(y)), int(round(x))]
        ys, xs = np.nonzero(lab == i) if i else (np.array([y]), np.array([x]))
        if xs.max() - xs.min() > 60:   # deux points collés
            c = [xs.min(), xs.max()]
            for _ in range(10):
                g = np.abs(xs[:, None] - np.array(c)[None]).argmin(1); c = [xs[g == k].mean() for k in (0, 1)]
            centres += [(float(xs[g == k].mean()), float(ys[g == k].mean())) for k in (0, 1)]
        else: centres.append((float(xs.mean()), float(ys.mean())))
    if len(centres) == 3:
        haut = min(centres, key=lambda p: p[1]); bas = sorted([p for p in centres if p is not haut], key=lambda p: -p[0])
        return bas + [haut]
    return sorted(centres, key=lambda p: -p[0])

def graphe(sq):
    ys, xs = np.nonzero(sq); idx = {(x, y): i for i, (x, y) in enumerate(zip(xs.tolist(), ys.tolist()))}
    return xs, ys, idx

def chemin(sq_info, a, b):
    xs, ys, idx = sq_info
    dist = {a: 0}; prev = {}; q = [(0, a)]
    while q:
        d, u = heapq.heappop(q)
        if u == b: break
        if d > dist[u]: continue
        x, y = xs[u], ys[u]
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                v = idx.get((x + dx, y + dy))
                if v is None or v == u: continue
                nd = d + (1.4142 if dx and dy else 1)
                if nd < dist.get(v, 1e9): dist[v] = nd; prev[v] = u; heapq.heappush(q, (nd, v))
    if b not in dist: return None
    out = [b]
    while out[-1] != a: out.append(prev[out[-1]])
    return out[::-1]

def rdp(p, eps):
    if len(p) < 3: return p
    a, b = np.array(p[0]), np.array(p[-1]); ab = b - a; L = np.hypot(*ab)
    d = [abs(ab[0] * (q[1] - a[1]) - ab[1] * (q[0] - a[0])) / L if L else np.hypot(*(np.array(q) - a)) for q in p]
    i = int(np.argmax(d))
    if d[i] > eps: return rdp(p[:i + 1], eps)[:-1] + rdp(p[i:], eps)
    return [p[0], p[-1]]

def tracer(L, f, traits):
    # Une forme peut être tracée sur le dessin d'une autre : {"glyphe": "fin", "traits": [...]} (la forme isolée de د
    # reprend le dessin de sa forme de fin, pour que la lettre ait la même allure partout)
    if isinstance(traits, dict): f, traits = traits["glyphe"], traits["traits"]
    a, sq, pts = analyse(L, f); info = graphe(sq); xs, ys, idx = info
    def accroche(w):
        d = (xs - w[0]) ** 2 + (ys - w[1]) ** 2; i = int(d.argmin()); return i, float(np.sqrt(d[i]))
    sortie = []
    for tr in traits:
        if tr == "points":
            sortie += [[[round(x), round(y)]] for x, y in points_lettre(a, pts)]; continue
        if len(tr) == 1:   # un point de la lettre posé à la main (là où la police le place mal sur le tableau)
            sortie.append([list(tr[0])]); continue
        # Un jalon [x, y, 1] est « libre » : on y va tout droit, sans suivre le squelette (pour une forme que la police
        # remplit, comme la petite tête de ع au milieu, qu'une main écrit en boucle)
        acc = [accroche(w) for w in tr]; pix = []
        for n, ((u, _), (v, _)) in enumerate(zip(acc, acc[1:])):
            a0, b0 = tr[n], tr[n + 1]
            if len(a0) > 2 or len(b0) > 2:
                pa = tuple(a0[:2]) if len(a0) > 2 else (int(xs[u]), int(ys[u])); pb = tuple(b0[:2]) if len(b0) > 2 else (int(xs[v]), int(ys[v]))
                if not pix: pix.append(pa)
                pix.append(pb); continue
            c = chemin(info, u, v)
            if c is None: raise SystemExit(f"{L} {f} : pas de chemin entre {xs[u],ys[u]} et {xs[v],ys[v]}")
            pix += [(int(xs[k]), int(ys[k])) for k in (c if not pix else c[1:])]
        # Bouts : un jalon posé dans l'encre au-delà du squelette (bout arrondi d'un trait) prolonge le trait jusque-là
        if len(tr[0]) == 2 and acc[0][1] > 6 and a[int(tr[0][1]), int(tr[0][0])] > 100: pix.insert(0, tuple(tr[0]))
        if len(tr[-1]) == 2 and acc[-1][1] > 6 and a[int(tr[-1][1]), int(tr[-1][0])] > 100: pix.append(tuple(tr[-1]))
        sortie.append([[int(x), int(y)] for x, y in rdp(pix, 1.8)])
    return sortie

if __name__ == "__main__":
    import sys
    res = {}
    for L, fs in FORMES.items():
        for f, traits in fs.items():
            if len(sys.argv) > 1 and L not in sys.argv[1]: continue
            res.setdefault(L, {})[f] = tracer(L, f, traits)
    json.dump(res, open("chemins.json", "w"), ensure_ascii=False)
    print(sum(len(v) for v in res.values()), "formes")
