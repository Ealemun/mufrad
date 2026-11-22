"use strict";
/* Mufrad — unité 7 : Les études.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 55 à 58 ; les leçons 59 à 63 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Les mots sont entièrement vocalisés ; quand le manuel n'imprime pas une voyelle, elle est reprise du dialogue
   ou ajoutée pour la lecture, et la note le dit.
   Verbes : seule la forme de base est gardée ; la conjugaison fera l'objet de leçons dédiées.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 7,
  ar: "الدِّراسَةُ",
  fr: "Les études",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[55, "L'emploi du temps"], [56, "À l'université"], [57, "La journée de cours"], [58, "Sixième… dixième (au féminin)"]],
  mots: [
    // Leçon 55 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u7-01", l: 55, ar: "اللُّغَة العَرَبِيَّة", tr: "al-lugha al-ʿarabiyya", fr: "la langue arabe", note: "" },
    { id: "u7-02", l: 55, ar: "مَوادُّ دِراسِيَّة", tr: "mawāddu dirāsiyya", fr: "matières scolaires", note: "imprimé avec le tanwīn (دِراسِيَّةٌ), retiré ici" },
    { id: "u7-03", l: 55, ar: "جَدْوَل دِراسِيّ", tr: "jadwal dirāsī", fr: "emploi du temps", note: "imprimé avec le tanwīn (جَدْوَلٌ دِراسِيٌّ), retiré ici" },
    { id: "u7-04", l: 55, ar: "صَفّ", tr: "ṣaff", fr: "classe (salle de classe)", note: "" },
    { id: "u7-05", l: 55, ar: "الحاسوب", tr: "al-ḥāsūb", fr: "l'ordinateur", note: "" },
    { id: "u7-06", l: 55, ar: "العُلوم", tr: "al-ʿulūm", fr: "les sciences", note: "" },
    { id: "u7-07", l: 55, ar: "الرِّياضِيّات", tr: "ar-riyāḍiyyāt", fr: "les mathématiques", note: "" },
    { id: "u7-08", l: 55, ar: "الثَّقافَةُ الإسْلامِيَّة", tr: "ath-thaqāfatu l-islāmiyya", fr: "la culture islamique", note: "" },
    { id: "u7-09", l: 55, ar: "جاءَ", tr: "jāʾa", fr: "il est venu", note: "" },
    { id: "u7-10", l: 55, ar: "اِخْتِبار", tr: "ikhtibār", fr: "examen, contrôle", note: "" },
    { id: "u7-11", l: 55, ar: "حِصَّة", tr: "ḥiṣṣa", fr: "cours, séance (heure de cours)", note: "" },
    { id: "u7-12", l: 55, ar: "لَوْحَة", tr: "lawḥa", fr: "tableau (au mur)", note: "" },
    { id: "u7-13", l: 55, ar: "يَكْتُبُ", tr: "yaktubu", fr: "il écrit", note: "" },
    { id: "u7-14", l: 55, ar: "يَنْتَهي", tr: "yantahī", fr: "il se termine", note: "imprimé sans voyelles sur la page de vocabulaire ; voyelles reprises de l'exercice de la même page" },
    { id: "u7-15", l: 55, ar: "يَبْدَأُ", tr: "yabdaʾu", fr: "il commence", note: "imprimé sans voyelles sur la page de vocabulaire ; voyelles reprises du dialogue de la leçon 57" },
    { id: "u7-16", l: 55, ar: "يَنْظُرُ", tr: "yanẓuru", fr: "il regarde (vers)", note: "" },
    { id: "u7-17", l: 55, ar: "الدِّراسَة", tr: "ad-dirāsa", fr: "les études", note: "relevé dans le dialogue" },
    { id: "u7-18", l: 55, ar: "أَيّام", tr: "ayyām", fr: "jours", note: "relevé dans le dialogue ; pluriel de يَوْم ; fatha du alif ajoutée pour la lecture (imprimé أيّامٍ)" },
    { id: "u7-19", l: 55, ar: "الأُسْبوع", tr: "al-usbūʿ", fr: "la semaine", note: "relevé dans le dialogue" },
    { id: "u7-20", l: 55, ar: "شَهْر", tr: "shahr", fr: "mois", note: "relevé dans le dialogue" },
    { id: "u7-21", l: 55, ar: "أَشْهُر", tr: "ashhur", fr: "mois (pluriel)", note: "relevé dans le dialogue ; pluriel de شَهْر" },
    { id: "u7-22", l: 55, ar: "شَعْبان", tr: "shaʿbān", fr: "chaabane (8e mois de l'année hégirienne)", note: "relevé dans le dialogue" },
    { id: "u7-23", l: 55, ar: "رَمَضان", tr: "ramaḍān", fr: "ramadan (9e mois de l'année hégirienne)", note: "relevé dans le dialogue" },
    { id: "u7-24", l: 55, ar: "العامُ الدِّراسِيّ", tr: "al-ʿāmu d-dirāsī", fr: "l'année scolaire", note: "relevé dans le dialogue" },
    { id: "u7-25", l: 55, ar: "العُطْلَة", tr: "al-ʿuṭla", fr: "les vacances", note: "relevé dans le dialogue" },
    { id: "u7-26", l: 55, ar: "طَويلَة", tr: "ṭawīla", fr: "longue", note: "relevé dans le dialogue ; masculin طَويل" },
    // Leçon 56 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u7-27", l: 56, ar: "يَدْرُسُ", tr: "yadrusu", fr: "il étudie", note: "" },
    { id: "u7-28", l: 56, ar: "كُلِّيَّةُ الطِّبّ", tr: "kulliyyatu ṭ-ṭibb", fr: "la faculté de médecine", note: "" },
    { id: "u7-29", l: 56, ar: "كُلِّيَّةُ التَّرْبِيَة", tr: "kulliyyatu t-tarbiya", fr: "la faculté des sciences de l'éducation", note: "damma du ة de كُلِّيَّة ajoutée pour la lecture (imprimé كُلِّيَّة التَّرْبِيَةِ)" },
    { id: "u7-30", l: 56, ar: "مُدَرِّسَة", tr: "mudarrisa", fr: "enseignante (professeure)", note: "masculin مُدَرِّس" },
    { id: "u7-31", l: 56, ar: "سورِيَّة", tr: "sūriyya", fr: "syrienne", note: "relevé dans le dialogue ; masculin سورِيّ" },
    { id: "u7-32", l: 56, ar: "سُعودِيَّة", tr: "suʿūdiyya", fr: "saoudienne", note: "relevé dans le dialogue" },
    { id: "u7-33", l: 56, ar: "دِمَشْق", tr: "dimashq", fr: "Damas", note: "relevé dans le dialogue" },
    { id: "u7-34", l: 56, ar: "أُمُّ القُرى", tr: "ummu l-qurā", fr: "Umm al-Qurā (université de La Mecque)", note: "relevé dans le dialogue (جامِعَةِ أُمِّ القُرى)" },
    { id: "u7-35", l: 56, ar: "طَبيبَة", tr: "ṭabība", fr: "médecin (femme)", note: "relevé dans le dialogue ; masculin طَبيب" },
    // Leçon 57 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u7-36", l: 57, ar: "الآنَ", tr: "al-āna", fr: "maintenant", note: "fatha finale reprise du dialogue" },
    { id: "u7-37", l: 57, ar: "مُخْتَبَر", tr: "mukhtabar", fr: "laboratoire", note: "" },
    { id: "u7-38", l: 57, ar: "مَكْتَبَة", tr: "maktaba", fr: "bibliothèque", note: "" },
    { id: "u7-39", l: 57, ar: "الوَقْتُ", tr: "al-waqtu", fr: "le temps, l'heure", note: "" },
    { id: "u7-40", l: 57, ar: "اِسْتِراحَة", tr: "istirāḥa", fr: "pause, récréation", note: "" },
    { id: "u7-41", l: 57, ar: "صَباحاً", tr: "ṣabāḥan", fr: "le matin (dans la matinée)", note: "relevé dans le dialogue" },
    { id: "u7-42", l: 57, ar: "ظُهْراً", tr: "ẓuhran", fr: "à midi", note: "relevé dans le dialogue" },
    { id: "u7-43", l: 57, ar: "اليَوْمُ الدِّراسِيّ", tr: "al-yawmu d-dirāsī", fr: "la journée de cours", note: "relevé dans le dialogue" },
    { id: "u7-44", l: 57, ar: "حِصَص", tr: "ḥiṣaṣ", fr: "cours, séances (pluriel)", note: "relevé dans le dialogue ; pluriel de حِصَّة" },
    { id: "u7-45", l: 57, ar: "عَنْ", tr: "ʿan", fr: "de, loin de", note: "relevé dans le dialogue (بَعيدَةٌ عَنِ البَيْتِ)" },
    // Leçon 58 : encadré de vocabulaire complémentaire (ordinaux au féminin de 1 à 10 ; 1 à 5 sont déjà dans l'unité 5)
    { id: "u7-46", l: 58, ar: "السّادِسَة", tr: "as-sādisa", fr: "la sixième", note: "masculin السّادِس" },
    { id: "u7-47", l: 58, ar: "السّابِعَة", tr: "as-sābiʿa", fr: "la septième", note: "masculin السّابِع" },
    { id: "u7-48", l: 58, ar: "الثّامِنَة", tr: "ath-thāmina", fr: "la huitième", note: "masculin الثّامِن" },
    { id: "u7-49", l: 58, ar: "التّاسِعَة", tr: "at-tāsiʿa", fr: "la neuvième", note: "masculin التّاسِع" },
    { id: "u7-50", l: 58, ar: "العاشِرَة", tr: "al-ʿāshira", fr: "la dixième", note: "masculin العاشِر" }
  ]
});
