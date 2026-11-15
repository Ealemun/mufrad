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
viewHome(); viewWords(); viewVoices(); viewSettings(); viewSheet(1);
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
out.dieu = JSON.stringify(ITEMS).includes("Dieu");
return out;`)();

assert.strictEqual(r.items, 91, "91 éléments attendus (9 lettres, 82 mots)");
assert.ok(r.options.every(n => n === 3), "chaque question doit proposer trois mauvaises réponses");
assert.strictEqual(r.apresLecon, 6, "une séance d'apprentissage introduit 6 mots");
assert.strictEqual(r.echeanceReussi, 3, "un mot nouveau réussi revient dans 3 jours");
assert.strictEqual(r.echeanceRate, 1, "un mot raté revient le lendemain");
assert.strictEqual(r.apresRevision, 6 + 18, "réviser une leçon entière fait entrer ses 18 éléments dans le calendrier");
assert.strictEqual(r.serie, 1, "une séance terminée fait compter le jour");
assert.ok(r.dus > 0 && r.dusApres < r.dus, "la révision du jour doit faire baisser le nombre d'éléments dus");
assert.ok(r.acquis > 0, "des éléments doivent devenir acquis après plusieurs révisions espacées");
assert.strictEqual(r.dieu, false);
console.log("Simulation réussie :", JSON.stringify({ elements: r.items, dus: r.dus, dusApres: r.dusApres, acquis: r.acquis }));
