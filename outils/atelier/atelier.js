"use strict";
/* Atelier des tracés : les 28 lettres côte à côte, chacune avec son animation du sens d'écriture, pour les vérifier
   sans passer par l'application. Le code du tableau (js/tableau.js) et les chemins (js/tableau-lettres.js) sont ceux de
   l'application, copiés tels quels dans la page : ce qu'on voit ici est ce que voit l'élève.

   Deux modèles :
   - « Police » : la lettre de l'application (Scheherazade New) qui s'allume, exactement comme sur le tableau ;
   - « À la main » : la même lettre écrite par une plume biseautée (calame) qui suit le chemin, sans aucune police.
     La plume est un petit segment de largeur et d'angle fixes : là où le trait va dans le sens de la plume il est fin,
     en travers il est épais, comme avec un vrai calame. L'animation est alors exacte par construction : on dessine
     simplement le chemin jusqu'où la main est arrivée.

   Le tableau de l'application ne gère qu'un tableau ouvert à la fois (variable tbl). Ici, chaque carte a son propre
   « tbl », qu'on prête au code du tableau le temps de dessiner cette carte. */

// Ordre de l'alphabet de l'application, avec le nom de chaque lettre
const LETTRES = [["ا", "alif", "أَلِف"], ["ب", "bāʾ", "باء"], ["ت", "tāʾ", "تاء"], ["ث", "thāʾ", "ثاء"], ["ج", "jīm", "جيم"], ["ح", "ḥāʾ", "حاء"],
  ["خ", "khāʾ", "خاء"], ["د", "dāl", "دال"], ["ذ", "dhāl", "ذال"], ["ر", "rāʾ", "راء"], ["ز", "zāy", "زاي"], ["س", "sīn", "سين"], ["ش", "shīn", "شين"],
  ["ص", "ṣād", "صاد"], ["ض", "ḍād", "ضاد"], ["ط", "ṭāʾ", "طاء"], ["ظ", "ẓāʾ", "ظاء"], ["ع", "ʿayn", "عَيْن"], ["غ", "ghayn", "غَيْن"], ["ف", "fāʾ", "فاء"],
  ["ق", "qāf", "قاف"], ["ك", "kāf", "كاف"], ["ل", "lām", "لام"], ["م", "mīm", "ميم"], ["ن", "nūn", "نون"], ["ه", "hāʾ", "هاء"], ["و", "wāw", "واو"], ["ي", "yāʾ", "ياء"]];
const CLE = "mufrad-atelier-traces";
const reglage = { forme: "isolee", modele: "main", vitesse: 1, fleches: true, largeur: 34, angle: 60 };
const MAINTIEN = 1100, REPOS = 1500;   // après l'animation : lettre allumée (ms), puis vue au repos (ms), puis on recommence
let etats = {};
try { etats = JSON.parse(localStorage.getItem(CLE) || "{}"); } catch (e) { etats = {}; }
const garder = () => { try { localStorage.setItem(CLE, JSON.stringify(etats)); } catch (e) {} };
const $ = s => document.querySelector(s);

// --- Durée d'une animation : la même règle que sur le tableau (tbPlay), divisée par la vitesse choisie
const duree = total => Math.min(5200, Math.max(1800, total * 2.4)) / reglage.vitesse;

// --- Formes : isolée, début, milieu, fin. Les six lettres qui ne s'attachent pas à la suivante n'ont que l'isolée et la fin :
// leur début est la forme isolée, leur milieu la forme de fin (comme formsOf dans l'application).
const NON_LIEES = "ادذرزو";
function formeDe(L) {
  const f = reglage.forme;
  if (!NON_LIEES.includes(L) || f === "isolee" || f === "fin") return f;
  return f === "debut" ? "isolee" : "fin";
}
function texteDe(L, f) { const T = "ـ"; return { isolee: L, debut: L + T, milieu: T + L + T, fin: T + L }[f]; }
// --- Modèle « À la main » : chemin du fichier, arrondi comme sur le tableau, dans le repère 1000 × 600 du tableau
function cheminMain(L, f) {
  const base = f === "isolee" ? TB_LETTRES[L] : (TB_FORMES[L] || {})[f]; if (!base) return null;
  return tbMeasure({ traits: base.map(tr => (tr.length > 1 ? tbSpline(tr) : tr)) });
}
// Un coup de plume de a à b (points en pixels) : le quadrilatère balayé par le bec de la plume.
// Un trait fin du même ton sur ses bords évite les fines lignes claires entre deux morceaux voisins.
function bec(g, a, b, n) {
  g.beginPath(); g.moveTo(a[0] + n[0], a[1] + n[1]); g.lineTo(b[0] + n[0], b[1] + n[1]); g.lineTo(b[0] - n[0], b[1] - n[1]); g.lineTo(a[0] - n[0], a[1] - n[1]); g.closePath();
  g.fill(); g.stroke();
}
// Écrit la lettre à la plume jusqu'au moment S (en unités de chemin ; Infinity = toute la lettre).
function ecrireMain(g, ch, k, S) {
  const W = reglage.largeur * k, ang = reglage.angle * Math.PI / 180, n = [Math.cos(ang) * W / 2, -Math.sin(ang) * W / 2];
  g.lineWidth = Math.max(1, W * 0.12); g.lineJoin = "round"; g.lineCap = "round";
  let debut = 0;
  ch.traits.forEach((tr, i) => {
    const L = ch.longueurs[i], fait = S - debut; debut += L;
    if (fait <= 0) return;
    if (tr.length === 1) {
      // Un point : la plume posée puis tirée d'un petit coup en travers de son bec, ce qui donne le losange des points.
      // Il apparaît au moment de son trait et grandit en un instant, puis reste.
      const t = Math.min(1, Math.max(0, (fait - L * 0.15) / (L * 0.55))); if (!t) return;
      const c = [tr[0][0] * k, tr[0][1] * k], u = [Math.sin(ang) * W * 0.38 * t, Math.cos(ang) * W * 0.38 * t], m = [n[0] * t, n[1] * t];
      bec(g, [c[0] - u[0], c[1] - u[1]], [c[0] + u[0], c[1] + u[1]], m); return;
    }
    const cu = ch.cumul[i];
    for (let q = 1; q < tr.length; q++) {
      if (cu[q - 1] >= fait) break;
      const a = [tr[q - 1][0] * k, tr[q - 1][1] * k]; let b = [tr[q][0] * k, tr[q][1] * k];
      if (cu[q] > fait) { const t = (fait - cu[q - 1]) / Math.max(1e-6, cu[q] - cu[q - 1]); b = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
      bec(g, a, b, n);
    }
  });
}
// Vue « À la main » complète d'une carte : ligne d'écriture, lettre en filigrane, partie écrite en or ; au repos, flèches.
function dessinerMain(c, f) {
  const g = c.toile.getContext("2d"), w = c.w, h = c.h, k = w / 1000, ch = c.main || (c.main = cheminMain(c.L, c.f));
  g.setTransform(c.d, 0, 0, c.d, 0, 0); g.clearRect(0, 0, w, h);
  g.strokeStyle = tbColor("--line"); g.lineWidth = 2; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(12, h * 0.66); g.lineTo(w - 12, h * 0.66); g.stroke(); g.setLineDash([]);
  if (!ch) return;
  // Filigrane : la lettre entière, pâle (dessinée opaque à part puis posée en transparence, pour que les morceaux ne se cumulent pas)
  const fil = c.filigrane || (c.filigrane = document.createElement("canvas"));
  if (fil.width !== c.toile.width || fil.height !== c.toile.height || c.filigraneCle !== reglage.largeur + ":" + reglage.angle) {
    fil.width = c.toile.width; fil.height = c.toile.height; c.filigraneCle = reglage.largeur + ":" + reglage.angle;
    const fg = fil.getContext("2d"); fg.setTransform(c.d, 0, 0, c.d, 0, 0); fg.fillStyle = fg.strokeStyle = tbColor("--ink"); ecrireMain(fg, ch, k, Infinity);
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = f == null && !reglage.fleches ? 0.9 : 0.2; g.drawImage(fil, 0, 0); g.restore();
  if (f != null) { g.fillStyle = g.strokeStyle = tbColor("--gold"); ecrireMain(g, ch, k, f >= 1 ? Infinity : f * ch.total); return; }
  if (!reglage.fleches) return;
  // Au repos : les mêmes numéros et flèches que sur le tableau
  const gold = tbColor("--gold");
  ch.traits.forEach((tr, n) => {
    const a = tr[0];
    g.font = "600 13px Fredoka, sans-serif"; g.direction = "ltr";
    if (tr.length === 1) { g.fillStyle = gold; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(String(n + 1), a[0] * k + 10, a[1] * k - 10); return; }
    g.strokeStyle = gold; g.lineWidth = 2; g.globalAlpha = 0.6; g.beginPath(); tr.forEach((p, i) => (i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k))); g.stroke(); g.globalAlpha = 1;
    const i = Math.min(tr.length - 1, Math.max(1, Math.round(tr.length * 0.3))), b = tr[i], p0 = tr[i - 1], ang = Math.atan2(b[1] - p0[1], b[0] - p0[0]);
    g.fillStyle = gold; g.beginPath(); g.arc(a[0] * k, a[1] * k, 10, 0, 7); g.fill();
    g.fillStyle = tbColor("--paper"); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n + 1), a[0] * k, a[1] * k + 1);
    g.save(); g.translate(b[0] * k, b[1] * k); g.rotate(ang); g.fillStyle = gold; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore();
  });
}

// --- Une carte (ou la vue agrandie) : taille de sa toile, puis dessin à l'instant f (0 à 1), ou au repos (f = null)
function tailler(c, largeurCss) {
  const w = Math.max(200, Math.round(largeurCss)), d = window.devicePixelRatio || 1;
  const f = formeDe(c.L);
  if (c.w === w && c.d === d && c.f === f) return;
  c.w = w; c.h = w * TB_RATIO; c.d = d; c.f = f; c.main = null; c.toile.width = Math.round(w * d); c.toile.height = Math.round(c.h * d);
  c.t = { ctx: { id: "atelier", text: texteDe(c.L, f), contexte: "atelier", montre: true, lettre: { ar: c.L }, cle: c.L }, forme: f, modele: true, fleches: true,
    guide: c.toile, w: c.w, h: c.h, d, path: null };
  c.filigrane = null;
}
function total(c) {
  if (reglage.modele === "main") return (c.main || (c.main = cheminMain(c.L, c.f)) || { total: 1 }).total;
  const avant = tbl; tbl = c.t; const p = tbPath(); tbl = avant; return p ? p.total : 1;
}
function dessiner(c, f) {
  if (!c.w) return;
  if (reglage.modele === "main") return dessinerMain(c, f);
  // Le code du tableau dessine sur « le » tableau ouvert : on lui prête celui de la carte le temps du dessin
  const avant = tbl; tbl = c.t; tbl.fleches = reglage.fleches;
  try { tbDrawGuide(f == null ? undefined : f); } finally { tbl = avant; }
}

// --- Les cartes
const cartes = LETTRES.map(([L, nom, ar]) => {
  const el = document.createElement("article"); el.className = "carte";
  el.innerHTML = `<div class="vue" title="Ouvrir en grand"><canvas></canvas></div><div class="pied">
    <div class="nom"><b>${nom} <small class="forme"></small></b><span class="ar">${ar}</span></div>
    <div class="ligne"><button class="rond" data-a="play" aria-label="Rejouer">▶</button><input type="range" min="0" max="1000" value="0" aria-label="Instant de l'animation"></div>
    <div class="etat"><button class="oui" data-a="bon" aria-pressed="false">Bon</button><button class="non" data-a="revoir" aria-pressed="false">À revoir</button></div>
    <textarea placeholder="Ce qui ne va pas (ex. : le début de la tête)"></textarea></div>`;
  const c = { L, nom, el, toile: el.querySelector("canvas"), curseur: el.querySelector("input"), note: el.querySelector("textarea"), visible: false, joue: true, debut: 0, phase: "anim" };
  el.querySelector(".vue").addEventListener("click", () => ouvrirGrand(c));
  el.addEventListener("click", e => {
    const a = e.target.closest("[data-a]"); if (!a) return;
    if (a.dataset.a === "play") relancer(c);
    else { const k = cle(c), e0 = etats[k] || {}; e0.etat = e0.etat === a.dataset.a ? null : a.dataset.a; etats[k] = e0; garder(); majEtat(c); }
  });
  c.curseur.addEventListener("input", () => { c.joue = false; dessiner(c, +c.curseur.value / 1000); });
  c.note.addEventListener("input", () => { const k = cle(c); etats[k] = { ...(etats[k] || {}), note: c.note.value }; garder(); });
  $("#grille").appendChild(el);
  return c;
});
// Les avis sont gardés par lettre et par forme (la forme isolée garde la clé simple des premières versions)
const cle = c => (formeDe(c.L) === "isolee" ? c.L : c.L + ":" + formeDe(c.L));
function majEtat(c) {
  const e = (etats[cle(c)] || {}).etat; c.note.value = (etats[cle(c)] || {}).note || "";
  c.el.querySelector(".forme").textContent = reglage.forme !== formeDe(c.L) ? (formeDe(c.L) === "isolee" ? "même dessin qu'isolée" : "même dessin qu'en fin") : "";
  c.el.classList.toggle("bon", e === "bon"); c.el.classList.toggle("revoir", e === "revoir");
  c.el.querySelector(".oui").setAttribute("aria-pressed", e === "bon"); c.el.querySelector(".non").setAttribute("aria-pressed", e === "revoir");
  const n = cartes.filter(x => x !== c).map(x => etats[cle(x)] || {}).concat([etats[cle(c)] || {}]), b = n.filter(x => x.etat === "bon").length, r = n.filter(x => x.etat === "revoir").length;
  $("#compte").textContent = `${b} bonnes · ${r} à revoir · ${n.length - b - r} pas encore vues`;
}
function relancer(c) { c.joue = true; c.debut = performance.now(); c.phase = "anim"; c.dur = duree(total(c)); }
// La toile d'une carte est le tableau entier, dont on ne montre que la bande centrale (de 20 % à 80 % de la largeur),
// là où sont les lettres : la carte est carrée.
function mettreEnPlace() {
  cartes.forEach(c => {
    const l = c.el.querySelector(".vue").clientWidth; if (!l) return;
    const lt = l / 0.6; c.toile.style.width = lt + "px"; c.toile.style.left = -lt * 0.2 + "px";
    tailler(c, lt); c.dur = duree(total(c)); dessiner(c, c.joue ? 0 : +c.curseur.value / 1000);
  });
}
// Seules les cartes à l'écran s'animent
const obs = new IntersectionObserver(es => es.forEach(e => { cartes.find(x => x.el === e.target).visible = e.isIntersecting; }), { rootMargin: "100px" });
cartes.forEach(c => obs.observe(c.el));

// --- Boucle d'images : animation, lettre allumée un instant, vue au repos, et on recommence
function boucle(now) {
  [...cartes, grand].forEach(c => {
    if (!c.visible || !c.joue || !c.w) return;
    if (!c.debut) relancer(c);
    const t = now - c.debut;
    if (t < c.dur) { const f = t / c.dur; dessiner(c, f); c.curseur.value = Math.round(f * 1000); if (c === grand) majTemps(); return; }
    if (t < c.dur + MAINTIEN) { if (c.phase !== "allume") { c.phase = "allume"; dessiner(c, 1); c.curseur.value = 1000; } return; }
    if (t < c.dur + MAINTIEN + REPOS) { if (c.phase !== "repos") { c.phase = "repos"; dessiner(c, null); } return; }
    relancer(c);
  });
  requestAnimationFrame(boucle);
}

// --- Vue agrandie : le tableau entier, un curseur fin et des pas de 1 %
const grand = { L: null, toile: $("#gToile"), curseur: $("#gCurseur"), visible: false, joue: false };
function ouvrirGrand(c) {
  grand.L = c.L; grand.w = 0; grand.main = null; $("#gNom").textContent = c.nom + " — " + texteDe(c.L, formeDe(c.L));
  $("#grand").classList.add("ouvert"); grand.visible = true;
  tailler(grand, $(".vueG").clientWidth); relancer(grand);
}
function majTemps() { $("#gTemps").textContent = Math.round(+grand.curseur.value / 10) + " %"; }
const pas = d => { grand.joue = false; grand.curseur.value = Math.min(1000, Math.max(0, +grand.curseur.value + d)); dessiner(grand, +grand.curseur.value / 1000); majTemps(); };
$("#gMoins").onclick = () => pas(-10); $("#gPlus").onclick = () => pas(10);
$("#gPlay").onclick = () => relancer(grand);
grand.curseur.addEventListener("input", () => pas(0));
const fermer = () => { $("#grand").classList.remove("ouvert"); grand.visible = false; };
$("#gFermer").onclick = fermer; $("#grand").addEventListener("click", e => { if (e.target.id === "grand") fermer(); });
document.addEventListener("keydown", e => { if (!grand.visible) return; if (e.key === "Escape") fermer(); if (e.key === "ArrowLeft") pas(-10); if (e.key === "ArrowRight") pas(10); if (e.key === " ") { e.preventDefault(); relancer(grand); } });

// --- Réglages
function choix(id, cle, conv) {
  $(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $(id).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    reglage[cle] = conv(b.dataset.v); document.body.classList.toggle("main", reglage.modele === "main");
    if (cle === "forme") { mettreEnPlace(); cartes.forEach(c => { majEtat(c); relancer(c); }); if (grand.visible) { grand.w = 0; tailler(grand, $(".vueG").clientWidth); relancer(grand); } return; }
    [...cartes, grand].forEach(c => { if (c.w) { c.dur = duree(total(c)); if (!c.joue) dessiner(c, +c.curseur.value / 1000); else if (c.phase === "repos") dessiner(c, null); } });
  });
}
choix("#forme", "forme", v => v);
choix("#modele", "modele", v => v); choix("#vitesse", "vitesse", Number); choix("#fleches", "fleches", v => v === "1");
const plumeVal = () => { $("#plumeVal").textContent = reglage.largeur + " · " + reglage.angle + "°"; };
["largeur", "angle"].forEach(id => $("#" + id).addEventListener("input", e => { reglage[id] = +e.target.value; plumeVal(); [...cartes, grand].forEach(c => { if (c.w && !c.joue) dessiner(c, +c.curseur.value / 1000); }); }));
plumeVal();
$("#rejouer").onclick = () => cartes.forEach(relancer);
// Bilan : texte à me renvoyer, copié dans le presse-papiers (ou affiché pour le copier soi-même)
$("#bilan").onclick = async () => {
  const NOMS = { isolee: "isolée", debut: "début", milieu: "milieu", fin: "fin" };
  const lignes = Object.entries(etats).filter(([, e]) => e.etat || e.note).map(([k, e]) => { const [L, f = "isolee"] = k.split(":"), nom = (LETTRES.find(x => x[0] === L) || [])[1];
    return `${L} (${nom}, ${NOMS[f]}) : ${e.etat === "bon" ? "bon" : e.etat === "revoir" ? "à revoir" : "sans avis"}${e.note ? " — " + e.note.trim() : ""}`; });
  const texte = "Bilan des tracés (vu avec le modèle « " + (reglage.modele === "main" ? "à la main" : "police") + " »)\n" + (lignes.join("\n") || "rien de noté pour l'instant");
  const zone = $("#bilanTexte"); zone.value = texte;
  try { await navigator.clipboard.writeText(texte); $("#bilan").textContent = "Bilan copié ✓"; setTimeout(() => { $("#bilan").textContent = "Copier le bilan"; }, 1800); }
  catch (e) { zone.style.display = "block"; zone.select(); }
};

cartes.forEach(majEtat);
// Les lettres sont mesurées dans leur police : on attend qu'elle soit chargée
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { mettreEnPlace(); requestAnimationFrame(boucle); });
window.addEventListener("resize", () => { mettreEnPlace(); if (grand.visible) { grand.w = 0; tailler(grand, $(".vueG").clientWidth); } });
