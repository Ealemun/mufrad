# Mufrad

Application pour apprendre et réviser le vocabulaire arabe, leçon par leçon, un peu chaque jour.
Elle suit le découpage d'un manuel d'arabe pour non-arabophones, afin de servir de support de révision
à ceux qui l'étudient avec un professeur.

**État : alpha 0.** Deux unités, des questions à choix, la révision espacée et la série de jours.
La progression et les enregistrements restent sur l'appareil de chacun. Le contenu arabe n'est pas
encore entièrement relu.

## Ce que fait l'application

- **Parcours** : une pastille par leçon, avec un anneau qui montre ce qui est acquis, en cours, à découvrir.
- **Apprendre** : chaque mot est présenté, interrogé aussitôt, puis réinterrogé dans l'autre sens.
- **Réviser** : la révision du jour reprend ce qui est dû ; on peut aussi choisir une ou plusieurs leçons
  et enchaîner les questions jusqu'à tout réussir deux fois de suite.
- **Voix** : chacun peut ajouter ses propres enregistrements ; ils remplacent alors la voix de l'appareil.
- **Révision espacée** : algorithme FSRS-4.5, calculé dans le navigateur.

## Lancer l'application chez soi

Aucune installation. Depuis le dossier du dépôt :

```
python -m http.server 8000
```

puis ouvrir `http://localhost:8000`.

## Tester

```
node tests/simulation.js
```

Le test joue une leçon, une révision avec une erreur et plusieurs révisions du jour, sans navigateur.

## Organisation du dépôt

| Chemin | Contenu |
| --- | --- |
| `index.html` | Structure de la page |
| `css/app.css` | Apparence |
| `js/contenu.js` | Lettres et mots, dans l'ordre du manuel |
| `js/app.js` | Séances, révision espacée, écrans |
| `tests/simulation.js` | Test de bout en bout |
| `outils/decoupe_audio.py` | Découpe un enregistrement long en un fichier par lettre ou par mot (demande ffmpeg) |
| `supabase/0001_schema_initial.sql` | Schéma de la base pour l'alpha 1 (comptes, synchronisation, voix partagées) |

## Enregistrer les voix d'une leçon

1. Lire toute la leçon d'une traite, dans l'ordre de l'onglet « Voix », avec une seconde de silence entre deux mots.
2. Découper : `python outils/decoupe_audio.py lecon.wav --noms noms.txt --sortie lecon/`
   (`noms.txt` : un nom par ligne, autant que d'éléments dans la leçon).
3. Dans l'onglet « Voix », ajouter tous les fichiers de la leçon d'un coup.

## Suite prévue

Comptes et progression synchronisée, voix et corrections partagées avec trois niveaux
(utilisateur, contributeur, administrateur), puis écriture et prononciation avec retour correctif.
