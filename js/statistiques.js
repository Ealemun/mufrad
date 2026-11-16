// Mufrad — écran « Statistiques », réservé aux administrateurs (adresse #statistiques).
// Lit les vues toutes prêtes de supabase/0007_statistiques.sql ; la base ne renvoie rien à qui n'est pas administrateur.
// Ce fichier ne fait qu'afficher : la collecte elle-même est dans js/app.js (section 11).

let statsData = null;        // dernières données lues : nom de la vue -> lignes
let statsMsg = "";           // message d'état (chargement, erreur)
let statsCharge = false;     // une lecture est en cours

// Vues lues, avec le nombre de lignes gardées pour l'écran
const STATS_VUES = {
  stats_par_jour: 30, stats_semaines: 12, stats_lecons: 200, stats_questions: 15, stats_confusions: 15,
  stats_grammaire: 10, stats_audio: 10, stats_tableau: 10, stats_erreurs: 10, stats_appareils: 10, stats_heures: 200
};

// Lit toutes les vues en parallèle, puis redessine
async function statsCharger() {
  if (!sb || statsCharge) return;
  statsCharge = true; statsMsg = "Lecture des statistiques…"; render();
  try {
    const noms = Object.keys(STATS_VUES);
    const res = await Promise.all(noms.map(v => sb.from(v).select("*").limit(STATS_VUES[v])));
    const err = res.find(r => r.error);
    if (err) statsMsg = /does not exist|schema cache/i.test(err.error.message || "")
      ? "Les vues n'existent pas encore : exécutez supabase/0007_statistiques.sql dans l'éditeur SQL de Supabase."
      : "Lecture impossible : " + err.error.message;
    else { statsData = {}; noms.forEach((v, i) => { statsData[v] = res[i].data || []; }); statsMsg = ""; }
  } catch (e) { statsMsg = "Lecture impossible (réseau ?)."; }
  statsCharge = false; render();
}

// Nom lisible d'un élément du vocabulaire : le mot arabe et sa traduction, sinon l'identifiant brut
// (le mot arabe sur une seule ligne, la traduction en petit dessous)
const statsMot = id => (BY_ID[id] ? `<span class="st-mot">${AR(BY_ID[id].ar)}<small>${esc(BY_ID[id].fr || "")}</small></span>` : `<code>${esc(id || "")}</code>`);
// Nom court des exercices : du mot arabe vers le français, l'inverse, à l'écoute, lettres
const STATS_EX = { ar2fr: "ar → fr", fr2ar: "fr → ar", listen: "écoute", n2l: "nom → lettre", l2n: "lettre → nom", f2l: "forme → lettre" };
const statsNb = n => (n == null ? "—" : esc(String(n).replace(".", ",")));

// Un tableau simple : en-têtes, puis une ligne par entrée (cellules déjà en HTML)
function statsTable(entetes, lignes) {
  if (!lignes.length) return `<p class="muted">Pas encore de données.</p>`;
  return `<div class="st-scroll"><table class="st-table"><thead><tr>${entetes.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${lignes.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

// Visiteurs par jour sur 30 jours : barres fines, arrondies en haut.
// Le détail d'un jour s'affiche en survolant au curseur ou en touchant au doigt (voir statsPointe plus bas).
let statsSerie = [];         // les 30 jours affichés : { k (date), n (visiteurs), j (ligne complète de stats_par_jour) }
function statsBarres(jours) {
  const t = today(), parJour = {};
  jours.forEach(j => { parJour[j.jour] = j; });
  statsSerie = Array.from({ length: 30 }, (x, i) => { const k = addDays(t, i - 29); return { k, n: parJour[k] ? Number(parJour[k].visiteurs) || 0 : 0, j: parJour[k] || null }; });
  const max = Math.max(1, ...statsSerie.map(x => x.n)), W = 600, H = 140, pas = W / 30, larg = pas - 4;
  const barres = statsSerie.map((x, i) => {
    const h = x.n ? Math.max(3, (H - 20) * x.n / max) : 0;
    // Une barre vide garde un petit trait au ras de l'axe, pour qu'on voie qu'il y a un jour à cet endroit
    return h ? `<path class="st-bar" data-i="${i}" d="M${i * pas + 2},${H} v${-(h - 4)} q0,-4 4,-4 h${larg - 8} q4,0 4,4 v${h - 4} z"/>`
             : `<rect class="st-bar vide" data-i="${i}" x="${i * pas + 2}" y="${H - 2}" width="${larg}" height="2"/>`;
  }).join("");
  return `<div class="st-chart-box">
    <div class="st-tip" role="status" aria-live="polite" hidden></div>
    <svg class="st-chart" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="Visiteurs par jour sur les 30 derniers jours, au plus ${max}. Survolez ou touchez une barre pour le détail du jour.">
    <line class="st-axe" x1="0" y1="${H}" x2="${W}" y2="${H}"/>
    <text class="st-lbl" x="0" y="10">${max}</text>
    ${barres}
    <text class="st-lbl" x="0" y="${H + 15}">${statsSerie[0].k.slice(8)}/${statsSerie[0].k.slice(5, 7)}</text>
    <text class="st-lbl" x="${W}" y="${H + 15}" text-anchor="end">aujourd'hui</text></svg></div>`;
}

// Détail d'un jour, au curseur ou au doigt : la barre la plus proche du pointeur est mise en avant
// et une bulle donne la date et les chiffres du jour. La bulle reste au-dessus du graphique sans en sortir.
const STATS_JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
function statsPointe(e) {
  const box = e.target && e.target.closest ? e.target.closest(".st-chart-box") : null;
  if (!box || !statsSerie.length) return;
  const svg = box.querySelector("svg"), tip = box.querySelector(".st-tip"), r = svg.getBoundingClientRect();
  // Rang du jour sous le pointeur, d'après la position horizontale dans le graphique
  const i = Math.max(0, Math.min(29, Math.floor((e.clientX - r.left) / r.width * 30)));
  const x = statsSerie[i], j = x.j || {};
  box.querySelectorAll(".st-bar").forEach(b => b.classList.toggle("on", Number(b.dataset.i) === i));
  const date = `${STATS_JOURS[dateOf(x.k).getDay()]} ${x.k.slice(8)}/${x.k.slice(5, 7)}`;
  tip.innerHTML = `<b>${esc(date)}</b><span>${x.n} visiteur${x.n > 1 ? "s" : ""}</span>`
    + (x.j ? `<span>${statsNb(j.visites)} visite${j.visites > 1 ? "s" : ""} · ${statsNb(j.seances_finies)} séance${j.seances_finies > 1 ? "s" : ""} finie${j.seances_finies > 1 ? "s" : ""}</span>
       <span>${statsNb(j.reponses)} réponse${j.reponses > 1 ? "s" : ""}${j.reussite_pct != null ? " · " + statsNb(j.reussite_pct) + " % justes" : ""}</span>
       ${j.minutes_actives_mediane != null ? `<span>${statsNb(j.minutes_actives_mediane)} min actives (médiane)</span>` : ""}` : "");
  tip.hidden = false;
  // Placement : centré sur la barre, mais toujours dans la largeur du graphique
  const bw = box.clientWidth, centre = (i + 0.5) / 30 * r.width, tw = tip.offsetWidth;
  tip.style.left = Math.max(0, Math.min(bw - tw, centre - tw / 2)) + "px";
}
// Cacher la bulle : le curseur quitte le graphique, ou le doigt touche ailleurs sur la page
function statsCache(box) {
  if (!box) return;
  const tip = box.querySelector(".st-tip"); if (tip) tip.hidden = true;
  box.querySelectorAll(".st-bar.on").forEach(b => b.classList.remove("on"));
}
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("pointermove", statsPointe);
  document.addEventListener("pointerdown", e => {
    if (e.target && e.target.closest && e.target.closest(".st-chart-box")) statsPointe(e);   // toucher une barre : détail du jour
    else if (document.querySelectorAll) document.querySelectorAll(".st-chart-box").forEach(statsCache);   // toucher ailleurs : on cache
  });
  // La souris sort du graphique : on cache (au doigt, la bulle reste jusqu'au prochain appui ailleurs)
  document.addEventListener("pointerout", e => {
    const box = e.target && e.target.closest ? e.target.closest(".st-chart-box") : null;
    if (box && e.pointerType === "mouse" && !(e.relatedTarget && box.contains(e.relatedTarget))) statsCache(box);
  });
}

function viewStats() {
  if (!sb || !me) return `<section class="panel"><h3>Statistiques</h3><p class="muted">Connectez-vous avec un compte administrateur (Réglages).</p></section>`;
  if (myLevel !== "administrateur") return `<section class="panel"><h3>Statistiques</h3><p class="muted">Réservé aux administrateurs.</p></section>`;
  if (!statsData && !statsCharge && !statsMsg) setTimeout(statsCharger, 0);
  const tete = `<section class="panel"><h3>Statistiques d'usage</h3>
    <p class="muted">Chiffres de la version publiée (les versions d'essai sont écartées). Un appareil reçoit un nouvel identifiant chaque jour : « visiteurs » compte des appareils par jour.</p>
    <div class="row"><button class="btn small ghost" data-act="stats-reload">Actualiser</button><a class="linkbtn" href="#reglages">Retour aux réglages</a></div>
    ${statsMsg ? `<p role="status"><b>${esc(statsMsg)}</b></p>` : ""}</section>`;
  if (!statsData) return tete;
  const D = statsData, auj = D.stats_par_jour.find(j => j.jour === today()) || {};
  const sept = D.stats_par_jour.filter(j => diffDays(j.jour, today()) < 7);
  const somme = k => sept.reduce((n, j) => n + (Number(j[k]) || 0), 0);
  const rep7 = somme("reponses"), justes7 = sept.reduce((n, j) => n + (Number(j.reponses) || 0) * (Number(j.reussite_pct) || 0) / 100, 0);
  const semaine = D.stats_semaines[0] || {};
  // Heure la plus fréquentée
  const heures = {}; D.stats_heures.forEach(h => { heures[h.heure] = (heures[h.heure] || 0) + Number(h.ouvertures); });
  const pic = Object.keys(heures).sort((a, b) => heures[b] - heures[a])[0];
  return tete + `
    <section class="panel"><h3>En bref</h3>
      <div class="tiles"><div><b>${statsNb(auj.visiteurs || 0)}</b>visiteurs aujourd'hui</div>
        <div><b>${statsNb(semaine.appareils_actifs || 0)}</b>appareils actifs cette semaine</div></div>
      <div class="tiles"><div><b>${statsNb(somme("seances_finies"))}</b>séances finies (7 j)</div>
        <div><b>${rep7 ? statsNb(Math.round(100 * justes7 / rep7)) + " %" : "—"}</b>de bonnes réponses (7 j)</div></div>
      ${pic != null ? `<p class="muted">Heure la plus fréquentée : ${esc(pic)} h (heure de Paris).</p>` : ""}</section>
    <section class="panel"><h3>Visiteurs par jour</h3>${statsBarres(D.stats_par_jour)}</section>
    <section class="panel"><h3>Leçons</h3>
      ${statsTable(["Leçon", "Début", "Finies", "Quittées", "Sans faire", "Min."],
        D.stats_lecons.filter(l => l.lecon && /^\d+$/.test(l.lecon) && LESSON_TITLE[l.lecon]).map(l => [lessonHtml(Number(l.lecon)), statsNb(l.commencees), statsNb(l.finies), statsNb(l.quittees), statsNb(l.validees_sans_les_faire), statsNb(l.minutes_mediane)]))}</section>
    <section class="panel"><h3>Mots les moins réussis</h3>
      ${statsTable(["Mot", "Exercice", "Rép.", "Réussite", "1er essai", "Sec."],
        D.stats_questions.map(q => [statsMot(q.element), esc(STATS_EX[q.exercice] || q.exercice || ""), statsNb(q.reponses), statsNb(q.reussite_pct) + " %", statsNb(q.reussite_premier_essai_pct) + " %", statsNb(q.secondes_mediane)]))}</section>
    <section class="panel"><h3>Confusions les plus fréquentes</h3>
      ${statsTable(["Mot demandé", "Pris pour", "Fois"], D.stats_confusions.map(c => [statsMot(c.element), statsMot(c.pris_pour), statsNb(c.fois)]))}</section>
    <section class="panel"><h3>Grammaire : questions les moins réussies</h3>
      ${statsTable(["Question", "Type", "Rép.", "Réussite", "À une haraka près"],
        D.stats_grammaire.map(q => [`<code>${esc(q.question)}</code>`, esc(q.type_question || ""), statsNb(q.reponses), statsNb(q.reussite_pct) + " %", statsNb(q.justes_a_une_haraka_pres)]))}</section>
    <section class="panel"><h3>Écoutes</h3>
      ${statsTable(["Élément", "Écoutes", "Partagée", "Sa voix", "Synthèse", "Rien"],
        D.stats_audio.map(a => [statsMot(a.element), statsNb(a.ecoutes), statsNb(a.voix_partagee), statsNb(a.sa_voix), statsNb(a.synthese), statsNb(a.rien_a_entendre)]))}</section>
    <section class="panel"><h3>Tableau d'écriture</h3>
      ${statsTable(["Contexte", "Ouvertures", "Terminés", "Croix", "Rien écrit", "Doigt", "Souris", "Stylet"],
        D.stats_tableau.map(t => [esc(t.contexte || ""), statsNb(t.ouvertures), statsNb(t.termines), statsNb(t.fermes_par_la_croix), statsNb(t.rien_ecrit), statsNb(t.au_doigt), statsNb(t.a_la_souris), statsNb(t.au_stylet)]))}</section>
    <section class="panel"><h3>Appareils</h3>
      ${statsTable(["Écran", "Installée", "Version", "Langue", "Appareils-jours"],
        D.stats_appareils.map(a => [esc(a.ecran || "?"), a.installee ? "oui" : "non", esc(a.version || "?"), esc(a.langue || "?"), statsNb(a.appareils_jours)]))}</section>
    <section class="panel"><h3>Erreurs techniques</h3>
      ${statsTable(["Message", "Version", "Fois", "Dernière fois"], D.stats_erreurs.map(e => [esc(e.message || ""), esc(e.version || "?"), statsNb(e.fois), esc(String(e.derniere_fois || "").slice(0, 16).replace("T", " "))]))}</section>
    <p class="muted">Toutes les vues, dont la rétention et l'assiduité, sont aussi lisibles dans le Table Editor de Supabase.</p>`;
}
