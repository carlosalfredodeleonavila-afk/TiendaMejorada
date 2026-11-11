// Pedidos de demostración para que el dashboard tenga datos (se marcan como is_demo = 1 y se pueden ocultar).
const shop = require("./shop");
const cp = require("./cp");

let seed = 20261111;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)];

const NAMES = ["Ana López", "Carlos Treviño", "María Guerrero", "Luis Hernández", "Sofía Martínez", "Jorge Salinas", "Daniela Cruz",
  "Miguel Ángel Ruiz", "Fernanda Torres", "Ricardo Gómez", "Valeria Núñez", "Diego Castillo", "Paola Ríos", "Andrés Medina"];
const STREETS = ["Av. Hidalgo 123", "Calle 5 de Mayo 45", "Blvd. Díaz Ordaz 880", "Calle Morelos 210", "Av. Juárez 66", "Calle Allende 17"];
// [código postal, peso]: la mayoría de los pedidos son del noreste, como en una tienda regional
const CPS = [["87000", 30], ["87070", 8], ["89000", 10], ["88000", 6], ["88500", 8], ["87300", 5], ["64000", 9], ["66200", 5],
  ["44100", 4], ["01000", 4], ["72000", 3], ["97000", 2], ["77500", 3], ["22000", 2], ["37000", 2], ["20000", 2]];

function weightedCp(){
  const valid = CPS.filter(([z]) => cp.lookup(z));
  let r = rnd() * valid.reduce((s, [, w]) => s + w, 0);
  for (const [z, w] of valid) { if ((r -= w) <= 0) return z; }
  return valid[0][0];
}

function seedDemoOrders(db, ordersDb, n = 120){
  if (!cp.available()) return 0;
  const products = db.prepare("SELECT id, sizes, colors FROM products WHERE stock >= 4").all();
  let made = 0;
  for (let i = 0; i < n * 3 && made < n; i++) {
    const zip = weightedCp(), info = cp.lookup(zip), name = pick(NAMES);
    const items = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
      const p = pick(products);
      return { id: p.id, qty: 1 + Math.floor(rnd() * 2), size: p.sizes ? pick(p.sizes.split(",")) : "", color: p.colors ? pick(p.colors.split(",")) : "" };
    });
    // más pedidos en los días recientes
    const daysAgo = Math.floor(30 * rnd() * rnd()), at = new Date(Date.now() - daysAgo * 864e5 - Math.floor(rnd() * 864e5 * 0.9));
    const r = shop.createOrder(db, ordersDb, {
      customer: { fullName: name, email: name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@ejemplo.com", phone: "8340000000",
        street: pick(STREETS), neighborhood: info.a[0], zip, city: info.c || info.m, state: info.e },
      items }, { demo: true, createdAt: at.toISOString() });
    if (r.ok) made++;
  }
  return made;
}
module.exports = { seedDemoOrders };
