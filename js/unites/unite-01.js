"use strict";
/* Mufrad — unité 1 : Salutations et présentations.
   Liste des mots de chaque leçon, dans l'ordre du manuel (leçons 1 à 5 ; les leçons 6 à 8 restent à lire).
   Chaque ligne a été transcrite à la main à partir des pages du livre.
   Règles : ne jamais changer un identifiant ni réordonner les lignes (la progression des apprenants en dépend) ;
   corriger une ligne sur place ; ajouter un mot à la fin, avec l'identifiant suivant. */
UNITES.push({
  n: 1,
  ar: "التَّحِيَّةُ وَالتَّعارُف",
  fr: "Salutations et présentations",
  relu: false,   // passe à true quand un relecteur arabophone a validé toutes les lignes
  lecons: [[1, "Se saluer"], [2, "D'où viens-tu ?"], [3, "Présenter quelqu'un"], [4, "Les nombres de 1 à 5"]],
  mots: [
    { id: "w01", l: 1, ar: "السَّلامُ عَلَيْكُم", tr: "as-salāmu ʿalaykum", fr: "que la paix soit sur vous", note: "salutation" },
    { id: "w02", l: 1, ar: "وَعَلَيْكُمُ السَّلام", tr: "wa-ʿalaykumu s-salām", fr: "et sur vous la paix", note: "réponse à la salutation" },
    { id: "w03", l: 1, ar: "اِسْمي", tr: "ismī", fr: "mon nom, je m'appelle", note: "" },
    { id: "w04", l: 1, ar: "ما اسْمُكَ؟", tr: "mā smuka?", fr: "comment t'appelles-tu ? (à un homme)", note: "" },
    { id: "w05", l: 1, ar: "ما اسْمُكِ؟", tr: "mā smuki?", fr: "comment t'appelles-tu ? (à une femme)", note: "" },
    { id: "w06", l: 1, ar: "كَيْفَ حالُكَ؟", tr: "kayfa ḥāluka?", fr: "comment vas-tu ? (à un homme)", note: "" },
    { id: "w07", l: 1, ar: "كَيْفَ حالُكِ؟", tr: "kayfa ḥāluki?", fr: "comment vas-tu ? (à une femme)", note: "" },
    { id: "w08", l: 1, ar: "بِخَيْر", tr: "bi-khayr", fr: "bien, en bonne santé", note: "" },
    { id: "w09", l: 1, ar: "الحَمْدُ لِلّه", tr: "al-ḥamdu li-llāh", fr: "louange à Allah", note: "" },
    { id: "w10", l: 1, ar: "أَنْتَ", tr: "anta", fr: "toi (masculin)", note: "" },
    { id: "w11", l: 1, ar: "أَنْتِ", tr: "anti", fr: "toi (féminin)", note: "" },
    { id: "w12", l: 2, ar: "أَنا", tr: "anā", fr: "je, moi", note: "" },
    { id: "w13", l: 2, ar: "مِنْ", tr: "min", fr: "de (provenance)", note: "" },
    { id: "w14", l: 2, ar: "أَيْنَ", tr: "ayna", fr: "où", note: "" },
    { id: "w15", l: 2, ar: "مِنْ أَيْنَ أَنْتَ؟", tr: "min ayna anta?", fr: "d'où es-tu ?", note: "" },
    { id: "w16", l: 2, ar: "هَلْ", tr: "hal", fr: "est-ce que", note: "" },
    { id: "w17", l: 2, ar: "نَعَمْ", tr: "naʿam", fr: "oui", note: "" },
    { id: "w18", l: 2, ar: "ما جِنْسِيَّتُكَ؟", tr: "mā jinsiyyatuka?", fr: "quelle est ta nationalité ?", note: "à une femme : جِنْسِيَّتُكِ" },
    { id: "w19", l: 2, ar: "أَهْلاً وَسَهْلاً", tr: "ahlan wa-sahlan", fr: "bienvenue", note: "" },
    { id: "w20", l: 2, ar: "باكِسْتان", tr: "bākistān", fr: "Pakistan", note: "" },
    { id: "w21", l: 2, ar: "باكِسْتانِيّ", tr: "bākistānī", fr: "pakistanais", note: "féminin : باكِسْتانِيَّة" },
    { id: "w22", l: 2, ar: "تُرْكِيا", tr: "turkiyā", fr: "Turquie", note: "" },
    { id: "w23", l: 2, ar: "تُرْكِيّ", tr: "turkī", fr: "turc", note: "féminin : تُرْكِيَّة" },
    { id: "w24", l: 2, ar: "مِصْر", tr: "miṣr", fr: "Égypte", note: "" },
    { id: "w25", l: 2, ar: "مِصْرِيّ", tr: "miṣrī", fr: "égyptien", note: "féminin : مِصْرِيَّة" },
    { id: "w26", l: 2, ar: "سورِيا", tr: "sūriyā", fr: "Syrie", note: "" },
    { id: "w27", l: 2, ar: "سورِيّ", tr: "sūrī", fr: "syrien", note: "féminin : سورِيَّة" },
    { id: "w28", l: 3, ar: "هٰذا", tr: "hādhā", fr: "voici, celui-ci (masculin)", note: "" },
    { id: "w29", l: 3, ar: "هٰذِهِ", tr: "hādhihi", fr: "voici, celle-ci (féminin)", note: "" },
    { id: "w30", l: 3, ar: "هُوَ", tr: "huwa", fr: "il, lui", note: "" },
    { id: "w31", l: 3, ar: "هِيَ", tr: "hiya", fr: "elle", note: "" },
    { id: "w32", l: 3, ar: "أَخ", tr: "akh", fr: "frère", note: "أَخي : mon frère" },
    { id: "w33", l: 3, ar: "أُخْت", tr: "ukht", fr: "sœur", note: "أُخْتي : ma sœur" },
    { id: "w34", l: 3, ar: "صَديق", tr: "ṣadīq", fr: "ami", note: "féminin : صَديقَة" },
    { id: "w35", l: 3, ar: "مُدَرِّس", tr: "mudarris", fr: "enseignant", note: "féminin : مُدَرِّسَة" },
    { id: "w36", l: 3, ar: "مُهَنْدِس", tr: "muhandis", fr: "ingénieur", note: "féminin : مُهَنْدِسَة" },
    { id: "w37", l: 3, ar: "طَبيب", tr: "ṭabīb", fr: "médecin", note: "féminin : طَبيبَة" },
    { id: "w38", l: 3, ar: "طالِبَة", tr: "ṭāliba", fr: "étudiante", note: "" },
    { id: "w39", l: 3, ar: "مَعَ السَّلامَة", tr: "maʿa s-salāma", fr: "au revoir", note: "" },
    { id: "w40", l: 4, ar: "واحِد", tr: "wāḥid", fr: "un (1)", note: "" },
    { id: "w41", l: 4, ar: "اِثْنان", tr: "ithnān", fr: "deux (2)", note: "" },
    { id: "w42", l: 4, ar: "ثَلاثَة", tr: "thalātha", fr: "trois (3)", note: "" },
    { id: "w43", l: 4, ar: "أَرْبَعَة", tr: "arbaʿa", fr: "quatre (4)", note: "" },
    { id: "w44", l: 4, ar: "خَمْسَة", tr: "khamsa", fr: "cinq (5)", note: "" }
  ]
});
