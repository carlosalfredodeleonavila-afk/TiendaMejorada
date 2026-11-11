// Aviso por correo de cada pedido. Usa la API de Resend (HTTPS), porque Render gratis bloquea el SMTP.
// Variables de entorno: RESEND_API_KEY, ORDER_EMAIL_TO (tu correo) y, opcional, MAIL_FROM.
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const money = n => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function buildHtml(o){
  const rows = o.items.map(i => `<tr>
    <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(i.name)}${i.size || i.color ? `<br><small style="color:#777">${esc([i.size, i.color].filter(Boolean).join(" · "))}</small>` : ""}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${money(i.total)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:560px;color:#222">
    <h2 style="color:#1E4F46;margin-bottom:4px">Nuevo pedido en LocalStore</h2>
    <p style="margin-top:0">Folio <strong>${esc(o.folio)}</strong></p>
    <h3 style="margin-bottom:4px">Cliente</h3>
    <p style="margin-top:0">${esc(o.customer.fullName)}<br>${esc(o.customer.email)} · ${esc(o.customer.phone)}</p>
    <h3 style="margin-bottom:4px">Envío</h3>
    <p style="margin-top:0">${esc(o.address)}<br>${esc(o.shipping.place)} (≈ ${o.shipping.km} km) · llega en ${esc(o.shipping.days)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f4f1ea"><th style="text-align:left;padding:6px 8px">Producto</th><th style="padding:6px 8px">Cant.</th><th style="text-align:right;padding:6px 8px">Importe</th></tr>${rows}</table>
    <p style="text-align:right;margin:10px 8px 0">Subtotal: ${money(o.subtotal)}<br>Envío: ${money(o.shipping.cost)}<br><strong style="font-size:17px">Total: ${money(o.total)}</strong></p>
  </div>`;
}

async function sendOrderEmail(o){
  const key = process.env.RESEND_API_KEY, to = process.env.ORDER_EMAIL_TO;
  if (!key || !to) { console.log(`[correo] Sin configurar (RESEND_API_KEY / ORDER_EMAIL_TO): no se envió el aviso del pedido ${o.folio}`); return { sent: false, reason: "not-configured" }; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "LocalStore <onboarding@resend.dev>", to: [to],
        subject: `Nuevo pedido ${o.folio} — ${money(o.total)}`, html: buildHtml(o) }),
    });
    if (!res.ok) { console.error(`[correo] Resend respondió ${res.status}: ${await res.text()}`); return { sent: false, reason: "api-error" }; }
    console.log(`[correo] Aviso del pedido ${o.folio} enviado a ${to}`);
    return { sent: true };
  } catch (e) {
    console.error("[correo] No se pudo conectar con Resend:", e.message);
    return { sent: false, reason: "network" };
  }
}
module.exports = { sendOrderEmail, buildHtml };
