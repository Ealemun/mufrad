"use strict";
/* Mufrad — contenu : lettres et mots, dans l'ordre du manuel.
   Chaque ligne a été transcrite à la main et reste à valider par un relecteur arabophone. */

/* ---------- 1. CONTENU ---------- */

// Les six lettres par lesquelles le manuel commence l'écriture : elles ne s'attachent pas à la lettre suivante.
// s = son court affiché dans les exercices ; fin = forme attachée à la lettre précédente.
const LETTERS = [
  { id: "l1", ar: "ا", name: "alif", s: "ā",      desc: "voyelle longue « ā », ou simple support de la hamza", fin: "ـا", ex: "أَنا",   exFr: "je" },
  { id: "l2", ar: "د", name: "dāl",  s: "d",      desc: "« d » comme en français",                              fin: "ـد", ex: "دار",    exFr: "maison" },
  { id: "l3", ar: "ذ", name: "dhāl", s: "dh",     desc: "comme le « th » anglais de « this »",                  fin: "ـذ", ex: "هٰذا",   exFr: "voici (masc.)" },
  { id: "l4", ar: "ر", name: "rāʾ",  s: "r",      desc: "« r » roulé du bout de la langue",                     fin: "ـر", ex: "رَأْس",  exFr: "tête" },
  { id: "l5", ar: "ز", name: "zāy",  s: "z",      desc: "« z » comme en français",                              fin: "ـز", ex: "عَزيز",  exFr: "cher" },
  { id: "l6", ar: "و", name: "wāw",  s: "w / ū",  desc: "« w », ou voyelle longue « ū » (ou)",                  fin: "ـو", ex: "واحِد",  exFr: "un" },
  // Unité 2 : trois lettres de même forme, distinguées par leurs points ; elles s'attachent des deux côtés.
  { id: "l7", u: 2, l: 18, ar: "ب", name: "bāʾ",  s: "b",  desc: "« b » comme en français",               join: "بـ  ـبـ  ـب", ex: "أَب",     exFr: "père" },
  { id: "l8", u: 2, l: 18, ar: "ت", name: "tāʾ",  s: "t",  desc: "« t » comme en français",               join: "تـ  ـتـ  ـت", ex: "أُخْت",   exFr: "sœur" },
  { id: "l9", u: 2, l: 18, ar: "ث", name: "thāʾ", s: "th", desc: "comme le « th » anglais de « think »",  join: "ثـ  ـثـ  ـث", ex: "ثَلاثَة", exFr: "trois" }
].map(l => ({ u: 1, l: 9, ...l, type: "letter" }));

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
  { n: 1, ar: "التَّحِيَّةُ وَالتَّعارُف", fr: "Salutations et présentations",
    lessons: [[1, "Se saluer"], [2, "D'où viens-tu ?"], [3, "Présenter quelqu'un"], [4, "Les nombres de 1 à 5"], [9, "Écriture : ا د ذ ر ز و"]] },
  { n: 2, ar: "الأُسْرَة", fr: "La famille",
    lessons: [[10, "La famille"], [11, "L'arbre de famille"], [12, "À la maison, à la mosquée"], [13, "Les nombres de 6 à 10"], [18, "Écriture : ب ت ث"]] }
];
const LESSON_TITLE = Object.fromEntries(UNITS.flatMap(u => u.lessons));
const lessonLabel = l => "Leçon " + l + " · " + LESSON_TITLE[l];

// Nom arabe de chaque lettre, lu par la voix quand aucun enregistrement n'existe encore
const NAME_AR = { l1: "أَلِف", l2: "دال", l3: "ذال", l4: "راء", l5: "زاي", l6: "واو", l7: "باء", l8: "تاء", l9: "ثاء" };

const ITEMS = [...LETTERS, ...WORDS, ...WORDS2];
const itemsOf = l => ITEMS.filter(it => it.l === l);


const BY_ID = Object.fromEntries(ITEMS.map(it => [it.id, it]));

// Réglages de rythme du prototype
const GOALS = { 5: 15, 10: 30, 15: 45 }; // objectif en minutes -> nombre maximal de révisions par séance
const NEW_LETTERS = 2;                   // lettres nouvelles par jour
const NEW_WORDS = 6;                     // mots nouveaux par jour

