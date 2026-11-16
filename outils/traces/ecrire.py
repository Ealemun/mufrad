# Recopie chemins.json (sortie de tracer.py) dans js/tableau-lettres.js, à la place de l'objet TB_FORMES.
# À lancer depuis outils/traces/travail : python3 ../ecrire.py
import json, os, re
ICI = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(ICI, '..', '..', 'js', 'tableau-lettres.js')
ch = json.load(open('chemins.json'))
ordre = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split()
lignes = []
for L in ordre:
    if L not in ch: continue
    parts = [f'{f}: ' + json.dumps(ch[L][f], separators=(",", ":")) for f in ["debut", "milieu", "fin"] if f in ch[L]]
    lignes.append(f'  "{L}": {{ ' + ", ".join(parts) + ' }')
s = open(F).read()
s = re.sub(r'const TB_FORMES = \{\n.*?\n\};\n', 'const TB_FORMES = {\n' + ",\n".join(lignes) + '\n};\n', s, flags=re.S)
open(F, 'w').write(s); print("TB_FORMES réécrit :", len(lignes), "lettres")
