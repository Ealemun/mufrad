// Mesures de l'allumage, pour une lettre : on ouvre le tableau, on coupe l'animation automatique,
// puis on rejoue image par image (60 i/s) en lisant le calque du guide.
window.ouvrir = L => {
  tbContext = () => ({ id: "x", text: L, contexte: "cours", montre: true, lettre: { ar: L }, cle: L });
  if (tbl) tableauClose(); tableauOpen();
  return new Promise(r => setTimeout(() => { cancelAnimationFrame(tbl.anim); clearTimeout(tbl.fin); r(); }, 300));
};
// Référence : carte d'encre de la lettre (pixels CSS), et pour chaque pixel l'abscisse du chemin la plus proche
function reference() {
  const w = Math.round(tbl.w), h = Math.round(tbl.h), c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.fillStyle = "#000"; tbGlyph(g, tbl.ctx.text, w, h);
  const a = g.getImageData(0, 0, w, h).data, ink = new Int32Array(w * h).fill(-1), px = [];
  for (let i = 0; i < w * h; i++) if (a[i * 4 + 3] > 100) { ink[i] = px.length; px.push(i); }
  // composantes connexes
  const comp = new Int32Array(px.length).fill(-1), comps = [];
  px.forEach((p, n) => { if (comp[n] >= 0) return; const id = comps.length, pile = [n], liste = []; comp[n] = id;
    while (pile.length) { const m = pile.pop(), q = px[m], x = q % w, y = (q / w) | 0; liste.push(m);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const k = ink[yy * w + xx]; if (k >= 0 && comp[k] < 0) { comp[k] = id; pile.push(k); } } }
    comps.push(liste); });
  const path = tbPath(), k = tbl.w / 1000, ech = [], points = []; let s0 = 0;
  path.traits.forEach((tr, n) => { if (tr.length === 1) points.push({ x: tr[0][0] * k, y: tr[0][1] * k, s: s0 + path.longueurs[n] * 0.5 });
    else tr.forEach((p, i) => { if (!i) return; const a = tr[i - 1], nb = Math.max(1, Math.ceil(Math.hypot(p[0] - a[0], p[1] - a[1]) * k / 1.5)); for (let u = 0; u <= nb; u++) ech.push({ x: (a[0] + (p[0] - a[0]) * u / nb) * k, y: (a[1] + (p[1] - a[1]) * u / nb) * k, s: s0 + path.cumul[n][i - 1] + (path.cumul[n][i] - path.cumul[n][i - 1]) * u / nb }); }); s0 += path.longueurs[n]; });
  const grand = Math.max(...comps.map(c => c.length)), temps = new Float32Array(px.length), dotComp = [];
  // chaque point de la lettre prend la petite composante la plus proche
  const centre = c => { let x = 0, y = 0; c.forEach(m => { x += px[m] % w; y += (px[m] / w) | 0; }); return [x / c.length, y / c.length]; };
  const libres = comps.map((c, i) => i).filter(i => comps[i].length < grand * 0.2);
  points.forEach(pt => { let best = -1, bd = 1e9; libres.forEach(i => { if (dotComp.some(d => d.c === i)) return; const [x, y] = centre(comps[i]), d = Math.hypot(x - pt.x, y - pt.y); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) { dotComp.push({ c: best, s: pt.s }); comps[best].forEach(m => temps[m] = pt.s); } });
  comps.forEach((c, i) => { if (dotComp.some(d => d.c === i)) return; c.forEach(m => { const x = px[m] % w, y = (px[m] / w) | 0; let bd = 1e9, bs = 0;
    ech.forEach(e => { const d = Math.hypot(e.x - x, e.y - y); if (d < bd - 0.5) { bd = d; bs = e.s; } }); temps[m] = bs; }); });
  return { w, h, px, temps, comps, dotComp, total: path.total };
}
window.mesurer = () => {
  const ref = reference(), d = tbl.d, G = tbl.guide.getContext("2d"), W = tbl.guide.width;
  const dur = Math.min(5200, Math.max(1800, tbl.path.total * 2.4)), n = Math.ceil(dur / 16.67);
  const lit = new Uint8Array(ref.px.length), allume = new Float32Array(ref.px.length).fill(-1), couts = [];
  let avance = 0, saut = 0, avant = 0;
  for (let f = 1; f <= n; f++) {
    const part = f / n, t0 = performance.now(); tbDrawGuide(part); couts.push(performance.now() - t0);
    const img = G.getImageData(0, 0, W, tbl.guide.height).data; let nb = 0, tot = 0;
    ref.px.forEach((p, m) => { const x = Math.round((p % ref.w + 0.5) * d - 0.5), y = Math.round((((p / ref.w) | 0) + 0.5) * d - 0.5), o = (y * W + x) * 4;
      const or = img[o + 3] > 120 && img[o] > 150 && img[o + 1] > 100 && img[o + 2] < 120 && img[o] - img[o + 2] > 70;
      if (or) { tot++; if (allume[m] < 0) allume[m] = part * ref.total; if (ref.temps[m] > part * ref.total + 40) nb++; } });
    avance = Math.max(avance, nb / ref.px.length); if ((tot - avant) / ref.px.length > saut) { saut = (tot - avant) / ref.px.length; window.__sautF = f + "/" + n; } avant = tot;
  }
  // points de la lettre : instant où chacun s'allume (moitié de ses pixels), comparé au moment prévu
  const pts = ref.dotComp.map(dc => { const v = ref.comps[dc.c].map(m => allume[m]).filter(x => x >= 0).sort((a, b) => a - b);
    const mi = v.length >= ref.comps[dc.c].length / 2 ? v[Math.floor(ref.comps[dc.c].length / 2) - 1 >= 0 ? Math.floor(ref.comps[dc.c].length / 2) - 1 : 0] : null;
    return { prevu: Math.round(dc.s), allume: mi == null ? null : Math.round(mi) }; });
  couts.sort((a, b) => a - b);
  return { ou: window.__sautF, avance: +(avance * 100).toFixed(1), saut: +(saut * 100).toFixed(1), points: pts, nonAllumes: ref.px.length - allume.filter(x => x >= 0).length,
    msMoy: +(couts.reduce((a, b) => a + b, 0) / couts.length).toFixed(2), msP95: +couts[Math.floor(couts.length * 0.95)].toFixed(2) };
};
// Planche d'images : la lettre à plusieurs instants de l'animation
window.planche = (L, fr) => fr.map(f => { tbDrawGuide(f); return tbl.guide.toDataURL(); });
window.tempsCarte = () => { const t0 = performance.now(); tbl.path = null; tbCarte(tbPath()); return +(performance.now() - t0).toFixed(1); };
