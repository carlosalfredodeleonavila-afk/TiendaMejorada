// Crea data/store.db con 504 productos (determinista: mismos ids y nombres siempre).
const fs = require("fs");
const path = require("path");
const Database = require("./sqlite");
const catalog = require("./catalog");
const { variantsFor } = require("./variants");

const DB_PATH = path.join(__dirname, "..", "data", "store.db");
const BRANDS = ["Sonix","Vantra","Nuvia","Kalor","Zentra","Orbis","Tavo","Lumina","Brisa","Norte","Kyra","Alba","Volta","Mirto","Axial","Pulsar","Ámbar","Delta","Selva","Cobalto","Nimbo","Aurea","Terra","Zafiro","Fénix","Argos","Ciclo","Rumbo"];
const MODELS = ["Pro","Lite","Max","Plus","Air","One","X","Sport","Classic","Elite","Go","Neo"];
const VARIANTS = 7;

function rng(seed){ // mulberry32
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = rng(2026);
const pick = a => a[Math.floor(rand() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function buildProducts(){
  const out = [];
  let id = 1;
  for (const [category, def] of Object.entries(catalog)) {
    for (const [typeName, query, min, max, desc] of def.types) {
      const brands = shuffle(BRANDS).slice(0, VARIANTS);
      const models = shuffle(MODELS).slice(0, VARIANTS);
      for (let v = 0; v < VARIANTS; v++) {
        const price = Math.round((min + rand() * (max - min)) / 10) * 10 - 1;
        const r = rand();
        const stock = r < 0.12 ? 0 : r < 0.24 ? 1 + Math.floor(rand() * 5) : 6 + Math.floor(rand() * 55);
        out.push({
          id, name: `${typeName} ${brands[v]} ${models[v]}`, category, type: typeName, brand: brands[v],
          description: `${desc} ${pick(def.features)}`,
          price: Math.max(price, 29), stock,
          rating: Math.round((3.4 + rand() * 1.5) * 10) / 10,
          rating_count: 8 + Math.floor(rand() * 470),
          image: `/images/${id}.jpg`,
          img_query: query, img_fallback: def.imgQuery,
          ...variantsFor(category, typeName, id)
        });
        id++;
      }
    }
  }
  return out;
}

function seed(){
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const db = new Database(DB_PATH);
  db.exec(`CREATE TABLE products(
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, type TEXT, brand TEXT,
    description TEXT NOT NULL, price REAL NOT NULL, stock INTEGER NOT NULL,
    rating REAL NOT NULL, rating_count INTEGER NOT NULL, image TEXT NOT NULL,
    img_query TEXT, img_fallback TEXT,
    size_label TEXT, sizes TEXT, color_label TEXT, colors TEXT);
    CREATE INDEX idx_cat ON products(category); CREATE INDEX idx_price ON products(price);`);
  const ins = db.prepare(`INSERT INTO products VALUES (@id,@name,@category,@type,@brand,@description,@price,@stock,@rating,@rating_count,@image,@img_query,@img_fallback,@size_label,@sizes,@color_label,@colors)`);
  const products = buildProducts();
  db.transaction(rows => rows.forEach(r => ins.run(r)))(products);
  db.close();
  return products.length;
}

// Crea la base si no existe, o la regenera si es de una versión anterior (sin tallas/colores).
function ensure(){
  if (!fs.existsSync(DB_PATH)) return seed();
  const db = new Database(DB_PATH, { readonly: true });
  const cols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
  db.close();
  if (!cols.includes("colors")) return seed();
}
module.exports = { seed, ensure, DB_PATH, buildProducts };
if (require.main === module) console.log(`✔ Base de datos creada con ${seed()} productos en data/store.db`);
