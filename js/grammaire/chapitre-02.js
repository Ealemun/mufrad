"use strict";
/* Mufrad — grammaire, chapitre 2 : le changement de la fin des mots (bāb al-iʿrāb).
   Plan et définitions : al-Ājurrūmiyya d'Ibn Ājurrūm (m. 723 H), cité en arabe dans chaque leçon.
   Explications rédigées pour Mufrad ; exemples pris dans le vocabulaire des unités 1 à 6
   (كِتاب, مَسْجِد, مَدْرَسَة, مُصَلّى, يَقْرَأُ, يَذْهَبُ). À relire par un enseignant.
   Format : celui du chapitre 1 (voir l'en-tête de js/grammaire/chapitre-01.js).
   Vigilance : لَمْ (« ne… pas », devant un verbe) s'écrit comme لِمَ (« pourquoi ? ») ; il n'apparaît donc
   jamais sans sa traduction. Les mots arabes proposés comme choix sont toujours suivis de leur sens. */
GRAMMAIRE.push({
  n: 2,
  titre: "Le {{irab}} : la fin des mots change",
  ar: "بابُ الإِعْراب",
  conseil: "Conseillé après l'unité 4",
  relu: false,
  lecons: [
    {
      id: "g2a", titre: "Qu'est-ce que le {{irab}} ?", resume: "La dernière lettre d'un mot change selon les mots qui agissent sur lui",
      vers: ["n013", "n014"],
      pages: [
        { titre: "Un même mot, trois fins", blocs: [
          { p: "Regardez le mot [[كِتابٌ]] (« livre ») dans ces trois phrases. Le début et le milieu ne bougent pas. *Seule la fin change.*" },
          { ex: [
            ["هٰذا كِتابٌ", "« Voici un livre. »", "La fin porte une {{damma}}, ici doublée par le {{tanwin}} : [[ـٌ]]"],
            ["يَقْرَأُ الكِتابَ", "« Il lit le livre. »", "La fin porte une {{fatha}} : [[ـَ]]"],
            ["في الكِتابِ", "« dans le livre »", "La fin porte une {{kasra}} : [[ـِ]]"]
          ] },
          { p: "Ce changement de la dernière lettre a un nom : le {{irab}}. C'est le cœur du {{nahw}}." }
        ] },
        { titre: "La définition", blocs: [
          { matn: "الإِعْرابُ هُوَ تَغْييرُ أَواخِرِ الكَلِمِ لِاخْتِلافِ العَوامِلِ الدّاخِلَةِ عَلَيْها لَفْظًا أَوْ تَقْديرًا", fr: "Le {{irab}} est le changement de la fin des mots, parce que les {{amil:pl}} qui entrent sur eux sont différents, de façon prononcée ou sous-entendue." },
          { p: "Un {{amil}} est un mot qui *agit* sur un autre et fait changer sa fin. Quand le {{amil}} change, la fin change avec lui." },
          { ex: [
            ["في الكِتابِ", "[[في]] est le {{amil}} : il met la fin de [[الكِتابِ]] à la {{kasra}}.", ""],
            ["يَقْرَأُ الكِتابَ", "Ici, c'est le {{fil}} [[يَقْرَأُ]] qui agit : la fin passe à la {{fatha}}.", ""]
          ] },
          { regle: "Le {{irab}} ne touche que la *dernière lettre* du mot." }
        ] },
        { titre: "Prononcé ou sous-entendu", blocs: [
          { p: "Le plus souvent, on entend et on voit la voyelle finale : le {{irab}} est {{lafzi}}." },
          { p: "Mais certains mots finissent par un alif (écrit parfois [[ى]]), qui ne peut porter aucune voyelle. La voyelle existe quand même, on la *suppose* : le {{irab}} est {{taqdiri}}." },
          { ex: [
            ["في الكِتابِ", "« dans le livre »", "{{kasra}} visible : {{lafzi}}"],
            ["في المُصَلّى", "« dans la salle de prière »", "{{kasra}} supposée sur l'alif final : {{taqdiri}}"]
          ] },
          { p: "Le {{nazm}} reprend tout cela en deux {{bayt:pl}}, que vous allez lire maintenant." }
        ] }
      ],
      questions: [
        { id: "g2a-01", q: "Qu'est-ce que le {{irab}} ?", choix: ["Le changement de la fin des mots, selon les {{amil:pl}}", "Le changement de la première lettre des mots", "La traduction d'un mot dans le dictionnaire"], bon: 0,
          pourquoi: "Le {{irab}} est le changement de la *fin* des mots, provoqué par les {{amil:pl}} qui agissent sur eux." },
        { id: "g2a-02", q: "Dans laquelle de ces phrases le mot « livre » finit-il par une {{kasra}} ?", choix: ["[[في الكِتابِ]] « dans le livre »", "[[يَقْرَأُ الكِتابَ]] « il lit le livre »", "[[هٰذا كِتابٌ]] « voici un livre »"], bon: 0,
          pourquoi: "Après [[في]], la fin de [[الكِتابِ]] passe à la {{kasra}}. Ailleurs, c'est une {{fatha}} ou une {{damma}}." },
        { id: "g2a-03", q: "Comment appelle-t-on le mot qui fait changer la fin d'un autre ?", choix: ["Un {{amil}}", "Un {{irab}}", "Un {{kalam}}"], bon: 0,
          pourquoi: "Le {{amil}} agit ; le {{irab}} est le changement qu'il provoque." },
        { id: "g2a-04", q: "Quel mot est le {{amil}} ici ?", ar: "في الكِتابِ", fr: "dans le livre", choix: ["[[في]] « dans »", "[[الكِتابِ]] « le livre »"], bon: 0,
          pourquoi: "C'est [[في]] qui agit : il met la fin de [[الكِتابِ]] à la {{kasra}}." },
        { id: "g2a-05", q: "Quelle voyelle termine [[الكِتابَ]] ici ?", ar: "يَقْرَأُ الكِتابَ", fr: "il lit le livre", choix: ["Une {{fatha}}", "Une {{damma}}", "Une {{kasra}}"], bon: 0,
          pourquoi: "Le petit trait au-dessus de la dernière lettre, [[ـَ]], est une {{fatha}}." },
        { id: "g2a-06", q: "Où le {{irab}} se voit-il ?", choix: ["Sur la dernière lettre du mot", "Sur la première lettre du mot", "Sur tout le mot"], bon: 0,
          pourquoi: "Le {{irab}} ne touche que la fin du mot : [[كِتابٌ]], [[الكِتابَ]], [[الكِتابِ]]." },
        { id: "g2a-07", q: "Le {{irab}} est {{lafzi}} quand…", choix: ["la voyelle finale s'entend et s'écrit", "la voyelle finale ne peut pas se prononcer", "le mot n'a pas de dernière lettre"], bon: 0,
          pourquoi: "{{lafzi}} veut dire « prononcé » : la voyelle finale est bien là, comme dans [[في الكِتابِ]]." },
        { id: "g2a-08", q: "Pourquoi ne voit-on aucune {{kasra}} à la fin de [[المُصَلّى]] ?", ar: "في المُصَلّى", fr: "dans la salle de prière", choix: ["Le mot finit par un alif, qui ne peut porter aucune voyelle : le {{irab}} est {{taqdiri}}", "Après [[في]], la fin d'un {{ism}} ne change jamais", "[[المُصَلّى]] est un {{fil}}"], bon: 0,
          pourquoi: "La {{kasra}} est bien là, mais supposée : l'alif final ne peut pas la porter. C'est un {{irab}} {{taqdiri}}." }
      ]
    },
    {
      id: "g2b", titre: "Les quatre états : {{raf}}, {{nasb}}, {{khafd}}, {{jazm}}", resume: "Quatre états possibles pour la fin d'un mot, chacun avec son signe de base",
      vers: ["n015"],
      pages: [
        { titre: "Quatre états", blocs: [
          { matn: "وَأَقْسامُهُ أَرْبَعَةٌ: رَفْعٌ وَنَصْبٌ وَخَفْضٌ وَجَزْمٌ", fr: "Ses sortes sont quatre : le {{raf}}, le {{nasb}}, le {{khafd}} et le {{jazm}}." },
          { p: "Selon le {{amil}}, la fin d'un mot se trouve dans l'un de ces quatre états. Chacun a un *signe de base*, une voyelle qu'il faut savoir reconnaître." },
          { ex: [
            ["رَفْع", "Le {{raf}} : signe de base, la {{damma}} [[ـُ]].", "[[هٰذا كِتابٌ]] « voici un livre »"],
            ["نَصْب", "Le {{nasb}} : signe de base, la {{fatha}} [[ـَ]].", "[[يَقْرَأُ الكِتابَ]] « il lit le livre »"],
            ["خَفْض", "Le {{khafd}} : signe de base, la {{kasra}} [[ـِ]].", "[[في الكِتابِ]] « dans le livre »"],
            ["جَزْم", "Le {{jazm}} : signe de base, le {{sukun}} [[ـْ]].", "[[لَمْ يَذْهَبْ]] « il n'est pas parti »"]
          ] }
        ] },
        { titre: "Le {{jazm}}, un état à part", blocs: [
          { p: "Le {{jazm}} ne se pose que sur un {{fil}}. Dans [[لَمْ يَذْهَبْ]] (« il n'est pas parti »), le petit mot [[لَمْ]] est un {{amil}} : il fait tomber la voyelle finale de [[يَذْهَبُ]], qui prend un {{sukun}}." },
          { ex: [
            ["يَذْهَبُ", "« il part »", "{{raf}} : {{damma}} finale"],
            ["لَمْ يَذْهَبْ", "« il n'est pas parti »", "{{jazm}} : {{sukun}} final"]
          ] },
          { regle: "{{raf}} : {{damma}} · {{nasb}} : {{fatha}} · {{khafd}} : {{kasra}} · {{jazm}} : {{sukun}}. Ce sont les signes de base ; le {{bab}} suivant montre que chaque état en a d'autres." }
        ] }
      ],
      questions: [
        { id: "g2b-01", q: "Combien d'états le {{irab}} compte-t-il ?", choix: ["Quatre : {{raf}}, {{nasb}}, {{khafd}}, {{jazm}}", "Trois : {{raf}}, {{nasb}}, {{khafd}}", "Deux : {{lafzi}} et {{taqdiri}}"], bon: 0,
          pourquoi: "Quatre, comme dans le {{matn}} et le {{nazm}}. {{lafzi}} et {{taqdiri}} disent seulement si la voyelle se prononce." },
        { id: "g2b-02", q: "Dans quel état est [[كِتابٌ]] ici ?", ar: "هٰذا كِتابٌ", fr: "voici un livre", choix: ["Le {{raf}}", "Le {{nasb}}", "Le {{khafd}}"], bon: 0,
          pourquoi: "La fin porte une {{damma}} (doublée par le {{tanwin}} : [[ـٌ]]), le signe de base du {{raf}}." },
        { id: "g2b-03", q: "Dans quel état est [[الكِتابَ]] ici ?", ar: "يَقْرَأُ الكِتابَ", fr: "il lit le livre", choix: ["Le {{nasb}}", "Le {{raf}}", "Le {{jazm}}"], bon: 0,
          pourquoi: "La fin porte une {{fatha}}, le signe de base du {{nasb}}. Et le {{jazm}} ne va jamais sur un {{ism}}." },
        { id: "g2b-04", q: "Dans quel état est [[المَسْجِدِ]] ici ?", ar: "في المَسْجِدِ", fr: "dans la mosquée", choix: ["Le {{khafd}}", "Le {{nasb}}", "Le {{raf}}"], bon: 0,
          pourquoi: "Après [[في]], la fin passe à la {{kasra}} : c'est le {{khafd}}." },
        { id: "g2b-05", q: "Dans quel état est [[يَذْهَبْ]] ici ?", ar: "لَمْ يَذْهَبْ", fr: "il n'est pas parti", choix: ["Le {{jazm}}", "Le {{khafd}}", "Le {{raf}}"], bon: 0,
          pourquoi: "[[لَمْ]] fait tomber la voyelle finale : le {{sukun}} est le signe du {{jazm}}." },
        { id: "g2b-06", q: "Quel est le signe de base du {{nasb}} ?", choix: ["La {{fatha}}", "La {{damma}}", "Le {{sukun}}"], bon: 0,
          pourquoi: "{{nasb}} : {{fatha}}, comme dans [[يَقْرَأُ الكِتابَ]]." },
        { id: "g2b-07", q: "Quel est le signe de base du {{jazm}} ?", choix: ["Le {{sukun}}", "La {{kasra}}", "La {{fatha}}"], bon: 0,
          pourquoi: "{{jazm}} : {{sukun}}, comme dans [[لَمْ يَذْهَبْ]] « il n'est pas parti »." },
        { id: "g2b-08", q: "Quel est le signe de base du {{raf}} ?", choix: ["La {{damma}}", "La {{kasra}}", "Le {{sukun}}"], bon: 0,
          pourquoi: "{{raf}} : {{damma}}, comme dans [[هٰذا كِتابٌ]]." }
      ]
    },
    {
      id: "g2c", titre: "Ce qui va au {{ism}}, ce qui va au {{fil}}", resume: "Deux états partagés, et un état réservé à chacun",
      vers: ["n016", "n017"],
      pages: [
        { titre: "Deux états partagés", blocs: [
          { matn: "فَلِلأَسْماءِ مِنْ ذٰلِكَ الرَّفْعُ وَالنَّصْبُ وَالخَفْضُ وَلا جَزْمَ فيها، وَلِلأَفْعالِ مِنْ ذٰلِكَ الرَّفْعُ وَالنَّصْبُ وَالجَزْمُ وَلا خَفْضَ فيها", fr: "Aux {{ism:pl}} reviennent le {{raf}}, le {{nasb}} et le {{khafd}}, sans {{jazm}} ; aux {{fil:pl}}, le {{raf}}, le {{nasb}} et le {{jazm}}, sans {{khafd}}." },
          { p: "Le {{raf}} et le {{nasb}} se trouvent *des deux côtés* : sur le {{ism}} et sur le {{fil}}." },
          { ex: [
            ["هٰذا كِتابٌ", "« Voici un livre. »", "{{raf}} sur un {{ism}}"],
            ["يَذْهَبُ", "« Il part. »", "{{raf}} sur un {{fil}}"],
            ["يَقْرَأُ الكِتابَ", "« Il lit le livre. »", "{{nasb}} sur un {{ism}} : [[الكِتابَ]]"],
            ["لَنْ يَذْهَبَ", "« Il ne partira pas. »", "{{nasb}} sur un {{fil}}, après [[لَنْ]]"]
          ] },
          { p: "Attention : parmi les {{fil:pl}}, seul le {{mudari}} change de fin. Le {{madi}}, comme [[وَضَعَ]] « il a posé », garde toujours la même. Le {{nazm}} le précise : [[الْفِعْلِ الْمُضَارِعِ]]." }
        ] },
        { titre: "Un état réservé à chacun", blocs: [
          { p: "Les deux autres états ne se partagent pas." },
          { ex: [
            ["في المَدْرَسَةِ", "« à l'école »", "Le {{khafd}} : seulement sur un {{ism}}"],
            ["لَمْ يَذْهَبْ", "« il n'est pas parti »", "Le {{jazm}} : seulement sur un {{fil}}"]
          ] },
          { p: "C'est logique : les {{huruf-khafd}}, comme [[في]], se placent devant un {{ism}}, jamais devant un {{fil}}." },
          { regle: "{{khafd}} : jamais sur un {{fil}}. {{jazm}} : jamais sur un {{ism}}." }
        ] }
      ],
      questions: [
        { id: "g2c-01", q: "Lequel de ces états ne se trouve jamais sur un {{ism}} ?", choix: ["Le {{jazm}}", "Le {{khafd}}", "Le {{nasb}}"], bon: 0,
          pourquoi: "Le {{jazm}} est réservé au {{fil}}." },
        { id: "g2c-02", q: "Lequel de ces états ne se trouve jamais sur un {{fil}} ?", choix: ["Le {{khafd}}", "Le {{jazm}}", "Le {{raf}}"], bon: 0,
          pourquoi: "Le {{khafd}} est réservé au {{ism}}." },
        { id: "g2c-03", q: "Quels états le {{ism}} et le {{fil}} {{mudari}} ont-ils en commun ?", choix: ["Le {{raf}} et le {{nasb}}", "Le {{khafd}} et le {{jazm}}", "Le {{raf}} et le {{jazm}}"], bon: 0,
          pourquoi: "Le {{nazm}} le dit : [[فَالْأَوَّلَانِ]], « les deux premiers » états, vont au {{ism}} comme au {{fil}} {{mudari}}." },
        { id: "g2c-04", q: "Lequel de ces mots ne peut jamais être au {{jazm}} ?", choix: ["[[مَسْجِدٌ]] « mosquée »", "[[يَذْهَبُ]] « il part »", "[[يَسْمَعُ]] « il entend »"], bon: 0,
          pourquoi: "[[مَسْجِدٌ]] est un {{ism}}, et le {{jazm}} ne va jamais sur un {{ism}}. Les deux autres sont des {{fil:pl}}." },
        { id: "g2c-05", q: "Lequel de ces mots ne peut jamais être au {{khafd}} ?", choix: ["[[يَقْرَأُ]] « il lit »", "[[كِتابٌ]] « livre »", "[[مَدْرَسَةٌ]] « école »"], bon: 0,
          pourquoi: "[[يَقْرَأُ]] est un {{fil}}, et le {{khafd}} ne va jamais sur un {{fil}}. Les deux autres sont des {{ism:pl}}." },
        { id: "g2c-06", q: "Quel {{fil}} change de fin selon le {{irab}} ?", choix: ["Le {{mudari}}", "Le {{madi}}", "Aucun {{fil}}"], bon: 0,
          pourquoi: "Seul le {{mudari}} change : [[يَذْهَبُ]], [[لَنْ يَذْهَبَ]], [[لَمْ يَذْهَبْ]]. Le {{madi}} garde sa fin." },
        { id: "g2c-07", q: "Dans quel état est ce {{fil}} ?", ar: "يَذْهَبُ", fr: "il part", choix: ["Le {{raf}}", "Le {{khafd}}", "Le {{jazm}}"], bon: 0,
          pourquoi: "La {{damma}} finale est le signe du {{raf}}. Le {{khafd}} est d'ailleurs impossible sur un {{fil}}." },
        { id: "g2c-08", q: "Pourquoi [[المَدْرَسَةِ]] peut-il être au {{khafd}} ?", ar: "في المَدْرَسَةِ", fr: "à l'école", choix: ["Parce que c'est un {{ism}}", "Parce que c'est un {{fil}}", "Parce que c'est un {{harf}}"], bon: 0,
          pourquoi: "Seul le {{ism}} accepte le {{khafd}} : [[مَدْرَسَةٌ]] est un {{ism}}." }
      ]
    }
  ]
});
