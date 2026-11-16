# Assemble la page de l'atelier des tracés : modèle + fichiers de l'application + script de l'atelier.
# python3 outils/atelier/construire.py  →  outils/atelier/atelier.html (page autonome, à ouvrir ou à publier)
import os
ICI = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(ICI, '..', '..', 'js')
p = open(os.path.join(ICI, 'modele.html')).read()
for cle, f in [('TB_LETTRES', os.path.join(R, 'tableau-lettres.js')), ('TABLEAU', os.path.join(R, 'tableau.js')), ('ATELIER', os.path.join(ICI, 'atelier.js'))]:
    t = open(f).read(); assert '</script' not in t
    p = p.replace('/*%s*/' % cle, t)
open(os.path.join(ICI, 'atelier.html'), 'w').write(p)
print(len(p))
