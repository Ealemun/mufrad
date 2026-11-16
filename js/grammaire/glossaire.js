"use strict";
/* Mufrad — glossaire : les termes arabes employés dans la rubrique Grammaire.
   Dans un texte, {{id}} affiche le terme en arabe ({{id:pl}} pour son pluriel). Tant que l'apprenant ne l'a pas
   rencontré dans une leçon terminée, le terme est suivi de sa traduction entre parenthèses ; ensuite il reste seul,
   et un appui dessus rouvre sa définition. Réglable dans l'onglet : progressif, toujours traduit, ou arabe seul.
   Un terme = { id, groupe ("texte" ou "grammaire"), ar, pl (pluriel, facultatif), fr (traduction courte), def }.
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
  { id: "tanwin", groupe: "grammaire", ar: "تَنْوين", fr: "voyelle finale doublée", def: "La voyelle finale écrite deux fois et prononcée avec un « n » : ـٌ ـً ـٍ. Il ne se pose que sur un nom." },
  { id: "khafd", groupe: "grammaire", ar: "خَفْض", fr: "cas du nom après une préposition", def: "L'état d'un nom placé après une préposition : sa fin passe le plus souvent à la kasra. On dit aussi جَرّ." },
  { id: "jarr", groupe: "grammaire", ar: "جَرّ", fr: "autre nom du خَفْض", def: "Le même état que le خَفْض, sous un autre nom." },
  { id: "huruf-khafd", groupe: "grammaire", ar: "حُروف الخَفْض", fr: "prépositions", def: "Les particules qui mettent le nom suivant au خَفْض : مِنْ، إِلى، عَنْ، عَلى، في، رُبَّ، بِـ، كَـ، لِـ." },
  { id: "qasam", groupe: "grammaire", ar: "قَسَم", fr: "serment", def: "Jurer par quelque chose. Trois lettres servent à cela : وَ، بِـ، تَـ." },
  { id: "kasra", groupe: "grammaire", ar: "كَسْرَة", fr: "voyelle « i »", def: "Le petit trait sous la lettre : ـِ." },
  { id: "sukun", groupe: "grammaire", ar: "سُكون", fr: "absence de voyelle", def: "Le petit rond sur la lettre, qui indique qu'elle ne porte pas de voyelle : ـْ." },
  { id: "madi", groupe: "grammaire", ar: "ماضٍ", fr: "passé", def: "Le verbe qui exprime une action accomplie : وَضَعَ, « il a posé »." },
  { id: "mudari", groupe: "grammaire", ar: "مُضارِع", fr: "présent", def: "Le verbe qui exprime une action en cours ou à venir : يَذْهَبُ, « il part »." },
  { id: "ta-tanith", groupe: "grammaire", ar: "تاء التَّأْنيث", fr: "tāʾ du féminin", def: "Le تْ accroché à la fin d'un verbe au passé quand celle qui agit est féminine : وَضَعَتْ." },
  // Chapitre 2 : بابُ الإِعْراب
  { id: "irab", groupe: "grammaire", ar: "إِعْراب", fr: "fin variable du mot", def: "Le changement de la fin d'un mot selon les mots qui agissent sur lui : [[كِتابٌ، الكِتابَ، الكِتابِ]]." },
  { id: "amil", groupe: "grammaire", ar: "عامِل", pl: "عَوامِل", fr: "mot qui agit", def: "Le mot qui fait changer la fin d'un autre. Par exemple, [[في]] met le nom qui le suit au {{khafd}} : [[في الكِتابِ]]." },
  { id: "lafzi", groupe: "grammaire", ar: "لَفْظِيّ", fr: "prononcé", def: "Se dit du {{irab}} qu'on entend et qu'on écrit : la voyelle finale est bien là." },
  { id: "taqdiri", groupe: "grammaire", ar: "تَقْديرِيّ", fr: "sous-entendu", def: "Se dit du {{irab}} qu'on ne peut pas prononcer : la voyelle est supposée, comme à la fin de [[المُصَلّى]]." },
  { id: "raf", groupe: "grammaire", ar: "رَفْع", fr: "nominatif", def: "Le premier des quatre états du {{irab}}. Son signe de base est la {{damma}}. Il va au {{ism}} et au {{fil}} {{mudari}}." },
  { id: "nasb", groupe: "grammaire", ar: "نَصْب", fr: "accusatif", def: "Le deuxième état du {{irab}}. Son signe de base est la {{fatha}}. Il va au {{ism}} et au {{fil}} {{mudari}}." },
  { id: "jazm", groupe: "grammaire", ar: "جَزْم", fr: "jussif", def: "L'état du {{irab}} réservé au {{fil}} {{mudari}}. Son signe de base est le {{sukun}} : [[لَمْ يَذْهَبْ]]." },
  { id: "damma", groupe: "grammaire", ar: "ضَمَّة", fr: "voyelle « ou »", def: "Le petit [[و]] au-dessus de la lettre : [[ـُ]]." },
  { id: "fatha", groupe: "grammaire", ar: "فَتْحَة", fr: "voyelle « a »", def: "Le petit trait au-dessus de la lettre : [[ـَ]]." }
);
