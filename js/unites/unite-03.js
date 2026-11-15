"use strict";
/* Mufrad — unité 3 : Le logement.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 19 à 22 ; les leçons 23 à 27 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Quand la page de vocabulaire imprime un mot sans certaines voyelles, les voyelles sont reprises du dialogue
   de la même leçon et la note le dit.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 3,
  ar: "السَّكَنُ",
  fr: "Le logement",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[19, "Où habites-tu ?"], [20, "Visiter un appartement"], [21, "Les meubles"], [22, "Les jours de la semaine"]],
  mots: [
    // Leçon 19 : page de vocabulaire illustré, puis un mot-outil du dialogue
    { id: "u3-01", l: 19, ar: "بَيْت", tr: "bayt", fr: "maison", note: "la page de vocabulaire imprime بَيت, sans sukūn ; sukūn repris du dialogue" },
    { id: "u3-02", l: 19, ar: "شَقَّة", tr: "shaqqa", fr: "appartement", note: "" },
    { id: "u3-03", l: 19, ar: "رَقْم", tr: "raqm", fr: "numéro", note: "" },
    { id: "u3-04", l: 19, ar: "حَيّ", tr: "ḥayy", fr: "quartier", note: "" },
    { id: "u3-05", l: 19, ar: "يَسْكُن", tr: "yaskun", fr: "il habite", note: "" },
    { id: "u3-06", l: 19, ar: "لا", tr: "lā", fr: "non", note: "" },
    { id: "u3-07", l: 19, ar: "المَطار", tr: "al-maṭār", fr: "l'aéroport", note: "" },
    { id: "u3-08", l: 19, ar: "الجامِعَة", tr: "al-jāmiʿa", fr: "l'université", note: "" },
    { id: "u3-09", l: 19, ar: "ما", tr: "mā", fr: "quel ? (question)", note: "relevé dans le dialogue" },
    // Leçon 20 : page de vocabulaire illustré, puis les mots-outils du dialogue
    { id: "u3-10", l: 20, ar: "دَوْر", tr: "dawr", fr: "étage", note: "" },
    { id: "u3-11", l: 20, ar: "جَميلَة", tr: "jamīla", fr: "belle", note: "imprimé sans voyelles sur la page de vocabulaire, voyelles reprises du dialogue ; masculin جَميل" },
    { id: "u3-12", l: 20, ar: "غُرَف", tr: "ghuraf", fr: "pièces, chambres (pluriel)", note: "pluriel de غُرْفَة" },
    { id: "u3-13", l: 20, ar: "تَفَضَّلْ", tr: "tafaḍḍal", fr: "je t'en prie (invitation, à un homme)", note: "" },
    { id: "u3-14", l: 20, ar: "مُشاهَدَة", tr: "mushāhada", fr: "fait de voir, visite", note: "imprimé sans voyelles dans l'encadré, vocalisé dans l'exercice de la même page" },
    { id: "u3-15", l: 20, ar: "أُريدُ", tr: "urīdu", fr: "je veux", note: "" },
    { id: "u3-16", l: 20, ar: "الدَّوْر الخامِس", tr: "ad-dawr al-khāmis", fr: "le cinquième étage", note: "" },
    { id: "u3-17", l: 20, ar: "يَدْخُلُ", tr: "yadkhulu", fr: "il entre", note: "" },
    { id: "u3-18", l: 20, ar: "باب", tr: "bāb", fr: "porte", note: "" },
    { id: "u3-19", l: 20, ar: "كَمْ", tr: "kam", fr: "combien ?", note: "relevé dans le dialogue" },
    { id: "u3-20", l: 20, ar: "أَيِّ", tr: "ayy", fr: "quel ? lequel ?", note: "relevé dans le dialogue" },
    { id: "u3-21", l: 20, ar: "مِن فَضْلِكَ", tr: "min faḍlika", fr: "s'il te plaît (à un homme)", note: "relevé dans le dialogue" },
    { id: "u3-22", l: 20, ar: "لَدَينا", tr: "ladaynā", fr: "nous avons", note: "relevé dans le dialogue" },
    // Leçon 21 : page de vocabulaire illustré, puis les mots-outils du dialogue
    { id: "u3-23", l: 21, ar: "مَطْبَخ", tr: "maṭbakh", fr: "cuisine (pièce)", note: "la page de vocabulaire imprime مَطبَخ, sans sukūn ; sukūn repris du dialogue" },
    { id: "u3-24", l: 21, ar: "غُرْفَةُ نَوْم", tr: "ghurfat nawm", fr: "chambre à coucher", note: "" },
    { id: "u3-25", l: 21, ar: "غُرْفَةُ جُلوس", tr: "ghurfat julūs", fr: "salon", note: "" },
    { id: "u3-26", l: 21, ar: "أَثاث", tr: "athāth", fr: "meubles, mobilier", note: "imprimé sans voyelles sur la page de vocabulaire, voyelle reprise du dialogue" },
    { id: "u3-27", l: 21, ar: "سِتارَة", tr: "sitāra", fr: "rideau", note: "" },
    { id: "u3-28", l: 21, ar: "أَريكَة", tr: "arīka", fr: "canapé", note: "fatha du alif ajoutée pour la lecture (non imprimée, ni ici ni dans le dialogue)" },
    { id: "u3-29", l: 21, ar: "سَجّادَة", tr: "sajjāda", fr: "tapis", note: "" },
    { id: "u3-30", l: 21, ar: "سَرير", tr: "sarīr", fr: "lit", note: "" },
    { id: "u3-31", l: 21, ar: "ثَلّاجَة", tr: "thallāja", fr: "réfrigérateur", note: "" },
    { id: "u3-32", l: 21, ar: "سَخّان", tr: "sakhkhān", fr: "chauffe-eau", note: "" },
    { id: "u3-33", l: 21, ar: "فُرْن", tr: "furn", fr: "four", note: "" },
    { id: "u3-34", l: 21, ar: "مِرْآة", tr: "mirʾāh", fr: "miroir", note: "" },
    { id: "u3-35", l: 21, ar: "البائِع", tr: "al-bāʾiʿ", fr: "le vendeur", note: "" },
    { id: "u3-36", l: 21, ar: "المُشْتَري", tr: "al-mushtarī", fr: "l'acheteur", note: "" },
    { id: "u3-37", l: 21, ar: "أَيَّ خِدْمَةٍ", tr: "ayya khidmatin", fr: "à votre service, que puis-je pour vous ?", note: "relevé dans le dialogue" },
    { id: "u3-38", l: 21, ar: "بَعْض", tr: "baʿḍ", fr: "quelques, une partie de", note: "relevé dans le dialogue" },
    { id: "u3-39", l: 21, ar: "ماذا", tr: "mādhā", fr: "que ? qu'est-ce que ?", note: "relevé dans le dialogue" },
    { id: "u3-40", l: 21, ar: "آخَر", tr: "ākhar", fr: "autre", note: "relevé dans le dialogue" },
    { id: "u3-41", l: 21, ar: "شُكْراً", tr: "shukran", fr: "merci", note: "relevé dans le dialogue" },
    // Leçon 22 : encadré de vocabulaire complémentaire (un calendrier)
    { id: "u3-42", l: 22, ar: "السَّبْت", tr: "as-sabt", fr: "samedi", note: "" },
    { id: "u3-43", l: 22, ar: "الأَحَد", tr: "al-aḥad", fr: "dimanche", note: "" },
    { id: "u3-44", l: 22, ar: "الإثْنَين", tr: "al-ithnayn", fr: "lundi", note: "" },
    { id: "u3-45", l: 22, ar: "الثُّلاثاء", tr: "ath-thulāthāʾ", fr: "mardi", note: "" },
    { id: "u3-46", l: 22, ar: "الأَرْبعاء", tr: "al-arbiʿāʾ", fr: "mercredi", note: "voyelle à vérifier : le manuel n'imprime pas de voyelle sur le ب et l'usage varie (arbiʿāʾ, arbaʿāʾ, arbuʿāʾ) ; laissée vide en attendant un contributeur" },
    { id: "u3-47", l: 22, ar: "الخَميس", tr: "al-khamīs", fr: "jeudi", note: "" },
    { id: "u3-48", l: 22, ar: "الجُمُعَة", tr: "al-jumuʿa", fr: "vendredi", note: "" },
    { id: "u3-49", l: 22, ar: "مُحَرَّم", tr: "muḥarram", fr: "muharram (1er mois de l'année hégirienne)", note: "titre du calendrier" },
    // Ajouts après relecture : mots courants des dialogues des leçons 20 et 21
    { id: "u3-50", l: 20, ar: "المُسْتَأْجِر", tr: "al-mustaʾjir", fr: "le locataire", note: "relevé dans le dialogue" },
    { id: "u3-51", l: 20, ar: "المُؤَجِّر", tr: "al-muʾajjir", fr: "le bailleur", note: "relevé dans le dialogue" },
    { id: "u3-52", l: 20, ar: "اُدْخُلْ", tr: "udkhul", fr: "entre ! (à un homme)", note: "relevé dans le dialogue" },
    { id: "u3-53", l: 21, ar: "تُريدُ", tr: "turīdu", fr: "tu veux (à un homme)", note: "relevé dans le dialogue" },
    { id: "u3-54", l: 21, ar: "شَيْئاً", tr: "shayʾan", fr: "quelque chose", note: "relevé dans le dialogue" }
  ]
});
