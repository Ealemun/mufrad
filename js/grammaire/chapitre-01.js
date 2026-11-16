"use strict";
/* Mufrad — grammaire, chapitre 1 : la parole et les trois sortes de mots (bāb al-kalām).
   Plan et définitions : al-Ājurrūmiyya d'Ibn Ājurrūm (m. 723 H), cité en arabe dans chaque leçon.
   Explications rédigées pour Mufrad ; exemples pris dans le vocabulaire des unités 1 à 6. À relire par un enseignant.

   Format d'une leçon : { id, titre, resume, vers: [identifiants de vers], pages: [{ titre, blocs }], questions: [...] }.
   Blocs : { p } paragraphe · { matn, fr } citation du texte de référence · { ex: [[arabe, français, remarque]] } exemples · { regle } à retenir.
   Dans un texte, [[...]] encadre de l'arabe et *...* un mot important.
   Questions : { id, nature: "ism" | "fil" | "harf", mot: identifiant d'un mot, pourquoi }
            ou { id, q, ar, fr, choix: [...], bon: rang du bon choix, arChoix: true si les choix sont en arabe, pourquoi }.
   Un identifiant de question ne change jamais et n'est jamais réutilisé. */
GRAMMAIRE.push({
  n: 1,
  titre: "La parole et les trois sortes de mots",
  ar: "بابُ الكَلام",
  conseil: "Conseillé après l'unité 2",
  relu: false,
  lecons: [
    {
      id: "g1a", titre: "Nom, verbe, particule", resume: "Ce qu'est une parole complète, et les trois sortes de mots de l'arabe",
      vers: ["n006", "n007"],
      pages: [
        { titre: "Qu'est-ce qu'une parole ?", blocs: [
          { p: "La grammaire arabe commence par une question simple : à partir de quand a-t-on vraiment *dit quelque chose* ? Ibn Ājurrūm ouvre son livre par cette définition." },
          { matn: "الكَلامُ هُوَ اللَّفْظُ المُرَكَّبُ المُفيدُ بِالوَضْعِ", fr: "La parole (*kalām*) est l'énoncé prononcé, composé, porteur d'un sens complet, selon l'usage établi." },
          { p: "Quatre conditions, donc : des sons *prononcés* (un geste ou un écrit ne compte pas), *au moins deux mots* assemblés, un *sens complet* après lequel on peut se taire, et des mots employés *comme les Arabes les emploient*." },
          { ex: [
            ["هٰذا طَبيبٌ", "« Voici un médecin. »", "Deux mots, un sens complet : c'est une parole."],
            ["مَسْجِد", "« mosquée »", "Un seul mot : ce n'est pas encore une parole."],
            ["في المَسْجِدِ", "« dans la mosquée »", "Deux mots, mais on attend la suite : le sens n'est pas complet."]
          ] }
        ] },
        { titre: "Trois sortes de mots", blocs: [
          { matn: "وَأَقْسامُهُ ثَلاثَةٌ: اسْمٌ وَفِعْلٌ وَحَرْفٌ جاءَ لِمَعْنًى", fr: "Ses parties sont trois : le nom, le verbe, et la particule venue pour un sens." },
          { p: "Tout mot arabe appartient à l'une de ces trois familles, et à une seule." },
          { ex: [
            ["اِسْم", "*Le nom* (*ism*) désigne quelqu'un ou quelque chose, sans indiquer de temps.", "[[طَبيب]] médecin · [[مَسْجِد]] mosquée"],
            ["فِعْل", "*Le verbe* (*fiʿl*) désigne une action située dans le temps.", "[[يَقْرَأُ]] il lit · [[وَضَعَ]] il a posé"],
            ["حَرْف", "*La particule* (*ḥarf*) est un mot-outil : elle ne prend son sens qu'avec d'autres mots.", "[[مِنْ]] de · [[في]] dans · [[هَلْ]] est-ce que"]
          ] }
        ] },
        { titre: "Le nom arabe est une grande famille", blocs: [
          { p: "Attention : *ism* couvre bien plus que le « nom » du français. Les pronoms, les adjectifs, les démonstratifs et les nombres sont tous des *ism*." },
          { ex: [
            ["هُوَ · أَنا", "il · je", "Les pronoms sont des noms."],
            ["جَميلَة · كَبير", "belle · grand", "Les adjectifs sont des noms."],
            ["هٰذا", "celui-ci", "Les démonstratifs sont des noms."],
            ["خَمْسَة", "cinq", "Les nombres sont des noms."]
          ] },
          { regle: "Trois familles seulement : ce qui n'est ni un verbe ni une particule est un nom." }
        ] }
      ],
      questions: [
        { id: "g1a-01", q: "Lequel de ces énoncés est une parole complète ?", arChoix: true, choix: ["هٰذا طَبيبٌ", "في المَسْجِدِ", "مَسْجِد"], bon: 0,
          pourquoi: "[[هٰذا طَبيبٌ]] réunit deux mots et donne un sens complet. [[مَسْجِد]] est un mot seul, et [[في المَسْجِدِ]] laisse attendre la suite." },
        { id: "g1a-02", q: "En combien de familles la grammaire arabe range-t-elle les mots ?", choix: ["Trois : nom, verbe, particule", "Deux : nom et verbe", "Quatre : nom, verbe, adjectif, particule"], bon: 0,
          pourquoi: "Nom ([[اِسْم]]), verbe ([[فِعْل]]) et particule ([[حَرْف]]). L'adjectif n'est pas une famille à part : c'est un nom." },
        { id: "g1a-03", nature: "ism", mot: "w37", pourquoi: "[[طَبيب]] désigne une personne, sans indiquer de temps : c'est un nom." },
        { id: "g1a-04", nature: "fil", mot: "x25", pourquoi: "[[يَقْرَأُ]] désigne une action qui se passe dans le temps : c'est un verbe." },
        { id: "g1a-05", nature: "harf", mot: "w13", pourquoi: "[[مِنْ]] ne veut rien dire seul : il relie d'autres mots. C'est une particule." },
        { id: "g1a-06", nature: "ism", mot: "w30", pourquoi: "[[هُوَ]] est un pronom, et les pronoms sont des noms." },
        { id: "g1a-07", nature: "ism", mot: "u3-11", pourquoi: "[[جَميلَة]] est un adjectif, et en arabe l'adjectif est un nom." },
        { id: "g1a-08", nature: "harf", mot: "w16", pourquoi: "[[هَلْ]] sert seulement à poser la question : c'est une particule." },
        { id: "g1a-09", nature: "fil", mot: "u6-05", pourquoi: "[[وَضَعَ]] désigne une action accomplie dans le passé : c'est un verbe." }
      ]
    },
    {
      id: "g1b", titre: "Reconnaître un nom", resume: "Quatre signes qui ne se posent que sur un nom",
      vers: ["n008", "n009", "n010"],
      pages: [
        { titre: "Les signes du nom", blocs: [
          { p: "Comment être sûr qu'un mot est un nom ? Il porte, ou peut porter, l'un des signes que voici. *Un seul suffit.*" },
          { matn: "فَالاسْمُ يُعْرَفُ بِالخَفْضِ وَالتَّنْوينِ وَدُخولِ الأَلِفِ وَاللّامِ وَحُروفِ الخَفْضِ", fr: "Le nom se reconnaît au *khafḍ*, au *tanwīn*, à l'entrée de l'*alif-lām* et aux particules du *khafḍ*." },
          { ex: [
            ["كِتابٌ", "*Le tanwīn* : la voyelle finale doublée, prononcée avec un « n ».", "kitābun, « un livre »"],
            ["الكِتابُ", "*L'article* [[ال]] au début du mot.", "al-kitābu, « le livre »"],
            ["في البَيْتِ", "*Une particule du khafḍ* placée avant lui…", "ici [[في]], « dans »"],
            ["البَيْتِ", "…et *le khafḍ* lui-même : la fin du mot passe le plus souvent à la kasra.", "al-bayti"]
          ] },
          { regle: "L'article et le tanwīn ne vont jamais ensemble : [[كِتابٌ]] ou [[الكِتابُ]], jamais les deux." }
        ] },
        { titre: "Les particules du khafḍ", blocs: [
          { p: "Ce sont les prépositions de l'arabe. Le nom qui les suit se met au *khafḍ* (on dit aussi *jarr*)." },
          { matn: "وَهِيَ: مِنْ وَإِلى وَعَنْ وَعَلى وَفي وَرُبَّ وَالباءُ وَالكافُ وَاللّامُ", fr: "Ce sont : *min*, *ilā*, *ʿan*, *ʿalā*, *fī*, *rubba*, le *bāʾ*, le *kāf* et le *lām*." },
          { ex: [
            ["مِنَ البَيْتِ", "de la maison", ""],
            ["إِلى المَدْرَسَةِ", "vers l'école", ""],
            ["عَلى المائِدَةِ", "sur la table", ""],
            ["في الغُرْفَةِ", "dans la pièce", ""]
          ] },
          { p: "Vous connaissez déjà quatre d'entre elles par les unités : [[مِنْ]], [[إِلى]], [[عَلى]] et [[في]]. Les trois dernières de la liste ne font qu'une lettre et s'attachent au mot : [[بِـ]], [[كَـ]], [[لِـ]]." }
        ] },
        { titre: "Les particules du serment", blocs: [
          { matn: "وَحُروفِ القَسَمِ وَهِيَ: الواوُ وَالباءُ وَالتّاءُ", fr: "Et aux particules du serment, qui sont : le *wāw*, le *bāʾ* et le *tāʾ*." },
          { p: "Pour jurer, l'arabe place l'une de ces trois lettres devant le nom, qui se met alors au khafḍ." },
          { ex: [["وَاللهِ", "par Allah !", "Le [[وَ]] du serment, puis le nom avec une kasra."]] },
          { p: "Le poème range ces lettres avec les autres particules du jarr, et en ajoute quatre que le texte en prose ne cite pas : [[مُذْ]], [[مُنْذُ]], [[لَعَلَّ]] et [[حَتّى]]." }
        ] }
      ],
      questions: [
        { id: "g1b-01", q: "À quel signe voit-on que ce mot est un nom ?", ar: "كِتابٌ", fr: "un livre", choix: ["Le tanwīn", "L'article [[ال]]", "Une particule du khafḍ"], bon: 0,
          pourquoi: "La voyelle finale est doublée ([[ـٌ]]) : c'est le tanwīn, qui ne se pose que sur un nom." },
        { id: "g1b-02", q: "À quel signe voit-on que ce mot est un nom ?", ar: "المَطارُ", fr: "l'aéroport", choix: ["L'article [[ال]]", "Le tanwīn", "Une particule du khafḍ"], bon: 0,
          pourquoi: "Le mot commence par [[ال]]. Et comme il a l'article, il ne peut pas avoir de tanwīn." },
        { id: "g1b-03", q: "Quels signes du nom le mot [[البَيْتِ]] porte-t-il ici ?", ar: "في البَيْتِ", fr: "dans la maison", choix: ["L'article, la particule [[في]] avant lui et la kasra finale", "Le tanwīn seulement", "Aucun : c'est un verbe"], bon: 0,
          pourquoi: "Trois signes à la fois : [[ال]], la particule du khafḍ [[في]] placée avant, et le khafḍ lui-même (la kasra finale)." },
        { id: "g1b-04", q: "Laquelle de ces particules met le nom qui suit au khafḍ ?", arChoix: true, choix: ["إِلى", "هَلْ", "لا"], bon: 0,
          pourquoi: "[[إِلى]] (« vers ») fait partie de la liste. [[هَلْ]] sert à interroger et [[لا]] à nier." },
        { id: "g1b-05", q: "Quelle écriture est correcte ?", arChoix: true, choix: ["الطَّبيبُ", "الطَّبيبٌ"], bon: 0,
          pourquoi: "L'article et le tanwīn ne vont jamais ensemble : avec [[ال]], une seule voyelle finale." },
        { id: "g1b-06", q: "Lequel de ces mots peut recevoir l'article [[ال]] ?", arChoix: true, choix: ["مَسْجِد", "يَذْهَب", "في"], bon: 0,
          pourquoi: "Seul un nom accepte l'article : [[المَسْجِد]]. [[يَذْهَب]] est un verbe et [[في]] une particule." },
        { id: "g1b-07", q: "Quel rôle joue le [[وَ]] au début ?", ar: "وَاللهِ", fr: "par Allah !", choix: ["C'est une particule du serment : le nom se met au khafḍ", "Il veut dire « et »", "C'est la première lettre du mot"], bon: 0,
          pourquoi: "C'est le [[وَ]] du serment, l'une des trois particules citées avec [[بِـ]] et [[تَـ]]. Le nom qui suit prend la kasra." }
      ]
    },
    {
      id: "g1c", titre: "Reconnaître un verbe, reconnaître une particule", resume: "Les quatre signes du verbe ; la particule, elle, n'en accepte aucun",
      vers: ["n011", "n012"],
      pages: [
        { titre: "Les signes du verbe", blocs: [
          { matn: "وَالفِعْلُ يُعْرَفُ بِقَدْ وَالسّينِ وَسَوْفَ وَتاءِ التَّأْنيثِ السّاكِنَةِ", fr: "Le verbe se reconnaît à *qad*, au *sīn*, à *sawfa* et au *tāʾ* du féminin portant un sukūn." },
          { p: "Trois de ces signes se placent *avant* le verbe, le quatrième s'accroche *à la fin*." },
          { ex: [
            ["قَدْ وَضَعَ", "*qad* devant un verbe au passé : l'action a bien eu lieu.", "« il a bel et bien posé »"],
            ["سَيَذْهَبُ", "*Le sīn* collé au verbe : futur proche.", "« il va partir »"],
            ["سَوْفَ يَذْهَبُ", "*sawfa* : futur plus lointain.", "« il partira »"],
            ["وَضَعَتْ", "*Le tāʾ du féminin* à la fin d'un verbe au passé : le sujet est féminin.", "« elle a posé »"]
          ] },
          { regle: "Le sīn et sawfa ne se mettent que devant le présent, et en font un futur." }
        ] },
        { titre: "La particule : aucun signe", blocs: [
          { matn: "وَالحَرْفُ ما لا يَصْلُحُ مَعَهُ دَليلُ الاسْمِ وَلا دَليلُ الفِعْلِ", fr: "La particule est ce qui n'admet ni le signe du nom ni le signe du verbe." },
          { p: "On reconnaît donc la particule *par élimination*. Essayez les signes un par un : si aucun ne convient, c'est une particule." },
          { ex: [
            ["هَلْ", "est-ce que", "Ni article, ni tanwīn, ni qad, ni sīn."],
            ["في", "dans", "Même chose."],
            ["لا", "non", "Même chose."]
          ] },
          { regle: "Un mot qui accepte un signe du nom est un nom ; un signe du verbe, un verbe ; aucun signe, une particule." }
        ] }
      ],
      questions: [
        { id: "g1c-01", q: "À quel signe reconnaît-on un verbe ici ?", ar: "سَيَقْرَأُ", fr: "il va lire", choix: ["Le sīn placé devant", "Le tanwīn", "L'article [[ال]]"], bon: 0,
          pourquoi: "Le [[سَـ]] collé au début annonce le futur, et il ne se met que devant un verbe." },
        { id: "g1c-02", q: "À quel signe reconnaît-on un verbe ici ?", ar: "وَضَعَتْ", fr: "elle a posé", choix: ["Le tāʾ du féminin, avec un sukūn", "Le mot qad", "Le mot sawfa"], bon: 0,
          pourquoi: "Le [[تْ]] final indique que celle qui agit est féminine. Il ne s'accroche qu'à un verbe au passé." },
        { id: "g1c-03", q: "Que veut dire cette expression ?", ar: "سَوْفَ يَذْهَبُ", choix: ["Il partira (plus tard)", "Il est parti", "Il ne part pas"], bon: 0,
          pourquoi: "[[سَوْفَ]] devant le présent en fait un futur, plus lointain qu'avec le sīn." },
        { id: "g1c-04", q: "Lequel de ces mots peut suivre [[قَدْ]] ?", arChoix: true, choix: ["يَسْمَع", "مَسْجِد", "في"], bon: 0,
          pourquoi: "[[قَدْ]] ne se place que devant un verbe : [[قَدْ يَسْمَعُ]]. [[مَسْجِد]] est un nom et [[في]] une particule." },
        { id: "g1c-05", nature: "harf", mot: "x33", pourquoi: "[[إِلى]] n'accepte ni l'article, ni le tanwīn, ni qad, ni le sīn : c'est une particule." },
        { id: "g1c-06", q: "Comment reconnaît-on une particule ?", choix: ["Elle n'accepte aucun signe du nom ni du verbe", "Elle porte toujours l'article [[ال]]", "Elle se termine par un tanwīn"], bon: 0,
          pourquoi: "C'est la définition même d'Ibn Ājurrūm : on la reconnaît par élimination." },
        { id: "g1c-07", nature: "fil", mot: "u6-06", pourquoi: "On peut dire [[قَدْ يَسْمَعُ]], [[سَيَسْمَعُ]], [[سَوْفَ يَسْمَعُ]] : il accepte les signes du verbe." },
        { id: "g1c-08", nature: "ism", mot: "u4-28", pourquoi: "On peut dire [[كِتابٌ]] et [[الكِتابُ]] : il accepte le tanwīn et l'article, c'est un nom." }
      ]
    }
  ]
});
