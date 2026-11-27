"use strict";
/* Mufrad — makhārij al-ḥurūf : l'endroit d'où sort chaque lettre, montré sur une coupe de profil de la bouche et de la gorge.
   Chargé avant l'application ; il n'utilise ses outils (esc, AR) qu'à l'intérieur de ses fonctions.

   Découpage suivi : celui d'Ibn al-Jazarī dans al-Muqaddima al-Jazariyya, dix-sept makhārij répartis en cinq zones
   (الجَوْف، الحَلْق، اللِّسان، الشَّفَتان، الخَيْشوم).
   Les schémas et la description de chaque endroit viennent du livre « التجويد المصوَّر » (at-Tajwīd al-Muṣawwar),
   chapitre « مخارج الحروف العربية », pages 93 à 123 ; le responsable du projet a donné son accord pour les utiliser.
   Les images sont dans sources/makharij/, une par lettre ou par groupe de lettres dessinées ensemble dans le livre.
   Elles sont prises à la résolution du livre (640 px de large). Le nom de la lettre imprimé dans chaque schéma en a été
   effacé : l'application le réécrit en vrai texte, dans sa police, pour qu'il reste net à toute taille.
   À VÉRIFIER PAR UN ENSEIGNANT DE TAJWĪD : la traduction française des descriptions.

   Un makhraj = { id, zone, ar (nom arabe de l'endroit), fr (explication courte), lettres (dans l'ordre de l'alphabet) }.
   Un identifiant ne change jamais : il pourra servir de carte de révision plus tard. */

const MAKHARIJ = [
  // الجَوْف : aucune partie de la bouche ne se touche, le son s'allonge dans le vide
  { id: "jawf", zone: "jawf", ar: "الجَوْف", fr: "le vide de la gorge et de la bouche : le son s'allonge sans rien toucher", lettres: ["ا"] },
  // الحَلْق : trois endroits, du plus profond au plus proche de la bouche
  { id: "halq-aqsa", zone: "halq", ar: "أَقْصى الحَلْق", fr: "le fond de la gorge, là où sont les cordes vocales", lettres: ["ء", "ه"] },
  { id: "halq-wasat", zone: "halq", ar: "وَسَط الحَلْق", fr: "le milieu de la gorge", lettres: ["ح", "ع"] },
  { id: "halq-adna", zone: "halq", ar: "أَدْنى الحَلْق", fr: "le haut de la gorge : la racine de la langue contre le palais mou", lettres: ["خ", "غ"] },
  // اللِّسان : dix endroits, du fond de la langue jusqu'à son bout
  { id: "lisan-qaf", zone: "lisan", ar: "أَقْصى اللِّسان", fr: "le fond de la langue, contre le palais mou", lettres: ["ق"] },
  { id: "lisan-kaf", zone: "lisan", ar: "أَقْصى اللِّسان", fr: "le fond de la langue, un peu plus vers l'avant, contre le palais mou et le palais dur", lettres: ["ك"] },
  { id: "lisan-wasat", zone: "lisan", ar: "وَسَط اللِّسان", fr: "le milieu de la langue, contre le milieu du palais", lettres: ["ج", "ش", "ي"] },
  { id: "lisan-hafa", zone: "lisan", ar: "حافَة اللِّسان", fr: "le bord de la langue, contre les molaires du haut", lettres: ["ض"] },
  { id: "lisan-lam", zone: "lisan", ar: "أَدْنى حافَة اللِّسان", fr: "de l'avant des bords de la langue jusqu'à son bout, contre la gencive du haut", lettres: ["ل"] },
  { id: "lisan-nun", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre la gencive du haut, un peu sous l'endroit du ل ; le son passe aussi par le nez", lettres: ["ن"] },
  { id: "lisan-ra", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre la gencive du haut, tout près de l'endroit du ن", lettres: ["ر"] },
  { id: "lisan-ta", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre la racine des dents de devant du haut", lettres: ["ت", "د", "ط"] },
  { id: "lisan-sin", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre le bas des dents de devant du bas ; le son passe entre les dents du haut et du bas", lettres: ["ز", "س", "ص"] },
  { id: "lisan-tha", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre le bord des dents de devant du haut", lettres: ["ث", "ذ", "ظ"] },
  // الشَّفَتان : deux endroits
  { id: "shafa-fa", zone: "shafatan", ar: "الشَّفَة السُّفْلى", fr: "l'intérieur de la lèvre du bas, contre le bord des dents de devant du haut", lettres: ["ف"] },
  { id: "shafatan", zone: "shafatan", ar: "الشَّفَتان", fr: "les deux lèvres : fermées pour ب et م, arrondies vers l'avant pour و", lettres: ["ب", "م", "و"] },
  // الخَيْشوم : aucune lettre n'en sort, c'est le son nasal qui accompagne ن et م
  { id: "khayshum", zone: "khayshum", ar: "الخَيْشوم", fr: "le nez : le son nasal qui accompagne ن et م", lettres: [] }
];

// Image du livre pour chaque lettre (fichier de sources/makharij/, sans son extension).
// Le livre dessine ensemble د et ت, س et ز, ذ et ث ; la hamza et le ه partagent le dessin du fond de la gorge.
const MAKHRAJ_IMAGE = {
  "ا": "alif-madd", "ب": "ba", "ت": "dal-ta", "ث": "dhal-tha", "ج": "jim", "ح": "hha", "خ": "kha", "د": "dal-ta", "ذ": "dhal-tha",
  "ر": "ra", "ز": "sin-zay", "س": "sin-zay", "ش": "shin", "ص": "sad", "ض": "dad", "ط": "tta", "ظ": "zza", "ع": "ayn", "غ": "ghayn",
  "ف": "fa", "ق": "qaf", "ك": "kaf", "ل": "lam", "م": "mim", "ن": "nun", "ه": "hamza-ha", "و": "waw", "ي": "ya"
};
// Deux lettres ont un second makhraj quand elles ne font qu'allonger une voyelle : le جَوْف, avec son propre dessin
const MAKHRAJ_MADD = { "و": "waw-madd", "ي": "ya-madd" };

const makhrajById = id => MAKHARIJ.find(m => m.id === id);
// Makhraj d'une lettre donnée par son caractère (ا ب ت…)
const makhrajOf = ar => MAKHARIJ.find(m => m.lettres.includes(ar));
// Le dessin : toujours sur fond blanc, comme dans le livre, quel que soit le thème.
// legende : le nom de la lettre, écrit par-dessus le coin blanc du schéma où le livre l'imprimait.
const makhrajImg = (nom, alt, legende) => `<span class="mk"><img src="sources/makharij/${nom}.webp" alt="${esc(alt)}" loading="lazy">${legende ? `<span class="mk-nom">${AR(legende)}</span>` : ""}</span>`;

// Encadré de la fiche d'une lettre : le dessin, le nom arabe de l'endroit, son explication, et les lettres voisines
function makhrajHtml(it) {
  const m = makhrajOf(it.ar), nom = MAKHRAJ_IMAGE[it.ar];
  if (!m || !nom) return "";
  const autres = m.lettres.filter(l => l !== it.ar && l !== "ء");
  const madd = MAKHRAJ_MADD[it.ar];
  return `<div class="makhraj"><div class="mk-haut">${makhrajImg(nom, "Coupe de la bouche et de la gorge : " + m.fr, it.nameAr)}
    <div class="mk-txt"><span class="mk-titre">D'où sort la lettre</span>${AR(m.ar)}<span>${esc(m.fr)}</span>
      ${autres.length ? `<span class="muted">Même endroit : ${autres.map(l => AR(l)).join(" ")}</span>` : ""}</div></div>
    ${madd ? `<div class="mk-haut mk-madd">${makhrajImg(madd, "Coupe de la bouche quand la lettre allonge une voyelle")}
      <div class="mk-txt"><span class="muted">Quand elle allonge une voyelle</span>${AR(makhrajById("jawf").ar)}</div></div>` : ""}
    <details class="mk-info"><summary aria-label="D'où viennent ces schémas"><span>i</span></summary>
      <span class="mk-source">Schémas tirés du livre ${AR("التجويد المصوَّر")}</span></details></div>`;
}
