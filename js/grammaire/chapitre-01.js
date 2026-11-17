"use strict";
/* Mufrad — grammaire, chapitre 1 : la parole et les trois sortes de mots (bāb al-kalām).
   Plan et définitions : al-Ājurrūmiyya d'Ibn Ājurrūm (m. 723 H), cité en arabe dans chaque leçon.
   Explications rédigées pour Mufrad ; exemples pris dans le vocabulaire des unités 1 à 6. À relire par un enseignant.

   Format d'une leçon : { id, titre, resume, vers: [identifiants de vers], pages: [{ titre, blocs }], questions: [...] }.
   Blocs : { p } paragraphe · { matn, fr } citation du texte de référence · { ex: [[arabe, français, remarque]] } exemples · { regle } à retenir.
   Dans un texte, {{id}} affiche un terme du glossaire (js/grammaire/glossaire.js), [[...]] encadre de l'arabe et *...* un mot important.
   Les termes de grammaire s'écrivent toujours par leur {{id}}, jamais en translittération.
   Questions : { id, nature: "ism" | "fil" | "harf", mot: identifiant d'un mot, pourquoi }
            ou { id, q, ar, fr, choix: [...], bon: rang du bon choix, arChoix: true si les choix sont en arabe, pourquoi }.
   Un identifiant de question ne change jamais et n'est jamais réutilisé. */
GRAMMAIRE.push({
  n: 1,
  titre: "Le {{kalam}} et les trois sortes de mots",
  ar: "بابُ الكَلام",
  conseil: "Conseillé après l'unité 2",
  relu: false,
  lecons: [
    {
      id: "g1a", titre: "{{ism}}, {{fil}}, {{harf}}", resume: "Ce qu'est une parole complète, et les trois sortes de mots de l'arabe",
      vers: ["n006", "n007"],
      termes: ["nahw", "matn", "nazm", "bab", "bayt", "sadr", "ajuz"],
      pages: [
        { titre: "Avant de commencer : les mots de cette rubrique", blocs: [
          { p: "Ici, les termes de grammaire sont donnés *en arabe*. Chacun est traduit quand vous le rencontrez, puis il reste seul : touchez-le pour revoir sa définition. Le glossaire complet est dans l'onglet." },
          { p: "La grammaire se dit {{nahw}}. On l'apprend depuis des siècles dans un {{matn}} : un petit livre fait pour être su par cœur. Le nôtre est l'Ājurrūmiyya d'Ibn Ājurrūm, cité dans chaque leçon." },
          { p: "Pour le retenir plus facilement, des savants l'ont mis en vers : c'est un {{nazm}}. Livre et poème sont découpés en {{bab:pl}} ; un seul se dit {{bab}}." },
          { ex: [
            ["بَيْت", "Une ligne du poème est un {{bayt}}.", "pluriel : [[أَبْيات]]"],
            ["صَدْر", "Sa première moitié, à droite, est le {{sadr}}.", ""],
            ["عَجُز", "Sa seconde moitié, à gauche, est le {{ajuz}}.", ""]
          ] }
        ] },
        { titre: "Qu'est-ce qu'un {{kalam}} ?", blocs: [
          { p: "Le {{nahw}} commence par une question simple : à partir de quand a-t-on vraiment *dit quelque chose* ? Ibn Ājurrūm ouvre son {{matn}} par cette définition." },
          { matn: "الكَلامُ هُوَ اللَّفْظُ المُرَكَّبُ المُفيدُ بِالوَضْعِ", fr: "Le {{kalam}} est l'énoncé prononcé, composé, porteur d'un sens complet, selon l'usage établi." },
          { p: "Quatre conditions, donc : des sons *prononcés* (un geste ou un écrit ne compte pas), *au moins deux mots* assemblés, un *sens complet* après lequel on peut se taire, et des mots employés *comme les Arabes les emploient*." },
          { ex: [
            ["هٰذا طَبيبٌ", "« Voici un médecin. »", "Deux mots, un sens complet : c'est un {{kalam}}."],
            ["مَسْجِد", "« mosquée »", "Un seul mot : ce n'est pas encore un {{kalam}}."],
            ["في المَسْجِدِ", "« dans la mosquée »", "Deux mots, mais on attend la suite : le sens n'est pas complet."]
          ] }
        ] },
        { titre: "Trois sortes de mots", blocs: [
          { matn: "وَأَقْسامُهُ ثَلاثَةٌ: اسْمٌ وَفِعْلٌ وَحَرْفٌ جاءَ لِمَعْنًى", fr: "Ses parties sont trois : le {{ism}}, le {{fil}}, et le {{harf}} venu pour un sens." },
          { p: "Tout mot arabe appartient à l'une de ces trois familles, et à une seule." },
          { ex: [
            ["اِسْم", "Le {{ism}} désigne quelqu'un ou quelque chose, sans indiquer de temps.", "[[طَبيب]] médecin · [[مَسْجِد]] mosquée"],
            ["فِعْل", "Le {{fil}} désigne une action située dans le temps.", "[[يَقْرَأُ]] il lit · [[وَضَعَ]] il a posé"],
            ["حَرْف", "Le {{harf}} est un mot-outil : il ne prend son sens qu'avec d'autres mots.", "[[مِنْ]] de · [[في]] dans · [[هَلْ]] est-ce que"]
          ] }
        ] },
        { titre: "Le {{ism}} est une grande famille", blocs: [
          { p: "Attention : le {{ism}} couvre bien plus que le « nom » du français. Les pronoms, les adjectifs, les démonstratifs et les nombres sont tous des {{ism:pl}}." },
          { ex: [
            ["هُوَ · أَنا", "il · je", "Les pronoms"],
            ["جَميلَة · كَبير", "belle · grand", "Les adjectifs"],
            ["هٰذا", "celui-ci", "Les démonstratifs"],
            ["خَمْسَة", "cinq", "Les nombres"]
          ] },
          { regle: "Trois familles seulement : ce qui n'est ni un {{fil}} ni un {{harf}} est un {{ism}}." }
        ] }
      ],
      questions: [
        { id: "g1a-01", q: "Lequel de ces énoncés est un {{kalam}} ?", arChoix: true, choix: ["هٰذا طَبيبٌ", "في المَسْجِدِ", "مَسْجِد"], bon: 0,
          pourquoi: "[[هٰذا طَبيبٌ]] réunit deux mots et donne un sens complet. [[مَسْجِد]] est un mot seul, et [[في المَسْجِدِ]] laisse attendre la suite." },
        { id: "g1a-02", q: "En combien de familles le {{nahw}} range-t-il les mots ?", choix: ["Trois : {{ism}}, {{fil}}, {{harf}}", "Deux : {{ism}} et {{fil}}", "Quatre, avec l'adjectif à part"], bon: 0,
          pourquoi: "{{ism}}, {{fil}} et {{harf}}. L'adjectif n'est pas une famille à part : c'est un {{ism}}." },
        { id: "g1a-03", nature: "ism", mot: "w37", pourquoi: "[[طَبيب]] désigne une personne, sans indiquer de temps : c'est un {{ism}}." },
        { id: "g1a-04", nature: "fil", mot: "x25", pourquoi: "[[يَقْرَأُ]] désigne une action qui se passe dans le temps : c'est un {{fil}}." },
        { id: "g1a-05", nature: "harf", mot: "w13", pourquoi: "[[مِنْ]] ne veut rien dire seul : il relie d'autres mots. C'est un {{harf}}." },
        { id: "g1a-06", nature: "ism", mot: "w30", pourquoi: "[[هُوَ]] est un pronom, et les pronoms sont des {{ism:pl}}." },
        { id: "g1a-07", nature: "ism", mot: "u3-11", pourquoi: "[[جَميلَة]] est un adjectif, et l'adjectif est un {{ism}}." },
        { id: "g1a-08", nature: "harf", mot: "w16", pourquoi: "[[هَلْ]] sert seulement à poser la question : c'est un {{harf}}." },
        { id: "g1a-09", nature: "fil", mot: "u6-05", pourquoi: "[[وَضَعَ]] désigne une action accomplie dans le passé : c'est un {{fil}}." }
      ]
    },
    {
      id: "g1b", titre: "Reconnaître un {{ism}}", resume: "Quatre signes qui ne se posent que sur lui",
      vers: ["n008", "n009", "n010"],
      pages: [
        { titre: "Les signes du {{ism}}", blocs: [
          { p: "Comment être sûr qu'un mot est un {{ism}} ? Il porte, ou peut porter, l'un des signes que voici. *Un seul suffit.*" },
          { matn: "فَالاسْمُ يُعْرَفُ بِالخَفْضِ وَالتَّنْوينِ وَدُخولِ الأَلِفِ وَاللّامِ وَحُروفِ الخَفْضِ", fr: "Le {{ism}} se reconnaît au {{khafd}}, au {{tanwin}}, à l'entrée de [[ال]] et aux {{huruf-khafd}}." },
          { ex: [
            // Entre * * : la partie de l'exemple dont parle l'explication (affichée en couleur)
            ["كِتا*بٌ*", "Le {{tanwin}} : la voyelle finale doublée, prononcée avec un « n ».", "« un livre »"],
            ["*ال*كِتابُ", "L'article [[ال]] au début du mot.", "« le livre »"],
            ["*في* البَيْتِ", "L'un des {{huruf-khafd}} placé avant lui…", "ici [[في]], « dans »"],
            ["البَيْ*تِ*", "…et le {{khafd}} lui-même : la fin du mot passe le plus souvent à la {{kasra}}.", ""]
          ] },
          { regle: "[[ال]] et le {{tanwin}} ne vont jamais ensemble : [[كِتابٌ]] ou [[الكِتابُ]], jamais les deux." }
        ] },
        { titre: "Les {{huruf-khafd}}", blocs: [
          { p: "Ce sont les prépositions de l'arabe. Le {{ism}} qui les suit se met au {{khafd}}, qu'on appelle aussi {{jarr}}." },
          { matn: "وَهِيَ: مِنْ وَإِلى وَعَنْ وَعَلى وَفي وَرُبَّ وَالباءُ وَالكافُ وَاللّامُ", fr: "Ce sont : [[مِنْ]], [[إِلى]], [[عَنْ]], [[عَلى]], [[في]], [[رُبَّ]], le [[بِـ]], le [[كَـ]] et le [[لِـ]]." },
          { ex: [
            ["مِنَ البَيْتِ", "de la maison", ""],
            ["إِلى المَدْرَسَةِ", "vers l'école", ""],
            ["عَلى المائِدَةِ", "sur la table", ""],
            ["في الغُرْفَةِ", "dans la pièce", ""]
          ] },
          { p: "Vous connaissez déjà quatre d'entre eux par les unités : [[مِنْ]], [[إِلى]], [[عَلى]] et [[في]]. Les trois derniers de la liste ne font qu'une lettre et s'attachent au mot : [[بِـ]], [[كَـ]], [[لِـ]]." }
        ] },
        { titre: "Les lettres du {{qasam}}", blocs: [
          { matn: "وَحُروفِ القَسَمِ وَهِيَ: الواوُ وَالباءُ وَالتّاءُ", fr: "Et aux lettres du {{qasam}}, qui sont : le [[وَ]], le [[بِـ]] et le [[تَـ]]." },
          { p: "Pour jurer, l'arabe place l'une de ces trois lettres devant le {{ism}}, qui se met alors au {{khafd}}." },
          { ex: [["وَاللهِ", "par Allah !", "Le [[وَ]] du {{qasam}}, puis le {{ism}} avec une {{kasra}}."]] },
          { p: "Le {{nazm}} range ces lettres avec les autres, et en ajoute quatre que le {{matn}} ne cite pas : [[مُذْ]], [[مُنْذُ]], [[لَعَلَّ]] et [[حَتّى]]." }
        ] }
      ],
      questions: [
        { id: "g1b-01", q: "À quel signe voit-on que ce mot est un {{ism}} ?", ar: "كِتابٌ", fr: "un livre", choix: ["Le {{tanwin}}", "L'article [[ال]]", "L'un des {{huruf-khafd}}"], bon: 0,
          pourquoi: "La voyelle finale est doublée ([[ـٌ]]) : c'est le {{tanwin}}, qui ne se pose que sur un {{ism}}." },
        { id: "g1b-02", q: "À quel signe voit-on que ce mot est un {{ism}} ?", ar: "المَطارُ", fr: "l'aéroport", choix: ["L'article [[ال]]", "Le {{tanwin}}", "L'un des {{huruf-khafd}}"], bon: 0,
          pourquoi: "Le mot commence par [[ال]]. Et comme il a l'article, il ne peut pas avoir de {{tanwin}}." },
        { id: "g1b-03", q: "Quels signes du {{ism}} le mot [[البَيْتِ]] porte-t-il ici ?", ar: "في البَيْتِ", fr: "dans la maison", choix: ["[[ال]], le mot [[في]] avant lui et la {{kasra}} finale", "Le {{tanwin}} seulement", "Aucun : c'est un {{fil}}"], bon: 0,
          pourquoi: "Trois signes à la fois : [[ال]], [[في]] qui est l'un des {{huruf-khafd}}, et le {{khafd}} lui-même (la {{kasra}} finale)." },
        { id: "g1b-04", q: "Lequel de ces mots met le {{ism}} qui suit au {{khafd}} ?", arChoix: true, choix: ["إِلى", "هَلْ", "لا"], bon: 0,
          pourquoi: "[[إِلى]] (« vers ») fait partie des {{huruf-khafd}}. [[هَلْ]] sert à interroger et [[لا]] à nier." },
        { id: "g1b-05", q: "Quelle écriture est correcte ?", arChoix: true, choix: ["الطَّبيبُ", "الطَّبيبٌ"], bon: 0,
          pourquoi: "[[ال]] et le {{tanwin}} ne vont jamais ensemble : avec [[ال]], une seule voyelle finale." },
        { id: "g1b-06", q: "Lequel de ces mots peut recevoir [[ال]] ?", arChoix: true, choix: ["مَسْجِد", "يَذْهَب", "في"], bon: 0,
          pourquoi: "Seul un {{ism}} accepte [[ال]] : [[المَسْجِد]]. [[يَذْهَب]] est un {{fil}} et [[في]] un {{harf}}." },
        { id: "g1b-07", q: "Quel rôle joue le [[وَ]] au début ?", ar: "وَاللهِ", fr: "par Allah !", choix: ["C'est le [[وَ]] du {{qasam}} : le {{ism}} se met au {{khafd}}", "Il veut dire « et »", "C'est la première lettre du mot"], bon: 0,
          pourquoi: "C'est le [[وَ]] du {{qasam}}, cité avec [[بِـ]] et [[تَـ]]. Le {{ism}} qui suit prend la {{kasra}}." }
      ]
    },
    {
      id: "g1c", titre: "Reconnaître un {{fil}}, reconnaître un {{harf}}", resume: "Les quatre signes du premier ; le second n'en accepte aucun",
      vers: ["n011", "n012"],
      pages: [
        { titre: "Les signes du {{fil}}", blocs: [
          { matn: "وَالفِعْلُ يُعْرَفُ بِقَدْ وَالسّينِ وَسَوْفَ وَتاءِ التَّأْنيثِ السّاكِنَةِ", fr: "Le {{fil}} se reconnaît à [[قَدْ]], au [[سَـ]], à [[سَوْفَ]] et au {{ta-tanith}} portant un {{sukun}}." },
          { p: "Trois de ces signes se placent *avant* le {{fil}}, le quatrième s'accroche *à la fin*. Ils dépendent de son temps : le {{madi}} ou le {{mudari}}." },
          { ex: [
            ["قَدْ وَضَعَ", "[[قَدْ]] devant le {{madi}} : l'action a bien eu lieu.", "« il a bel et bien posé »"],
            ["سَيَذْهَبُ", "[[سَـ]] collé au {{mudari}} : futur proche.", "« il va partir »"],
            ["سَوْفَ يَذْهَبُ", "[[سَوْفَ]] devant le {{mudari}} : futur plus lointain.", "« il partira »"],
            ["وَضَعَتْ", "Le {{ta-tanith}} à la fin du {{madi}} : celle qui agit est féminine.", "« elle a posé »"]
          ] },
          { regle: "[[سَـ]] et [[سَوْفَ]] ne se mettent que devant le {{mudari}}, et en font un futur." }
        ] },
        { titre: "Le {{harf}} : aucun signe", blocs: [
          { matn: "وَالحَرْفُ ما لا يَصْلُحُ مَعَهُ دَليلُ الاسْمِ وَلا دَليلُ الفِعْلِ", fr: "Le {{harf}} est ce qui n'admet ni le signe du {{ism}} ni le signe du {{fil}}." },
          { p: "On reconnaît donc le {{harf}} *par élimination*. Essayez les signes un par un : si aucun ne convient, c'en est un." },
          { ex: [
            ["هَلْ", "est-ce que", "Ni [[ال]], ni {{tanwin}}, ni [[قَدْ]], ni [[سَـ]]."],
            ["في", "dans", "Même chose."],
            ["لا", "non", "Même chose."]
          ] },
          { regle: "Un mot qui accepte un signe du {{ism}} est un {{ism}} ; un signe du {{fil}}, un {{fil}} ; aucun signe, un {{harf}}." }
        ] }
      ],
      questions: [
        { id: "g1c-01", q: "À quel signe reconnaît-on un {{fil}} ici ?", ar: "سَيَقْرَأُ", fr: "il va lire", choix: ["Le [[سَـ]] placé devant", "Le {{tanwin}}", "L'article [[ال]]"], bon: 0,
          pourquoi: "Le [[سَـ]] collé au début annonce le futur, et il ne se met que devant un {{fil}}." },
        { id: "g1c-02", q: "À quel signe reconnaît-on un {{fil}} ici ?", ar: "وَضَعَتْ", fr: "elle a posé", choix: ["Le {{ta-tanith}}, avec un {{sukun}}", "Le mot [[قَدْ]]", "Le mot [[سَوْفَ]]"], bon: 0,
          pourquoi: "Le [[تْ]] final indique que celle qui agit est féminine. Il ne s'accroche qu'au {{madi}}." },
        { id: "g1c-03", q: "Que veut dire cette expression ?", ar: "سَوْفَ يَذْهَبُ", choix: ["Il partira (plus tard)", "Il est parti", "Il ne part pas"], bon: 0,
          pourquoi: "[[سَوْفَ]] devant le {{mudari}} en fait un futur, plus lointain qu'avec [[سَـ]]." },
        { id: "g1c-04", q: "Lequel de ces mots peut suivre [[قَدْ]] ?", arChoix: true, choix: ["يَسْمَع", "مَسْجِد", "في"], bon: 0,
          pourquoi: "[[قَدْ]] ne se place que devant un {{fil}} : [[قَدْ يَسْمَعُ]]. [[مَسْجِد]] est un {{ism}} et [[في]] un {{harf}}." },
        { id: "g1c-05", nature: "harf", mot: "x33", pourquoi: "[[إِلى]] n'accepte ni [[ال]], ni le {{tanwin}}, ni [[قَدْ]], ni [[سَـ]] : c'est un {{harf}}." },
        { id: "g1c-06", q: "Comment reconnaît-on un {{harf}} ?", choix: ["Il n'accepte aucun signe du {{ism}} ni du {{fil}}", "Il porte toujours [[ال]]", "Il se termine par un {{tanwin}}"], bon: 0,
          pourquoi: "C'est la définition même d'Ibn Ājurrūm : on le reconnaît par élimination." },
        { id: "g1c-07", nature: "fil", mot: "u6-06", pourquoi: "On peut dire [[قَدْ يَسْمَعُ]], [[سَيَسْمَعُ]], [[سَوْفَ يَسْمَعُ]] : il accepte les signes du {{fil}}." },
        { id: "g1c-08", nature: "ism", mot: "u4-28", pourquoi: "On peut dire [[كِتابٌ]] et [[الكِتابُ]] : il accepte le {{tanwin}} et [[ال]], c'est un {{ism}}." }
      ]
    }
  ]
});
