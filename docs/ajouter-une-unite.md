# Ajouter une unité

Cette page décrit comment préparer le vocabulaire d'une nouvelle unité du manuel et l'intégrer à l'application.
Une unité = un fichier dans `js/unites/` + une ligne dans `index.html`. Rien d'autre n'est à modifier.

## Ce qu'on reprend du manuel, et ce qu'on ne reprend pas

On reprend **uniquement** : le numéro et le thème de l'unité, les numéros de ses leçons, et la liste des mots
présentés dans les pages de vocabulaire.

On ne reprend **jamais** : les dialogues, les textes de lecture, les exercices, les illustrations, les enregistrements.
Les titres de leçon affichés dans l'application sont des titres courts rédigés par nous, en français.

## Repères dans le manuel (livre de l'élève 1, partie 1 : unités 1 à 8)

- Les leçons sont numérotées en continu : l'unité N couvre les leçons 9(N−1)+1 à 9N (unité 1 : 1 à 9, unité 2 : 10 à 18, unité 3 : 19 à 27…).
- Dans une unité, les trois premières leçons ont chacune une page de dialogue suivie d'une page de vocabulaire illustré
  (titre de page contenant « المفردات »). La quatrième contient un encadré de vocabulaire complémentaire.
  Les suivantes portent sur la grammaire, les sons, la lecture ; la dernière sur l'écriture.
- Dans le scan en ligne, la page de titre de l'unité 1 est le feuillet 22, celle de l'unité 2 le feuillet 48.
  Une unité occupe environ 26 feuillets ; des pages de test s'intercalent après certaines unités.
  Il faut donc repérer la page de titre de l'unité voulue avant de lire.

## Lire les pages

Le texte extrait automatiquement du scan est inutilisable : il faut lire les images des pages, une par une.
Chaque mot est transcrit **avec toutes ses voyelles**, exactement comme imprimé. En cas de doute sur une voyelle,
on le note dans le champ `note` (« voyelle à vérifier ») plutôt que de deviner.

À relever pour chaque unité :

1. les mots des trois pages de vocabulaire illustré ;
2. le vocabulaire complémentaire de la quatrième leçon ;
3. les mots courants des dialogues absents des pages de vocabulaire (mots-outils, formules), avec `note: "relevé dans le dialogue"` ;
4. pour un nom donné au masculin, la forme féminine si elle figure dans l'unité, dans le champ `note`.

## Écrire le fichier de l'unité

Créer `js/unites/unite-0N.js` sur le modèle de `js/unites/unite-02.js` :

```js
"use strict";
/* Mufrad — unité N : thème en français. (leçons lues, leçons restant à lire) */
UNITES.push({
  n: N,
  ar: "titre de l'unité en arabe, vocalisé",
  fr: "Thème en français",
  relu: false,
  lecons: [[19, "Titre court en français"], [20, "…"], [21, "…"], [22, "…"]],
  mots: [
    { id: "uN-01", l: 19, ar: "…", tr: "…", fr: "…", note: "" },
    { id: "uN-02", l: 19, ar: "…", tr: "…", fr: "…", note: "" }
  ]
});
```

Règles :

- `id` : `uN-01`, `uN-02`… dans l'ordre. Un identifiant ne change jamais et n'est jamais réutilisé :
  la progression des apprenants est rangée par identifiant.
- `l` : numéro de la leçon du manuel où le mot est présenté. Chaque leçon listée dans `lecons` doit avoir au moins trois mots.
- `ar` : le mot vocalisé. `tr` : translittération (ā ī ū, ḥ ṣ ḍ ṭ ẓ, ʿ pour ع, ʾ pour la hamza, th dh kh sh gh).
- `fr` : traduction courte. Deux mots de l'application ne doivent pas avoir exactement la même traduction :
  préciser entre parenthèses (« (à un homme) », « (registre soutenu) »).
- Écrire « Allah », jamais « Dieu ».
- Une leçon sans page de vocabulaire (grammaire, sons, écriture) n'apparaît pas dans `lecons`.
- `relu` reste à `false` : seul un relecteur arabophone le passe à `true`.

Puis ajouter la ligne du fichier dans `index.html`, à la suite des autres unités et avant `js/assemblage.js` :

```html
<script src="js/unites/unite-0N.js"></script>
```

## Vérifier

```
node tests/simulation.js
```

Le test refuse : un identifiant en double, un mot incomplet, un mot rattaché à une leçon absente, un numéro de leçon
utilisé deux fois, un fichier d'unité oublié dans `index.html`, deux traductions identiques qui rendraient une question ambiguë.

## Envoyer

- Travailler sur une branche `unite-N`, par petits commits au nom du dépôt (pas de nom réel, aucune mention d'outil).
- Avant d'envoyer : `git fetch origin main` puis `git rebase origin/main`, et relancer le test.
- La mise en ligne est automatique dès que la branche est fusionnée dans `main`.

## Extrait utile pour lire le scan dans un navigateur

Sur la page du livre ouverte dans le lecteur en ligne, ce code affiche le feuillet `i` en plein écran, sans recharger la page :

```js
let ov = document.getElementById("cl-ov");
if (!ov) { ov = document.createElement("div"); ov.id = "cl-ov"; ov.style.cssText = "position:fixed;inset:0;z-index:999999;background:#fff;overflow:hidden"; document.body.appendChild(ov); }
window.clPage = i => new Promise(res => {
  ov.innerHTML = "";
  const im = new Image(); im.style.cssText = "height:100vh;display:block;margin:0 auto";
  const done = () => setTimeout(() => res(i), 250);
  im.onload = done; im.onerror = done;
  im.src = window.br.book.getPageURI(i, 1, 0); ov.appendChild(im);
});
```
