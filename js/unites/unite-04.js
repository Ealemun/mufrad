"use strict";
/* Mufrad — unité 4 : La vie quotidienne.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 28 à 31 ; les leçons 32 à 36 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Quand la page de vocabulaire imprime un mot sans certaines voyelles, les voyelles sont reprises du dialogue
   de la même leçon et la note le dit.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 4,
  ar: "الحَياةُ اليَوْمِيَّةُ",
  fr: "La vie quotidienne",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[28, "Le matin"], [29, "Les tâches de la maison"], [30, "Le jour de congé"], [31, "Premier, deuxième… cinquième"]],
  mots: [
    // Leçon 28 : page de vocabulaire illustré, puis les mots-outils du dialogue
    { id: "u4-01", l: 28, ar: "يَنام", tr: "yanām", fr: "il dort", note: "" },
    { id: "u4-02", l: 28, ar: "يَسْتَيْقِظ", tr: "yastayqiẓ", fr: "il se réveille", note: "" },
    { id: "u4-03", l: 28, ar: "يَذْهَب", tr: "yadhhab", fr: "il va, il part", note: "" },
    { id: "u4-04", l: 28, ar: "السّاعَة السّابِعَة", tr: "as-sāʿa as-sābiʿa", fr: "sept heures", note: "la page de vocabulaire imprime السَاعة السّابِعة et le dialogue السّاعَةَ السَابِعَةَ ; les deux réunis" },
    { id: "u4-05", l: 28, ar: "سَيّارَة", tr: "sayyāra", fr: "voiture", note: "" },
    { id: "u4-06", l: 28, ar: "حافِلَة", tr: "ḥāfila", fr: "autobus", note: "" },
    { id: "u4-07", l: 28, ar: "مَدْرَسَة", tr: "madrasa", fr: "école", note: "" },
    { id: "u4-08", l: 28, ar: "مَتى", tr: "matā", fr: "quand ?", note: "relevé dans le dialogue" },
    { id: "u4-09", l: 28, ar: "عِنْدَ", tr: "ʿinda", fr: "à, au moment de, chez", note: "relevé dans le dialogue" },
    { id: "u4-10", l: 28, ar: "بَعْدَ", tr: "baʿda", fr: "après", note: "relevé dans le dialogue" },
    { id: "u4-11", l: 28, ar: "الصَّلاة", tr: "aṣ-ṣalāh", fr: "la prière", note: "relevé dans le dialogue" },
    // Leçon 29 : page de vocabulaire illustré, puis un mot-outil du dialogue
    { id: "u4-20", l: 29, ar: "يَوْمُ العَمَل", tr: "yawmu l-ʿamal", fr: "jour de travail", note: "" },
    { id: "u4-21", l: 29, ar: "يَوْمُ العُطْلَة", tr: "yawmu l-ʿuṭla", fr: "jour de congé", note: "" },
    { id: "u4-22", l: 29, ar: "أَطْباق", tr: "aṭbāq", fr: "assiettes, vaisselle", note: "" },
    { id: "u4-23", l: 29, ar: "يَكْنُس", tr: "yaknus", fr: "il balaie", note: "" },
    { id: "u4-24", l: 29, ar: "مَلابِس", tr: "malābis", fr: "vêtements", note: "" },
    { id: "u4-25", l: 29, ar: "يَغْسِل", tr: "yaghsil", fr: "il lave", note: "" },
    { id: "u4-26", l: 29, ar: "يَكْوي", tr: "yakwī", fr: "il repasse (le linge)", note: "" },
    { id: "u4-27", l: 29, ar: "يا", tr: "yā", fr: "ô (pour appeler quelqu'un)", note: "relevé dans le dialogue" },
    // Leçon 30 : page de vocabulaire illustré, puis les mots-outils du dialogue
    { id: "u4-28", l: 30, ar: "كِتاب", tr: "kitāb", fr: "livre", note: "" },
    { id: "u4-29", l: 30, ar: "صَحيفَة", tr: "ṣaḥīfa", fr: "journal", note: "" },
    { id: "u4-30", l: 30, ar: "تِلْفاز", tr: "tilfāz", fr: "télévision", note: "" },
    { id: "u4-31", l: 30, ar: "يُشاهِد", tr: "yushāhid", fr: "il regarde", note: "" },
    { id: "u4-32", l: 30, ar: "الصَّباح", tr: "aṣ-ṣabāḥ", fr: "le matin", note: "la page de vocabulaire imprime الصّباح, sans fatha ; fatha reprise du dialogue" },
    { id: "u4-33", l: 30, ar: "كَبير", tr: "kabīr", fr: "grand", note: "" },
    { id: "u4-34", l: 30, ar: "مُبَكِّراً", tr: "mubakkiran", fr: "tôt", note: "" },
    { id: "u4-35", l: 30, ar: "مُتَأَخِّراً", tr: "mutaʾakhkhiran", fr: "tard", note: "" },
    { id: "u4-36", l: 30, ar: "أَوْ", tr: "aw", fr: "ou (choix)", note: "relevé dans le dialogue ; non vocalisé ici, vocalisé أَو dans le dialogue de la leçon 38 ; sukūn ajouté pour la lecture" },
    { id: "u4-37", l: 30, ar: "أَيْضاً", tr: "ayḍan", fr: "aussi, également", note: "relevé dans le dialogue" },
    // Leçon 31 : encadré de vocabulaire complémentaire (les nombres ordinaux)
    { id: "u4-38", l: 31, ar: "الأَوَّل", tr: "al-awwal", fr: "le premier", note: "fatha du alif ajoutée pour la lecture (non imprimée)" },
    { id: "u4-39", l: 31, ar: "الثّاني", tr: "ath-thānī", fr: "le deuxième", note: "" },
    { id: "u4-40", l: 31, ar: "الثّالِث", tr: "ath-thālith", fr: "le troisième", note: "" },
    { id: "u4-41", l: 31, ar: "الرّابِع", tr: "ar-rābiʿ", fr: "le quatrième", note: "" },
    { id: "u4-42", l: 31, ar: "الخامِس", tr: "al-khāmis", fr: "le cinquième", note: "" },
    // Verbes : seule la forme de base (il …) est gardée ; la conjugaison fera l'objet de leçons dédiées.
    // Les identifiants u4-12 à u4-19 (formes conjuguées retirées avant publication) ne sont pas réutilisés.
    { id: "u4-43", l: 28, ar: "يَفْعَل", tr: "yafʿal", fr: "il fait", note: "forme de base de تَفْعَلُ (dialogue), imprimée يَفْعَلُ dans l'exercice de la même leçon" }
  ]
});
