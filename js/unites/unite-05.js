"use strict";
/* Mufrad — unité 5 : La nourriture et les boissons.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 37 à 40 ; les leçons 41 à 45 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Les mots sont entièrement vocalisés ; quand le manuel n'imprime pas une voyelle, la note le dit.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 5,
  ar: "الطَّعامُ والشَّرابُ",
  fr: "La nourriture et les boissons",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[37, "Les repas"], [38, "Dans l'avion"], [39, "Des invités à déjeuner"], [40, "Première, deuxième… cinquième"]],
  mots: [
    // Leçon 37 : page de vocabulaire illustré, puis les mots-outils du dialogue
    { id: "u5-01", l: 37, ar: "فاكِهَة", tr: "fākiha", fr: "fruits", note: "" },
    { id: "u5-02", l: 37, ar: "أَرُزّ", tr: "aruzz", fr: "riz", note: "" },
    { id: "u5-03", l: 37, ar: "سَمَك", tr: "samak", fr: "poisson", note: "" },
    { id: "u5-04", l: 37, ar: "خُبْز", tr: "khubz", fr: "pain", note: "" },
    { id: "u5-05", l: 37, ar: "يَأْكُل", tr: "yaʾkul", fr: "il mange", note: "fatha du ي ajoutée pour la lecture (le dialogue imprime تَأْكُلُ)" },
    { id: "u5-06", l: 37, ar: "مَطْعَم", tr: "maṭʿam", fr: "restaurant", note: "la page de vocabulaire imprime مَطعَم, sans sukūn ; sukūn repris du dialogue" },
    { id: "u5-07", l: 37, ar: "عَشاء", tr: "ʿashāʾ", fr: "dîner", note: "" },
    { id: "u5-08", l: 37, ar: "غَداء", tr: "ghadāʾ", fr: "déjeuner", note: "" },
    { id: "u5-09", l: 37, ar: "فَطور", tr: "faṭūr", fr: "petit-déjeuner", note: "fatha sur le ف, sur la page de vocabulaire comme dans le dialogue" },
    { id: "u5-10", l: 37, ar: "وَجَبات", tr: "wajabāt", fr: "repas (pluriel)", note: "pluriel de وَجْبَة" },
    { id: "u5-11", l: 37, ar: "وَجْبَة", tr: "wajba", fr: "repas", note: "" },
    { id: "u5-12", l: 37, ar: "وَزْن", tr: "wazn", fr: "poids", note: "" },
    { id: "u5-13", l: 37, ar: "قَليل", tr: "qalīl", fr: "peu, peu nombreux", note: "" },
    { id: "u5-14", l: 37, ar: "كَثير", tr: "kathīr", fr: "beaucoup, nombreux", note: "" },
    { id: "u5-15", l: 37, ar: "١٠٠ كيلِ", tr: "miʾat kīl", fr: "100 kilos", note: "" },
    { id: "u5-16", l: 37, ar: "سَمين", tr: "samīn", fr: "gros", note: "" },
    { id: "u5-17", l: 37, ar: "نَحيف", tr: "naḥīf", fr: "maigre, mince", note: "" },
    { id: "u5-18", l: 37, ar: "جِدّاً", tr: "jiddan", fr: "très", note: "relevé dans le dialogue" },
    { id: "u5-19", l: 37, ar: "اليَوْم", tr: "al-yawm", fr: "le jour (par jour)", note: "relevé dans le dialogue" },
    { id: "u5-20", l: 37, ar: "واحِدَة", tr: "wāḥida", fr: "une (féminin)", note: "relevé dans le dialogue ; masculin واحِد" },
    // Leçon 38 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u5-23", l: 38, ar: "ماء", tr: "māʾ", fr: "eau", note: "" },
    { id: "u5-24", l: 38, ar: "قَهْوَة", tr: "qahwa", fr: "café", note: "" },
    { id: "u5-25", l: 38, ar: "شاي", tr: "shāy", fr: "thé", note: "" },
    { id: "u5-26", l: 38, ar: "حَليب", tr: "ḥalīb", fr: "lait", note: "" },
    { id: "u5-27", l: 38, ar: "شَراب", tr: "sharāb", fr: "boisson", note: "" },
    { id: "u5-28", l: 38, ar: "تَمْر", tr: "tamr", fr: "dattes", note: "" },
    { id: "u5-29", l: 38, ar: "عِنَب", tr: "ʿinab", fr: "raisin", note: "" },
    { id: "u5-30", l: 38, ar: "طَعام", tr: "ṭaʿām", fr: "nourriture", note: "" },
    { id: "u5-31", l: 38, ar: "يَطْلُب", tr: "yaṭlub", fr: "il demande, il commande", note: "sukūn du ط ajouté pour la lecture (le dialogue imprime تَطْلُبينَ)" },
    { id: "u5-32", l: 38, ar: "يَشْرَب", tr: "yashrab", fr: "il boit", note: "" },
    { id: "u5-33", l: 38, ar: "المُضيفَة", tr: "al-muḍīfa", fr: "l'hôtesse (de l'air)", note: "relevé dans le dialogue ; damma du م ajoutée pour la lecture (non imprimée)" },
    { id: "u5-34", l: 38, ar: "المُسافِرَة", tr: "al-musāfira", fr: "la voyageuse", note: "relevé dans le dialogue ; damma du م ajoutée pour la lecture (non imprimée)" },
    { id: "u5-40", l: 38, ar: "بِـ", tr: "bi-", fr: "avec, au (le café au lait)", note: "relevé dans le dialogue (بِالحَليب)" },
    { id: "u5-41", l: 38, ar: "عَفْواً", tr: "ʿafwan", fr: "de rien, je vous en prie", note: "relevé dans le dialogue" },
    // Leçon 39 : page de vocabulaire illustré, puis les mots du dialogue
    { id: "u5-42", l: 39, ar: "ضُيوف", tr: "ḍuyūf", fr: "invités", note: "" },
    { id: "u5-43", l: 39, ar: "جَوْعان", tr: "jawʿān", fr: "affamé, qui a faim", note: "" },
    { id: "u5-44", l: 39, ar: "مائِدَة", tr: "māʾida", fr: "table (du repas)", note: "" },
    { id: "u5-45", l: 39, ar: "سَلَطَة", tr: "salaṭa", fr: "salade", note: "" },
    { id: "u5-46", l: 39, ar: "يَجْلِسُ", tr: "yajlisu", fr: "il s'assoit", note: "" },
    { id: "u5-47", l: 39, ar: "زَوْجَة", tr: "zawja", fr: "épouse", note: "féminin de زَوْج" },
    { id: "u5-48", l: 39, ar: "زَوْج", tr: "zawj", fr: "mari", note: "" },
    { id: "u5-49", l: 39, ar: "دَجاج", tr: "dajāj", fr: "poulet", note: "la page de vocabulaire imprime دَجاجَ, avec une fatha finale ; sans elle dans l'exercice de la leçon 40" },
    { id: "u5-50", l: 39, ar: "لَحْم", tr: "laḥm", fr: "viande", note: "la page de vocabulaire imprime لَحْمَ, avec une fatha finale ; sans elle dans l'exercice de la leçon 40" },
    { id: "u5-51", l: 39, ar: "عَلى", tr: "ʿalā", fr: "sur", note: "relevé dans le dialogue" },
    { id: "u5-52", l: 39, ar: "لِماذا", tr: "limādhā", fr: "pourquoi ?", note: "relevé dans le dialogue" },
    // Leçon 40 : encadré de vocabulaire complémentaire (les ordinaux au féminin)
    { id: "u5-55", l: 40, ar: "الأُولى", tr: "al-ūlā", fr: "la première", note: "masculin الأوَّل" },
    { id: "u5-56", l: 40, ar: "الثّانِيَة", tr: "ath-thāniya", fr: "la deuxième", note: "masculin الثّاني" },
    { id: "u5-57", l: 40, ar: "الثّالِثَة", tr: "ath-thālitha", fr: "la troisième", note: "masculin الثّالِث" },
    { id: "u5-58", l: 40, ar: "الرّابِعَة", tr: "ar-rābiʿa", fr: "la quatrième", note: "masculin الرّابِع" },
    { id: "u5-59", l: 40, ar: "الخامِسَة", tr: "al-khāmisa", fr: "la cinquième", note: "masculin الخامِس" },
    // Verbes : seule la forme de base (il …) est gardée ; la conjugaison fera l'objet de leçons dédiées.
    // Les identifiants u5-21, u5-22, u5-35 à u5-39, u5-53 et u5-54 (formes conjuguées retirées avant publication) ne sont pas réutilisés.
    { id: "u5-60", l: 38, ar: "يُفَضِّل", tr: "yufaḍḍil", fr: "il préfère", note: "forme de base de تُفَضِّلينَ et أُفَضِّلُ (dialogue)" },
    { id: "u5-61", l: 38, ar: "يُريد", tr: "yurīd", fr: "il veut", note: "forme de base de تُريدينَ (dialogue)" }
  ]
});
