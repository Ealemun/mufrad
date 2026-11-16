"use strict";
/* Mufrad — tableau d'écriture : écrire une lettre ou un mot au doigt, au stylet ou à la souris, pour mieux le retenir.
   S'ouvre par l'icône ✎ pendant une séance (cours ou exercice). Chargé avant l'application ; il n'utilise ses outils
   (S, sess, gs, BY_ID, sb…) qu'à l'intérieur de ses fonctions.

   Ce que le tableau fait :
   - un modèle en filigrane (le mot dans la police de l'application), qu'on peut masquer ;
   - pour une lettre, le sens d'écriture : des traits numérotés et fléchés, et une animation qui les repasse en gras.
     Les tracés de départ sont dans js/tableau-lettres.js ; un contributeur peut en remplacer un en écrivant lui-même
     la lettre sur le tableau (« modèle de tracé ») ;
   - le tableau n'occupe que le bas de l'écran : la carte ou la question en cours reste visible au-dessus ;
   - chaque tracé est gardé pour entraîner la future reconnaissance d'écriture, que l'on termine ou que l'on ferme,
     sauf si la personne l'a désactivé dans les réglages : les traits (points et instants), et ce qui était à l'écran
     comme étiquette, à confirmer plus tard par un relecteur. Aucun nom ni compte n'y est attaché.

   Un trait = une liste de points [x, y, t] : x et y en millièmes de la largeur du tableau, t en millisecondes depuis le début.
   Le tableau a toujours les mêmes proportions (TB_RATIO), pour que modèle, tracés de référence et écritures se superposent
   de la même façon sur tous les écrans. */

const TB_RATIO = 0.6;                 // hauteur du tableau = largeur × 0,6
const TB_QUEUE = "mufrad-traces-attente";   // tracés pas encore envoyés (hors ligne, ou table pas encore créée)
const TB_REFS_KEY = "mufrad-traces-modeles";
let tbl = null;                        // tableau ouvert : éléments de la page, traits en cours, cible
let tbRefs = null;                    // tracés de référence connus : "identifiant:forme" -> { traits, hauteur }

// --- Ce qu'on écrit : déduit de ce qui est à l'écran au moment où le tableau s'ouvre.
// Renvoie { id, text, contexte, montre (le modèle peut s'afficher sans donner la réponse), lettre (pour les formes) }.
function tbContext() {
  const libre = { id: null, text: "", contexte: "libre", montre: false, lettre: null };
  if (typeof gs !== "undefined" && gs && !gs.over && route() === "grammaire") {
    const st = gs.steps[gs.i], vu = st.t === "q" ? String(st.q.prompt || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    return { ...libre, text: /[؀-ۿ]/.test(vu) ? vu.slice(0, 120) : "", contexte: "grammaire:" + st.t };
  }
  if (sess && !sess.over && route() === "accueil") {
    const { task } = snapshot();
    if (!task || task.kind === "match") return { ...libre, contexte: "exo:paires" };
    const it = BY_ID[task.id]; if (!it) return libre;
    // En exercice, on ne montre le modèle que si l'arabe est déjà à l'écran ; sinon il donnerait la réponse
    const montre = task.kind === "intro" || ["ar2fr", "l2n", "f2l"].includes(task.ex);
    return { id: it.id, text: it.ar, contexte: task.kind === "intro" ? "cours" : "exo:" + task.ex, montre, lettre: it.type === "letter" ? it : null };
  }
  return libre;
}
// Le texte à écrire. Les lettres ne sont proposées que seules pour l'instant (pas encore début, milieu, fin).
const tbTargetText = () => tbl.ctx.text;
const tbRefKey = () => (tbl.ctx.id ? tbl.ctx.id + ":" + tbl.forme : "");

// Arrondit un trait donné par quelques points de passage en une courbe de nombreux points (pour le dessin et l'animation)
function tbSpline(p) {
  if (p.length < 3) return p;
  const q = [p[0], ...p, p[p.length - 1]], out = [];
  for (let i = 1; i < q.length - 2; i++) for (let k = 0; k < 10; k++) {
    const t = k / 10, [a, b, c, d] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
    out.push([0, 1].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t * t * t)));
  }
  out.push(p[p.length - 1]); return out;
}
// Le tracé de référence de ce qui est à l'écran : d'abord celui qu'un contributeur a écrit, sinon celui du fichier des lettres
function tbRef() {
  if (!tbl.ctx.lettre) return null;
  const posed = tbRefs && tbRefs[tbRefKey()];
  if (posed) return posed;
  const base = typeof TB_LETTRES !== "undefined" && TB_LETTRES[tbl.ctx.lettre.ar];
  return base ? { traits: base.map(tbSpline), ratio: TB_RATIO } : null;
}

// --- Ce qu'on garde d'un tracé terminé
function tbRecord(ctx, forme, traits, largeur, appareil, modeleVisible, commeModele) {
  return { element: ctx.id, forme: ctx.lettre ? forme : null, texte: ctx.text || null, contexte: (ESSAI ? "essai:" : "") + ctx.contexte,
    modele_visible: Boolean(modeleVisible), largeur: Math.round(largeur), hauteur: Math.round(largeur * TB_RATIO), appareil: appareil || null,
    traits, modele: Boolean(commeModele) };
}
function tbQueue() { try { return JSON.parse(localStorage.getItem(TB_QUEUE + (ESSAI ? "-" + ESSAI : "")) || "[]"); } catch (e) { return []; } }
function tbSetQueue(q) { try { localStorage.setItem(TB_QUEUE + (ESSAI ? "-" + ESSAI : ""), JSON.stringify(q.slice(-60))); } catch (e) {} }
// Envoie les tracés en attente. Une version d'essai n'envoie rien. En cas d'échec, ils restent pour la prochaine fois.
async function tbFlush() {
  const q = tbQueue();
  if (!q.length || ESSAI || !sb) return false;
  try { const r = await sb.from("traces").insert(q); if (r.error) return false; tbSetQueue([]); return true; } catch (e) { return false; }
}
// Tracés de référence (sens d'écriture) : lus dans la base quand c'est possible, gardés sur l'appareil pour le hors ligne
async function tbLoadRefs() {
  if (tbRefs === null) { try { tbRefs = JSON.parse(localStorage.getItem(TB_REFS_KEY) || "{}"); } catch (e) { tbRefs = {}; } }
  if (!sb) return;
  try {
    const r = await sb.from("traces").select("element,forme,traits,largeur,hauteur,cree_le").eq("modele", true).order("cree_le", { ascending: true });
    if (r.error || !r.data) return;
    const refs = {};
    r.data.forEach(x => { refs[x.element + ":" + (x.forme || "isolee")] = { traits: x.traits, ratio: x.hauteur / x.largeur }; });   // le plus récent l'emporte
    tbRefs = refs; try { localStorage.setItem(TB_REFS_KEY, JSON.stringify(refs)); } catch (e) {}
    if (tbl) tbDrawGuide();
  } catch (e) {}
}

// --- Ouverture : le tableau est posé par-dessus la page et vit sa vie, sans être redessiné par le reste de l'application
function tableauOpen() {
  if (tbl) return;
  const ctx = tbContext(), root = document.createElement("div");
  root.className = "tb"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Tableau d'écriture");
  root.innerHTML = `<div class="tb-bar"><button class="icon" data-tb="close" aria-label="Fermer le tableau">✕</button><b>Tableau</b><span class="tb-target"></span></div>
    <div class="tb-stage"><canvas class="tb-guide"></canvas><canvas class="tb-ink" aria-label="Zone d'écriture"></canvas></div>
    <div class="tb-tools"></div><div class="tb-msg" role="status"></div>
    <div class="tb-foot"><button class="btn small ghost" data-tb="again">Recommencer</button><button class="btn small" data-tb="done">Terminé</button></div>`;
  document.body.appendChild(root);
  tbl = { root, ctx, forme: "isolee", modele: ctx.montre, fleches: true, traits: [], cur: null, t0: 0, appareil: "", anim: 0,
    guide: root.querySelector(".tb-guide"), ink: root.querySelector(".tb-ink") };
  root.addEventListener("click", tbClick);
  tbl.ink.addEventListener("pointerdown", tbDown); tbl.ink.addEventListener("pointermove", tbMove);
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => tbl.ink.addEventListener(ev, tbUp));
  window.addEventListener("resize", tbResize);
  tbResize(); tbChrome(); tbLoadRefs(); tbFlush();
  if (typeof noter === "function") noter("tableau", ctx.contexte);
}
function tableauClose() {
  if (!tbl) return;
  cancelAnimationFrame(tbl.anim); window.removeEventListener("resize", tbResize);
  tbl.root.remove(); tbl = null;
}
// Taille : toute la largeur disponible, proportions fixes ; les deux calques (guide et encre) ont la netteté de l'écran
function tbResize() {
  const stage = tbl.root.querySelector(".tb-stage"), w = Math.min(stage.parentNode.clientWidth - 24, (window.innerHeight * 0.34) / TB_RATIO, 560), h = w * TB_RATIO, d = window.devicePixelRatio || 1;
  stage.style.width = w + "px"; stage.style.height = h + "px";
  [tbl.guide, tbl.ink].forEach(c => { c.width = Math.round(w * d); c.height = Math.round(h * d); c.getContext("2d").setTransform(d, 0, 0, d, 0, 0); });
  tbl.w = w; tbl.h = h;
  tbDrawGuide(); tbDrawInk();
}
const tbColor = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";

// --- Les boutons et textes autour du tableau, refaits à chaque changement d'état
function tbChrome() {
  const c = tbl.ctx, ref = tbRef(), contrib = typeof isContributor === "function" && me && isContributor() && c.lettre;
  // Rappel discret de ce qu'on écrit, seulement quand cela ne donne pas la réponse
  tbl.root.querySelector(".tb-target").innerHTML = c.text && c.montre ? `<span class="ar" lang="ar" dir="rtl">${esc(tbTargetText())}</span>` : "";
  tbl.root.querySelector(".tb-tools").innerHTML = `<button class="mini txt" data-tb="undo" ${tbl.traits.length ? "" : "disabled"}>Annuler le trait</button>
    ${c.text && c.montre ? `<button class="mini txt" data-tb="modele" aria-pressed="${tbl.modele}">${tbl.modele ? "Masquer le modèle" : "Montrer le modèle"}</button>` : ""}
    ${ref && tbl.modele ? `<button class="mini txt" data-tb="play">Voir le tracé</button><button class="mini txt" data-tb="fleches" aria-pressed="${tbl.fleches}">${tbl.fleches ? "Sans les flèches" : "Avec les flèches"}</button>` : ""}
    ${contrib ? `<button class="mini txt" data-tb="ref" ${tbl.traits.length ? "" : "disabled"}>Enregistrer comme modèle de tracé</button>` : ""}`;
}
function tbMsg(html) { tbl.root.querySelector(".tb-msg").innerHTML = html || ""; }

// --- Calque du dessous : ligne d'écriture, modèle en filigrane, tracé de référence numéroté et fléché
function tbDrawGuide(upTo) {
  const g = tbl.guide.getContext("2d"), w = tbl.w, h = tbl.h;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = tbColor("--line"); g.lineWidth = 2; g.setLineDash([6, 8]);
  g.beginPath(); g.moveTo(12, h * 0.66); g.lineTo(w - 12, h * 0.66); g.stroke(); g.setLineDash([]);
  const ref = tbl.modele ? tbRef() : null;
  const text = tbl.ctx.text && tbl.modele && !ref ? tbTargetText() : "";
  if (text) {
    // Le mot occupe au plus 86 % de la largeur ; sa taille ne dépend que de la largeur, donc elle est la même partout
    let size = h * 0.62; g.font = `${size}px "Scheherazade New", serif`;
    const mw = g.measureText(text).width; if (mw > w * 0.86) size *= (w * 0.86) / mw;
    g.font = `${size}px "Scheherazade New", serif`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.direction = "rtl";
    g.globalAlpha = 0.22; g.fillStyle = tbColor("--ink"); g.fillText(text, w / 2, h * 0.66); g.globalAlpha = 1;
  }
  if (!ref) return;
  const k = w / 1000, gold = tbColor("--gold");
  // upTo : pendant l'animation, nombre de points déjà repassés ; sinon tout le tracé, en trait fin
  let seen = 0;
  ref.traits.forEach((tr, n) => {
    const pts = upTo == null ? tr : tr.slice(0, Math.max(0, upTo - seen)); seen += tr.length;
    if (pts.length > 1) {
      g.strokeStyle = gold; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = upTo == null ? Math.max(8, w / 40) : Math.max(10, w / 32); g.globalAlpha = upTo == null ? 0.3 : 1;
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k))); g.stroke(); g.globalAlpha = 1;
    }
    // Un trait d'un seul point est un point de la lettre : un petit rond
    if (tr.length === 1 && (upTo == null || upTo - (seen - 1) > 0)) { g.fillStyle = gold; g.globalAlpha = upTo == null ? 0.3 : 1; g.beginPath(); g.arc(tr[0][0] * k, tr[0][1] * k, Math.max(5, w / 60), 0, 7); g.fill(); g.globalAlpha = 1; }
    if (upTo != null || !tbl.fleches) return;
    if (tr.length === 1) { g.fillStyle = gold; g.font = "600 13px Fredoka, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle"; g.direction = "ltr"; g.fillText(String(n + 1), tr[0][0] * k + 9, tr[0][1] * k - 9); return; }
    // Numéro du trait à son départ, et une flèche un peu plus loin, dans le sens de l'écriture
    const a = tr[0], i = Math.min(tr.length - 1, Math.max(1, Math.round(tr.length * 0.3))), b = tr[i], p0 = tr[i - 1], ang = Math.atan2(b[1] - p0[1], b[0] - p0[0]);
    g.fillStyle = gold; g.beginPath(); g.arc(a[0] * k, a[1] * k, 10, 0, 7); g.fill();
    g.fillStyle = tbColor("--paper"); g.font = "600 13px Fredoka, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "ltr"; g.fillText(String(n + 1), a[0] * k, a[1] * k + 1);
    g.save(); g.translate(b[0] * k, b[1] * k); g.rotate(ang); g.fillStyle = gold; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore();
  });
}
// Animation : le tracé de référence se repasse en gras, trait après trait, à la vitesse où il a été écrit (bornée)
function tbPlay() {
  const ref = tbRef(); if (!ref) return;
  cancelAnimationFrame(tbl.anim);
  const total = ref.traits.reduce((n, t) => n + t.length, 0), dur = Math.min(4500, Math.max(1500, total * 22)), start = performance.now();
  const step = now => {
    if (!tbl) return;
    const f = Math.min(1, (now - start) / dur); tbDrawGuide(Math.ceil(f * total));
    if (f < 1) tbl.anim = requestAnimationFrame(step); else tbl.anim = setTimeout(() => { if (tbl) tbDrawGuide(); }, 900);
  };
  tbl.anim = requestAnimationFrame(step);
}

// --- Calque du dessus : l'écriture
function tbPoint(e) { const r = tbl.ink.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / tbl.w * 1000), Math.round((e.clientY - r.top) / tbl.w * 1000), Math.round(performance.now() - tbl.t0)]; }
function tbDown(e) {
  e.preventDefault(); try { tbl.ink.setPointerCapture(e.pointerId); } catch (x) {}
  if (!tbl.traits.length) tbl.t0 = performance.now();
  tbl.appareil = e.pointerType || ""; tbl.cur = [tbPoint(e)]; tbl.traits.push(tbl.cur); tbDrawInk();
}
function tbMove(e) {
  if (!tbl.cur) return;
  // Les navigateurs regroupent parfois plusieurs positions par signal : on les prend toutes, le tracé est plus fidèle
  const lot = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  (lot.length ? lot : [e]).forEach(ev => { const p = tbPoint(ev), l = tbl.cur[tbl.cur.length - 1]; if (p[0] !== l[0] || p[1] !== l[1]) tbl.cur.push(p); });
  tbDrawInk();
}
function tbUp() { if (tbl && tbl.cur) { tbl.cur = null; tbChrome(); } }
function tbDrawInk() {
  const g = tbl.ink.getContext("2d"), k = tbl.w / 1000;
  g.clearRect(0, 0, tbl.w, tbl.h); g.strokeStyle = g.fillStyle = tbColor("--ink"); g.lineWidth = Math.max(4, tbl.w / 90); g.lineCap = "round"; g.lineJoin = "round";
  tbl.traits.forEach(tr => {
    if (tr.length === 1) { g.beginPath(); g.arc(tr[0][0] * k, tr[0][1] * k, g.lineWidth / 2, 0, 7); g.fill(); return; }   // un simple point (les points des lettres)
    g.beginPath(); tr.forEach((p, i) => (i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k))); g.stroke();
  });
}

// --- Garder le tracé en cours, puis vider le tableau. Les tracés sont gardés sauf si le réglage « Garder mes tracés »
// a été désactivé ; un modèle de tracé posé par un contributeur est toujours envoyé.
function tbKeep(commeModele) {
  if (!tbl.traits.length) return;
  const rec = tbRecord(tbl.ctx, tbl.forme, tbl.traits, tbl.w, tbl.appareil, tbl.modele, commeModele);
  if (commeModele || S.traces !== false) { tbSetQueue([...tbQueue(), rec]); tbFlush().then(ok => { if (commeModele) { if (ok) tbLoadRefs(); if (tbl) tbMsg(ok ? "<b>Modèle de tracé enregistré.</b>" : ESSAI ? "Version d'essai : rien n'est envoyé à la base." : "Pas encore envoyé : nouvel essai à la prochaine ouverture."); } }); }
  if (commeModele && tbRefs) { tbRefs[tbRefKey()] = { traits: tbl.traits, ratio: TB_RATIO }; }   // visible tout de suite sur cet appareil
  tbl.traits = []; tbl.cur = null; tbDrawInk(); tbDrawGuide(); tbChrome();
}
function tbClick(e) {
  const el = e.target.closest("[data-tb]"); if (!el || !tbl) return;
  switch (el.dataset.tb) {
    case "close": case "done": tbKeep(false); tableauClose(); return;   // la croix garde le tracé comme « Terminé »
    case "again": tbKeep(false); tbMsg(""); return;
    case "undo": tbl.traits.pop(); tbDrawInk(); break;
    case "modele": tbl.modele = !tbl.modele; tbDrawGuide(); break;
    case "fleches": tbl.fleches = !tbl.fleches; tbDrawGuide(); break;
    case "play": tbPlay(); return;
    case "ref": tbKeep(true); return;
  }
  if (tbl) tbChrome();
}
