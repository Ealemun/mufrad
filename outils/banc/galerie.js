// node galerie.js <src> <sortie.png> <lettres> <fractions|repos> [mobile|bureau]
const puppeteer = require(process.env.PUPPETEER || "puppeteer"), fs = require("fs"), path = require("path");
const [src, out, lettres, fracs, mode = "mobile"] = process.argv.slice(2);
(async () => {
  fs.writeFileSync(path.join(__dirname, "p.html"), fs.readFileSync(path.join(__dirname, "page.html"), "utf8").replace(/SRC/g, src));
  const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"] });
  const p = await b.newPage(); p.on("pageerror", e => console.error("ERR", e.message));
  await p.setViewport(mode === "mobile" ? { width: 390, height: 844, deviceScaleFactor: 2 } : { width: 1280, height: 800, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(__dirname, "p.html")); await p.evaluate(() => document.fonts.ready);
  const fr = fracs === "repos" ? [null] : fracs.split(",").map(Number), rows = [];
  for (const L of lettres.split(",")) { await p.evaluate(L => ouvrir(L), L);
    rows.push(await p.evaluate(fr => fr.map(f => { tbDrawGuide(f == null ? undefined : f); return tbl.guide.toDataURL(); }), fr)); }
  const html = fracs === "repos" ? `<body style="margin:0;background:#f3eee2">${rows.map(r => `<img src="${r[0]}" style="width:380px;margin:2px;background:#fffdf7">`).join("")}</body>` : `<body style="margin:0;background:#f3eee2;font:12px sans-serif"><table>${fracs === "repos" ? "" : "<tr>" + fr.map(f => `<th>${Math.round(f * 100)} %</th>`).join("") + "</tr>"}${rows.map(r => "<tr>" + r.map(u => `<td><img src="${u}" style="width:${fracs === "repos" ? 300 : 200}px;background:#fffdf7;border:1px solid #ddd"></td>`).join("") + "</tr>").join("")}</table></body>`;
  const q = await b.newPage(); await q.setViewport({ width: 1600, height: 400, deviceScaleFactor: 1 }); await q.setContent(html);
  await q.screenshot({ path: out, fullPage: true }); await b.close();
})();
