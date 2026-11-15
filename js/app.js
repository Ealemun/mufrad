"use strict";
/* Mufrad — application (alpha 0). Aucune dépendance, aucun serveur : tout se passe dans le navigateur.
   Organisation :
     2. Dates et « jour d'apprentissage » (bascule à 4 h du matin)
     3. Stockage local de la progression
     4. Répétition espacée (FSRS-4.5)
     5. Séances : apprendre une leçon, réviser des leçons choisies, révision du jour
     6. Audio : enregistrements ajoutés par l'utilisateur, sinon voix arabe de l'appareil ; bruitages
     7. Affichage des écrans
     8. Gestion des clics et démarrage */

/* ---------- 2. DATES ---------- */

// Le « jour d'apprentissage » bascule à 4 h du matin : une séance faite à 1 h compte pour la veille.
// S.offset (en jours) sert uniquement au bouton de test « Avancer d'un jour ».
function today() {
  const d = new Date(Date.now() - 4 * 3600 * 1000 + (S.offset || 0) * 86400 * 1000);
  return keyOf(d);
}
// Clé AAAA-MM-JJ en heure locale (se compare comme une chaîne)
function keyOf(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// On raisonne à midi pour ne jamais tomber sur un changement d'heure
function dateOf(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function addDays(key, n) { const d = dateOf(key); d.setDate(d.getDate() + n); return keyOf(d); }
function diffDays(a, b) { return Math.round((dateOf(b) - dateOf(a)) / 86400000); }

/* ---------- 3. STOCKAGE LOCAL ---------- */

const KEY = "arabe-proto-u1-v1";
function blankState() {
  return {
    v: 2,
    goal: 10,        // objectif quotidien en minutes
    unit: 1,         // unité étudiée : les mots nouveaux en viennent
    translit: false, // translittération masquée par défaut : on apprend par l'écoute et la lecture
    cards: {},       // id -> état FSRS { s, d, due, last, reps, lapses }
    log: [],         // journal des réponses, jamais modifié : { t, id, ex, ok, ms }
    days: {},        // jour -> { done, answers, newIds }
    sfx: true,       // bruitages activés
    offset: 0        // décalage de test, en jours
  };
}
// Le stockage du navigateur peut manquer ou refuser : l'application doit fonctionner sans.
function loadState() {
  try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(blankState(), JSON.parse(raw)); } catch (e) {}
  return blankState();
}
function saveState() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
let S = loadState();
if ((S.v || 1) < 2) { S.translit = false; S.v = 2; } // passage à la version 2 du prototype

function dayRec(k) { return S.days[k] || (S.days[k] = { done: false, answers: 0, newIds: [] }); }

// La série est recalculée à partir des jours terminés, jamais stockée comme un compteur.
function streak() {
  let k = today();
  if (!(S.days[k] && S.days[k].done)) k = addDays(k, -1); // la séance du jour n'est pas encore faite : on part d'hier
  let n = 0;
  while (S.days[k] && S.days[k].done) { n++; k = addDays(k, -1); }
  return n;
}

/* ---------- 4. RÉPÉTITION ESPACÉE (FSRS-4.5) ---------- */

// Paramètres par défaut de FSRS-4.5. Notes : 1 = raté, 2 = difficile, 3 = bien, 4 = facile.
const W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466];
const DECAY = -0.5, FACTOR = 19 / 81; // avec ces constantes, un rappel visé de 90 % donne un intervalle égal à la stabilité
const clampD = d => Math.min(10, Math.max(1, d));
const initD = g => clampD(W[4] - (g - 3) * W[5]);

// Calcule le nouvel état d'une carte après une réponse notée `rating`, le jour `t`.
// `card` vaut undefined pour un élément vu pour la première fois.
function schedule(card, rating, t) {
  let s, d, reps = 1, lapses = rating === 1 ? 1 : 0;
  if (!card) {
    s = W[rating - 1];          // stabilité initiale selon la note
    d = initD(rating);          // difficulté initiale
  } else {
    const elapsed = Math.max(0, diffDays(card.last, t));
    const r = Math.pow(1 + FACTOR * elapsed / card.s, DECAY); // probabilité de rappel au moment de la réponse
    if (rating === 1) {
      // Oubli : la stabilité repart d'une valeur basse, sans jamais dépasser l'ancienne
      s = Math.min(card.s, W[11] * Math.pow(card.d, -W[12]) * (Math.pow(card.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
    } else {
      // Réussite : la stabilité grandit d'autant plus que le rappel était incertain
      const hard = rating === 2 ? W[15] : 1, easy = rating === 4 ? W[16] : 1;
      s = card.s * (1 + Math.exp(W[8]) * (11 - card.d) * Math.pow(card.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
    }
    // La difficulté bouge selon la note, avec un retour lent vers la valeur moyenne
    d = clampD(W[7] * initD(3) + (1 - W[7]) * (card.d - W[6] * (rating - 3)));
    reps = card.reps + 1;
    lapses = card.lapses + (rating === 1 ? 1 : 0);
  }
  s = Math.max(0.1, s);
  // Prochaine échéance : au moins le lendemain
  return { s, d, reps, lapses, last: t, due: addDays(t, Math.max(1, Math.round(s))) };
}

/* ---------- 5. SÉANCE ---------- */

let sess = null;            // séance en cours (en mémoire seulement)
const CHUNK_WORDS = 6;      // mots nouveaux introduits par séance d'apprentissage
const CHUNK_LETTERS = 3;    // lettres nouvelles par séance d'apprentissage

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// États d'un élément, utilisés partout dans l'interface
const isSeen = it => Boolean(S.cards[it.id]);
const isDue = it => isSeen(it) && S.cards[it.id].due <= today();                             // à revoir aujourd'hui
const isKnown = it => isSeen(it) && S.cards[it.id].s >= 7 && S.cards[it.id].due > today();   // acquis : solide et pas en retard
function lessonStats(l) {
  const its = itemsOf(l);
  return { its, total: its.length, seen: its.filter(isSeen).length, known: its.filter(isKnown).length, due: its.filter(isDue).length };
}
// Éléments en difficulté : déjà ratés au moins une fois et pas encore solides
function hardItems() { return ITEMS.filter(it => isSeen(it) && S.cards[it.id].lapses > 0 && S.cards[it.id].s < 7); }

// Exercice pour une lettre. Avec un son disponible et la translittération masquée, tout passe par l'écoute ;
// sinon on retombe sur le nom écrit en lettres latines (tour 1 : lettre -> nom, tour 2 : nom -> lettre).
function letterEx(it, round) {
  if (!S.translit && canSpeak(it.id)) return "listen";
  return round === 1 ? "l2n" : "n2l";
}
// Exercice pour une révision : reconnaissance tant que le mot est jeune, production ensuite.
function reviewExercise(it) {
  if (it.type === "letter") return letterEx(it, Math.random() < 0.5 ? 1 : 2);
  if (canSpeak(it.id) && Math.random() < 0.3) return "listen";
  return isSeen(it) && S.cards[it.id].s >= 7 ? "fr2ar" : "ar2fr";
}
const FLIP = { ar2fr: "fr2ar", fr2ar: "ar2fr", listen: "fr2ar" };
function otherWay(task) {
  const it = BY_ID[task.id];
  return it.type === "letter" ? letterEx(it, task.ex === "l2n" ? 2 : 1) : FLIP[task.ex];
}

function blankSession(kind, title) {
  return { kind, title, tasks: [], st: {}, n: 0, i: 0, answers: 0, correct: 0, learned: 0, cur: null, hist: [], peek: null, over: false };
}

// Apprendre : les prochains éléments jamais vus d'une leçon.
// Chacun est présenté par une fiche, interrogé aussitôt, puis réinterrogé dans l'autre sens en fin de séance.
function startLearn(l) {
  const unseen = itemsOf(l).filter(it => !isSeen(it));
  if (!unseen.length) return;
  const fresh = unseen.slice(0, unseen[0].type === "letter" ? CHUNK_LETTERS : CHUNK_WORDS);
  sess = blankSession("learn", lessonLabel(l));
  fresh.forEach(it => {
    sess.st[it.id] = { need: 2, err: false };
    sess.tasks.push({ kind: "intro", id: it.id });
    sess.tasks.push({ kind: "q", id: it.id, ex: it.type === "letter" ? letterEx(it, 1) : "ar2fr" });
  });
  const fw = fresh.filter(i => i.type === "word");
  if (fw.length >= 3) sess.tasks.push({ kind: "match", ids: fw.slice(0, 5).map(i => i.id) });
  shuffle(fresh.slice()).forEach(it => sess.tasks.push({ kind: "q", id: it.id, ex: it.type === "letter" ? letterEx(it, 2) : "fr2ar" }));
  sess.n = fresh.length;
  showTask();
}

// Réviser : on enchaîne les questions sur les éléments choisis jusqu'à tout maîtriser.
// Un élément est maîtrisé après deux bonnes réponses de suite, une dans chaque sens ; une erreur remet son compteur à zéro.
function startDrill(items, title) {
  if (!items.length) return;
  sess = blankSession("drill", title);
  shuffle(items.slice()).forEach(it => {
    sess.st[it.id] = { need: 2, err: false };
    if (!isSeen(it)) sess.tasks.push({ kind: "intro", id: it.id }); // jamais vu : on montre d'abord la fiche
    sess.tasks.push({ kind: "q", id: it.id, ex: it.type === "letter" ? letterEx(it, 1) : "ar2fr" });
  });
  sess.n = items.length;
  showTask();
}

// Révision du jour : tout ce qui est dû, toutes leçons confondues, les plus fragiles d'abord.
function startDaily() {
  const due = ITEMS.filter(isDue).sort((a, b) => S.cards[a.id].s - S.cards[b.id].s).slice(0, GOALS[S.goal]);
  if (!due.length) return;
  sess = blankSession("daily", "Révision du jour");
  shuffle(due).forEach(it => { sess.st[it.id] = { need: 1, err: false }; sess.tasks.push({ kind: "q", id: it.id, ex: reviewExercise(it) }); });
  sess.n = due.length;
  showTask();
}

// Trois mauvaises réponses plausibles : même type, même leçon en priorité.
function distractors(it) {
  const pool = ITEMS.filter(o => o.type === it.type && o.id !== it.id && (it.type === "letter" || o.fr !== it.fr));
  const near = shuffle(pool.filter(o => o.l === it.l)), far = shuffle(pool.filter(o => o.l !== it.l));
  return [...near, ...far].slice(0, 3);
}

// Prépare la carte courante (choix des propositions) puis l'affiche.
function showTask() {
  if (sess.i >= sess.tasks.length) return finishSession();
  const task = sess.tasks[sess.i];
  if (task.kind === "q") sess.cur = { opts: shuffle([BY_ID[task.id], ...distractors(BY_ID[task.id])]), picked: null, checked: false, t0: Date.now() };
  else if (task.kind === "match") sess.cur = { left: task.ids.slice(), right: shuffle(task.ids.slice()), sel: null, done: {}, bad: null };
  else sess.cur = {};
  render();
}

// Enregistre une réponse et met à jour l'élément si son travail dans cette séance est terminé.
function answer(task, ok, ms) {
  const st = sess.st[task.id];
  sess.answers++; if (ok) sess.correct++;
  S.log.push({ t: Date.now(), id: task.id, ex: task.ex, ok, ms });
  dayRec(today()).answers++;
  if (ok) {
    st.need--;
    if (st.need <= 0) finalize(task, st, ms);
    // En révision, une première réussite appelle une seconde question dans l'autre sens
    else if (sess.kind === "drill") sess.tasks.splice(Math.min(sess.i + 5, sess.tasks.length), 0, { kind: "q", id: task.id, ex: otherWay(task) });
  } else {
    st.err = true;
    if (sess.kind === "drill") st.need = 2; // il faudra de nouveau deux réussites de suite
    // Une erreur fait revenir la même question quelques cartes plus loin
    sess.tasks.splice(Math.min(sess.i + 4, sess.tasks.length), 0, { kind: "q", id: task.id, ex: task.ex });
  }
  saveState();
}

// Répercute le résultat sur le calendrier de révision (FSRS).
//  - élément nouveau : première note, « raté » s'il y a eu une erreur, « bien » sinon ;
//  - élément dû : note normale ;
//  - élément pas encore dû : une erreur le fait revenir plus tôt, une réussite ne change rien
//    (s'entraîner en avance ne doit pas gonfler artificiellement la maîtrise).
function finalize(task, st, ms) {
  const card = S.cards[task.id], t = today();
  const production = task.ex === "fr2ar" || task.ex === "n2l";
  if (!card) {
    S.cards[task.id] = schedule(undefined, st.err ? 1 : 3, t);
    dayRec(t).newIds.push(task.id); sess.learned++;
  } else if (card.due <= t) {
    S.cards[task.id] = schedule(card, st.err ? 1 : (production && ms < 3000 ? 4 : 3), t);
  } else if (st.err) {
    S.cards[task.id] = schedule(card, 1, t);
  }
}

// Une séance terminée avec au moins une réponse fait compter le jour dans la série.
function finishSession() {
  if (sess.answers > 0) { dayRec(today()).done = true; saveState(); }
  sess.over = true;
  sfx("done");
  render();
}

/* ---------- 6. AUDIO ---------- */

// Règle : aucun son n'est fabriqué par un service distant pendant la séance.
//  1) Si un enregistrement validé existe pour l'élément (table AUDIO), c'est lui qui est joué, toujours le même.
//  2) Sinon, la voix arabe installée sur l'appareil lit le texte.
//  3) Sans enregistrement ni voix arabe, les boutons d'écoute et l'exercice d'écoute sont masqués.
const AUDIO = {}; // id -> adresse d'un enregistrement (rempli au démarrage par les fichiers ajoutés dans l'onglet Voix)

// Texte donné à la voix quand il doit différer du texte affiché.
// La hamzat al-waṣl ne se prononce pas en milieu de phrase : on l'écrit ٱ pour que la voix fasse la liaison.
const SAY = {
  "وَعَلَيْكُمُ السَّلام": "وَعَلَيْكُمُ ٱلسَّلام",
  "ما اسْمُكَ؟": "مَا ٱسْمُكَ",
  "ما اسْمُكِ؟": "مَا ٱسْمُكِ",
  "مَعَ السَّلامَة": "مَعَ ٱلسَّلامَة",
  "ما شاءَ الله": "مَا شَاءَ ٱللّه"
};

let speakFn = null; // lecture par la voix arabe de l'appareil, si elle existe
const canSpeak = id => Boolean(AUDIO[id] || speakFn);
function audioReady() { if (!sess || sess.over) render(); }
function initAudio() {
  try {
    const pick = () => {
      const v = speechSynthesis.getVoices().find(v => /^ar/i.test(v.lang));
      if (v && !speakFn) {
        speakFn = txt => { const u = new SpeechSynthesisUtterance(txt); u.voice = v; u.lang = v.lang; u.rate = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); };
        audioReady();
      }
    };
    pick(); speechSynthesis.onvoiceschanged = pick;
  } catch (e) {}
}
function speak(id) {
  const it = BY_ID[id]; if (!it) return;
  if (AUDIO[id]) { try { new Audio(AUDIO[id]).play().catch(() => {}); } catch (e) {} return; }
  if (speakFn) speakFn(SAY[it.ar] || (it.type === "letter" ? NAME_AR[it.id] : it.ar).replace("؟", ""));
}


// --- Enregistrements fournis par l'utilisateur : gardés dans ce navigateur (IndexedDB), jamais envoyés ailleurs.
// Ils remplissent la table AUDIO au démarrage ; dès qu'un élément a son enregistrement, c'est lui qu'on entend.
let idb = null;
function openClipDb() {
  return new Promise(res => {
    try {
      const rq = indexedDB.open("arabe-proto-audio", 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore("clips"); // clé = identifiant de l'élément, valeur = fichier audio
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
async function loadClips() {
  idb = await openClipDb();
  if (!idb) return;
  await new Promise(res => {
    try {
      const rq = idb.transaction("clips").objectStore("clips").openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { AUDIO[c.key] = URL.createObjectURL(c.value); c.continue(); } else res(); };
      rq.onerror = () => res();
    } catch (e) { res(); }
  });
  audioReady();
}
function saveClip(id, file) {
  if (AUDIO[id]) URL.revokeObjectURL(AUDIO[id]);
  AUDIO[id] = URL.createObjectURL(file);
  try { if (idb) idb.transaction("clips", "readwrite").objectStore("clips").put(file, id); } catch (e) {}
}
function deleteClip(id) {
  if (AUDIO[id]) URL.revokeObjectURL(AUDIO[id]);
  delete AUDIO[id];
  try { if (idb) idb.transaction("clips", "readwrite").objectStore("clips").delete(id); } catch (e) {}
}

// --- Bruitages : de courtes notes fabriquées par le navigateur (aucun fichier), désactivables dans les réglages
let actx = null;
function note(freq, at, dur, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = "triangle"; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + dur); // extinction douce, sans clic
  o.connect(g); g.connect(actx.destination); o.start(at); o.stop(at + dur);
}
function sfx(name) {
  if (S.sfx === false) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    if (name === "tap")  note(620, t, 0.06, 0.08);                                              // sélection
    if (name === "ok")   { note(660, t, 0.12, 0.12); note(990, t + 0.1, 0.2, 0.12); }           // bonne réponse : deux notes montantes
    if (name === "ko")   { note(260, t, 0.16, 0.12); note(196, t + 0.13, 0.26, 0.12); }         // erreur : deux notes descendantes
    if (name === "done") { [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.11, 0.25, 0.1)); } // fin de séance
  } catch (e) {}
}

/* ---------- 7. AFFICHAGE ---------- */

const $top = document.getElementById("top"), $view = document.getElementById("view"), $foot = document.getElementById("foot");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const AR = (txt, cls) => `<span class="ar ${cls || ""}" lang="ar" dir="rtl">${esc(txt)}</span>`;
const ICON_SPEAK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const ICON_FLAME = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 12 18a5 5 0 0 1-5-5.5c0-1.8.8-3.2 1.8-4.3.3 1.6 1 2.5 2 3C10.300 8.500 10.800 5 12 2z"/><path d="M6 20.500h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const speakBtn = (id, label) => canSpeak(id) ? `<button class="speak" data-act="speak" data-id="${id}">${ICON_SPEAK}${label || "Écouter"}</button>` : "";
const translit = it => S.translit && it.tr ? `<span class="tr">${esc(it.tr)}</span>` : "";
const plural = (n, w) => n + " " + w + (n > 1 ? "s" : "");

function route() { return (location.hash || "#accueil").slice(1); }
let sheet = null; // numéro de la leçon dont le panneau est ouvert sur le parcours

const TABS = [["accueil", "Parcours"], ["mots", "Réviser"], ["voix", "Voix"], ["reglages", "Réglages"]];
function render() {
  const r = route(), inSess = sess && r === "accueil";
  if (inSess) {
    $top.innerHTML = sess.over ? "" : sessHead();
    $view.innerHTML = sess.over ? viewSummary() : viewTask();
    $foot.innerHTML = sessFoot();
  } else {
    const known = ITEMS.filter(isKnown).length;
    $top.innerHTML = `<div class="top"><span class="stat flame" title="Jours de suite">${ICON_FLAME}${streak()} <small>${streak() > 1 ? "jours" : "jour"}</small></span>
      <span class="alpha">alpha</span><span class="stat">${known} <small>/ ${ITEMS.length} acquis</small></span></div>`;
    $view.innerHTML = r === "mots" ? viewWords() : r === "voix" ? viewVoices() : r === "reglages" ? viewSettings() : viewHome();
    $foot.innerHTML = `<nav class="tabs" aria-label="Navigation">` + TABS.map(([h, label]) => `<a href="#${h}" ${h === r || (h === "accueil" && !TABS.some(t => t[0] === r)) ? 'aria-current="page"' : ""}>${label}</a>`).join("") + `</nav>`;
  }
}

// --- Parcours : maîtrise globale, révision du jour, puis une pastille par leçon du manuel
function viewHome() {
  const all = ITEMS.length, known = ITEMS.filter(isKnown).length, seen = ITEMS.filter(isSeen).length, due = ITEMS.filter(isDue).length;
  const order = UNITS.flatMap(u => u.lessons.map(x => x[0]));
  const next = order.find(l => { const s = lessonStats(l); return s.seen < s.total; }); // première leçon pas encore vue en entier
  const daily = due
    ? `<p><b>${plural(due, "élément")} à revoir aujourd'hui.</b></p><button class="btn gold" data-act="daily">Révision du jour</button>`
    : `<p class="muted">${seen ? "Aucune révision due aujourd'hui. Vous pouvez avancer dans une leçon ou réviser celle de votre choix." : "Touchez la première leçon pour commencer."}</p>`;
  const OFF = [0, 46, 70, 46, 0, -46, -70, -46]; // décalages qui font serpenter le parcours
  let k = 0;
  const path = UNITS.map(u => `<div class="unit-banner"><span class="ub-n">Unité ${u.n}</span><b>${esc(u.fr)}</b>${AR(u.ar)}</div><div class="path">` +
    u.lessons.map(([l, title]) => {
      const s = lessonStats(l), state = s.known === s.total ? "gold" : s.seen > 0 ? "on" : "off";
      return `<div class="stop" style="--x:${OFF[k++ % OFF.length]}px">
        ${l === next ? `<span class="go">${s.seen ? "Continuer" : "Commencer"}</span>` : ""}
        <span class="ring" style="--a:${100 * s.known / s.total};--b:${100 * s.seen / s.total}">
          <button class="node ${state}" data-act="node" data-l="${l}" aria-label="${esc(lessonLabel(l))} : ${s.known} acquis sur ${s.total}${s.due ? ", " + s.due + " à revoir" : ""}">${l}${s.due ? `<i class="badge">${s.due}</i>` : ""}</button></span>
        <div class="stop-txt"><b>${esc(title)}</b><span>${s.known} / ${s.total} acquis</span></div></div>`;
    }).join("") + `</div>`).join("");
  return `<section class="card"><h3>Ce que je connais</h3>
      <div class="tri" role="img" aria-label="${known} acquis, ${seen - known} en cours, ${all - seen} à découvrir"><span class="a" style="width:${100 * known / all}%"></span><span class="b" style="width:${100 * (seen - known) / all}%"></span></div>
      <div class="legend"><span class="a"><i></i>${known} acquis</span><span class="b"><i></i>${seen - known} en cours</span><span><i></i>${all - seen} à découvrir</span></div>
      ${daily}</section>${path}${sheet ? viewSheet(sheet) : ""}`;
}

// Panneau d'une leçon : où j'en suis, et les deux actions possibles
function viewSheet(l) {
  const s = lessonStats(l), unseen = s.total - s.seen;
  const chunk = Math.min(unseen, s.its[0].type === "letter" ? CHUNK_LETTERS : CHUNK_WORDS);
  return `<button class="scrim" data-act="sheet-close" aria-label="Fermer"></button>
    <div class="sheet" role="dialog" aria-label="${esc(lessonLabel(l))}">
      <h3>Leçon ${l}</h3><h2>${esc(LESSON_TITLE[l])}</h2>
      <div class="tiles"><div><b>${s.known}</b>acquis</div><div><b>${s.seen - s.known}</b>en cours</div><div><b>${unseen}</b>à découvrir</div></div>
      ${unseen ? `<button class="btn" data-act="learn" data-l="${l}">Apprendre ${plural(chunk, "nouveauté")}</button>` : ""}
      ${s.seen ? `<button class="btn ${unseen ? "ghost" : ""}" data-act="review" data-l="${l}">Réviser ce que j'ai vu (${s.seen})</button>` : ""}
      <button class="btn ghost" data-act="cram" data-l="${l}">Tout réviser d'un coup (${s.total})</button></div>`;
}

// --- Séance : en-tête (quitter, précédent, progression)
function sessHead() {
  const ro = sess.peek !== null, canBack = ro ? sess.peek > 0 : sess.hist.length > 0;
  const pct = sess.kind === "drill" ? 100 * Object.values(sess.st).filter(x => x.need <= 0).length / sess.n : 100 * sess.i / sess.tasks.length;
  return `<div class="sess-head"><button class="icon" data-act="quit" aria-label="Quitter la séance">✕</button>
    <button class="icon" data-act="back" aria-label="Carte précédente" ${canBack ? "" : "disabled"}>‹</button>
    <div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>`;
}
// Carte affichée : la carte en cours, ou une carte déjà faite quand on est revenu en arrière
function snapshot() { return sess.peek !== null ? sess.hist[sess.peek] : { task: sess.tasks[sess.i], cur: sess.cur }; }
function viewTask() {
  const { task, cur } = snapshot(), ro = sess.peek !== null;
  if (task.kind === "intro") return viewIntro(BY_ID[task.id]);
  if (task.kind === "match") return viewMatch(cur, ro);
  return viewQuestion(task, cur, ro);
}

// Pied de séance : le bouton d'action, et le bandeau de correction après vérification
function sessFoot() {
  if (sess.over) return `<div class="act"><button class="btn" data-act="home">Continuer</button></div>`;
  const { task, cur } = snapshot(), ro = sess.peek !== null;
  let verdict = "", tone = "";
  if (task.kind === "q" && cur.checked) {
    const it = BY_ID[task.id], ok = cur.opts[cur.picked].id === it.id;
    const detail = it.type === "letter" ? `${AR(it.ar)} ${esc(it.name)}` : `${AR(it.ar)} ${S.translit ? `<span class="tr">${esc(it.tr)}</span>` : ""} · ${esc(it.fr)}`;
    tone = ok ? "ok" : "ko";
    // Le verdict est porté par un signe et un texte, pas seulement par la couleur
    verdict = `<div class="verdict" role="status"><b>${ok ? "✓ Bien joué" : "✗ Bonne réponse :"}</b><span>${detail}</span></div>`;
  }
  let button;
  if (ro) button = `<button class="btn ${tone === "ko" ? "bad" : tone === "ok" ? "good" : ""}" data-act="fwd">${sess.peek === sess.hist.length - 1 ? "Revenir à la carte en cours" : "Carte suivante"}</button>`;
  else if (task.kind === "intro") button = `<button class="btn" data-act="next">Continuer</button>`;
  else if (task.kind === "match") button = `<button class="btn" data-act="next" ${cur.left.every(id => cur.done[id]) ? "" : "disabled"}>Continuer</button>`;
  else if (cur.checked) button = `<button class="btn ${tone === "ok" ? "good" : "bad"}" data-act="next">Continuer</button>`;
  else button = `<button class="btn" data-act="check" ${cur.picked === null ? "disabled" : ""}>Vérifier</button>`;
  return `<div class="act ${tone}">${verdict}${button}</div>`;
}

// Fiche de présentation d'un élément nouveau
function viewIntro(it) {
  const body = it.type === "letter"
    ? `${AR(it.ar, "glyph")}<p class="fr">${esc(it.name)}</p><p>${esc(it.desc)}</p>
       <p class="muted">${it.join ? `Début, milieu et fin de mot : ${AR(it.join)}` : `Attachée à la lettre précédente : ${AR(it.fin)} · ne s'attache jamais à la suivante`}</p>
       <p>Exemple : ${AR(it.ex)} <span class="muted">(${esc(it.exFr)})</span></p>`
    : `${AR(it.ar)}${translit(it)}<p class="fr">${esc(it.fr)}</p>${it.note ? `<p class="muted">${it.note.replace(/[؀-ۿ ]{2,}/g, m => AR(m.trim()) + " ")}</p>` : ""}`;
  return `<p class="ask"><small>${esc(lessonLabel(it.l))}</small>${it.type === "letter" ? "Nouvelle lettre" : "Nouveau mot"}</p>
    <section class="card fiche">${body}${speakBtn(it.id)}</section>`;
}

// Question à quatre choix : on sélectionne, puis on vérifie
function viewQuestion(task, c, ro) {
  const it = BY_ID[task.id], ex = task.ex;
  let prompt, optLabel, optCls = "", two = false, ask;
  if (ex === "ar2fr")  { ask = "Que signifie ce mot ?";             prompt = AR(it.ar) + translit(it) + speakBtn(it.id);  optLabel = o => esc(o.fr); }
  if (ex === "fr2ar")  { ask = "Comment le dit-on en arabe ?";      prompt = `<span class="fr">${esc(it.fr)}</span>`;   optLabel = o => esc(o.ar); optCls = "ar"; }
  if (ex === "listen") { ask = "Qu'entendez-vous ?";                prompt = speakBtn(it.id, "Écouter");                optLabel = o => esc(o.ar); optCls = "ar"; }
  if (ex === "listen" && it.type === "letter") { optCls = "ar glyph"; two = true; }
  if (ex === "l2n")    { ask = "Quelle est cette lettre ?";         prompt = AR(it.ar, "glyph") + speakBtn(it.id);       optLabel = o => `<b>${esc(o.name)}</b> · ${esc(o.s)}`; two = true; }
  if (ex === "n2l")    { ask = "Quelle lettre s'appelle ainsi ?";   prompt = `<span class="fr">${esc(it.name)} · ${esc(it.s)}</span>`; optLabel = o => esc(o.ar); optCls = "ar glyph"; two = true; }
  const opts = c.opts.map((o, k) => {
    let cls = "opt " + optCls;
    if (c.checked && o.id === it.id) cls += " right";
    else if (c.checked && k === c.picked) cls += " wrong";
    else if (!c.checked && k === c.picked) cls += " sel";
    const attrs = optCls ? ' lang="ar" dir="rtl"' : "";
    return `<button class="${cls}"${attrs} data-act="pick" data-k="${k}" ${c.checked || ro ? "disabled" : ""}>${optLabel(o)}</button>`;
  }).join("");
  return `<p class="ask"><small>${esc(lessonLabel(it.l))}</small>${ask}</p><div class="prompt">${prompt}</div><div class="opts ${two ? "two" : ""}">${opts}</div>`;
}

// Association de paires : on touche un mot d'un côté, puis son correspondant de l'autre, dans l'ordre qu'on veut
function viewMatch(c, ro) {
  const col = (ids, side) => ids.map(id => {
    const it = BY_ID[id];
    let cls = "opt" + (side === "L" ? " ar" : "");
    if (c.done[id]) cls += " locked";
    else if (c.sel && c.sel.side === side && c.sel.id === id) cls += " sel";
    else if (c.bad && c.bad.side === side && c.bad.id === id) cls += " wrong";
    const attrs = side === "L" ? ' lang="ar" dir="rtl"' : "";
    return `<button class="${cls}"${attrs} data-act="match" data-side="${side}" data-id="${id}" ${c.done[id] || ro ? "disabled" : ""}>${esc(side === "L" ? it.ar : it.fr)}</button>`;
  }).join("");
  return `<p class="ask"><small>${esc(sess.title)}</small>Associez les paires</p>
    <div class="opts two"><div class="opts">${col(c.left, "L")}</div><div class="opts">${col(c.right, "R")}</div></div>`;
}

// Bilan de fin de séance
function viewSummary() {
  const pct = sess.answers ? Math.round(100 * sess.correct / sess.answers) : 100;
  const head = sess.kind === "drill" ? "Tout est maîtrisé" : sess.kind === "learn" ? "Leçon avancée" : "Révision terminée";
  const tomorrow = addDays(today(), 1), dueTomorrow = ITEMS.filter(it => isSeen(it) && S.cards[it.id].due <= tomorrow).length;
  return `<p class="ask"><small>${esc(sess.title)}</small>${head}</p>
    <div class="tiles"><div><b>${sess.answers}</b>réponses</div><div><b>${pct} %</b>de réussite</div><div><b>${streak()}</b>${streak() > 1 ? "jours de suite" : "jour de suite"}</div></div>
    <section class="card">
      ${sess.learned ? `<div class="kv"><span>Nouveautés apprises</span><b>${sess.learned}</b></div>` : ""}
      <div class="kv"><span>Acquis au total</span><b>${ITEMS.filter(isKnown).length} / ${ITEMS.length}</b></div>
      <div class="kv"><span>À revoir demain</span><b>${dueTomorrow}</b></div>
      <p class="muted">Un élément devient acquis quand il a été réussi à plusieurs jours d'intervalle. Les révisions du jour le font progresser.</p></section>`;
}

// --- Réviser : choix libre de leçons, puis tout le contenu avec l'état de chaque élément
function stateOf(it) {
  if (!isSeen(it)) return ["", "à découvrir"];
  if (isDue(it)) return ["due", "à revoir"];
  if (isKnown(it)) return ["known", "acquis"];
  return ["learn", "en cours"];
}
let drillSel = {}; // leçons cochées (numéro de leçon -> true)
function drillItems() { return ITEMS.filter(it => drillSel[it.l]); }
function viewWords() {
  const row = it => {
    const [cls, label] = stateOf(it);
    const txt = it.type === "letter" ? `<b>${esc(it.name)}</b>` : `${esc(it.fr)}${S.translit ? `<br><span class="tr">${esc(it.tr)}</span>` : ""}`;
    return `<div class="wrow">${AR(it.ar)}<div class="txt">${txt}</div><span class="pill ${cls}">${label}</span></div>`;
  };
  const chips = UNITS.map(u => `<p class="muted">Unité ${u.n} · ${esc(u.fr)}</p><div class="chips">` +
    u.lessons.map(([l, title]) => `<button class="chip" data-act="drill-toggle" data-l="${l}" aria-pressed="${Boolean(drillSel[l])}">${l} · ${esc(title)}</button>`).join("") + `</div>`).join("");
  const n = drillItems().length, hard = hardItems().length;
  const groups = UNITS.map(u => u.lessons.map(([l]) => `<section class="panel"><h3>${esc(lessonLabel(l))}</h3><div>${itemsOf(l).map(row).join("")}</div></section>`).join("")).join("");
  return `<section class="panel"><h3>Réviser ce que je veux</h3>
      <p>Cochez une ou plusieurs leçons. Les questions s'enchaînent jusqu'à ce que chaque élément soit réussi deux fois de suite.</p>
      ${chips}
      <div class="row"><button class="btn small ghost" data-act="drill-all">Tout cocher</button><button class="btn small ghost" data-act="drill-none">Tout décocher</button></div>
      <button class="btn" data-act="drill-start" ${n ? "" : "disabled"}>${n ? "Réviser " + plural(n, "élément") : "Choisissez une leçon"}</button>
      ${hard ? `<button class="btn ghost" data-act="drill-hard">Reprendre mes ${plural(hard, "élément")} en difficulté</button>` : ""}</section>` + groups;
}

// --- Voix : enregistrer soi-même les lettres et les mots, à la place de la voix de l'appareil
let voiceLesson = 1; // leçon affichée dans l'onglet Voix
function viewVoices() {
  const its = itemsOf(voiceLesson), have = its.filter(it => AUDIO[it.id]).length;
  const total = ITEMS.filter(it => AUDIO[it.id]).length;
  const chips = UNITS.map(u => `<div class="chips">` + u.lessons.map(([l]) => {
    const n = itemsOf(l).filter(it => AUDIO[it.id]).length, t = itemsOf(l).length;
    return `<button class="chip" data-act="voice-lesson" data-l="${l}" aria-pressed="${l === voiceLesson}">Leçon ${l} · ${n}/${t}</button>`;
  }).join("") + `</div>`).join("");
  const rows = its.map(it => `<div class="vrow">${AR(it.ar)}
      <div class="vact">
        ${AUDIO[it.id] ? `<button class="mini" data-act="speak" data-id="${it.id}" aria-label="Écouter">${ICON_SPEAK}</button>` : `<span class="pill">sans voix</span>`}
        <label class="mini txt" for="f-${it.id}">${AUDIO[it.id] ? "Remplacer" : "Ajouter"}</label>
        <input class="vh" type="file" accept="audio/*" id="f-${it.id}" data-clip="${it.id}">
        ${AUDIO[it.id] ? `<button class="mini txt" data-act="clip-del" data-id="${it.id}">Retirer</button>` : ""}
      </div></div>`).join("");
  return `<section class="panel"><h3>Ma voix</h3>
      <p><b>${total} / ${ITEMS.length}</b> éléments ont un enregistrement. Dès qu'un élément en a un, c'est lui qu'on entend, à la place de la voix de l'appareil.</p>
      <p class="muted">Enregistrez avec le dictaphone du téléphone, puis ajoutez le fichier ici. Les enregistrements restent dans ce navigateur : ils ne sont pas encore partagés avec les autres testeurs.</p>
      ${chips}</section>
    <section class="panel"><h3>${esc(lessonLabel(voiceLesson))} · ${have} / ${its.length}</h3>
      <p class="muted">Pour aller vite : lisez toute la leçon d'une traite, dans l'ordre ci-dessous, découpez l'enregistrement avec le script, puis ajoutez tous les fichiers d'un coup.</p>
      <label class="btn ghost" for="f-bulk">Ajouter les ${its.length} fichiers de la leçon, dans l'ordre</label>
      <input class="vh" type="file" accept="audio/*" multiple id="f-bulk" data-bulk="${voiceLesson}">
      ${uiMsg ? `<p role="status"><b>${esc(uiMsg)}</b></p>` : ""}
      <div>${rows}</div></section>`;
}

// --- Réglages : objectif, translittération, sauvegarde, outils de test
let uiMsg = "", askReset = false;
function viewSettings() {
  const seg = [5, 10, 15].map(g => `<button data-act="goal" data-g="${g}" aria-pressed="${S.goal === g}">${g} min</button>`).join("");
  return `
    <section class="panel"><h3>Objectif quotidien</h3><div class="seg">${seg}</div>
      <p class="muted">Fixe le nombre maximal d'éléments dans la révision du jour (${GOALS[S.goal]}).</p></section>
    <section class="panel"><h3>Affichage</h3>
      <div class="seg"><button data-act="translit" data-on="1" aria-pressed="${S.translit}">Avec translittération</button><button data-act="translit" data-on="0" aria-pressed="${!S.translit}">Arabe seul</button></div></section>
    <section class="panel"><h3>Bruitages</h3>
      <div class="seg"><button data-act="sfx" data-on="1" aria-pressed="${S.sfx !== false}">Activés</button><button data-act="sfx" data-on="0" aria-pressed="${S.sfx === false}">Coupés</button></div></section>
    <section class="panel"><h3>Sauvegarde</h3>
      <p class="muted">La progression est gardée dans ce navigateur seulement. Pour la transférer, copiez ce texte et collez-le sur l'autre appareil.</p>
      <label for="io" class="muted">Données de progression</label>
      <textarea id="io" spellcheck="false">${esc(JSON.stringify({ v: S.v, goal: S.goal, unit: S.unit, translit: S.translit, cards: S.cards, log: S.log, days: S.days }))}</textarea>
      <div class="row"><button class="btn small ghost" data-act="copy">Copier</button><button class="btn small ghost" data-act="import">Remplacer par le texte collé</button></div>
      ${uiMsg ? `<p role="status"><b>${esc(uiMsg)}</b></p>` : ""}</section>
    <section class="panel"><h3>Version alpha</h3>
      <p class="muted">Cette version est en cours de test. Le contenu n'est pas encore entièrement relu et la progression peut être remise à zéro d'une version à l'autre.</p>
      <a class="btn ghost" href="https://github.com/Ealemun/mufrad/issues">Signaler un problème</a></section>
    <section class="panel"><h3>Outils de test</h3>
      <p class="muted">Avancer la date permet de vérifier qu'un mot raté revient plus tôt qu'un mot réussi. Décalage actuel : ${S.offset} jour${S.offset > 1 ? "s" : ""}.</p>
      <div class="row"><button class="btn small ghost" data-act="skip">Avancer d'un jour</button>
      ${askReset ? `<button class="btn small" data-act="reset-yes">Confirmer : tout effacer</button><button class="btn small ghost" data-act="reset-no">Annuler</button>`
                 : `<button class="btn small ghost" data-act="reset">Effacer la progression</button>`}</div></section>`;
}

/* ---------- 8. CLICS ET DÉMARRAGE ---------- */

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act;
  if (act !== "copy" && act !== "import") uiMsg = "";
  switch (act) {
    // Parcours
    case "node": sheet = Number(el.dataset.l); break;
    case "sheet-close": sheet = null; break;
    case "daily": startDaily(); return;
    case "learn": sheet = null; startLearn(Number(el.dataset.l)); return;
    case "review": { const l = Number(el.dataset.l); sheet = null; startDrill(itemsOf(l).filter(isSeen), lessonLabel(l)); return; }
    case "cram": { const l = Number(el.dataset.l); sheet = null; startDrill(itemsOf(l), lessonLabel(l)); return; }
    // Onglet Réviser
    case "drill-toggle": drillSel[el.dataset.l] = !drillSel[el.dataset.l]; break;
    case "drill-all": UNITS.forEach(u => u.lessons.forEach(([l]) => { drillSel[l] = true; })); break;
    case "drill-none": drillSel = {}; break;
    case "drill-start": startDrill(drillItems(), "Révision choisie"); location.hash = "#accueil"; return;
    case "drill-hard": startDrill(hardItems(), "Éléments en difficulté"); location.hash = "#accueil"; return;
    // Séance
    case "speak": speak(el.dataset.id); return;
    case "quit": case "home": sess = null; break;          // les réponses déjà données sont conservées
    case "next":                                            // on garde la carte faite pour pouvoir la relire
      sess.hist.push({ task: sess.tasks[sess.i], cur: sess.cur }); sess.i++; showTask(); return;
    case "back": sess.peek = sess.peek === null ? sess.hist.length - 1 : Math.max(0, sess.peek - 1); break;
    case "fwd": sess.peek = sess.peek + 1 >= sess.hist.length ? null : sess.peek + 1; break;
    case "pick":                                            // sélection d'une proposition (modifiable avant de vérifier)
      if (sess.peek !== null || sess.cur.checked) return;
      {
        const k = Number(el.dataset.k), c = sess.cur, ex = sess.tasks[sess.i].ex;
        if (c.picked === k) { c.picked = null; sfx("tap"); break; }   // second appui sur le même choix : on le désélectionne
        c.picked = k;
        if ((ex === "fr2ar" || ex === "n2l") && canSpeak(c.opts[k].id)) speak(c.opts[k].id); else sfx("tap");
      }
      break;
    case "check": {                                         // vérification de la proposition sélectionnée
      const task = sess.tasks[sess.i], c = sess.cur;
      if (sess.peek !== null || c.checked || c.picked === null) return;
      c.checked = true;
      sfx(c.opts[c.picked].id === task.id ? "ok" : "ko");
      answer(task, c.opts[c.picked].id === task.id, Date.now() - c.t0);
      break;
    }
    case "match": {                                         // association de paires, dans n'importe quel ordre
      if (sess.peek !== null) return;
      const c = sess.cur, pick = { side: el.dataset.side, id: el.dataset.id };
      if (c.sel && c.sel.side === pick.side && c.sel.id === pick.id) { c.sel = null; sfx("tap"); }  // second appui : on désélectionne
      else if (!c.sel || c.sel.side === pick.side) {                                                // premier choix, ou changement d'avis du même côté
        c.sel = pick; c.bad = null;
        if (pick.side === "L" && canSpeak(pick.id)) speak(pick.id); else sfx("tap");
      }
      else {
        const arId = pick.side === "L" ? pick.id : c.sel.id; // le mot arabe de la paire tentée
        if (c.sel.id === pick.id) { c.done[pick.id] = true; sess.answers++; sess.correct++; c.bad = null; sfx("ok"); }
        else { sess.answers++; sess.st[arId].err = true; c.bad = pick; sfx("ko"); } // l'erreur comptera dans la note du mot
        c.sel = null;
      }
      break;
    }
    // Voix
    case "voice-lesson": voiceLesson = Number(el.dataset.l); break;
    case "clip-del": deleteClip(el.dataset.id); break;
    // Réglages
    case "sfx": S.sfx = el.dataset.on === "1"; saveState(); if (S.sfx) sfx("ok"); break;
    case "goal": S.goal = Number(el.dataset.g); saveState(); break;
    case "translit": S.translit = el.dataset.on === "1"; saveState(); break;
    case "skip": S.offset = (S.offset || 0) + 1; saveState(); break;
    case "reset": askReset = true; break;
    case "reset-no": askReset = false; break;
    case "reset-yes": S = blankState(); saveState(); askReset = false; sess = null; break;
    case "copy": {
      const ta = document.getElementById("io");
      try { navigator.clipboard.writeText(ta.value).then(() => { uiMsg = "Copié."; render(); }, () => { ta.select(); uiMsg = "Copie refusée : le texte est sélectionné, copiez-le à la main."; render(); }); }
      catch (err) { ta.select(); }
      return;
    }
    case "import": {
      try {
        const data = JSON.parse(document.getElementById("io").value);
        if (!data || typeof data.cards !== "object" || !Array.isArray(data.log)) throw new Error("format");
        S = Object.assign(blankState(), data); saveState(); sess = null; uiMsg = "Progression remplacée.";
      } catch (err) { uiMsg = "Texte illisible : collez le texte copié depuis l'autre appareil, en entier."; }
      break;
    }
  }
  render();
});

// Fichiers audio choisis dans l'onglet Voix
document.addEventListener("change", e => {
  const el = e.target;
  if (!el.files || !el.files.length) return;
  if (el.dataset.clip) {                       // un fichier pour un élément
    saveClip(el.dataset.clip, el.files[0]); uiMsg = "";
  } else if (el.dataset.bulk) {                // tous les fichiers d'une leçon : rangés par nom, attribués dans l'ordre de la leçon
    const its = itemsOf(Number(el.dataset.bulk));
    const files = Array.from(el.files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (files.length !== its.length) uiMsg = `Cette leçon compte ${its.length} éléments et vous avez choisi ${files.length} fichiers : rien n'a été ajouté.`;
    else { files.forEach((f, i) => saveClip(its[i].id, f)); uiMsg = `${files.length} enregistrements ajoutés. Écoutez-les pour vérifier l'ordre.`; }
  }
  render();
});

window.addEventListener("hashchange", () => { sheet = null; render(); });
render();
initAudio();
loadClips();
