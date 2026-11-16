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
    cur: null, t0: 0, ouvert: Date.now(), appareil: "", anim: 0, path: null, guide: root.querySelector(".tb-guide"), ink: root.querySelector(".tb-ink") };
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
  tbl.w = w; tbl.h = h; tbl.d = d; tbl.path = null;
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

// --- Carte d'allumage : à chaque pixel de la lettre, l'instant où il s'allume (une distance le long du chemin).
// Le principe : au lieu d'éclairer tout ce qui tombe sous un gros pinceau qui suit le chemin (ce qui allumait des zones
// voisines trop tôt, et les points d'un coup dès que le pinceau passait près d'eux), on calcule une fois pour toutes,
// pour chaque pixel d'encre, à quel moment du chemin la main l'atteint. L'animation n'a plus qu'à allumer, image par
// image, les pixels dont le moment est venu : la lettre s'éclaire en suivant le tracé, au pixel près, sans à-coups.
// - Le corps de la lettre : chaque morceau d'encre prend le moment du passage du chemin le plus proche EN RESTANT DANS
//   L'ENCRE (on se propage à l'intérieur de la lettre, jamais à travers le vide). Une partie voisine mais séparée ne
//   s'allume donc pas en avance ; là où le chemin repasse (boucle de ه, dent de س), c'est le premier passage qui compte.
// - Les points : chaque point de la police (les petites taches détachées du corps) est rattaché à un trait d'un seul point
//   du chemin ; quand deux ou trois points se touchent dans la police, la tache est partagée entre eux. Chaque point
//   s'allume seul, du centre vers le bord, au moment de son trait, et reste allumé.
// Calculée une fois par ouverture ou par taille du tableau (quelques dizaines de millisecondes), puis réutilisée.
const TB_DOUX = 16;   // largeur du bord adouci du front d'allumage, en unités de chemin (un peu moins de deux images)
function tbCarte(path) {
  if (path.carte) return path.carte;
  const w = Math.ceil(tbl.w), h = Math.ceil(tbl.h), k = tbl.w / 1000, d = tbl.d, N = w * h;
  // 1. La lettre en pixels de l'écran (CSS) : opacité de l'encre, et taches d'encre séparées (corps, points)
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true }); g.fillStyle = "#000"; tbGlyph(g, tbl.ctx.text, tbl.w, tbl.h);
  const px = g.getImageData(0, 0, w, h).data, A = new Uint8Array(N);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < N; i++) if ((A[i] = px[i * 4 + 3])) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const T = new Float32Array(N).fill(-1);           // moment d'allumage de chaque pixel (-1 : pas encore connu)
  const pris = new Uint8Array(N);                   // pixel réservé à un point de la lettre
  const voisins = (i, f) => { const x = i % w, y = (i / w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) f(yy * w + xx, dx && dy ? 1.4142 : 1); } };
  const taches = [], tache = new Int32Array(N).fill(-1);
  for (let i = 0; i < N; i++) if (A[i] > 60 && tache[i] < 0) {
    const id = taches.length, liste = [i], t = { px: liste, x: 0, y: 0 }; tache[i] = id;
    for (let n = 0; n < liste.length; n++) voisins(liste[n], j => { if (A[j] > 60 && tache[j] < 0) { tache[j] = id; liste.push(j); } });
    liste.forEach(j => { t.x += j % w; t.y += (j / w) | 0; }); t.x /= liste.length; t.y /= liste.length; taches.push(t);
  }
  const taille = Math.max(1, x1 - x0, y1 - y0), plusGrande = Math.max(1, ...taches.map(t => t.px.length));
  // Début de chaque trait sur le chemin (en unités de chemin)
  const debut = []; path.longueurs.reduce((s, l, n) => ((debut[n] = s), s + l), 0);
  // 2. Les points de la lettre : traits d'un seul point, rattachés aux petites taches proches
  const pts = path.traits.map((tr, n) => (tr.length === 1 ? { n, x: tr[0][0] * k, y: tr[0][1] * k } : null)).filter(Boolean);
  const centres = {};
  if (pts.length) {
    const petites = taches.filter(t => t.px.length < plusGrande * 0.25 && pts.some(p => Math.hypot(t.x - p.x, t.y - p.y) < taille * 0.35));
    // Combien de points chaque tache peut porter (deux points qui se touchent font une seule tache, deux fois plus grande)
    const unite = petites.reduce((s, t) => s + t.px.length, 0) / pts.length;
    petites.forEach(t => { t.place = Math.max(1, Math.round(t.px.length / Math.max(1, unite))); });
    // On essaie toutes les façons de répartir les points (trois au plus : peu de cas). Le chemin peut être un peu décalé
    // par rapport à la police : on juge surtout la forme de la répartition, un peu la distance.
    let mieux = null, coutMin = Infinity;
    const essai = (j, choix) => {
      if (j === pts.length) {
        const ec = choix.map((t, m) => [t.x - pts[m].x, t.y - pts[m].y]), mx = ec.reduce((s, e) => s + e[0], 0) / ec.length, my = ec.reduce((s, e) => s + e[1], 0) / ec.length;
        const cout = ec.reduce((s, e) => s + (e[0] - mx) ** 2 + (e[1] - my) ** 2, 0) + 0.25 * (mx * mx + my * my) * ec.length;
        if (cout < coutMin) { coutMin = cout; mieux = choix.slice(); } return;
      }
      petites.forEach(t => { if (choix.filter(x => x === t).length < t.place) { choix.push(t); essai(j + 1, choix); choix.pop(); } });
    };
    essai(0, []);
    if (mieux) new Set(mieux).forEach(t => {
      // Les points portés par cette tache, et leur part de la tache : on la partage en autant de morceaux (k-moyennes),
      // en partant de la disposition des points du chemin recentrée sur la tache : chaque morceau garde son point.
      const miens = pts.filter((p, m) => mieux[m] === t), mx = miens.reduce((s, p) => s + p.x, 0) / miens.length, my = miens.reduce((s, p) => s + p.y, 0) / miens.length;
      const cs = miens.map(p => [p.x - mx + t.x, p.y - my + t.y]), part = new Int32Array(t.px.length);
      for (let it = 0; it < 10 && miens.length > 1; it++) {
        const som = cs.map(() => [0, 0, 0]);
        t.px.forEach((i, q) => { const x = i % w, y = (i / w) | 0; let b = 0, bd = Infinity; cs.forEach((cc, m) => { const dd = (x - cc[0]) ** 2 + (y - cc[1]) ** 2; if (dd < bd) { bd = dd; b = m; } }); part[q] = b; som[b][0] += x; som[b][1] += y; som[b][2]++; });
        som.forEach((s, m) => { if (s[2]) cs[m] = [s[0] / s[2], s[1] / s[2]]; });
      }
      miens.forEach((p, m) => {
        const mes = t.px.filter((i, q) => part[q] === m), r = Math.max(1, ...mes.map(i => Math.hypot(i % w - cs[m][0], ((i / w) | 0) - cs[m][1])));
        // Le point s'allume du centre vers le bord, dans le temps de pose de son trait, puis reste allumé
        const L = path.longueurs[p.n], t0 = debut[p.n] + L * 0.15;
        mes.forEach(i => { T[i] = t0 + Math.hypot(i % w - cs[m][0], ((i / w) | 0) - cs[m][1]) / r * L * 0.55; pris[i] = 1; });
        centres[p.n] = cs[m];
      });
    });
    // Le bord adouci des points (pixels à peine teintés autour) suit son point
    for (let passe = 0; passe < 2; passe++) for (let i = 0; i < N; i++) if (A[i] && !pris[i]) voisins(i, j => { if (pris[j] === 1 && !pris[i]) { T[i] = T[j]; pris[i] = 2; } });
    for (let i = 0; i < N; i++) if (pris[i] === 2) pris[i] = 1;
  }
  // 3. Le corps : le chemin (déjà arrondi) est parcouru tous les 1,5 pixel ; chaque position est posée sur l'encre la plus
  // proche (le chemin dessiné peut passer un peu à côté de la lettre), puis le moment se propage dans l'encre.
  const R = Math.max(10, taille * 0.12), file = [];   // file : [distance, moment, pixel], la plus courte d'abord
  const dist = new Float32Array(N).fill(Infinity);
  const pousser = e => { file.push(e); let i = file.length - 1; while (i) { const p = (i - 1) >> 1; if (file[p][0] < e[0] || (file[p][0] === e[0] && file[p][1] <= e[1])) break; file[i] = file[p]; i = p; } file[i] = e; };
  const sortir = () => { const top = file[0], e = file.pop(); if (file.length) { let i = 0; for (;;) { let l = 2 * i + 1, b = i; const r = l + 1;
    const plus = (a, z) => a[0] < z[0] || (a[0] === z[0] && a[1] < z[1]);
    if (l < file.length && plus(file[l], b === i ? e : file[b])) b = l; if (r < file.length && plus(file[r], b === i ? e : file[b])) b = r;
    if (b === i) break; file[i] = file[b]; i = b; } file[i] = e; } return top; };
  // Distance de chaque pixel à l'encre du corps (calcul en deux passes), pour recaler chaque trait sur la lettre
  const loin = new Float32Array(N);
  for (let i = 0; i < N; i++) loin[i] = A[i] > 60 && !pris[i] ? 0 : 1e6;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; let v = loin[i];
    if (x) v = Math.min(v, loin[i - 1] + 1); if (y) { v = Math.min(v, loin[i - w] + 1); if (x) v = Math.min(v, loin[i - w - 1] + 1.4142); if (x < w - 1) v = Math.min(v, loin[i - w + 1] + 1.4142); } loin[i] = v; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; let v = loin[i];
    if (x < w - 1) v = Math.min(v, loin[i + 1] + 1); if (y < h - 1) { v = Math.min(v, loin[i + w] + 1); if (x < w - 1) v = Math.min(v, loin[i + w + 1] + 1.4142); if (x) v = Math.min(v, loin[i + w - 1] + 1.4142); } loin[i] = v; }
  // Épaisseur du trait de la police : deux fois la distance au bord, prise dans les parties épaisses de la lettre
  const dedans = new Float32Array(N);
  for (let i = 0; i < N; i++) dedans[i] = A[i] > 60 ? 1e6 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!dedans[i]) continue; let v = dedans[i];
    v = Math.min(v, x ? dedans[i - 1] + 1 : 1, y ? dedans[i - w] + 1 : 1); dedans[i] = v; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!dedans[i]) continue;
    dedans[i] = Math.min(dedans[i], x < w - 1 ? dedans[i + 1] + 1 : 1, y < h - 1 ? dedans[i + w] + 1 : 1); }
  const prof = []; for (let i = 0; i < N; i++) if (dedans[i]) prof.push(dedans[i]); prof.sort((a, b) => a - b);
  const epais = Math.max(3, 2 * (prof[Math.floor(prof.length * 0.95)] || 2));
  const ecart = (x, y) => { const xx = Math.round(x), yy = Math.round(y); return xx < 0 || yy < 0 || xx >= w || yy >= h ? 30 : Math.min(30, loin[yy * w + xx]); };
  const corps = [];   // positions du chemin du corps, pour les morceaux d'encre que la propagation n'atteint pas
  path.traits.forEach((tr, n) => {
    if (tr.length < 2) return;
    const cu = path.cumul[n];
    // Recalage du trait : le chemin dessiné à la main n'épouse pas exactement la police (le trait vertical de ط passe
    // un peu à côté du sien, par exemple). On cherche le petit décalage qui pose le trait le mieux sur l'encre ; sans lui,
    // ce trait laisserait sa partie de la lettre s'allumer avec le trait d'avant. Le chemin affiché, lui, ne change pas.
    const ech = []; for (let q = 0; q < tr.length; q += 3) ech.push([tr[q][0] * k, tr[q][1] * k]);
    const cout = (dx, dy) => ech.reduce((s, p) => s + ecart(p[0] + dx, p[1] + dy), 0) / ech.length + 0.04 * Math.hypot(dx, dy);
    let tx = 0, ty = 0, cMin = cout(0, 0); const lim = Math.round(taille * 0.2);
    for (let dy = -lim; dy <= lim; dy += 2) for (let dx = -lim; dx <= lim; dx += 2) { const c = cout(dx, dy); if (c < cMin - 1e-6) { cMin = c; tx = dx; ty = dy; } }
    const ici = [];   // positions du trait recalé, tous les 1,5 pixel : [x, y, moment, distance à l'encre]
    for (let q = 1; q < tr.length; q++) {
      const ax = tr[q - 1][0] * k + tx, ay = tr[q - 1][1] * k + ty, bx = tr[q][0] * k + tx, by = tr[q][1] * k + ty, nb = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5));
      for (let u = q === 1 ? 0 : 1; u <= nb; u++) {
        const f = u / nb, x = ax + (bx - ax) * f, y = ay + (by - ay) * f; ici.push([x, y, debut[n] + cu[q - 1] + (cu[q] - cu[q - 1]) * f, ecart(x, y)]);
      }
    }
    // Faux croisements : là où le chemin sort de l'encre, traverse un autre trait de la lettre sur à peine son épaisseur, puis
    // ressort (le corps de ط qui coupe la hampe parce que le chemin n'a pas tout à fait la forme de la police), il ne
    // l'écrit pas : ces positions ne comptent pas, sinon une bande de l'autre trait s'allumerait en avance.
    const ignore = new Uint8Array(ici.length), dehors = q => ici[q][3] > epais * 0.35;
    for (let q = 0; q < ici.length; q++) {
      if (ici[q][3] > 0.5) continue;
      let f = q; while (f + 1 < ici.length && ici[f + 1][3] <= 0.5) f++;
      const lg = (f - q) * 1.5;
      if (lg < epais * 1.8) {
        let a = q - 1; while (a >= 0 && !dehors(a) && (q - a) * 1.5 < epais) a--;
        let b = f + 1; while (b < ici.length && !dehors(b) && (b - f) * 1.5 < epais) b++;
        // Les positions voisines, encore assez près pour être posées sur ce trait-là, sont écartées aussi
        if (a >= 0 && b < ici.length && dehors(a) && dehors(b)) {
          while (a > 0 && ici[a][3] < R && (q - a) * 1.5 < epais * 2.2) a--;
          while (b < ici.length - 1 && ici[b][3] < R && (b - f) * 1.5 < epais * 2.2) b++;
          for (let z = a; z <= b; z++) ignore[z] = 1;
        }
      }
      q = f;
    }
    ici.forEach(([x, y, s], q) => {
      corps.push([x, y, s]);
      if (ignore[q]) return;
      // L'encre la plus proche, dans un rayon R
      let best = -1, bd = R * R; const cx = Math.round(x), cy = Math.round(y), r = Math.ceil(R);
      for (let yy = Math.max(0, cy - r); yy <= Math.min(h - 1, cy + r); yy++) for (let xx = Math.max(0, cx - r); xx <= Math.min(w - 1, cx + r); xx++) {
        const i = yy * w + xx; if (A[i] <= 60 || pris[i]) continue; const dd = (xx - x) ** 2 + (yy - y) ** 2; if (dd < bd) { bd = dd; best = i; } }
      if (best >= 0) pousser([0, s, best]);
    });
  });
  // Propagation dans l'encre, de proche en proche : chaque pixel prend le moment du passage le plus proche par l'intérieur
  // de la lettre ; à égalité, le passage le plus ancien. Un pixel un peu à l'écart du chemin (bord d'un trait épais, bout
  // arrondi d'un trait) s'allume un tout petit peu après : le front a la forme arrondie d'une pointe de pinceau, et le
  // bout d'un trait ne s'allume pas d'un bloc.
  while (file.length) {
    const [dd, s, i] = sortir();
    if (T[i] >= 0) continue; T[i] = s + dd / k * 0.5; dist[i] = dd;
    voisins(i, (j, pas) => { if (A[j] && !pris[j] && T[j] < 0 && dd + pas < dist[j]) { dist[j] = dd + pas; pousser([dd + pas, s, j]); } });
  }
  // Un morceau d'encre que le chemin n'approche pas (rare) : le moment du point du chemin le plus proche à vol d'oiseau
  for (let i = 0; i < N; i++) if (A[i] && T[i] < 0) { const x = i % w, y = (i / w) | 0; let bs = path.total, bd = Infinity; corps.forEach(p => { const dd = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (dd < bd) { bd = dd; bs = p[2]; } }); T[i] = bs; }
  // Lissage de la carte : deux passes de moyenne sur les pixels d'encre voisins. Là où deux passages du chemin se
  // partagent un trait (le retour de ح sous sa barre, par exemple), la frontière entre eux devient une pente douce au lieu
  // d'un escalier de pixels.
  for (let passe = 0; passe < 2; passe++) {
    const L = T.slice();
    for (let i = 0; i < N; i++) {
      if (!A[i]) continue;
      let som = T[i] * 4, poids = 4;
      voisins(i, (j, pas) => { if (A[j] && T[j] >= 0) { const q = pas > 1 ? 1 : 2; som += T[j] * q; poids += q; } });
      L[i] = som / poids;
    }
    T.set(L);
  }
  // 4. La même lettre à la netteté de l'écran (pixels réels). Le moment de chaque pixel réel est interpolé entre les
  // quatre pixels CSS qui l'entourent : pas de blocs de 2×2 ou 3×3 sur un écran à haute densité.
  const bx = Math.max(0, Math.floor(x0 * d) - 2), by = Math.max(0, Math.floor(y0 * d) - 2);
  const bw = Math.min(tbl.guide.width, Math.ceil((x1 + 1) * d) + 2) - bx, bh = Math.min(tbl.guide.height, Math.ceil((y1 + 1) * d) + 2) - by;
  const toile = document.createElement("canvas"); toile.width = Math.max(1, bw); toile.height = Math.max(1, bh);
  const W = toile.width, H = toile.height, tg = toile.getContext("2d", { willReadFrequently: true });
  tg.fillStyle = tbColor("--gold"); tg.fillRect(0, 0, 1, 1); const or = tg.getImageData(0, 0, 1, 1).data; tg.clearRect(0, 0, 1, 1);
  tg.setTransform(d, 0, 0, d, -bx, -by); tg.fillStyle = "#000"; tbGlyph(tg, tbl.ctx.text, tbl.w, tbl.h); tg.setTransform(1, 0, 0, 1, 0, 0);
  const img = tg.getImageData(0, 0, W, H), D = img.data, Td = new Float32Array(W * H).fill(-1);   // la lettre noire sert de patron, puis la toile est vidée
  const lu = (xx, yy) => (xx >= 0 && yy >= 0 && xx < w && yy < h ? T[yy * w + xx] : -1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = y * W + x; if (!D[o * 4 + 3]) continue;
    const fx = (x + bx + 0.5) / d - 0.5, fy = (y + by + 0.5) / d - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy;
    let som = 0, poids = 0;
    [[0, 0, (1 - ux) * (1 - uy)], [1, 0, ux * (1 - uy)], [0, 1, (1 - ux) * uy], [1, 1, ux * uy]].forEach(([dx, dy, q]) => { const t = lu(ix + dx, iy + dy); if (t >= 0 && q > 0) { som += t * q; poids += q; } });
    if (!poids) for (let dy = -1; dy <= 2 && !poids; dy++) for (let dx = -1; dx <= 2 && !poids; dx++) { const t = lu(ix + dx, iy + dy); if (t >= 0) { som = t; poids = 1; } }
    Td[o] = poids ? som / poids : path.total;
  }
  // Bord du front, pixel par pixel : sa largeur en temps est au moins TB_DOUX, et au moins ce que le moment change d'un
  // pixel au voisin (là où il change vite, une frontière nette entre deux passages, le pixel est à moitié allumé quand
  // le front passe en son milieu : le bord est lissé comme celui d'une lettre, sans marches).
  const liste = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = y * W + x, a = D[o * 4 + 3]; D[o * 4] = or[0]; D[o * 4 + 1] = or[1]; D[o * 4 + 2] = or[2]; D[o * 4 + 3] = 0;
    if (!a) continue;
    const t = Td[o], v = (xx, yy) => (xx >= 0 && yy >= 0 && xx < W && yy < H && Td[yy * W + xx] >= 0 ? Td[yy * W + xx] : t);
    const gx = (v(x + 1, y) - v(x - 1, y)) / 2, gy = (v(x, y + 1) - v(x, y - 1)) / 2;
    const larg = Math.min(TB_DOUX * 6, Math.max(TB_DOUX, Math.hypot(gx, gy)));
    liste.push([t - larg / 2, o, a, larg]);
  }
  tg.putImageData(img, 0, 0);   // toile vide (or, transparent) : rien n'est allumé au départ
  // Rangés par moment de début : à chaque image, on ne touche qu'aux pixels qui s'allument à cet instant
  liste.sort((p, q) => p[0] - q[0]);
  const carte = { bx, by, toile, tg, img, temps: Float32Array.from(liste, p => p[0]), larg: Float32Array.from(liste, p => p[3]), pos: Uint32Array.from(liste, p => p[1]),
    opa: Uint8Array.from(liste, p => p[2]), fait: 0, haut: 0, S: -Infinity, centres, fond: null };
  // Moment où le dernier pixel est tout à fait allumé : la fin de l'animation (un peu après la fin du chemin, à cause des bords)
  carte.fin = liste.reduce((m, p) => Math.max(m, p[0] + p[3]), path.total);
  return (path.carte = carte);
}
// Allume la lettre jusqu'au moment S (en unités de chemin). Ne retouche que les pixels qui changent depuis l'image d'avant.
function tbAllume(carte, S) {
  const D = carte.img.data, W = carte.toile.width, n = carte.temps.length;
  if (S < carte.S) { for (let i = 0; i < carte.haut; i++) D[carte.pos[i] * 4 + 3] = 0; carte.fait = carte.haut = 0; carte.tg.putImageData(carte.img, 0, 0); }   // on rejoue depuis le début
  carte.S = S;
  let x0 = W, y0 = Infinity, x1 = -1, y1 = -1, i = carte.fait;
  for (; i < n && carte.temps[i] <= S; i++) {
    // Bord adouci : un pixel atteint par le front s'allume progressivement (sur sa largeur de bord), pas d'un coup
    const v = (S - carte.temps[i]) / carte.larg[i], p = carte.pos[i];
    D[p * 4 + 3] = v >= 1 ? carte.opa[i] : Math.round(carte.opa[i] * v);
    const x = p % W, y = (p / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  carte.haut = Math.max(carte.haut, i);
  // Les pixels du début de la liste déjà tout allumés ne seront plus retouchés
  while (carte.fait < n && carte.temps[carte.fait] + carte.larg[carte.fait] <= S) carte.fait++;
  if (x1 >= 0) carte.tg.putImageData(carte.img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);   // seulement la partie qui a changé
}

// --- Calque du dessous : ligne d'écriture, modèle en filigrane, numéros et flèches du sens d'écriture.
// part (pendant l'animation) : fraction du chemin déjà parcourue, de 0 à 1 ; la lettre s'allume sur cette partie.
function tbFond(g, w, h) {
  g.strokeStyle = tbColor("--line"); g.lineWidth = 2; g.setLineDash([6, 8]);
  g.beginPath(); g.moveTo(12, h * 0.66); g.lineTo(w - 12, h * 0.66); g.stroke(); g.setLineDash([]);
  if (!tbl.ctx.text || !tbl.modele) return;
  g.globalAlpha = 0.22; g.fillStyle = tbColor("--ink"); tbGlyph(g, tbl.ctx.text, w, h); g.globalAlpha = 1;
}
function tbDrawGuide(part) {
  const g = tbl.guide.getContext("2d"), w = tbl.w, h = tbl.h, k = w / 1000, gold = tbColor("--gold");
  const path = tbl.ctx.text && tbl.modele ? tbPath() : null;
  if (part != null && path) {
    // Pendant l'animation : le fond (ligne et filigrane) est dessiné une fois et gardé ; à chaque image, on le recopie
    // et on pose par-dessus la lettre allumée jusqu'où la main est arrivée.
    const carte = tbCarte(path);
    if (!carte.fond) { carte.fond = document.createElement("canvas"); carte.fond.width = tbl.guide.width; carte.fond.height = tbl.guide.height;
      const f = carte.fond.getContext("2d"); f.setTransform(tbl.d, 0, 0, tbl.d, 0, 0); tbFond(f, w, h); }
    tbAllume(carte, Math.min(1, part) * carte.fin);   // à la fin (part = 1), tout est allumé en plein
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tbl.guide.width, tbl.guide.height);
    g.drawImage(carte.fond, 0, 0); g.drawImage(carte.toile, carte.bx, carte.by); g.restore();
    return;
  }
  g.clearRect(0, 0, w, h); tbFond(g, w, h);
  if (!path || !tbl.fleches) return;
  // Au repos : le chemin en trait fin, le numéro de chaque trait à son départ, et une flèche dans le sens de l'écriture.
  // Le numéro d'un point de la lettre est posé à côté du point tel qu'il est dans la police.
  const centres = tbCarte(path).centres;
  path.traits.forEach((tr, n) => {
    const a = tr[0];
    if (tr.length === 1) { const c = centres[n] || [a[0] * k, a[1] * k]; g.fillStyle = gold; g.font = "600 13px Fredoka, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle"; g.direction = "ltr"; g.fillText(String(n + 1), c[0] + 8, c[1] - 9); return; }
    g.strokeStyle = gold; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round"; g.globalAlpha = 0.6;
    g.beginPath(); tr.forEach((p, i) => (i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k))); g.stroke(); g.globalAlpha = 1;
    const i = Math.min(tr.length - 1, Math.max(1, Math.round(tr.length * 0.3))), b = tr[i], p0 = tr[i - 1], ang = Math.atan2(b[1] - p0[1], b[0] - p0[0]);
    g.fillStyle = gold; g.beginPath(); g.arc(a[0] * k, a[1] * k, 10, 0, 7); g.fill();
    g.fillStyle = tbColor("--paper"); g.font = "600 13px Fredoka, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "ltr"; g.fillText(String(n + 1), a[0] * k, a[1] * k + 1);
    g.save(); g.translate(b[0] * k, b[1] * k); g.rotate(ang); g.fillStyle = gold; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore();
  });
}
// Animation : la lettre s'allume le long du chemin à vitesse régulière, image par image, puis reste allumée un instant.
// La carte d'allumage est préparée avant de lancer l'horloge, et l'horloge part de la première image réellement affichée :
// pas de bond au départ.
function tbPlay() {
  const path = tbPath(); if (!path) return;
  cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); tbCarte(path);
  const dur = Math.min(5200, Math.max(1800, path.total * 2.4)); let start = 0;
  const step = now => {
    if (!tbl) return;
    if (!start) start = now;
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
// Statistiques : comment le tableau a été quitté (Terminé, croix, recommencer), combien de traits, en combien de temps,
// au doigt, au stylet ou à la souris, avec ou sans le modèle affiché. Les traits eux-mêmes ne partent pas ici.
function tbNoterFin(issue) {
  if (typeof noter !== "function") return;
  noter("tableau_fin", tbl.ctx.contexte, { issue, traits: tbl.traits.length, ms: Math.min(Date.now() - tbl.ouvert, 3600000),
    pointage: tbl.appareil || null, modele: Boolean(tbl.modele), lettre: Boolean(tbl.ctx.lettre) });
}
function tbClick(e) {
  const el = e.target.closest("[data-tb]"); if (!el || !tbl) return;
  switch (el.dataset.tb) {
    case "close": case "done": tbNoterFin(el.dataset.tb === "done" ? "termine" : "croix"); tbKeep(false); tbRemember(); tableauClose(); return;   // la croix garde le tracé comme « Terminé »
    case "again": tbNoterFin("recommencer"); tbKeep(false); tbl.traits = []; tbl.envoye = 0; tbl.t0 = 0; tbRemember(); tbDrawInk(); tbMsg(""); break;
    case "undo": tbl.traits.pop(); tbDrawInk(); break;
    case "modele": tbl.modele = !tbl.modele; cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); tbDrawGuide(); break;
    case "fleches": tbl.fleches = !tbl.fleches; cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); tbDrawGuide(); break;
    case "play": tbPlay(); return;
    case "ref": tbKeep(true); tbl.traits = []; tbl.envoye = 0; tbDrawInk(); tbDrawGuide(); break;
  }
  if (tbl) tbChrome();
}
