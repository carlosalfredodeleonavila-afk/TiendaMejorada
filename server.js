const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("./db/sqlite");
const { ensure, DB_PATH } = require("./db/seed");
const shipping = require("./lib/shipping");
const shop = require("./lib/shop");
const { buildIndex, parseQuery, rank, norm } = require("./search");

ensure();
const db = new Database(DB_PATH, { readonly: true });
const ALL = db.prepare("SELECT * FROM products ORDER BY id").all();
const index = buildIndex(ALL);
const CATEGORIES = db.prepare("SELECT category AS name, COUNT(*) AS count FROM products GROUP BY category ORDER BY MIN(id)").all();

const toApi = r => ({ id: String(r.id), name: r.name, category: r.category, price: r.price, stock: r.stock,
  rating: r.rating, ratingCount: r.rating_count, image: r.image, description: r.description,
  sizeLabel: r.size_label, sizes: r.sizes ? r.sizes.split(",") : [], colorLabel: r.color_label, colors: r.colors ? r.colors.split(",") : [] });

const ordersDb = shop.openOrders();
const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/categories", (req, res) => res.json(CATEGORIES));

app.get("/api/products/:id", (req, res) => {
  const r = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(req.params.id));
  r ? res.json(toApi(r)) : res.status(404).json({ error: "Producto no encontrado" });
});

app.get("/api/products", (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 80);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 24));

  // Filtros estructurados → SQL
  const where = [], args = [];
  if (req.query.category && req.query.category !== "Todas") { where.push("category = ?"); args.push(req.query.category); }
  if (req.query.maxPrice) { where.push("price <= ?"); args.push(Number(req.query.maxPrice)); }
  if (req.query.minRating) { where.push("rating >= ?"); args.push(Number(req.query.minRating)); }
  if (req.query.inStock === "true") where.push("stock > 0");
  if (req.query.size)  { where.push("(',' || sizes || ',') LIKE ?");  args.push(`%,${String(req.query.size).slice(0, 20)},%`); }
  if (req.query.color) { where.push("(',' || colors || ',') LIKE ?"); args.push(`%,${String(req.query.color).slice(0, 20)},%`); }
  const candidates = db.prepare(`SELECT * FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id`).all(...args);

  // Texto → motor de búsqueda
  const parsed = q ? parseQuery(q, index) : { tokens: [], corrected: false, text: "" };
  let ranked = rank(candidates, index, parsed.tokens, "and");
  let related = [];
  if (q && ranked.length === 0) {
    // Sin coincidencia exacta: sugiere productos que coincidan con alguna palabra (en TODO el catálogo)
    related = rank(ALL, index, parsed.tokens, "or").slice(0, 4).map(x => toApi(x.p));
  }

  const sort = req.query.sort || "relevance";
  const cmp = { "price-asc": (a, b) => a.p.price - b.p.price, "price-desc": (a, b) => b.p.price - a.p.price,
    "rating-desc": (a, b) => b.p.rating - a.p.rating || b.p.rating_count - a.p.rating_count }[sort];
  if (cmp) ranked.sort(cmp);

  res.json({
    total: ranked.length, page, pages: Math.ceil(ranked.length / limit), query: q,
    correctedQuery: parsed.corrected ? parsed.text : null,
    items: ranked.slice((page - 1) * limit, page * limit).map(x => toApi(x.p)),
    related
  });
});

// Autocompletado: productos y categorías que coinciden con lo que se va escribiendo
app.get("/api/suggest", (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 60);
  if (q.length < 2) return res.json({ products: [], categories: [] });
  const parsed = parseQuery(q, index);
  const products = rank(ALL, index, parsed.tokens, "and").slice(0, 6).map(x => ({ id: String(x.p.id), name: x.p.name }));
  const n = norm(parsed.text);
  const categories = CATEGORIES.filter(c => norm(c.name).includes(n.trim())).map(c => c.name);
  res.json({ products, categories, correctedQuery: parsed.corrected ? parsed.text : null });
});

// ---- Envíos y compra ----
app.get("/api/shipping/places", (req, res) => res.json(shipping.places()));
app.get("/api/shipping", (req, res) => {
  const r = shipping.quote(req.query.city, req.query.state);
  res.status(r.ok ? 200 : 422).json(r);
});
// Calcula subtotal, envío y total con precios reales de la base de datos
app.post("/api/quote", (req, res) => {
  const b = req.body || {};
  const r = shop.priceCart(db, b.items, b.city, b.state);
  res.status(r.ok ? 200 : 422).json(r);
});
// Confirma el pedido y lo guarda en data/orders.db
app.post("/api/orders", (req, res) => {
  const r = shop.createOrder(db, ordersDb, req.body || {});
  res.status(r.ok ? 201 : r.status).json(r);
});

app.get("/api/health", (req, res) => res.json({ ok: true, products: ALL.length }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LocalStore listo en http://localhost:${PORT} (${ALL.length} productos)`));
