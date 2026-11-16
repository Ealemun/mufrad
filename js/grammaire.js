"use strict";
/* Mufrad — grammaire : leçons courtes (explication, vers du poème, questions) et leur révision.
   Chargé avant l'application ; les fichiers du dossier js/grammaire/ y inscrivent le contenu.
   Ce fichier n'utilise les outils de l'application (esc, AR, S, schedule…) qu'à l'intérieur de ses fonctions,
   donc après son chargement. La progression est rangée avec celle des mots, dans S.cards :
   une carte par question (identifiant « g… ») et une carte par vers mémorisé (identifiant « n… »). */

const GRAMMAIRE = [];   // chapitres, inscrits par js/grammaire/chapitre-NN.js
const NAZM = [];        // vers du poème, inscrits par js/grammaire/nazm.js, dans l'ordre du texte
const GLOSSAIRE = [];   // termes arabes de la rubrique, inscrits par js/grammaire/glossaire.js
const SOURCES = [];     // éditions de référence consultables dans l'application, inscrites par js/grammaire/sources.js

let gs = null;          // séance de grammaire en cours (en mémoire seulement)
let gOpen = {};         // encadrés dépliés à la main dans l'onglet : nom -> true ou false
let gTerm = null;       // terme dont la définition est ouverte
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
// Tout ce qui est à revoir aujourd'hui : questions de grammaire, et vers si le poème est suivi
function gramDue() {
  const qs = gLessons().flatMap(l => gQuestions(l).map(q => q.id)).filter(gIsDue);
  const vs = gNazmOn() ? NAZM.map(v => v.id).filter(gIsDue) : [];
  return [...qs, ...vs];
}

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
// Questions de mémorisation, fabriquées à partir du texte : second hémistiche, ou vers suivant
function gVerseQuestion(v, kind) {
  const k = NAZM.indexOf(v), next = NAZM[k + 1];
  const others = gMix(NAZM.filter(o => o.id !== v.id && (!next || o.id !== next.id)));
  const near = others.filter(o => o.bab === v.bab), pool = [...near, ...others.filter(o => o.bab !== v.bab)].slice(0, 2);
  if (kind === "suite" && next) {
    const opts = gMix([next, ...pool]);
    return { id: v.id, verse: true, ask: "Quel {{bayt}} vient juste après ?", prompt: gVerseHtml(v), opts: opts.map(o => ({ html: esc(o.a), ar: true })), bon: opts.indexOf(next), why: "" };
  }
  const opts = gMix([v, ...pool]);
  return { id: v.id, verse: true, ask: "Quel est le {{ajuz}} de ce {{bayt}} ?", prompt: `<div class="verse"><span class="ar" lang="ar" dir="rtl">${esc(v.a)}</span><span class="ar hole" lang="ar" dir="rtl">…</span></div>`,
    opts: opts.map(o => ({ html: esc(o.b), ar: true })), bon: opts.indexOf(v), why: "" };
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

// --- Séances
function gStartLesson(id) {
  const l = gLessons().find(x => x.id === id); if (!l) return;
  const verses = gNazmOn() ? (l.vers || []).map(gVerse).filter(Boolean) : [];
  const steps = [
    ...l.pages.map(p => ({ t: "page", page: p, lesson: l })),
    ...(verses.length ? [{ t: "verses", verses, lesson: l }] : []),
    ...gQuestions(l).map(q => ({ t: "q", q: gBuildQuestion(q) })),
    ...verses.map(v => ({ t: "q", q: gVerseQuestion(v, "hemi") }))
  ];
  gs = { kind: "lesson", title: l.titre, lesson: l, steps, i: 0, picked: null, checked: false, right: 0, asked: 0, over: false };
}
function gStartReview() {
  const due = gramDue().slice(0, 15), byId = {};
  gLessons().forEach(l => gQuestions(l).forEach(q => { byId[q.id] = q; }));
  const steps = gMix(due).map(id => byId[id] ? { t: "q", q: gBuildQuestion(byId[id]) }
    : { t: "q", q: gVerseQuestion(gVerse(id), (gCard(id).reps || 0) % 2 ? "suite" : "hemi") });
  if (steps.length) gs = { kind: "review", title: "Révision de grammaire", steps, i: 0, picked: null, checked: false, right: 0, asked: 0, over: false };
}
// Réponse vérifiée : la carte de la question est créée ou replanifiée, comme pour un mot
function gCheck() {
  const st = gs.steps[gs.i], ok = gs.picked === st.q.bon, t = today(), card = gCard(st.q.id);
  gs.checked = true; gs.asked++; if (ok) gs.right++;
  if (!card) S.cards[st.q.id] = schedule(undefined, ok ? 3 : 1, t);
  else if (card.due <= t || !ok) S.cards[st.q.id] = schedule(card, ok ? 3 : 1, t);
  dayRec(t).answers++;
  saveState(); sfx(ok ? "ok" : "ko");
}
function gNext() {
  gs.i++; gs.picked = null; gs.checked = false;
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
    <div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>`;
  if (gs.over) {
    $view.innerHTML = `<p class="ask"><small>${gText(gs.title, true)}</small>${gs.kind === "lesson" ? "Leçon terminée" : "Révision terminée"}</p>
      <div class="tiles"><div><b>${gs.right} / ${gs.asked}</b>bonnes réponses</div><div><b>${streak()}</b>${streak() > 1 ? "jours de suite" : "jour de suite"}</div></div>
      <p class="muted">${gs.kind === "lesson" ? "Les questions de cette leçon reviendront dans la révision de grammaire, espacées comme les mots." : "Les prochaines révisions sont planifiées."}</p>`;
    $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-quit">Continuer</button></div>`;
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
    $view.innerHTML = `<p class="ask"><small>${gText(gs.title, true)}</small>${gText(q.ask)}</p>${q.prompt ? `<div class="prompt gprompt">${q.prompt}</div>` : ""}<div class="opts">${opts}</div>`;
    if (gs.checked) {
      const ok = gs.picked === q.bon;
      // Le verdict est porté par un signe et un texte, pas seulement par la couleur ; l'explication suit toujours
      $foot.innerHTML = `<div class="act ${ok ? "ok" : "ko"}"><div class="verdict" role="status"><b>${ok ? "✓ Bien joué" : "✗ Ce n'est pas ça"}</b>${q.why ? `<span>${gText(q.why)}</span>` : ""}</div>
        <button class="btn ${ok ? "good" : "bad"}" data-act="g-next">Continuer</button></div>`;
    } else $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-check" ${gs.picked === null ? "disabled" : ""}>Vérifier</button></div>`;
  }
  $view.innerHTML += gTermSheet() + gSourceView();
  return true;
}
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
  const lessons = gLessons(), done = lessons.filter(gDone).length, due = gramDue().length;
  const next = lessons.find(l => !gDone(l));
  const learned = NAZM.filter(v => gCard(v.id)).length;
  const chapters = GRAMMAIRE.slice().sort((a, b) => a.n - b.n).map(c => `<section class="panel"><h3>${gText("{{bab}}", true)} ${c.n} · ${gText(c.titre, true)}</h3>
      <div class="row between"><span class="muted">${esc(c.conseil || "")}</span><span class="ar gbabname" lang="ar" dir="rtl">${esc(c.ar)}</span></div>
      ${c.lecons.map(l => { const qs = gQuestions(l), ok = qs.filter(q => gIsKnown(q.id)).length, d = gDone(l);
        return `<button class="glesson ${d ? "done" : ""}" data-act="g-lesson" data-id="${l.id}"><span><b>${gText(l.titre, true)}</b><small>${gText(l.resume, true)}</small></span>
          <span class="pill ${d ? "known" : next && next.id === l.id ? "learn" : ""}">${d ? ok + " / " + qs.length + " acquis" : next && next.id === l.id ? "à faire" : "à venir"}</span></button>`; }).join("")}
      ${c.relu ? "" : `<p class="muted">Contenu à relire par un enseignant.</p>`}</section>`).join("");
  const showPoem = gOpen.poem === true;
  const poem = `<section class="panel"><button class="lhead" data-act="g-fold" data-k="poem" aria-expanded="${showPoem}"><span>${gText("Le {{nazm}}", true)} · ${learned} / ${NAZM.length} ${gText("{{bayt:pl}}", true)} appris</span><span class="muted">${showPoem ? "▾" : "▸"}</span></button>
      <p class="muted">Nazm al-Ājurrūmiyya, de ’Ubayd Rabbih Muhammad b. Ābbah ash-Shinqiti : la grammaire d'Ibn Ājurrūm mise en vers pour être retenue. Les vers s'apprennent au fil des leçons.</p>
      <div class="seg"><button data-act="g-nazm" data-on="1" aria-pressed="${gNazmOn()}">Je l'apprends</button><button data-act="g-nazm" data-on="0" aria-pressed="${!gNazmOn()}">Sans le ${gText("{{nazm}}", true)}</button></div>
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
      <div class="tiles"><div><b>${done} / ${lessons.length}</b>leçons faites</div><div><b>${due}</b>à revoir</div><div><b>${learned}</b>${gText("{{bayt:pl}}", true)} appris</div></div>
      ${due ? `<button class="btn gold" data-act="g-review">Réviser ${due > 15 ? "15 cartes sur " + due : plural(due, "carte")}</button>` : ""}
      ${next ? `<button class="btn ${due ? "ghost" : ""}" data-act="g-lesson" data-id="${next.id}">${done ? "Leçon suivante" : "Commencer"} : ${gText(next.titre, true)}</button>` : `<p class="muted">Toutes les leçons disponibles sont faites. La suite arrive.</p>`}</section>
    ${chapters}${poem}${glossary}${sources}${gTermSheet()}${gSourceView()}`;
}

// --- Clics de l'onglet et des séances de grammaire (appelé par l'application pour les actions « g-… »)
function gramClick(act, el) {
  switch (act) {
    case "g-lesson": gStartLesson(el.dataset.id); break;
    case "g-review": gStartReview(); break;
    case "g-quit": gs = null; gTerm = null; gSrc = null; break;
    case "g-back": if (gs && gs.i > 0) { gs.i--; gs.picked = null; gs.checked = false; } break;
    case "g-next": gNext(); break;
    case "g-pick": { const k = Number(el.dataset.k); gs.picked = gs.picked === k ? null : k; sfx("tap"); break; }
    case "g-check": if (gs.picked !== null) gCheck(); break;
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
