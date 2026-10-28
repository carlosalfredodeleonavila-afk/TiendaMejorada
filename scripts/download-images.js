// Descarga una foto real y distinta de Pixabay para cada producto → public/images/<id>.jpg
// Uso: coloca PIXABAY_KEY=tu_clave en un archivo .env y ejecuta: npm run images
// Es reanudable: si se corta, vuelve a correrlo y continúa donde se quedó.
const fs = require("fs");
const path = require("path");
const Database = require("../db/sqlite");
const { ensure, DB_PATH } = require("../db/seed");

const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) for (const l of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const KEY = process.env.PIXABAY_KEY;
if (!KEY) { console.error("✖ Falta PIXABAY_KEY. Crea un archivo .env con: PIXABAY_KEY=tu_clave"); process.exit(1); }

const OUT = path.join(__dirname, "..", "public", "images");
const USED_FILE = path.join(__dirname, "..", "data", "images_used.json");
fs.mkdirSync(OUT, { recursive: true });
ensure();

const db = new Database(DB_PATH, { readonly: true });
const products = db.prepare("SELECT id, name, img_query, img_fallback FROM products ORDER BY id").all();
const used = new Set(fs.existsSync(USED_FILE) ? JSON.parse(fs.readFileSync(USED_FILE, "utf8")) : []);
const cache = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let apiCalls = [];

async function search(q, page = 1){
  const k = q + "|" + page;
  if (cache.has(k)) return cache.get(k);
  // Respeta el límite de Pixabay: 100 solicitudes por minuto
  apiCalls = apiCalls.filter(t => Date.now() - t < 60000);
  if (apiCalls.length >= 90) await sleep(60000 - (Date.now() - apiCalls[0]) + 500);
  apiCalls.push(Date.now());
  const url = `https://pixabay.com/api/?key=${KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=200&page=${page}&safesearch=true&order=popular`;
  const res = await fetch(url);
  if (res.status === 429) { console.log("  límite alcanzado, esperando 60 s…"); await sleep(61000); return search(q, page); }
  if (!res.ok) throw new Error(`Pixabay respondió ${res.status}: ${await res.text()}`);
  const hits = (await res.json()).hits || [];
  cache.set(k, hits);
  return hits;
}

async function download(url, file){
  const res = await fetch(url);
  if (!res.ok) throw new Error("descarga " + res.status);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function pickHit(p){
  for (const q of [p.img_query, p.img_fallback]) for (const page of [1, 2]) {
    const hit = (await search(q, page)).find(h => !used.has(h.id) && h.webformatURL);
    if (hit) return hit;
  }
  return null;
}

(async () => {
  let done = 0, failed = [];
  for (const p of products) {
    const file = path.join(OUT, `${p.id}.jpg`);
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) { done++; continue; }
    try {
      const hit = await pickHit(p);
      if (!hit) throw new Error("sin resultados");
      await download(hit.webformatURL, file);
      used.add(hit.id);
      fs.writeFileSync(USED_FILE, JSON.stringify([...used]));
      done++;
      if (done % 25 === 0 || done === products.length) console.log(`  ${done}/${products.length} imágenes`);
      await sleep(120);
    } catch (e) { failed.push(p.id); console.log(`  ✖ #${p.id} ${p.name}: ${e.message}`); }
  }
  console.log(`\n✔ Listo: ${done}/${products.length} imágenes en public/images`);
  if (failed.length) console.log(`Faltaron ${failed.length}. Vuelve a ejecutar "npm run images" para reintentar.`);
})();
