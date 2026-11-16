// node outils/traces/rendre.js — dessine chaque forme de lettre avec tbGlyph sur un tableau de 1000 × 600 (1 px = 1 unité du repère des tracés)
const puppeteer = require(process.env.PUPPETEER || "puppeteer"), fs = require("fs"), path = require("path");
const TRAVAIL = path.join(__dirname, "travail"); fs.mkdirSync(TRAVAIL, { recursive: true });
const LET = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" "), NJ = "ا د ذ ر ز و";
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"] });
  const p = await b.newPage();
  // Page d'essai : le code du tableau de l'application (outils/banc/page.html, chemins pris depuis ce dossier)
  fs.writeFileSync(path.join(__dirname, "p.html"), fs.readFileSync(path.join(__dirname, "../banc/page.html"), "utf8").replace(/SRC/g, "../.."));
  await p.goto("file://" + path.join(__dirname, "p.html")); await p.evaluate(() => document.fonts.ready);
  const formes = [];
  LET.forEach(L => { const T = "ـ"; formes.push([L, "isolee", L]); if (NJ.includes(L)) formes.push([L, "fin", T + L]); else formes.push([L, "debut", L + T], [L, "milieu", T + L + T], [L, "fin", T + L]); });
  for (const [L, f, txt] of formes) {
    const url = await p.evaluate(txt => { const c = document.createElement("canvas"); c.width = 1000; c.height = 800; const g = c.getContext("2d"); g.fillStyle = "#000"; tbGlyph(g, txt, 1000, 600); return c.toDataURL(); }, txt);
    fs.writeFileSync(path.join(TRAVAIL, `g_${L}_${f}.png`), Buffer.from(url.split(",")[1], "base64"));
  }
  fs.writeFileSync(path.join(TRAVAIL, "formes.json"), JSON.stringify(formes)); console.log(formes.length); await b.close();
})();
