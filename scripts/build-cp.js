// Convierte el catálogo de SEPOMEX (CPdescarga.txt) en data/cp.json (código postal → estado, municipio, ciudad, colonias).
// Uso: npm run cp -- ruta/a/CPdescarga.txt   (o coloca el archivo en data/CPdescarga.txt)
const fs = require("fs");
const path = require("path");
const src = process.argv[2] || path.join(__dirname, "..", "data", "CPdescarga.txt");
if (!fs.existsSync(src)) { console.error("No encuentro el archivo:", src); process.exit(1); }

const lines = fs.readFileSync(src).toString("latin1").split(/\r?\n/);
const start = lines.findIndex(l => l.startsWith("d_codigo|"));
const out = {};
for (const line of lines.slice(start + 1)) {
  const c = line.split("|");
  if (c.length < 6 || !/^\d{5}$/.test(c[0])) continue;
  const e = out[c[0]] || (out[c[0]] = { e: c[4], m: c[3], c: c[5] || "", a: [] });
  if (!e.a.includes(c[1])) e.a.push(c[1]);
}
for (const k of Object.keys(out)) out[k].a.sort((x, y) => x.localeCompare(y, "es"));
fs.mkdirSync(path.join(__dirname, "..", "data"), { recursive: true });
const dest = path.join(__dirname, "..", "data", "cp.json");
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`✔ ${Object.keys(out).length} códigos postales guardados en data/cp.json (${(fs.statSync(dest).size / 1e6).toFixed(1)} MB)`);
