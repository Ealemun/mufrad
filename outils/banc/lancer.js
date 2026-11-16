// node lancer.js <dossier source> <sortie.json> [mobile|bureau]
const puppeteer = require(process.env.PUPPETEER || "puppeteer"), fs = require("fs"), path = require("path");
const [src, out, mode = "mobile"] = process.argv.slice(2);
const LETTRES = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");
(async () => {
  const html = fs.readFileSync(path.join(__dirname, "page.html"), "utf8").replace(/SRC/g, src);
  fs.writeFileSync(path.join(__dirname, "p.html"), html);
  const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"] });
  const p = await b.newPage(); p.on("pageerror", e => console.error("ERR", e.message)); p.on("console", m => { if (m.type() === "error") console.error(m.text()); });
  await p.setViewport(mode === "mobile" ? { width: 390, height: 844, deviceScaleFactor: 3 } : { width: 1280, height: 800, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(__dirname, "p.html")); await p.evaluate(() => document.fonts.ready);
  const res = {};
  for (const L of LETTRES) { await p.evaluate(L => ouvrir(L), L); res[L] = await p.evaluate(() => ({ ...mesurer(), carteMs: typeof tbCarte === "function" ? tempsCarte() : null })); console.log(L, JSON.stringify(res[L])); }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  if (process.argv[5]) { // planches
    const sel = process.argv[5].split(","), fr = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95, 1];
    for (const L of sel) { await p.evaluate(L => ouvrir(L), L); const im = await p.evaluate((L, fr) => planche(L, fr), L, fr);
      fs.writeFileSync(path.join(__dirname, out.replace(".json", "") + "-" + L + ".json"), JSON.stringify(im)); }
  }
  await b.close();
})();
