"use strict";
/* Mufrad — tableau d'écriture : écrire une lettre ou un mot au doigt, au stylet ou à la souris, pour mieux le retenir.
   S'ouvre par l'icône ✎ pendant une séance (cours ou exercice). Chargé avant l'application ; il n'utilise ses outils
   (S, sess, gs, BY_ID, sb…) qu'à l'intérieur de ses fonctions.

   Ce que le tableau fait :
   - il prend tout l'écran, avec en haut un rappel en petit de la carte ou de la question en cours (une copie, qu'on peut
     faire défiler), pour qu'on voie toujours ce sur quoi on travaille ;
   - un modèle en filigrane : le mot ou la lettre dans la police de l'application, qu'on peut masquer ;
   - pour une lettre, le sens d'écriture : numéros et flèches posés sur la lettre, et une animation où la lettre
     elle-même s'allume en suivant le chemin de la main. Les chemins de départ sont dans js/tableau-lettres.js ;
     un contributeur peut en remplacer un en écrivant lui-même la lettre (« modèle de tracé ») ;
   - ce qu'on a écrit reste sur le tableau si on le ferme et qu'on le rouvre sans avoir quitté la page en cours ;
   - sur un grand écran, le rappel est à gauche et le tableau, plus grand, à droite ;
   - chaque tracé est gardé pour entraîner la future reconnaissance d'écriture, que l'on termine ou que l'on ferme,
     sauf si la personne l'a désactivé dans les réglages : les traits (points et instants), et ce qui était à l'écran
     comme étiquette, à confirmer plus tard par un relecteur. Aucun nom ni compte n'y est attaché.

   Un trait = une liste de points [x, y, t] : x et y en millièmes de la largeur du tableau, t en millisecondes depuis le début.
   Le tableau a toujours les mêmes proportions (TB_RATIO), pour que modèle, chemins et écritures se superposent
   de la même façon sur tous les écrans. */

const TB_RATIO = 0.6;                 // hauteur du tableau = largeur × 0,6
const TB_QUEUE = "mufrad-traces-attente";   // tracés pas encore envoyés (hors ligne, ou table pas encore créée)
const TB_REFS_KEY = "mufrad-traces-modeles";
let tbl = null;                       // tableau ouvert : éléments de la page, traits en cours, cible
let tbRefs = null;                    // chemins posés par des contributeurs : "identifiant:forme" -> { traits }
let tbMemo = { owner: null, pas: -1, items: {} };   // ce qu'on a écrit sur la page en cours de la séance : clé -> { traits, envoye }

// --- Ce qu'on écrit : déduit de ce qui est à l'écran au moment où le tableau s'ouvre.
// Renvoie { id, text, contexte, montre (le modèle peut s'afficher sans donner la réponse), lettre, cle (pour retrouver son tracé) }.
function tbContext() {
  const libre = { id: null, text: "", contexte: "libre", montre: false, lettre: null, cle: "libre" };
  if (typeof gs !== "undefined" && gs && !gs.over && route() === "grammaire") {
    const st = gs.steps[gs.i], vu = st.t === "q" ? String(st.q.prompt || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    return { ...libre, text: /[؀-ۿ]/.test(vu) ? vu.slice(0, 120) : "", contexte: "grammaire:" + st.t, cle: "g:" + gs.i };
  }
  if (sess && !sess.over && route() === "accueil") {
    const { task } = snapshot();
    if (!task || task.kind === "match") return { ...libre, contexte: "exo:paires", cle: "paires" };
    const it = BY_ID[task.id]; if (!it) return libre;
    // En exercice, on ne montre le modèle que si l'arabe est déjà à l'écran ; sinon il donnerait la réponse
    const montre = task.kind === "intro" || ["ar2fr", "l2n", "f2l"].includes(task.ex);
    return { id: it.id, text: it.ar, contexte: task.kind === "intro" ? "cours" : "exo:" + task.ex, montre, lettre: it.type === "letter" ? it : null, cle: it.id };
  }
  return libre;
}
const tbRefKey = () => (tbl.ctx.id ? tbl.ctx.id + ":" + tbl.forme : "");
// Séance en cours (vocabulaire ou grammaire) et page où l'on en est : dès qu'on continue, ce qui avait été écrit est oublié
const tbOwner = () => (typeof gs !== "undefined" && gs ? gs : sess || null);
const tbStep = () => (tbOwner() ? tbOwner().i : -1);
const tbCount = traits => traits.reduce((n, t) => n + t.length, 0);

// --- Ce qu'on garde d'un tracé
function tbRecord(ctx, forme, traits, largeur, appareil, modeleVisible, commeModele, suite) {
  return { element: ctx.id, forme: ctx.lettre ? forme : null, texte: ctx.text || null, contexte: (ESSAI ? "essai:" : "") + ctx.contexte + (suite ? ":suite" : ""),
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
// Chemins posés par des contributeurs : lus dans la base quand c'est possible, gardés sur l'appareil pour le hors ligne
async function tbLoadRefs() {
  if (tbRefs === null) { try { tbRefs = JSON.parse(localStorage.getItem(TB_REFS_KEY) || "{}"); } catch (e) { tbRefs = {}; } }
  if (!sb) return;
  try {
    const r = await sb.from("traces").select("element,forme,traits,largeur,hauteur,cree_le").eq("modele", true).order("cree_le", { ascending: true });
    if (r.error || !r.data) return;
    const refs = {};
    r.data.forEach(x => { refs[x.element + ":" + (x.forme || "isolee")] = { traits: x.traits }; });   // le plus récent l'emporte
    tbRefs = refs; try { localStorage.setItem(TB_REFS_KEY, JSON.stringify(refs)); } catch (e) {}
    if (tbl) { tbl.path = null; tbDrawGuide(); }
  } catch (e) {}
}

// --- Ouverture : le tableau est posé par-dessus la page et vit sa vie, sans être redessiné par le reste de l'application
function tableauOpen() {
  if (tbl) return;
  // Premier appui sur le crayon : il cesse de clignoter, ici et sur les prochains écrans
  if (!S.crayonVu) { S.crayonVu = true; saveState(); document.querySelectorAll(".icon.pulse").forEach(b => b.classList.remove("pulse")); }
  const ctx = tbContext(), root = document.createElement("div");
  root.className = "tb"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Tableau d'écriture");
  root.innerHTML = `<div class="tb-bar"><button class="icon" data-tb="close" aria-label="Fermer le tableau">✕</button><b>Tableau</b></div>
    <div class="tb-rappel" aria-label="Rappel de l'écran en cours"><div class="tb-rappel-in"></div></div>
    <div class="tb-stage"><canvas class="tb-guide"></canvas><canvas class="tb-ink" aria-label="Zone d'écriture"></canvas></div>
    <div class="tb-tools"></div><div class="tb-msg" role="status"></div>
    <div class="tb-foot"><button class="btn small ghost" data-tb="again">Recommencer</button><button class="btn small" data-tb="done">Terminé</button></div>`;
  // Le rappel : une copie, en petit et sans boutons actifs, de ce qui est affiché derrière (carte de cours ou question)
  const copie = root.querySelector(".tb-rappel-in"); copie.innerHTML = $view.innerHTML;
  copie.querySelectorAll(".scrim, .sheet, .gsrc, .gkb, .gkb-note").forEach(x => x.remove());
  copie.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
  copie.querySelectorAll("[data-act]").forEach(x => { x.removeAttribute("data-act"); x.setAttribute("tabindex", "-1"); });
  document.body.appendChild(root);
  // Ce qu'on avait déjà écrit revient sur le tableau, tant qu'on est resté sur la même page de la séance
  if (tbMemo.owner !== tbOwner() || tbMemo.pas !== tbStep()) tbMemo = { owner: tbOwner(), pas: tbStep(), items: {} };
  const memo = tbMemo.items[ctx.cle];
  tbl = { root, ctx, forme: "isolee", modele: ctx.montre, fleches: true, traits: memo ? memo.traits.map(t => t.slice()) : [], envoye: memo ? memo.envoye : 0,
    cur: null, t0: 0, appareil: "", anim: 0, path: null, mask: null, guide: root.querySelector(".tb-guide"), ink: root.querySelector(".tb-ink") };
  root.addEventListener("click", tbClick);
  tbl.ink.addEventListener("pointerdown", tbDown); tbl.ink.addEventListener("pointermove", tbMove);
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => tbl.ink.addEventListener(ev, tbUp));
  window.addEventListener("resize", tbResize);
  tbResize(); tbChrome(); tbLoadRefs(); tbFlush();
  // La lettre est mesurée dans sa police : on redessine une fois la police réellement chargée
  // Sur une lettre, le sens d'écriture se joue de lui-même à l'ouverture.
  const pret = () => { if (!tbl) return; tbl.path = null; tbDrawGuide(); if (tbl.ctx.lettre && tbl.modele) tbPlay(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pret); else pret();
  if (typeof noter === "function") noter("tableau", ctx.contexte);
}
function tableauClose() {
  if (!tbl) return;
  cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); window.removeEventListener("resize", tbResize);
  tbl.root.remove(); tbl = null;
}
// Taille : toute la largeur disponible, proportions fixes ; les deux calques (guide et encre) ont la netteté de l'écran
function tbResize() {
  const stage = tbl.root.querySelector(".tb-stage"), large = window.innerWidth >= 900, d = window.devicePixelRatio || 1;
  // Téléphone : toute la largeur, 40 % de la hauteur au plus. Grand écran : la colonne de droite, jusqu'à 62 % de la hauteur.
  const dispo = large ? tbl.root.clientWidth - 48 - 24 - Math.min(400, tbl.root.clientWidth * 0.34) : tbl.root.clientWidth - 24;
  const w = Math.max(240, Math.min(dispo, (window.innerHeight * (large ? 0.62 : 0.4)) / TB_RATIO, large ? 860 : 640)), h = w * TB_RATIO;
  stage.style.width = w + "px"; stage.style.height = h + "px";
  [tbl.guide, tbl.ink].forEach(c => { c.width = Math.round(w * d); c.height = Math.round(h * d); c.getContext("2d").setTransform(d, 0, 0, d, 0, 0); });
  tbl.w = w; tbl.h = h; tbl.d = d; tbl.path = null; tbl.mask = null;
  tbDrawGuide(); tbDrawInk();
}
const tbColor = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";

// --- Les boutons sous le tableau, refaits à chaque changement d'état
function tbChrome() {
  const c = tbl.ctx, contrib = typeof isContributor === "function" && me && isContributor() && c.lettre;
  tbl.root.querySelector(".tb-tools").innerHTML = `<button class="mini txt" data-tb="undo" ${tbl.traits.length ? "" : "disabled"}>Annuler le trait</button>
    ${c.text && c.montre ? `<button class="mini txt" data-tb="modele" aria-pressed="${tbl.modele}">${tbl.modele ? "Masquer le modèle" : "Montrer le modèle"}</button>` : ""}
    ${c.lettre && c.montre && tbl.modele ? `<button class="mini txt" data-tb="play">Voir le tracé</button><button class="mini txt" data-tb="fleches" aria-pressed="${tbl.fleches}">${tbl.fleches ? "Sans les flèches" : "Avec les flèches"}</button>` : ""}
    ${contrib ? `<button class="mini txt" data-tb="ref" ${tbl.traits.length ? "" : "disabled"}>Enregistrer comme modèle de tracé</button>` : ""}`;
}
function tbMsg(html) { tbl.root.querySelector(".tb-msg").innerHTML = html || ""; }

// --- Le modèle : le texte dans la police de l'application, à une taille qui ne dépend que de la largeur du tableau
function tbGlyph(g, text, w, h) {
  let size = h * 0.62; g.font = `${size}px "Scheherazade New", serif`;
  const mw = g.measureText(text).width; if (mw > w * 0.86) size *= (w * 0.86) / mw;
  g.font = `${size}px "Scheherazade New", serif`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.direction = "rtl";
  g.fillText(text, w / 2, h * 0.66);
}
// Arrondit un trait donné par quelques points de passage en une courbe de nombreux points
function tbSpline(p) {
  if (p.length < 3) return p;
  const q = [p[0], ...p, p[p.length - 1]], out = [];
  for (let i = 1; i < q.length - 2; i++) for (let k = 0; k < 24; k++) {
    const t = k / 24, [a, b, c, d] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
    out.push([0, 1].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t * t * t)));
  }
  out.push(p[p.length - 1]); return out;
}
// Ajuste un chemin dessiné dans le repère du fichier à la place réelle de la lettre sur le tableau :
// on fait coïncider le cadre du chemin avec le cadre de la lettre (boite = [x0, y0, x1, y1], en millièmes de la largeur).
function tbFit(traits, boite) {
  const pts = traits.flat(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const a = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const f = (v, a0, a1, b0, b1) => (a1 - a0 < 1 ? (b0 + b1) / 2 : b0 + (v - a0) / (a1 - a0) * (b1 - b0));
  return traits.map(t => t.map(p => [f(p[0], a[0], a[2], boite[0], boite[2]), f(p[1], a[1], a[3], boite[1], boite[3])]));
}
// Cadre réellement occupé par la lettre dessinée dans sa police (on la dessine à part et on regarde où il y a de l'encre)
function tbGlyphBox(text) {
  const w = Math.round(tbl.w), h = Math.round(tbl.h), c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true }); g.fillStyle = "#000"; tbGlyph(g, text, w, h);
  const px = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : [x0, y0, x1, y1].map(v => v / tbl.w * 1000);
}
// Le chemin de la main pour la lettre à l'écran, déjà à sa place sur le tableau (calculé une fois par ouverture ou par taille) :
// celui qu'un contributeur a écrit s'il existe (il a été écrit sur la lettre, donc il est déjà en place), sinon celui du fichier.
function tbPath() {
  if (!tbl.ctx.lettre) return null;
  if (tbl.path) return tbl.path;
  const posed = tbRefs && tbRefs[tbRefKey()];
  const base = typeof TB_LETTRES !== "undefined" && TB_LETTRES[tbl.ctx.lettre.ar], boite = tbGlyphBox(tbl.ctx.text);
  const traits = posed ? posed.traits.map(t => t.map(p => [p[0], p[1]])) : base && boite ? tbFit(base, boite).map(tbSpline) : null;
  return traits ? (tbl.path = tbMeasure({ traits, boite })) : null;
}
// Longueurs le long du chemin. Un point de lettre compte pour un petit temps de pose, pour qu'on le voie se poser.
function tbMeasure(path) {
  path.cumul = path.traits.map(tr => { let d = 0; return tr.map((p, i) => (d += i ? Math.hypot(p[0] - tr[i - 1][0], p[1] - tr[i - 1][1]) : 0)); });
  path.longueurs = path.cumul.map(c => Math.max(c[c.length - 1], 70));
  path.total = path.longueurs.reduce((a, b) => a + b, 0);
  return path;
}

// --- Calque du dessous : ligne d'écriture, modèle en filigrane, numéros et flèches du sens d'écriture.
// part (pendant l'animation) : fraction du chemin déjà parcourue, de 0 à 1 ; la lettre s'allume sur cette partie.
function tbDrawGuide(part) {
  const g = tbl.guide.getContext("2d"), w = tbl.w, h = tbl.h, k = w / 1000, gold = tbColor("--gold");
  g.clearRect(0, 0, w, h);
  g.strokeStyle = tbColor("--line"); g.lineWidth = 2; g.setLineDash([6, 8]);
  g.beginPath(); g.moveTo(12, h * 0.66); g.lineTo(w - 12, h * 0.66); g.stroke(); g.setLineDash([]);
  if (!tbl.ctx.text || !tbl.modele) return;
  g.globalAlpha = 0.22; g.fillStyle = tbColor("--ink"); tbGlyph(g, tbl.ctx.text, w, h); g.globalAlpha = 1;
  const path = tbPath(); if (!path) return;
  if (part != null) {
    // La lettre elle-même s'allume : on trace la partie parcourue du chemin en très gros trait, au bord adouci, sur un
    // calque à part, puis on n'en garde que ce qui tombe sur la lettre. À la fin, toute la lettre est allumée.
    const c = tbl.mask || (tbl.mask = document.createElement("canvas")); c.width = tbl.guide.width; c.height = tbl.guide.height;
    const m = c.getContext("2d"); m.setTransform(tbl.d, 0, 0, tbl.d, 0, 0);
    if (part >= 1) { m.fillStyle = gold; tbGlyph(m, tbl.ctx.text, w, h); }
    else {
      const b = path.boite || [0, 0, 1000, 600], gros = Math.max(26, Math.max(b[2] - b[0], b[3] - b[1]) * k * 0.3);
      m.strokeStyle = m.fillStyle = m.shadowColor = "#fff"; m.shadowBlur = gros * 0.35 * tbl.d; m.lineCap = "round"; m.lineJoin = "round"; m.lineWidth = gros;
      let reste = part * path.total;
      path.traits.forEach((tr, n) => {
        if (reste <= 0) return;
        const fait = Math.min(reste, path.longueurs[n]); reste -= path.longueurs[n];
        if (tr.length === 1) { m.globalAlpha = Math.min(1, fait / 70); m.beginPath(); m.arc(tr[0][0] * k, tr[0][1] * k, gros * 0.55, 0, 7); m.fill(); m.globalAlpha = 1; return; }
        // On avance jusqu'à la distance parcourue, en s'arrêtant entre deux points s'il le faut : pas de saut d'un point à l'autre
        const cu = path.cumul[n]; let i = 1; m.beginPath(); m.moveTo(tr[0][0] * k, tr[0][1] * k);
        for (; i < tr.length && cu[i] <= fait; i++) m.lineTo(tr[i][0] * k, tr[i][1] * k);
        if (i < tr.length) { const t = (fait - cu[i - 1]) / Math.max(1e-6, cu[i] - cu[i - 1]); m.lineTo((tr[i - 1][0] + (tr[i][0] - tr[i - 1][0]) * t) * k, (tr[i - 1][1] + (tr[i][1] - tr[i - 1][1]) * t) * k); }
        m.stroke();
      });
      m.shadowBlur = 0; m.globalCompositeOperation = "source-in"; m.fillStyle = gold; tbGlyph(m, tbl.ctx.text, w, h);
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore();
    return;
  }
  if (!tbl.fleches) return;
  // Au repos : le chemin en trait fin, le numéro de chaque trait à son départ, et une flèche dans le sens de l'écriture
  path.traits.forEach((tr, n) => {
    const a = tr[0];
    if (tr.length === 1) { g.fillStyle = gold; g.font = "600 13px Fredoka, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle"; g.direction = "ltr"; g.fillText(String(n + 1), a[0] * k + 10, a[1] * k - 10); return; }
    g.strokeStyle = gold; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round"; g.globalAlpha = 0.6;
    g.beginPath(); tr.forEach((p, i) => (i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k))); g.stroke(); g.globalAlpha = 1;
    const i = Math.min(tr.length - 1, Math.max(1, Math.round(tr.length * 0.3))), b = tr[i], p0 = tr[i - 1], ang = Math.atan2(b[1] - p0[1], b[0] - p0[0]);
    g.fillStyle = gold; g.beginPath(); g.arc(a[0] * k, a[1] * k, 10, 0, 7); g.fill();
    g.fillStyle = tbColor("--paper"); g.font = "600 13px Fredoka, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "ltr"; g.fillText(String(n + 1), a[0] * k, a[1] * k + 1);
    g.save(); g.translate(b[0] * k, b[1] * k); g.rotate(ang); g.fillStyle = gold; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore();
  });
}
// Animation : la lettre s'allume le long du chemin à vitesse régulière, image par image, puis reste allumée un instant
function tbPlay() {
  const path = tbPath(); if (!path) return;
  cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin);
  const dur = Math.min(5200, Math.max(1800, path.total * 2.4)), start = performance.now();
  const step = now => {
    if (!tbl) return;
    const f = Math.min(1, (now - start) / dur); tbDrawGuide(f);
    if (f < 1) tbl.anim = requestAnimationFrame(step); else tbl.fin = setTimeout(() => { if (tbl) tbDrawGuide(); }, 1200);
  };
  tbl.anim = requestAnimationFrame(step);
}

// --- Calque du dessus : l'écriture
function tbPoint(e) { const r = tbl.ink.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / tbl.w * 1000), Math.round((e.clientY - r.top) / tbl.w * 1000), Math.round(performance.now() - tbl.t0)]; }
function tbDown(e) {
  e.preventDefault(); try { tbl.ink.setPointerCapture(e.pointerId); } catch (x) {}
  // L'horloge du tracé reprend là où elle s'était arrêtée, même si le tableau a été fermé entre-temps
  if (!tbl.t0) { const last = tbl.traits.length ? tbl.traits[tbl.traits.length - 1] : null; tbl.t0 = performance.now() - (last ? last[last.length - 1][2] + 400 : 0); }
  tbl.appareil = e.pointerType || ""; tbl.cur = [tbPoint(e)]; tbl.traits.push(tbl.cur);
  const g = tbl.ink.getContext("2d"); tbPen(g); tbStroke(g, tbl.cur, 1);   // le point de départ apparaît tout de suite
}
function tbMove(e) {
  if (!tbl.cur) return;
  // Les navigateurs regroupent parfois plusieurs positions par signal : on les prend toutes, le tracé est plus fidèle
  const lot = e.getCoalescedEvents ? e.getCoalescedEvents() : [], avant = tbl.cur.length;
  (lot.length ? lot : [e]).forEach(ev => { const p = tbPoint(ev), l = tbl.cur[tbl.cur.length - 1]; if (p[0] !== l[0] || p[1] !== l[1]) tbl.cur.push(p); });
  // Pendant qu'on écrit, on n'ajoute que le nouveau morceau : pas de retard, même sur un long tracé
  if (tbl.cur.length > avant) { const g = tbl.ink.getContext("2d"); tbPen(g); tbStroke(g, tbl.cur, Math.max(1, avant - 1)); }
}
function tbUp() { if (tbl && tbl.cur) { tbl.cur = null; tbDrawInk(); tbChrome(); } }
function tbPen(g) { g.strokeStyle = g.fillStyle = tbColor("--ink"); g.lineWidth = Math.max(4, tbl.w / 90); g.lineCap = "round"; g.lineJoin = "round"; }
// Dessine un trait en courbe douce : chaque point sert de point de contrôle, la ligne passe par les milieux
function tbStroke(g, tr, from) {
  const k = tbl.w / 1000, P = i => [tr[i][0] * k, tr[i][1] * k], mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (tr.length === 1) { g.beginPath(); g.arc(P(0)[0], P(0)[1], g.lineWidth / 2, 0, 7); g.fill(); return; }   // un simple point (les points des lettres)
  g.beginPath();
  for (let i = Math.max(1, from || 1); i < tr.length; i++) {
    const a = i === 1 ? P(0) : mid(P(i - 2), P(i - 1)), b = i === tr.length - 1 && !tbl.cur ? P(i) : mid(P(i - 1), P(i));
    g.moveTo(a[0], a[1]); g.quadraticCurveTo(P(i - 1)[0], P(i - 1)[1], b[0], b[1]);
  }
  g.stroke();
}
function tbDrawInk() {
  const g = tbl.ink.getContext("2d");
  g.clearRect(0, 0, tbl.w, tbl.h); tbPen(g);
  tbl.traits.forEach(tr => tbStroke(g, tr, 1));
}

// --- Garder ce qui est écrit. Les tracés sont envoyés sauf si le réglage « Garder mes tracés » a été désactivé ;
// un modèle de tracé posé par un contributeur est toujours envoyé. On n'envoie que s'il y a du nouveau depuis le dernier envoi.
function tbKeep(commeModele) {
  const n = tbCount(tbl.traits);
  if (!tbl.traits.length || (!commeModele && n === tbl.envoye)) return;
  const rec = tbRecord(tbl.ctx, tbl.forme, tbl.traits, tbl.w, tbl.appareil, tbl.modele, commeModele, tbl.envoye > 0);
  if (commeModele || S.traces !== false) { tbSetQueue([...tbQueue(), rec]); tbFlush().then(ok => { if (commeModele) { if (ok) tbLoadRefs(); if (tbl) tbMsg(ok ? "<b>Modèle de tracé enregistré.</b>" : ESSAI ? "Version d'essai : rien n'est envoyé à la base." : "Pas encore envoyé : nouvel essai à la prochaine ouverture."); } }); }
  if (commeModele && tbRefs) { tbRefs[tbRefKey()] = { traits: tbl.traits.map(t => t.slice()) }; tbl.path = null; }   // visible tout de suite sur cet appareil
  tbl.envoye = n;
}
// Ce qui est écrit reste associé à la carte en cours, pour revenir si on rouvre le tableau pendant la même séance
function tbRemember() {
  if (tbl.traits.length) tbMemo.items[tbl.ctx.cle] = { traits: tbl.traits.map(t => t.slice()), envoye: tbl.envoye }; else delete tbMemo.items[tbl.ctx.cle];
}
function tbClick(e) {
  const el = e.target.closest("[data-tb]"); if (!el || !tbl) return;
  switch (el.dataset.tb) {
    case "close": case "done": tbKeep(false); tbRemember(); tableauClose(); return;   // la croix garde le tracé comme « Terminé »
    case "again": tbKeep(false); tbl.traits = []; tbl.envoye = 0; tbl.t0 = 0; tbRemember(); tbDrawInk(); tbMsg(""); break;
    case "undo": tbl.traits.pop(); tbDrawInk(); break;
    case "modele": tbl.modele = !tbl.modele; cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); tbDrawGuide(); break;
    case "fleches": tbl.fleches = !tbl.fleches; cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); tbDrawGuide(); break;
    case "play": tbPlay(); return;
    case "ref": tbKeep(true); tbl.traits = []; tbl.envoye = 0; tbDrawInk(); tbDrawGuide(); break;
  }
  if (tbl) tbChrome();
}
