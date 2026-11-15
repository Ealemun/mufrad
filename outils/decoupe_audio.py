#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Découpe un long enregistrement (quelqu'un lit l'alphabet, ou une liste de mots)
en un fichier audio par élément, en coupant sur les silences.

Dépendance : ffmpeg installé et accessible dans le PATH. Aucune bibliothèque Python à installer.

Exemples :
    # Alphabet complet : 28 lettres, fichiers nommés 01_alif.mp3, 02_ba.mp3, ...
    python decoupe_audio.py alphabet.wav --sortie lettres/

    # Liste de mots : un nom de fichier par ligne dans noms.txt, dans l'ordre de lecture
    python decoupe_audio.py unite1.wav --noms noms.txt --sortie mots/

Si le nombre de morceaux trouvés ne correspond pas au nombre de noms, rien n'est écrit :
le script affiche ce qu'il a trouvé et indique quel réglage changer.
"""
import argparse
import array
import math
import os
import subprocess
import sys

# Noms par défaut : les 28 lettres dans l'ordre alphabétique habituel
ALPHABET = ["alif", "ba", "ta", "tha", "jim", "ha", "kha", "dal", "dhal", "ra", "zay", "sin", "shin", "sad",
            "dad", "ta_emph", "za_emph", "ayn", "ghayn", "fa", "qaf", "kaf", "lam", "mim", "nun", "ha_fin", "waw", "ya"]

FREQ = 16000   # fréquence d'analyse (Hz) : suffisante pour repérer la voix
PAS_MS = 10    # taille d'une fenêtre d'analyse, en millisecondes


def lire_pcm(chemin):
    """Décode n'importe quel format audio en échantillons mono 16 bits, grâce à ffmpeg."""
    cmd = ["ffmpeg", "-v", "error", "-i", chemin, "-ac", "1", "-ar", str(FREQ), "-f", "s16le", "-"]
    brut = subprocess.run(cmd, capture_output=True, check=True).stdout
    ech = array.array("h")
    ech.frombytes(brut[: len(brut) // 2 * 2])
    return ech


def niveaux(ech):
    """Renvoie le niveau sonore (en dB) de chaque fenêtre de PAS_MS millisecondes."""
    n = FREQ * PAS_MS // 1000
    res = []
    for i in range(0, len(ech) - n + 1, n):
        bloc = ech[i:i + n]
        rms = math.sqrt(sum(x * x for x in bloc) / n)
        res.append(20 * math.log10(max(rms, 1.0) / 32768.0))
    return res


def segments(db, seuil_db, silence_ms, duree_min_ms):
    """Repère les passages parlés : suites de fenêtres au-dessus du seuil,
    séparées par au moins `silence_ms` de silence."""
    trou_max = silence_ms // PAS_MS      # un creux plus court que cela ne coupe pas le morceau
    segs, debut, dernier_son = [], None, None
    for i, v in enumerate(db):
        if v > seuil_db:
            if debut is None:
                debut = i
            dernier_son = i
        elif debut is not None and i - dernier_son > trou_max:
            segs.append((debut, dernier_son + 1))
            debut = None
    if debut is not None:
        segs.append((debut, dernier_son + 1))
    # On écarte les bruits trop courts pour être une lettre ou un mot (clic, souffle)
    return [(a * PAS_MS, b * PAS_MS) for a, b in segs if (b - a) * PAS_MS >= duree_min_ms]


def main():
    p = argparse.ArgumentParser(description="Découpe un enregistrement en un fichier par élément, sur les silences.")
    p.add_argument("audio", help="enregistrement source (wav, mp3, m4a, ogg...)")
    p.add_argument("--noms", help="fichier texte : un nom de fichier par ligne, dans l'ordre de lecture (défaut : les 28 lettres)")
    p.add_argument("--sortie", default="decoupe", help="dossier où écrire les fichiers (défaut : decoupe/)")
    p.add_argument("--silence", type=int, default=350, help="silence minimal entre deux éléments, en ms (défaut : 350)")
    p.add_argument("--marge", type=float, default=30.0, help="écart en dB sous le niveau le plus fort en dessous duquel on considère du silence (défaut : 30)")
    p.add_argument("--duree-min", type=int, default=120, help="durée minimale d'un élément, en ms (défaut : 120)")
    p.add_argument("--rembourrage", type=int, default=80, help="silence gardé avant et après chaque élément, en ms (défaut : 80)")
    p.add_argument("--format", default="mp3", choices=["mp3", "ogg", "wav"], help="format des fichiers produits")
    a = p.parse_args()

    if a.noms:
        with open(a.noms, encoding="utf-8") as f:
            noms = [l.strip() for l in f if l.strip()]
    else:
        noms = ALPHABET

    ech = lire_pcm(a.audio)
    db = niveaux(ech)
    if not db:
        sys.exit("Enregistrement vide ou illisible.")
    seuil = max(db) - a.marge                      # seuil relatif : s'adapte au volume de l'enregistrement
    segs = segments(db, seuil, a.silence, a.duree_min)

    print(f"{len(segs)} morceaux trouvés pour {len(noms)} noms attendus.")
    for k, (d, f_) in enumerate(segs, 1):
        print(f"  {k:>3}  {d / 1000:7.2f} s -> {f_ / 1000:7.2f} s   ({f_ - d} ms)")

    if len(segs) != len(noms):
        # On n'écrit rien : des fichiers mal nommés seraient pires que pas de fichiers
        if len(segs) > len(noms):
            print("\nTrop de morceaux : un élément a été coupé en deux, ou un bruit a été pris pour un élément.")
            print("Essayez --silence plus grand (ex. 500), --duree-min plus grand (ex. 200) ou --marge plus petite (ex. 25).")
        else:
            print("\nPas assez de morceaux : deux éléments se sont collés.")
            print("Essayez --silence plus petit (ex. 200) ou --marge plus grande (ex. 35).")
        sys.exit(1)

    os.makedirs(a.sortie, exist_ok=True)
    duree_totale = len(ech) / FREQ
    for k, ((d, f_), nom) in enumerate(zip(segs, noms), 1):
        t0 = max(0.0, (d - a.rembourrage) / 1000)
        t1 = min(duree_totale, (f_ + a.rembourrage) / 1000)
        cible = os.path.join(a.sortie, f"{k:02d}_{nom}.{a.format}")
        # On recoupe dans le fichier d'origine pour garder sa qualité ; volume normalisé pour des niveaux homogènes
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.audio, "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}",
               "-ac", "1", "-af", "loudnorm=I=-18:TP=-2", cible]
        subprocess.run(cmd, check=True)
    print(f"\n{len(segs)} fichiers écrits dans {a.sortie}/ — à écouter un par un avant de les utiliser.")


if __name__ == "__main__":
    main()
