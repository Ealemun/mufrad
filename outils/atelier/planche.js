// node planche.js <sortie.png> <forme> [police] : les 28 lettres d'une forme, écrites à la plume (ou dans la police)
const puppeteer = require(process.env.PUPPETEER || "puppeteer");
const [out, forme, mod] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox"] });
  const p = await b.newPage(); p.on("pageerror", e => console.error(e.message));
  await p.setViewport({ width: 1400, height: 900 });
  await p.goto("file://" + require("path").join(__dirname, "atelier.html")); await new Promise(r => setTimeout(r, 800));
  const urls = await p.evaluate((forme, mod) => {
    reglage.forme = forme; reglage.modele = mod || "main"; reglage.fleches = false;
    return LETTRES.map(([L]) => { const c = { L, toile: document.createElement("canvas") }; tailler(c, 500); dessiner(c, null);
      const k = document.createElement("canvas"); k.width = 250; k.height = 300; k.getContext("2d").drawImage(c.toile, 125, 0, 250, 300, 0, 0, 250, 300); return k.toDataURL(); });
  }, forme, mod);
  const q = await b.newPage(); await q.setViewport({ width: 1750, height: 400 });
  await q.setContent(`<body style="margin:0;background:#fffdf7;display:flex;flex-wrap:wrap;flex-direction:row-reverse;width:1750px">${urls.map(u => `<img src="${u}" style="width:250px;height:300px">`).join("")}</body>`);
  await q.screenshot({ path: out, fullPage: true }); await b.close();
})();
