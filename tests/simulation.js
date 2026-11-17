// Test de bout en bout, sans navigateur : charge le contenu et l'application avec un faux document,
// puis joue une leçon, une révision avec une erreur et des révisions du jour, en vérifiant les règles clés.
// Lancement : node tests/simulation.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const lire = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const unites = fs.readdirSync(path.join(__dirname, "..", "js", "unites")).filter(f => f.endsWith(".js")).sort();
const gram = fs.readdirSync(path.join(__dirname, "..", "js", "grammaire")).filter(f => f.endsWith(".js")).sort();
const code = [lire("js/contenu.js"), ...unites.map(f => lire("js/unites/" + f)), lire("js/assemblage.js"),
  lire("js/grammaire.js"), ...gram.map(f => lire("js/grammaire/" + f)), lire("js/tableau-lettres.js"), lire("js/tableau.js"), lire("js/statistiques.js"), lire("js/app.js")].join("\n");
gram.forEach(f => assert.ok(lire("index.html").includes("js/grammaire/" + f), "index.html ne charge pas js/grammaire/" + f));
// Chaque fichier d'unité doit aussi être déclaré dans la page, sinon il ne serait jamais chargé
unites.forEach(f => assert.ok(lire("index.html").includes("js/unites/" + f), "index.html ne charge pas js/unites/" + f));

// Faux environnement de navigateur, réduit à ce que l'application utilise
const store = {};
const el = () => ({ innerHTML: "", textContent: "", setAttribute() {}, removeAttribute() {}, dataset: {} });
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
// Les écouteurs posés par l'application sont gardés, pour pouvoir simuler un appui sur un bouton (data-act)
const ecouteurs = {};
global.document = { getElementById: el, querySelectorAll: () => [], addEventListener(t, f) { (ecouteurs[t] = ecouteurs[t] || []).push(f); },
  dispatchClic: (act, data) => (ecouteurs.click || []).forEach(f => f({ target: { closest: () => ({ dataset: { act, ...(data || {}) } }) } })) };
global.window = { addEventListener() {} };
global.location = { hash: "" };
global.speechSynthesis = { getVoices: () => [] };
global.navigator = {};
global.indexedDB = { open() { throw new Error("absent"); } };
global.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };

const r = new Function(code + `
// Joue la séance en cours jusqu'au bout ; si failOnce est vrai, rate volontairement la première question
const run = failOnce => {
  let n = 0, failed = false, firstFail = null;
  while (!sess.over && n < 3000) {
    const t = sess.tasks[sess.i], c = sess.cur; n++;
    sessHead(); viewTask(); sessFoot();                       // chaque écran doit pouvoir s'afficher
    if (t.kind === "q") {
      const good = c.opts.findIndex(o => o.id === t.id);
      c.picked = failOnce && !failed ? (good + 1) % c.opts.length : good;
      if (failOnce && !failed) { failed = true; firstFail = t.id; }
      c.checked = true; answer(t, c.opts[c.picked].id === t.id, 4000, c.opts[c.picked].id); sessFoot();   // comme le bouton « Vérifier »
    }
    if (t.kind === "match") t.ids.forEach(id => { c.done[id] = true; });
    sess.hist.push({ task: t, cur: c }); sess.i++; showTask();
  }
  sess.peek = 0; viewTask(); sessFoot(); sess.peek = null;   // la relecture d'une carte passée s'affiche aussi
  return { n, firstFail };
};
const out = {};
out.items = ITEMS.length;
out.options = ITEMS.map(it => distractors(it).length);        // nombre de mauvaises réponses proposées pour chaque élément
viewHome(); viewWords(); viewVoices(); viewSettings(); viewAdvanced(); viewSheet(1); viewSheet(101);
// Alphabet : un groupe entier par séance, avec une question sur les formes ; une lettre non liante n'a que deux dessins
startLearn(101); out.formes = sess.tasks.filter(t => t.ex === "f2l").length; run(false);
out.lettres = Object.keys(S.cards).length; out.alif = Object.values(formsOf(BY_ID.l1)).join("|"); out.ba = Object.values(formsOf(BY_ID.l7)).join("|");
S.cards = {}; S.days = {}; S.log = [];
// Rognage : un son entouré de silence est proposé sans ses bords, et le fichier produit a la bonne taille
const faux = new Float32Array(16000); for (let i = 4000; i < 8000; i++) faux[i] = Math.sin(i / 5) * 0.5;
const [ta, tb] = autoTrim(faux, 16000); out.rognage = [ta, tb];
out.wav = wavBytes(faux, 16000, ta, tb).byteLength; out.pics = peaksOf(faux, 8).map(v => v > 0.1);
// Valider sans faire : les éléments entrent en révision dès aujourd'hui, et une révision réussie les rend acquis
out.valides = markKnown(itemsOf(13)); out.dusValides = itemsOf(13).filter(isDue).length;
startDaily(); run(false); out.acquisValides = itemsOf(13).filter(isKnown).length;
S.cards = {}; S.days = {}; S.log = [];
// Pliage : par défaut seule l'unité en cours est dépliée ; un choix fait à la main l'emporte
out.ouvertes = UNITS.filter(x => isOpen(x, nextLesson())).map(x => x.n);
S.fold = { 0: true, 2: false }; out.ouvertesChoix = UNITS.filter(x => isOpen(x, nextLesson())).map(x => x.n); S.fold = {};
viewHome();
startLearn(1); run(false);
out.apresLecon = Object.keys(S.cards).length;
out.echeanceReussi = diffDays(today(), S.cards.w01.due);
startDrill(itemsOf(12), "Leçon 12"); const d = run(true);
out.rate = d.firstFail; out.echeanceRate = diffDays(today(), S.cards[d.firstFail].due);
out.apresRevision = Object.keys(S.cards).length;
out.serie = streak();
S.offset = 3; out.dus = ITEMS.filter(isDue).length; startDaily(); run(false);
out.dusApres = ITEMS.filter(isDue).length;
S.offset = 40; startDaily(); if (sess && !sess.over) run(false); S.offset = 41;
out.acquis = ITEMS.filter(isKnown).length;
// Voix : un fichier choisi attend d'être écouté ; seul le dépôt confirmé le rend audible
addPending("w01", { faux: true }); addPending("w02", { faux: true });
out.attente = pending.length; out.avantDepot = Boolean(AUDIO.w01); out.vueAttente = viewVoices().includes("À écouter avant de déposer");
dropPending("w02"); out.deposes = confirmPending(); out.apresDepot = Boolean(AUDIO.w01) && !AUDIO.w02;
// Reprise du rognage : l'enregistrement déposé garde son fichier d'origine et peut repasser en liste d'attente
out.origine = Boolean(CLIPS.w01 && CLIPS.w01.orig && CLIPS.w01.cut);
addPending("w01", CLIPS.w01.orig, { a: 0.1, b: 0.4 }); out.reprise = pending.length === 1 && pending[0].preset.b === 0.4; dropPending("w01");
// Plusieurs voix pour un même élément : ordre fixe, bouton « autre voix », choix des lecteurs dans les réglages
READERS.push("A", "B"); SHARED.w05 = [{ vid: "1", url: "u-A", auteur: "A" }, { vid: "2", url: "u-B", auteur: "B" }];
refreshAudio("w05"); out.voix1 = AUDIO.w05; S.voiceIdx = { w05: 1 }; refreshAudio("w05"); out.voix2 = AUDIO.w05;
S.voiceIdx = {}; S.readers = ["B"]; refreshAudio("w05"); out.voixChoisie = [voicesFor("w05").length, AUDIO.w05];
S.readers = ["Z"]; out.voixRepli = voicesFor("w05").length; S.readers = [];
out.maVoixDabord = voicesFor("w01")[0].vid; out.boutonAutre = speakBtn("w05").includes("voice-next") && !speakBtn("w01").includes("voice-next");
delete SHARED.w05; READERS.length = 0; refreshAudio("w05");
// Vocabulaire : une correction publiée remplace la valeur, un mot ajouté rejoint sa leçon, et tout se défait
const frAvant = BY_ID.w01.fr, nbAvant = ITEMS.length, nbLecon = itemsOf(1).length;
applyContent([{ element: "w01", champ: "traduction", valeur: "essai", etat: "publie" }, { element: "w02", champ: "traduction", valeur: "ignoré", etat: "recommande" }],
  [{ id: "abc", lecon: 1, arabe: "كِتابٌ", translitteration: "kitābun", traduction: "un livre", note: "", etat: "publie" }, { id: "def", lecon: 999, arabe: "x", traduction: "y", etat: "publie" }]);
out.voc = [BY_ID.w01.fr, BY_ID.w02.fr !== "ignoré", ITEMS.length - nbAvant, itemsOf(1).length - nbLecon, Boolean(BY_ID["m-abc"])];
viewWords(); viewHome();
applyContent([], []); out.vocDefait = [BY_ID.w01.fr === frAvant, ITEMS.length === nbAvant, !BY_ID["m-abc"]];
// Liste des mots : seule la leçon en cours est dépliée ; la recherche ignore voyelles, accents et majuscules
S.cards = {}; S.fold = {}; listOpen = {};
out.listeRepliee = (wordList().match(/class="wrow"/g) || []).length;
wordQuery = "سلام"; out.rechercheAr = (wordList().match(/class="wrow"/g) || []).length > 0;
wordQuery = "FRERE"; out.rechercheFr = (wordList().match(/class="wrow"/g) || []).length > 0; wordQuery = "";
// Deux appareils progressent chacun hors ligne, puis se synchronisent avec le compte :
// aucune réponse n'est perdue, l'ordre de synchronisation ne change rien, et refusionner ne change plus rien.
const copie = () => JSON.parse(JSON.stringify({ cards: S.cards, log: S.log, days: S.days }));
S.cards = {}; S.days = {}; S.log = []; S.offset = 0;
startLearn(1); run(false); const tel = copie();                     // le téléphone apprend la leçon 1
S.cards = {}; S.days = {}; S.log = [];
startLearn(2); run(false); S.offset = 1; startDrill(itemsOf(1).slice(0, 2), "x"); run(true); const pc = copie(); S.offset = 0;  // l'ordinateur, la leçon 2 et deux mots de la 1
const compte1 = mergeProgress(tel, {}), compte2 = mergeProgress(pc, compte1);                         // le téléphone synchronise, puis l'ordinateur
const autreOrdre = mergeProgress(tel, mergeProgress(pc, {}));
out.fusion = {
  rienPerdu: compte2.log.length === tel.log.length + pc.log.length,
  cartes: Object.keys(compte2.cards).length === new Set([...Object.keys(tel.cards), ...Object.keys(pc.cards)]).size,
  plusRecente: compte2.cards.w01.last === [tel.cards.w01, pc.cards.w01].map(c => c.last).sort().pop(),
  ordre: JSON.stringify(compte2) === JSON.stringify(autreOrdre),
  stable: JSON.stringify(mergeProgress(compte2, compte2)) === JSON.stringify(compte2) && JSON.stringify(mergeProgress(tel, compte2)) === JSON.stringify(compte2)
};
S.cards = {}; S.days = {}; S.log = [];
// Statistiques : les événements attendent en file ; un refus vide la file, efface l'identifiant et arrête le comptage ;
// l'identifiant d'appareil est stable dans la journée, puis renouvelé le lendemain
fileMesure = []; S.mesure = true;
noter("clic", "learn:3"); startLearn(2); const fileAvant = fileMesure.map(e => e.type + "/" + e.detail);
const id1 = appareilId(), id2 = appareilId();
localStorage.setItem(APPAREIL_KEY, JSON.stringify({ id: id1, jour: addDays(today(), -1) })); const id3 = appareilId();
// Une séance jouée avec une erreur : chaque réponse est notée avec son exercice, sa justesse, son rang et le choix faux
fileMesure = []; run(true);
const reps = fileMesure.filter(e => e.type === "reponse"), faux1 = reps.find(e => !e.donnees.ok), fin = fileMesure.find(e => e.type === "seance_fin");
// Séance quittée en cours de route
startLearn(3); fileMesure = []; sess.i = 2; document.dispatchClic("quit");
const quittee = fileMesure.find(e => e.type === "seance_quittee");
// Reprise : une leçon quittée après quelques cartes repart de la carte suivante, avec ses compteurs,
// le panneau de la leçon le propose, et une fois la leçon finie il n'y a plus rien à reprendre
startLearn(4); const tachesAvant = sess.tasks.map(t => t.id + (t.ex || t.kind)).join();
showTask(); sess.hist.push({}); sess.i++; showTask();                                  // fiche du premier mot passée
{ const t = sess.tasks[sess.i], c = sess.cur; answer(t, c.opts.findIndex(o => o.id === t.id) < 0, 4000, null); }   // une erreur
document.dispatchClic("quit");
const repriseVue = viewSheet(4).includes('data-act="resume"');
resumeLearn(4);
out.reprise4 = { carte: sess.i === 2, taches: sess.tasks.length === tachesAvant.split(",").length + 1, compteurs: sess.answers === 1 && sess.correct === 0,
  erreur: Object.values(sess.st).some(x => x.err), panneau: repriseVue };
run(false); out.reprise4.finie = !(S.reprise || {})[4] && !viewSheet(4).includes('data-act="resume"');
// Ouverture : contexte calculé sur l'appareil ; la deuxième ouverture du jour n'est plus « première du jour »
fileMesure = []; localStorage.removeItem(MESURE_KEY); noterOuverture(); noterOuverture();
const ouv = fileMesure.filter(e => e.type === "ouverture").map(e => e.donnees);
const texteTape = JSON.stringify(fileMesure).includes("سِرّ");   // aucun texte tapé ne doit partir
choisirMesure(false); noter("clic", "x");
out.mesure = { file: fileAvant.slice(0, 2), stable: Boolean(id1) && id1 === id2, renouvele: id3 !== id1,
  refus: fileMesure.length === 0 && localStorage.getItem(APPAREIL_KEY) === null && localStorage.getItem(MESURE_KEY) === null,
  reglage: viewAdvanced().includes("Ne pas me compter") && !viewSettings().includes("Ne pas me compter") && viewSettings().includes('href="#avance"'),   // dans les paramètres avancés
  reponses: reps.length > 0 && reps.every(e => e.detail && e.donnees.ex && typeof e.donnees.ok === "boolean" && e.donnees.rang >= 1 && e.donnees.etat),
  choixFaux: Boolean(faux1 && faux1.donnees.choix && faux1.donnees.choix !== faux1.detail),
  fin: Boolean(fin && fin.donnees.l === "2" && fin.donnees.rep === reps.length && fin.donnees.justes === reps.length - 1),
  quittee: Boolean(quittee && quittee.donnees.pos === 2 && quittee.donnees.l === "3"),
  ouverture: ouv.length === 2 && ouv[0].njour === true && ouv[1].njour === false && ouv[0].anc === 0 && "serie" in ouv[0],
  tranches: [tranche(5, T_JOURS), tranche(20, T_JOURS), tranche(400, T_JOURS), tranche(-1, T_JOURS)].join(","),
  sansTexte: !texteTape };
choisirMesure(true); fileMesure = []; sess = null;
// Grammaire : cohérence du contenu, puis une leçon et une révision jouées jusqu'au bout, chaque écran affiché
const gq = gLessons().flatMap(l => l.questions), gids = [...gq.map(x => x.id), ...NAZM.map(v => v.id), ...gLessons().map(l => l.id)];
// Édition de référence : chaque page annoncée existe, chaque bab du poème y a sa page, et la visionneuse s'affiche
const srcN = SOURCES.find(x => x.id === "nazm");
out.srcPages = Array.from({ length: srcN.pages }, (x, k) => srcN.dossier + "p-" + String(k + 1).padStart(2, "0") + ".webp");
out.srcBabs = [...new Set(NAZM.map(v => v.bab))].filter(b => !srcN.babs[b]);
gSrc = { id: "nazm", p: srcN.debut, zoom: false }; out.srcVue = gSourceView().includes("p-07.webp"); gSrc = null;
// Le premier vers, tel qu'il figure dans l'édition de référence
out.premierVers = NAZM[0].a;
// Exemples : la partie dont on parle ressort en couleur, sans astérisque visible ; la liaison des lettres est gardée
// seulement quand la lettre coupée s'attache à la suivante (pas après un alif) ; la règle porte « À retenir »
const pageSignes = gLessons().find(l => l.id === "g1b").pages[0].blocs.map(gBlock).join("");
out.marques = { n: (pageSignes.match(/class="gmark"/g) || []).length, sansEtoile: !/<span class="ar"[^>]*>[^<]*\\*/.test(pageSignes),
  liant: gMark("البَيْ*تِ*") === 'البَيْ\\u200D<span class="gmark">\\u200Dتِ</span>', sansLiant: gMark("كِتا*بٌ*") === 'كِتا<span class="gmark">بٌ</span>',
  regle: pageSignes.includes('class="regle"><span class="tag">★ À retenir</span>') };
out.gramDoubles = gids.filter((id, i) => gids.indexOf(id) !== i);
out.gramFautes = [
  ...gq.filter(x => x.nature ? !["ism", "fil", "harf"].includes(x.nature) || !BY_ID[x.mot] : !(x.q && x.choix && x.choix.length >= 2 && x.bon >= 0 && x.bon < x.choix.length)).map(x => x.id),
  ...gq.filter(x => !x.pourquoi).map(x => x.id + " (sans explication)"),
  ...gLessons().flatMap(l => (l.vers || []).filter(v => !gVerse(v)).map(v => l.id + " -> " + v)),
  ...NAZM.filter(v => !(v.a && v.b && v.fr && v.bab && v.babAr)).map(v => v.id)];
// Tout {{terme}} cité existe dans le glossaire ; aucune translittération savante ne reste dans les textes
const gTxt = JSON.stringify(GRAMMAIRE) + JSON.stringify(GLOSSAIRE.map(t => t.def));
out.gramTermes = [...gTxt.matchAll(/\{\{([a-z-]+)(:pl)?\}\}/g)].filter(m => !gTermOf(m[1]) || (m[2] && !gTermOf(m[1]).pl)).map(m => m[0]);
// Un terme est traduit tant que sa leçon n'est pas terminée, puis reste seul ; les réglages forcent l'un ou l'autre
S.connus = {}; S.termes = "auto"; gSeen = {}; out.termeAvant = gText("{{ism}}").includes("gloss");
S.connus = { ism: true }; gSeen = {}; out.termeApres = !gText("{{ism}}").includes("gloss");
S.termes = "fr"; gSeen = {}; out.termeFr = gText("{{ism}}").includes("gloss"); S.termes = "ar"; S.connus = {}; gSeen = {}; out.termeAr = !gText("{{ism}}").includes("gloss");
S.termes = "auto"; gTerm = "bayt"; out.termeFiche = gTermSheet().includes("أَبْيات"); gTerm = null;
S.cards = {}; S.days = {}; location.hash = "#grammaire"; viewGrammar(); gOpen = { poem: true, src: true }; viewGrammar();
const gJoue = rate => { let n = 0; while (gs && !gs.over && n < 500) { n++; render(); const st = gs.steps[gs.i];
  if (st.t === "q") { if (st.q.type === "ecrit") gs.typed = rate && n % 3 === 0 ? "خطا" : gBare(st.q.answer); else gs.picked = rate && n % 3 === 0 ? (st.q.bon + 1) % st.q.opts.length : st.q.bon; gCheck(); render(); } gNext(); } render(); return gs.asked; };
gStartLesson("g1a"); out.gramEtapes = gs.steps.map(s => s.t[0]).join(""); out.gramPosees = gJoue(false); gs = null;
out.termesAppris = ["ism", "fil", "harf", "kalam", "bayt", "ajuz"].every(id => S.connus[id]) && !S.connus.tanwin;
out.gramFaite = gDone(gLessons()[0]); out.gramCartes = Object.keys(S.cards).filter(k => /^[gn]/.test(k)).length; out.gramSerie = streak();
S.offset = (S.offset || 0) + 3; out.gramDues = gramDue().length; gStartReview(); out.gramRevues = gJoue(true); gs = null; S.offset -= 3;
// Mot manquant : pour chaque vers et chaque forme, la question est bien formée ; l'écriture sans voyelles est acceptée
out.trous = NAZM.filter(v => { const a = gVerseQuestion(v, "trou"), b = gVerseQuestion(v, "ecrit");
  return !(a.opts.length === 4 && a.bon >= 0 && a.prompt.includes("blank") && (b.type === "ecrit" ? b.answer && (v.a + " " + v.b).includes(b.answer) : b.opts.length === 4)); }).map(v => v.id);   // un mot qui a un jumeau est donné à choisir
gs = { typed: "الكلام", picked: null }; out.ecritOk = gIsRight({ type: "ecrit", answer: "الْكَلَامَ" }); gs.typed = "الكلم"; out.ecritFaux = !gIsRight({ type: "ecrit", answer: "الْكَلَامَ" }); gs = null;
// Avec les voyelles : le mot vocalisé comme on l'écrit à la main est accepté, une voyelle fausse est refusée
S.harakat = true; gs = { typed: "الكَلامَ", picked: null }; out.vocalOk = gIsRight({ type: "ecrit", answer: "الْكَلَامَ" });
gs.typed = "الكَلامُ"; out.vocalFaux = !gIsRight({ type: "ecrit", answer: "الْكَلَامَ" }); gs.typed = "مُرَكَّبٌ"; out.vocalShadda = gIsRight({ type: "ecrit", answer: "مُرَكَّبٌ" });
out.clavierVoyelles = gKeyboard().includes("fatha"); S.harakat = false; out.clavierSans = !gKeyboard().includes("fatha"); gs = null;
// Les deux dispositions du clavier portent les 28 lettres
out.clavier = ["classique", "alpha"].map(l => G_KEYS.every(k => G_ROWS[l].flat().includes(k)));
// « Je connais déjà ce bab » : tout entre en révision aujourd'hui, les termes sont connus
const gardeCartes = S.cards, gardeConnus = S.connus; S.cards = {}; S.connus = {}; gMarkKnown(1);
out.babConnu = [gLessons().every(gDone), gramDueQ().length, gramDueV().length, Boolean(S.connus.tanwin)]; S.cards = gardeCartes; S.connus = gardeConnus;
// Questions fabriquées : sur un grand nombre de tirages, chacune a un seul bon choix et des choix tous différents.
// « Lequel de ces mots est un … ? » : un seul des mots proposés est de la sorte demandée.
out.ambigues = [];
for (let k = 0; k < 400; k++) {
  const g = gGenerated(), txt = g.opts.map(o => o.html.replace(/<[^>]+>/g, "")), mots = g.prompt ? [] : txt.map(t => WORDS.find(w => w.ar === t));
  const cible = (g.ask.match(/\{\{([a-z]+)\}\}/) || [])[1];
  if (new Set(txt).size !== txt.length || g.bon < 0 || (mots.length && mots.filter(w => gNatureOf(w) === cible).length !== 1)) out.ambigues.push(g.ask + " " + txt.join(" / "));
}
// Vers : pour chaque vers et chaque forme, les choix sont tous différents une fois les voyelles retirées, et un seul est le bon
NAZM.forEach(v => { for (let k = 0; k < 12; k++) ["trou", "ajuz", "suite"].forEach(kind => {
  const g = gVerseQuestion(v, kind), txt = g.opts.map(o => gNorm(o.html));
  if (new Set(txt).size !== txt.length || g.bon < 0 || g.bon >= txt.length) out.ambigues.push(v.id + " " + kind);
}); });
// Jumeaux (mêmes lettres, voyelles différentes) : jamais à écrire sans voyelles, jamais dans un choix sans traduction
out.jumeaux = [...new Set([...WORDS.map(w => w.ar), ...NAZM.flatMap(v => (v.a + " " + v.b).split(" ").map(gCore))].filter(w => gTwins(w).length).map(w => w + " ≠ " + gTwins(w).join(" , ")))];
S.harakat = false; out.jumeauxEcrits = [];
NAZM.forEach(v => { for (let k = 0; k < 40; k++) { const g = gVerseQuestion(v, "ecrit"); if (g.type === "ecrit" && gTwins(g.answer).length) out.jumeauxEcrits.push(g.answer); } });
out.jumeauxChoix = [];
for (let k = 0; k < 400; k++) { const g = gGenerated(); if (!g.prompt) g.opts.forEach(o => { if (gTwins(o.html).length) out.jumeauxChoix.push(o.html); }); }
out.jumeauReconnu = gTwins("مِنْ").includes("مَنْ") && gTwins("نَعَمْ").length === 0;
// Deux mots du vocabulaire qui s'écrivent pareil ne doivent pas être de sortes différentes
out.homographes = WORDS.filter(a => gNatureOf(a) && WORDS.some(b => b !== a && gNatureOf(b) && gNorm(b.ar) === gNorm(a.ar) && gNatureOf(b) !== gNatureOf(a))).map(w => w.id);
// Sorte des mots : identifiants valables, aucun mot dans deux listes ; l'entraînement libre ne crée ni ne déplace aucune carte
const nm = [...NATURES_MOTS.fil, ...NATURES_MOTS.harf, ...NATURES_MOTS.hors];
out.naturesFautes = nm.filter((id, i) => !BY_ID[id] || nm.indexOf(id) !== i);
const avantTrain = JSON.stringify(S.cards);
gStartTraining("q"); out.trainQ = gJoue(true); gs = null; gStartTraining("v"); out.trainV = gJoue(true); gs = null;
out.trainSansEffet = JSON.stringify(S.cards) === avantTrain;
// Les révisions sont séparées : la grammaire d'un côté, le poème de l'autre
S.offset += 60; gStartReview("v"); out.revueV = gs ? gs.steps.every(s => s.q.verse) : false; gs = null; gStartReview("q"); out.revueQ = gs ? gs.steps.every(s => !s.q.verse) : false; gs = null; S.offset -= 60;
S.nazm = false; gStartLesson("g1b"); out.gramSansPoeme = gs.steps.every(s => s.t !== "verses" && !(s.q && s.q.verse)); gs = null; S.nazm = true;
S.cards = {}; S.days = {}; location.hash = "";
// « Réviser au choix » (panneau du parcours) : les unités sont repliées sauf celle en cours ;
// le bouton de départ, collé en bas, s'active dès qu'une leçon est cochée. Le glossaire ne contient plus ce choix.
drillSel = {}; drillOpen = {};
const vide = viewPick(), deplies = (vide.match(/data-act="drill-unit"[^>]*aria-expanded="true"/g) || []).length;
drillSel[1] = true; const coche = viewPick();
sheet = "choix"; const accueil = viewHome(); sheet = null;
out.reviser = { unitesRepliees: deplies === 1 && (vide.match(/data-act="drill-unit"/g) || []).length > 2,
  inactif: /data-act="drill-start" disabled/.test(vide), actif: /data-act="drill-start" >Réviser/.test(coche),
  boutonParcours: viewHome().includes('data-act="pick-open"'), panneau: accueil.includes('aria-label="Réviser au choix"'),
  glossaire: !viewWords().includes("drill-toggle") };
drillSel = {};
// Partage des voix (#partage) : ouverte par la roue dentée de l'onglet Voix ; chacun y voit l'accord et ses envois,
// les contributeurs y gèrent en plus les voix ; une pastille rouge compte ce qui est à traiter.
// On simule une base et un administrateur, avec une recommandation en attente et trois envois à lui.
{
  const sauf = { sb, me, myLevel, hasConsent, recos, voixRows };
  const idA = ITEMS.find(it => it.type === "word").id;
  sb = {}; me = { id: "adm" }; myLevel = "administrateur"; hasConsent = true;
  recos = [{ id: "r1", element: idA, auteur: "lect", chemin: "lect/x.wav", etat: "recommande", cree_le: "2026-11-16T10:00:00Z" }];
  voixRows = recos.concat(["publie", "refuse", "retire"].map((e, i) => ({ id: "m" + i, element: idA, auteur: "adm", chemin: "adm/" + i + ".wav", etat: e, cree_le: "2026-11-1" + i + "T10:00:00Z" })));
  adminTab = null; const ouverture = viewPartage();
  adminTab = "lecteurs"; const lect = viewPartage();
  adminTab = "voix"; adminLesson = String(BY_ID[idA].l); adminState = "none"; const voix = viewPartage();
  adminTab = "envois"; const envois = viewPartage();
  const ongletVoix = viewVoices();
  out.admin = { attente: adminTab && ouverture.includes('data-act="reco-ok" data-id="r1"'), lecteurs: lect.includes('data-act="admin-reader" data-a="lect"'),
    filtres: voix.includes('data-adm="lesson"') && voix.includes("sans voix"),
    envois: envois.includes(">publié<") && envois.includes(">refusé<") && !envois.includes("adm/2.wav"),
    roue: ongletVoix.includes('class="gear" href="#partage"') && ongletVoix.includes('<i class="tbadge">1</i>'),
    plusDansVoix: !ongletVoix.includes("Suivi des voix") && !ongletVoix.includes("reco-ok") && !ongletVoix.includes('data-act="consent-off"') };
  // Un simple utilisateur : pas de vues de gestion, pas de pastille
  myLevel = "utilisateur"; recos = [];
  const simple = viewPartage();
  out.adminSimple = !simple.includes('data-act="admin-tab"') && simple.includes("Mes envois") && !viewVoices().includes("tbadge");
  ({ sb, me, myLevel, hasConsent, recos, voixRows } = sauf);
  adminTab = null; adminLesson = "all"; adminState = "all";
}
// Voix : chaque élément affiche son état (moi / autre voix / à enregistrer) ; la leçon où j'ai enregistré a un point doré
const idV = itemsOf(voiceLesson)[0].id, avantV = voiceState(idV);
CLIPS[idV] = { url: "blob:essai" }; const pageV = viewVoices(); delete CLIPS[idV];
out.voixEtat = { aucun: avantV === "aucun", moi: pageV.includes('class="vrow v-moi"'), badge: pageV.includes('class="vstat aucun"'), point: pageV.includes('class="dot-moi"') };
// Nouvel enregistrement d'un mot déjà enregistré : on peut écouter l'ancien et le nouveau, et garder l'ancien ;
// sans ancien, seul « Écarter » est proposé ; une reprise du rognage n'est pas un nouvel enregistrement
{
  const idC = itemsOf(voiceLesson)[0].id;
  pending = [{ id: idC, url: "blob:nouveau", data: null, preset: null }];
  const sansAncien = viewVoices();
  CLIPS[idC] = { url: "blob:ancien" }; const avecAncien = viewVoices();
  pending[0].preset = { a: 0, b: 1 }; const rognage = viewVoices();
  delete CLIPS[idC]; pending = [];
  out.choixVoix = { sansAncien: sansAncien.includes(">Écarter<") && !sansAncien.includes("Garder l'ancien"),
    avecAncien: avecAncien.includes('data-url="blob:ancien"') && avecAncien.includes("Garder l'ancien"),
    rognage: !rognage.includes("Garder l'ancien") };
}
// Version d'essai : le client de la base enveloppé lit normalement mais refuse toute écriture, sans appeler le serveur
{
  const appels = [];
  const faux = n => new Proxy(function () {}, { get: (t, p) => (p === "then" ? ok => ok({ data: ["lu"], error: null }) : (appels.push(n + "." + String(p)), faux(n))), apply: () => faux(n) });
  const client = { from: () => faux("table"), storage: { from: () => faux("fichiers") }, rpc: nom => (appels.push("rpc." + nom), faux("rpc")), auth: { essai: true } };
  const ls = lectureSeule(client), res = {};
  ls.from("voix").update({ etat: "retire" }).eq("id", "x").then(r => { res.update = r.error && r.error.message; });
  ls.from("voix").delete().eq("id", "x").then(r => { res.delete = r.error && r.error.message; });
  ls.storage.from("voix").remove(["a"]).then(r => { res.remove = r.error && r.error.message; });
  ls.rpc("noter_evenements", {}).then(r => { res.rpcEcrit = r.error && r.error.message; });
  ls.from("voix").select("id").then(r => { res.select = r.data; });
  ls.rpc("lecteurs").then(r => { res.rpcLu = r.data; });
  ls.rpc("noter_evenements_v2", {}).then(r => { res.stats = !r.error; });   // les statistiques partent, marquées « essai »
  out.essai = () => ({ refus: [res.update, res.delete, res.remove, res.rpcEcrit].every(m => m === ESSAI_REFUS), lecture: res.select && res.rpcLu && true,
    jamaisAppele: !appels.some(a => /update|delete|remove|noter_evenements$/.test(a)), auth: ls.auth.essai === true,
    stats: res.stats === true && appels.includes("rpc.noter_evenements_v2") });
}
const sessHeadPulse = vu => { S.crayonVu = vu; startLearn(101); const h = sessHead().includes("pulse"); sess = null; return h; };
// Tableau d'écriture : ce qu'on écrit est déduit de l'écran ; le modèle ne s'affiche pas quand il donnerait la réponse
S.cards = {}; location.hash = ""; startLearn(101); render();
const tc1 = tbContext(); sess.tasks[sess.i] = { kind: "q", id: "w37", ex: "fr2ar" }; const tc2 = tbContext(); sess.tasks[sess.i] = { kind: "q", id: "w37", ex: "ar2fr" }; const tc3 = tbContext(); sess = null;
out.tableau = [tc1.contexte, tc1.montre, Boolean(tc1.lettre), tc2.contexte, tc2.montre, tc2.text === BY_ID.w37.ar, tc3.montre];
const trec = tbRecord(tc2, "isolee", [[[10, 20, 0], [30, 40, 16]]], 400, "touch", false, false, false);
// Un chemin du fichier est ramené au cadre de la lettre à l'écran ; une lettre sans largeur (ا) est centrée
const fit = tbFit(TB_LETTRES["ب"], [400, 300, 600, 420]).flat(); out.cadre = [Math.min(...fit.map(p => p[0])), Math.max(...fit.map(p => p[0])), Math.min(...fit.map(p => p[1])), Math.max(...fit.map(p => p[1]))];
out.alifCentre = tbFit(TB_LETTRES["ا"], [480, 200, 520, 400])[0].map(p => p[0]);
out.crayon = [sessHeadPulse(false), sessHeadPulse(true)];
out.tableauFiche = [trec.element, trec.forme, trec.hauteur, trec.contexte, trec.modele, trec.traits[0].length];
// Sens d'écriture : chacune des 28 lettres a son tracé, dans les limites du tableau, et le nombre de points attendu
const PTS = { "ب": 1, "ت": 2, "ث": 3, "ج": 1, "خ": 1, "ذ": 1, "ز": 1, "ش": 3, "ض": 1, "ظ": 1, "غ": 1, "ف": 1, "ق": 2, "ن": 1, "ي": 2 };
out.lettresFautes = LETTERS.filter(l => { const t = TB_LETTRES[l.ar];
  return !t || !t.length || t[0].length < 2 || t.flat().some(p => p[0] < 0 || p[0] > 1000 || p[1] < 0 || p[1] > 600) || t.filter(x => x.length === 1).length !== (PTS[l.ar] || 0); }).map(l => l.ar);
// Formes de début, milieu et fin : présentes pour chaque lettre (seulement la fin pour les six qui ne s'attachent pas),
// dans les limites du tableau, avec les mêmes points que la forme isolée
out.formesFautes = LETTERS.flatMap(l => (l.join ? ["debut", "milieu", "fin"] : ["fin"]).filter(f => { const t = (TB_FORMES[l.ar] || {})[f];
  return !t || !t.length || t[0].length < 2 || t.flat().some(p => p[0] < 0 || p[0] > 1000 || p[1] < 0 || p[1] > 600) || t.filter(x => x.length === 1).length !== (PTS[l.ar] || 0); }).map(f => l.ar + ":" + f));
out.courbe = tbSpline([[0, 0], [100, 50], [200, 0]]).length;
// Longueur du chemin : régulière le long d'un trait, avec un temps de pose pour un point de lettre
const mes = tbMeasure({ traits: [[[0, 0], [30, 40], [60, 80]], [[500, 500]]] }); out.cheminMesure = [mes.cumul[0], mes.longueurs, mes.total];
S.cards = {};
// Voix retirées : un contributeur les retrouve dans la page Partage (filtre « Voix retirées ») et peut les remettre ;
// une voix retirée puis remplacée par un envoi plus récent du même lecteur n'est pas proposée
{
  const sauf = { sb, me, myLevel, voixRows };
  const [i1, i2] = ITEMS.filter(it => it.type === "word").slice(0, 2).map(it => it.id);
  sb = {}; me = { id: "adm" }; myLevel = "administrateur";
  voixRows = [
    { id: "a", element: i1, auteur: "lect", chemin: "lect/a.wav", etat: "retire", cree_le: "2026-11-10T10:00:00Z" },
    { id: "b", element: i2, auteur: "lect", chemin: "lect/b.wav", etat: "retire", cree_le: "2026-11-10T10:00:00Z" },
    { id: "c", element: i2, auteur: "lect", chemin: "lect/c.wav", etat: "publie", cree_le: "2026-11-12T10:00:00Z" }];
  adminTab = "voix"; adminState = "retire"; adminLesson = "all";
  const page = viewPartage();
  out.retirees = { liste: retiredVoices().map(v => v.id).join(), bouton: page.includes('data-act="voice-restore" data-vid="a"') && !page.includes('data-vid="b"') };
  ({ sb, me, myLevel, voixRows } = sauf); adminTab = null; adminState = "all";
}
// Onglet Voix : un mot que j'ai retiré du partage montre « Remettre dans le partage » sur sa ligne
{
  const sauf = { sb, me, myLevel, hasConsent, voixRows };
  const idR = itemsOf(voiceLesson)[0].id;
  sb = {}; me = { id: "moi" }; hasConsent = true; myLevel = "utilisateur";
  voixRows = [{ id: "v1", element: idR, auteur: "moi", chemin: "moi/1.wav", etat: "retire", cree_le: "2026-11-10T10:00:00Z" }];
  CLIPS[idR] = { url: "blob:local" };
  const local = remettre(idR);                       // enregistrement encore sur l'appareil : on le renvoie
  delete CLIPS[idR];
  const sansLocal = remettre(idR);                   // plus sur l'appareil, simple utilisateur : rien à remettre
  myLevel = "administrateur"; const admin = remettre(idR);   // contributeur : on republie le fichier gardé
  hasConsent = false; CLIPS[idR] = { url: "blob:local" }; myLevel = "utilisateur"; const sansAccord = remettre(idR); delete CLIPS[idR];
  out.remettre = { local: local.includes('data-act="share-one"') && local.includes("Remettre dans le partage"), sansLocal: sansLocal === "",
    admin: admin.includes('data-act="voice-restore" data-vid="v1"'), sansAccord: sansAccord === "" };
  ({ sb, me, myLevel, hasConsent, voixRows } = sauf);
}
// Après une action sur les voix, un message bref s'affiche au-dessus des onglets
toast("Voix remise dans le partage."); render(); out.toast = $foot.innerHTML.includes('class="toast"') && $foot.innerHTML.includes("Voix remise"); toastMsg = ""; render();
// Enregistrement guidé : les mots sans voix d'abord, un mot à la fois ; ✓ garde ce mot seulement et passe au suivant
{
  const l = UNITS[1].lessons[0][0], q = guideQueue(l), autreId = ITEMS.find(it => !q.includes(it.id)).id;
  const ordreOk = q.every((id, k) => k === 0 || !(voiceState(id) === "aucun" && voiceState(q[k - 1]) === "autre"));
  startGuide(q); location.hash = "#enregistrer";
  const v1 = viewGuide();
  pending = [{ id: q[0], url: "blob:g", data: null, preset: null }, { id: autreId, url: "blob:x", data: null, preset: null }];
  const v2 = viewGuide();
  // Enregistrement analysé : « Éditer l'audio » ouvre la piste et les poignées, comme dans l'onglet Voix
  pending[0].data = new Float32Array(100); pending[0].rate = 100; pending[0].dur = 1; pending[0].a = 0.1; pending[0].b = 0.9;
  const vLien = viewGuide(); guide.edit = true; const vPiste = viewGuide(); guide.edit = false; pending[0].data = null;
  out.guideEdit = vLien.includes('data-act="rg-edit"') && !vLien.includes('data-trim="a"') && vPiste.includes('id="wv-' + q[0] + '"') && vPiste.includes('data-trim="b"');
  const avantClips = Object.keys(CLIPS).length;
  keepOne(q[0]); guide.faits++; guide.i++;
  out.guide = { ordre: ordreOk && q.length > 0, micro: v1.includes(BY_ID[q[0]].ar) && (v1.includes('data-act="rec"') || v1.includes("micro n'est pas disponible")),
    choix: v2.includes('data-act="rg-keep"') && v2.includes('data-act="rg-redo"'), garde: Object.keys(CLIPS).length === avantClips + 1 && pending.length === 1 && pending[0].id === autreId,
    suite: guide.i === 1 && viewGuide().includes((2) + "/" + q.length) };
  guide.i = q.length; out.guideFin = viewGuide().includes("1 mot enregistré");
  // Aucune action du mode guidé ne doit commencer par « g- », réservé à la grammaire (sinon le clic n'arrive jamais)
  pending = []; out.guidePrefixe = !/data-act="g-(start|keep|redo|skip)"/.test(v1 + v2 + voixCarte() + viewVoices());
  delete CLIPS[q[0]]; pending = []; guide = null; location.hash = "";
}
// Refaire une leçon déjà vue : toutes ses fiches reviennent ; tout réussir ne change pas le calendrier des éléments déjà connus
{
  const l = UNITS[1].lessons[0][0], its = itemsOf(l), sauf = JSON.stringify(S.cards);
  markKnown(its);
  its.forEach(it => { S.cards[it.id].due = addDays(today(), 5); });   // connus et pas encore dus
  const avant = JSON.stringify(its.map(it => S.cards[it.id]));
  const feuille = viewSheet(l);
  startLearn(l, true);
  const fiches = sess.tasks.filter(t => t.kind === "intro").length, ficheTitre = viewIntro(its[0]).includes("Rappel");
  run(false);                                        // tout juste
  out.refaire = { bouton: feuille.includes('data-act="redo"'), fiches: fiches === its.length && ficheTitre, titre: sess.redo === true,
    calendrier: JSON.stringify(its.map(it => S.cards[it.id])) === avant };
  S.cards = JSON.parse(sauf); sess = null;
}
// Sans bibliothèque ni réseau, l'encadré de partage s'affiche quand même et le compte est simplement absent
out.partage = viewShare().includes("Partage indisponible"); out.compte = viewAccount() === "";
out.dieu = JSON.stringify(ITEMS).includes("Dieu");
// Cohérence du contenu : identifiants uniques, champs remplis, chaque mot rattaché à une leçon de son unité
out.doublons = ITEMS.length - new Set(ITEMS.map(i => i.id)).size;
out.incomplets = WORDS.filter(m => !m.id || !m.ar || !m.fr || !m.tr || typeof m.l !== "number").map(m => m.id);
out.horsLecon = WORDS.filter(m => !UNITS.find(x => x.n === m.u).lessons.some(([l]) => l === m.l)).map(m => m.id);
const nums = UNITS.flatMap(x => x.lessons.map(([l]) => l)); out.leconsDoubles = nums.length - new Set(nums).size;
out.leconsVides = nums.filter(l => itemsOf(l).length < 3);
const vus = {}; out.traductionsDoubles = WORDS.filter(m => (vus[m.fr] = (vus[m.fr] || 0) + 1) > 1).map(m => m.id + " : " + m.fr);
return out;`)();

assert.ok(r.items >= 110, "au moins 110 éléments attendus (28 lettres, 82 mots des unités 1 et 2)");
assert.strictEqual(r.formes, 4, "le premier groupe de l'alphabet pose une question de forme par lettre");
assert.strictEqual(r.lettres, 4, "une séance d'alphabet introduit tout le groupe");
assert.strictEqual(r.alif, "ا|ا|ـا|ـا", "alif ne s'attache pas à la lettre suivante");
assert.strictEqual(r.ba, "ب|بـ|ـبـ|ـب", "bāʾ a quatre formes");
assert.ok(Math.abs(r.rognage[0] - 0.19) < 0.02 && Math.abs(r.rognage[1] - 0.58) < 0.02, "le rognage proposé encadre le son : " + r.rognage);
assert.strictEqual(r.wav, 44 + 2 * (Math.ceil(r.rognage[1] * 16000) - Math.floor(r.rognage[0] * 16000)), "taille du fichier rogné");
assert.deepStrictEqual(r.pics, [false, false, true, true, false, false, false, false], "la piste montre le son au bon endroit");
assert.ok(r.options.every(n => n === 3), "chaque question doit proposer trois mauvaises réponses");
assert.ok(r.valides === 5 && r.dusValides === 5 && r.acquisValides === 5, "une leçon validée sans la faire passe en révision, puis en acquis après une révision réussie");
assert.deepStrictEqual(r.ouvertes, [0], "au départ, seul l'alphabet est déplié");
assert.deepStrictEqual(r.ouvertesChoix, [2], "le pliage choisi à la main l'emporte");
assert.strictEqual(r.apresLecon, 6, "une séance d'apprentissage introduit 6 mots");
assert.strictEqual(r.echeanceReussi, 3, "un mot nouveau réussi revient dans 3 jours");
assert.strictEqual(r.echeanceRate, 1, "un mot raté revient le lendemain");
assert.strictEqual(r.apresRevision, 6 + 18, "réviser une leçon entière fait entrer ses 18 éléments dans le calendrier");
assert.strictEqual(r.serie, 1, "une séance terminée fait compter le jour");
assert.ok(r.dus > 0 && r.dusApres < r.dus, "la révision du jour doit faire baisser le nombre d'éléments dus");
assert.ok(r.acquis > 0, "des éléments doivent devenir acquis après plusieurs révisions espacées");
assert.ok(r.attente === 2 && r.avantDepot === false && r.vueAttente, "un fichier choisi attend en liste, sans être déposé");
assert.ok(r.deposes === 1 && r.apresDepot, "seuls les enregistrements gardés sont déposés à la confirmation");
assert.ok(r.origine && r.reprise, "un enregistrement déposé peut être rogné de nouveau à partir de son fichier d'origine");
assert.ok(r.voix1 === "u-A" && r.voix2 === "u-B", "les voix se suivent dans un ordre fixe");
assert.deepStrictEqual(r.voixChoisie, [1, "u-B"], "seuls les lecteurs choisis sont entendus");
assert.strictEqual(r.voixRepli, 2, "si aucun lecteur choisi n'a enregistré l'élément, on entend quand même les autres");
assert.ok(r.maVoixDabord === "local" && r.boutonAutre, "sa propre voix passe d'abord ; le bouton « autre voix » n'apparaît que s'il y en a plusieurs");
assert.deepStrictEqual(r.voc, ["essai", true, 1, 1, true], "seuls les corrections et les mots publiés s'appliquent, dans une leçon qui existe");
assert.deepStrictEqual(r.vocDefait, [true, true, true], "retirer une correction ou un mot remet le contenu d'origine");
assert.strictEqual(r.listeRepliee, 4, "sans progression, la liste ne déroule que le premier groupe de lettres");
assert.ok(r.rechercheAr && r.rechercheFr, "la recherche trouve un mot sans ses voyelles ni ses accents");
assert.deepStrictEqual(r.fusion, { rienPerdu: true, cartes: true, plusRecente: true, ordre: true, stable: true },
  "deux appareils hors ligne qui se synchronisent ne perdent aucune réponse, dans n'importe quel ordre");
assert.deepStrictEqual(r.mesure, { file: ["clic/learn:3", "seance_debut/learn"], stable: true, renouvele: true, refus: true, reglage: true,
  reponses: true, choixFaux: true, fin: true, quittee: true, ouverture: true, tranches: "5,14,365,", sansTexte: true },
  "statistiques : file d'événements, identifiant du jour, réponses, fin et abandon de séance, ouverture, tranches, refus respecté");
assert.deepStrictEqual(r.srcPages.filter(f => !fs.existsSync(path.join(__dirname, "..", f))), [], "édition de référence : image de page absente");
assert.deepStrictEqual(r.srcBabs, [], "édition de référence : un bab du poème n'a pas de page");
assert.ok(r.srcVue, "la visionneuse affiche la page demandée");
assert.strictEqual(r.premierVers, "قَالَ عُبَيْدُ رَبِّهِ مُحَمَّدُ", "le premier vers doit être celui de l'édition de référence");
assert.deepStrictEqual(r.marques, { n: 4, sansEtoile: true, liant: true, sansLiant: true, regle: true }, "exemples : partie en couleur et liaison gardée ; règle « À retenir »");
assert.deepStrictEqual(r.gramDoubles, [],"grammaire : identifiant en double");
assert.deepStrictEqual(r.gramFautes, [], "grammaire : question, vers ou renvoi incomplet");
assert.deepStrictEqual(r.gramTermes, [], "grammaire : terme absent du glossaire");
assert.ok(r.termeAvant && r.termeApres && r.termeFr && r.termeAr && r.termeFiche, "un terme est traduit à la première rencontre, puis reste seul, selon le réglage");
assert.ok(r.termesAppris, "les termes d'une leçon terminée sont tenus pour connus, pas ceux des leçons suivantes");
assert.ok(/^p+vq+$/.test(r.gramEtapes), "une leçon enchaîne les pages, les vers, puis les questions");
assert.ok(r.gramPosees === 11 && r.gramFaite && r.gramCartes === 11 && r.gramSerie === 1, "la leçon faite crée une carte par question et par vers, et compte pour la série");
assert.ok(r.gramDues > 0 && r.gramRevues === Math.min(15, r.gramDues), "les cartes de grammaire reviennent en révision");
assert.deepStrictEqual(r.trous, [], "mot manquant : question mal formée pour ce vers");
assert.ok(r.ecritOk && r.ecritFaux, "un mot écrit sans voyelles est accepté, un mot faux est refusé");
assert.ok(r.vocalOk && r.vocalFaux && r.vocalShadda, "avec les voyelles : l'écriture courante est acceptée, une voyelle fausse est refusée");
assert.ok(r.clavierVoyelles && r.clavierSans, "la rangée des voyelles suit le réglage");
assert.deepStrictEqual(r.clavier, [true, true], "une disposition du clavier n'a pas toutes les lettres");
assert.deepStrictEqual(r.babConnu, [true, 24, 7, true], "un bab validé sans le faire entre en entier en révision");
assert.deepStrictEqual([...new Set(r.ambigues)], [], "question fabriquée ambiguë");
assert.deepStrictEqual([...new Set(r.jumeauxEcrits)], [], "un mot qui a un jumeau est demandé à l'écrit sans voyelles");
assert.deepStrictEqual([...new Set(r.jumeauxChoix)], [], "un mot qui a un jumeau figure dans un choix sans traduction");
assert.ok(r.jumeauReconnu, "مِنْ et مَنْ doivent être reconnus comme jumeaux");
console.log("Jumeaux connus :", r.jumeaux.join(" | "));
assert.deepStrictEqual(r.homographes, [], "deux mots de même écriture sont classés dans des sortes différentes");
assert.deepStrictEqual(r.naturesFautes, [], "sorte des mots : identifiant inconnu ou en double");
assert.ok(r.trainQ === 10 && r.trainV === 10 && r.trainSansEffet, "l'entraînement libre pose dix questions et ne touche pas au calendrier");
assert.ok(r.revueV && r.revueQ, "la révision du poème et celle de la grammaire sont séparées");
assert.ok(r.gramSansPoeme, "sans le poème, la leçon ne montre ni vers ni question de mémorisation");
assert.deepStrictEqual(r.reviser, { unitesRepliees: true, inactif: true, actif: true, boutonParcours: true, panneau: true, glossaire: true },
  "Réviser au choix : panneau du parcours, unités repliées, bouton de départ ; le glossaire n'a plus ce choix");
assert.deepStrictEqual(r.admin, { attente: true, lecteurs: true, filtres: true, envois: true, roue: true, plusDansVoix: true },
  "Partage des voix : vues de gestion, mes envois, roue dentée et pastille ; l'onglet Voix allégé");
assert.ok(r.adminSimple, "Partage des voix : un utilisateur voit seulement l'accord et ses envois");
assert.deepStrictEqual(r.voixEtat, { aucun: true, moi: true, badge: true, point: true }, "Voix : état de chaque élément visible (moi, autre, à enregistrer)");
assert.deepStrictEqual(r.choixVoix, { sansAncien: true, avecAncien: true, rognage: true }, "Voix : choisir entre l'ancien et le nouvel enregistrement");
// Les réponses de la base factice arrivent après coup (promesses) : on vérifie au tour suivant
setTimeout(() => assert.deepStrictEqual(r.essai(), { refus: true, lecture: true, jamaisAppele: true, auth: true, stats: true }, "Version d'essai : lecture seule de la vraie base, sauf les statistiques"), 0);
assert.deepStrictEqual(r.tableau, ["cours", true, true, "exo:fr2ar", false, true, true], "tableau : la cible suit l'écran, et le modèle ne donne pas la réponse");
assert.deepStrictEqual(r.formesFautes, [], "sens d'écriture des formes de position : tracé absent, hors du tableau, ou nombre de points incorrect");
assert.deepStrictEqual(r.lettresFautes, [], "sens d'écriture : tracé absent, hors du tableau, ou nombre de points de la lettre incorrect");
assert.deepStrictEqual(r.cadre, [400, 600, 300, 420], "un chemin est ramené au cadre de la lettre");
assert.deepStrictEqual(r.alifCentre, [500, 500], "une lettre sans largeur est centrée dans son cadre");
assert.deepStrictEqual(r.crayon, [true, false], "le crayon clignote tant qu'il n'a jamais été touché");
assert.deepStrictEqual(r.cheminMesure, [[0, 50, 100], [100, 70], 170], "longueur du chemin");
assert.ok(r.courbe > 15, "un trait est arrondi en courbe");
assert.deepStrictEqual(r.tableauFiche, ["w37", null, 240, "exo:fr2ar", false, 2], "tableau : fiche d'un tracé");
assert.deepStrictEqual(r.retirees, { liste: "a", bouton: true }, "Voix retirées : seules celles qui n'ont pas été remplacées peuvent être remises");
assert.deepStrictEqual(r.remettre, { local: true, sansLocal: true, admin: true, sansAccord: true }, "Onglet Voix : remettre dans le partage un enregistrement retiré");
assert.ok(r.toast, "Message bref visible après une action sur les voix");
assert.deepStrictEqual(r.guide, { ordre: true, micro: true, choix: true, garde: true, suite: true }, "Enregistrement guidé : ordre, micro, choix, garder un seul mot, mot suivant");
assert.ok(r.guideFin, "Enregistrement guidé : écran de fin");
assert.ok(r.guideEdit, "Enregistrement guidé : « Éditer l'audio » ouvre la piste et le rognage");
assert.ok(r.guidePrefixe, "Enregistrement guidé : actions hors du préfixe de la grammaire");
assert.deepStrictEqual(r.reprise4, { carte: true, taches: true, compteurs: true, erreur: true, panneau: true, finie: true },
  "Reprise : une leçon quittée en cours de route repart de la carte suivante, avec ses réponses, puis disparaît une fois finie");
assert.deepStrictEqual(r.refaire, { bouton: true, fiches: true, titre: true, calendrier: true }, "Refaire une leçon : fiches, et calendrier inchangé si tout est juste");
assert.ok(r.partage && r.compte, "sans réseau, l'application fonctionne sans le partage");
assert.strictEqual(r.doublons, 0, "deux éléments portent le même identifiant");
assert.deepStrictEqual(r.incomplets, [], "mots incomplets (id, ar, tr, fr, l obligatoires)");
assert.deepStrictEqual(r.horsLecon, [], "mots rattachés à une leçon absente de leur unité");
assert.strictEqual(r.leconsDoubles, 0, "un numéro de leçon est utilisé deux fois");
assert.deepStrictEqual(r.leconsVides, [], "une leçon doit compter au moins 3 éléments");
assert.deepStrictEqual(r.traductionsDoubles, [], "deux mots ont exactement la même traduction : préciser entre parenthèses");
assert.strictEqual(r.dieu, false);
console.log("Simulation réussie :", JSON.stringify({ elements: r.items, dus: r.dus, dusApres: r.dusApres, acquis: r.acquis }));
