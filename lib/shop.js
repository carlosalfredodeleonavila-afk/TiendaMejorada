// Lógica de compra en el servidor: valida precios y existencias, calcula envío y guarda pedidos.
// Nunca se confía en los precios que manda el navegador: se vuelven a leer de la base de datos.
const path = require("path");
const Database = require("../db/sqlite");
const shipping = require("./shipping");

function openOrders(){
  const db = new Database(path.join(__dirname, "..", "data", "orders.db"));
  db.exec(`CREATE TABLE IF NOT EXISTS orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT, folio TEXT UNIQUE, created_at TEXT,
    customer_name TEXT, email TEXT, phone TEXT, address TEXT, city TEXT, state TEXT,
    subtotal REAL, shipping REAL, total REAL, distance_km INTEGER, items TEXT)`);
  return db;
}

function priceCart(db, rawItems, city, state){
  const issues = [], lines = [], qtyById = {};
  if (!Array.isArray(rawItems) || !rawItems.length) return { ok: false, error: "El carrito está vacío." };
  for (const it of rawItems.slice(0, 50)) {
    const id = Number(it.id), qty = Math.floor(Number(it.qty));
    if (!id || !(qty > 0) || qty > 99) { issues.push("Cantidad no válida."); continue; }
    const p = db.prepare("SELECT id, name, price, stock, sizes, colors FROM products WHERE id = ?").get(id);
    if (!p) { issues.push("Un producto del carrito ya no existe."); continue; }
    // Tallas y colores: si el producto los tiene, deben venir elegidos y ser válidos
    const size = it.size ? String(it.size) : "", color = it.color ? String(it.color) : "";
    if (p.sizes && !p.sizes.split(",").includes(size)) { issues.push(`Elige una talla válida para "${p.name}".`); continue; }
    if (p.colors && !p.colors.split(",").includes(color)) { issues.push(`Elige un color válido para "${p.name}".`); continue; }
    qtyById[id] = (qtyById[id] || 0) + qty;
    if (qtyById[id] > p.stock) { issues.push(p.stock ? `Solo quedan ${p.stock} de "${p.name}".` : `"${p.name}" está agotado.`); continue; }
    lines.push({ id, name: p.name, size, color, qty, price: p.price, total: Math.round(p.price * qty * 100) / 100 });
  }
  if (issues.length) return { ok: false, error: issues[0], issues };
  const subtotal = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  const ship = shipping.quote(city, state);
  if (!ship.ok) return { ok: false, error: ship.error, issues: [ship.error] };
  return { ok: true, items: lines, subtotal, shipping: ship, total: Math.round((subtotal + ship.cost) * 100) / 100 };
}

function createOrder(db, ordersDb, body){
  const c = body.customer || {};
  for (const f of ["fullName", "email", "phone", "street", "neighborhood", "city", "state"])
    if (!String(c[f] || "").trim()) return { ok: false, status: 400, error: "Faltan datos del domicilio de envío." };
  const q = priceCart(db, body.items, c.city, c.state);
  if (!q.ok) return { ok: false, status: 422, error: q.error };
  const folio = "LS-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 36 ** 2).toString(36).toUpperCase().padStart(2, "0");
  const address = `${c.street}, ${c.neighborhood}, CP ${c.zip || "s/n"}${c.references ? " (" + c.references + ")" : ""}`;
  ordersDb.prepare(`INSERT INTO orders(folio, created_at, customer_name, email, phone, address, city, state, subtotal, shipping, total, distance_km, items)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(folio, new Date().toISOString(), String(c.fullName), String(c.email), String(c.phone),
    address, String(c.city), String(c.state), q.subtotal, q.shipping.cost, q.total, q.shipping.km, JSON.stringify(q.items));
  return { ok: true, folio, address, ...q };
}
module.exports = { openOrders, priceCart, createOrder };
