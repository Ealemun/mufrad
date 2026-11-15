"use strict";
/* Mufrad — contenu commun : l'alphabet, et le registre où chaque unité vient s'inscrire.
   Les mots sont dans js/unites/, un fichier par unité ; js/assemblage.js réunit le tout. */

/* ---------- 1. CONTENU ---------- */

// L'alphabet, appris avant l'unité 1 : les 28 lettres, regroupées par formes voisines (l = numéro du groupe, 101 à 107).
// s = son court ; join = false pour les six lettres qui ne s'attachent pas à la lettre suivante.
// Les identifiants l1 à l9 sont ceux des premières versions : ils ne changent pas, pour garder la progression déjà faite.
const LETTERS = [
  { id: "l1",  l: 101, ar: "ا", nameAr: "أَلِف", name: "alif", s: "ā",     join: false, desc: "voyelle longue « ā », ou simple support de la hamza",        ex: "أَنا",        exFr: "je" },
  { id: "l7",  l: 101, ar: "ب", nameAr: "باء",   name: "bāʾ",  s: "b",     join: true,  desc: "« b » comme en français",                                    ex: "أَب",         exFr: "père" },
  { id: "l8",  l: 101, ar: "ت", nameAr: "تاء",   name: "tāʾ",  s: "t",     join: true,  desc: "« t » comme en français",                                    ex: "أُخْت",       exFr: "sœur" },
  { id: "l9",  l: 101, ar: "ث", nameAr: "ثاء",   name: "thāʾ", s: "th",    join: true,  desc: "comme le « th » anglais de « think »",                       ex: "ثَلاثَة",     exFr: "trois" },
  { id: "l10", l: 102, ar: "ج", nameAr: "جيم",   name: "jīm",  s: "j",     join: true,  desc: "« dj », comme dans « jean »",                                ex: "جَدّ",        exFr: "grand-père" },
  { id: "l11", l: 102, ar: "ح", nameAr: "حاء",   name: "ḥāʾ",  s: "ḥ",     join: true,  desc: "un « h » soufflé du fond de la gorge",                       ex: "حَمّام",      exFr: "salle de bain" },
  { id: "l12", l: 102, ar: "خ", nameAr: "خاء",   name: "khāʾ", s: "kh",    join: true,  desc: "comme la « jota » espagnole",                                ex: "أَخ",         exFr: "frère" },
  { id: "l2",  l: 103, ar: "د", nameAr: "دال",   name: "dāl",  s: "d",     join: false, desc: "« d » comme en français",                                    ex: "واحِد",       exFr: "un" },
  { id: "l3",  l: 103, ar: "ذ", nameAr: "ذال",   name: "dhāl", s: "dh",    join: false, desc: "comme le « th » anglais de « this »",                        ex: "هٰذا",        exFr: "voici (masc.)" },
  { id: "l4",  l: 103, ar: "ر", nameAr: "راء",   name: "rāʾ",  s: "r",     join: false, desc: "« r » roulé du bout de la langue",                           ex: "مِصْر",       exFr: "Égypte" },
  { id: "l5",  l: 103, ar: "ز", nameAr: "زاي",   name: "zāy",  s: "z",     join: false, desc: "« z » comme en français",                                    ex: "عَزيز",       exFr: "cher" },
  { id: "l13", l: 104, ar: "س", nameAr: "سين",   name: "sīn",  s: "s",     join: true,  desc: "« s » comme dans « sol »",                                   ex: "سِتَّة",      exFr: "six" },
  { id: "l14", l: 104, ar: "ش", nameAr: "شين",   name: "shīn", s: "sh",    join: true,  desc: "« ch » comme dans « chat »",                                 ex: "شَجَرَة",     exFr: "arbre" },
  { id: "l15", l: 104, ar: "ص", nameAr: "صاد",   name: "ṣād",  s: "ṣ",     join: true,  desc: "« s » emphatique, dit la bouche plus creuse",                ex: "صَديق",       exFr: "ami" },
  { id: "l16", l: 104, ar: "ض", nameAr: "ضاد",   name: "ḍād",  s: "ḍ",     join: true,  desc: "« d » emphatique, dit la bouche plus creuse",                ex: "يَتَوَضَّأُ", exFr: "il fait ses ablutions" },
  { id: "l17", l: 105, ar: "ط", nameAr: "طاء",   name: "ṭāʾ",  s: "ṭ",     join: true,  desc: "« t » emphatique, dit la bouche plus creuse",                ex: "طالِب",       exFr: "étudiant" },
  { id: "l18", l: 105, ar: "ظ", nameAr: "ظاء",   name: "ẓāʾ",  s: "ẓ",     join: true,  desc: "« dh » emphatique, dit la bouche plus creuse",               ex: "نَظّارَة",    exFr: "lunettes" },
  { id: "l19", l: 105, ar: "ع", nameAr: "عَيْن", name: "ʿayn", s: "ʿ",     join: true,  desc: "son de gorge sonore, propre à l'arabe",                      ex: "عَمّ",        exFr: "oncle paternel" },
  { id: "l20", l: 105, ar: "غ", nameAr: "غَيْن", name: "ghayn", s: "gh",   join: true,  desc: "proche du « r » français de « Paris »",                      ex: "غُرْفَة",     exFr: "pièce, chambre" },
  { id: "l21", l: 106, ar: "ف", nameAr: "فاء",   name: "fāʾ",  s: "f",     join: true,  desc: "« f » comme en français",                                    ex: "في",          exFr: "dans" },
  { id: "l22", l: 106, ar: "ق", nameAr: "قاف",   name: "qāf",  s: "q",     join: true,  desc: "« k » dit tout au fond de la gorge",                         ex: "القُرْآن",    exFr: "le Coran" },
  { id: "l23", l: 106, ar: "ك", nameAr: "كاف",   name: "kāf",  s: "k",     join: true,  desc: "« k » comme en français",                                    ex: "كَيْفَ",      exFr: "comment" },
  { id: "l24", l: 106, ar: "ل", nameAr: "لام",   name: "lām",  s: "l",     join: true,  desc: "« l » comme en français",                                    ex: "هَلْ",        exFr: "est-ce que" },
  { id: "l25", l: 107, ar: "م", nameAr: "ميم",   name: "mīm",  s: "m",     join: true,  desc: "« m » comme en français",                                    ex: "مِنْ",        exFr: "de" },
  { id: "l26", l: 107, ar: "ن", nameAr: "نون",   name: "nūn",  s: "n",     join: true,  desc: "« n » comme en français",                                    ex: "نَعَمْ",      exFr: "oui" },
  { id: "l27", l: 107, ar: "ه", nameAr: "هاء",   name: "hāʾ",  s: "h",     join: true,  desc: "« h » expiré, comme dans l'anglais « hello »",               ex: "هُوَ",        exFr: "il" },
  { id: "l6",  l: 107, ar: "و", nameAr: "واو",   name: "wāw",  s: "w / ū", join: false, desc: "« w », ou voyelle longue « ū » (ou)",                        ex: "هُوَ",        exFr: "il" },
  { id: "l28", l: 107, ar: "ي", nameAr: "ياء",   name: "yāʾ",  s: "y / ī", join: true,  desc: "« y », ou voyelle longue « ī »",                             ex: "يَقْرَأُ",    exFr: "il lit" }
].map(l => ({ ...l, u: 0, type: "letter" }));

// Les quatre formes d'une lettre selon sa place dans le mot. Le trait « ـ » force le dessin de la liaison.
// Une lettre qui ne s'attache pas à la suivante garde sa forme isolée en début de mot, et sa forme finale au milieu.
function formsOf(it) {
  const L = it.ar, T = "ـ";
  return it.join ? { isolee: L, debut: L + T, milieu: T + L + T, fin: T + L }
                 : { isolee: L, debut: L, milieu: T + L, fin: T + L };
}

// Registre des unités : chaque fichier de js/unites/ y ajoute la sienne par UNITES.push({ ... }).
const UNITES = [];
