# Pont entre les tracés de Mufrad et GIMP, à exécuter DANS GIMP (par Pinceau : gimp_run_python, ou la console Python).
# Il définit deux fonctions, qui restent disponibles tant que GIMP est ouvert :
#
#   mufrad_creer(L, forme, traits) : ouvre une image 1000 × 600 (le repère du tableau) avec
#     - « Fond » : le papier et la ligne d'écriture (y = 396) ;
#     - « Modèle actuel » : la lettre telle qu'elle est aujourd'hui, écrite à la plume, en pâle (simple repère) ;
#     - un chemin par trait, nommé « 1 », « 2 »… dans l'ordre d'écriture ; un point de la lettre = un chemin d'un seul
#       point d'ancrage ; le premier point d'ancrage d'un chemin est le départ du trait ;
#     - des numéros posés au départ de chaque trait (calque « Numéros »).
#   On modifie les chemins avec l'outil Chemins (B) : déplacer les points et les poignées, en ajouter (Ctrl + clic sur le
#   tracé), en supprimer (Maj + Ctrl + clic). Pour changer l'ordre : renommer les chemins (« 1 », « 2 »… ; « 1.5 » passe
#   entre 1 et 2). Pour changer le sens d'un trait : ajouter « inverser » à son nom. Un nouveau chemin = un nouveau trait.
#
#   mufrad_lire() : relit toutes les images ouvertes par mufrad_creer et renvoie leurs traits (points simplifiés), à
#     recopier dans outils/traces/retouches.json (python3 outils/traces/gimp.py retouches <fichier>).
#
#   mufrad_tout_creer(dossier, adresse) : un fichier GIMP (.xcf) par lettre et par forme, rangés dans
#     dossier/1 isolée, 2 début, 3 milieu, 4 fin ; les tracés sont lus sur le site (adresse de js/tableau-lettres.js).
#     On ouvre un fichier, on modifie ses chemins, on enregistre (Ctrl + S), c'est tout.
#   mufrad_relire_dossier(dossier) : relit tous ces fichiers et renvoie leurs traits (même format que mufrad_lire).
#   mufrad_modifies(dossier) : relit seulement les fichiers enregistrés depuis leur création (les retouchés).
#   Dossier actuel de M. Boubaker : ~/Mufrad - tracés (créé le 16/11/2026, avec un LISEZ-MOI.txt).
import json, re, math

def _catmull(tr):
    # Points de contrôle de Bézier équivalents à l'arrondi du tableau (tbSpline : Catmull-Rom, bouts doublés)
    P = [tr[0]] + tr + [tr[-1]]; seg = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        seg.append((c1, c2, p2))
    return seg

def _echantillons(tr, n=8):
    # Points serrés le long du trait arrondi, pour le peindre
    if len(tr) < 2: return tr
    out = [tr[0]]
    for (c1, c2, p2), p1 in zip(_catmull(tr), tr):
        for k in range(1, n + 1):
            t = k / n; u = 1 - t
            out.append([u ** 3 * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p2[0],
                        u ** 3 * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p2[1]])
    return out

def mufrad_creer(L, forme, traits, plume=34, angle=60, afficher=True):
    img = Gimp.Image.new(1000, 600, Gimp.ImageBaseType.RGB)
    fond = Gimp.Layer.new(img, "Fond", 1000, 600, Gimp.ImageType.RGB_IMAGE, 100, Gimp.LayerMode.NORMAL)
    img.insert_layer(fond, None, 0)
    Gimp.context_set_background(color("#fffdf7")); fond.edit_fill(Gimp.FillType.BACKGROUND)
    # Ligne d'écriture
    Gimp.context_set_foreground(color("#ddd3bd"))
    img.select_rectangle(Gimp.ChannelOps.REPLACE, 12, 395, 976, 2); fond.edit_fill(Gimp.FillType.FOREGROUND); Gimp.Selection.none(img)
    # La lettre actuelle, à la plume, en pâle
    ref = Gimp.Layer.new(img, "Modèle actuel (repère)", 1000, 600, Gimp.ImageType.RGBA_IMAGE, 30, Gimp.LayerMode.NORMAL)
    img.insert_layer(ref, None, 0)
    Gimp.context_push()
    Gimp.context_set_brush(Gimp.Brush.get_by_name("2. Block 01")); Gimp.context_set_brush_size(float(plume))
    Gimp.context_set_brush_aspect_ratio(-16.0); Gimp.context_set_brush_angle(float(angle)); Gimp.context_set_foreground(color("#191c2c"))
    for tr in traits:
        pts = _echantillons(tr) if len(tr) > 1 else [tr[0], [tr[0][0] + 6, tr[0][1] + 6]]
        Gimp.paintbrush_default(ref, [float(v) for p in pts for v in p])
    Gimp.context_pop()
    # Un chemin par trait
    num = Gimp.Layer.new(img, "Numéros", 1000, 600, Gimp.ImageType.RGBA_IMAGE, 100, Gimp.LayerMode.NORMAL)
    img.insert_layer(num, None, 0)
    for n, tr in enumerate(traits):
        p = Gimp.Path.new(img, str(n + 1)); img.insert_path(p, None, n)
        s = p.bezier_stroke_new_moveto(float(tr[0][0]), float(tr[0][1]))
        for c1, c2, p2 in _catmull(tr) if len(tr) > 1 else []:
            p.bezier_stroke_cubicto(s, c1[0], c1[1], c2[0], c2[1], float(p2[0]), float(p2[1]))
        p.set_visible(True)
        # Numéro au départ du trait : une pastille dorée
        x, y = tr[0]
        Gimp.context_set_foreground(color("#c9962a"))
        img.select_ellipse(Gimp.ChannelOps.REPLACE, x - 9, y - 9, 18, 18); num.edit_fill(Gimp.FillType.FOREGROUND); Gimp.Selection.none(img)
        try:
            t = Gimp.TextLayer.new(img, str(n + 1), Gimp.Font.get_by_name("Sans-serif Bold"), 13.0, Gimp.Unit.pixel())
            img.insert_layer(t, None, 0); t.set_offsets(int(x - 4), int(y - 9)); t.set_color(color("#ffffff"))
            t.set_name("n° " + str(n + 1))
        except Exception:
            pass
    img.attach_parasite(Gimp.Parasite.new("mufrad-trace", 1, list(json.dumps({"L": L, "forme": forme}).encode())))
    try: img.set_file(Gio.File.new_for_path(GLib.get_home_dir() + "/Mufrad " + L + " " + forme + ".xcf"))
    except Exception: pass
    if not afficher: return img
    Gimp.Display.new(img); Gimp.displays_flush()
    return img.get_id()

def _rdp(p, eps):
    if len(p) < 3: return p
    ax, ay = p[0]; bx, by = p[-1]; L = math.hypot(bx - ax, by - ay); best, imax = -1, 0
    for i, (x, y) in enumerate(p):
        d = abs((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / L if L else math.hypot(x - ax, y - ay)
        if d > best: best, imax = d, i
    if best > eps: return _rdp(p[:imax + 1], eps)[:-1] + _rdp(p[imax:], eps)
    return [p[0], p[-1]]

def _traits_image(img):
    # Les traits d'une image de tracé : chemins rangés par leur numéro, chaque chemin suivi du premier au dernier point
    par = img.get_parasite("mufrad-trace")
    if not par: return None
    info = json.loads(bytes(par.get_data()).decode())
    def rang(p):
        m = re.match(r"\s*(\d+(?:[.,]\d+)?)", p.get_name()); return float(m.group(1).replace(",", ".")) if m else 999
    traits = []
    for p in sorted(img.get_paths(), key=rang):
        for s in p.get_strokes():
            typ, cps, closed = p.stroke_get_points(s)
            if len(cps) <= 6:
                traits.append([[round(cps[2]), round(cps[3])]]); continue
            coords, _ = p.stroke_interpolate(s, 1.0)
            pts = [[coords[i], coords[i + 1]] for i in range(0, len(coords), 2)]
            if "inverser" in p.get_name(): pts.reverse()
            traits.append([[round(x), round(y)] for x, y in _rdp(pts, 1.2)])
    return {"L": info["L"], "forme": info["forme"], "traits": traits}

def mufrad_lire():
    return [t for t in (_traits_image(img) for img in Gimp.get_images()) if t]

# Ordre et noms des lettres (comme dans l'application) ; dossiers des formes
_LETTRES = [("ا", "alif"), ("ب", "baa"), ("ت", "taa"), ("ث", "thaa"), ("ج", "jim"), ("ح", "haa (ح)"), ("خ", "khaa"), ("د", "dal"),
    ("ذ", "dhal"), ("ر", "raa"), ("ز", "zay"), ("س", "sin"), ("ش", "shin"), ("ص", "sad"), ("ض", "dad"), ("ط", "taa (ط)"), ("ظ", "dhaa (ظ)"),
    ("ع", "ayn"), ("غ", "ghayn"), ("ف", "faa"), ("ق", "qaf"), ("ك", "kaf"), ("ل", "lam"), ("م", "mim"), ("ن", "nun"), ("ه", "haa (ه)"),
    ("و", "waw"), ("ي", "yaa")]
_DOSSIERS = {"isolee": "1 isolée", "debut": "2 début", "milieu": "3 milieu", "fin": "4 fin"}

def _donnees(adresse):
    # Lit js/tableau-lettres.js sur le site et en tire TB_LETTRES et TB_FORMES (objets JavaScript → JSON)
    import urllib.request
    js = urllib.request.urlopen(adresse).read().decode("utf-8")
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
    def bloc(nom):
        a = js.index("const " + nom + " = ") + len("const " + nom + " = "); b = js.index("};", a) + 1
        return json.loads(re.sub(r"(\b(?:debut|milieu|fin)\b):", r'"\1":', js[a:b]))
    return bloc("TB_LETTRES"), bloc("TB_FORMES")

def mufrad_tout_creer(dossier, adresse):
    import os
    TL, TF = _donnees(adresse); faits = []
    for n, (L, nom) in enumerate(_LETTRES, 1):
        formes = {"isolee": TL.get(L), **(TF.get(L) or {})}
        for f, traits in formes.items():
            if not traits: continue
            rep = os.path.join(dossier, _DOSSIERS[f]); os.makedirs(rep, exist_ok=True)
            chemin = os.path.join(rep, "%02d %s %s.xcf" % (n, nom, L))
            img = mufrad_creer(L, f, traits, afficher=False)
            img.set_file(Gio.File.new_for_path(chemin))
            Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, img, Gio.File.new_for_path(chemin), None)
            img.delete(); faits.append(chemin)
    import time
    open(os.path.join(dossier, ".cree_le"), "w").write(str(time.time()))   # pour reconnaître ensuite les fichiers retouchés
    open(os.path.join(dossier, "LISEZ-MOI.txt"), "w", encoding="utf-8").write(LISEZ_MOI)
    return faits

def mufrad_relire_dossier(dossier):
    import os
    out = []
    for f in _DOSSIERS.values():
        rep = os.path.join(dossier, f)
        if not os.path.isdir(rep): continue
        for nomf in sorted(os.listdir(rep)):
            if not nomf.endswith(".xcf"): continue
            img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, Gio.File.new_for_path(os.path.join(rep, nomf)))
            t = _traits_image(img); img.delete()
            if t: out.append(t)
    return out

def mufrad_modifies(dossier):
    # Les fichiers enregistrés après leur création (donc retouchés), relus ; la date de création est dans « .cree_le »
    import os
    cree = float(open(os.path.join(dossier, ".cree_le")).read())
    out = []
    for f in _DOSSIERS.values():
        rep = os.path.join(dossier, f)
        if not os.path.isdir(rep): continue
        for nomf in sorted(os.listdir(rep)):
            ch = os.path.join(rep, nomf)
            if not nomf.endswith(".xcf") or os.path.getmtime(ch) <= cree + 5: continue
            img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, Gio.File.new_for_path(ch))
            t = _traits_image(img); img.delete()
            if t: t["fichier"] = os.path.join(f, nomf); out.append(t)
    return out

LISEZ_MOI = """Mufrad – tracés des lettres (un fichier GIMP par lettre et par forme)

Dossiers : 1 isolée, 2 début, 3 milieu, 4 fin. Le numéro du fichier suit l'ordre de l'alphabet de l'application.
Chaque fichier est le tableau de l'application (1000 × 600 ; la ligne d'écriture est le trait beige, à 396).

Dans chaque fichier :
- un chemin par trait, nommé 1, 2, 3… dans l'ordre d'écriture (fenêtre Chemins : Fenêtres > Fenêtres ancrables > Chemins,
  cliquer l'œil pour le voir). Le premier point d'un chemin est le départ du trait. Un point de la lettre = un chemin
  d'un seul point ;
- le calque « Modèle actuel » : la lettre telle qu'elle est aujourd'hui, en pâle, comme repère (il ne bouge pas quand on
  modifie les chemins) ;
- le calque « Numéros » : la pastille au départ de chaque trait.

Pour corriger, avec l'outil Chemins (touche B), en mode Édition :
- déplacer un point ou une poignée : le glisser ;
- ajouter un point : Ctrl + clic sur le tracé ; en retirer un : Maj + Ctrl + clic sur le point ;
- changer l'ordre des traits : renommer les chemins (« 1.5 » se place entre 1 et 2) ;
- changer le sens d'un trait : ajouter le mot « inverser » à son nom ;
- ajouter un trait : un nouveau chemin, nommé par son numéro ; en enlever un : supprimer le chemin.
Puis enregistrer (Ctrl + S), en gardant le format .xcf.

Ensuite, dire à Claude « relis le dossier des tracés » : il relit seulement les fichiers enregistrés depuis leur création,
montre l'avant / après et l'animation, et met les tracés dans l'application (sur une branche d'essai, jamais directement).
"""
