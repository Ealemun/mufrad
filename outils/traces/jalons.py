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
HA_MILIEU = [[662, 379], [555, 379], [550, 327], [500, 324], [384, 311], [500, 324], [337, 379], [325, 379]]
HA_FIN = [[640, 378], [582, 340], [509, 320], [383, 328], [480, 321], [616, 552]]
# س ش : chaque dent montée puis redescendue, de droite à gauche
SIN_DEBUT = [[596, 293], [598, 318], [549, 344], [547, 311], [549, 344], [456, 358], [460, 332], [456, 358], [370, 379], [352, 379]]
SIN_MILIEU = [[672, 379], [659, 379], [584, 346], [585, 325], [584, 346], [522, 355], [526, 328], [522, 355], [426, 358], [431, 333], [426, 358], [340, 379], [325, 379]]
SIN_FIN = [[705, 378], [696, 378], [620, 345], [620, 326], [620, 345], [557, 354], [562, 326], [557, 354], [499, 375], [489, 343], [499, 375], [336, 391]]
# ص ض : la boucle (du bas à gauche, par le haut, puis le retour par le bas), la dent, l'attache ou la cuvette
SAD_DEBUT = [[492, 377], [513, 310], [598, 279], [624, 317], [565, 354], [492, 377], [418, 356], [422, 331], [418, 356], [329, 379], [315, 379]]
SAD_MILIEU = [[700, 379], [566, 375], [476, 379], [574, 282], [602, 312], [566, 375], [476, 379], [402, 357], [406, 329], [402, 357], [315, 379], [300, 379]]
SAD_FIN = [[735, 379], [605, 375], [516, 379], [616, 279], [645, 297], [605, 375], [516, 379], [469, 377], [460, 341], [469, 377], [306, 391]]
# ط ظ : la boucle et la base, puis la hampe de haut en bas (comme la forme isolée)
TA_DEBUT = [[[447, 377], [464, 334], [568, 280], [600, 320], [530, 360], [447, 377], [365, 379]], [[448, 120], [447, 377]]]
TA_MILIEU = [[[655, 379], [524, 375], [429, 378], [441, 343], [543, 281], [579, 317], [524, 375], [429, 378], [345, 380]], [[430, 119], [429, 378]]]
TA_FIN = [[[665, 379], [560, 381], [445, 378], [464, 336], [557, 279], [590, 310], [551, 357], [538, 374], [445, 378], [350, 362]], [[453, 121], [445, 378]]]
# ع غ : la tête, la lèvre jusqu'à sa pointe et retour, puis l'attache ou la cuvette
AYN_DEBUT = [[565, 268], [483, 347], [593, 305], [483, 347], [394, 379], [378, 379]]
AYN_MILIEU = [[618, 378], [560, 374], [522, 345, 1], [542, 306, 1], [500, 291, 1], [460, 305, 1], [456, 321, 1], [502, 336, 1], [450, 366], [397, 379], [383, 379]]
AYN_FIN = [[628, 378], [560, 360], [506, 330, 1], [526, 300, 1], [482, 288, 1], [440, 302, 1], [438, 318, 1], [488, 330, 1], [455, 380], [634, 554]]
# ف ق : la tête (montée à gauche, par le haut, redescente à droite), puis l'attache ou la cuvette
FA_DEBUT = [[510, 340], [497, 312], [520, 285], [548, 300], [550, 345], [520, 372], [434, 379], [402, 379]]
FA_MILIEU = [[615, 379], [518, 359], [486, 358], [482, 325], [505, 302], [527, 325], [518, 359], [486, 358], [395, 378], [382, 378]]
FA_FIN = [[712, 379], [612, 364], [584, 364], [580, 330], [598, 295], [618, 325], [612, 364], [584, 364], [339, 315]]

FORMES = {
    "ا": {"fin": [[[556, 379], [472, 138]]]},
    "ب": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"], "fin": [CUVETTE_FIN, "points"]},
    "ت": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"], "fin": [CUVETTE_FIN, "points"]},
    "ث": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"], "fin": [CUVETTE_FIN, "points"]},
    "ج": {"debut": [HA_DEBUT, "points"], "milieu": [HA_MILIEU, "points"], "fin": [HA_FIN, "points"]},
    "ح": {"debut": [HA_DEBUT], "milieu": [HA_MILIEU], "fin": [HA_FIN]},
    "خ": {"debut": [HA_DEBUT, "points"], "milieu": [HA_MILIEU, "points"], "fin": [HA_FIN, "points"]},
    "د": {"fin": [[[609, 379], [527, 330], [515, 199], [527, 330], [412, 335]]]},
    "ذ": {"fin": [[[609, 379], [527, 330], [515, 199], [527, 330], [412, 335]], "points"]},
    "ر": {"fin": [[[590, 379], [529, 379], [513, 346], [529, 379], [395, 497]]]},
    "ز": {"fin": [[[590, 379], [529, 379], [513, 346], [529, 379], [395, 497]], "points"]},
    "س": {"debut": [SIN_DEBUT], "milieu": [SIN_MILIEU], "fin": [SIN_FIN]},
    "ش": {"debut": [SIN_DEBUT, "points"], "milieu": [SIN_MILIEU, "points"], "fin": [SIN_FIN, "points"]},
    "ص": {"debut": [SAD_DEBUT], "milieu": [SAD_MILIEU], "fin": [SAD_FIN]},
    "ض": {"debut": [SAD_DEBUT, "points"], "milieu": [SAD_MILIEU, "points"], "fin": [SAD_FIN, "points"]},
    "ط": {"debut": TA_DEBUT, "milieu": TA_MILIEU, "fin": TA_FIN},
    "ظ": {"debut": TA_DEBUT + ["points"], "milieu": TA_MILIEU + ["points"], "fin": TA_FIN + ["points"]},
    "ع": {"debut": [AYN_DEBUT], "milieu": [AYN_MILIEU], "fin": [AYN_FIN]},
    "غ": {"debut": [AYN_DEBUT, "points"], "milieu": [AYN_MILIEU, "points"], "fin": [AYN_FIN, "points"]},
    "ف": {"debut": [FA_DEBUT, "points"], "milieu": [FA_MILIEU, "points"], "fin": [FA_FIN, "points"]},
    "ق": {"debut": [FA_DEBUT, "points"], "milieu": [FA_MILIEU, "points"],
          "fin": [[[640, 379], [574, 379], [545, 370], [535, 335], [560, 302], [590, 325], [585, 370], [574, 379], [416, 360]], "points"]},
    # ك : le corps (l'angle puis la base), puis le trait du haut ; à la fin, la hampe montée depuis l'attache puis redescendue
    "ك": {"debut": [[[412, 210], [480, 300], [382, 379], [365, 379]], [[623, 120], [412, 210]]],
          "milieu": [[[662, 379], [496, 297], [350, 379], [335, 379]], [[601, 89], [420, 195], [496, 297]]],
          "fin": [[[700, 379], [609, 332], [595, 135], [609, 332], [343, 313]], [[486, 186], [421, 287]]]},
    "ل": {"debut": [[[515, 122], [445, 378], [430, 378]]],
          "milieu": [[[592, 379], [505, 335], [496, 129], [505, 335], [421, 379], [405, 379]]],
          "fin": [[[632, 379], [550, 358], [540, 136], [550, 358], [405, 399]]]},
    "م": {"debut": [[[508, 335], [543, 345], [557, 312], [537, 287], [507, 320], [508, 335], [415, 379], [400, 379]]],
          "milieu": [[[640, 379], [527, 359], [465, 353], [462, 339], [490, 301], [516, 340], [527, 359], [506, 370], [465, 353], [373, 379], [360, 379]]],
          "fin": [[[620, 379], [482, 370], [489, 424], [482, 370], [423, 582]]]},
    "ن": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"],
          "fin": [[[632, 352], [590, 352], [576, 378], [564, 342], [576, 378], [545, 488], [465, 505], [406, 389]], "points"]},
    "ه": {"debut": [[[484, 266], [528, 282], [578, 321], [583, 346], [528, 349], [507, 346], [483, 340], [471, 321], [478, 293], [503, 271], [522, 300], [506, 331], [481, 345], [395, 379], [380, 379]]],
          "milieu": [[[630, 379], [514, 388], [537, 431], [506, 462], [469, 431], [479, 379], [469, 344], [490, 300], [527, 273], [522, 331], [481, 371], [383, 379], [370, 379]]],
          "fin": [[[592, 379], [509, 333], [500, 281], [502, 234], [500, 281], [449, 341], [434, 346], [449, 341], [509, 333]]]},
    "و": {"fin": [[[600, 379], [530, 379], [495, 374], [478, 345], [505, 318], [530, 345], [530, 379], [465, 468], [383, 493]]]},
    "ي": {"debut": [DENT_DEBUT, "points"], "milieu": [DENT_MILIEU, "points"],
          # fin : les deux points sont un peu remontés, la police les pose au ras du bas du tableau
          "fin": [[[650, 379], [637, 379], [560, 380], [550, 420], [600, 445], [520, 500], [406, 383]], [[492, 562]], [[451, 566]]]},
}
