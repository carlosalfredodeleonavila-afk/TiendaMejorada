// KPIs del dashboard, calculados a partir de los pedidos guardados.
const shipping = require("./shipping");

function computeKpis(db, ordersDb, { demo }){
  const all = ordersDb.prepare("SELECT * FROM orders ORDER BY created_at").all();
  const realOrders = all.filter(o => !o.is_demo).length, demoOrders = all.length - realOrders;
  const rows = demo ? all : all.filter(o => !o.is_demo);
  const category = Object.fromEntries(db.prepare("SELECT id, category FROM products").all().map(p => [p.id, p.category]));

  const byProduct = {}, byCategory = {}, byState = {}, byDay = {};
  let units = 0, sales = 0, shippingSum = 0;
  for (const o of rows) {
    sales += o.total; shippingSum += o.shipping;
    const st = shipping.canonState(o.state) || o.state || "Sin estado";
    byState[st] = (byState[st] || 0) + 1;
    const day = String(o.created_at).slice(0, 10);
    byDay[day] = (byDay[day] || 0) + o.total;
    for (const it of JSON.parse(o.items || "[]")) {
      units += it.qty;
      byProduct[it.name] = (byProduct[it.name] || 0) + it.qty;
      const cat = category[it.id] || "Otra";
      byCategory[cat] = (byCategory[cat] || 0) + it.total;
    }
  }
  const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    return { day: d, total: Math.round((byDay[d] || 0) * 100) / 100 };
  });
  const [topProduct] = top(byProduct), [topState] = top(byState);
  return {
    ok: true, realOrders, demoOrders, includesDemo: !!demo,
    kpis: {
      sales: Math.round(sales * 100) / 100,
      orders: rows.length,
      avgTicket: rows.length ? Math.round(sales / rows.length * 100) / 100 : 0,
      topProduct: topProduct ? { name: topProduct[0], units: topProduct[1] } : null,
      topState: topState ? { name: topState[0], orders: topState[1] } : null,
      units, avgShipping: rows.length ? Math.round(shippingSum / rows.length * 100) / 100 : 0,
    },
    byCategory: top(byCategory).map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 })),
    byState: top(byState).slice(0, 6).map(([name, orders]) => ({ name, orders })),
    days,
    recent: rows.slice(-8).reverse().map(o => ({ folio: o.folio, date: o.created_at, name: o.customer_name, place: `${o.city || ""}${o.city ? ", " : ""}${o.state || ""}`, total: o.total, demo: !!o.is_demo })),
  };
}
module.exports = { computeKpis };
