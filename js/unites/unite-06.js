"use strict";
/* Mufrad — unité 6 : La prière.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 46 à 49 ; les leçons 50 à 54 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Les mots sont entièrement vocalisés ; quand le manuel n'imprime pas une voyelle, elle est reprise du dialogue
   ou ajoutée pour la lecture, et la note le dit.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 6,
  ar: "الصَّلاةُ",
  fr: "La prière",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[46, "Les cinq prières"], [47, "Le voyage à La Mecque"], [48, "Aller à la mosquée"], [49, "Sixième… dixième"]],
  mots: [
    // Leçon 46 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u6-01", l: 46, ar: "الظُّهْر", tr: "aẓ-ẓuhr", fr: "midi (prière du ẓuhr)", note: "" },
    { id: "u6-02", l: 46, ar: "العَصْر", tr: "al-ʿaṣr", fr: "après-midi (prière du ʿaṣr)", note: "" },
    { id: "u6-03", l: 46, ar: "المَغْرِب", tr: "al-maghrib", fr: "coucher du soleil (prière du maghrib)", note: "" },
    { id: "u6-04", l: 46, ar: "العِشاء", tr: "al-ʿishāʾ", fr: "nuit tombée (prière du ʿishāʾ)", note: "à ne pas confondre avec عَشاء, le dîner" },
    { id: "u6-05", l: 46, ar: "وَضَعَ", tr: "waḍaʿa", fr: "il a posé", note: "" },
    { id: "u6-06", l: 46, ar: "يَسْمَع", tr: "yasmaʿ", fr: "il entend", note: "" },
    { id: "u6-07", l: 46, ar: "يَعْمَل", tr: "yaʿmal", fr: "il travaille", note: "" },
    { id: "u6-08", l: 46, ar: "يَسْتَطيع", tr: "yastaṭīʿ", fr: "il peut", note: "" },
    { id: "u6-09", l: 46, ar: "اللَّيْل", tr: "al-layl", fr: "la nuit", note: "sukūn du ي ajouté pour la lecture (non imprimé)" },
    { id: "u6-10", l: 46, ar: "بِجانِبِكَ", tr: "bi-jānibika", fr: "à côté de toi (à un homme)", note: "fatha finale reprise du dialogue" },
    { id: "u6-11", l: 46, ar: "مُنَبِّه", tr: "munabbih", fr: "réveil (réveille-matin)", note: "" },
    { id: "u6-12", l: 46, ar: "الصَّلَوات الخَمْس", tr: "aṣ-ṣalawāt al-khams", fr: "les cinq prières", note: "relevé dans le dialogue ; sukūn du م ajouté pour la lecture (imprimé الخَمسَ)" },
    { id: "u6-18", l: 46, ar: "فِكْرَة طَيِّبَة", tr: "fikra ṭayyiba", fr: "une bonne idée", note: "relevé dans le dialogue" },
    { id: "u6-19", l: 46, ar: "جَزاكَ اللّهُ خَيْراً", tr: "jazāka llāhu khayran", fr: "qu'Allah te récompense par le bien (merci)", note: "relevé dans le dialogue" },
    // Leçon 47 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u6-20", l: 47, ar: "مَكَّة", tr: "makka", fr: "La Mecque", note: "" },
    { id: "u6-21", l: 47, ar: "المَدينَة", tr: "al-madīna", fr: "Médine", note: "fatha du م reprise du dialogue" },
    { id: "u6-22", l: 47, ar: "مُسافِر", tr: "musāfir", fr: "voyageur, en voyage", note: "imprimé sans voyelles sur la page de vocabulaire ; voyelles reprises du dialogue" },
    { id: "u6-23", l: 47, ar: "يَرْكَبُ", tr: "yarkabu", fr: "il monte (dans un véhicule), il prend (l'avion)", note: "" },
    { id: "u6-24", l: 47, ar: "المَسْجِدُ الحَرام", tr: "al-masjidu l-ḥarām", fr: "la Mosquée sacrée (La Mecque)", note: "الحرام imprimé sans voyelle sur la page de vocabulaire ; fatha reprise du dialogue" },
    { id: "u6-25", l: 47, ar: "المَسْجِدُ النَّبَوِيّ", tr: "al-masjidu n-nabawī", fr: "la Mosquée du Prophète (Médine)", note: "fatha du م reprise du dialogue" },
    { id: "u6-26", l: 47, ar: "صَلاةُ الجُمُعَة", tr: "ṣalātu l-jumuʿa", fr: "la prière du vendredi", note: "fatha du ص reprise du dialogue de la leçon 46" },
    { id: "u6-27", l: 47, ar: "طائِرَة", tr: "ṭāʾira", fr: "avion", note: "" },
    { id: "u6-28", l: 47, ar: "إنْ شاءَ اللّه", tr: "in shāʾa llāh", fr: "si Allah le veut", note: "relevé dans le dialogue" },
    { id: "u6-29", l: 47, ar: "كَيْفَ", tr: "kayfa", fr: "comment ?", note: "relevé dans le dialogue" },
    // Leçon 48 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u6-31", l: 48, ar: "يَنْتَظِرُ", tr: "yantaẓiru", fr: "il attend", note: "" },
    { id: "u6-32", l: 48, ar: "صَحيح", tr: "ṣaḥīḥ", fr: "juste, vrai", note: "imprimé sans voyelles sur la page de vocabulaire ; fatha reprise du dialogue" },
    { id: "u6-33", l: 48, ar: "قَريب", tr: "qarīb", fr: "proche", note: "" },
    { id: "u6-34", l: 48, ar: "بَعيد", tr: "baʿīd", fr: "loin, éloigné", note: "" },
    { id: "u6-35", l: 48, ar: "مَريض", tr: "marīḍ", fr: "malade", note: "" },
    { id: "u6-36", l: 48, ar: "كَسْلان", tr: "kaslān", fr: "paresseux", note: "" },
    { id: "u6-37", l: 48, ar: "ذاهِب", tr: "dhāhib", fr: "qui s'en va, en route", note: "" },
    { id: "u6-38", l: 48, ar: "آسِف", tr: "āsif", fr: "désolé", note: "imprimé sans voyelle sur la page de vocabulaire ; kasra reprise du dialogue" },
    { id: "u6-39", l: 48, ar: "أَفْضَل", tr: "afḍal", fr: "meilleur, préférable", note: "relevé dans le dialogue" },
    { id: "u6-40", l: 48, ar: "مَعَكَ", tr: "maʿaka", fr: "avec toi (à un homme)", note: "relevé dans le dialogue" },
    // Leçon 49 : encadré de vocabulaire complémentaire (ordinaux de 1 à 10 ; 1 à 5 sont déjà dans l'unité 4)
    { id: "u6-42", l: 49, ar: "السّادِس", tr: "as-sādis", fr: "le sixième", note: "" },
    { id: "u6-43", l: 49, ar: "السّابِع", tr: "as-sābiʿ", fr: "le septième", note: "" },
    { id: "u6-44", l: 49, ar: "الثّامِن", tr: "ath-thāmin", fr: "le huitième", note: "" },
    { id: "u6-45", l: 49, ar: "التّاسِع", tr: "at-tāsiʿ", fr: "le neuvième", note: "" },
    { id: "u6-46", l: 49, ar: "العاشِر", tr: "al-ʿāshir", fr: "le dixième", note: "" }
    // Verbes : seule la forme de base est gardée ; la conjugaison fera l'objet de leçons dédiées.
    // Les identifiants u6-13 à u6-17, u6-30 et u6-41 (formes conjuguées retirées avant publication) ne sont pas réutilisés.
  ]
});
