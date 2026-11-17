"use strict";
/* Mufrad — application (alpha 0). Aucune dépendance, aucun serveur : tout se passe dans le navigateur.
   Organisation :
     2. Dates et « jour d'apprentissage » (bascule à 4 h du matin)
     3. Stockage local de la progression
     4. Répétition espacée (FSRS-4.5)
     5. Séances : apprendre une leçon, réviser des leçons choisies, révision du jour
     6. Audio : enregistrements ajoutés par l'utilisateur, sinon voix arabe de l'appareil ; bruitages
     7. Affichage des écrans
     8. Gestion des clics et démarrage
     9. Compte et partage des enregistrements (base de données en ligne) */

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

// Version d'essai : une branche en cours de relecture, publiée à l'adresse …/essai/<nom de la branche>/.
// Elle garde sa progression à part, pour ne jamais abîmer la vraie, et ne synchronise rien avec le compte.
const ESSAI = (((typeof location !== "undefined" && location.pathname) || "").match(/\/essai\/([^/]+)\//) || [])[1] || "";
const KEY_MAIN = "arabe-proto-u1-v1";
const KEY = KEY_MAIN + (ESSAI ? "-essai-" + ESSAI : "");
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
    shared: {},      // enregistrements déjà envoyés au serveur : id -> emplacement du fichier
    readers: [],     // lecteurs choisis dans les réglages (vide = tous)
    voiceIdx: {},    // voix choisie pour chaque élément qui en a plusieurs : id -> rang
    mic: "",         // micro choisi pour enregistrer (vide = celui par défaut)
    fold: {},        // unités pliées ou dépliées à la main dans le parcours : numéro -> true si pliée
    mesure: true,    // statistiques anonymes d'utilisation (refusables dans les réglages)
    reprise: {},     // leçons quittées en cours de route : numéro -> où l'on s'était arrêté (voir gardeSeance)
    offset: 0        // décalage de test, en jours
  };
}
// Le stockage du navigateur peut manquer ou refuser : l'application doit fonctionner sans.
function loadState() {
  try {
    // À sa première ouverture, une version d'essai part d'une copie de la progression de la version principale
    const raw = localStorage.getItem(KEY) || (ESSAI ? localStorage.getItem(KEY_MAIN) : null);
    if (raw) return Object.assign(blankState(), JSON.parse(raw));
  } catch (e) {}
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

// Fusionne deux progressions (celle de l'appareil et la copie du compte) sans rien perdre, même quand plusieurs
// appareils ont avancé chacun de son côté, hors ligne. Le résultat ne dépend pas de l'ordre des deux copies,
// et refusionner un résultat ne le change plus : on peut synchroniser autant de fois qu'on veut.
//   - journal : toutes les réponses des deux côtés, une seule fois chacune, dans l'ordre du temps
//     (il reste complet : la future synchronisation par le journal pourra tout recalculer à partir de lui) ;
//   - cartes : pour chaque élément, l'état le plus récent (dernière révision, puis le plus de réponses) ;
//   - jours : un jour compte dans la série s'il a été terminé d'un côté ou de l'autre.
// Les réglages (objectif, translittération, bruitages…) restent ceux de l'appareil : ils ne sont pas fusionnés.
function mergeProgress(a, b) {
  const cle = e => [e.t, e.id, e.ex, e.ok].join("|");
  const log = {};
  [...(a.log || []), ...(b.log || [])].forEach(e => { log[cle(e)] = e; });
  // Départage de deux états d'un même élément ; le dernier critère (le texte) ne sert qu'à rester indépendant de l'ordre
  const recent = (x, y) => !x ? y : !y ? x
    : x.last !== y.last ? (x.last > y.last ? x : y)
    : x.reps !== y.reps ? (x.reps > y.reps ? x : y)
    : JSON.stringify(x) >= JSON.stringify(y) ? x : y;
  // Clés triées : le résultat est exactement le même quel que soit l'ordre des deux copies
  const cards = {};
  [...new Set([...Object.keys(a.cards || {}), ...Object.keys(b.cards || {})])].sort().forEach(id => { cards[id] = recent((a.cards || {})[id], (b.cards || {})[id]); });
  const days = {};
  [...new Set([...Object.keys(a.days || {}), ...Object.keys(b.days || {})])].sort().forEach(k => {
    const x = (a.days || {})[k] || {}, y = (b.days || {})[k] || {};
    days[k] = { done: Boolean(x.done || y.done), answers: Math.max(x.answers || 0, y.answers || 0),
      newIds: [...new Set([...(x.newIds || []), ...(y.newIds || [])])].sort() };
  });
  return { cards, log: Object.values(log).sort((x, y) => x.t - y.t || (cle(x) < cle(y) ? -1 : 1)), days };
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
const CHUNK_LETTERS = 5;    // lettres nouvelles par séance : un groupe entier de l'alphabet

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

// Exercices pour une lettre.
//   tour 1 : reconnaître la lettre par son nom — à l'écoute si un son existe et que la translittération est masquée,
//            sinon par son nom écrit en lettres latines ;
//   tour 2 : reconnaître la lettre sous une autre forme (début, milieu ou fin de mot), sans aucune phonétique.
function letterEx(it, round) {
  if (round === 2) return "f2l";
  return !S.translit && canSpeak(it.id) ? "listen" : "l2n";
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
  return it.type === "letter" ? letterEx(it, task.ex === "f2l" ? 1 : 2) : FLIP[task.ex];
}

// l : leçon travaillée (seulement pour « apprendre ») ; t0 : début, pour la durée notée dans les statistiques
function blankSession(kind, title, l) {
  return { kind, title, l: l == null ? null : l, t0: Date.now(), noted: false, tasks: [], st: {}, n: 0, i: 0, answers: 0, correct: 0, learned: 0, cur: null, hist: [], peek: null, over: false };
}
// Ce qui décrit une séance dans les statistiques
const sessStats = () => ({ l: sess.l == null ? null : String(sess.l), rep: sess.answers, justes: sess.correct, duree_s: Math.round((Date.now() - sess.t0) / 1000) });

// Apprendre : les prochains éléments jamais vus d'une leçon.
// Chacun est présenté par une fiche, interrogé aussitôt, puis réinterrogé dans l'autre sens en fin de séance.
// Apprendre : les nouveautés d'une leçon, par petits paquets (fiche, question, association, question inverse).
// Refaire (redo) : le même déroulé, avec tout ce qui a déjà été vu de la leçon, fiches comprises.
// La progression n'en souffre pas : un élément déjà connu revu en avance garde son calendrier,
// seule une erreur le fait revenir plus tôt (voir finalize).
function startLearn(l, redo) {
  const pool = itemsOf(l).filter(it => redo ? isSeen(it) : !isSeen(it));
  if (!pool.length) return;
  const fresh = redo ? pool : pool.slice(0, pool[0].type === "letter" ? CHUNK_LETTERS : CHUNK_WORDS);
  sess = blankSession("learn", lessonLabel(l), l);
  sess.redo = Boolean(redo);
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

// Reprise d'une leçon quittée en cours de route (bouton ✕, onglet changé, application fermée).
// À chaque carte, la séance « apprendre » est recopiée dans la progression : la liste des cartes, le point où l'on en est
// et ce qui reste à réussir pour chaque élément. Les choix proposés ne sont pas gardés : ils sont retirés à la reprise.
// i = carte à montrer à la reprise (la suivante dès qu'on a répondu, pour ne pas poser deux fois la même question).
function gardeSeance(i) {
  if (!sess || sess.kind !== "learn" || sess.over) return;
  S.reprise = S.reprise || {};
  S.reprise[sess.l] = { redo: sess.redo, tasks: sess.tasks, st: sess.st, i, n: sess.n, answers: sess.answers, correct: sess.correct, learned: sess.learned, quand: Date.now() };
  saveState();
}
// Leçon quittée le plus récemment, pour le bouton « Reprendre » du parcours (undefined s'il n'y en a pas)
function derniereReprise() {
  const r = S.reprise || {};
  return Object.keys(r).map(Number).filter(l => LESSON_TITLE[l] !== undefined).sort((a, b) => (r[b].quand || 0) - (r[a].quand || 0))[0];
}
// Repart de la carte où l'on s'était arrêté. Si un mot de la séance n'existe plus (vocabulaire corrigé entre-temps),
// la reprise est abandonnée et la leçon repart normalement.
function resumeLearn(l) {
  const r = (S.reprise || {})[l];
  const ok = r && r.tasks.every(t => (t.ids || [t.id]).every(id => BY_ID[id]));
  if (!ok) { if (S.reprise) delete S.reprise[l]; saveState(); return startLearn(l); }
  sess = blankSession("learn", lessonLabel(l), l);
  Object.assign(sess, { redo: Boolean(r.redo), tasks: r.tasks, st: r.st, i: r.i, n: r.n, answers: r.answers, correct: r.correct, learned: r.learned });
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
  if (!sess.noted) { sess.noted = true; noter("seance_debut", sess.kind, { l: sess.l == null ? null : String(sess.l), n: sess.n }); }   // statistiques
  if (sess.i >= sess.tasks.length) return finishSession();
  gardeSeance(sess.i);   // si l'on quitte maintenant, on reprendra à cette carte
  const task = sess.tasks[sess.i];
  if (task.kind === "q") {
    sess.cur = { opts: shuffle([BY_ID[task.id], ...distractors(BY_ID[task.id])]), picked: null, checked: false, t0: Date.now() };
    // Pour la question sur les formes, on tire une fois pour toutes la forme montrée (jamais la forme isolée)
    if (task.ex === "f2l") { const f = formsOf(BY_ID[task.id]); sess.cur.form = shuffle([f.debut, f.milieu, f.fin].filter(x => x !== f.isolee))[0]; }
  }
  else if (task.kind === "match") sess.cur = { left: task.ids.slice(), right: shuffle(task.ids.slice()), sel: null, done: {}, bad: null };
  else sess.cur = {};
  render();
}

// Enregistre une réponse et met à jour l'élément si son travail dans cette séance est terminé.
function answer(task, ok, ms, choix) {
  const st = sess.st[task.id];
  noterReponse(task, ok, ms, choix, st);
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
  gardeSeance(sess.i + 1);   // question répondue : une reprise repartira de la suivante
  saveState();
}

// Statistiques d'une réponse, notées avant la mise à jour du calendrier (pour connaître l'état de l'élément avant).
//   etat : n = nouveau, d = dû aujourd'hui, a = révisé en avance ; ecart : jours depuis sa dernière révision (par tranches)
function noterReponse(task, ok, ms, choix, st) {
  const card = S.cards[task.id], t = today();
  st.essais = (st.essais || 0) + 1;
  noter("reponse", task.id, {
    ex: task.ex, ok, ms: Math.min(Math.round(ms || 0), 600000), rang: st.essais, s: sess.kind,
    l: BY_ID[task.id] ? String(BY_ID[task.id].l) : null,
    choix: ok ? null : choix || null,
    etat: !card ? "n" : card.due <= t ? "d" : "a",
    ecart: card && card.last ? tranche(diffDays(card.last, t), T_JOURS) : null
  });
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
  if (sess.kind === "learn" && S.reprise) delete S.reprise[sess.l];   // leçon menée au bout : plus rien à reprendre
  if (sess.answers > 0) dayRec(today()).done = true;
  saveState();
  noter("seance_fin", sess.kind, { ...sessStats(), appris: sess.learned });   // statistiques
  sess.over = true;
  sfx("done");
  render();
}

/* ---------- 6. AUDIO ---------- */

// Règle : aucun son n'est fabriqué par un service distant pendant la séance.
//  1) Si un enregistrement validé existe pour l'élément (table AUDIO), c'est lui qui est joué, toujours le même.
//  2) Sinon, la voix arabe installée sur l'appareil lit le texte.
//  3) Sans enregistrement ni voix arabe, les boutons d'écoute et l'exercice d'écoute sont masqués.
const AUDIO = {}; // id -> adresse de la voix actuellement choisie pour cet élément (voir voicesFor)

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
function speak(id, dep) {
  const it = BY_ID[id]; if (!it) return;
  // statistiques : voix de l'appareil (enregistrement local), voix partagée, synthèse, ou rien à entendre
  noter("ecoute", id, { src: AUDIO[id] ? (CLIPS[id] && AUDIO[id] === CLIPS[id].url ? "perso" : "partagee") : speakFn ? "synthese" : "aucune", dep: dep || "bouton" });
  if (AUDIO[id]) { try { new Audio(AUDIO[id]).play().catch(() => {}); } catch (e) {} return; }
  if (speakFn) speakFn(SAY[it.ar] || (it.type === "letter" ? NAME_AR[it.id] : it.ar).replace("؟", ""));
}


// --- Enregistrements fournis par l'utilisateur : gardés dans ce navigateur (IndexedDB), jamais envoyés ailleurs.
// Ils remplissent la table AUDIO au démarrage ; dès qu'un élément a son enregistrement, c'est lui qu'on entend.
let idb = null;
// Enregistrements déposés sur cet appareil : id -> { orig, cut, a, b, url }
//   orig = fichier d'origine, gardé pour pouvoir reprendre le rognage plus tard ;
//   cut  = passage gardé, celui qu'on entend et qu'on partage ; a, b = début et fin gardés, en secondes ;
//   url  = adresse locale du passage gardé, pour l'écouter.
const CLIPS = {};
// Voix publiées pour tous : id -> liste { vid, url, auteur, chemin }, une par lecteur, dans l'ordre des lecteurs
const SHARED = {};
const READERS = [];        // identifiants des lecteurs publiés, dans l'ordre de leur première contribution
const READER_NAME = {};    // identifiant du lecteur -> nom choisi par lui (s'il en a donné un)
const readerLabel = a => READER_NAME[a] || "Voix " + (READERS.indexOf(a) + 1);

// Les voix qu'on peut entendre pour un élément, dans un ordre fixe (jamais au hasard) :
// d'abord sa propre voix sur cet appareil, puis celles des lecteurs choisis dans les réglages
// (ou tous les lecteurs si aucun n'est choisi, ou si aucun des lecteurs choisis n'a enregistré cet élément).
function voicesFor(id) {
  const list = [];
  if (CLIPS[id]) list.push({ vid: "local", url: CLIPS[id].url, auteur: "local", label: "Ma voix" });
  let sh = SHARED[id] || [];
  if (CLIPS[id] && typeof me !== "undefined" && me) sh = sh.filter(v => v.auteur !== me.id); // ma voix partagée ferait doublon
  const want = (S.readers || []).filter(r => READERS.includes(r));
  const kept = want.length ? sh.filter(v => want.includes(v.auteur)) : sh;
  return list.concat(kept.length || list.length ? kept : sh);
}
// Rang de la voix actuellement choisie pour cet élément (le bouton « autre voix » le fait avancer)
const voiceIndex = id => { const n = voicesFor(id).length; return n ? ((S.voiceIdx || {})[id] || 0) % n : 0; };
// Met à jour ce qu'on entend pour un élément
function refreshAudio(id) {
  const list = voicesFor(id);
  if (list.length) AUDIO[id] = list[voiceIndex(id)].url; else delete AUDIO[id];
}

function openClipDb() {
  return new Promise(res => {
    try {
      const rq = indexedDB.open("arabe-proto-audio", 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore("clips"); // clé = identifiant de l'élément
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
// Les premières versions rangeaient directement le fichier : on le lit alors comme un enregistrement non rogné
const asClip = v => (v && v.cut ? { orig: v.orig, cut: v.cut, a: v.a, b: v.b } : { orig: v, cut: v, a: 0, b: null });
function setClip(id, clip) {
  if (CLIPS[id] && CLIPS[id].url) URL.revokeObjectURL(CLIPS[id].url);
  CLIPS[id] = { ...asClip(clip) };
  CLIPS[id].url = URL.createObjectURL(CLIPS[id].cut);
  refreshAudio(id);
}
async function loadClips() {
  idb = await openClipDb();
  if (!idb) return;
  await new Promise(res => {
    try {
      const rq = idb.transaction("clips").objectStore("clips").openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { setClip(c.key, c.value); c.continue(); } else res(); };
      rq.onerror = () => res();
    } catch (e) { res(); }
  });
  audioReady();
}
function saveClip(id, clip) {
  setClip(id, clip);
  try { if (idb) idb.transaction("clips", "readwrite").objectStore("clips").put(asClip(CLIPS[id]), id); } catch (e) {}
}
function deleteClip(id) {
  if (CLIPS[id] && CLIPS[id].url) URL.revokeObjectURL(CLIPS[id].url);
  delete CLIPS[id];
  refreshAudio(id);
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
const ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
const ICON_FLAME = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 12 18a5 5 0 0 1-5-5.5c0-1.8.8-3.2 1.8-4.3.3 1.6 1 2.5 2 3C10.300 8.500 10.800 5 12 2z"/><path d="M6 20.500h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const speakBtn = (id, label) => {
  if (!canSpeak(id)) return "";
  const n = voicesFor(id).length;
  return `<span class="listen"><button class="speak" data-act="speak" data-id="${id}">${ICON_SPEAK}${label || "Écouter"}</button>` +
    (n > 1 ? `<button class="mini txt" data-act="voice-next" data-id="${id}" aria-label="Écouter une autre voix">↻ ${voiceIndex(id) + 1}/${n}</button>` : "") + `</span>`;
};
const translit = it => S.translit && it.tr ? `<span class="tr">${esc(it.tr)}</span>` : "";
// Libellé d'une leçon pour l'affichage, titre isolé du reste de la ligne (sens d'écriture)
const lessonHtml = l => esc(isAlpha(l) ? "Alphabet " + (l - 100) : "Leçon " + l) + " · <bdi>" + esc(LESSON_TITLE[l]) + "</bdi>";
const plural = (n, w) => n + " " + w + (n > 1 ? "s" : "");

function route() { return (location.hash || "#accueil").slice(1); }
let sheet = null; // panneau ouvert sur le parcours : numéro de leçon, ou "choix" pour « Réviser au choix »

const TABS = [["accueil", "Parcours"], ["mots", "Glossaire"], ["grammaire", "Grammaire"], ["voix", "Voix"], ["reglages", "Réglages"]];
function render() {
  const r = route(), inSess = sess && r === "accueil";
  if (gramRender(r)) return;   // une leçon de grammaire en cours dessine elle-même tout l'écran (js/grammaire.js)
  if (inSess) {
    $top.innerHTML = sess.over ? "" : sessHead();
    $view.innerHTML = sess.over ? viewSummary() : viewTask();
    $foot.innerHTML = sessFoot();
  } else {
    const known = ITEMS.filter(isKnown).length;
    $top.innerHTML = `<div class="top"><span class="stat flame" title="Jours de suite">${ICON_FLAME}${streak()} <small>${streak() > 1 ? "jours" : "jour"}</small></span>
      <span class="alpha">${ESSAI ? "essai · " + esc(ESSAI) : "alpha"}</span><span class="stat">${known} <small>/ ${ITEMS.length} acquis</small></span></div>`;
    const sh = document.querySelector ? document.querySelector(".sheet") : null, shTop = sh ? sh.scrollTop : 0;
    $view.innerHTML = r === "mots" ? viewWords() : r === "grammaire" ? viewGrammar() : r === "voix" ? viewVoices() : r === "reglages" ? viewSettings() : r === "partage" ? viewPartage() : r === "statistiques" ? viewStats() : r === "avance" ? viewAdvanced() : r === "enregistrer" ? viewGuide() : viewHome();
    const sh2 = document.querySelector ? document.querySelector(".sheet") : null;
    if (sh2 && shTop) sh2.scrollTop = shTop;   // même panneau ouvert : on reste là où on était
    if (r === "voix" || r === "enregistrer") pending.forEach(drawWave); // les pistes se dessinent une fois les éléments en place
    if (wantScroll && !sheet && r !== "mots" && r !== "grammaire" && r !== "voix" && r !== "reglages" && r !== "partage" && r !== "statistiques" && r !== "enregistrer" && r !== "avance") {
      wantScroll = false;
      const go = document.querySelector ? document.querySelector(".go") : null;
      if (go && go.scrollIntoView) go.scrollIntoView({ block: "center" });
    }
    $foot.innerHTML = (toastMsg ? `<div class="toast" role="status">${esc(toastMsg)}</div>` : "") + `<nav class="tabs" aria-label="Navigation">` + TABS.map(([h, label]) => `<a href="#${h}" ${h === r || (h === "voix" && (r === "partage" || r === "enregistrer")) || (h === "reglages" && (r === "statistiques" || r === "avance")) || (h === "accueil" && !TABS.some(t => t[0] === r) && r !== "partage" && r !== "statistiques" && r !== "enregistrer" && r !== "avance") ? 'aria-current="page"' : ""}>${label}${h === "voix" && aTraiter() ? `<i class="tbadge" aria-label="${aTraiter()} à traiter">${aTraiter()}</i>` : ""}</a>`).join("") + `</nav>`;
  }
}

// --- Parcours : maîtrise globale, révision du jour, puis une pastille par leçon du manuel.
// Quand les unités sont nombreuses, on ne déroule que celle où l'on en est : les autres sont pliées en une ligne.
let askKnown = null;    // unité pour laquelle on demande confirmation de « je connais déjà »
let wantScroll = true;  // au prochain affichage du parcours, amener la leçon en cours à l'écran

// Première leçon pas encore vue en entier : c'est « là où j'en suis »
function nextLesson() {
  return UNITS.flatMap(u => u.lessons.map(x => x[0])).find(l => { const s = lessonStats(l); return s.seen < s.total; });
}
// Une unité est dépliée si l'apprenant l'a demandé ; sinon, seule l'unité de la leçon en cours l'est
function isOpen(u, next) {
  if (S.fold && u.n in S.fold) return !S.fold[u.n];
  if (next === undefined) return u === UNITS[UNITS.length - 1];   // tout est vu : on montre la dernière unité
  return u.lessons.some(([l]) => l === next);
}
// Valider sans faire : les éléments jamais vus entrent directement dans le calendrier, à réviser dès aujourd'hui.
// Ils partent avec la note « facile » : une première révision réussie les fait passer en « acquis »,
// une erreur les ramène au rythme d'un mot en cours d'apprentissage.
function markKnown(items) {
  const t = today(); let n = 0;
  items.filter(it => !isSeen(it)).forEach(it => { S.cards[it.id] = { ...schedule(undefined, 4, t), due: t }; n++; });
  if (n) saveState();
  return n;
}

// Carte du parcours : les mots des leçons déjà vues que personne n'a encore enregistrés, avec un raccourci
// vers l'enregistrement guidé. Seulement si le micro est disponible et que la base est joignable.
function voixCarte() {
  const n = sb && canRecord() ? waitingVoices().length : 0;
  return n ? `<section class="card voixcarte"><span class="vstat aucun">${ICON_MIC}</span><span><b>${plural(n, "mot")}</b> ${n > 1 ? "attendent" : "attend"} une voix</span>
      <button class="btn small gold" data-act="rg-start">Enregistrer</button></section>` : "";
}
function viewHome() {
  const all = ITEMS.length, known = ITEMS.filter(isKnown).length, seen = ITEMS.filter(isSeen).length, due = ITEMS.filter(isDue).length;
  const next = nextLesson();
  const daily = due
    ? `<p><b>${plural(due, "élément")} à revoir aujourd'hui.</b></p>`
    : `<p class="muted">${seen ? "Aucune révision due aujourd'hui." : "Touchez la première leçon pour commencer."}</p>`;
  // Révision du jour et révision au choix côte à côte (la seconde seule s'il n'y a rien de dû)
  const revs = `<div class="row duo">${due ? `<button class="btn gold" data-act="daily">Révision du jour</button>` : ""}<button class="btn ghost" data-act="pick-open">${due ? "Au choix" : "Réviser au choix"}</button></div>`;
  // Leçon quittée en cours de route (la plus récente s'il y en a plusieurs) : on la reprend d'un appui, à la carte où l'on s'était arrêté
  const repr = derniereReprise();
  const reprendre = repr !== undefined ? `<button class="btn ${due ? "ghost" : ""}" data-act="resume" data-l="${repr}">Reprendre : ${lessonHtml(repr)}</button>` : "";
  // Raccourci vers la leçon en cours : pas besoin de faire défiler le parcours (remplacé par « Reprendre » si c'est la même leçon)
  const resume = reprendre + (next !== undefined && next !== repr ? `<button class="btn ${due || repr !== undefined ? "ghost" : ""}" data-act="node" data-l="${next}">${lessonStats(next).seen ? "Continuer" : "Commencer"} : ${lessonHtml(next)}</button>` : "");
  const OFF = [0, 46, 70, 46, 0, -46, -70, -46]; // décalages qui font serpenter le parcours
  const path = UNITS.map(u => {
    const its = ITEMS.filter(it => it.u === u.n), uk = its.filter(isKnown).length, us = its.filter(isSeen).length, ud = its.filter(isDue).length;
    const open = isOpen(u, next);
    const banner = `<button class="unit-banner ${us === 0 ? "todo" : ""}" data-act="fold" data-u="${u.n}" aria-expanded="${open}">
        <span class="ub-n">${unitName(u)} <i class="chev">${open ? "▾" : "▸"}</i></span><span class="ub-t"><b>${esc(u.fr)}</b>${AR(u.ar)}</span>
        <span class="ub-s">${uk} / ${its.length} acquis${ud ? " · " + ud + " à revoir" : ""}${us === its.length ? "" : " · " + (its.length - us) + " à découvrir"}${u.relu ? "" : " · contenu à relire"}</span></button>`;
    if (!open) return banner;
    let k = 0;
    const stops = u.lessons.map(([l, title]) => {
      const s = lessonStats(l), state = s.known === s.total ? "gold" : s.seen > 0 ? "on" : "off";
      return `<div class="stop" style="--x:${OFF[k++ % OFF.length]}px">
        ${l === next ? `<span class="go">${(S.reprise || {})[l] ? "Reprendre" : s.seen ? "Continuer" : "Commencer"}</span>` : ""}
        <span class="ring" style="--a:${100 * s.known / s.total};--b:${100 * s.seen / s.total}">
          <button class="node ${state}" data-act="node" data-l="${l}" aria-label="${esc(lessonLabel(l))} : ${s.known} acquis sur ${s.total}${s.due ? ", " + s.due + " à revoir" : ""}">${isAlpha(l) ? AR(itemsOf(l)[0].ar) : l}${s.due ? `<i class="badge">${s.due}</i>` : ""}</button></span>
        <div class="stop-txt"><b><bdi>${esc(title)}</bdi></b><span>${s.known} / ${s.total} acquis</span></div></div>`;
    }).join("");
    // Valider toute l'unité d'un coup, avec une confirmation pour éviter le geste involontaire
    const skip = us === its.length ? "" : askKnown === u.n
      ? `<div class="row center"><button class="btn small" data-act="known-unit-yes" data-u="${u.n}">Oui, tout passer en révision</button><button class="btn small ghost" data-act="known-no">Annuler</button></div>`
      : `<button class="linkbtn" data-act="known-unit" data-u="${u.n}">Je connais déjà ${u.n === 0 ? "l'alphabet" : "cette unité"}</button>`;
    return banner + `<div class="path">${stops}${skip}</div>`;
  }).join("");
  const anyOpen = UNITS.some(u => isOpen(u, next));
  return `<section class="card"><h3>Ce que je connais</h3>
      <div class="tri" role="img" aria-label="${known} acquis, ${seen - known} en cours, ${all - seen} à découvrir"><span class="a" style="width:${100 * known / all}%"></span><span class="b" style="width:${100 * (seen - known) / all}%"></span></div>
      <div class="legend"><span class="a"><i></i>${known} acquis</span><span class="b"><i></i>${seen - known} en cours</span><span><i></i>${all - seen} à découvrir</span></div>
      ${daily}${revs}${resume}
      ${gramDue().length ? `<a class="btn ghost" href="#grammaire">Grammaire : ${plural(gramDue().length, "carte")} à revoir</a>` : ""}</section>
    ${voixCarte()}
    <div class="row between"><h3>Parcours</h3><button class="linkbtn" data-act="${anyOpen ? "fold-all" : "unfold-all"}">${anyOpen ? "Tout replier" : "Tout déplier"}</button></div>
    ${path}${sheet === "choix" ? viewPick() : sheet ? viewSheet(sheet) : ""}`;
}

// Panneau d'une leçon : où j'en suis, et les actions possibles
function viewSheet(l) {
  const s = lessonStats(l), unseen = s.total - s.seen;
  const chunk = Math.min(unseen, s.its[0].type === "letter" ? CHUNK_LETTERS : CHUNK_WORDS);
  const r = (S.reprise || {})[l];   // séance quittée en cours de route : on propose d'abord de la reprendre
  return `<button class="scrim" data-act="sheet-close" aria-label="Fermer"></button>
    <div class="sheet" role="dialog" aria-label="${esc(lessonLabel(l))}">
      <h3>${isAlpha(l) ? "Alphabet " + (l - 100) : "Leçon " + l}</h3><h2><bdi>${esc(LESSON_TITLE[l])}</bdi></h2>
      <div class="tiles"><div><b>${s.known}</b>acquis</div><div><b>${s.seen - s.known}</b>en cours</div><div><b>${unseen}</b>à découvrir</div></div>
      ${r ? `<button class="btn" data-act="resume" data-l="${l}">Reprendre où je m'étais arrêté (${Math.min(r.i + 1, r.tasks.length)} / ${r.tasks.length})</button>` : ""}
      ${unseen ? `<button class="btn ${r ? "ghost" : ""}" data-act="learn" data-l="${l}">Apprendre ${plural(chunk, "nouveauté")}</button>` : ""}
      ${s.seen ? `<button class="btn ${unseen || r ? "ghost" : ""}" data-act="redo" data-l="${l}">Refaire la leçon${unseen ? ` (${plural(s.seen, "élément vu")})` : ""}</button>` : ""}
      ${s.seen ? `<button class="btn ghost" data-act="review" data-l="${l}">Réviser ce que j'ai vu (${s.seen})</button>` : ""}
      ${unseen ? `<button class="btn ghost" data-act="known-lesson" data-l="${l}">Je connais déjà : passer en révision</button>` : ""}
      <button class="btn ghost" data-act="cram" data-l="${l}">Tout réviser d'un coup (${s.total})</button></div>`;
}

// --- Séance : en-tête (quitter, précédent, progression)
function sessHead() {
  const ro = sess.peek !== null, canBack = ro ? sess.peek > 0 : sess.hist.length > 0;
  const pct = sess.kind === "drill" ? 100 * Object.values(sess.st).filter(x => x.need <= 0).length / sess.n : 100 * sess.i / sess.tasks.length;
  return `<div class="sess-head"><button class="icon" data-act="quit" aria-label="Quitter la séance">✕</button>
    <button class="icon" data-act="back" aria-label="Carte précédente" ${canBack ? "" : "disabled"}>‹</button>
    <button class="icon ${S.crayonVu ? "" : "pulse"}" data-act="t-open" aria-label="Ouvrir le tableau pour écrire">✎</button>
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
       <div class="formes">${Object.entries({ "Seule": "isolee", "Début": "debut", "Milieu": "milieu", "Fin": "fin" }).map(([nom, k]) => `<div>${AR(formsOf(it)[k])}<span>${nom}</span></div>`).join("")}</div>
       ${it.join ? "" : `<p class="muted">Cette lettre ne s'attache jamais à la suivante.</p>`}
       <p>Exemple : ${AR(it.ex)} <span class="muted">(${esc(it.exFr)})</span></p>`
    : `${AR(it.ar)}${translit(it)}<p class="fr">${esc(it.fr)}</p>${it.note ? `<p class="muted">${it.note.replace(/[؀-ۿ ]{2,}/g, m => AR(m.trim()) + " ")}</p>` : ""}`;
  // Quand on refait une leçon, la fiche n'annonce pas une nouveauté : c'est un rappel
  const titre = sess && sess.redo ? (it.type === "letter" ? "Rappel : la lettre" : "Rappel : le mot") : (it.type === "letter" ? "Nouvelle lettre" : "Nouveau mot");
  return `<p class="ask"><small>${lessonHtml(it.l)}</small>${titre}</p>
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
  if (ex === "f2l")    { ask = "Quelle lettre reconnaissez-vous ?"; prompt = AR(c.form, "glyph");                       optLabel = o => esc(o.ar); optCls = "ar glyph"; two = true; }
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
  return `<p class="ask"><small>${lessonHtml(it.l)}</small>${ask}</p><div class="prompt">${prompt}</div><div class="opts ${two ? "two" : ""}">${opts}</div>`;
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
  const head = sess.kind === "drill" ? "Tout est maîtrisé" : sess.kind === "learn" ? (sess.redo ? "Leçon refaite" : "Leçon avancée") : "Révision terminée";
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
let listOpen = {};   // leçons dépliées à la main dans la liste des mots : numéro -> true ou false
let wordQuery = "";  // texte cherché dans la liste des mots
// Pour chercher sans se soucier des voyelles arabes, des accents ni des majuscules
const plain = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f\u064B-\u0652\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").toLowerCase();
// Une ligne de la liste : le mot, sa traduction, son état, et le bouton de correction pour qui est connecté
function wordRow(it) {
  const [cls, label] = stateOf(it);
  const txt = it.type === "letter" ? `<b>${esc(it.name)}</b>` : `${esc(it.fr)}${S.translit ? `<br><span class="tr">${esc(it.tr)}</span>` : ""}`;
  const edit = me && it.type === "word" ? `<button class="mini txt" data-act="voc-edit" data-id="${it.id}">Modifier</button>` : "";
  return `<div class="wrow">${AR(it.ar)}<div class="txt">${txt}</div><span class="pill ${cls}">${label}</span>${edit}</div>`;
}
// La liste des mots. Avec une recherche : les résultats, toutes leçons confondues.
// Sans recherche : les unités pliables comme dans le parcours, et dans chaque unité une ligne par leçon,
// dépliée seulement pour la leçon en cours (ou celles ouvertes à la main).
function wordList() {
  const q = plain(wordQuery.trim());
  if (q) {
    const hits = ITEMS.filter(it => plain(it.ar).includes(q) || plain(it.fr).includes(q) || plain(it.tr).includes(q) || plain(it.name).includes(q));
    return `<section class="panel"><h3>${plural(hits.length, "résultat")}</h3><div>${hits.slice(0, 60).map(it => wordRow(it)).join("")}</div>
      ${hits.length > 60 ? `<p class="muted">Seuls les 60 premiers sont affichés : précisez la recherche.</p>` : ""}</section>`;
  }
  const next = nextLesson();
  return UNITS.map(u => {
    const open = isOpen(u, next), its = ITEMS.filter(it => it.u === u.n);
    const head = `<button class="unit-banner todo slim" data-act="fold" data-u="${u.n}" aria-expanded="${open}">
        <span class="ub-n">${unitName(u)} <i class="chev">${open ? "▾" : "▸"}</i></span><span class="ub-t"><b>${esc(u.fr)}</b></span>
        <span class="ub-s">${plural(its.length, "élément")} · ${its.filter(isKnown).length} acquis</span></button>`;
    if (!open) return head;
    return head + u.lessons.map(([l]) => {
      const s = lessonStats(l), lo = l in listOpen ? listOpen[l] : l === next;
      return `<section class="panel"><button class="lhead" data-act="list-toggle" data-l="${l}" aria-expanded="${lo}">
          <span>${lessonHtml(l)}</span><span class="muted">${s.known} / ${s.total} ${lo ? "▾" : "▸"}</span></button>
        ${lo ? `<div>${s.its.map(it => wordRow(it)).join("")}</div>${me && !isAlpha(l) && motsOk ? `<button class="btn small ghost" data-act="voc-add" data-l="${l}">Ajouter un mot</button>` : ""}` : ""}</section>`;
    }).join("");
  }).join("");
}
let drillOpen = {};  // unités dépliées à la main dans « Réviser au choix » : numéro d'unité -> true ou false
// Panneau « Réviser au choix », ouvert depuis le parcours : on coche des leçons, rangées par unité repliable
// (seule l'unité en cours est dépliée au départ, ainsi que celles où une leçon est cochée),
// et le bouton de départ reste collé en bas du panneau dès qu'une leçon est cochée.
function viewPick() {
  const next = nextLesson();
  const chips = UNITS.map(u => {
    const nSel = u.lessons.filter(([l]) => drillSel[l]).length;
    const ouverte = u.n in drillOpen ? drillOpen[u.n] : (isOpen(u, next) || nSel > 0);
    return `<button class="lhead ugroup" data-act="drill-unit" data-u="${u.n}" aria-expanded="${ouverte}">
        <span>${unitName(u)} · ${esc(u.fr)}</span><span class="muted">${nSel ? "✓ " + nSel + " " : ""}${ouverte ? "▾" : "▸"}</span></button>` +
      (ouverte ? `<div class="chips">` + u.lessons.map(([l, title]) => `<button class="chip" data-act="drill-toggle" data-l="${l}" aria-pressed="${Boolean(drillSel[l])}">${lessonShort(l)} · ${esc(title)}</button>`).join("") + `</div>` : "");
  }).join("");
  const n = drillItems().length, hard = hardItems().length, nL = Object.keys(drillSel).filter(l => drillSel[l]).length;
  return `<button class="scrim" data-act="sheet-close" aria-label="Fermer"></button>
    <div class="sheet tall" role="dialog" aria-label="Réviser au choix">
      <div class="row between"><h2>Réviser au choix</h2><button class="icon" data-act="sheet-close" aria-label="Fermer">✕</button></div>
      <p class="muted">Cochez des leçons : les questions s'enchaînent jusqu'à ce que chaque élément soit réussi deux fois de suite.</p>
      ${hard ? `<button class="btn ghost" data-act="drill-hard">Mes ${plural(hard, "élément")} en difficulté</button>` : ""}
      ${chips}
      <div class="row"><button class="btn small ghost" data-act="drill-all">Tout cocher</button><button class="btn small ghost" data-act="drill-none">Tout décocher</button></div>
      <div class="dock"><button class="btn" data-act="drill-start" ${n ? "" : "disabled"}>${n ? "Réviser " + plural(n, "élément") + " · " + plural(nL, "leçon") : "Choisissez une leçon"}</button></div></div>`;
}
// Onglet Glossaire : tous les mots, avec recherche, corrections et ajouts
function viewWords() {
  return viewContentRecos() +
    `<div class="row between"><h3>Tous les mots</h3><button class="linkbtn" data-act="${UNITS.some(u => isOpen(u, nextLesson())) ? "fold-all" : "unfold-all"}">${UNITS.some(u => isOpen(u, nextLesson())) ? "Tout replier" : "Tout déplier"}</button></div>
    <label class="vh" for="wq">Chercher un mot</label><input type="search" id="wq" class="field" placeholder="Chercher un mot, en arabe ou en français" value="${esc(wordQuery)}" data-wq="1">
    <div id="wlist">${wordList()}</div>` + viewEditForm();
}

// --- Voix : enregistrer soi-même les lettres et les mots, à la place de la voix de l'appareil.
// Rien n'est déposé d'office : chaque enregistrement passe d'abord par une liste d'attente,
// où on l'écoute avant de le confirmer ou de l'écarter.
let voiceLesson = 101; // leçon affichée dans l'onglet Voix (au départ : le premier groupe de l'alphabet)
let pending = [];      // enregistrements en attente de confirmation : { id, file, url }
let rec = null;        // enregistrement au micro en cours : { id, recorder }


// --- Rognage d'un enregistrement : on voit la piste, on règle le début et la fin, et seul le passage gardé est déposé.
// Les trois fonctions ci-dessous sont de simples calculs sur les échantillons ; elles sont couvertes par le test.

// Mélange les canaux en un seul (mono)
function monoData(buf) {
  const n = buf.length, out = new Float32Array(n), ch = buf.numberOfChannels;
  for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) out[i] += d[i] / ch; }
  return out;
}
// Hauteur de la piste pour chaque colonne du dessin : le plus fort échantillon de la tranche
function peaksOf(data, cols) {
  const step = Math.max(1, Math.floor(data.length / cols)), res = [];
  for (let c = 0; c < cols; c++) {
    let m = 0;
    for (let i = c * step, end = Math.min(data.length, (c + 1) * step); i < end; i++) { const v = Math.abs(data[i]); if (v > m) m = v; }
    res.push(m);
  }
  return res;
}
// Proposition de rognage : du premier au dernier son nettement audible, avec une petite marge de chaque côté
function autoTrim(data, rate) {
  let max = 0;
  for (let i = 0; i < data.length; i++) { const v = Math.abs(data[i]); if (v > max) max = v; }
  const dur = data.length / rate, thr = max * 0.08;
  if (max === 0) return [0, dur];
  let i0 = 0, i1 = data.length - 1;
  while (i0 < data.length && Math.abs(data[i0]) < thr) i0++;
  while (i1 > i0 && Math.abs(data[i1]) < thr) i1--;
  return [Math.max(0, i0 / rate - 0.06), Math.min(dur, i1 / rate + 0.08)];
}
// Fabrique un fichier WAV (mono, 16 bits) avec le passage compris entre a et b secondes
function wavBytes(data, rate, a, b) {
  const i0 = Math.max(0, Math.floor(a * rate)), i1 = Math.min(data.length, Math.ceil(b * rate)), n = Math.max(0, i1 - i0);
  const ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);   // PCM, un canal
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const x = Math.max(-1, Math.min(1, data[i0 + i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  return ab;
}

// Décode un enregistrement en attente pour pouvoir dessiner sa piste ; s'il est illisible, il sera déposé tel quel
async function decodePending(p) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const buf = await actx.decodeAudioData(await p.file.arrayBuffer());
    p.data = monoData(buf); p.rate = buf.sampleRate; p.dur = buf.duration;
    [p.a, p.b] = autoTrim(p.data, p.rate);
    if (p.preset && p.preset.b != null) { p.a = Math.min(p.preset.a, p.dur); p.b = Math.min(p.preset.b, p.dur); }
    if (route() === "voix" || route() === "enregistrer") render();   // la piste et la coupe automatique sont prêtes
  } catch (e) { p.data = null; }
}
// Piste d'un enregistrement en attente, avec ses poignées de début et de fin (onglet Voix et enregistrement guidé).
// Rien tant que l'enregistrement n'est pas analysé (la coupe automatique des silences est faite à ce moment-là).
const trimUi = p => !p.data ? "" : `<canvas class="wave" id="wv-${p.id}" width="600" height="72" role="img" aria-label="Piste de l'enregistrement"></canvas>
  <div class="trim"><label for="ta-${p.id}">Début</label><input type="range" id="ta-${p.id}" min="0" max="1000" value="${Math.round(1000 * p.a / p.dur)}" data-trim="a" data-id="${p.id}">
    <label for="tb-${p.id}">Fin</label><input type="range" id="tb-${p.id}" min="0" max="1000" value="${Math.round(1000 * p.b / p.dur)}" data-trim="b" data-id="${p.id}"></div>
  <p class="muted" id="tl-${p.id}">Gardé : ${sec(p.b - p.a)} sur ${sec(p.dur)}</p>`;
// Dessine la piste : en couleur ce qui est gardé, en gris ce qui sera coupé
function drawWave(p) {
  const cv = document.getElementById("wv-" + p.id);
  if (!cv || !cv.getContext || !p.data) return;
  const g = cv.getContext("2d"), W = cv.width, H = cv.height, css = getComputedStyle(document.documentElement);
  const peaks = p.peaks || (p.peaks = peaksOf(p.data, W / 3)), top = Math.max(...peaks, 0.001);
  g.clearRect(0, 0, W, H);
  peaks.forEach((v, i) => {
    const t = (i + 0.5) / peaks.length * p.dur, h = Math.max(2, v / top * (H - 8));
    g.fillStyle = css.getPropertyValue(t >= p.a && t <= p.b ? "--primary" : "--line-deep");
    g.fillRect(i * 3, (H - h) / 2, 2, h);
  });
  g.fillStyle = css.getPropertyValue("--gold");                 // repères du début et de la fin gardés
  g.fillRect(p.a / p.dur * W - 1, 0, 3, H); g.fillRect(p.b / p.dur * W - 2, 0, 3, H);
}
const sec = x => x.toFixed(2).replace(".", ",") + " s";
// Écoute du passage gardé seulement
let playing = null;
function playPending(p) {
  try {
    if (playing) { try { playing.stop(); } catch (e) {} }
    if (!p.data) { new Audio(p.url).play().catch(() => {}); return; }
    const buf = actx.createBuffer(1, p.data.length, p.rate); buf.getChannelData(0).set(p.data);
    playing = actx.createBufferSource(); playing.buffer = buf; playing.connect(actx.destination);
    playing.start(0, p.a, Math.max(0.05, p.b - p.a));
  } catch (e) {}
}

function addPending(id, file, preset) {
  dropPending(id);                                   // un seul enregistrement en attente par élément
  // preset = début et fin déjà choisis, quand on reprend le rognage d'un enregistrement déposé
  const p = { id, file, url: URL.createObjectURL(file), data: null, preset: preset || null };
  pending.push(p);
  if (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext) && file.arrayBuffer) decodePending(p);
}
function dropPending(id) {
  pending.filter(p => p.id === id).forEach(p => URL.revokeObjectURL(p.url));
  pending = pending.filter(p => p.id !== id);
}
function confirmPending() {                          // dépôt de tout ce qui a été écouté et gardé
  const n = pending.length;
  pending.forEach(p => {
    URL.revokeObjectURL(p.url);
    // Si la piste a été rognée, on dépose seulement le passage gardé ; sinon le fichier d'origine
    const trimmed = p.data && (p.a > 0.005 || p.b < p.dur - 0.005);
    const cut = trimmed ? new Blob([wavBytes(p.data, p.rate, p.a, p.b)], { type: "audio/wav" }) : p.file;
    // On garde aussi le fichier d'origine et les réglages, pour pouvoir reprendre le rognage plus tard
    saveClip(p.id, { orig: p.file, cut, a: p.data ? p.a : 0, b: p.data ? p.b : null });
    if (S.shared) delete S.shared[p.id];             // une nouvelle version est à renvoyer
  });
  const ids = pending.map(p => p.id);
  pending = [];
  if (n) noter("depot", null, { n });   // statistiques : nombre d'enregistrements déposés
  if (sb && me && hasConsent) shareMany(ids);        // connecté et accord signé : envoi immédiat
  return n;
}
// Le micro n'est disponible que sur le site lui-même (connexion sécurisée) et si le navigateur le permet
const canRecord = () => Boolean(typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== "undefined");
async function toggleRecord(id) {
  if (rec) { rec.recorder.stop(); return; }          // second appui : on arrête, l'enregistrement part en liste d'attente
  try {
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: S.mic ? { deviceId: { exact: S.mic } } : true }); }
    catch (e) { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }   // micro choisi débranché : on prend celui par défaut
    if (!mics.length) loadMics().then(() => { if (route() === "voix") render(); });      // les noms des micros sont maintenant connus
    const recorder = new MediaRecorder(stream), chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());     // on libère le micro
      addPending(id, new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      rec = null; uiMsg = ""; render();
    };
    rec = { id, recorder };
    recorder.start(); render();
  } catch (e) {
    rec = null; uiMsg = "Micro refusé ou indisponible : ajoutez un fichier à la place."; render();
  }
}

// --- Enregistrement guidé (#enregistrer) : un mot à la fois, en grand, sans rien à lire.
//   1. le mot arabe en grand (et sa voix actuelle, s'il en a une, pour s'en inspirer) ;
//   2. un gros bouton micro : on touche pour enregistrer, on retouche pour arrêter ;
//   3. on réécoute, puis ✓ (garder : déposé et envoyé comme d'habitude) ou ↺ (recommencer) ;
//   4. mot suivant. On commence par les mots que personne n'a encore enregistrés.
let guide = null;   // { ids: [éléments à enregistrer, dans l'ordre], i: position, faits: nombre gardés, edit: piste ouverte }
// Mots d'une leçon à proposer : d'abord ceux sans aucune voix, puis ceux qui n'ont que la voix d'autres personnes
function guideQueue(l) {
  const its = itemsOf(l).filter(it => voiceState(it.id) !== "moi");
  return its.filter(it => voiceState(it.id) === "aucun").concat(its.filter(it => voiceState(it.id) === "autre")).map(it => it.id);
}
// Mots qui attendent une voix, dans les leçons déjà vues (pour la carte du parcours)
function waitingVoices() {
  return UNITS.flatMap(u => u.lessons.map(x => x[0])).filter(l => lessonStats(l).seen > 0)
    .flatMap(l => itemsOf(l)).filter(it => voiceState(it.id) === "aucun").map(it => it.id);
}
function startGuide(ids) {
  if (!ids.length) return;
  guide = { ids, i: 0, faits: 0 };
  if (route() === "enregistrer") render(); else location.hash = "#enregistrer";
}
// Garde l'enregistrement en attente de ce mot seulement (les autres attentes de l'onglet Voix ne bougent pas)
function keepOne(id) {
  const autres = pending.filter(p => p.id !== id);
  pending = pending.filter(p => p.id === id);
  const n = confirmPending();
  pending = autres.concat(pending);
  return n;
}
function viewGuide() {
  const quitter = `<a class="icon" href="#voix" aria-label="Quitter">✕</a>`;
  if (!guide || guide.i >= guide.ids.length) {
    const n = guide ? guide.faits : 0;
    return `<section class="card guide"><div class="row between">${quitter}</div>
        <div class="gfin">${n ? "✓" : ""}</div><h2>${n ? plural(n, "mot enregistré") : "Rien à enregistrer"}</h2>
        ${n && !(sb && me && hasConsent) ? `<p class="muted">Ils restent sur cet appareil. Pour les partager, connectez-vous et signez l'accord (roue dentée de l'onglet Voix).</p>` : ""}
        <a class="btn" href="#voix">Terminer</a></section>`;
  }
  const id = guide.ids[guide.i], it = BY_ID[id], p = pending.find(x => x.id === id), on = rec && rec.id === id;
  const pct = 100 * guide.i / guide.ids.length, modele = voicesFor(id).length;
  // Le gros bouton change selon l'étape : micro (enregistrer), carré rouge (arrêter), lecture (réécouter)
  const gros = on ? `<button class="gmic rec" data-act="rec" data-id="${id}" aria-label="Arrêter l'enregistrement"><span class="carre"></span></button>`
    : p ? `<button class="gmic play" data-act="pend-play" data-id="${id}" aria-label="Réécouter">${ICON_SPEAK}</button>`
    : `<button class="gmic" data-act="rec" data-id="${id}" aria-label="Enregistrer">${ICON_MIC}</button>`;
  return `<section class="card guide">
      <div class="sess-head">${quitter}<div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div><span class="muted">${guide.i + 1}/${guide.ids.length}</span></div>
      <div class="gmot">${AR(it.ar)}<p class="muted">${esc(it.type === "letter" ? it.name : it.fr)}</p>
        ${modele && !p && !on ? `<button class="mini" data-act="speak" data-id="${id}" aria-label="Écouter la voix actuelle">${ICON_SPEAK}</button>` : ""}</div>
      ${canRecord() ? gros : `<p>Le micro n'est pas disponible sur cet appareil.</p>`}
      ${uiMsg ? `<p role="status"><b>${esc(uiMsg)}</b></p>` : ""}
      ${p && !on && p.data ? (guide.edit ? `<div class="gtrim">${trimUi(p)}</div>` : `<button class="linkbtn" data-act="rg-edit">Éditer l'audio</button>`) : ""}
      ${p && !on ? `<div class="row duo"><button class="btn ghost" data-act="rg-redo" data-id="${id}" aria-label="Recommencer">↺</button><button class="btn good" data-act="rg-keep" data-id="${id}" aria-label="Garder">✓</button></div>`
        : `<button class="linkbtn" data-act="rg-skip" ${on ? "disabled" : ""}>Passer ›</button>`}
    </section>`;
}

// Micros disponibles (leurs noms ne sont connus qu'une fois le micro autorisé)
let mics = [];
async function loadMics() {
  try { mics = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "audioinput" && d.label); } catch (e) { mics = []; }
}
// Demande l'autorisation du micro sans enregistrer, pour pouvoir afficher la liste
async function askMics() {
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); await loadMics(); uiMsg = mics.length ? "" : "Aucun micro trouvé."; }
  catch (e) { uiMsg = "Micro refusé ou indisponible."; }
  render();
}

// État de la voix d'un élément, pour le repérer d'un coup d'œil dans l'onglet Voix :
//   "moi"   : j'ai un enregistrement (sur cet appareil, ou partagé par moi) — doré, haut-parleur ;
//   "autre" : seulement la voix d'autres personnes — bleu, haut-parleur ;
//   "aucun" : personne ne l'a encore enregistré — cercle en pointillé, micro.
function voiceState(id) {
  const mineShared = typeof voixRows !== "undefined" && me && voixRows.some(v => v.element === id && v.auteur === me.id && (v.etat === "publie" || v.etat === "recommande"));
  if (CLIPS[id] || mineShared) return "moi";
  return voicesFor(id).length ? "autre" : "aucun";
}
const VOICE_BADGE = { moi: ["Mon enregistrement", ICON_SPEAK], autre: ["Voix d'une autre personne", ICON_SPEAK], aucun: ["Pas encore enregistré", ICON_MIC] };
const voiceBadge = st => `<span class="vstat ${st}" role="img" aria-label="${VOICE_BADGE[st][0]}" title="${VOICE_BADGE[st][0]}">${VOICE_BADGE[st][1]}</span>`;
// Mon enregistrement actuel d'un élément, pour le comparer à un nouveau avant de choisir lequel garder :
// celui de cet appareil, sinon celui que j'ai partagé (depuis un autre appareil). null s'il n'y en a pas.
function myCurrentVoice(id) {
  if (CLIPS[id] && CLIPS[id].url) return CLIPS[id].url;
  const v = typeof voixRows !== "undefined" && me ? voixRows.slice().reverse().find(x => x.element === id && x.auteur === me.id && (x.etat === "publie" || x.etat === "recommande")) : null;
  return v ? publicUrl(v.chemin) : null;
}
// Bouton « Remettre dans le partage » d'un élément qui n'est plus partagé par moi :
//   - j'ai encore l'enregistrement sur cet appareil : on le renvoie (comme un nouvel envoi) ;
//   - sinon, je suis contributeur et le fichier retiré est resté sur le serveur : on le republie tel quel.
// Rien si je ne suis pas connecté, si je n'ai pas signé l'accord, ou s'il n'y a rien à remettre.
function remettre(id) {
  if (!sb || !me) return "";
  const retiree = retiredVoices().find(v => v.element === id && v.auteur === me.id);
  if (CLIPS[id] && hasConsent && retiree) return `<button class="mini txt ok" data-act="share-one" data-id="${id}">Remettre dans le partage</button>`;
  if (CLIPS[id] && hasConsent && !(S.shared && S.shared[id])) return `<button class="mini txt ok" data-act="share-one" data-id="${id}">Partager</button>`;
  if (retiree && isContributor()) return `<button class="mini txt ok" data-act="voice-restore" data-vid="${retiree.id}">Remettre dans le partage</button>`;
  return "";
}
function viewVoices() {
  const its = itemsOf(voiceLesson), have = its.filter(it => AUDIO[it.id]).length;
  const total = ITEMS.filter(it => AUDIO[it.id]).length, micro = canRecord();
  const chips = UNITS.map(u => `<div class="chips">` + u.lessons.map(([l]) => {
    const n = itemsOf(l).filter(it => AUDIO[it.id]).length, t = itemsOf(l).length;
    const moi = itemsOf(l).some(it => voiceState(it.id) === "moi");
    return `<button class="chip" data-act="voice-lesson" data-l="${l}" aria-pressed="${l === voiceLesson}">${moi ? `<i class="dot-moi" aria-label="j'y ai enregistré"></i>` : ""}${lessonShort(l)} · ${n}/${t}</button>`;
  }).join("") + `</div>`).join("");
  // Choix du micro : utile sur ordinateur, où il y en a souvent plusieurs
  const micUi = !micro ? "" : mics.length
    ? `<label for="mic">Micro utilisé</label><select id="mic" class="field" data-mic="1">${mics.map(d => `<option value="${esc(d.deviceId)}" ${d.deviceId === S.mic ? "selected" : ""}>${esc(d.label)}</option>`).join("")}</select>`
    : `<button class="btn small ghost" data-act="mic-list">Choisir le micro</button>`;
  // Liste d'attente : on écoute chaque enregistrement, on écarte ceux qui ne conviennent pas, puis on dépose le reste
  const wait = pending.length ? `<section class="panel attente"><h3>À écouter avant de déposer · ${pending.length}</h3>
      <p class="muted">Écoutez chaque enregistrement. Réglez le début et la fin pour couper les bruits autour du mot : seul le passage en couleur est gardé. Écartez ceux qui ne vont pas, puis déposez les autres.</p>
      <div>${pending.map(p => {
        // Un nouvel enregistrement pour un mot que j'ai déjà enregistré : on fait écouter les deux et on laisse choisir.
        // (Pas pour une reprise du rognage, qui est le même enregistrement.)
        const ancien = p.preset ? null : myCurrentVoice(p.id);
        return `<div class="pend"><div class="vrow">${AR(BY_ID[p.id].ar)}<div class="vact">
          ${ancien ? `<button class="mini txt" data-act="reco-play" data-url="${esc(ancien)}">${ICON_SPEAK} Ancien</button>` : ""}
          <button class="mini${ancien ? " txt" : ""}" data-act="pend-play" data-id="${p.id}" aria-label="Écouter le passage gardé">${ICON_SPEAK}${ancien ? " Nouveau" : ""}</button>
          ${ancien ? "" : `<button class="mini txt" data-act="pend-drop" data-id="${p.id}">Écarter</button>`}</div></div>
        ${ancien ? `<div class="seg choix"><button data-act="pend-drop" data-id="${p.id}">Garder l'ancien</button><button aria-pressed="true" disabled>Garder le nouveau</button></div>` : ""}
        ${trimUi(p)}</div>`;
      }).join("")}</div>
      <button class="btn good" data-act="pend-ok">Déposer ${plural(pending.length, "enregistrement")}</button>
      <button class="btn ghost" data-act="pend-none">Tout écarter</button></section>` : "";
  const rows = its.map(it => {
    const waiting = pending.some(p => p.id === it.id), on = rec && rec.id === it.id, nb = voicesFor(it.id).length;
    // Ma voix partagée pour cet élément, si elle existe : je peux la retirer du partage
    const mine = typeof voixRows !== "undefined" && me ? voixRows.find(v => v.element === it.id && v.auteur === me.id && (v.etat === "publie" || v.etat === "recommande")) : null;
    const st = voiceState(it.id);
    // Quand il y a une voix, la pastille d'état est elle-même le bouton pour l'écouter
    const badge = nb && !waiting ? `<button class="vstat ${st}" data-act="speak" data-id="${it.id}" aria-label="Écouter (${VOICE_BADGE[st][0].toLowerCase()})" title="${VOICE_BADGE[st][0]}">${VOICE_BADGE[st][1]}</button>` : voiceBadge(st);
    return `<div class="vrow v-${st}">${badge}${AR(it.ar)}
      <div class="vact">
        ${waiting ? `<span class="pill learn">en attente</span>` : nb ? `${nb > 1 ? `<button class="mini txt" data-act="voice-next" data-id="${it.id}" aria-label="Écouter une autre voix">↻ ${voiceIndex(it.id) + 1}/${nb}</button>` : ""}` : ""}
        ${micro ? `<button class="mini txt ${on ? "rec" : ""}" data-act="rec" data-id="${it.id}" ${rec && !on ? "disabled" : ""}>${on ? "Arrêter" : "Enregistrer"}</button>` : ""}
        <label class="mini txt" for="f-${it.id}">Fichier</label>
        <input class="vh" type="file" accept="audio/*" id="f-${it.id}" data-clip="${it.id}">
        ${CLIPS[it.id] ? `<button class="mini txt" data-act="clip-edit" data-id="${it.id}">Rogner</button><button class="mini txt" data-act="clip-del" data-id="${it.id}">Supprimer de l'appareil</button>` : ""}
        ${mine ? `<button class="mini txt" data-act="voice-del" data-vid="${mine.id}">Retirer du partage</button>` : remettre(it.id)}
      </div></div>`;
  }).join("");
  return `<section class="panel"><div class="row between"><h3>Ma voix</h3>${gearLink()}</div>
      <p><b>${total} / ${ITEMS.length}</b> éléments ont un enregistrement. Dès qu'un élément en a un, c'est lui qu'on entend, à la place de la voix de l'appareil.</p>
      <p class="muted">${micro ? "Enregistrez directement ici, ou ajoutez un fichier." : "Enregistrez avec le dictaphone du téléphone, puis ajoutez le fichier ici."}</p>
      ${micUi}${chips}</section>
    ${wait}
    <section class="panel"><h3>${lessonHtml(voiceLesson)} · ${have} / ${its.length}</h3>
      ${micro && guideQueue(voiceLesson).length ? `<button class="btn gold" data-act="rg-start" data-l="${voiceLesson}">${ICON_MIC} Enregistrer · ${guideQueue(voiceLesson).length}</button>` : ""}
      <p class="muted">Pour aller vite : lisez toute la leçon d'une traite, dans l'ordre ci-dessous, découpez l'enregistrement avec le script, puis ajoutez tous les fichiers d'un coup. Vous les écouterez avant de les déposer.</p>
      <label class="btn ghost" for="f-bulk">Ajouter les ${its.length} fichiers de la leçon, dans l'ordre</label>
      <input class="vh" type="file" accept="audio/*" multiple id="f-bulk" data-bulk="${voiceLesson}">
      ${uiMsg ? `<p role="status"><b>${esc(uiMsg)}</b></p>` : ""}${sbMsg ? `<p role="status"><b>${esc(sbMsg)}</b></p>` : ""}
      <div class="vlegend">${["moi", "autre", "aucun"].map(st => `<span>${voiceBadge(st)}${st === "moi" ? "moi" : st === "autre" ? "autre voix" : "à enregistrer"}</span>`).join("")}</div>
      <div>${rows}</div></section>
`;
}

// --- Réglages : objectif, translittération, sauvegarde, outils de test
let uiMsg = "", askReset = false;
function viewSettings() {
  const seg = [5, 10, 15].map(g => `<button data-act="goal" data-g="${g}" aria-pressed="${S.goal === g}">${g} min</button>`).join("");
  return `
    ${viewAccount()}
    ${viewReaders()}
    <section class="panel"><h3>Objectif quotidien</h3><div class="seg">${seg}</div>
      <p class="muted">Fixe le nombre maximal d'éléments dans la révision du jour (${GOALS[S.goal]}).</p></section>
    <section class="panel"><h3>Affichage</h3>
      <div class="seg"><button data-act="translit" data-on="1" aria-pressed="${S.translit}">Avec translittération</button><button data-act="translit" data-on="0" aria-pressed="${!S.translit}">Arabe seul</button></div></section>
    <section class="panel"><h3>Bruitages</h3>
      <div class="seg"><button data-act="sfx" data-on="1" aria-pressed="${S.sfx !== false}">Activés</button><button data-act="sfx" data-on="0" aria-pressed="${S.sfx === false}">Coupés</button></div></section>
    <section class="panel"><h3>Sauvegarde</h3>
      ${sb && me ? `<p class="muted">Votre progression peut être gardée dans votre compte. Synchronisez sur chaque appareil : les réponses de tous vos appareils sont réunies, même celles faites hors ligne, sans rien effacer.</p>
        <button class="btn" data-act="sync">Synchroniser avec mon compte</button>${syncMsg ? `<p role="status"><b>${esc(syncMsg)}</b></p>` : ""}`
        : sb ? `<p class="muted">Connectez-vous (plus haut) pour garder une copie de votre progression dans votre compte.</p>` : ""}
      <p class="muted">Sans compte, la progression est gardée dans ce navigateur seulement. Pour la transférer, copiez ce texte et collez-le sur l'autre appareil.</p>
      <label for="io" class="muted">Données de progression</label>
      <textarea id="io" spellcheck="false">${esc(JSON.stringify({ v: S.v, goal: S.goal, unit: S.unit, translit: S.translit, cards: S.cards, log: S.log, days: S.days }))}</textarea>
      <div class="row"><button class="btn small ghost" data-act="copy">Copier</button><button class="btn small ghost" data-act="import">Remplacer par le texte collé</button></div>
      ${uiMsg ? `<p role="status"><b>${esc(uiMsg)}</b></p>` : ""}</section>
    <section class="panel"><h3>Version alpha</h3>
      <p class="muted">Cette version est en cours de test. Le contenu n'est pas encore entièrement relu et la progression peut être remise à zéro d'une version à l'autre.</p>
      <a class="btn ghost" href="https://github.com/Ealemun/mufrad/issues">Signaler un problème</a>
      <a class="linkbtn" href="confidentialite.html">Conditions d'utilisation et confidentialité</a></section>
    <section class="panel"><h3>Outils de test</h3>
      <p class="muted">Avancer la date permet de vérifier qu'un mot raté revient plus tôt qu'un mot réussi. Décalage actuel : ${S.offset} jour${S.offset > 1 ? "s" : ""}.</p>
      <div class="row"><button class="btn small ghost" data-act="skip">Avancer d'un jour</button>
      ${askReset ? `<button class="btn small" data-act="reset-yes">Confirmer : tout effacer</button><button class="btn small ghost" data-act="reset-no">Annuler</button>`
                 : `<button class="btn small ghost" data-act="reset">Effacer la progression</button>`}</div></section>
    <a class="discret" href="#avance">Paramètres avancés</a>`;
}

// --- Paramètres avancés (#avance), ouverts par le lien discret en bas des réglages :
// les choix qu'on règle rarement (statistiques anonymes, tableau d'écriture… d'autres viendront)
function viewAdvanced() {
  return `<div class="row between"><h2>Paramètres avancés</h2><a class="btn small ghost" href="#reglages">‹ Réglages</a></div>
    <section class="panel"><h3>Statistiques anonymes</h3>
      <p class="muted">Mufrad compte ses visiteurs, les leçons faites, les réponses et les boutons touchés, sans savoir qui vous êtes, pour améliorer ses leçons. Votre appareil change d'identifiant chaque jour. <a href="confidentialite.html">En savoir plus</a></p>
      <div class="seg"><button data-act="mesure" data-on="1" aria-pressed="${S.mesure !== false}">Je participe</button><button data-act="mesure" data-on="0" aria-pressed="${S.mesure === false}">Ne pas me compter</button></div></section>
    <section class="panel"><h3>Tableau d'écriture</h3>
      <p class="muted">Ce que vous écrivez sur le tableau est gardé, sans votre nom ni votre compte, pour entraîner la future reconnaissance d'écriture de Mufrad. Arrêter ne supprime pas ce qui a déjà été envoyé. <a href="confidentialite.html">En savoir plus</a></p>
      <div class="seg"><button data-act="traces" data-on="1" aria-pressed="${S.traces !== false}">Garder mes tracés</button><button data-act="traces" data-on="0" aria-pressed="${S.traces === false}">Ne pas les garder</button></div></section>`;
}

/* ---------- 9. COMPTE ET PARTAGE ---------- */

// Base de données du projet. La clé ci-dessous est la clé publique : elle est faite pour figurer dans le code du site.
// Ce qu'elle permet est limité par les règles d'accès de la base (voir le dossier supabase/).
const SB_URL = "https://zhbomrkicxhifbnimvat.supabase.co";
const SB_KEY = "sb_publishable_9_sMwX5_kGMS0OuyRbK7HQ_SVGUWisj";
const ACCORD_VERSION = "alpha-1";

let sb = null;                 // client de la base ; reste null si la bibliothèque n'a pas pu se charger (hors ligne)
let me = null;                 // personne connectée, ou null
let myLevel = "utilisateur";   // utilisateur, contributeur ou administrateur
let hasConsent = false;        // accord de partage de la voix signé et non retiré
let voixRows = [];             // toutes les voix que j'ai le droit de voir (publiées ; les miennes ; toutes pour un contributeur)
let recos = [];                // recommandations en attente, visibles des contributeurs
const LEVELS = {};             // identifiant -> niveau, connu des contributeurs seulement
let sbMsg = "";                // dernier message de cette partie (envoi, erreur)
const isContributor = () => myLevel === "contributeur" || myLevel === "administrateur";
const publicUrl = chemin => SB_URL + "/storage/v1/object/public/voix/" + chemin;
const refresh = () => { if ((!sess || sess.over) && !(typeof editForm !== "undefined" && editForm)) render(); };

// Version d'essai (…/essai/<branche>/) : elle utilise la vraie base, donc tout ce qu'on y essaie ne doit rien changer
// à l'application principale. On enveloppe le client de la base : les lectures et la connexion passent normalement,
// mais chaque écriture (ajout, modification, suppression de ligne ou de fichier, fonction qui écrit) est refusée
// avec un message, sans jamais atteindre le serveur.
const ESSAI_REFUS = "version d'essai : rien n'est enregistré ni supprimé dans la vraie base";
const RPC_LECTURE = ["lecteurs"];   // fonctions de la base qui ne font que lire : autorisées en essai
// Seule écriture permise en essai : les statistiques, marquées du nom de la branche et écartées des chiffres
const RPC_ESSAI = [...RPC_LECTURE, "noter_evenements_v2"];
function lectureSeule(client) {
  const refus = () => Promise.resolve({ data: null, error: { message: ESSAI_REFUS } });
  // Chaîne factice : accepte tous les appels qui suivent (.eq, .select, .single…) et se termine par le refus
  const chaine = () => new Proxy(function () {}, { get: (t, p) => (p === "then" ? (ok, ko) => refus().then(ok, ko) : chaine()), apply: () => chaine() });
  // Passe tout le reste à l'objet d'origine, sauf les méthodes interdites
  const filtre = (obj, interdit) => new Proxy(obj, { get: (o, m) => (interdit.includes(m) ? () => chaine() : typeof o[m] === "function" ? o[m].bind(o) : o[m]) });
  return new Proxy(client, { get(c, p) {
    if (p === "from") return table => filtre(c.from(table), ["insert", "update", "upsert", "delete"]);
    if (p === "storage") return { from: seau => filtre(c.storage.from(seau), ["upload", "update", "remove", "move", "copy"]) };
    if (p === "rpc") return (nom, args) => (RPC_ESSAI.includes(nom) ? c.rpc(nom, args) : chaine());
    return typeof c[p] === "function" ? c[p].bind(c) : c[p];
  } });
}

function initCloud() {
  try {
    if (typeof supabase === "undefined" || !supabase.createClient) return;
    sb = supabase.createClient(SB_URL, SB_KEY);
    if (ESSAI) sb = lectureSeule(sb);   // version d'essai : la vraie base est lue, jamais modifiée
    noterOuverture();   // statistiques d'usage (section 11)
    // À chaque connexion ou déconnexion ; le délai évite d'appeler la base depuis l'intérieur de son propre signal
    sb.auth.onAuthStateChange((evt, session) => { setTimeout(() => onSession(session), 0); });
    loadVoices();
    loadContent();
  } catch (e) { sb = null; }
}

// Met à jour ce qu'on sait de la personne connectée : niveau, accord, puis les voix qu'elle a le droit de voir
async function onSession(session) {
  me = session ? session.user : null; myLevel = "utilisateur"; hasConsent = false;
  if (me) {
    try {
      const p = await sb.from("profils").select("niveau").eq("id", me.id).maybeSingle();
      if (p.data) myLevel = p.data.niveau;
      const a = await sb.from("accords").select("id").eq("utilisateur", me.id).is("retire_le", null).limit(1);
      hasConsent = Boolean(a.data && a.data.length);
    } catch (e) {}
  }
  await loadVoices();
  await loadContent();
  refresh();
}

// Lit les voix et prépare, pour chaque élément, la liste des lecteurs qui l'ont enregistré
async function loadVoices() {
  if (!sb) return;
  try {
    const q = await sb.from("voix").select("id,element,auteur,chemin,etat,cree_le").order("cree_le", { ascending: true });
    if (q.error) return;
    voixRows = q.data.filter(v => BY_ID[v.element]);
    const pub = voixRows.filter(v => v.etat === "publie");
    READERS.length = 0;
    pub.forEach(v => { if (!READERS.includes(v.auteur)) READERS.push(v.auteur); });
    Object.keys(SHARED).forEach(k => { delete SHARED[k]; });
    // Une voix par lecteur et par élément : son envoi le plus récent remplace les précédents
    pub.forEach(v => {
      const list = SHARED[v.element] || (SHARED[v.element] = []), i = list.findIndex(x => x.auteur === v.auteur);
      const e = { vid: v.id, url: publicUrl(v.chemin), auteur: v.auteur, chemin: v.chemin };
      if (i >= 0) list[i] = e; else list.push(e);
    });
    Object.values(SHARED).forEach(l => l.sort((a, b) => READERS.indexOf(a.auteur) - READERS.indexOf(b.auteur)));
    recos = isContributor() ? voixRows.filter(v => v.etat === "recommande") : [];
    await loadNames();
    ITEMS.forEach(it => refreshAudio(it.id));
    refresh();
  } catch (e) {}
}
// Noms des lecteurs (demande supabase/0002_noms_lecteurs.sql ; sans lui, les lecteurs s'appellent « Voix 1 », « Voix 2 »…)
async function loadNames() {
  try {
    const r = await sb.rpc("lecteurs");
    if (!r.error && r.data) r.data.forEach(p => { if (p.nom) READER_NAME[p.id] = p.nom; });
    if (isContributor()) {
      const p = await sb.from("profils").select("id,nom,niveau");
      if (!p.error && p.data) p.data.forEach(x => { LEVELS[x.id] = x.niveau; if (x.nom) READER_NAME[x.id] = x.nom; });
    }
  } catch (e) {}
}
async function setName(nom) {
  if (!sb || !me) return;
  const r = await sb.rpc("definir_nom", { nouveau: nom });
  sbMsg = r.error ? "Nom non enregistré : la base n'a pas encore reçu le fichier supabase/0002_noms_lecteurs.sql." : "Nom de lecteur enregistré.";
  if (!r.error) READER_NAME[me.id] = nom;
  refresh();
}

// Copie de la progression dans le compte (demande supabase/0004_sauvegarde.sql).
// On ne remplace jamais à l'aveugle : on lit la copie du compte, on la fusionne avec celle de l'appareil
// (voir mergeProgress), puis on renvoie le résultat et on le garde aussi sur l'appareil.
// Si un autre appareil a écrit entre notre lecture et notre écriture, la version ne correspond plus :
// l'écriture est refusée, et on recommence avec la copie à jour.
let syncMsg = "";
async function syncAccount() {
  if (ESSAI) return;   // une version d'essai n'écrit jamais dans la sauvegarde du compte
  if (!sb || !me) return;
  syncMsg = "Synchronisation en cours…"; refresh();
  try {
    for (let essai = 0; essai < 3; essai++) {
      const lu = await sb.from("sauvegardes").select("donnees,version").eq("utilisateur", me.id).maybeSingle();
      if (lu.error) { syncMsg = "Synchronisation indisponible : la base n'a pas encore reçu le fichier supabase/0004_sauvegarde.sql."; break; }
      const compte = lu.data ? lu.data.donnees : {}, avant = S.log.length, avantCompte = (compte.log || []).length;
      const m = mergeProgress(S, compte), donnees = { cards: m.cards, log: m.log, days: m.days };
      const w = lu.data
        ? await sb.from("sauvegardes").update({ donnees, version: lu.data.version + 1, maj_le: new Date().toISOString() }).eq("utilisateur", me.id).eq("version", lu.data.version).select("version")
        : await sb.from("sauvegardes").insert({ donnees }).select("version");
      // Seul « copie déjà créée par un autre appareil » (code 23505) mérite de relire ; toute autre erreur est un vrai échec
      if (w.error && (lu.data || w.error.code !== "23505")) throw new Error(w.error.message);
      if (w.error || !w.data || !w.data.length) continue;   // un autre appareil vient d'écrire : on relit et on refusionne
      // Des réponses ont pu être données pendant l'attente : on refusionne avec l'état actuel plutôt que de l'écraser
      Object.assign(S, mergeProgress(S, m)); saveState();
      const recus = S.log.length - avant, envoyes = m.log.length - avantCompte;
      syncMsg = "Synchronisé." + (recus ? " " + plural(recus, "réponse") + " d'un autre appareil récupérée" + (recus > 1 ? "s." : ".") : "")
        + (envoyes ? " " + plural(envoyes, "réponse") + " de cet appareil envoyée" + (envoyes > 1 ? "s." : ".") : "")
        + (recus || envoyes ? "" : " Rien de nouveau.");
      refresh(); return;
    }
    if (syncMsg === "Synchronisation en cours…") syncMsg = "Un autre appareil synchronise en même temps : réessayez dans un instant.";
  } catch (e) { syncMsg = "Synchronisation impossible : vérifiez le réseau, puis réessayez. Rien n'a été perdu."; }
  refresh();
}

// Connexion par lien reçu par courriel : pas de mot de passe
async function signIn(email) {
  if (!sb || !email) return;
  const r = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  sbMsg = r.error ? "Envoi impossible : " + r.error.message : "Lien envoyé. Ouvrez le courriel sur cet appareil et touchez le lien pour vous connecter.";
  refresh();
}
async function signOut() { if (sb) { await sb.auth.signOut(); sbMsg = ""; } }

// Accord électronique : rattaché au compte, daté, retirable à tout moment
async function signConsent(training) {
  const r = await sb.from("accords").insert({ version: ACCORD_VERSION, voix_dans_appli: true, voix_pour_entrainement: training, nom_affiche: false });
  if (r.error) sbMsg = "Accord non enregistré : " + r.error.message; else { hasConsent = true; sbMsg = "Accord enregistré."; }
  refresh();
}
// Retrait : l'accord est daté comme retiré, les envois passent à « retiré » et les fichiers sont supprimés du serveur
async function withdrawConsent() {
  try {
    await sb.from("accords").update({ retire_le: new Date().toISOString() }).eq("utilisateur", me.id).is("retire_le", null);
    await sb.from("voix").update({ etat: "retire" }).eq("auteur", me.id);
    const l = await sb.storage.from("voix").list(me.id, { limit: 1000 });
    if (l.data && l.data.length) await sb.storage.from("voix").remove(l.data.map(f => me.id + "/" + f.name));
    hasConsent = false; S.shared = {}; saveState();
    sbMsg = "Accord retiré : vos enregistrements ne sont plus partagés. Ils restent sur cet appareil.";
    await loadVoices();
  } catch (e) { sbMsg = "Retrait incomplet : réessayez avec du réseau."; }
  refresh();
}

// Envoie l'enregistrement d'un élément : le fichier, puis sa ligne dans la base.
// Le serveur décide de l'état : publié pour un contributeur, recommandé pour les autres.
const EXT = { "audio/wav": "wav", "audio/x-wav": "wav", "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac" };
async function shareClip(id) {
  const clip = CLIPS[id];
  if (!sb || !me || !hasConsent || !clip) return null;
  const type = (clip.cut.type || "audio/wav").split(";")[0];
  const chemin = me.id + "/" + id + "-" + Date.now() + "." + (EXT[type] || "wav");
  // Mes envois précédents pour cet élément sont retirés : une seule voix par lecteur et par élément
  const old = voixRows.filter(v => v.element === id && v.auteur === me.id && (v.etat === "publie" || v.etat === "recommande"));
  const up = await sb.storage.from("voix").upload(chemin, clip.cut, { contentType: type });
  if (up.error) throw new Error(up.error.message);
  const row = await sb.from("voix").insert({ element: id, chemin }).select("etat").single();
  if (row.error) throw new Error(row.error.message);
  for (const v of old) { await sb.from("voix").update({ etat: "retire" }).eq("id", v.id); await sb.storage.from("voix").remove([v.chemin]); }
  S.shared = S.shared || {}; S.shared[id] = chemin; saveState();
  return row.data.etat;
}
// Ce qui est déposé ici mais pas encore envoyé
const unsharedIds = () => Object.keys(CLIPS).filter(id => BY_ID[id] && !(S.shared && S.shared[id]));
async function shareMany(ids) {
  if (!ids.length) return;
  let ok = 0, etat = null, err = "";
  sbMsg = "Envoi en cours…"; refresh();
  for (const id of ids) { try { etat = await shareClip(id); ok++; } catch (e) { err = e.message; } }
  sbMsg = ok ? plural(ok, "enregistrement") + (etat === "publie" ? " : disponible pour tous les utilisateurs." : " : envoyé en recommandation, en attente d'un contributeur.") : "";
  if (err) sbMsg += " Échec pour " + (ids.length - ok) + " : " + err;
  toast(sbMsg); await loadVoices();
}
// Traitement d'une recommandation par un contributeur
async function decide(recoId, accept) {
  const r = await sb.from("voix").update({ etat: accept ? "publie" : "refuse", traite_par: me.id, traite_le: new Date().toISOString() }).eq("id", recoId);
  sbMsg = r.error ? "Action refusée : " + r.error.message : (accept ? "Recommandation acceptée." : "Recommandation refusée.");
  toast(sbMsg); await loadVoices();
}
// Retire une voix du partage : la sienne pour chacun, n'importe laquelle pour un contributeur.
// Retirée par un contributeur, la voix garde son fichier : on pourra la remettre dans le partage (restoreVoice).
// Retirée par son auteur sans être contributeur, son fichier est supprimé : personne ne pourra la remettre contre son gré.
async function removeVoice(vid) {
  const v = voixRows.find(x => x.id === vid);
  if (!sb || !me || !v) return;
  const r = await sb.from("voix").update({ etat: "retire" }).eq("id", vid);
  if (r.error) { sbMsg = "Suppression refusée : " + r.error.message; toast(sbMsg); refresh(); return; }
  if (!isContributor()) await sb.storage.from("voix").remove([v.chemin]);
  if (v.auteur === me.id && S.shared) { delete S.shared[v.element]; saveState(); }
  sbMsg = "Voix retirée du partage.";
  toast(sbMsg); await loadVoices();
}

// Remet dans le partage une voix retirée (contributeurs). On vérifie d'abord que son fichier existe encore :
// les voix retirées avant ce changement, ou retirées par leur auteur, n'ont plus de fichier.
async function restoreVoice(vid) {
  const v = voixRows.find(x => x.id === vid);
  if (!sb || !me || !v || !isContributor()) return;
  let existe = false;
  try { existe = (await fetch(publicUrl(v.chemin), { method: "HEAD", cache: "no-store" })).ok; } catch (e) {}
  if (!existe) { sbMsg = "Le fichier de cette voix a été supprimé : elle ne peut pas être remise."; toast(sbMsg); refresh(); return; }
  // .select() rend les lignes modifiées : aucune ligne veut dire que la base a refusé sans le dire (droits insuffisants)
  const r = await sb.from("voix").update({ etat: "publie", traite_par: me.id, traite_le: new Date().toISOString() }).eq("id", vid).select("id");
  sbMsg = r.error ? "Action refusée : " + r.error.message : !r.data || !r.data.length ? "Action refusée : il faut être contributeur." : "Voix remise dans le partage.";
  toast(sbMsg); await loadVoices();
}
// Voix retirées qu'on peut remettre : pas celles qu'un envoi plus récent du même lecteur a remplacées
function retiredVoices() {
  return voixRows.filter(v => v.etat === "retire" && !voixRows.some(w => w.element === v.element && w.auteur === v.auteur && w.cree_le > v.cree_le && w.etat !== "refuse"));
}

// Message bref en bas de l'écran, juste au-dessus des onglets, après une action sur les voix (envoi, retrait, remise…) :
// on le voit où qu'on soit dans la page, et il s'efface seul après quelques secondes.
let toastMsg = "", toastTimer = null;
function toast(msg) {
  if (!msg) return;
  toastMsg = msg;
  if (toastTimer) clearTimeout(toastTimer);
  if (typeof setTimeout !== "undefined") toastTimer = setTimeout(() => { toastMsg = ""; refresh(); }, 5000);
}

// Encadré de l'onglet Voix : où en est le partage
function viewShare() {
  if (!sb) return `<section class="panel"><h3>Partage</h3><p class="muted">Partage indisponible pour l'instant (pas de réseau). Les enregistrements restent sur cet appareil.</p></section>`;
  const msg = sbMsg ? `<p role="status"><b>${esc(sbMsg)}</b></p>` : "";
  if (!me) return `<section class="panel"><h3>Partage</h3><p>Pour que vos enregistrements soient entendus par tous les utilisateurs, connectez-vous.</p><a class="btn ghost" href="#reglages">Se connecter</a>${msg}</section>`;
  if (!hasConsent) return `<section class="panel"><h3>Accord de partage de ma voix</h3>
      <p>J'accepte que les enregistrements que j'envoie soient entendus par les utilisateurs de Mufrad. Je peux retirer cet accord quand je veux : mes enregistrements sont alors supprimés du serveur.</p>
      <label class="check" for="c-train"><input type="checkbox" id="c-train"> J'accepte aussi qu'ils servent à entraîner les modèles de prononciation de Mufrad (facultatif).</label>
      <p class="muted"><a href="confidentialite.html">Ce que deviennent vos enregistrements</a></p>
      <button class="btn" data-act="consent">Je signe l'accord</button>${msg}</section>`;
  const n = unsharedIds().length;
  return `<section class="panel"><h3>Partage</h3>
      <p>${isContributor() ? "Niveau " + esc(myLevel) + " : vos enregistrements sont disponibles pour tous dès leur dépôt." : "Vos enregistrements sont envoyés en recommandation ; un contributeur les écoute avant de les rendre disponibles pour tous."}</p>
      ${n ? `<button class="btn" data-act="share-all">Partager ${plural(n, "enregistrement")} de cet appareil</button>` : `<p class="muted">Tout ce qui est déposé sur cet appareil a été envoyé.</p>`}
      ${msg}<button class="btn small ghost" data-act="consent-off">Retirer mon accord de partage</button></section>`;
}

// --- Page « Partage des voix » (#partage), ouverte par la roue dentée de l'onglet Voix.
// Pour chacun : l'accord de partage et « Mes envois » (ce que j'ai proposé : publié, en attente ou refusé).
// En plus, pour les contributeurs et les administrateurs, trois vues de gestion :
//   « À traiter » : les recommandations à écouter, accepter ou refuser ;
//   « Voix »      : élément par élément, qui l'a enregistré, avec des filtres (leçon, état, lecteur) ;
//   « Lecteurs »  : une ligne par lecteur ; en toucher un montre ses voix.
let adminTab = null;       // envois, attente, voix, lecteurs ; null : choisi à l'ouverture (« À traiter » s'il y a du travail)
let adminState = "all";    // all, none (sans voix), some (avec voix), multi (plusieurs voix)
let adminReader = null;    // ne montrer que les voix de ce lecteur
let adminLesson = "all";   // numéro de leçon, ou "all" pour tout le contenu
const jour = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);
// Nombre de recommandations qui attendent un contributeur : pastille rouge sur la roue dentée et sur l'onglet Voix
const aTraiter = () => (sb && me && isContributor() ? recos.length : 0);
const ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
// Roue dentée en haut de l'onglet Voix, avec sa pastille
const gearLink = () => `<a class="gear" href="#partage" aria-label="Partage des voix${aTraiter() ? ", " + aTraiter() + " à traiter" : ""}">${ICON_GEAR}${aTraiter() ? `<i class="tbadge">${aTraiter()}</i>` : ""}</a>`;
// Ce que j'ai proposé, avec son état : publié, en attente d'un contributeur, ou refusé (les versions remplacées ne sont pas montrées)
const ETAT_ENVOI = { publie: ["publié", "known"], recommande: ["en attente", "learn"], refuse: ["refusé", "due"] };
function viewEnvois() {
  if (!sb || !me) return "";
  const mine = voixRows.filter(v => v.auteur === me.id && ETAT_ENVOI[v.etat]).slice().reverse();   // les plus récents d'abord
  const n = k => mine.filter(v => v.etat === k).length;
  return `<section class="panel"><h3>Mes envois</h3>
      ${mine.length ? `<p>${["publie", "recommande", "refuse"].filter(n).map(k => `<span class="pill ${ETAT_ENVOI[k][1]}">${n(k)} ${ETAT_ENVOI[k][0]}</span>`).join(" ")}</p>
      <div>${mine.map(v => `<div class="avoice">${AR(BY_ID[v.element].ar)}<span class="muted">${lessonShort(BY_ID[v.element].l)} · ${jour(v.cree_le)}</span>
          <span class="pill ${ETAT_ENVOI[v.etat][1]}">${ETAT_ENVOI[v.etat][0]}</span>
          <button class="mini" data-act="reco-play" data-url="${esc(publicUrl(v.chemin))}" aria-label="Écouter">${ICON_SPEAK}</button></div>`).join("")}</div>`
      : `<p class="muted">Vous n'avez encore rien envoyé.</p>`}</section>`;
}
function viewPartage() {
  const titre = `<div class="row between"><h2>Partage des voix</h2><a class="btn small ghost" href="#voix">‹ Voix</a></div>`;
  if (!sb || !me || !isContributor()) return titre + viewShare() + viewEnvois();
  if (!adminTab) adminTab = recos.length ? "attente" : "envois";
  const pub = voixRows.filter(v => v.etat === "publie");
  const couverts = ITEMS.filter(it => (SHARED[it.id] || []).length).length;
  const auteurs = [...new Set(voixRows.filter(v => v.etat === "publie" || v.etat === "recommande").map(v => v.auteur))];
  const msg = sbMsg ? `<p role="status"><b>${esc(sbMsg)}</b></p>` : "";
  const tabs = [["envois", "Mes envois"], ["attente", "À traiter" + (recos.length ? " · " + recos.length : "")], ["voix", "Voix"], ["lecteurs", "Lecteurs · " + auteurs.length]]
    .map(([k, t]) => `<button data-act="admin-tab" data-k="${k}" aria-pressed="${adminTab === k}">${t}</button>`).join("");
  let body = "";
  if (adminTab === "envois") body = null;   // vue de chacun : accord et envois, sans encadré autour
  else if (adminTab === "attente") {
    // Recommandations : on écoute, puis on accepte (la voix devient disponible pour tous) ou on refuse
    body = recos.length ? `<div>${recos.map(v => `<div class="arow"><div class="ahead">${AR(BY_ID[v.element].ar)}<span class="pill">${lessonShort(BY_ID[v.element].l)}</span></div>
        <div class="avoice"><span>${esc(readerLabel(v.auteur))} · ${jour(v.cree_le)}</span>
          <button class="mini" data-act="reco-play" data-url="${esc(publicUrl(v.chemin))}" aria-label="Écouter la recommandation">${ICON_SPEAK}</button>
          <button class="mini txt ok" data-act="reco-ok" data-id="${v.id}">Accepter</button><button class="mini txt" data-act="reco-no" data-id="${v.id}">Refuser</button></div></div>`).join("")}</div>`
      : `<p class="muted">Rien à traiter pour l'instant.</p>`;
  } else if (adminTab === "lecteurs") {
    // Un lecteur par ligne : ce qu'il a publié, ce qui attend, sa dernière contribution
    body = auteurs.length ? `<div>${auteurs.map(a => {
      const rows = voixRows.filter(v => v.auteur === a);
      const p = new Set(rows.filter(v => v.etat === "publie").map(v => v.element)).size, r = rows.filter(v => v.etat === "recommande").length;
      return `<button class="lhead lrow" data-act="admin-reader" data-a="${a}"><span><b>${esc(readerLabel(a))}</b>${LEVELS[a] && LEVELS[a] !== "utilisateur" ? ` <span class="muted">· ${esc(LEVELS[a])}</span>` : ""}<br>
        <span class="muted">${p} publiés${r ? " · " + r + " en attente" : ""} · dernier le ${jour(rows[rows.length - 1].cree_le)}</span></span><span class="muted">›</span></button>`;
    }).join("")}</div>` : `<p class="muted">Aucun lecteur pour l'instant.</p>`;
  } else {
    // Filtres en listes déroulantes : ils tiennent sur deux lignes, quel que soit le nombre de leçons et de lecteurs
    const count = it => (SHARED[it.id] || []).filter(v => !adminReader || v.auteur === adminReader).length;
    const keep = { all: () => true, none: n => n === 0, some: n => n > 0, multi: n => n > 1, retire: () => true }[adminState];
    const scope = (adminLesson === "all" ? ITEMS : itemsOf(Number(adminLesson))).filter(it => keep(count(it)));
    const opt = (v, t, cur) => `<option value="${v}" ${String(cur) === String(v) ? "selected" : ""}>${esc(t)}</option>`;
    const lecons = opt("all", "Toutes les leçons", adminLesson) + UNITS.flatMap(u => u.lessons.map(([l, title]) => opt(l, lessonShort(l) + " · " + title, adminLesson))).join("");
    const etats = [["all", "Avec ou sans voix"], ["none", "Sans voix"], ["some", "Avec voix"], ["multi", "Plusieurs voix"], ["retire", "Voix retirées"]].map(([k, t]) => opt(k, t, adminState)).join("");
    const lects = opt("", "Tous lecteurs", adminReader || "") + READERS.map(a => opt(a, readerLabel(a), adminReader || "")).join("");
    body = `<div class="filters">
        <label class="vh" for="adm-l">Leçon</label><select id="adm-l" class="field" data-adm="lesson">${lecons}</select>
        <label class="vh" for="adm-e">État</label><select id="adm-e" class="field" data-adm="state">${etats}</select>
        <label class="vh" for="adm-r">Lecteur</label><select id="adm-r" class="field" data-adm="reader">${lects}</select></div>
      ${adminState === "retire" ? viewRetired() : `<p class="muted">${plural(scope.length, "élément")} affiché${scope.length > 1 ? "s" : ""}</p>
      <div>${scope.map(it => {
        const vs = (SHARED[it.id] || []).filter(v => !adminReader || v.auteur === adminReader);
        return `<div class="arow"><div class="ahead">${AR(it.ar)}<span class="pill">${lessonShort(it.l)}</span></div>
          ${vs.length ? vs.map(v => `<div class="avoice"><span>${esc(readerLabel(v.auteur))}</span>
              <button class="mini" data-act="reco-play" data-url="${esc(v.url)}" aria-label="Écouter cette voix">${ICON_SPEAK}</button>
              <button class="mini txt" data-act="voice-del" data-vid="${v.vid}">Supprimer</button></div>`).join("") : `<span class="pill">sans voix</span>`}</div>`;
      }).join("")}</div>`}`;
  }
  return titre + `<section class="panel"><p><b>${couverts} / ${ITEMS.length}</b> éléments ont au moins une voix · ${plural(pub.length, "enregistrement")} publié${pub.length > 1 ? "s" : ""}</p>
      <div class="tri"><span class="a" style="width:${100 * couverts / ITEMS.length}%"></span></div></section>
    <div class="seg quatre">${tabs}</div>${body === null ? viewShare() + viewEnvois() : msg + `<section class="panel">${body}</section>`}`;
}
// Vue « Voix retirées » : chacune avec son lecteur, sa date, l'écoute et « Remettre » (mêmes filtres de leçon et de lecteur)
function viewRetired() {
  const list = retiredVoices().filter(v => (adminLesson === "all" || String(BY_ID[v.element].l) === String(adminLesson)) && (!adminReader || v.auteur === adminReader));
  if (!list.length) return `<p class="muted">Aucune voix retirée.</p>`;
  return `<p class="muted">${plural(list.length, "voix retirée")}</p><div>${list.map(v => `<div class="arow"><div class="ahead">${AR(BY_ID[v.element].ar)}<span class="pill">${lessonShort(BY_ID[v.element].l)}</span></div>
      <div class="avoice"><span>${esc(readerLabel(v.auteur))} · ${jour(v.cree_le)}</span>
        <button class="mini" data-act="reco-play" data-url="${esc(publicUrl(v.chemin))}" aria-label="Écouter cette voix">${ICON_SPEAK}</button>
        <button class="mini txt ok" data-act="voice-restore" data-vid="${v.id}">Remettre</button></div></div>`).join("")}</div>`;
}
// Lien vers la page de partage, depuis les réglages
const adminLink = () => sb && me
  ? `<a class="btn ghost" href="#partage">Partage des voix${aTraiter() ? " · " + aTraiter() + " à traiter" : ""}</a>` : "";

// Encadré des réglages : quelles voix entendre, quand plusieurs lecteurs ont enregistré
function viewReaders() {
  if (READERS.length < 2) return "";
  const sel = S.readers || [];
  return `<section class="panel"><h3>Voix que j'entends</h3>
      <p class="muted">Cochez les lecteurs que vous voulez entendre. Sans choix, tous sont utilisés, toujours dans le même ordre. Quand un mot a plusieurs voix, le bouton ↻ à côté de « Écouter » passe à la suivante.</p>
      <div class="chips">${READERS.map(a => `<button class="chip" data-act="reader-toggle" data-a="${a}" aria-pressed="${sel.includes(a)}">${esc(readerLabel(a))}</button>`).join("")}</div></section>`;
}
// Encadré des réglages : connexion
function viewAccount() {
  if (!sb) return "";
  const msg = sbMsg ? `<p role="status"><b>${esc(sbMsg)}</b></p>` : "";
  if (me) return `<section class="panel"><h3>Compte</h3><p>Connecté : <b>${esc(me.email || "")}</b> · niveau ${esc(myLevel)}</p>
      <label for="sb-nom">Mon nom de lecteur (affiché à côté de mes enregistrements)</label>
      <input type="text" id="sb-nom" class="field" maxlength="40" value="${esc(READER_NAME[me.id] || "")}">
      <div class="row"><button class="btn small" data-act="setname">Enregistrer ce nom</button><button class="btn small ghost" data-act="signout">Se déconnecter</button></div>${msg}${adminLink()}
      ${myLevel === "administrateur" ? `<a class="btn ghost" href="#statistiques">Statistiques d'usage</a>` : ""}</section>`;
  return `<section class="panel"><h3>Compte</h3>
      <p class="muted">Le compte sert à partager ses enregistrements. Aucun mot de passe : vous recevez un lien de connexion par courriel.</p>
      <label for="sb-email">Adresse électronique</label>
      <input type="email" id="sb-email" class="field" autocomplete="email" inputmode="email" placeholder="nom@exemple.org">
      <button class="btn" data-act="signin">Recevoir un lien de connexion</button>
      <p class="muted">En créant un compte, vous acceptez les <a href="confidentialite.html">conditions d'utilisation</a>.</p>${msg}</section>`;
}

/* ---------- 10. VOCABULAIRE : CORRIGER ET AJOUTER DES MOTS ---------- */

// Le vocabulaire de départ vient des fichiers du dossier js/unites/. Par-dessus, la base garde :
//   - des corrections : une nouvelle valeur pour un champ d'un mot (table « corrections ») ;
//   - des mots ajoutés à une leçon (table « mots », créée par supabase/0003_ajout_de_mots.sql).
// Un contributeur ou un administrateur publie directement ; les autres envoient une recommandation.
// Seul ce qui est publié est appliqué. La dernière version reçue est gardée sur l'appareil pour le hors ligne.
const CONTENT_KEY = "mufrad-contenu-v1";
const CHAMPS = { arabe: "ar", translitteration: "tr", traduction: "fr", note: "note" };   // nom dans la base -> nom dans l'application
const CHAMP_FR = { arabe: "arabe", translitteration: "translittération", traduction: "traduction", note: "note" };
// Valeurs d'origine des mots du manuel, pour pouvoir défaire une correction
const ORIG = Object.fromEntries(WORDS.map(m => [m.id, { ar: m.ar, tr: m.tr, fr: m.fr, note: m.note }]));
let corrRows = [];        // corrections que j'ai le droit de voir
let motRows = [];         // mots ajoutés que j'ai le droit de voir
let motsOk = true;        // faux si la table des mots ajoutés n'existe pas encore dans la base
let editForm = null;      // formulaire ouvert : { id } pour corriger un mot, { l } pour en ajouter un à une leçon
let vocMsg = "";          // dernier message de cette partie

// Remet le contenu d'origine, puis applique les mots ajoutés et les corrections publiés
function applyContent(corrs, mots) {
  // 1. on retire les mots ajoutés lors d'un passage précédent
  for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i].added) { delete BY_ID[ITEMS[i].id]; ITEMS.splice(i, 1); }
  for (let i = WORDS.length - 1; i >= 0; i--) if (WORDS[i].added) WORDS.splice(i, 1);
  // 2. on remet les valeurs d'origine
  WORDS.forEach(m => Object.assign(m, ORIG[m.id]));
  // 3. mots ajoutés (rattachés à une leçon qui existe)
  mots.filter(m => m.etat === "publie" && LESSON_TITLE[m.lecon] && !isAlpha(m.lecon)).forEach(m => {
    const u = UNITS.find(x => x.lessons.some(([l]) => l === m.lecon));
    const it = { id: "m-" + m.id, l: m.lecon, ar: m.arabe, tr: m.translitteration || "", fr: m.traduction, note: m.note || "", u: u.n, type: "word", added: true };
    WORDS.push(it); ITEMS.push(it); BY_ID[it.id] = it;
  });
  // 4. corrections, de la plus ancienne à la plus récente : la dernière publiée l'emporte
  corrs.filter(c => c.etat === "publie" && BY_ID[c.element] && BY_ID[c.element].type === "word" && CHAMPS[c.champ])
    .forEach(c => { BY_ID[c.element][CHAMPS[c.champ]] = c.valeur; });
}
// Au démarrage : le contenu reçu la dernière fois, avant même d'avoir du réseau
function applyCached() {
  try { const c = JSON.parse(localStorage.getItem(CONTENT_KEY) || "null"); if (c) applyContent(c.corrs || [], c.mots || []); } catch (e) {}
}
// Lit corrections et mots ajoutés dans la base, les applique et les garde pour le hors ligne
async function loadContent() {
  if (!sb) return;
  try {
    const c = await sb.from("corrections").select("id,element,champ,valeur,auteur,etat,cree_le").order("cree_le", { ascending: true });
    if (c.error) return;
    const m = await sb.from("mots").select("id,lecon,arabe,translitteration,traduction,note,auteur,etat,cree_le").order("cree_le", { ascending: true });
    motsOk = !m.error;
    corrRows = c.data; motRows = m.error ? [] : m.data;
    applyContent(corrRows, motRows);
    const pub = r => r.etat === "publie";
    try { localStorage.setItem(CONTENT_KEY, JSON.stringify({ corrs: corrRows.filter(pub), mots: motRows.filter(pub) })); } catch (e) {}
    ITEMS.forEach(it => refreshAudio(it.id));
    refresh();
  } catch (e) {}
}

// Lit le formulaire ouvert ; renvoie null (avec un message) si l'essentiel manque
function readForm() {
  const v = k => { const f = document.getElementById("vf-" + k); return f ? f.value.trim() : ""; };
  const vals = { arabe: v("ar"), translitteration: v("tr"), traduction: v("fr"), note: v("note") };
  if (!/[؀-ۿ]/.test(vals.arabe)) { vocMsg = "Écrivez le mot en arabe, avec ses voyelles."; return null; }
  if (!vals.traduction) { vocMsg = "Donnez la traduction."; return null; }
  return vals;
}
const sentMsg = etat => etat === "publie" ? "Publié : visible par tous les utilisateurs." : "Envoyé en recommandation : un contributeur le relira avant publication.";
// Corriger un mot : une ligne par champ réellement modifié
async function saveEdit(id) {
  const it = BY_ID[id], vals = readForm();
  if (!vals) { render(); return; }
  const changed = Object.keys(CHAMPS).filter(k => vals[k] !== (it[CHAMPS[k]] || ""));
  if (!changed.length) { editForm = null; vocMsg = ""; render(); return; }
  let etat = null, err = "";
  for (const k of changed) {
    const r = await sb.from("corrections").insert({ element: id, champ: k, valeur: vals[k] }).select("etat").single();
    if (r.error) err = k === "translitteration" ? "la translittération demande le fichier supabase/0003_ajout_de_mots.sql" : r.error.message; else etat = r.data.etat;
  }
  vocMsg = (etat ? sentMsg(etat) : "") + (err ? " Non enregistré : " + err + "." : "");
  editForm = null;
  await loadContent(); render();
}
// Ajouter un mot à une leçon
async function addWord(l) {
  const vals = readForm();
  if (!vals) { render(); return; }
  const r = await sb.from("mots").insert({ lecon: l, arabe: vals.arabe, translitteration: vals.translitteration, traduction: vals.traduction, note: vals.note }).select("etat").single();
  vocMsg = r.error ? "Mot non enregistré : la base n'a pas encore reçu le fichier supabase/0003_ajout_de_mots.sql (" + r.error.message + ")." : sentMsg(r.data.etat);
  editForm = null;
  await loadContent(); render();
}
// Accepter, refuser ou retirer une correction ou un mot ajouté (table = "corrections" ou "mots")
async function setContentState(table, rowId, etat) {
  const patch = etat === "retire" ? { etat } : { etat, traite_par: me.id, traite_le: new Date().toISOString() };
  const r = await sb.from(table).update(patch).eq("id", rowId);
  vocMsg = r.error ? "Action refusée : " + r.error.message : { publie: "Accepté et publié.", refuse: "Refusé.", retire: "Retiré." }[etat];
  if (etat === "retire") editForm = null;
  await loadContent(); render();
}

// Formulaire de correction ou d'ajout, affiché par-dessus l'onglet Réviser
function viewEditForm() {
  if (!editForm || !me) return "";
  const it = editForm.id ? BY_ID[editForm.id] : null;
  if (editForm.id && !it) return "";
  const val = k => it ? esc(it[k] || "") : "";
  // Pour un contributeur : les corrections publiées de ce mot, qu'on peut annuler une à une
  const hist = it && isContributor() ? corrRows.filter(c => c.element === it.id && c.etat === "publie").map(c =>
    `<div class="avoice"><span>${CHAMP_FR[c.champ]} : <bdi>${esc(c.valeur)}</bdi> · ${jour(c.cree_le)}</span><button class="mini txt" data-act="voc-undo" data-id="${c.id}">Annuler</button></div>`).join("") : "";
  const row = it && it.added ? motRows.find(m => "m-" + m.id === it.id) : null;
  const canRemove = row && (isContributor() || row.auteur === me.id);
  return `<button class="scrim" data-act="voc-close" aria-label="Fermer"></button>
    <div class="sheet form" role="dialog" aria-label="${it ? "Corriger un mot" : "Ajouter un mot"}">
      <h3>${it ? "Corriger un mot" : "Ajouter un mot · " + lessonHtml(editForm.l)}</h3>
      <p class="muted">${isContributor() ? "Vos modifications sont publiées tout de suite, pour tous les utilisateurs." : "Votre proposition est envoyée à un contributeur, qui la relit avant publication."}</p>
      <label for="vf-ar">Arabe, avec toutes les voyelles</label><input type="text" id="vf-ar" class="field ar" lang="ar" dir="rtl" value="${val("ar")}">
      <label for="vf-fr">Traduction</label><input type="text" id="vf-fr" class="field" value="${val("fr")}">
      <label for="vf-tr">Translittération (facultatif)</label><input type="text" id="vf-tr" class="field" value="${val("tr")}">
      <label for="vf-note">Note (facultatif)</label><input type="text" id="vf-note" class="field" value="${val("note")}">
      ${vocMsg ? `<p role="status"><b>${esc(vocMsg)}</b></p>` : ""}
      <button class="btn" data-act="voc-save">${isContributor() ? "Publier" : "Envoyer la proposition"}</button>
      ${canRemove ? `<button class="btn ghost" data-act="voc-remove" data-id="${row.id}">Retirer ce mot de la leçon</button>` : ""}
      ${hist ? `<p class="muted">Corrections publiées pour ce mot</p>${hist}` : ""}
      <button class="btn ghost" data-act="voc-close">Fermer</button></div>`;
}
// Encadré de l'onglet Réviser : propositions à relire (contributeurs), et mes propositions en attente
function viewContentRecos() {
  if (!sb) return "";
  if (!me) return `<section class="panel"><h3>Vocabulaire</h3><p class="muted">Une erreur dans un mot, un mot qui manque ? Connectez-vous pour proposer une correction ou un ajout.</p><a class="btn ghost" href="#reglages">Se connecter</a></section>`;
  const msg = vocMsg && !editForm ? `<p role="status"><b>${esc(vocMsg)}</b></p>` : "";
  const waitC = corrRows.filter(c => c.etat === "recommande" && BY_ID[c.element]), waitM = motRows.filter(m => m.etat === "recommande" && LESSON_TITLE[m.lecon]);
  const btns = (table, id, mine) => isContributor()
    ? `<button class="mini txt" data-act="voc-ok" data-t="${table}" data-id="${id}">Accepter</button><button class="mini txt" data-act="voc-no" data-t="${table}" data-id="${id}">Refuser</button>`
    : mine ? `<button class="mini txt" data-act="voc-retire" data-t="${table}" data-id="${id}">Retirer</button>` : "";
  const rows = waitC.map(c => { const it = BY_ID[c.element], k = CHAMPS[c.champ];
      return `<div class="arow"><div class="ahead">${AR(it.ar)}<span class="pill">${lessonShort(it.l)} · ${CHAMP_FR[c.champ]}</span></div>
        <div class="avoice"><span><s><bdi>${esc(it[k] || "(vide)")}</bdi></s> → <b><bdi>${esc(c.valeur || "(vide)")}</bdi></b></span>${btns("corrections", c.id, c.auteur === me.id)}</div></div>`; }).join("") +
    waitM.map(m => `<div class="arow"><div class="ahead">${AR(m.arabe)}<span class="pill">${lessonShort(m.lecon)} · nouveau mot</span></div>
        <div class="avoice"><span>${esc(m.traduction)}${m.translitteration ? " · " + esc(m.translitteration) : ""}${m.note ? " · " + esc(m.note) : ""}</span>${btns("mots", m.id, m.auteur === me.id)}</div></div>`).join("");
  const n = waitC.length + waitM.length;
  return `<section class="panel"><h3>Vocabulaire${n ? " · " + n + (isContributor() ? " à relire" : " en attente") : ""}</h3>
      <p class="muted">Plus bas, « Modifier » corrige un mot et « Ajouter un mot » en ajoute un à une leçon. ${isContributor() ? "Vos changements sont publiés tout de suite." : "Vos propositions sont relues par un contributeur."}</p>
      ${motsOk ? "" : `<p class="muted">L'ajout de mots attend le fichier supabase/0003_ajout_de_mots.sql dans la base ; les corrections fonctionnent déjà.</p>`}
      ${msg}<div>${rows}</div></section>`;
}

/* ---------- 11. STATISTIQUES D'USAGE ---------- */

// Ce que font les visiteurs et ce qu'ils touchent, sans savoir qui ils sont (supabase/0007_statistiques.sql,
// cahier des charges « Statistiques d'usage »).
//  - L'appareil est reconnu par un identifiant tiré au hasard, renouvelé CHAQUE JOUR : au-delà d'une journée,
//    deux visites du même appareil ne peuvent plus être reliées. Il n'est jamais relié au compte ni à l'adresse.
//  - Ce qui demande un suivi dans le temps (ancienneté, série, jours actifs, absence) est calculé ici, sur l'appareil,
//    à partir de la progression qui y est déjà gardée, puis envoyé arrondi par tranches.
//  - Jamais de texte tapé par l'utilisateur : seulement des identifiants de contenu, des boutons et des nombres.
//  - Les événements attendent dans une file et partent par lots : toutes les 10 secondes, ou quand on quitte la page.
//    Ce qui n'a pas pu partir est gardé dans le navigateur et renvoyé à la prochaine ouverture.
//  - Une version d'essai envoie aussi, marquée du nom de sa branche : les statistiques l'écartent.
//  - Qui refuse dans les réglages n'est plus compté du tout, et ce qui sert à la mesure est effacé de l'appareil.
const APPAREIL_KEY = "mufrad-appareil";           // { id, jour } : identifiant du jour
const MESURE_KEY = "mufrad-mesure";               // { debut, derniere } : premier et dernier jour d'utilisation (restent ici)
const FILE_KEY = "mufrad-mesure-file" + (ESSAI ? "-" + ESSAI : "");   // événements pas encore partis
const VISITE = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : null;   // cette ouverture de l'application
let fileMesure = [];      // événements pas encore envoyés : { type, detail, donnees, quand }
let minuterieMesure = null;
let versionApp = "";      // numéro de la copie hors ligne en service (sw.js), lu au démarrage
let actifDepuis = Date.now(), cacheDepuis = 0;   // pour le temps actif d'une visite
let erreursNotees = 0;    // au plus 10 erreurs par visite, pour ne pas inonder la base
const CLICS_MUETS = ["pick", "check", "next", "match", "g-pick", "g-check", "g-next", "g-key", "g-key-del"];

// Identifiant de l'appareil pour aujourd'hui ; un nouveau est tiré au premier besoin de chaque jour
function appareilId() {
  try {
    const a = JSON.parse(localStorage.getItem(APPAREIL_KEY) || "null");
    if (a && a.id && a.jour === today()) return a.id;
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : null;
    if (!id) return null;
    localStorage.setItem(APPAREIL_KEY, JSON.stringify({ id, jour: today() }));
    return id;
  } catch (e) { return null; }
}
// Ouverte depuis l'icône de l'écran d'accueil, ou dans le navigateur
const depuisIcone = () => { try { return Boolean(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; } catch (e) { return false; } };
// Sorte d'écran : pointage au doigt et petit côté étroit = téléphone ; au doigt et plus grand = tablette ; sinon ordinateur
function sorteEcran() {
  try {
    const doigt = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const cote = Math.min(screen.width, screen.height);
    return doigt ? (cote < 600 ? "telephone" : "tablette") : "ordinateur";
  } catch (e) { return null; }
}
// Arrondit une valeur à la borne basse de sa tranche, pour qu'une combinaison de valeurs ne désigne pas un appareil.
// Ex. avec [0, 1, 2, 3, 7, 14, 30] : 5 devient 3, 20 devient 14, 45 devient 30.
function tranche(n, bornes) {
  if (n == null || !isFinite(n) || n < 0) return null;
  let b = bornes[0];
  bornes.forEach(x => { if (n >= x) b = x; });
  return b;
}
const T_JOURS = [0, 1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 60, 90, 180, 365];   // écarts en jours
const T_SEMAINES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 26, 39, 52];   // ancienneté en semaines
// Lundi de la semaine d'un jour (clé AAAA-MM-JJ), pour savoir si c'est la première visite de la semaine
const lundiDe = k => { const d = dateOf(k); return addDays(k, -((d.getDay() + 6) % 7)); };

// Contexte envoyé avec l'ouverture : tout est calculé sur l'appareil, puis arrondi.
// « njour », « nsem », « nmois » : première ouverture du jour, de la semaine, du mois sur cet appareil.
// Ils permettent de compter les appareils actifs par semaine et la rétention sans identifiant durable.
function contexteOuverture() {
  const t = today();
  let m = {};
  try { m = JSON.parse(localStorage.getItem(MESURE_KEY) || "{}") || {}; } catch (e) {}
  // Premier jour d'utilisation : le plus ancien entre ce qui a été noté et le premier jour de progression
  const jours = Object.keys(S.days || {}).sort();
  const debut = [m.debut, jours[0], t].filter(Boolean).sort()[0];
  const derniere = m.derniere || null;
  const actifs30 = jours.filter(k => S.days[k].answers > 0 && diffDays(k, t) >= 0 && diffDays(k, t) < 30).length;
  const d = {
    anc: tranche(Math.floor(diffDays(debut, t) / 7), T_SEMAINES),
    serie: tranche(streak(), T_JOURS),
    actifs30,
    absence: derniere ? tranche(diffDays(derniere, t), T_JOURS) : null,
    njour: derniere !== t,
    nsem: !derniere || lundiDe(derniere) !== lundiDe(t),
    nmois: !derniere || derniere.slice(0, 7) !== t.slice(0, 7),
    langue: (typeof navigator !== "undefined" && navigator.language || "").slice(0, 2) || null,
    charge_ms: typeof performance !== "undefined" && performance.now ? Math.round(performance.now()) : null
  };
  try { localStorage.setItem(MESURE_KEY, JSON.stringify({ debut, derniere: t })); } catch (e) {}
  return d;
}

// Ajoute un événement à la file.
//   type    : nom de l'événement (voir le catalogue du cahier des charges)
//   detail  : une étiquette courte (bouton, onglet, identifiant de mot) ; jamais un texte tapé
//   donnees : un petit objet de nombres et d'étiquettes ; les valeurs vides sont retirées
function noter(type, detail, donnees) {
  if (S.mesure === false || fileMesure.length >= 300) return;
  let d = null;
  if (donnees) { d = {}; Object.keys(donnees).forEach(k => { if (donnees[k] != null) d[k] = donnees[k]; }); }
  fileMesure.push({ type, detail: detail == null ? null : String(detail).slice(0, 60), donnees: d, quand: new Date().toISOString() });
  if (!minuterieMesure && typeof setTimeout !== "undefined" && sb) minuterieMesure = setTimeout(envoyerMesure, 10000);
}
// Envoie la file par lots de 50 ; en cas d'échec, les événements restent pour le prochain essai
function envoyerMesure() {
  if (minuterieMesure) { clearTimeout(minuterieMesure); minuterieMesure = null; }
  if (!sb || S.mesure === false || !fileMesure.length) return;
  const id = appareilId(); if (!id) return;
  const lot = fileMesure.splice(0, 50);
  const remettre = () => { fileMesure = lot.concat(fileMesure).slice(0, 300); };
  sb.rpc("noter_evenements_v2", { appareil: id, visite: VISITE, installee: depuisIcone(), ecran: sorteEcran(),
                                  version: versionApp || null, essai: ESSAI || null, liste: lot })
    .then(r => { if (r.error) remettre(); else if (fileMesure.length) envoyerMesure(); }, remettre);
}
// Garde dans le navigateur ce qui n'est pas encore parti (on quitte la page, ou pas de réseau)
function garderFile() { try { if (fileMesure.length) localStorage.setItem(FILE_KEY, JSON.stringify(fileMesure.slice(-300))); else localStorage.removeItem(FILE_KEY); } catch (e) {} }
// Reprend la file gardée la dernière fois (la base refuse d'elle-même les dates de plus de 2 jours)
function reprendreFile() {
  try { const f = JSON.parse(localStorage.getItem(FILE_KEY) || "[]"); if (Array.isArray(f) && S.mesure !== false) fileMesure = f.concat(fileMesure).slice(-300); localStorage.removeItem(FILE_KEY); } catch (e) {}
}
// Refus ou acceptation depuis les réglages
function choisirMesure(oui) {
  S.mesure = oui; saveState();
  if (!oui) { fileMesure = []; try { [APPAREIL_KEY, MESURE_KEY, FILE_KEY].forEach(k => localStorage.removeItem(k)); } catch (e) {} }
}
// Ouverture de l'application : contexte de la visite, puis version (lue dans les copies hors ligne de sw.js)
function noterOuverture() {
  reprendreFile();
  if (S.mesure === false) return;
  noter("ouverture", null, contexteOuverture());
  lireVersion();
  // À la toute première visite, la copie hors ligne n'existe pas encore : on relit un peu plus tard
  if (typeof setTimeout !== "undefined") setTimeout(lireVersion, 8000);
}
function lireVersion() {
  try {
    if (typeof caches !== "undefined" && caches.keys) caches.keys().then(ks => {
      const nums = ks.map(k => (k.match(/^mufrad-(?:essai-.+-)?v(\d+)$/) || [])[1]).filter(Boolean).map(Number);
      if (nums.length) versionApp = String(Math.max(...nums));
    }).catch(() => {});
  } catch (e) {}
}
// Temps actif : on note le temps passé dans l'application quand elle passe en arrière-plan, et l'absence au retour
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    noter("pause", null, { actif_s: Math.round((Date.now() - actifDepuis) / 1000) });
    cacheDepuis = Date.now();
    envoyerMesure(); garderFile();
  } else if (cacheDepuis) {
    noter("reprise", null, { absent_s: Math.round((Date.now() - cacheDepuis) / 1000) });
    actifDepuis = Date.now(); cacheDepuis = 0;
  }
});
// Erreurs techniques : message coupé, fichier et ligne (jamais le contenu de l'écran)
if (typeof window !== "undefined" && window.addEventListener) {
  const noterErreur = (msg, fichier, ligne) => {
    if (erreursNotees++ >= 10) return;
    noter("erreur", String(msg || "erreur").slice(0, 60), { f: String(fichier || "").split("/").pop().slice(0, 30) || null, li: ligne || null });
  };
  window.addEventListener("error", e => noterErreur(e.message, e.filename, e.lineno));
  window.addEventListener("unhandledrejection", e => noterErreur("promesse : " + ((e.reason && e.reason.message) || e.reason), "", 0));
}

/* ---------- 8. CLICS ET DÉMARRAGE ---------- */

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act;
  // statistiques : quel bouton, et la valeur choisie (ex. « clavier » → « g-layout:alpha ») ; jamais un texte tapé
  // Les appuis répétés à chaque carte (choisir, vérifier, continuer, touches du clavier) ne sont pas notés comme clics :
  // les réponses les décrivent déjà, et ils feraient l'essentiel du volume.
  if (!CLICS_MUETS.includes(act)) noter("clic", [act, el.dataset.l, el.dataset.u, el.dataset.m, el.dataset.on, el.dataset.g, el.dataset.w].filter(x => x != null && x !== "").join(":"));
  if (act === "t-open") { tableauOpen(); return; }             // tableau d'écriture : traité dans js/tableau.js
  if (act.startsWith("g-")) { gramClick(act, el); return; }   // grammaire : traitée dans js/grammaire.js
  if (act !== "copy" && act !== "import") uiMsg = "";
  switch (act) {
    // Parcours
    case "node": sheet = Number(el.dataset.l); break;
    case "pick-open": sheet = "choix"; break;                // panneau « Réviser au choix »
    case "sheet-close": sheet = null; break;
    case "fold": {                                         // plier ou déplier une unité
      const u = UNITS.find(x => x.n === Number(el.dataset.u));
      S.fold = S.fold || {}; S.fold[u.n] = isOpen(u, nextLesson()); saveState(); break;
    }
    case "fold-all": S.fold = {}; UNITS.forEach(u => { S.fold[u.n] = true; }); saveState(); break;
    case "unfold-all": S.fold = {}; UNITS.forEach(u => { S.fold[u.n] = false; }); saveState(); break;
    case "known-lesson": {                                 // valider une leçon sans la faire
      const n = markKnown(itemsOf(Number(el.dataset.l)));
      noter("lecon_validee", "lecon:" + el.dataset.l, { n });
      sheet = null; sfx("ok"); uiMsg = ""; if (n) wantScroll = true; break;
    }
    case "known-unit": askKnown = Number(el.dataset.u); break;
    case "known-no": askKnown = null; break;
    case "known-unit-yes": noter("lecon_validee", "unite:" + el.dataset.u, { n: markKnown(ITEMS.filter(it => it.u === Number(el.dataset.u))) }); askKnown = null; sfx("ok"); wantScroll = true; break;
    case "daily": startDaily(); return;
    case "learn": sheet = null; startLearn(Number(el.dataset.l)); return;
    case "resume": sheet = null; resumeLearn(Number(el.dataset.l)); return;   // reprendre une leçon quittée en cours de route
    case "redo": sheet = null; startLearn(Number(el.dataset.l), true); return;   // refaire une leçon déjà vue, fiches comprises
    case "review": { const l = Number(el.dataset.l); sheet = null; startDrill(itemsOf(l).filter(isSeen), lessonLabel(l)); return; }
    case "cram": { const l = Number(el.dataset.l); sheet = null; startDrill(itemsOf(l), lessonLabel(l)); return; }
    // Onglet Réviser
    case "drill-toggle": drillSel[el.dataset.l] = !drillSel[el.dataset.l]; break;
    case "drill-unit": {                                   // déplier ou replier une unité dans le choix des leçons
      const u = UNITS.find(x => String(x.n) === el.dataset.u);
      drillOpen[u.n] = !(u.n in drillOpen ? drillOpen[u.n] : (isOpen(u, nextLesson()) || u.lessons.some(([l]) => drillSel[l])));
      break;
    }
    case "drill-all": UNITS.forEach(u => u.lessons.forEach(([l]) => { drillSel[l] = true; })); break;
    case "drill-none": drillSel = {}; break;
    case "drill-start": sheet = null; startDrill(drillItems(), "Révision choisie"); location.hash = "#accueil"; return;
    case "drill-hard": sheet = null; startDrill(hardItems(), "Éléments en difficulté"); location.hash = "#accueil"; return;
    // Séance
    case "speak": speak(el.dataset.id); return;
    case "stats-reload": statsData = null; statsMsg = ""; statsCharger(); return;   // écran Statistiques (js/statistiques.js)
    case "quit": case "home":                                                 // les réponses déjà données sont conservées
      if (sess && !sess.over) noter("seance_quittee", sess.kind, { ...sessStats(), pos: sess.i, total: sess.tasks.length });
      sess = null; wantScroll = true; break;
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
        if ((ex === "fr2ar" || ex === "n2l") && canSpeak(c.opts[k].id)) speak(c.opts[k].id, "choix"); else sfx("tap");
      }
      break;
    case "check": {                                         // vérification de la proposition sélectionnée
      const task = sess.tasks[sess.i], c = sess.cur;
      if (sess.peek !== null || c.checked || c.picked === null) return;
      c.checked = true;
      sfx(c.opts[c.picked].id === task.id ? "ok" : "ko");
      answer(task, c.opts[c.picked].id === task.id, Date.now() - c.t0, c.opts[c.picked].id);
      break;
    }
    case "match": {                                         // association de paires, dans n'importe quel ordre
      if (sess.peek !== null) return;
      const c = sess.cur, pick = { side: el.dataset.side, id: el.dataset.id };
      if (c.sel && c.sel.side === pick.side && c.sel.id === pick.id) { c.sel = null; sfx("tap"); }  // second appui : on désélectionne
      else if (!c.sel || c.sel.side === pick.side) {                                                // premier choix, ou changement d'avis du même côté
        c.sel = pick; c.bad = null;
        if (pick.side === "L" && canSpeak(pick.id)) speak(pick.id, "paire"); else sfx("tap");
      }
      else {
        const arId = pick.side === "L" ? pick.id : c.sel.id; // le mot arabe de la paire tentée
        if (c.sel.id === pick.id) { c.done[pick.id] = true; sess.answers++; sess.correct++; c.bad = null; sfx("ok"); noter("paire", pick.id, { ok: true }); }
        else {
          sess.answers++; sess.st[arId].err = true; c.bad = pick; sfx("ko"); // l'erreur comptera dans la note du mot
          noter("paire", arId, { ok: false, choix: pick.side === "L" ? c.sel.id : pick.id });   // statistiques : avec quoi on l'a associé
        }
        c.sel = null;
      }
      break;
    }
    // Voix
    case "voice-lesson": voiceLesson = Number(el.dataset.l); break;
    case "clip-del": deleteClip(el.dataset.id); break;
    case "voice-next": {                                                   // passer à la voix suivante pour cet élément, et l'écouter
      const id = el.dataset.id, n = voicesFor(id).length;
      if (n > 1) { S.voiceIdx = S.voiceIdx || {}; S.voiceIdx[id] = (voiceIndex(id) + 1) % n; saveState(); refreshAudio(id); speak(id, "autre_voix"); }
      break;
    }
    case "mic-list": askMics(); return;
    case "voice-del": removeVoice(el.dataset.vid); return;
    case "voice-restore": restoreVoice(el.dataset.vid); return;   // remettre une voix retirée dans le partage
    case "share-one": shareMany([el.dataset.id]); return;          // (re)partager l'enregistrement de cet appareil
    case "admin-state": adminState = el.dataset.k; break;
    case "admin-reader": adminReader = el.dataset.a; adminTab = "voix"; break;   // depuis « Lecteurs » : ses voix
    case "admin-tab": adminTab = el.dataset.k; sbMsg = ""; break;
    case "reader-toggle": {                                                // choisir les lecteurs qu'on veut entendre
      const a = el.dataset.a; S.readers = S.readers || [];
      S.readers = S.readers.includes(a) ? S.readers.filter(x => x !== a) : [...S.readers, a];
      saveState(); ITEMS.forEach(it => refreshAudio(it.id)); break;
    }
    case "setname": { const f = document.getElementById("sb-nom"); setName(f ? f.value.trim() : ""); return; }
    case "rec": toggleRecord(el.dataset.id); return;                       // démarre ou arrête le micro
    // Enregistrement guidé (préfixe « rg- » : les actions en « g- » sont celles de la grammaire)
    case "rg-start": startGuide(el.dataset.l ? guideQueue(Number(el.dataset.l)) : waitingVoices().slice(0, 10)); return;
    case "rg-keep": keepOne(el.dataset.id); guide.faits++; guide.i++; guide.edit = false; uiMsg = ""; break;   // ✓ : déposé, puis mot suivant
    case "rg-edit": guide.edit = true; break;                                                // piste et rognage, comme dans l'onglet Voix
    case "rg-redo": dropPending(el.dataset.id); toggleRecord(el.dataset.id); return;         // ↺ : on efface et on réenregistre
    case "rg-skip": if (guide) { dropPending(guide.ids[guide.i]); guide.i++; guide.edit = false; } uiMsg = ""; break;
    case "pend-play": {                                                    // écoute d'un enregistrement en attente
      const p = pending.find(x => x.id === el.dataset.id);
      if (p) playPending(p);
      return;
    }
    case "pend-drop": dropPending(el.dataset.id); break;
    case "pend-none": pending.slice().forEach(p => dropPending(p.id)); uiMsg = ""; break;
    case "clip-edit": {                                                    // reprendre le rognage d'un enregistrement déposé
      const c = CLIPS[el.dataset.id];
      if (c) { addPending(el.dataset.id, c.orig, { a: c.a, b: c.b }); uiMsg = "L'enregistrement est revenu dans la liste d'attente : réglez-le puis déposez-le de nouveau."; }
      break;
    }
    // Compte et partage
    case "signin": { const f = document.getElementById("sb-email"); signIn(f ? f.value.trim() : ""); return; }
    case "signout": signOut(); return;
    case "sync": syncAccount(); return;                    // fusionne la progression avec la copie du compte
    case "consent": { const c = document.getElementById("c-train"); signConsent(Boolean(c && c.checked)); return; }
    case "consent-off": withdrawConsent(); return;
    case "share-all": shareMany(unsharedIds()); return;
    case "reco-play": try { new Audio(el.dataset.url).play().catch(() => {}); } catch (err) {} return;
    case "reco-ok": decide(el.dataset.id, true); return;
    // Vocabulaire : corriger, ajouter, relire les propositions
    case "voc-edit": editForm = { id: el.dataset.id }; vocMsg = ""; break;
    case "voc-add": editForm = { l: Number(el.dataset.l) }; vocMsg = ""; break;
    case "voc-close": editForm = null; vocMsg = ""; break;
    case "list-toggle": {                                  // plier ou déplier une leçon dans la liste des mots
      const l = Number(el.dataset.l); listOpen[l] = !(l in listOpen ? listOpen[l] : l === nextLesson()); break;
    }
    case "voc-save": if (editForm.id) saveEdit(editForm.id); else addWord(editForm.l); return;
    case "voc-ok": setContentState(el.dataset.t, el.dataset.id, "publie"); return;
    case "voc-no": setContentState(el.dataset.t, el.dataset.id, "refuse"); return;
    case "voc-retire": setContentState(el.dataset.t, el.dataset.id, "retire"); return;
    case "voc-undo": setContentState("corrections", el.dataset.id, "retire"); return;
    case "voc-remove": setContentState("mots", el.dataset.id, "retire"); return;
    case "reco-no": decide(el.dataset.id, false); return;
    case "pend-ok": { const n = confirmPending(); uiMsg = plural(n, "enregistrement") + (n > 1 ? " déposés." : " déposé."); break; }
    // Réglages
    case "mesure": choisirMesure(el.dataset.on === "1"); break;
    case "traces": S.traces = el.dataset.on === "1"; saveState(); break;   // tableau d'écriture : garder ou non ce qu'on y écrit
    case "sfx": S.sfx = el.dataset.on === "1"; saveState(); if (S.sfx) sfx("ok"); break;
    case "goal": S.goal = Number(el.dataset.g); saveState(); break;
    case "translit": S.translit = el.dataset.on === "1"; saveState(); break;
    case "skip": S.offset = (S.offset || 0) + 1; saveState(); break;
    case "reset": askReset = true; break;
    case "reset-no": askReset = false; break;
    case "reset-yes": { const m = S.mesure, t = S.traces; S = blankState(); S.mesure = m; S.traces = t; } saveState();   // le choix sur les statistiques est gardé
      askReset = false; sess = null; break;
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

// Fichiers audio choisis dans l'onglet Voix : ils vont en liste d'attente, jamais directement en dépôt
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset && el.dataset.mic) { S.mic = el.value; saveState(); return; }   // choix du micro
  if (el.dataset && el.dataset.adm) {                                               // filtres de la page Gestion des voix
    if (el.dataset.adm === "lesson") adminLesson = el.value;
    else if (el.dataset.adm === "state") adminState = el.value;
    else adminReader = el.value || null;
    render(); return;
  }
  if (!el.files || !el.files.length) return;
  if (el.dataset.clip) {                       // un fichier pour un élément
    addPending(el.dataset.clip, el.files[0]); uiMsg = "";
  } else if (el.dataset.bulk) {                // tous les fichiers d'une leçon : rangés par nom, attribués dans l'ordre de la leçon
    const its = itemsOf(Number(el.dataset.bulk));
    const files = Array.from(el.files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (files.length !== its.length) uiMsg = `Cette leçon compte ${its.length} éléments et vous avez choisi ${files.length} fichiers : rien n'a été ajouté.`;
    else { files.forEach((f, i) => addPending(its[i].id, f)); uiMsg = "Écoutez chaque enregistrement ci-dessus pour vérifier l'ordre, puis déposez."; }
  }
  render();
});

document.addEventListener("input", e => {
  // Recherche dans la liste des mots : on ne redessine que la liste, pour garder le curseur dans le champ
  if (e.target.dataset && e.target.dataset.wq) { wordQuery = e.target.value; const box = document.getElementById("wlist"); if (box) box.innerHTML = wordList(); return; }
  const el = e.target;
  if (!el.dataset || !el.dataset.trim) return;
  const p = pending.find(x => x.id === el.dataset.id); if (!p || !p.data) return;
  const t = Number(el.value) / 1000 * p.dur;
  if (el.dataset.trim === "a") p.a = Math.min(t, p.b - 0.05); else p.b = Math.max(t, p.a + 0.05); // le début reste avant la fin
  drawWave(p);
  const tl = document.getElementById("tl-" + p.id);
  if (tl) tl.textContent = "Gardé : " + sec(p.b - p.a) + " sur " + sec(p.dur);
});

window.addEventListener("hashchange", () => { sheet = null; editForm = null; wantScroll = true; noter("onglet", route()); render(); });
applyCached();   // corrections et mots ajoutés reçus la dernière fois
render();
initAudio();
loadClips();
initCloud();
// Fonctionnement hors ligne et installation sur l'écran d'accueil (ignoré si le navigateur ne le permet pas)
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

