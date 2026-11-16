"use strict";
/* Mufrad — le poème : Naẓm al-Ājurrūmiyya de ʿUbayd Rabbih Muḥammad b. Ābbah al-Qallāwī ash-Shinqīṭī
   (début du XIIᵉ s. H), la grammaire d'Ibn Ājurrūm mise en vers.
   Texte arabe recopié de l'édition établie sur manuscrits par ʿAbdallāh b. Muḥammad Sufyān al-Ḥakamī (1427 H),
   voyelles et ponctuation comprises ; seule l'orthographe du ى final est celle du clavier courant.
   RÈGLE : on ne recopie un vers que depuis cette édition, page sous les yeux, jamais de mémoire ni d'un site.
   Les traductions donnent le sens, rédigées pour Mufrad. À relire par un enseignant.
   Un vers = { id, bab, babAr, a (صَدْر), b (عَجُز), fr }. L'ordre du fichier est celui du poème.
   Dans fr, {{id}} affiche un terme du glossaire, comme dans les leçons (les vers n001 à n012 n'en ont pas encore).
   Un identifiant ne change jamais : la progression des apprenants est rangée par identifiant. */
NAZM.push(
  { id: "n001", bab: "intro", babAr: "المُقَدِّمَة", a: "قَالَ عُبَيْدُ رَبِّهِ مُحَمَّدُ", b: "اللهَ فِي كُلِّ الْأُمُورِ أَحْمَدُ",
    fr: "Le petit serviteur de son Seigneur, Muhammad, a dit : c'est Allah que je loue en toute chose," },
  { id: "n002", bab: "intro", babAr: "المُقَدِّمَة", a: "مُصَلِّيًا عَلَى الرَّسُولِ الْمُنْتَقَى", b: "وَآلِهِ وَصَحْبِهِ ذَوِي التُّقَى",
    fr: "en priant sur le Messager choisi, sur sa famille et sur ses compagnons, gens de piété." },
  { id: "n003", bab: "intro", babAr: "المُقَدِّمَة", a: "وَبَعْدُ: فَالْقَصْدُ بِذَا الْمَنْظُومِ", b: "تَسْهِيلُ مَنْثُورِ ابْنِ آجُرُّومِ",
    fr: "Ensuite : le but de ce poème est de rendre plus facile le texte en prose d'Ibn Ājurrūm" },
  { id: "n004", bab: "intro", babAr: "المُقَدِّمَة", a: "لِمَنْ أَرَادَ حِفْظَهُ وَعَسُرَا", b: "عَلَيْهِ أَنْ يَحْفَظَ مَا قَدْ نُثِرَا",
    fr: "pour celui qui veut le retenir et trouve difficile de mémoriser ce qui est en prose." },
  { id: "n005", bab: "intro", babAr: "المُقَدِّمَة", a: "وَاللهَ أَسْتَعِينُ فِي كُلِّ عَمَلْ", b: "إِلَيْهِ قَصْدِي وَعَلَيْهِ الْمُتَّكَلْ",
    fr: "C'est à Allah que je demande l'aide en toute œuvre ; c'est vers Lui que je me dirige et sur Lui que je m'appuie." },

  { id: "n006", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "إِنَّ الْكَلَامَ عِنْدَنَا فَلْتَسْتَمِعْ", b: "لَفْظٌ مُرَكَّبٌ مُفِيدٌ قَدْ وُضِعْ",
    fr: "La parole, chez nous — écoute bien —, est un énoncé prononcé, composé, porteur d'un sens complet, établi par l'usage." },
  { id: "n007", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "أَقْسَامُهُ الَّتِي عَلَيْهَا يُبْنَى", b: "اِسْمٌ وَفِعْلٌ ثُمَّ حَرْفُ مَعْنَى",
    fr: "Ses parties, sur lesquelles elle est bâtie : le nom, le verbe, puis la particule de sens." },
  { id: "n008", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "فَالِاسْمُ بِالْخَفْضِ وَبِالتَّنْوِينِ أَوْ", b: "دُخُولِ «أَلْ» يُعْرَفُ فَاقْفُ مَا قَفَوْا",
    fr: "Le nom se reconnaît au khafd, au tanwin ou à l'entrée de « al » : suis la voie qu'ils ont suivie." },
  { id: "n009", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَبِحُرُوفِ الْخَفْضِ وَهْيَ مِنْ، إِلَى", b: "وَعَنْ، وَفِي، وَرُبَّ، وَالْبَا، وَعَلَى",
    fr: "Et aux particules du khafd, qui sont : min, ila, ’an, fi, rubba, bi- et ’ala," },
  { id: "n010", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَالْكَافُ، وَاللَّامُ، وَوَاوٌ، وَالتَّا", b: "وَمُذْ، وَمُنْذُ، وَلَعَلَّ، حَتَّى",
    fr: "ka-, li-, le waw et le ta’ (du serment), mudh, mundhu, la’alla et hatta." },
  { id: "n011", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَالْفِعْلُ بِالسِّينِ، وَسَوْفَ، وَبِقَدْ", b: "فَاعْلَمْ، وَتَا التَّأْنِيثِ، مَيْزُهُ وَرَدْ",
    fr: "Le verbe se reconnaît au sin, à sawfa et à qad, sache-le ; le ta’ du féminin sert aussi à le distinguer." },
  { id: "n012", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَالْحَرْفُ يُعْرَفُ بِأَلَّا يَقْبَلَا", b: "لِاسْمٍ وَلَا فِعْلٍ دَلِيلًا كَـ«بَلَى»",
    fr: "La particule se reconnaît à ce qu'elle n'accepte aucun signe du nom ni du verbe, comme bala." },

  // بَابُ الإِعْرَابِ : image 8 de l'édition (page ٢). Dans les traductions, {{id}} affiche un terme du glossaire.
  // n013 : l'édition marque d'un petit نَ rouge le tanwin de تَقْدِيرًا et d'un signe de waṣl l'alif de أَوْ :
  // on lit « taqdīrana w-lafẓan », la hamza de أَوْ tombe pour le mètre. On l'écrit avec l'alif waṣla (ٱ).
  { id: "n013", bab: "irab", babAr: "بَابُ الإِعْرَابِ", a: "الإِعْرَابُ تَغْيِيرُ أَوَاخِرِ الْكَلِمْ", b: "تَقْدِيرًا ٱوْ لَفْظًا فَذَا الْحَدَّ اغْتَنِمْ",
    fr: "Le {{irab}} est le changement de la fin des mots, sous-entendu ou prononcé : cette définition, saisis-la." },
  { id: "n014", bab: "irab", babAr: "بَابُ الإِعْرَابِ", a: "وَذَلِكَ التَّغْيِيرُ لِاضْطِرَابِ", b: "عَوَامِلٍ تَدْخُلُ لِلإِعْرَابِ",
    fr: "Ce changement vient de ce que des {{amil:pl}} différents se succèdent sur le mot pour y produire le {{irab}}." },
  { id: "n015", bab: "irab", babAr: "بَابُ الإِعْرَابِ", a: "أَقْسَامُهُ: أَرْبَعَةٌ تُؤَمْ", b: "رَفْعٌ، وَنَصْبٌ، ثُمَّ خَفْضٌ، جَزْمُ",
    fr: "Ses sortes, que l'on vise, sont quatre : le {{raf}}, le {{nasb}}, puis le {{khafd}}, et le {{jazm}}." },
  { id: "n016", bab: "irab", babAr: "بَابُ الإِعْرَابِ", a: "فَالْأَوَّلَانِ دُونَ رَيْبٍ وَقَعَا", b: "فِي الِاسْمِ وَالْفِعْلِ الْمُضَارِعِ مَعَا",
    fr: "Les deux premières se trouvent, sans aucun doute, à la fois dans le {{ism}} et dans le {{fil}} {{mudari}}." },
  { id: "n017", bab: "irab", babAr: "بَابُ الإِعْرَابِ", a: "وَالِاسْمُ قَدْ خُصِّصَ بِالْخَفْضِ كَمَا", b: "قَدْ خُصِّصَ الْفِعْلُ بِجَزْمٍ فَاعْلَمَا",
    fr: "Le {{ism}} a reçu en propre le {{khafd}}, comme le {{fil}} a reçu en propre le {{jazm}} : sache-le." }
);
