"use strict";
/* Mufrad — unité 8 : Le travail.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 64 à 67 ; les leçons 68 à 72 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Les mots sont entièrement vocalisés ; quand le manuel n'imprime pas une voyelle, elle est reprise du dialogue
   ou ajoutée pour la lecture, et la note le dit.
   Verbes : seule la forme de base est gardée ; la conjugaison fera l'objet de leçons dédiées.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 8,
  ar: "العَمَلُ",
  fr: "Le travail",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[64, "Où travailles-tu ?"], [65, "Les métiers et les études"], [66, "Enfants et cycles scolaires"], [67, "Quelle heure est-il ?"]],
  mots: [
    // Leçon 64 : page de vocabulaire illustré (طَبيب y figure aussi, déjà dans l'unité 1), puis les mots du dialogue
    { id: "u8-01", l: 64, ar: "مُسْتَشْفى", tr: "mustashfā", fr: "hôpital", note: "" },
    { id: "u8-02", l: 64, ar: "شَرِكَة", tr: "sharika", fr: "entreprise, société", note: "" },
    { id: "u8-03", l: 64, ar: "يُحِبُّ", tr: "yuḥibbu", fr: "il aime", note: "kasra du ح reprise du dialogue (تُحِبُّ)" },
    { id: "u8-04", l: 64, ar: "ساعَة", tr: "sāʿa", fr: "montre, horloge ; heure", note: "imprimé sans voyelle sur la page de vocabulaire ; fatha reprise du dialogue" },
    { id: "u8-05", l: 64, ar: "ساعات", tr: "sāʿāt", fr: "heures (pluriel)", note: "relevé dans le dialogue ; pluriel de ساعَة" },
    { id: "u8-06", l: 64, ar: "عَمَل", tr: "ʿamal", fr: "travail", note: "relevé dans le dialogue" },
    // Leçon 65 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u8-07", l: 65, ar: "هَنْدَسَة", tr: "handasa", fr: "ingénierie (études d'ingénieur)", note: "" },
    { id: "u8-08", l: 65, ar: "صَيْدَلَة", tr: "ṣaydala", fr: "pharmacie (études)", note: "" },
    { id: "u8-09", l: 65, ar: "تَمْريض", tr: "tamrīḍ", fr: "soins infirmiers (études)", note: "" },
    { id: "u8-10", l: 65, ar: "طَيَران", tr: "ṭayarān", fr: "aviation, pilotage (études)", note: "" },
    { id: "u8-11", l: 65, ar: "صَيْدَلِيّ", tr: "ṣaydalī", fr: "pharmacien", note: "" },
    { id: "u8-12", l: 65, ar: "مُمَرِّض", tr: "mumarriḍ", fr: "infirmier", note: "" },
    { id: "u8-13", l: 65, ar: "طَيّار", tr: "ṭayyār", fr: "pilote (d'avion)", note: "" },
    { id: "u8-14", l: 65, ar: "يُدَرِّسُ", tr: "yudarrisu", fr: "il enseigne", note: "" },
    { id: "u8-15", l: 65, ar: "الطِّبّ", tr: "aṭ-ṭibb", fr: "la médecine", note: "relevé dans le dialogue" },
    { id: "u8-16", l: 65, ar: "كُلِّيَّة", tr: "kulliyya", fr: "faculté", note: "relevé dans le dialogue" },
    // Leçon 66 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u8-17", l: 66, ar: "طِفْل", tr: "ṭifl", fr: "enfant (petit)", note: "" },
    { id: "u8-18", l: 66, ar: "أَطْفال", tr: "aṭfāl", fr: "enfants (petits), pluriel", note: "pluriel de طِفْل" },
    { id: "u8-19", l: 66, ar: "مِهْنَة", tr: "mihna", fr: "métier, profession", note: "" },
    { id: "u8-20", l: 66, ar: "المَرْحَلَةُ الابْتِدائِيَّة", tr: "al-marḥalatu l-ibtidāʾiyya", fr: "le cycle primaire", note: "fatha du م reprise du dialogue" },
    { id: "u8-21", l: 66, ar: "المَرْحَلَةُ المُتَوَسِّطَة", tr: "al-marḥalatu l-mutawassiṭa", fr: "le cycle moyen (collège)", note: "fatha du م reprise du dialogue" },
    { id: "u8-22", l: 66, ar: "مَرْحَلَة", tr: "marḥala", fr: "étape, cycle (scolaire)", note: "relevé dans le dialogue" },
    { id: "u8-23", l: 66, ar: "لي", tr: "lī", fr: "à moi, j'ai", note: "relevé dans le dialogue (لي أَطْفالٌ)" },
    // Leçon 67 : encadré de vocabulaire complémentaire (les heures ; « sept heures » est déjà dans l'unité 4)
    { id: "u8-24", l: 67, ar: "السّاعَةُ الواحِدَة", tr: "as-sāʿatu l-wāḥida", fr: "une heure (1 h)", note: "" },
    { id: "u8-25", l: 67, ar: "السّاعَةُ الثّانِيَة", tr: "as-sāʿatu th-thāniya", fr: "deux heures (2 h)", note: "" },
    { id: "u8-26", l: 67, ar: "السّاعَةُ الثّالِثَة", tr: "as-sāʿatu th-thālitha", fr: "trois heures (3 h)", note: "" },
    { id: "u8-27", l: 67, ar: "السّاعَةُ الرّابِعَة", tr: "as-sāʿatu r-rābiʿa", fr: "quatre heures (4 h)", note: "" },
    { id: "u8-28", l: 67, ar: "السّاعَةُ الخامِسَة", tr: "as-sāʿatu l-khāmisa", fr: "cinq heures (5 h)", note: "" },
    { id: "u8-29", l: 67, ar: "السّاعَةُ السّادِسَة", tr: "as-sāʿatu s-sādisa", fr: "six heures (6 h)", note: "" },
    { id: "u8-30", l: 67, ar: "السّاعَةُ الثّامِنَة", tr: "as-sāʿatu th-thāmina", fr: "huit heures (8 h)", note: "" },
    { id: "u8-31", l: 67, ar: "السّاعَةُ التّاسِعَة", tr: "as-sāʿatu t-tāsiʿa", fr: "neuf heures (9 h)", note: "" },
    { id: "u8-32", l: 67, ar: "السّاعَةُ العاشِرَة", tr: "as-sāʿatu l-ʿāshira", fr: "dix heures (10 h)", note: "" },
    { id: "u8-33", l: 67, ar: "السّاعَةُ الحادِيَةَ عَشْرَة", tr: "as-sāʿatu l-ḥādiyata ʿashra", fr: "onze heures (11 h)", note: "" },
    { id: "u8-34", l: 67, ar: "السّاعَةُ الثّانِيَةَ عَشْرَة", tr: "as-sāʿatu th-thāniyata ʿashra", fr: "midi, minuit (12 h)", note: "" }
  ]
});
