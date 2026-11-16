# Mufrad

Application pour apprendre et réviser le vocabulaire arabe, leçon par leçon, un peu chaque jour.
Elle suit le découpage d'un manuel d'arabe pour non-arabophones, afin de servir de support de révision
à ceux qui l'étudient avec un professeur.

**État : alpha 0.** L'alphabet et deux unités, des questions à choix, la révision espacée et la série de jours.
La progression et les enregistrements restent sur l'appareil de chacun. Le contenu arabe n'est pas
encore entièrement relu.

## Ce que fait l'application

- **Parcours** : une pastille par leçon, avec un anneau qui montre ce qui est acquis, en cours, à découvrir.
- **Apprendre** : chaque mot est présenté, interrogé aussitôt, puis réinterrogé dans l'autre sens.
- **Réviser** (depuis le parcours) : la révision du jour reprend ce qui est dû ; « Réviser au choix » ouvre un panneau
  où l'on coche une ou plusieurs leçons, pour enchaîner les questions jusqu'à tout réussir deux fois de suite.
- **Glossaire** : tous les mots, leçon par leçon, avec recherche, corrections et ajouts.
- **Voix** : chacun peut ajouter ses propres enregistrements ; ils remplacent alors la voix de l'appareil.
  La roue dentée en haut de l'onglet ouvre « Partage des voix » : l'accord, mes envois (publiés, en attente, refusés)
  et, pour les contributeurs, les recommandations à traiter, le suivi des voix et des lecteurs.
- **Versions d'essai** : chaque branche est publiée dans `essai/<nom>/`, avec sa propre progression. Elle lit la vraie base
  (voix, vocabulaire, connexion) mais n'y écrit jamais rien : envois, suppressions et validations y sont refusés.
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
| `confidentialite.html` | Mentions légales, conditions d'utilisation et confidentialité (à mettre à jour quand la collecte change) |
| `css/app.css` | Apparence |
| `js/contenu.js` | L'alphabet et ses formes |
| `js/unites/` | Un fichier par unité du manuel : la liste de ses mots |
| `js/assemblage.js` | Réunit l'alphabet et les unités |
| `docs/ajouter-une-unite.md` | Marche à suivre pour préparer et intégrer une nouvelle unité |
| `js/app.js` | Séances, révision espacée, écrans |
| `tests/simulation.js` | Test de bout en bout |
| `outils/decoupe_audio.py` | Découpe un enregistrement long en un fichier par lettre ou par mot (demande ffmpeg) |
| `outils/icones.py` | Fabrique les fichiers d'icône à partir d'une image carrée |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installation sur téléphone et fonctionnement hors ligne |
| `supabase/0001_schema_initial.sql` | Schéma de la base pour l'alpha 1 (comptes, synchronisation, voix partagées) |
| `supabase/0004_sauvegarde.sql` | Copie de la progression dans le compte, fusionnée entre appareils (bouton « Synchroniser avec mon compte ») |
| `supabase/0005_mesure_audience.sql` | Première mesure d'audience (remplacée et complétée par 0007) |
| `supabase/0007_statistiques.sql` | Statistiques d'usage : événements (identifiant d'appareil renouvelé chaque jour) et vues de calcul, réservées aux administrateurs |
| `supabase/0008_stats_ancien_systeme.sql` | Écarte des statistiques les événements de l'ancienne mesure (0005), qui gonflaient les visiteurs |
| `js/statistiques.js` | Écran « Statistiques » des administrateurs (Réglages → Statistiques d'usage, adresse `#statistiques`) |

## Installer l'application sur un téléphone

L'application s'installe depuis son adresse, sans passer par un magasin d'applications.

- **Android (Chrome)** : ouvrir l'adresse, puis menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
- **iPhone (Safari)** : ouvrir l'adresse, puis bouton Partager → « Sur l'écran d'accueil ».

Une fois installée, elle s'ouvre en plein écran et fonctionne sans réseau. Les mises à jour arrivent seules :
à chaque ouverture avec du réseau, l'application charge la dernière version en ligne.

## Changer l'icône

L'icône actuelle est le mot مفرد en calligraphie ruqʿa (police Aref Ruqaa, convertie en contours), crème sur
le bleu des cartes, avec le point du ف en or. Ses sources vectorielles sont dans `icons/` :
`mufrad.svg` (tuile arrondie), `mufrad-plein-cadre.svg` (fond plein bord, pour Android et iPhone qui découpent
eux-mêmes la forme) et `favicon.svg` (cadrage serré pour l'onglet du navigateur).

Pour la remplacer :

1. Préparer une image carrée d'au moins 512 pixels de côté.
2. `python outils/icones.py mon-icone.png` (demande `pip install pillow`) : les quatre fichiers de `icons/` sont remplacés.
3. Dans `sw.js`, augmenter le numéro de `CACHE` (par exemple `mufrad-v2`).
4. Envoyer les changements sur `main`. Sur un téléphone où l'application est déjà installée, l'icône de l'écran
   d'accueil ne change qu'après désinstallation puis réinstallation.

## Enregistrer les voix d'une leçon

1. Lire toute la leçon d'une traite, dans l'ordre de l'onglet « Voix », avec une seconde de silence entre deux mots.
2. Découper : `python outils/decoupe_audio.py lecon.wav --noms noms.txt --sortie lecon/`
   (`noms.txt` : un nom par ligne, autant que d'éléments dans la leçon).
3. Dans l'onglet « Voix », ajouter tous les fichiers de la leçon d'un coup, les écouter, rogner les bords si besoin, puis déposer.

## Suite prévue

Comptes et progression synchronisée, voix et corrections partagées avec trois niveaux
(utilisateur, contributeur, administrateur), puis écriture et prononciation avec retour correctif.
