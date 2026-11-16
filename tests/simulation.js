// Test de bout en bout, sans navigateur : charge le contenu et l'application avec un faux document,
// puis joue une leçon, une révision avec une erreur et des révisions du jour, en vérifiant les règles clés.
// Lancement : node tests/simulation.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const lire = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const unites = fs.readdirSync(path.join(__dirname, "..", "js", "unites")).filter(f => f.endsWith(".js")).sort();
const gram = fs.readdirSync(path.join(__dirname, "..", "js", "grammaire")).filter(f => f.endsWith(".js")).sort();
const code = [lire("js/contenu.js"), ...unites.map(f => lire("js/unites/" + f)), lire("js/assemblage.js"),
  lire("js/grammaire.js"), ...gram.map(f => lire("js/grammaire/" + f)), lire("js/app.js")].join("\n");
gram.forEach(f => assert.ok(lire("index.html").includes("js/grammaire/" + f), "index.html ne charge pas js/grammaire/" + f));
// Chaque fichier d'unité doit aussi être déclaré dans la page, sinon il ne serait jamais chargé
unites.forEach(f => assert.ok(lire("index.html").includes("js/unites/" + f), "index.html ne charge pas js/unites/" + f));

// Faux environnement de navigateur, réduit à ce que l'application utilise
const store = {};
const el = () => ({ innerHTML: "", textContent: "", setAttribute() {}, removeAttribute() {}, dataset: {} });
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.document = { getElementById: el, querySelectorAll: () => [], addEventListener() {} };
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
      c.checked = true; answer(t, c.opts[c.picked].id === t.id, 4000); sessFoot();
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
viewHome(); viewWords(); viewVoices(); viewSettings(); viewSheet(1); viewSheet(101);
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
// Mesure d'audience : les événements attendent en file ; un refus vide la file, efface l'identifiant et arrête le comptage ;
// l'identifiant d'appareil est stable, puis renouvelé après 13 mois
fileMesure = []; S.mesure = true;
noter("clic", "learn:3"); startLearn(2); const fileAvant = fileMesure.map(e => e.type + "/" + e.detail);
const id1 = appareilId(), id2 = appareilId();
localStorage.setItem(APPAREIL_KEY, JSON.stringify({ id: id1, cree: Date.now() - 400 * 86400000 })); const id3 = appareilId();
choisirMesure(false); noter("clic", "x");
out.mesure = { file: fileAvant.slice(0, 2), stable: Boolean(id1) && id1 === id2, renouvele: id3 !== id1,
  refus: fileMesure.length === 0 && localStorage.getItem(APPAREIL_KEY) === null, reglage: viewSettings().includes("Ne pas me compter") };
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
  return !(a.opts.length === 4 && a.bon >= 0 && a.prompt.includes("blank") && b.type === "ecrit" && b.answer && (v.a + " " + v.b).includes(b.answer)); }).map(v => v.id);
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
assert.deepStrictEqual(r.mesure, { file: ["clic/learn:3", "seance_debut/learn"], stable: true, renouvele: true, refus: true, reglage: true },
  "statistiques : file d'événements, identifiant stable puis renouvelé, refus respecté");
assert.deepStrictEqual(r.srcPages.filter(f => !fs.existsSync(path.join(__dirname, "..", f))), [], "édition de référence : image de page absente");
assert.deepStrictEqual(r.srcBabs, [], "édition de référence : un bab du poème n'a pas de page");
assert.ok(r.srcVue, "la visionneuse affiche la page demandée");
assert.strictEqual(r.premierVers, "قَالَ عُبَيْدُ رَبِّهِ مُحَمَّدُ", "le premier vers doit être celui de l'édition de référence");
assert.deepStrictEqual(r.gramDoubles, [], "grammaire : identifiant en double");
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
assert.ok(r.partage && r.compte, "sans réseau, l'application fonctionne sans le partage");
assert.strictEqual(r.doublons, 0, "deux éléments portent le même identifiant");
assert.deepStrictEqual(r.incomplets, [], "mots incomplets (id, ar, tr, fr, l obligatoires)");
assert.deepStrictEqual(r.horsLecon, [], "mots rattachés à une leçon absente de leur unité");
assert.strictEqual(r.leconsDoubles, 0, "un numéro de leçon est utilisé deux fois");
assert.deepStrictEqual(r.leconsVides, [], "une leçon doit compter au moins 3 éléments");
assert.deepStrictEqual(r.traductionsDoubles, [], "deux mots ont exactement la même traduction : préciser entre parenthèses");
assert.strictEqual(r.dieu, false);
console.log("Simulation réussie :", JSON.stringify({ elements: r.items, dus: r.dus, dusApres: r.dusApres, acquis: r.acquis }));
