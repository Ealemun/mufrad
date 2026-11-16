// node zoom.js <src> <sortie.png> <lettres> <fractions> : images agrandies, recadrées sur la lettre
const puppeteer = require(process.env.PUPPETEER || "puppeteer"), fs = require("fs"), path = require("path");
const [src, out, lettres, fracs, , mode] = process.argv.slice(2);
(async () => {
  fs.writeFileSync(path.join(__dirname, "p.html"), fs.readFileSync(path.join(__dirname, "page.html"), "utf8").replace(/SRC/g, src));
  const b = await puppeteer.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"] });
  const p = await b.newPage(); p.on("pageerror", e => console.error("ERR", e.message));
  await p.setViewport(process.argv[6] === "bureau" ? { width: 1280, height: 800, deviceScaleFactor: +(process.argv[7] || 1) } : { width: 390, height: 844, deviceScaleFactor: 3 });
  await p.goto("file://" + path.join(__dirname, "p.html")); await p.evaluate(() => document.fonts.ready);
  const fr = fracs.split(",").map(Number), rows = [];
  for (const L of lettres.split(",")) { await p.evaluate(L => ouvrir(L), L);
    rows.push(await p.evaluate(fr => { const W = tbl.guide.width, H = tbl.guide.height, c = document.createElement("canvas"), x0 = W * 0.25, y0 = H * 0.08, cw = W * 0.5, ch = H * 0.88;
      c.width = cw; c.height = ch; return fr.map(f => { tbDrawGuide(f); const g = c.getContext("2d"); g.fillStyle = "#fffdf7"; g.fillRect(0, 0, cw, ch); g.drawImage(tbl.guide, x0, y0, cw, ch, 0, 0, cw, ch); return c.toDataURL(); }); }, fr)); }
  const html = `<body style="margin:0;background:#f3eee2;font:13px sans-serif"><table><tr><th></th>${fr.map(f => `<th>${Math.round(f * 100)} %</th>`).join("")}</tr>${rows.map((r, i) => `<tr><th>${lettres.split(",")[i]}</th>` + r.map(u => `<td><img src="${u}" style="width:${mode === "bureau" ? 420 : 210}px;image-rendering:pixelated"></td>`).join("") + "</tr>").join("")}</table></body>`;
  const q = await b.newPage(); await q.setViewport({ width: 1700, height: 400 }); await q.setContent(html); await q.screenshot({ path: out, fullPage: true }); await b.close();
})();
