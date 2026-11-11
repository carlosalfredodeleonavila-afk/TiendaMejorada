// Consulta de códigos postales de México (catálogo de SEPOMEX convertido a data/cp.json)
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "cp.json");
let DATA;
function load(){
  if (DATA !== undefined) return DATA;
  try { DATA = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { DATA = null; }
  return DATA;
}
const available = () => !!load();
function lookup(zip){
  const d = load(), z = String(zip || "").trim();
  return d && /^\d{5}$/.test(z) ? (d[z] || null) : null;
}
module.exports = { lookup, available, all: load };
