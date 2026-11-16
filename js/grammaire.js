"use strict";
/* Mufrad — grammaire : leçons courtes (explication, vers du poème, questions) et leur révision.
   Chargé avant l'application ; les fichiers du dossier js/grammaire/ y inscrivent le contenu.
   Ce fichier n'utilise les outils de l'application (esc, AR, S, schedule…) qu'à l'intérieur de ses fonctions,
   donc après son chargement. La progression est rangée avec celle des mots, dans S.cards :
   une carte par question (identifiant « g… ») et une carte par vers mémorisé (identifiant « n… »). */

const GRAMMAIRE = [];   // chapitres, inscrits par js/grammaire/chapitre-NN.js
const NAZM = [];        // vers du poème, inscrits par js/grammaire/nazm.js, dans l'ordre du texte
const GLOSSAIRE = [];   // termes arabes de la rubrique, inscrits par js/grammaire/glossaire.js
const NATURES_MOTS = { fil: [], harf: [], hors: [] };   // sorte des mots du vocabulaire, inscrite par js/grammaire/natures.js
const SOURCES = [];     // éditions de référence consultables dans l'application, inscrites par js/grammaire/sources.js

let gs = null;          // séance de grammaire en cours (en mémoire seulement)
let gOpen = {};         // encadrés dépliés à la main dans l'onglet : nom -> true ou false
let gTerm = null;       // terme dont la définition est ouverte
let gKnown = null;      // bab pour lequel on demande confirmation de « je connais déjà »
let gSrc = null;        // édition ouverte dans la visionneuse : { id, p (image affichée), zoom }
let gSeen = {};         // termes déjà traduits dans l'écran en cours (on ne répète pas la traduction à chaque ligne)

const NATURES = [["ism", "اِسْم", "nom"], ["fil", "فِعْل", "verbe"], ["harf", "حَرْف", "particule"]];
const gLessons = () => GRAMMAIRE.slice().sort((a, b) => a.n - b.n).flatMap(c => c.lecons.map(l => ({ ...l, chap: c })));
const gVerse = id => NAZM.find(v => v.id === id);
const gNazmOn = () => S.nazm !== false;                              // mémoriser le poème : oui par défaut, réglable dans l'onglet
const gCard = id => S.cards[id];
const gIsDue = id => Boolean(gCard(id)) && gCard(id).due <= today();
const gIsKnown = id => Boolean(gCard(id)) && gCard(id).s >= 7 && gCard(id).due > today();
// Questions d'une leçon réellement posables (un mot de vocabulaire retiré depuis fait sauter sa question)
const gQuestions = l => l.questions.filter(q => !q.mot || BY_ID[q.mot]);
const gDone = l => gQuestions(l).every(q => gCard(q.id));
// Ce qui est à revoir aujourd'hui. La grammaire et le poème se révisent séparément.
const gramDueQ = () => gLessons().flatMap(l => gQuestions(l).map(q => q.id)).filter(gIsDue);
const gramDueV = () => (gNazmOn() ? NAZM.map(v => v.id).filter(gIsDue) : []);
const gramDue = () => [...gramDueQ(), ...gramDueV()];
const gWrite = () => S.ecrire !== false;                              // écrire certaines réponses au clavier arabe : oui par défaut
const gHarakat = () => S.harakat === true;                            // écrire aussi les voyelles (harakat) : non par défaut
const gLayout = () => (S.clavier === "alpha" ? "alpha" : "classique"); // disposition du clavier : celle des claviers arabes, ou l'alphabet

// --- Termes arabes. Trois réglages (S.termes) : "auto" (traduit jusqu'à la fin de la leçon qui l'introduit),
// "fr" (toujours traduit), "ar" (arabe seul). Les termes rencontrés sont notés dans S.connus.
const gTermOf = id => GLOSSAIRE.find(t => t.id === id);
const gTermMode = () => S.termes || "auto";
const gNeedsGloss = id => gTermMode() === "fr" || (gTermMode() === "auto" && !(S.connus && S.connus[id]));
// Affiche un terme. « plain » : à l'intérieur d'un bouton, où l'on ne peut pas mettre un autre bouton.
function gTermHtml(id, pl, plain) {
  const t = gTermOf(id); if (!t) return esc(id);
  const ar = pl && t.pl ? t.pl : t.ar, gloss = gNeedsGloss(id) && !gSeen[id] ? ` <span class="gloss">(${esc(t.fr)})</span>` : "";
  gSeen[id] = true;
  return (plain ? `<span class="ar gi" lang="ar" dir="rtl">${ar}</span>` : `<button class="term ar gi" lang="ar" dir="rtl" data-act="g-term" data-id="${id}">${ar}</button>`) + gloss;
}
// Texte : échappé, avec {{terme}} du glossaire, l'arabe entre [[ ]] et les mots importants entre * *
function gText(t, plain) {
  return esc(t).replace(/\{\{([a-z-]+)(:pl)?\}\}/g, (m, id, pl) => gTermHtml(id, Boolean(pl), plain))
    .replace(/\[\[(.+?)\]\]/g, (m, a) => `<span class="ar gi" lang="ar" dir="rtl">${a}</span>`).replace(/\*(.+?)\*/g, "<b>$1</b>");
}
// Termes employés dans une leçon (pages et questions) : ils sont tenus pour connus une fois la leçon terminée
function gTermsOf(l) {
  const found = new Set(l.termes || []);
  JSON.stringify([l.titre, l.pages, l.questions]).replace(/\{\{([a-z-]+)(:pl)?\}\}/g, (m, id) => { found.add(id); return m; });
  if (l.questions.some(q => q.nature)) ["ism", "fil", "harf"].forEach(id => found.add(id));
  return [...found].filter(gTermOf);
}
// Définition d'un terme, ouverte par un appui sur lui
function gTermSheet() {
  const t = gTerm && gTermOf(gTerm); if (!t) return "";
  return `<button class="scrim" data-act="g-term-close" aria-label="Fermer"></button>
    <div class="sheet" role="dialog" aria-label="Définition"><div class="prompt"><span class="ar" lang="ar" dir="rtl">${t.ar}</span>${t.pl ? `<span class="tr">pluriel : <span class="ar" lang="ar" dir="rtl">${t.pl}</span></span>` : ""}</div>
      <p><b>${esc(t.fr)}</b></p><p>${gText(t.def, true)}</p><button class="btn ghost" data-act="g-term-close">Fermer</button></div>`;
}
function gMix(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// --- Préparation des questions : tout devient { id, ask, prompt, opts: [{ html, ar }], bon, why }
function gBuildQuestion(q) {
  gSeen = {};                                       // dans les choix d'une question, un terme pas encore connu est toujours traduit
  if (q.nature) {                                   // « de quelle sorte est ce mot ? » : trois choix fixes
    const it = BY_ID[q.mot];
    return { id: q.id, ask: "De quelle sorte est ce mot ?", prompt: AR(it ? it.ar : q.ar) + `<span class="tr">${esc(it ? it.fr : q.fr || "")}</span>`,
      opts: NATURES.map(([k]) => ({ html: gTermHtml(k, false, true) })), bon: NATURES.findIndex(n => n[0] === q.nature), why: q.pourquoi };
  }
  const order = gMix(q.choix.map((c, k) => k));     // les choix sont mélangés à chaque passage
  const it = q.mot ? BY_ID[q.mot] : null;
  const prompt = it ? AR(it.ar) + `<span class="tr">${esc(it.fr)}</span>` : q.ar ? AR(q.ar) + (q.fr ? `<span class="tr">${esc(q.fr)}</span>` : "") : "";
  return { id: q.id, ask: q.q, prompt, opts: order.map(k => ({ html: q.arChoix ? esc(q.choix[k]) : gText(q.choix[k], true), ar: Boolean(q.arChoix) })), bon: order.indexOf(q.bon), why: q.pourquoi };
}
// --- Comparer de l'arabe écrit par l'apprenant : on ne tient compte ni des voyelles ni de la ponctuation,
// et on ne distingue pas les formes de l'alif ni le ى final du ي (l'écriture est déjà assez difficile au clavier).
const gBare = t => String(t).replace(/[\u064B-\u0652\u0670\u0640«»،؛:.!؟\s]/g, "");
const gNorm = t => gBare(t).replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي");
// Avec les voyelles : on compare lettres ET voyelles, mais sans exiger ce que personne n'écrit à la main :
// le sukūn, la voyelle brève qui précède sa lettre d'allongement (ـَا ـِي ـُو ـَى), et l'ordre shadda / voyelle.
function gVocal(t) {
  return String(t).replace(/[\u0640«»،؛:.!؟\s]/g, "").replace(/[أإآٱ]/g, "ا").replace(/\u0652/g, "")
    .replace(/([\u064B-\u0650])\u0651/g, "\u0651$1")                               // la shadda d'abord, puis sa voyelle
    .replace(/\u064E(?=[اى])/g, "").replace(/\u0650(?=ي(?![\u064B-\u0651]))/g, "").replace(/\u064F(?=و(?![\u064B-\u0651]))/g, "")
    .replace(/ى/g, "ي").replace(/\u0670/g, "");
}
// Jumeaux : des mots qui ont les mêmes lettres mais des voyelles différentes, donc un autre sens (مِنْ / مَنْ, نَعَمْ / نِعَم).
// On les cherche dans tout ce que l'application connaît : le vocabulaire des unités et les mots du poème.
// Règle : un mot qui a un jumeau n'est jamais demandé là où les voyelles ne comptent pas ou ne se voient pas.
// La table des mots connus, rangés par leurs lettres seules, est refaite seulement quand le vocabulaire ou le poème change.
let gTwinTable = null, gTwinStamp = "";
function gTwins(word) {
  const stamp = WORDS.length + ":" + NAZM.length + ":" + WORDS.map(w => w.ar.length).reduce((a, b) => a + b, 0);
  if (stamp !== gTwinStamp) {
    gTwinTable = {}; gTwinStamp = stamp;
    [...WORDS.map(w => w.ar), ...NAZM.flatMap(v => (v.a + " " + v.b).split(" ").map(gCore))].forEach(k => { (gTwinTable[gNorm(k)] = gTwinTable[gNorm(k)] || new Set()).add(k); });
  }
  const vo = gVocal(word);
  return [...(gTwinTable[gNorm(word)] || [])].filter(k => gVocal(k) !== vo);
}
const gCore = w => w.replace(/^[«»،؛:.!؟]+|[«»،؛:.!؟]+$/g, "").replace(/^كَـ«|»$/g, "");   // le mot sans la ponctuation qui l'entoure
// Les mots d'un vers qu'on peut cacher : au moins trois lettres, pour que le trou ait un intérêt
function gHoles(v) {
  const out = [];
  [["a", v.a], ["b", v.b]].forEach(([h, txt]) => txt.split(" ").forEach((w, i) => { if (gBare(gCore(w)).length >= 3) out.push({ h, i, word: gCore(w) }); }));
  return out;
}
// Le vers avec un mot remplacé par un trait (ou, une fois corrigé, par le mot mis en valeur)
function gHoleHtml(v, hole, shown) {
  const half = h => v[h].split(" ").map((w, i) => (h === hole.h && i === hole.i
    ? esc(w).replace(esc(hole.word), shown ? `<mark>${esc(hole.word)}</mark>` : `<span class="blank"></span>`) : esc(w))).join(" ");
  return `<div class="verse"><span class="ar" lang="ar" dir="rtl">${half("a")}</span><span class="ar" lang="ar" dir="rtl">${half("b")}</span></div>`;
}
// Questions de mémorisation, fabriquées à partir du texte.
// kind : "trou" (mot manquant, à choisir), "ecrit" (mot manquant, à écrire), "ajuz" (seconde moitié), "suite" (vers suivant)
function gVerseQuestion(v, kind) {
  const k = NAZM.indexOf(v), next = NAZM[k + 1];
  const others = gMix(NAZM.filter(o => o.id !== v.id && (!next || o.id !== next.id)));
  const near = others.filter(o => o.bab === v.bab), pool = [...near, ...others.filter(o => o.bab !== v.bab)].slice(0, 2);
  if (kind === "suite" && next) {
    const opts = gMix([next, ...pool]);
    return { id: v.id, verse: true, ask: "Quel {{bayt}} vient juste après ?", prompt: gVerseHtml(v), opts: opts.map(o => ({ html: esc(o.a), ar: true })), bon: opts.indexOf(next), why: "" };
  }
  const holes = gHoles(v);
  if ((kind === "trou" || kind === "ecrit") && holes.length) {
    const hole = holes[Math.floor(Math.random() * holes.length)];
    const base = { id: v.id, verse: true, prompt: gHoleHtml(v, hole, false), solved: gHoleHtml(v, hole, true), why: "" };
    // Écrire sans les voyelles un mot qui a un jumeau serait ambigu : on le fait choisir, voyelles visibles
    if (kind === "ecrit" && (gHarakat() || !gTwins(hole.word).length)) return { ...base, type: "ecrit", ask: "Écrivez le mot qui manque.", answer: hole.word, opts: [], bon: -1 };
    // Trois autres mots du poème, différents du bon une fois les voyelles retirées
    const seen = new Set([gNorm(hole.word)]), wrong = [];
    gMix(NAZM.filter(o => o.id !== v.id).flatMap(gHoles)).forEach(x => { if (wrong.length < 3 && !seen.has(gNorm(x.word))) { seen.add(gNorm(x.word)); wrong.push(x.word); } });
    const opts = gMix([hole.word, ...wrong]);
    return { ...base, ask: "Quel mot manque dans ce {{bayt}} ?", opts: opts.map(w => ({ html: esc(w), ar: true })), bon: opts.indexOf(hole.word) };
  }
  const opts = gMix([v, ...pool]);
  return { id: v.id, verse: true, ask: "Quel est le {{ajuz}} de ce {{bayt}} ?", prompt: `<div class="verse"><span class="ar" lang="ar" dir="rtl">${esc(v.a)}</span><span class="ar hole" lang="ar" dir="rtl">…</span></div>`,
    opts: opts.map(o => ({ html: esc(o.b), ar: true })), bon: opts.indexOf(v), why: "" };
}
// Forme de la question selon le nombre de fois où le vers a déjà été revu : on varie, et l'écriture vient après les choix
function gVerseKind(v) {
  const reps = (gCard(v.id) && gCard(v.id).reps) || 0, kind = ["trou", "suite", "trou", "ajuz"][reps % 4];
  return kind === "trou" && reps >= 2 && gWrite() ? "ecrit" : kind;
}

// --- Exercices fabriqués à volonté à partir du vocabulaire : la sorte d'un mot
function gNatureOf(it) {
  if (!it || it.type !== "word" || it.added || NATURES_MOTS.hors.includes(it.id)) return null;
  return NATURES_MOTS.fil.includes(it.id) ? "fil" : NATURES_MOTS.harf.includes(it.id) ? "harf" : "ism";
}
function gGenerated() {
  gSeen = {};
  // On pioche d'abord dans les mots déjà rencontrés ; à défaut, dans tout le vocabulaire
  const all = WORDS.filter(gNatureOf), seen = all.filter(isSeen), by = n => gMix((seen.filter(w => gNatureOf(w) === n).length >= 2 ? seen : all).filter(w => gNatureOf(w) === n));
  const target = NATURES[Math.floor(Math.random() * 3)], [k, ar] = target;
  if (Math.random() < 0.5) {                        // « de quelle sorte est ce mot ? »
    const it = by(k)[0];
    return { id: "", ask: "De quelle sorte est ce mot ?", prompt: AR(it.ar) + `<span class="tr">${esc(it.fr)}</span>`, opts: NATURES.map(([n]) => ({ html: gTermHtml(n, false, true) })),
      bon: NATURES.findIndex(n => n[0] === k), why: `[[${it.ar}]] est un {{${k}}}.` };
  }
  // « lequel de ces mots est un … ? » : un mot de la sorte demandée, un de chacune des deux autres
  // Ici les mots sont montrés sans leur traduction : on n'y met aucun mot qui a un jumeau
  const solo = n => by(n).filter(w => !gTwins(w.ar).length)[0];
  const good = solo(k), wrong = NATURES.filter(n => n[0] !== k).map(n => solo(n[0])), opts = gMix([good, ...wrong]);
  return { id: "", ask: `Lequel de ces mots est un {{${k}}} ?`, prompt: "", opts: opts.map(o => ({ html: esc(o.ar), ar: true })), bon: opts.indexOf(good),
    why: opts.map(o => `[[${o.ar}]] : {{${gNatureOf(o)}}}`).join(" · ") };
}

const gVerseHtml = v => `<div class="verse"><span class="ar" lang="ar" dir="rtl">${esc(v.a)}</span><span class="ar" lang="ar" dir="rtl">${esc(v.b)}</span></div>`;

// --- Visionneuse : une page de l'édition de référence, par-dessus l'écran, sans quitter l'application.
// Comme dans le livre, la page suivante est à gauche. Un appui sur la page l'agrandit.
function gSourceView() {
  const s = gSrc && SOURCES.find(x => x.id === gSrc.id); if (!s) return "";
  const p = gSrc.p, file = s.dossier + "p-" + String(p).padStart(2, "0") + ".webp";
  return `<div class="gsrc" role="dialog" aria-label="Édition de référence">
    <div class="gsrc-bar"><button class="icon" data-act="g-src-close" aria-label="Fermer l'édition">✕</button>
      <span><b>${esc(s.titre)}</b><small>${esc(s.edition)}</small></span></div>
    <div class="gsrc-page ${gSrc.zoom ? "zoom" : ""}"><img src="${file}" alt="Page ${p} sur ${s.pages} de l'édition" data-act="g-src-zoom"></div>
    <div class="gsrc-nav"><button class="btn small ghost" data-act="g-src-go" data-d="1" ${p >= s.pages ? "disabled" : ""}>‹ Page suivante</button>
      <span>${p} / ${s.pages}</span>
      <button class="btn small ghost" data-act="g-src-go" data-d="-1" ${p <= 1 ? "disabled" : ""}>Page précédente ›</button></div></div>`;
}
// Bouton qui ouvre l'édition à la page d'un bab (ou au début du texte)
function gSourceBtn(bab, label) {
  const s = SOURCES.find(x => x.id === "nazm"); if (!s) return "";
  return `<button class="linkbtn" data-act="g-src" data-id="nazm" data-p="${(bab && s.babs[bab]) || s.debut}">${label}</button>`;
}

// Valider un bab sans faire ses leçons : ses questions et ses vers entrent en révision dès aujourd'hui
// (une première révision réussie les rend acquis), et ses termes sont tenus pour connus.
function gMarkKnown(n) {
  const c = GRAMMAIRE.find(x => x.n === n), t = today(); if (!c) return;
  S.connus = S.connus || {};
  c.lecons.forEach(l => {
    [...gQuestions(l).map(q => q.id), ...(gNazmOn() ? l.vers || [] : [])].forEach(id => { if (!gCard(id)) S.cards[id] = { ...schedule(undefined, 4, t), due: t }; });
    gTermsOf(l).forEach(id => { S.connus[id] = true; });
  });
  saveState();
}

// --- Séances
function gStartLesson(id) {
  const l = gLessons().find(x => x.id === id); if (!l) return;
  const verses = gNazmOn() ? (l.vers || []).map(gVerse).filter(Boolean) : [];
  const steps = [
    ...l.pages.map(p => ({ t: "page", page: p, lesson: l })),
    ...(verses.length ? [{ t: "verses", verses, lesson: l }] : []),
    ...gQuestions(l).map(q => ({ t: "q", q: gBuildQuestion(q) })),
    ...verses.map(v => ({ t: "q", q: gVerseQuestion(v, "trou") }))
  ];
  gs = gSession("lesson", l.titre, steps, { lesson: l });
}
const gSession = (kind, title, steps, extra) => ({ kind, title, steps, i: 0, picked: null, typed: "", checked: false, right: 0, asked: 0, over: false, ...extra });
// Révision des cartes dues : which = "q" (grammaire), "v" (poème), ou les deux si rien n'est précisé
function gStartReview(which) {
  const ids = which === "q" ? gramDueQ() : which === "v" ? gramDueV() : gramDue(), byId = {};
  gLessons().forEach(l => gQuestions(l).forEach(q => { byId[q.id] = q; }));
  const steps = gMix(ids.slice(0, 15)).map(id => byId[id] ? { t: "q", q: gBuildQuestion(byId[id]) } : { t: "q", q: gVerseQuestion(gVerse(id), gVerseKind(gVerse(id))) });
  if (steps.length) gs = gSession("review", which === "v" ? "Révision du {{nazm}}" : "Révision de grammaire", steps);
}
// Entraînement libre : dix questions, autant de fois qu'on veut, sans toucher au calendrier des révisions.
// what = "q" : questions des leçons faites et questions fabriquées avec le vocabulaire ; what = "v" : les vers appris, sous toutes les formes.
function gStartTraining(what) {
  let steps = [];
  if (what === "v") {
    const learned = NAZM.filter(v => gCard(v.id)), kinds = gWrite() ? ["trou", "ecrit", "ajuz", "suite", "trou", "ecrit"] : ["trou", "ajuz", "suite", "trou"];
    steps = Array.from({ length: learned.length ? 10 : 0 }, (x, k) => ({ t: "q", q: gVerseQuestion(gMix(learned)[0], kinds[k % kinds.length]) }));
  } else {
    const written = gMix(gLessons().filter(gDone).flatMap(gQuestions)).slice(0, 4).map(q => ({ t: "q", q: gBuildQuestion(q) }));
    steps = gMix([...written, ...Array.from({ length: 10 - written.length }, () => ({ t: "q", q: gGenerated() }))]);
  }
  if (steps.length) gs = gSession("train", what === "v" ? "Entraînement sur le {{nazm}}" : "Entraînement de grammaire", steps, { what });
}
// La réponse donnée est-elle la bonne ? (choix touché, ou mot écrit comparé sans les voyelles)
// Avec l'option « voyelles », le mot doit être juste lettres et voyelles comprises.
const gIsRight = q => (q.type !== "ecrit" ? gs.picked === q.bon : gHarakat() ? gVocal(gs.typed) === gVocal(q.answer) : gNorm(gs.typed) === gNorm(q.answer));
// Réponse vérifiée : la carte de la question est créée ou replanifiée, comme pour un mot. L'entraînement libre ne planifie rien.
function gCheck() {
  const st = gs.steps[gs.i], ok = gIsRight(st.q), t = today(), card = gCard(st.q.id);
  gs.checked = true; gs.ok = ok; gs.asked++; if (ok) gs.right++;
  if (gs.kind !== "train") {
    if (!card) S.cards[st.q.id] = schedule(undefined, ok ? 3 : 1, t);
    else if (card.due <= t || !ok) S.cards[st.q.id] = schedule(card, ok ? 3 : 1, t);
  }
  dayRec(t).answers++;
  saveState(); sfx(ok ? "ok" : "ko");
}
function gNext() {
  gs.i++; gs.picked = null; gs.typed = ""; gs.checked = false;
  if (gs.i >= gs.steps.length) {
    gs.over = true;
    if (gs.kind === "lesson") { S.connus = S.connus || {}; gTermsOf(gs.lesson).forEach(id => { S.connus[id] = true; }); saveState(); }
    if (gs.asked > 0) { dayRec(today()).done = true; saveState(); }   // la séance compte pour la série de jours
    if (typeof noter === "function") noter("seance_fin", "grammaire:" + gs.asked);
    sfx("done");
  }
}

// --- Affichage d'une séance (prend tout l'écran de l'onglet Grammaire). Renvoie vrai si elle a tout dessiné.
function gramRender(r) {
  if (!gs || r !== "grammaire") return false;
  gSeen = {};
  const pct = gs.over ? 100 : 100 * gs.i / gs.steps.length;
  $top.innerHTML = gs.over ? "" : `<div class="sess-head"><button class="icon" data-act="g-quit" aria-label="Quitter la leçon">✕</button>
    <button class="icon" data-act="g-back" aria-label="Écran précédent" ${gs.i > 0 && !gs.checked && gs.steps[gs.i - 1].t !== "q" ? "" : "disabled"}>‹</button>
    <button class="icon ${S.crayonVu ? "" : "pulse"}" data-act="t-open" aria-label="Ouvrir le tableau pour écrire">✎</button>
    <div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>`;
  if (gs.over) {
    $view.innerHTML = `<p class="ask"><small>${gText(gs.title, true)}</small>${gs.kind === "lesson" ? "Leçon terminée" : gs.kind === "train" ? "Entraînement terminé" : "Révision terminée"}</p>
      <div class="tiles"><div><b>${gs.right} / ${gs.asked}</b>bonnes réponses</div><div><b>${streak()}</b>${streak() > 1 ? "jours de suite" : "jour de suite"}</div></div>
      <p class="muted">${gs.kind === "lesson" ? "Les questions de cette leçon reviendront dans la révision de grammaire, espacées comme les mots." : gs.kind === "train" ? "L'entraînement libre ne change pas le calendrier des révisions." : "Les prochaines révisions sont planifiées."}</p>`;
    $foot.innerHTML = `<div class="act">${gs.kind === "train" ? `<button class="btn" data-act="g-train" data-w="${gs.what}">Encore dix questions</button>` : ""}<button class="btn ${gs.kind === "train" ? "ghost" : ""}" data-act="g-quit">${gs.kind === "train" ? "Terminer" : "Continuer"}</button></div>`;
    return true;
  }
  const st = gs.steps[gs.i];
  if (st.t === "page") {
    $view.innerHTML = `<article class="gpage"><p class="ask"><small>${gText(st.lesson.titre, true)}</small>${gText(st.page.titre)}</p>${st.page.blocs.map(gBlock).join("")}</article>`;
    $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-next">Continuer</button></div>`;
  } else if (st.t === "verses") {
    $view.innerHTML = `<article class="gpage"><p class="ask"><small>${gText("Le {{nazm}}", true)}</small>${gText(st.verses.length > 1 ? "Les {{bayt:pl}} de cette leçon" : "Le {{bayt}} de cette leçon")}</p>
      <p class="muted">${gText("Lisez à voix haute plusieurs fois, le {{sadr}} puis le {{ajuz}}. Ces lignes résument ce que vous venez de voir et reviendront en révision.")}</p>
      ${st.verses.map(v => `<div class="gverse">${gVerseHtml(v)}<p>${esc(v.fr)}</p></div>`).join("")}
      ${gSourceBtn(st.verses[0].bab, "Voir ces lignes dans l'édition")}</article>`;
    $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-next">Continuer</button></div>`;
  } else {
    const q = st.q;
    const opts = q.opts.map((o, k) => {
      let cls = "opt" + (o.ar ? " ar gopt" : "");
      if (gs.checked && k === q.bon) cls += " right"; else if (gs.checked && k === gs.picked) cls += " wrong"; else if (!gs.checked && k === gs.picked) cls += " sel";
      return `<button class="${cls}"${o.ar ? ' lang="ar" dir="rtl"' : ""} data-act="g-pick" data-k="${k}" ${gs.checked ? "disabled" : ""}>${o.html}</button>`;
    }).join("");
    const prompt = gs.checked && q.solved ? q.solved : q.prompt;     // une fois corrigé, le vers s'affiche complet
    const body = q.type === "ecrit"
      ? `<div class="gfield ar ${gs.checked ? (gs.ok ? "right" : "wrong") : ""}" lang="ar" dir="rtl" aria-live="polite" aria-label="Votre réponse">${esc(gs.typed) || `<span class="muted">…</span>`}</div>${gs.checked ? "" : gKeyboard()}`
      : `<div class="opts">${opts}</div>`;
    $view.innerHTML = `<p class="ask"><small>${gText(gs.title, true)}</small>${gText(q.ask)}</p>${prompt ? `<div class="prompt gprompt">${prompt}</div>` : ""}${body}`;
    if (gs.checked) {
      // Mot écrit et faux : on dit si seules les voyelles sont en cause, et on montre le mot attendu
      const ok = gs.ok, why = q.type === "ecrit" && !ok ? (gNorm(gs.typed) === gNorm(q.answer) ? "Les lettres sont justes, ce sont les voyelles à revoir : " : "Il fallait écrire ") + `[[${q.answer}]].` : q.why;
      // Le verdict est porté par un signe et un texte, pas seulement par la couleur ; l'explication suit toujours
      $foot.innerHTML = `<div class="act ${ok ? "ok" : "ko"}"><div class="verdict" role="status"><b>${ok ? "✓ Bien joué" : "✗ Ce n'est pas ça"}</b>${why ? `<span>${gText(why)}</span>` : ""}</div>
        <button class="btn ${ok ? "good" : "bad"}" data-act="g-next">Continuer</button></div>`;
    } else $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-check" ${(q.type === "ecrit" ? gs.typed === "" : gs.picked === null) ? "disabled" : ""}>Vérifier</button></div>`;
  }
  $view.innerHTML += gTermSheet() + gSourceView();
  return true;
}
// Clavier arabe de l'application, pour qui n'a pas de clavier arabe sur son appareil.
// Deux dispositions au choix (S.clavier) :
//  - « classique » : celle des claviers arabes de téléphone et d'ordinateur (ض en haut à gauche), pour s'y habituer ;
//  - « alpha » : les lettres dans l'ordre de l'alphabet, de droite à gauche.
// Avec l'option « voyelles » (S.harakat), une rangée de harakat s'ajoute.
const G_KEYS = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"];   // les 28 lettres
const G_ROWS = { classique: [["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"], ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"], ["ذ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "د"], ["أ", "إ", "آ", "ئ"]],
  alpha: [["ا", "ب", "ت", "ث", "ج", "ح", "خ"], ["د", "ذ", "ر", "ز", "س", "ش", "ص"], ["ض", "ط", "ظ", "ع", "غ", "ف", "ق"], ["ك", "ل", "م", "ن", "ه", "و", "ي"], ["ء", "أ", "إ", "آ", "ؤ", "ئ", "ة", "ى"]] };
const G_HARAKAT = [["\u064E", "fatha"], ["\u064F", "damma"], ["\u0650", "kasra"], ["\u0652", "sukun"], ["\u0651", "shadda"], ["\u064B", "deux fatha"], ["\u064C", "deux damma"], ["\u064D", "deux kasra"]];
function gKeyboard() {
  const lay = gLayout(), key = k => `<button class="gkey ar" lang="ar" data-act="g-key" data-k="${k}">${k}</button>`;
  const del = `<button class="gkey wide" data-act="g-key-del" aria-label="Effacer le dernier signe">⌫</button>`;
  const rows = G_ROWS[lay].map((r, n) => `<div class="gkrow" dir="${lay === "alpha" ? "rtl" : "ltr"}">${r.map(key).join("")}${n === G_ROWS[lay].length - 1 ? del : ""}</div>`).join("");
  // Une voyelle se pose sur la lettre qu'on vient d'écrire ; le petit rond montre où elle se place
  const marks = gHarakat() ? `<div class="gkrow" dir="rtl">${G_HARAKAT.map(([m, nom]) => `<button class="gkey ar" lang="ar" data-act="g-key" data-k="${m}" aria-label="${nom}">◌${m}</button>`).join("")}</div>` : "";
  return `<div class="gkb ${lay}" role="group" aria-label="Clavier arabe">${rows}${marks}</div>
    <p class="muted gkb-note">${gHarakat() ? "Écrivez chaque lettre, puis sa voyelle." : "Inutile d'écrire les voyelles."}</p>`;
}
// Un clavier arabe branché à l'ordinateur fonctionne aussi
if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("keydown", e => {
  const q = gs && !gs.over && !gs.checked && gs.steps[gs.i] && gs.steps[gs.i].q;
  if (!q || q.type !== "ecrit" || route() !== "grammaire") return;
  if (e.key === "Backspace") { gs.typed = [...gs.typed].slice(0, -1).join(""); render(); e.preventDefault(); }
  else if (e.key === "Enter" && gs.typed) { gCheck(); render(); }
  else if (/^[\u0621-\u0652]$/.test(e.key)) { gs.typed += e.key; render(); }
});
// Un bloc d'explication : paragraphe, citation du texte de référence, exemples, ou règle à retenir
function gBlock(b) {
  if (b.p) return `<p>${gText(b.p)}</p>`;
  if (b.matn) return `<blockquote class="matn"><span class="ar" lang="ar" dir="rtl">${esc(b.matn)}</span><p>${gText(b.fr)}</p><cite>${esc(b.source || "Ibn Ājurrūm, al-Ājurrūmiyya")}</cite></blockquote>`;
  if (b.ex) return `<div class="gex">${b.ex.map(([ar, fr, note]) => `<div><span class="ar" lang="ar" dir="rtl">${esc(ar)}</span><span>${gText(fr)}${note ? `<small>${gText(note)}</small>` : ""}</span></div>`).join("")}</div>`;
  if (b.regle) return `<p class="regle">${gText(b.regle)}</p>`;
  return "";
}

// --- Onglet Grammaire : où j'en suis, les chapitres et leurs leçons, le poème, les sources
function viewGrammar() {
  gSeen = {};
  const lessons = gLessons(), done = lessons.filter(gDone).length, due = gramDueQ().length, dueV = gramDueV().length;
  const next = lessons.find(l => !gDone(l));
  const learned = NAZM.filter(v => gCard(v.id)).length;
  const chapters = GRAMMAIRE.slice().sort((a, b) => a.n - b.n).map(c => `<section class="panel"><h3>${gText("{{bab}}", true)} ${c.n} · ${gText(c.titre, true)}</h3>
      <div class="row between"><span class="muted">${esc(c.conseil || "")}</span><span class="ar gbabname" lang="ar" dir="rtl">${esc(c.ar)}</span></div>
      ${c.lecons.map(l => { const qs = gQuestions(l), ok = qs.filter(q => gIsKnown(q.id)).length, d = gDone(l);
        return `<button class="glesson ${d ? "done" : ""}" data-act="g-lesson" data-id="${l.id}"><span><b>${gText(l.titre, true)}</b><small>${gText(l.resume, true)}</small></span>
          <span class="pill ${d ? "known" : next && next.id === l.id ? "learn" : ""}">${d ? ok + " / " + qs.length + " acquis" : next && next.id === l.id ? "à faire" : "à venir"}</span></button>`; }).join("")}
      ${c.lecons.every(gDone) ? "" : String(gKnown) === String(c.n)
        ? `<div class="row center"><button class="btn small" data-act="g-known-yes" data-n="${c.n}">Oui, tout passer en révision</button><button class="btn small ghost" data-act="g-known-no">Annuler</button></div>`
        : `<button class="linkbtn" data-act="g-known" data-n="${c.n}">${gText("Je connais déjà ce {{bab}}", true)}</button>`}
      ${c.relu ? "" : `<p class="muted">Contenu à relire par un enseignant.</p>`}</section>`).join("");
  const showPoem = gOpen.poem === true;
  const poem = `<section class="panel"><button class="lhead" data-act="g-fold" data-k="poem" aria-expanded="${showPoem}"><span>${gText("Le {{nazm}}", true)} · ${learned} / ${NAZM.length} ${gText("{{bayt:pl}}", true)} appris</span><span class="muted">${showPoem ? "▾" : "▸"}</span></button>
      <p class="muted">Nazm al-Ājurrūmiyya, de ’Ubayd Rabbih Muhammad b. Ābbah ash-Shinqiti : la grammaire d'Ibn Ājurrūm mise en vers pour être retenue. Les vers s'apprennent au fil des leçons.</p>
      <div class="seg"><button data-act="g-nazm" data-on="1" aria-pressed="${gNazmOn()}">Je l'apprends</button><button data-act="g-nazm" data-on="0" aria-pressed="${!gNazmOn()}">Sans le ${gText("{{nazm}}", true)}</button></div>
      ${gNazmOn() && dueV ? `<button class="btn gold" data-act="g-review" data-w="v">${gText("Réviser le {{nazm}}", true)} · ${plural(dueV, "ligne")}</button>` : ""}
      ${gNazmOn() && learned ? `<button class="btn ghost" data-act="g-train" data-w="v">${gText("S'entraîner sur le {{nazm}}", true)}</button>
        <p class="muted">Réponses à écrire</p>
        <div class="seg"><button data-act="g-write" data-m="non" aria-pressed="${!gWrite()}">Choix seulement</button><button data-act="g-write" data-m="lettres" aria-pressed="${gWrite() && !gHarakat()}">Sans voyelles</button><button data-act="g-write" data-m="voyelles" aria-pressed="${gWrite() && gHarakat()}">Avec voyelles</button></div>
        <p class="muted">Clavier</p>
        <div class="seg"><button data-act="g-layout" data-m="classique" aria-pressed="${gLayout() === "classique"}">Clavier arabe classique</button><button data-act="g-layout" data-m="alpha" aria-pressed="${gLayout() === "alpha"}">Ordre de l'alphabet</button></div>` : ""}
      ${showPoem ? NAZM.map((v, k) => `${k === 0 || NAZM[k - 1].bab !== v.bab ? `<p class="gbab">${AR(v.babAr)}${gSourceBtn(v.bab, "dans l'édition")}</p>` : ""}<div class="gverse ${gCard(v.id) ? "" : "todo"}">${gVerseHtml(v)}<p>${esc(v.fr)}</p></div>`).join("") : ""}</section>`;
  const showSrc = gOpen.src === true;
  const sources = `<section class="panel"><button class="lhead" data-act="g-fold" data-k="src" aria-expanded="${showSrc}"><span>Sources</span><span class="muted">${showSrc ? "▾" : "▸"}</span></button>
      ${showSrc ? `<p>Le plan et les définitions suivent <b>al-Ājurrūmiyya</b> d'Ibn Ājurrūm (m. 723 H), cité en arabe dans chaque leçon. Les vers sont ceux du <b>nazm</b> de ’Ubayd Rabbih ash-Shinqiti, recopiés de l'édition établie sur manuscrits par ’Abdallah al-Hakami (1427 H). Les explications en français sont rédigées pour Mufrad à partir des commentaires classiques du texte ; les exemples viennent du vocabulaire des unités.</p>
        ${SOURCES.map(x => `<button class="glesson" data-act="g-src" data-id="${x.id}" data-p="${x.debut}"><span><b>${esc(x.titre)} ${AR(x.ar)}</b><small>${esc(x.auteur)} — ${esc(x.edition)}</small></span><span class="pill learn">ouvrir</span></button>`).join("")}` : ""}</section>`;
  // Glossaire : les termes arabes, leur définition, et le réglage de leur traduction
  const showGlo = gOpen.glo === true, mode = gTermMode();
  const terms = grp => GLOSSAIRE.filter(t => t.groupe === grp).map(t => `<div class="gterm"><span class="ar" lang="ar" dir="rtl">${t.ar}</span><span><b>${esc(t.fr)}</b><small>${gText(t.def, true)}</small></span></div>`).join("");
  const glossary = `<section class="panel"><button class="lhead" data-act="g-fold" data-k="glo" aria-expanded="${showGlo}"><span>Glossaire · ${GLOSSAIRE.length} termes</span><span class="muted">${showGlo ? "▾" : "▸"}</span></button>
      <p class="muted">Les termes de grammaire sont donnés en arabe. Chacun est traduit à sa première rencontre, puis reste seul : un appui dessus rouvre sa définition.</p>
      <div class="seg"><button data-act="g-mode" data-m="auto" aria-pressed="${mode === "auto"}">Progressif</button><button data-act="g-mode" data-m="fr" aria-pressed="${mode === "fr"}">Toujours traduit</button><button data-act="g-mode" data-m="ar" aria-pressed="${mode === "ar"}">Arabe seul</button></div>
      ${showGlo ? `<p class="muted">Les mots des livres et des poèmes</p>${terms("texte")}<p class="muted">Les mots de la grammaire</p>${terms("grammaire")}` : ""}</section>`;
  return `<section class="card"><h3>Grammaire</h3>
      <div class="tiles"><div><b>${done} / ${lessons.length}</b>leçons faites</div><div><b>${due + dueV}</b>à revoir</div><div><b>${learned}</b>${gText("{{bayt:pl}}", true)} appris</div></div>
      ${due ? `<button class="btn gold" data-act="g-review" data-w="q">Réviser ${due > 15 ? "15 questions sur " + due : plural(due, "question")}</button>` : ""}
      ${done ? `<button class="btn ghost" data-act="g-train" data-w="q">S'entraîner : dix questions</button>` : ""}
      ${next ? `<button class="btn ${due ? "ghost" : ""}" data-act="g-lesson" data-id="${next.id}">${done ? "Leçon suivante" : "Commencer"} : ${gText(next.titre, true)}</button>` : `<p class="muted">Toutes les leçons disponibles sont faites. La suite arrive.</p>`}</section>
    ${chapters}${poem}${glossary}${sources}${gTermSheet()}${gSourceView()}`;
}

// --- Clics de l'onglet et des séances de grammaire (appelé par l'application pour les actions « g-… »)
function gramClick(act, el) {
  switch (act) {
    case "g-lesson": gStartLesson(el.dataset.id); break;
    case "g-review": gStartReview(el.dataset.w); break;
    case "g-train": gStartTraining(el.dataset.w); break;
    case "g-write": S.ecrire = el.dataset.m !== "non"; S.harakat = el.dataset.m === "voyelles"; saveState(); break;
    case "g-layout": S.clavier = el.dataset.m; saveState(); break;
    case "g-known": gKnown = el.dataset.n; break;
    case "g-known-no": gKnown = null; break;
    case "g-known-yes": gMarkKnown(Number(el.dataset.n)); gKnown = null; sfx("ok"); break;
    case "g-key": if (gs && !gs.checked && [...gs.typed].length < 40) { gs.typed += el.dataset.k; sfx("tap"); } break;
    case "g-key-del": if (gs && !gs.checked) gs.typed = [...gs.typed].slice(0, -1).join(""); break;
    case "g-quit": gs = null; gTerm = null; gSrc = null; break;
    case "g-back": if (gs && gs.i > 0) { gs.i--; gs.picked = null; gs.typed = ""; gs.checked = false; } break;
    case "g-next": gNext(); break;
    case "g-pick": { const k = Number(el.dataset.k); gs.picked = gs.picked === k ? null : k; sfx("tap"); break; }
    case "g-check": if (gs.picked !== null || gs.typed) gCheck(); break;
    case "g-fold": gOpen[el.dataset.k] = !(gOpen[el.dataset.k] === true); break;
    case "g-nazm": S.nazm = el.dataset.on === "1"; saveState(); break;
    case "g-src": gSrc = { id: el.dataset.id, p: Number(el.dataset.p) || 1, zoom: false }; break;
    case "g-src-close": gSrc = null; break;
    case "g-src-zoom": gSrc.zoom = !gSrc.zoom; break;
    case "g-src-go": { const s = SOURCES.find(x => x.id === gSrc.id); gSrc.p = Math.max(1, Math.min(s.pages, gSrc.p + Number(el.dataset.d))); gSrc.zoom = false; break; }
    case "g-term": gTerm = el.dataset.id; break;
    case "g-term-close": gTerm = null; break;
    case "g-mode": S.termes = el.dataset.m; saveState(); break;
  }
  render();
}
