"use strict";
/* Mufrad — sorte de chaque mot du vocabulaire (اِسْم، فِعْل، حَرْف), pour fabriquer des exercices à volonté.
   On ne liste que les فِعْل et les حَرْف : tout autre mot des unités est un اِسْم.
   « hors » écarte ce qui ne doit pas servir de question : les expressions de plusieurs mots, les mots composés
   (particule + nom, nom + pronom) et les mots dont la sorte ne se prouve pas encore avec les signes vus
   (mots interrogatifs, عِنْدَ، بَعْدَ). Les mots ajoutés depuis l'application ne sont jamais utilisés.
   Classement fait pour Mufrad. À relire par un enseignant. */
NATURES_MOTS.fil = ["x24", "x25", "x26", "u3-05", "u3-13", "u3-15", "u3-17", "u3-52", "u3-53", "u4-01", "u4-02", "u4-03", "u4-23", "u4-25", "u4-26",
  "u4-31", "u4-43", "u5-05", "u5-31", "u5-32", "u5-46", "u5-60", "u5-61", "u6-05", "u6-06", "u6-07", "u6-08", "u6-23", "u6-31"];
NATURES_MOTS.harf = ["w13", "w16", "w17", "x32", "x33", "u3-06", "u4-27", "u4-36", "u5-40", "u5-51"];
NATURES_MOTS.hors = ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09", "w14", "w15", "w18", "w19", "w39", "x09", "x10", "x31",
  "u3-09", "u3-16", "u3-19", "u3-20", "u3-21", "u3-22", "u3-24", "u3-25", "u3-37", "u3-39", "u4-04", "u4-08", "u4-09", "u4-10", "u4-20", "u4-21",
  "u5-15", "u5-52", "u6-10", "u6-12", "u6-18", "u6-19", "u6-24", "u6-25", "u6-26", "u6-28", "u6-29", "u6-40"];
