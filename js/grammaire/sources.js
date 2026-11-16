"use strict";
/* Mufrad — éditions de référence consultables dans l'application.
   Les pages viennent des PDF fournis et vérifiés par le responsable de Mufrad, découpés en images (une par page du livre)
   dans le dossier sources/. Une source = { id, titre, auteur, edition, dossier, pages (nombre d'images),
   debut (image où commence le texte, après la préface), babs: { nom du bab -> image où il commence } }. */
SOURCES.push({
  id: "nazm",
  titre: "Nazm al-Ājurrūmiyya",
  ar: "نَظْمُ الآجُرُّومِيَّة",
  auteur: "’Ubayd Rabbih Muhammad b. Ābbah al-Qallawi ash-Shinqiti",
  edition: "édition établie sur manuscrits par ’Abdallah b. Muhammad Sufyan al-Hakami, 1427 H",
  dossier: "sources/nazm-shinqiti/",
  pages: 20,
  debut: 7,
  babs: { intro: 7, kalam: 7 }
});
