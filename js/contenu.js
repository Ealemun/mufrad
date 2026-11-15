"use strict";
/* Mufrad — contenu : lettres et mots, dans l'ordre du manuel.
   Chaque ligne a été transcrite à la main et reste à valider par un relecteur arabophone. */

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

// Vocabulaire de l'unité 1, dans l'ordre du manuel (l = numéro de leçon).
// Transcrit à partir des pages du livre ; chaque ligne reste à valider par le relecteur.
const WORDS = [
  { l: 1, ar: "السَّلامُ عَلَيْكُم",      tr: "as-salāmu ʿalaykum",     fr: "que la paix soit sur vous",              note: "salutation" },
  { l: 1, ar: "وَعَلَيْكُمُ السَّلام",    tr: "wa-ʿalaykumu s-salām",   fr: "et sur vous la paix",                    note: "réponse à la salutation" },
  { l: 1, ar: "اِسْمي",                   tr: "ismī",                   fr: "mon nom, je m'appelle",                  note: "" },
  { l: 1, ar: "ما اسْمُكَ؟",              tr: "mā smuka?",              fr: "comment t'appelles-tu ? (à un homme)",   note: "" },
  { l: 1, ar: "ما اسْمُكِ؟",              tr: "mā smuki?",              fr: "comment t'appelles-tu ? (à une femme)",  note: "" },
  { l: 1, ar: "كَيْفَ حالُكَ؟",           tr: "kayfa ḥāluka?",          fr: "comment vas-tu ? (à un homme)",          note: "" },
  { l: 1, ar: "كَيْفَ حالُكِ؟",           tr: "kayfa ḥāluki?",          fr: "comment vas-tu ? (à une femme)",         note: "" },
  { l: 1, ar: "بِخَيْر",                  tr: "bi-khayr",               fr: "bien, en bonne santé",                   note: "" },
  { l: 1, ar: "الحَمْدُ لِلّه",           tr: "al-ḥamdu li-llāh",       fr: "louange à Allah",                         note: "" },
  { l: 1, ar: "أَنْتَ",                   tr: "anta",                   fr: "toi (masculin)",                         note: "" },
  { l: 1, ar: "أَنْتِ",                   tr: "anti",                   fr: "toi (féminin)",                          note: "" },
  { l: 2, ar: "أَنا",                     tr: "anā",                    fr: "je, moi",                                note: "" },
  { l: 2, ar: "مِنْ",                     tr: "min",                    fr: "de (provenance)",                        note: "" },
  { l: 2, ar: "أَيْنَ",                   tr: "ayna",                   fr: "où",                                     note: "" },
  { l: 2, ar: "مِنْ أَيْنَ أَنْتَ؟",      tr: "min ayna anta?",         fr: "d'où es-tu ?",                           note: "" },
  { l: 2, ar: "هَلْ",                     tr: "hal",                    fr: "est-ce que",                             note: "" },
  { l: 2, ar: "نَعَمْ",                   tr: "naʿam",                  fr: "oui",                                    note: "" },
  { l: 2, ar: "ما جِنْسِيَّتُكَ؟",        tr: "mā jinsiyyatuka?",       fr: "quelle est ta nationalité ?",            note: "à une femme : جِنْسِيَّتُكِ" },
  { l: 2, ar: "أَهْلاً وَسَهْلاً",        tr: "ahlan wa-sahlan",        fr: "bienvenue",                              note: "" },
  { l: 2, ar: "باكِسْتان",                tr: "bākistān",               fr: "Pakistan",                               note: "" },
  { l: 2, ar: "باكِسْتانِيّ",             tr: "bākistānī",              fr: "pakistanais",                            note: "féminin : باكِسْتانِيَّة" },
  { l: 2, ar: "تُرْكِيا",                 tr: "turkiyā",                fr: "Turquie",                                note: "" },
  { l: 2, ar: "تُرْكِيّ",                 tr: "turkī",                  fr: "turc",                                   note: "féminin : تُرْكِيَّة" },
  { l: 2, ar: "مِصْر",                    tr: "miṣr",                   fr: "Égypte",                                 note: "" },
  { l: 2, ar: "مِصْرِيّ",                 tr: "miṣrī",                  fr: "égyptien",                               note: "féminin : مِصْرِيَّة" },
  { l: 2, ar: "سورِيا",                   tr: "sūriyā",                 fr: "Syrie",                                  note: "" },
  { l: 2, ar: "سورِيّ",                   tr: "sūrī",                   fr: "syrien",                                 note: "féminin : سورِيَّة" },
  { l: 3, ar: "هٰذا",                     tr: "hādhā",                  fr: "voici, celui-ci (masculin)",             note: "" },
  { l: 3, ar: "هٰذِهِ",                   tr: "hādhihi",                fr: "voici, celle-ci (féminin)",              note: "" },
  { l: 3, ar: "هُوَ",                     tr: "huwa",                   fr: "il, lui",                                note: "" },
  { l: 3, ar: "هِيَ",                     tr: "hiya",                   fr: "elle",                                   note: "" },
  { l: 3, ar: "أَخ",                      tr: "akh",                    fr: "frère",                                  note: "أَخي : mon frère" },
  { l: 3, ar: "أُخْت",                    tr: "ukht",                   fr: "sœur",                                   note: "أُخْتي : ma sœur" },
  { l: 3, ar: "صَديق",                    tr: "ṣadīq",                  fr: "ami",                                    note: "féminin : صَديقَة" },
  { l: 3, ar: "مُدَرِّس",                 tr: "mudarris",               fr: "enseignant",                             note: "féminin : مُدَرِّسَة" },
  { l: 3, ar: "مُهَنْدِس",                tr: "muhandis",               fr: "ingénieur",                              note: "féminin : مُهَنْدِسَة" },
  { l: 3, ar: "طَبيب",                    tr: "ṭabīb",                  fr: "médecin",                                note: "féminin : طَبيبَة" },
  { l: 3, ar: "طالِبَة",                  tr: "ṭāliba",                 fr: "étudiante",                              note: "" },
  { l: 3, ar: "مَعَ السَّلامَة",          tr: "maʿa s-salāma",          fr: "au revoir",                              note: "" },
  { l: 4, ar: "واحِد",                    tr: "wāḥid",                  fr: "un (1)",                                 note: "" },
  { l: 4, ar: "اِثْنان",                  tr: "ithnān",                 fr: "deux (2)",                               note: "" },
  { l: 4, ar: "ثَلاثَة",                  tr: "thalātha",               fr: "trois (3)",                              note: "" },
  { l: 4, ar: "أَرْبَعَة",                tr: "arbaʿa",                 fr: "quatre (4)",                             note: "" },
  { l: 4, ar: "خَمْسَة",                  tr: "khamsa",                 fr: "cinq (5)",                               note: "" }
].map((w, i) => ({ ...w, u: 1, id: "w" + String(i + 1).padStart(2, "0"), type: "word" }));

// Vocabulaire de l'unité 2 (leçons 10 à 13), transcrit des pages du manuel ; à valider par le relecteur.
const WORDS2 = [
  { l: 10, ar: "صورَة",         tr: "ṣūra",          fr: "image, photo",                         note: "" },
  { l: 10, ar: "أُسْرَة",        tr: "usra",          fr: "famille",                              note: "" },
  { l: 10, ar: "جَدّ",           tr: "jadd",          fr: "grand-père",                           note: "" },
  { l: 10, ar: "جَدَّة",         tr: "jadda",         fr: "grand-mère",                           note: "" },
  { l: 10, ar: "والِد",          tr: "wālid",         fr: "père (registre soutenu)",              note: "" },
  { l: 10, ar: "والِدَة",        tr: "wālida",        fr: "mère (registre soutenu)",              note: "" },
  { l: 10, ar: "طالِب",          tr: "ṭālib",         fr: "étudiant",                             note: "" },
  { l: 10, ar: "مُعَلِّمَة",     tr: "muʿallima",     fr: "enseignante, institutrice",            note: "" },
  { l: 10, ar: "مَنْ",           tr: "man",           fr: "qui ?",                                note: "relevé dans le dialogue" },
  { l: 10, ar: "ما شاءَ الله",   tr: "mā shāʾa llāh", fr: "ce qu'Allah a voulu (admiration)",     note: "relevé dans le dialogue" },
  { l: 11, ar: "شَجَرَة",        tr: "shajara",       fr: "arbre",                                note: "" },
  { l: 11, ar: "عَمّ",           tr: "ʿamm",          fr: "oncle paternel",                       note: "" },
  { l: 11, ar: "عَمَّة",         tr: "ʿamma",         fr: "tante paternelle",                     note: "" },
  { l: 11, ar: "اِبْن",          tr: "ibn",           fr: "fils",                                 note: "" },
  { l: 11, ar: "اِبْنَة",        tr: "ibna",          fr: "fille (de quelqu'un)",                 note: "" },
  { l: 12, ar: "أَب",            tr: "ab",            fr: "père",                                 note: "" },
  { l: 12, ar: "أُمّ",           tr: "umm",           fr: "mère",                                 note: "" },
  { l: 12, ar: "أَوْلاد",        tr: "awlād",         fr: "enfants",                              note: "" },
  { l: 12, ar: "مَسْجِد",        tr: "masjid",        fr: "mosquée",                              note: "" },
  { l: 12, ar: "مُصَلّى",        tr: "muṣallā",       fr: "salle de prière",                      note: "" },
  { l: 12, ar: "القُرْآن",       tr: "al-qurʾān",     fr: "le Coran",                             note: "" },
  { l: 12, ar: "أَذان",          tr: "adhān",         fr: "appel à la prière",                    note: "" },
  { l: 12, ar: "الفَجْر",        tr: "al-fajr",       fr: "l'aube",                               note: "" },
  { l: 12, ar: "يَتَوَضَّأُ",    tr: "yatawaḍḍaʾu",   fr: "il fait ses ablutions",                note: "" },
  { l: 12, ar: "يَقْرَأُ",       tr: "yaqraʾu",       fr: "il lit",                               note: "" },
  { l: 12, ar: "يُصَلّي",        tr: "yuṣallī",       fr: "il prie",                              note: "" },
  { l: 12, ar: "غُرْفَة",        tr: "ghurfa",        fr: "pièce, chambre",                       note: "" },
  { l: 12, ar: "حَمّام",         tr: "ḥammām",        fr: "salle de bain",                        note: "" },
  { l: 12, ar: "مِعْطَف",        tr: "miʿṭaf",        fr: "manteau",                              note: "" },
  { l: 12, ar: "نَظّارَة",       tr: "naẓẓāra",       fr: "lunettes",                             note: "" },
  { l: 12, ar: "هَيّا بِنا",     tr: "hayyā binā",    fr: "allons-y",                             note: "" },
  { l: 12, ar: "في",             tr: "fī",            fr: "dans",                                 note: "relevé dans le dialogue" },
  { l: 12, ar: "إِلى",           tr: "ilā",           fr: "vers, à (direction)",                  note: "relevé dans le dialogue" },
  { l: 13, ar: "سِتَّة",         tr: "sitta",         fr: "six (6)",                              note: "" },
  { l: 13, ar: "سَبْعَة",        tr: "sabʿa",         fr: "sept (7)",                             note: "" },
  { l: 13, ar: "ثَمانِيَة",      tr: "thamāniya",     fr: "huit (8)",                             note: "" },
  { l: 13, ar: "تِسْعَة",        tr: "tisʿa",         fr: "neuf (9)",                             note: "" },
  { l: 13, ar: "عَشَرَة",        tr: "ʿashara",       fr: "dix (10)",                             note: "" }
].map((w, i) => ({ ...w, u: 2, id: "x" + String(i + 1).padStart(2, "0"), type: "word" }));

// Découpage du manuel : unités, puis leçons (les numéros de leçon se suivent d'une unité à l'autre).
const UNITS = [
  { n: 0, ar: "الحُروف", fr: "L'alphabet",
    lessons: [[101, "ا ب ت ث"], [102, "ج ح خ"], [103, "د ذ ر ز"], [104, "س ش ص ض"], [105, "ط ظ ع غ"], [106, "ف ق ك ل"], [107, "م ن ه و ي"]] },
  { n: 1, ar: "التَّحِيَّةُ وَالتَّعارُف", fr: "Salutations et présentations",
    lessons: [[1, "Se saluer"], [2, "D'où viens-tu ?"], [3, "Présenter quelqu'un"], [4, "Les nombres de 1 à 5"]] },
  { n: 2, ar: "الأُسْرَة", fr: "La famille",
    lessons: [[10, "La famille"], [11, "L'arbre de famille"], [12, "À la maison, à la mosquée"], [13, "Les nombres de 6 à 10"]] }
];
// Les groupes de l'alphabet portent les numéros 101 à 107 en interne et s'affichent « A1 » à « A7 »
const isAlpha = l => l > 100;
const lessonShort = l => isAlpha(l) ? "A" + (l - 100) : String(l);
const unitName = u => u.n === 0 ? "Pour commencer" : "Unité " + u.n;
const LESSON_TITLE = Object.fromEntries(UNITS.flatMap(u => u.lessons));
const lessonLabel = l => (isAlpha(l) ? "Alphabet " + (l - 100) : "Leçon " + l) + " · " + LESSON_TITLE[l];

// Nom arabe de chaque lettre, lu par la voix quand aucun enregistrement n'existe encore
const NAME_AR = Object.fromEntries(LETTERS.map(l => [l.id, l.nameAr]));

const ITEMS = [...LETTERS, ...WORDS, ...WORDS2];
const itemsOf = l => ITEMS.filter(it => it.l === l);


const BY_ID = Object.fromEntries(ITEMS.map(it => [it.id, it]));

// Réglages de rythme du prototype
const GOALS = { 5: 15, 10: 30, 15: 45 }; // objectif en minutes -> nombre maximal de révisions par séance
const NEW_LETTERS = 2;                   // lettres nouvelles par jour
const NEW_WORDS = 6;                     // mots nouveaux par jour

