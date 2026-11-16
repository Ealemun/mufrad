// node outils/atelier/images.js sortie.png "ع:debut,غ:milieu" 0.2,0.5,1 [police] : la lettre à plusieurs instants de l'animation
const puppeteer = require(process.env.PUPPETEER || "puppeteer"), path = require("path");
const [out, sel, fr, mod] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
  const p = await b.newPage(); p.on("pageerror", e => console.error(e.message));
  await p.goto("file://" + path.join(__dirname, "atelier.html")); await new Promise(r => setTimeout(r, 800));
  const rangs = await p.evaluate((sel, fr, mod) => sel.split(",").map(x => { const [L, f] = x.split(":");
    reglage.forme = f; reglage.modele = mod || "main"; reglage.fleches = true;
    const c = { L, toile: document.createElement("canvas") }; tailler(c, 500);
    return [null, ...fr.split(",").map(Number)].map(t => { dessiner(c, t); const k = document.createElement("canvas"); k.width = 250; k.height = 300; k.getContext("2d").fillStyle = "#fffdf7"; k.getContext("2d").fillRect(0, 0, 250, 300); k.getContext("2d").drawImage(c.toile, 125, 0, 250, 300, 0, 0, 250, 300); return k.toDataURL(); }); }), sel, fr, mod);
  const q = await b.newPage(); await q.setViewport({ width: 1800, height: 300 });
  await q.setContent(`<body style="margin:0;background:#eee">${rangs.map(r => `<div style="display:flex;gap:4px;margin-bottom:4px">${r.map(u => `<img src="${u}" style="width:200px;height:240px">`).join("")}</div>`).join("")}</body>`);
  await q.screenshot({ path: out, fullPage: true }); await b.close();
})();
