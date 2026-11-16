"use strict";
/* Mufrad — le poème : Naẓm al-Ājurrūmiyya de Muḥammad b. Ābb al-Qalāwī ash-Shinqīṭī (XIIᵉ s. H),
   la grammaire d'Ibn Ājurrūm mise en vers. Texte arabe repris tel quel de l'édition en ligne de Wikisource
   (ar.wikisource.org, page « نظم الآجرومية »), y compris ses voyelles ; seul le second hémistiche du vers n010,
   imprimé sans voyelles, a été vocalisé ici. Certaines copies commencent par « قال عبيد ربه محمد ».
   Les traductions donnent le sens, rédigées pour Mufrad. À relire par un enseignant.
   Un vers = { id, bab, babAr, a (premier hémistiche), b (second hémistiche), fr }. L'ordre du fichier est celui du poème.
   Un identifiant ne change jamais : la progression des apprenants est rangée par identifiant. */
NAZM.push(
  { id: "n001", bab: "intro", babAr: "المُقَدِّمَة", a: "قَالَ ابْنُ آبَّ وَاسْمُهُ مُحَمَّدُ", b: "اللهَ فِي كُلِّ الأُمُورِ أَحْمَدُ",
    fr: "Ibn Abb, dont le nom est Muhammad, a dit : c'est Allah que je loue en toute chose," },
  { id: "n002", bab: "intro", babAr: "المُقَدِّمَة", a: "مُصَلِّيًا عَلَى الرَّسُولِ المُنْتَقَى", b: "وَآلِهِ وَصَحْبِهِ ذَوِي التُّقَى",
    fr: "en priant sur le Messager choisi, sur sa famille et sur ses compagnons, gens de piété." },
  { id: "n003", bab: "intro", babAr: "المُقَدِّمَة", a: "وَبَعْدُ فَالقَصْدُ بِذَا المَنْظُومِ", b: "تَسْهِيلُ مَنْثُورِ ابْنِ آجُرُّومِ",
    fr: "Ensuite : le but de ce poème est de rendre plus facile le texte en prose d'Ibn Ājurrūm" },
  { id: "n004", bab: "intro", babAr: "المُقَدِّمَة", a: "لِمَنْ أَرَادَ حِفْظَهُ وَعَسُرَا", b: "عَلَيْهِ أَنْ يَحْفَظَ مَا قَدْ نُثِرَا",
    fr: "pour celui qui veut le retenir et trouve difficile de mémoriser ce qui est en prose." },
  { id: "n005", bab: "intro", babAr: "المُقَدِّمَة", a: "واللهَ أَسْتَعِينُ فِي كُلِّ عَمَلْ", b: "إِلَيْهِ قَصْدِي وَعَلَيْهِ المُتَّكَلْ",
    fr: "C'est à Allah que je demande l'aide en toute œuvre ; c'est vers Lui que je me dirige et sur Lui que je m'appuie." },

  { id: "n006", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "إِنَّ الكَلاَمَ عِنْدَنَا فَلْتَسْتَمِعْ", b: "لَفْظٌ مُرَكَّبٌ مُفِيدٌ قَدْ وُضِعْ",
    fr: "La parole, chez nous — écoute bien —, est un énoncé prononcé, composé, porteur d'un sens complet, établi par l'usage." },
  { id: "n007", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "أَقْسَامُهُ الَّتِي عَلَيْهَا يُبْنَى", b: "اِسْمٌ وَفِعْلٌ ثُمَّ حَرْفُ مَعْنَى",
    fr: "Ses parties, sur lesquelles elle est bâtie : le nom, le verbe, puis la particule de sens." },
  { id: "n008", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "فَالاِسْمُ بِالخَفْضِ وَبِالتَّنْوِينِ أَوْ", b: "دُخُولِ أَلْ يُعْرَفُ فَاقْفُ مَا قَفَوا",
    fr: "Le nom se reconnaît au khafd, au tanwin ou à l'entrée de « al » : suis la voie qu'ils ont suivie." },
  { id: "n009", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَبِحُرُوفِ الجَرِّ وَهْيَ مِنْ إِلَى", b: "وَعَنْ وَفِي وَرُبَّ وَالبَا وَعَلَى",
    fr: "Et aux particules du jarr, qui sont : min, ila, ’an, fi, rubba, bi- et ’ala," },
  { id: "n010", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَالكَافُ والَّلاَمُ وَوَاوٌ وَالتَّا", b: "وَمُذْ وَمُنْذُ وَلَعَلَّ حَتَّى",
    fr: "ka-, li-, le waw et le ta’ (du serment), mudh, mundhu, la’alla et hatta." },
  { id: "n011", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَالفِعْلُ بِالسِّينِ وَسَوْفَ وَبِقَدْ", b: "فَاعْلَمْ وَتَا التَّأْنِيثِ مَيْزُهُ وَرَدْ",
    fr: "Le verbe se reconnaît au sin, à sawfa et à qad, sache-le ; le ta’ du féminin sert aussi à le distinguer." },
  { id: "n012", bab: "kalam", babAr: "بَابُ الْكَلَامِ", a: "وَالحَرْفُ يُعْرَفُ بِأَلاَّ يَقْبَلاَ", b: "لاِسْمٍ وَلاَ فِعْلٍ دَلِيلاً كَبَلَى",
    fr: "La particule se reconnaît à ce qu'elle n'accepte aucun signe du nom ni du verbe, comme bala." }
);
