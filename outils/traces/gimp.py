# Côté dépôt du pont avec GIMP (voir gimp_mufrad.py, qui tourne dans GIMP).
#   python3 outils/traces/gimp.py envoyer "م:milieu,ه:isolee"
#       → les appels mufrad_creer(...) à exécuter dans GIMP, avec les tracés actuels de js/tableau-lettres.js
#   python3 outils/traces/gimp.py retouches lu.json
#       → range ce qu'a renvoyé mufrad_lire() dans outils/traces/retouches.json ; ecrire.py l'applique ensuite
#         (les retouches faites à la main dans GIMP passent avant les tracés calculés depuis la police)
import json, os, subprocess, sys
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.join(ICI, "..", "..")

def traces_actuels():
    js = ("const fs=require('fs');const c=fs.readFileSync(process.argv[1],'utf8');"
          "const T=new Function(c+';return {TB_LETTRES,TB_FORMES}')();process.stdout.write(JSON.stringify(T));")
    return json.loads(subprocess.check_output(["node", "-e", js, os.path.join(RACINE, "js", "tableau-lettres.js")]))

if sys.argv[1] == "envoyer":
    T = traces_actuels()
    for x in sys.argv[2].split(","):
        L, f = x.split(":")
        traits = T["TB_LETTRES"][L] if f == "isolee" else T["TB_FORMES"][L][f]
        print(f"mufrad_creer({json.dumps(L, ensure_ascii=False)}, {json.dumps(f)}, {json.dumps(traits, separators=(',', ':'))})")
elif sys.argv[1] == "retouches":
    lu = json.load(open(sys.argv[2])); F = os.path.join(ICI, "retouches.json")
    ret = json.load(open(F)) if os.path.exists(F) else {}
    for r in lu: ret.setdefault(r["L"], {})[r["forme"]] = r["traits"]
    json.dump(ret, open(F, "w"), ensure_ascii=False, indent=1); print("retouches :", sum(len(v) for v in ret.values()), "formes")
