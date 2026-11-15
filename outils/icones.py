#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fabrique les quatre fichiers d'icône de l'application à partir d'une seule image carrée.

Dépendance : Pillow (pip install pillow).

Exemple :
    python outils/icones.py mon-icone.png
    python outils/icones.py mon-icone.png --fond "#1f3d7a"

L'image source doit être carrée et faire au moins 512 pixels de côté.
Les fichiers sont écrits dans icons/ avec les noms attendus par l'application.
"""
import argparse
import os
import sys

from PIL import Image


def main():
    p = argparse.ArgumentParser(description="Fabrique les icônes de l'application à partir d'une image carrée.")
    p.add_argument("source", help="image carrée d'au moins 512 pixels de côté (PNG de préférence)")
    p.add_argument("--fond", default="#1f3d7a", help="couleur de fond des icônes plein cadre (défaut : le bleu de l'application)")
    p.add_argument("--sortie", default=os.path.join(os.path.dirname(__file__), "..", "icons"), help="dossier de sortie")
    a = p.parse_args()

    im = Image.open(a.source).convert("RGBA")
    if im.width != im.height:
        sys.exit(f"L'image doit être carrée (ici {im.width} x {im.height}).")
    if im.width < 512:
        sys.exit(f"L'image doit faire au moins 512 pixels de côté (ici {im.width}).")
    os.makedirs(a.sortie, exist_ok=True)

    # Icônes ordinaires : l'image telle quelle, réduite
    for taille in (192, 512):
        im.resize((taille, taille), Image.LANCZOS).save(os.path.join(a.sortie, f"icone-{taille}.png"))

    def plein_cadre(taille, part):
        """Pose l'image au centre d'un fond uni. Android et iOS rognent les bords (rond, coins arrondis) :
        l'image n'occupe donc que `part` du côté, pour que rien d'important ne soit coupé."""
        fond = Image.new("RGBA", (taille, taille), a.fond)
        c = int(taille * part)
        petit = im.resize((c, c), Image.LANCZOS)
        fond.alpha_composite(petit, ((taille - c) // 2, (taille - c) // 2))
        return fond

    plein_cadre(512, 0.8).save(os.path.join(a.sortie, "icone-masque-512.png"))            # Android, icône adaptative
    plein_cadre(180, 0.9).convert("RGB").save(os.path.join(a.sortie, "icone-apple-180.png"))  # iPhone, sans transparence
    print("Icônes écrites dans", os.path.normpath(a.sortie))
    print("Pensez à augmenter le numéro de version dans sw.js (CACHE) pour que les téléphones prennent la nouvelle icône.")


if __name__ == "__main__":
    main()
