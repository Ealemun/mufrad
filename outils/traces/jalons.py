# Points de passage des formes de position (début, milieu, fin de mot), dans le repère 1000 × 600 du tableau.
# Chaque trait est suivi sur la ligne médiane de la lettre dessinée par la police (Scheherazade New), de jalon en jalon :
# on ne donne que les étapes (départ, sommets, retours, arrivée), le chemin exact vient de la police.
# "points" : les points de la lettre, posés à leur place dans la police, de droite à gauche (les deux du bas, puis celui du haut).
# Règles suivies, comme pour la forme isolée : le corps d'abord ; une lettre attachée à la précédente commence par son
# attache, à droite ; une lettre attachée à la suivante finit par son attache, à gauche ; les points ensuite.

# Dents (ب ت ث ن ي au début et au milieu) : la dent de haut en bas, puis l'attache vers la gauche
DENT_DEBUT = [[522, 279], [440, 380], [398, 379]]
DENT_MILIEU = [[640, 379], [573, 379], [513, 357], [517, 332], [513, 357], [426, 379], [410, 379]]
# ب ت ث à la fin : arrivée par la droite, la dent, puis la cuvette jusqu'à la pointe gauche
CUVETTE_FIN = [[700, 379], [690, 379], [612, 362], [615, 342], [612, 362], [344, 291]]
# ج ح خ : la tête de gauche à droite puis le retour qui descend (comme la forme isolée)
HA_DEBUT = [[407, 314], [524, 324], [620, 318], [524, 324], [362, 379], [345, 379]]
# Au milieu et à la fin, on lève le crayon : l'attache qui arrive par la droite (avec la lettre d'avant), puis la lettre
# comme au début (tête de gauche à droite, retour, descente) ; la forme isolée est celle du début avec l'arrondi en bas.
HA_MILIEU = [[[662, 379], [555, 379], [550, 327]], [[384, 311], [500, 324], [597, 316], [500, 324], [337, 379], [325, 379]]]
HA_FIN = [[[640, 378], [578, 303]], [[383, 328], [480, 321], [578, 303], [480, 321], [616, 552]]]
HA_ISOLEE = [[385, 330], [483, 319], [580, 302], [483, 319], [623, 552]]
# س ش : chaque dent montée puis redescendue, de droite à gauche
SIN_DEBUT = [[596, 293], [598, 318], [549, 344], [547, 311], [549, 344], [456, 358], [460, 332], [456, 358], [370, 379], [352, 379]]
SIN_MILIEU = [[672, 379], [659, 379], [584, 346], [585, 325], [584, 346], [522, 355], [526, 328], [522, 355], [426, 358], [431, 333], [426, 358], [340, 379], [325, 379]]
SIN_FIN = [[705, 378], [696, 378], [620, 345], [620, 326], [620, 345], [557, 354], [562, 326], [557, 354], [499, 375], [489, 343], [499, 375], [336, 391]]
# ص ض : la boucle (du bas à gauche, par le haut, puis le retour par le bas), la dent, l'attache ou la cuvette
SAD_DEBUT = [[492, 377], [513, 310], [598, 279], [624, 317], [565, 354], [492, 377], [418, 356], [422, 331], [418, 356], [329, 379], [315, 379]]
# Au milieu et à la fin, on lève le crayon : l'attache qui arrive par la droite, puis la lettre comme au début
SAD_MILIEU = [[[700, 379], [566, 375]], [[476, 379], [574, 282], [602, 312], [566, 375], [476, 379], [402, 357], [406, 329], [402, 357], [315, 379], [300, 379]]]
SAD_FIN = [[[735, 379], [605, 375]], [[516, 379], [616, 279], [645, 297], [605, 375], [516, 379], [469, 377], [460, 341], [469, 377], [306, 391]]]
# ط ظ : la boucle et la base, puis la hampe de haut en bas (comme la forme isolée)
TA_DEBUT = [[[447, 377], [464, 334], [568, 280], [600, 320], [530, 360], [447, 377], [365, 379]], [[448, 120], [447, 377]]]
TA_MILIEU = [[[655, 379], [524, 375], [429, 378], [441, 343], [543, 281], [579, 317], [524, 375], [429, 378], [345, 380]], [[430, 119], [429, 378]]]
TA_FIN = [[[665, 379], [560, 381], [445, 378], [464, 336], [557, 279], [590, 310], [551, 357], [538, 374], [445, 378], [350, 362]], [[453, 121], [445, 378]]]
# ع غ : la tête, la lèvre jusqu'à sa pointe et retour, puis l'attache ou la cuvette
# ع غ hors forme isolée : la tête est un triangle au haut plat, dont le dernier côté croise le premier : on monte vers la
# gauche, on trace le haut de gauche à droite, puis on redescend vers la gauche en croisant le premier trait.
# Trois coins seulement (pas de petite vague, facile à reproduire à la main).
AYN_DEBUT = [[560, 338, 1], [465, 258, 1], [548, 258, 1], [468, 348, 1], [394, 379], [378, 379]]
AYN_MILIEU = [[618, 378], [560, 372], [462, 298, 1], [545, 298, 1], [470, 350, 1], [397, 379], [383, 379]]
AYN_FIN = [[628, 378], [560, 365], [440, 290, 1], [530, 290, 1], [455, 350, 1], [455, 380], [634, 554]]
# Au début, la tête a la taille de celle de la forme isolée (sinon la plume la remplit) et part comme elle de son attache
FA_DEBUT = [[538, 324, 1], [502, 326, 1], [468, 302, 1], [470, 270, 1], [500, 254, 1], [532, 266, 1], [543, 296, 1], [536, 326, 1], [524, 354, 1], [480, 375], [434, 379], [402, 379]]
FA_MILIEU = [[615, 379], [518, 359], [486, 358], [482, 325], [505, 302], [527, 325], [518, 359], [486, 358], [395, 378], [382, 378]]
FA_FIN = [[712, 379], [612, 364], [584, 364], [580, 330], [598, 295], [618, 325], [612, 364], [584, 364], [339, 315]]

FORMES = {
    "ا": {"fin": [[[556, 379], [472, 138]]]},
    "ب": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"], "fin": [CUVETTE_FIN, "points"]},
    "ت": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"], "fin": [CUVETTE_FIN, "points"]},
    "ث": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"], "fin": [CUVETTE_FIN, "points"]},
    "ج": {"isolee": [HA_ISOLEE, "points"], "debut": [HA_DEBUT, "points"], "milieu": HA_MILIEU + ["points"], "fin": HA_FIN + ["points"]},
    "ح": {"isolee": [HA_ISOLEE], "debut": [HA_DEBUT], "milieu": HA_MILIEU, "fin": HA_FIN},
    "خ": {"isolee": [HA_ISOLEE, "points"], "debut": [HA_DEBUT, "points"], "milieu": HA_MILIEU + ["points"], "fin": HA_FIN + ["points"]},
    # د ذ : la forme isolée reprend le dessin de la forme de fin, sans l'attache (même allure dans toutes les formes)
    "د": {"isolee": {"glyphe": "fin", "traits": [[[515, 199], [527, 330], [412, 335]]]}, "fin": [[[609, 379], [527, 330], [515, 199], [527, 330], [412, 335]]]},
    "ذ": {"isolee": {"glyphe": "fin", "traits": [[[515, 199], [527, 330], [412, 335]], "points"]}, "fin": [[[609, 379], [527, 330], [515, 199], [527, 330], [412, 335]], "points"]},
    "ر": {"fin": [[[590, 379], [529, 379], [513, 346], [529, 379], [395, 497]]]},
    "ز": {"fin": [[[590, 379], [529, 379], [513, 346], [529, 379], [395, 497]], "points"]},
    "س": {"debut": [SIN_DEBUT], "milieu": [SIN_MILIEU], "fin": [SIN_FIN]},
    "ش": {"debut": [SIN_DEBUT, "points"], "milieu": [SIN_MILIEU, "points"], "fin": [SIN_FIN, "points"]},
    "ص": {"debut": [SAD_DEBUT], "milieu": SAD_MILIEU, "fin": SAD_FIN},
    "ض": {"debut": [SAD_DEBUT, "points"], "milieu": SAD_MILIEU + ["points"], "fin": SAD_FIN + ["points"]},
    "ط": {"debut": TA_DEBUT, "milieu": TA_MILIEU, "fin": TA_FIN},
    "ظ": {"debut": TA_DEBUT + ["points"], "milieu": TA_MILIEU + ["points"], "fin": TA_FIN + ["points"]},
    "ع": {"debut": [AYN_DEBUT], "milieu": [AYN_MILIEU], "fin": [AYN_FIN]},
    "غ": {"debut": [AYN_DEBUT, "points"], "milieu": [AYN_MILIEU, "points"], "fin": [AYN_FIN, "points"]},
    "ف": {"debut": [FA_DEBUT, "points"], "milieu": [FA_MILIEU, "points"], "fin": [FA_FIN, "points"]},
    "ق": {"debut": [FA_DEBUT, "points"], "milieu": [FA_MILIEU, "points"],
          "fin": [[[640, 379], [574, 379], [545, 370], [535, 335], [560, 302], [590, 325], [585, 370], [574, 379], [416, 360]], "points"]},
    # ك : le corps (l'angle puis la base), puis le trait du haut ; à la fin, la hampe montée depuis l'attache puis redescendue
    "ك": {"debut": [[[412, 210], [480, 300], [382, 379], [365, 379]], [[623, 120], [412, 210]]],
          # milieu : comme au début, en levant le crayon : l'attache qui arrive, l'arrondi puis la base, et la barre du haut
          "milieu": [[[662, 379], [496, 297]], [[420, 195], [496, 297], [350, 379], [335, 379]], [[601, 89], [420, 195]]],
          "fin": [[[700, 379], [609, 332], [595, 135], [609, 332], [343, 313]], [[486, 186], [421, 287]]]},
    "ل": {"debut": [[[515, 122], [445, 378], [430, 378]]],
          "milieu": [[[592, 379], [505, 335], [496, 129], [505, 335], [421, 379], [405, 379]]],
          "fin": [[[632, 379], [550, 358], [540, 136], [550, 358], [405, 399]]]},
    # م : on part du bas de la tête, on monte au sommet, on fait le tour de la tête pour revenir au sommet, puis on
    # redescend vers la queue ou l'attache. Au milieu, l'attache arrive en bas à droite ; à la fin, elle arrive au sommet.
    "م": {"isolee": [[[530, 338, 1], [541, 315, 1], [505, 288, 1], [470, 305, 1], [470, 330, 1], [500, 342, 1], [530, 338, 1], [541, 315, 1], [505, 288, 1], [470, 305, 1], [462, 335, 1], [458, 380], [476, 563]]],
          "debut": [[[545, 345, 1], [557, 315, 1], [540, 288, 1], [512, 300, 1], [506, 325, 1], [520, 343, 1], [545, 345, 1], [557, 315, 1], [540, 288, 1], [512, 300, 1], [506, 325, 1], [495, 345, 1], [415, 379], [400, 379]]],
          "milieu": [[[640, 379], [527, 359], [522, 330, 1], [495, 302, 1], [470, 318, 1], [463, 345, 1], [490, 362, 1], [522, 355, 1], [522, 330, 1], [495, 302, 1], [470, 318, 1], [463, 345, 1], [440, 370, 1], [373, 379], [360, 379]]],
          "fin": [[[620, 379], [482, 370], [508, 392, 1], [492, 424, 1], [470, 402, 1], [482, 370, 1], [450, 376, 1], [430, 400], [423, 582]]]},
    "ن": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"],
          "fin": [[[632, 352], [590, 352], [576, 378], [564, 342], [576, 378], [545, 488], [465, 505], [406, 389]], "points"]},
    "ه": {"debut": [[[484, 266], [528, 282], [578, 321], [583, 346], [528, 349], [507, 346], [483, 340], [471, 321], [478, 293], [503, 271], [522, 300], [506, 331], [481, 345], [395, 379], [380, 379]]],
          # milieu : deux boucles régulières (posées à la main, la police est trop irrégulière pour une écriture manuscrite)
          "milieu": [[[630, 379], [560, 379], [526, 384, 1], [541, 412, 1], [537, 444, 1], [506, 461, 1], [476, 448, 1], [467, 418, 1], [476, 390, 1], [481, 370, 1], [471, 343, 1], [482, 310, 1], [505, 285, 1], [526, 272, 1], [529, 296, 1], [519, 329, 1], [497, 356, 1], [478, 375, 1], [440, 379], [383, 379], [370, 379]]],
          "fin": [[[592, 379], [509, 333], [500, 281], [502, 234], [500, 281], [449, 341], [434, 346], [449, 341], [509, 333]]]},
    "و": {"fin": [[[600, 379], [530, 379], [495, 374], [478, 345], [505, 318], [530, 345], [530, 379], [465, 468], [383, 493]]]},
    "ي": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"],
          # fin : les deux points sont un peu remontés, la police les pose au ras du bas du tableau
          "fin": [[[650, 379], [637, 379], [560, 380], [550, 420], [600, 445], [520, 500], [406, 383]], [[492, 562]], [[451, 566]]]},
}
