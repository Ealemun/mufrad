"use strict";
/* Mufrad — makhārij al-ḥurūf : l'endroit d'où sort chaque lettre, montré sur une coupe de profil de la bouche et de la gorge.
   Chargé avant l'application ; il n'utilise ses outils (esc, AR, LETTERS) qu'à l'intérieur de ses fonctions.

   Découpage suivi : celui d'Ibn al-Jazarī dans al-Muqaddima al-Jazariyya, dix-sept makhārij répartis en cinq zones
   (الجَوْف، الحَلْق، اللِّسان، الشَّفَتان، الخَيْشوم).
   Dessin fait pour Mufrad, sans rien reprendre d'un schéma existant. À VÉRIFIER PAR UN ENSEIGNANT DE TAJWĪD :
   la place de chaque lettre, la position des repères sur le dessin, les noms arabes et leur traduction.

   Un makhraj = { id, zone, ar (nom arabe de l'endroit), fr (explication courte), lettres (dans l'ordre de l'alphabet),
                  repere : où allumer le dessin }.
   repere vaut soit [cx, cy, rx, ry] (une pastille, dans le repère du dessin : 300 de large sur 290 de haut),
   soit le nom d'une cavité entière à allumer ("air" : la bouche et la gorge ; "nez" : le nez).
   Un identifiant ne change jamais : il pourra servir de carte de révision plus tard. */

const MAKHARIJ = [
  // الجَوْف : aucune partie de la bouche ne se touche, le son s'allonge dans le vide
  { id: "jawf", zone: "jawf", ar: "الجَوْف", fr: "le vide de la bouche et de la gorge : le son s'allonge sans rien toucher", lettres: ["ا"], repere: "air" },
  // الحَلْق : trois endroits, du plus profond au plus proche de la bouche
  { id: "halq-aqsa", zone: "halq", ar: "أَقْصى الحَلْق", fr: "le fond de la gorge", lettres: ["ء", "ه"], repere: [239, 262, 12, 9] },
  { id: "halq-wasat", zone: "halq", ar: "وَسَط الحَلْق", fr: "le milieu de la gorge", lettres: ["ح", "ع"], repere: [238, 222, 12, 9] },
  { id: "halq-adna", zone: "halq", ar: "أَدْنى الحَلْق", fr: "le haut de la gorge, tout près de la bouche", lettres: ["خ", "غ"], repere: [232, 186, 11, 9] },
  // اللِّسان : dix endroits, du fond de la langue jusqu'à son bout
  { id: "lisan-qaf", zone: "lisan", ar: "أَقْصى اللِّسان", fr: "le fond de la langue, contre le fond du palais", lettres: ["ق"], repere: [210, 160, 10, 8] },
  { id: "lisan-kaf", zone: "lisan", ar: "أَقْصى اللِّسان", fr: "le fond de la langue, un peu plus vers l'avant, contre le palais", lettres: ["ك"], repere: [191, 146, 10, 8] },
  { id: "lisan-wasat", zone: "lisan", ar: "وَسَط اللِّسان", fr: "le milieu de la langue, contre le palais", lettres: ["ج", "ش", "ي"], repere: [150, 140, 14, 8] },
  { id: "lisan-hafa", zone: "lisan", ar: "حافَة اللِّسان", fr: "le bord de la langue, contre les molaires du haut", lettres: ["ض"], repere: [152, 170, 26, 7] },
  { id: "lisan-lam", zone: "lisan", ar: "أَدْنى حافَة اللِّسان", fr: "l'avant du bord de la langue, contre la gencive des dents du haut", lettres: ["ل"], repere: [114, 146, 14, 6] },
  { id: "lisan-nun", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre la gencive des dents du haut", lettres: ["ن"], repere: [104, 148, 8, 6] },
  { id: "lisan-ra", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue et un peu de son dos, contre la gencive des dents du haut", lettres: ["ر"], repere: [108, 147, 10, 6] },
  { id: "lisan-ta", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre la racine des dents de devant du haut", lettres: ["ت", "د", "ط"], repere: [97, 152, 7, 6] },
  { id: "lisan-sin", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, tout près des dents de devant du bas", lettres: ["ز", "س", "ص"], repere: [96, 175, 7, 6] },
  { id: "lisan-tha", zone: "lisan", ar: "طَرَف اللِّسان", fr: "le bout de la langue, contre le bord des dents de devant du haut", lettres: ["ث", "ذ", "ظ"], repere: [88, 170, 7, 6] },
  // الشَّفَتان : deux endroits
  { id: "shafa-fa", zone: "shafatan", ar: "الشَّفَة السُّفْلى", fr: "l'intérieur de la lèvre du bas, contre le bord des dents de devant du haut", lettres: ["ف"], repere: [79, 171, 8, 6] },
  { id: "shafatan", zone: "shafatan", ar: "الشَّفَتان", fr: "les deux lèvres", lettres: ["ب", "م", "و"], repere: [66, 168, 9, 11] },
  // الخَيْشوم : aucune lettre n'en sort, c'est le son nasal qui accompagne ن et م
  { id: "khayshum", zone: "khayshum", ar: "الخَيْشوم", fr: "le nez : le son nasal qui accompagne ن et م", lettres: [], repere: "nez" }
];

// Deux lettres ont un second makhraj quand elles ne font qu'allonger une voyelle
const MAKHRAJ_MADD = { "و": "jawf", "ي": "jawf" };

const makhrajById = id => MAKHARIJ.find(m => m.id === id);
// Makhraj d'une lettre donnée par son caractère (ا ب ت…)
const makhrajOf = ar => MAKHARIJ.find(m => m.lettres.includes(ar));

/* Le dessin : une tête de profil tournée vers la gauche, coupée en son milieu.
   Les couleurs viennent des variables de l'application (css/makharij.css), pour suivre les thèmes clair et sombre. */
const MK_AIR = "M74 165 L86 162 Q92 146 110 142 Q150 132 196 142 Q212 148 216 172 Q222 160 228 146 L250 146 L252 290 L226 290 L226 248 Q150 250 100 228 Q88 210 88 176 L74 171 Z";
const MK_NEZ = "M86 118 Q100 86 150 84 Q206 86 236 116 L250 146 L228 146 Q222 126 200 122 Q150 114 100 122 Z";
function makhrajSvg(m) {
  const cavite = typeof m.repere === "string";
  const pastille = cavite ? "" : (([cx, cy, rx, ry]) =>
    `<ellipse class="mk-halo" cx="${cx}" cy="${cy}" rx="${rx + 5}" ry="${ry + 5}"/><ellipse class="mk-point" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)(m.repere);
  return `<svg class="mk" viewBox="0 0 300 290" role="img" aria-label="Coupe de la bouche et de la gorge : ${esc(m.fr)}">
    <defs><clipPath id="mk-cadre"><rect x="34" y="2" width="264" height="286" rx="26"/></clipPath></defs>
    <g clip-path="url(#mk-cadre)">
      <!-- La tête : front, nez, lèvres, menton, cou -->
      <path class="mk-chair" d="M150 2 C112 12 92 48 90 84 L60 124 Q54 134 70 138 L72 146 Q54 150 58 160 Q62 166 74 165 L74 171 Q58 172 60 182 Q62 192 76 192 Q66 214 86 230 Q120 246 168 240 L172 290 L300 290 L300 2 Z"/>
      <!-- Le nez, puis la bouche et la gorge (le passage de l'air) -->
      <path class="mk-vide ${m.repere === "nez" ? "mk-allume" : ""}" d="${MK_NEZ}"/>
      <path class="mk-vide ${m.repere === "air" ? "mk-allume" : ""}" d="${MK_AIR}"/>
      <!-- La langue, l'épiglotte et les cordes vocales -->
      <path class="mk-langue" d="M95 178 Q102 165 124 163 Q160 157 194 163 Q213 170 218 196 Q223 220 222 242 Q170 248 112 234 Q97 220 95 198 Q92 186 95 178 Z"/>
      <path class="mk-trait" d="M223 234 Q232 226 234 212"/>
      <path class="mk-trait" d="M228 268 L250 268"/>
      <!-- Les dents de devant, en haut et en bas -->
      <path class="mk-dent" d="M81 149 L91 147 L89 169 L84 169 Z"/>
      <path class="mk-dent" d="M82 178 L89 175 L92 194 L84 194 Z"/>
      ${pastille}
    </g></svg>`;
}

// Encadré de la fiche d'une lettre : le dessin, le nom arabe de l'endroit, son explication, et les lettres voisines
function makhrajHtml(it) {
  const m = makhrajOf(it.ar);
  if (!m) return "";
  const autres = m.lettres.filter(l => l !== it.ar && l !== "ء");
  const madd = MAKHRAJ_MADD[it.ar] ? makhrajById(MAKHRAJ_MADD[it.ar]) : null;
  return `<div class="makhraj">${makhrajSvg(m)}
    <div class="mk-txt"><span class="mk-titre">D'où sort la lettre</span>${AR(m.ar)}<span>${esc(m.fr)}</span>
      ${autres.length ? `<span class="muted">Même endroit : ${autres.map(l => AR(l)).join(" ")}</span>` : ""}
      ${madd ? `<span class="muted">Quand elle allonge une voyelle : ${AR(madd.ar)}</span>` : ""}</div></div>`;
}
