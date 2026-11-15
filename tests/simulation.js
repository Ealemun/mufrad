// Test de bout en bout, sans navigateur : charge le contenu et l'application avec un faux document,
// puis joue une leçon, une révision avec une erreur et des révisions du jour, en vérifiant les règles clés.
// Lancement : node tests/simulation.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const lire = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const code = lire("js/contenu.js") + "\n" + lire("js/app.js");

// Faux environnement de navigateur, réduit à ce que l'application utilise
const store = {};
const el = () => ({ innerHTML: "", textContent: "", setAttribute() {}, removeAttribute() {}, dataset: {} });
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
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
out.dieu = JSON.stringify(ITEMS).includes("Dieu");
return out;`)();

assert.strictEqual(r.items, 110, "110 éléments attendus (28 lettres, 82 mots)");
assert.strictEqual(r.formes, 4, "le premier groupe de l'alphabet pose une question de forme par lettre");
assert.strictEqual(r.lettres, 4, "une séance d'alphabet introduit tout le groupe");
assert.strictEqual(r.alif, "ا|ا|ـا|ـا", "alif ne s'attache pas à la lettre suivante");
assert.strictEqual(r.ba, "ب|بـ|ـبـ|ـب", "bāʾ a quatre formes");
assert.ok(Math.abs(r.rognage[0] - 0.19) < 0.02 && Math.abs(r.rognage[1] - 0.58) < 0.02, "le rognage proposé encadre le son : " + r.rognage);
assert.strictEqual(r.wav, 44 + 2 * (Math.ceil(r.rognage[1] * 16000) - Math.floor(r.rognage[0] * 16000)), "taille du fichier rogné");
assert.deepStrictEqual(r.pics, [false, false, true, true, false, false, false, false], "la piste montre le son au bon endroit");
assert.ok(r.options.every(n => n === 3), "chaque question doit proposer trois mauvaises réponses");
assert.strictEqual(r.apresLecon, 6, "une séance d'apprentissage introduit 6 mots");
assert.strictEqual(r.echeanceReussi, 3, "un mot nouveau réussi revient dans 3 jours");
assert.strictEqual(r.echeanceRate, 1, "un mot raté revient le lendemain");
assert.strictEqual(r.apresRevision, 6 + 18, "réviser une leçon entière fait entrer ses 18 éléments dans le calendrier");
assert.strictEqual(r.serie, 1, "une séance terminée fait compter le jour");
assert.ok(r.dus > 0 && r.dusApres < r.dus, "la révision du jour doit faire baisser le nombre d'éléments dus");
assert.ok(r.acquis > 0, "des éléments doivent devenir acquis après plusieurs révisions espacées");
assert.ok(r.attente === 2 && r.avantDepot === false && r.vueAttente, "un fichier choisi attend en liste, sans être déposé");
assert.ok(r.deposes === 1 && r.apresDepot, "seuls les enregistrements gardés sont déposés à la confirmation");
assert.strictEqual(r.dieu, false);
console.log("Simulation réussie :", JSON.stringify({ elements: r.items, dus: r.dus, dusApres: r.dusApres, acquis: r.acquis }));
