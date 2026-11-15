"use strict";
/* Mufrad — assemblage du contenu, chargé après tous les fichiers d'unité et avant l'application.
   Réunit l'alphabet et les unités inscrites, et prépare les index dont l'application se sert. */

UNITES.sort((a, b) => a.n - b.n); // l'ordre des fichiers dans la page n'a pas d'importance

// Tous les mots, chacun rattaché à son unité
const WORDS = UNITES.flatMap(u => u.mots.map(m => ({ note: "", ...m, u: u.n, type: "word" })));

// Découpage affiché dans le parcours : l'alphabet d'abord, puis les unités du manuel
// (les numéros de leçon se suivent d'une unité à l'autre, comme dans le livre).
const UNITS = [
  { n: 0, ar: "الحُروف", fr: "L'alphabet", relu: false,
    lessons: [[101, "ا ب ت ث"], [102, "ج ح خ"], [103, "د ذ ر ز"], [104, "س ش ص ض"], [105, "ط ظ ع غ"], [106, "ف ق ك ل"], [107, "م ن ه و ي"]] },
  ...UNITES.map(u => ({ n: u.n, ar: u.ar, fr: u.fr, relu: Boolean(u.relu), lessons: u.lecons }))
];
// Les groupes de l'alphabet portent les numéros 101 à 107 en interne et s'affichent « A1 » à « A7 »
const isAlpha = l => l > 100;
const lessonShort = l => isAlpha(l) ? "A" + (l - 100) : String(l);
const unitName = u => u.n === 0 ? "Pour commencer" : "Unité " + u.n;
const LESSON_TITLE = Object.fromEntries(UNITS.flatMap(u => u.lessons));
const lessonLabel = l => (isAlpha(l) ? "Alphabet " + (l - 100) : "Leçon " + l) + " · " + LESSON_TITLE[l];

// Nom arabe de chaque lettre, lu par la voix quand aucun enregistrement n'existe encore
const NAME_AR = Object.fromEntries(LETTERS.map(l => [l.id, l.nameAr]));

const ITEMS = [...LETTERS, ...WORDS];
const itemsOf = l => ITEMS.filter(it => it.l === l);


const BY_ID = Object.fromEntries(ITEMS.map(it => [it.id, it]));

// Réglages de rythme
const GOALS = { 5: 15, 10: 30, 15: 45 }; // objectif en minutes -> nombre maximal de révisions par séance
const NEW_LETTERS = 2;                   // lettres nouvelles par jour
const NEW_WORDS = 6;                     // mots nouveaux par jour

