"use strict";
/* Mufrad — grammaire : leçons courtes (explication, vers du poème, questions) et leur révision.
   Chargé avant l'application ; les fichiers du dossier js/grammaire/ y inscrivent le contenu.
   Ce fichier n'utilise les outils de l'application (esc, AR, S, schedule…) qu'à l'intérieur de ses fonctions,
   donc après son chargement. La progression est rangée avec celle des mots, dans S.cards :
   une carte par question (identifiant « g… ») et une carte par vers mémorisé (identifiant « n… »). */

const GRAMMAIRE = [];   // chapitres, inscrits par js/grammaire/chapitre-NN.js
const NAZM = [];        // vers du poème, inscrits par js/grammaire/nazm.js, dans l'ordre du texte

let gs = null;          // séance de grammaire en cours (en mémoire seulement)
let gOpen = {};         // encadrés dépliés à la main dans l'onglet : nom -> true ou false

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

// Texte d'explication : échappé, avec l'arabe entre [[ ]] et les mots importants entre * *
function gText(t) {
  return esc(t).replace(/\[\[(.+?)\]\]/g, (m, a) => `<span class="ar" lang="ar" dir="rtl">${a}</span>`).replace(/\*(.+?)\*/g, "<b>$1</b>");
}
function gMix(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// --- Préparation des questions : tout devient { id, ask, prompt, opts: [{ html, ar }], bon, why }
function gBuildQuestion(q) {
  if (q.nature) {                                   // « de quelle sorte est ce mot ? » : trois choix fixes
    const it = BY_ID[q.mot];
    return { id: q.id, ask: "De quelle sorte est ce mot ?", prompt: AR(it ? it.ar : q.ar) + `<span class="tr">${esc(it ? it.fr : q.fr || "")}</span>`,
      opts: NATURES.map(([k, ar, fr]) => ({ html: `${AR(ar)} · ${fr}` })), bon: NATURES.findIndex(n => n[0] === q.nature), why: q.pourquoi };
  }
  const order = gMix(q.choix.map((c, k) => k));     // les choix sont mélangés à chaque passage
  const it = q.mot ? BY_ID[q.mot] : null;
  const prompt = it ? AR(it.ar) + `<span class="tr">${esc(it.fr)}</span>` : q.ar ? AR(q.ar) + (q.fr ? `<span class="tr">${esc(q.fr)}</span>` : "") : "";
  return { id: q.id, ask: q.q, prompt, opts: order.map(k => ({ html: q.arChoix ? esc(q.choix[k]) : gText(q.choix[k]), ar: Boolean(q.arChoix) })), bon: order.indexOf(q.bon), why: q.pourquoi };
}
// Questions de mémorisation, fabriquées à partir du texte : second hémistiche, ou vers suivant
function gVerseQuestion(v, kind) {
  const k = NAZM.indexOf(v), next = NAZM[k + 1];
  const others = gMix(NAZM.filter(o => o.id !== v.id && (!next || o.id !== next.id)));
  const near = others.filter(o => o.bab === v.bab), pool = [...near, ...others.filter(o => o.bab !== v.bab)].slice(0, 2);
  if (kind === "suite" && next) {
    const opts = gMix([next, ...pool]);
    return { id: v.id, verse: true, ask: "Quel vers vient juste après ?", prompt: gVerseHtml(v), opts: opts.map(o => ({ html: esc(o.a), ar: true })), bon: opts.indexOf(next), why: "" };
  }
  const opts = gMix([v, ...pool]);
  return { id: v.id, verse: true, ask: "Quel est le second hémistiche ?", prompt: `<div class="verse"><span class="ar" lang="ar" dir="rtl">${esc(v.a)}</span><span class="ar hole" lang="ar" dir="rtl">…</span></div>`,
    opts: opts.map(o => ({ html: esc(o.b), ar: true })), bon: opts.indexOf(v), why: "" };
}
const gVerseHtml = v => `<div class="verse"><span class="ar" lang="ar" dir="rtl">${esc(v.a)}</span><span class="ar" lang="ar" dir="rtl">${esc(v.b)}</span></div>`;

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
    if (gs.asked > 0) { dayRec(today()).done = true; saveState(); }   // la séance compte pour la série de jours
    if (typeof noter === "function") noter("seance_fin", "grammaire:" + gs.asked);
    sfx("done");
  }
}

// --- Affichage d'une séance (prend tout l'écran de l'onglet Grammaire). Renvoie vrai si elle a tout dessiné.
function gramRender(r) {
  if (!gs || r !== "grammaire") return false;
  const pct = gs.over ? 100 : 100 * gs.i / gs.steps.length;
  $top.innerHTML = gs.over ? "" : `<div class="sess-head"><button class="icon" data-act="g-quit" aria-label="Quitter la leçon">✕</button>
    <button class="icon" data-act="g-back" aria-label="Écran précédent" ${gs.i > 0 && !gs.checked && gs.steps[gs.i - 1].t !== "q" ? "" : "disabled"}>‹</button>
    <div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>`;
  if (gs.over) {
    $view.innerHTML = `<p class="ask"><small>${esc(gs.title)}</small>${gs.kind === "lesson" ? "Leçon terminée" : "Révision terminée"}</p>
      <div class="tiles"><div><b>${gs.right} / ${gs.asked}</b>bonnes réponses</div><div><b>${streak()}</b>${streak() > 1 ? "jours de suite" : "jour de suite"}</div></div>
      <p class="muted">${gs.kind === "lesson" ? "Les questions de cette leçon reviendront dans la révision de grammaire, espacées comme les mots." : "Les prochaines révisions sont planifiées."}</p>`;
    $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-quit">Continuer</button></div>`;
    return true;
  }
  const st = gs.steps[gs.i];
  if (st.t === "page") {
    $view.innerHTML = `<article class="gpage"><p class="ask"><small>${esc(st.lesson.chap.titre)} · ${esc(st.lesson.titre)}</small>${esc(st.page.titre)}</p>${st.page.blocs.map(gBlock).join("")}</article>`;
    $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-next">Continuer</button></div>`;
  } else if (st.t === "verses") {
    $view.innerHTML = `<article class="gpage"><p class="ask"><small>Le poème</small>${st.verses.length > 1 ? "Les vers de cette leçon" : "Le vers de cette leçon"}</p>
      <p class="muted">Lisez-les à voix haute plusieurs fois. Ils résument ce que vous venez de voir et reviendront en révision.</p>
      ${st.verses.map(v => `<div class="gverse">${gVerseHtml(v)}<p>${esc(v.fr)}</p></div>`).join("")}</article>`;
    $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-next">Continuer</button></div>`;
  } else {
    const q = st.q;
    const opts = q.opts.map((o, k) => {
      let cls = "opt" + (o.ar ? " ar gopt" : "");
      if (gs.checked && k === q.bon) cls += " right"; else if (gs.checked && k === gs.picked) cls += " wrong"; else if (!gs.checked && k === gs.picked) cls += " sel";
      return `<button class="${cls}"${o.ar ? ' lang="ar" dir="rtl"' : ""} data-act="g-pick" data-k="${k}" ${gs.checked ? "disabled" : ""}>${o.html}</button>`;
    }).join("");
    $view.innerHTML = `<p class="ask"><small>${esc(gs.title)}</small>${esc(q.ask)}</p>${q.prompt ? `<div class="prompt gprompt">${q.prompt}</div>` : ""}<div class="opts">${opts}</div>`;
    if (gs.checked) {
      const ok = gs.picked === q.bon;
      // Le verdict est porté par un signe et un texte, pas seulement par la couleur ; l'explication suit toujours
      $foot.innerHTML = `<div class="act ${ok ? "ok" : "ko"}"><div class="verdict" role="status"><b>${ok ? "✓ Bien joué" : "✗ Ce n'est pas ça"}</b>${q.why ? `<span>${gText(q.why)}</span>` : ""}</div>
        <button class="btn ${ok ? "good" : "bad"}" data-act="g-next">Continuer</button></div>`;
    } else $foot.innerHTML = `<div class="act"><button class="btn" data-act="g-check" ${gs.picked === null ? "disabled" : ""}>Vérifier</button></div>`;
  }
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
  const lessons = gLessons(), done = lessons.filter(gDone).length, due = gramDue().length;
  const next = lessons.find(l => !gDone(l));
  const learned = NAZM.filter(v => gCard(v.id)).length;
  const chapters = GRAMMAIRE.slice().sort((a, b) => a.n - b.n).map(c => `<section class="panel"><h3>Chapitre ${c.n} · ${esc(c.titre)}</h3>
      <div class="row between"><span class="muted">${esc(c.conseil || "")}</span>${AR(c.ar)}</div>
      ${c.lecons.map(l => { const qs = gQuestions(l), ok = qs.filter(q => gIsKnown(q.id)).length, d = gDone(l);
        return `<button class="glesson ${d ? "done" : ""}" data-act="g-lesson" data-id="${l.id}"><span><b>${esc(l.titre)}</b><small>${esc(l.resume)}</small></span>
          <span class="pill ${d ? "known" : next && next.id === l.id ? "learn" : ""}">${d ? ok + " / " + qs.length + " acquis" : next && next.id === l.id ? "à faire" : "à venir"}</span></button>`; }).join("")}
      ${c.relu ? "" : `<p class="muted">Contenu à relire par un enseignant.</p>`}</section>`).join("");
  const showPoem = gOpen.poem === true;
  const poem = `<section class="panel"><button class="lhead" data-act="g-fold" data-k="poem" aria-expanded="${showPoem}"><span>Le poème · ${learned} / ${NAZM.length} vers appris</span><span class="muted">${showPoem ? "▾" : "▸"}</span></button>
      <p class="muted">Naẓm al-Ājurrūmiyya, de Muḥammad b. Ābb al-Qalāwī ash-Shinqīṭī : la grammaire d'Ibn Ājurrūm mise en vers pour être retenue. Les vers s'apprennent au fil des leçons.</p>
      <div class="seg"><button data-act="g-nazm" data-on="1" aria-pressed="${gNazmOn()}">Je l'apprends</button><button data-act="g-nazm" data-on="0" aria-pressed="${!gNazmOn()}">Sans le poème</button></div>
      ${showPoem ? NAZM.map((v, k) => `${k === 0 || NAZM[k - 1].bab !== v.bab ? `<p class="gbab">${AR(v.babAr)}</p>` : ""}<div class="gverse ${gCard(v.id) ? "" : "todo"}">${gVerseHtml(v)}<p>${esc(v.fr)}</p></div>`).join("") : ""}</section>`;
  const showSrc = gOpen.src === true;
  const sources = `<section class="panel"><button class="lhead" data-act="g-fold" data-k="src" aria-expanded="${showSrc}"><span>Sources</span><span class="muted">${showSrc ? "▾" : "▸"}</span></button>
      ${showSrc ? `<p>Le plan et les définitions suivent <b>al-Ājurrūmiyya</b> d'Ibn Ājurrūm (m. 723 H), cité en arabe dans chaque leçon. Les vers sont ceux du <b>naẓm</b> de Muḥammad b. Ābb ash-Shinqīṭī. Les explications en français sont rédigées pour Mufrad à partir des commentaires classiques du texte ; les exemples viennent du vocabulaire des unités.</p>` : ""}</section>`;
  return `<section class="card"><h3>Grammaire</h3>
      <div class="tiles"><div><b>${done} / ${lessons.length}</b>leçons faites</div><div><b>${due}</b>à revoir</div><div><b>${learned}</b>vers appris</div></div>
      ${due ? `<button class="btn gold" data-act="g-review">Réviser ${due > 15 ? "15 cartes sur " + due : plural(due, "carte")}</button>` : ""}
      ${next ? `<button class="btn ${due ? "ghost" : ""}" data-act="g-lesson" data-id="${next.id}">${done ? "Leçon suivante" : "Commencer"} : ${esc(next.titre)}</button>` : `<p class="muted">Toutes les leçons disponibles sont faites. La suite arrive.</p>`}</section>
    ${chapters}${poem}${sources}`;
}

// --- Clics de l'onglet et des séances de grammaire (appelé par l'application pour les actions « g-… »)
function gramClick(act, el) {
  switch (act) {
    case "g-lesson": gStartLesson(el.dataset.id); break;
    case "g-review": gStartReview(); break;
    case "g-quit": gs = null; break;
    case "g-back": if (gs && gs.i > 0) { gs.i--; gs.picked = null; gs.checked = false; } break;
    case "g-next": gNext(); break;
    case "g-pick": { const k = Number(el.dataset.k); gs.picked = gs.picked === k ? null : k; sfx("tap"); break; }
    case "g-check": if (gs.picked !== null) gCheck(); break;
    case "g-fold": gOpen[el.dataset.k] = !(gOpen[el.dataset.k] === true); break;
    case "g-nazm": S.nazm = el.dataset.on === "1"; saveState(); break;
  }
  render();
}
