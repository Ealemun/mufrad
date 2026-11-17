"use strict";
/* Mufrad — glossaire : les termes arabes employés dans la rubrique Grammaire.
   Dans un texte, {{id}} affiche le terme en arabe ({{id:pl}} pour son pluriel). Tant que l'apprenant ne l'a pas
   rencontré dans une leçon terminée, le terme est suivi de sa traduction entre parenthèses ; ensuite il reste seul,
   et un appui dessus rouvre sa définition. Réglable dans l'onglet : progressif, toujours traduit, ou arabe seul.
   Un terme = { id, groupe ("texte" ou "grammaire"), ar, pl (pluriel, facultatif), fr (traduction courte), def,
   sons (facultatif : sons à écouter dans sa définition, voir G_SONS en bas) }.
   Définitions rédigées pour Mufrad. À relire par un enseignant. */
GLOSSAIRE.push(
  // Les mots des livres et des poèmes
  { id: "nahw", groupe: "texte", ar: "نَحْو", fr: "grammaire", def: "La science qui étudie la fin des mots et la construction des phrases." },
  { id: "matn", groupe: "texte", ar: "مَتْن", pl: "مُتون", fr: "texte de base", def: "Un texte court qui résume une science, fait pour être mémorisé puis expliqué par un enseignant." },
  { id: "nazm", groupe: "texte", ar: "نَظْم", fr: "texte mis en vers", def: "Un texte de science mis en vers pour être retenu plus facilement. Ici, la mise en vers de l'Ājurrūmiyya." },
  { id: "bab", groupe: "texte", ar: "باب", pl: "أَبْواب", fr: "chapitre", def: "Une partie d'un livre. Le mot veut d'abord dire « porte »." },
  { id: "bayt", groupe: "texte", ar: "بَيْت", pl: "أَبْيات", fr: "vers", def: "Une ligne de poème, faite de deux moitiés. Le mot veut d'abord dire « maison »." },
  { id: "sadr", groupe: "texte", ar: "صَدْر", fr: "première moitié du vers", def: "La première moitié d'un vers, celle qu'on lit en premier, à droite." },
  { id: "ajuz", groupe: "texte", ar: "عَجُز", fr: "seconde moitié du vers", def: "La seconde moitié d'un vers, celle qui le termine, à gauche." },
  // Les mots de la grammaire
  { id: "kalam", groupe: "grammaire", ar: "كَلام", fr: "parole complète", def: "Un énoncé prononcé, fait d'au moins deux mots, qui donne un sens complet." },
  { id: "ism", groupe: "grammaire", ar: "اِسْم", pl: "أَسْماء", fr: "nom", def: "Un mot qui désigne quelqu'un ou quelque chose sans indiquer de temps. Pronoms, adjectifs, démonstratifs et nombres en font partie." },
  { id: "fil", groupe: "grammaire", ar: "فِعْل", pl: "أَفْعال", fr: "verbe", def: "Un mot qui désigne une action située dans le temps." },
  { id: "harf", groupe: "grammaire", ar: "حَرْف", pl: "حُروف", fr: "particule", def: "Un mot-outil qui ne prend son sens qu'avec d'autres mots. Le même mot désigne aussi une lettre de l'alphabet." },
  { id: "tanwin", groupe: "grammaire", ar: "تَنْوين", fr: "voyelle finale doublée", def: "La voyelle finale écrite deux fois et prononcée avec un « n ». Il ne se pose que sur un nom.",
    sons: ["son-tanwin-un", "son-tanwin-an", "son-tanwin-in"] },
  { id: "khafd", groupe: "grammaire", ar: "خَفْض", fr: "cas du nom après une préposition", def: "L'état d'un nom placé après une préposition : sa fin passe le plus souvent à la kasra. On dit aussi جَرّ." },
  { id: "jarr", groupe: "grammaire", ar: "جَرّ", fr: "autre nom du خَفْض", def: "Le même état que le خَفْض, sous un autre nom." },
  { id: "huruf-khafd", groupe: "grammaire", ar: "حُروف الخَفْض", fr: "prépositions", def: "Les particules qui mettent le nom suivant au خَفْض : مِنْ، إِلى، عَنْ، عَلى، في، رُبَّ، بِـ، كَـ، لِـ." },
  { id: "qasam", groupe: "grammaire", ar: "قَسَم", fr: "serment", def: "Jurer par quelque chose. Trois lettres servent à cela : وَ، بِـ، تَـ." },
  { id: "kasra", groupe: "grammaire", ar: "كَسْرَة", fr: "voyelle « i »", def: "Le petit trait sous la lettre : ـِ." },
  { id: "sukun", groupe: "grammaire", ar: "سُكون", fr: "absence de voyelle", def: "Le petit rond sur la lettre, qui indique qu'elle ne porte pas de voyelle : ـْ." },
  { id: "madi", groupe: "grammaire", ar: "ماضٍ", fr: "passé", def: "Le verbe qui exprime une action accomplie : وَضَعَ, « il a posé »." },
  { id: "mudari", groupe: "grammaire", ar: "مُضارِع", fr: "présent", def: "Le verbe qui exprime une action en cours ou à venir : يَذْهَبُ, « il part »." },
  { id: "ta-tanith", groupe: "grammaire", ar: "تاء التَّأْنيث", fr: "tāʾ du féminin", def: "Le تْ accroché à la fin d'un verbe au passé quand celle qui agit est féminine : وَضَعَتْ." }
);

// Sons de grammaire, montrés en grand dans une définition (champ « sons » d'un terme) et enregistrés par des
// contributeurs comme les mots (onglet Voix, mode guidé). Ils ont leur propre identifiant (« son-… »), distinct
// des mots et des lettres, et sont ajoutés à BY_ID pour que leurs voix partagées soient chargées et jouées.
// « ar » : le signe sur un cercle pointillé, pour qu'on le voie bien ; « fr » : ce qu'on entend.
const G_SONS = [
  { id: "son-tanwin-un", ar: "◌ٌ", fr: "oun", type: "son", l: "Gram" },
  { id: "son-tanwin-an", ar: "◌ً", fr: "an", type: "son", l: "Gram" },
  { id: "son-tanwin-in", ar: "◌ٍ", fr: "in", type: "son", l: "Gram" }
];
G_SONS.forEach(son => { BY_ID[son.id] = son; });
