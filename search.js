// Motor de búsqueda: sin acentos/mayúsculas, plurales, prefijos y corrección de errores de escritura.
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");
function stem(w){
  if (w.length < 4) return w;
  if (/[nljrzd]es$/.test(w)) return w.slice(0, -2);   // pantalones → pantalon, relojes → reloj
  if (w.endsWith("s")) return w.slice(0, -1);          // audifonos → audifono
  return w;
}
const tokenize = s => norm(s).split(/\s+/).filter(Boolean).map(stem);

// Distancia de Damerau-Levenshtein (cuenta una transposición como 1 error)
function distance(a, b){
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}

function buildIndex(products){
  const vocab = new Map();   // token → { count, display }
  const docs = new Map();    // id → { name, cat, desc }
  const addVocab = (text, weight) => {
    const raw = String(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    for (const w of raw) {
      const t = stem(norm(w).trim());
      if (!t || t.length < 2) continue;
      const e = vocab.get(t) || { count: 0, display: w };
      e.count += weight; vocab.set(t, e);
    }
  };
  for (const p of products) {
    docs.set(p.id, { name: tokenize(p.name + " " + p.brand), cat: tokenize(p.category + " " + p.type), desc: tokenize(p.description) });
    addVocab(p.name, 3); addVocab(p.category + " " + p.type, 3); addVocab(p.description, 1);
  }
  return { vocab, docs };
}

// Corrige cada palabra que no exista. Devuelve { tokens, corrected, text }
function parseQuery(q, index){
  const original = tokenize(q);
  let changed = false;
  const tokens = original.map(t => {
    if (index.vocab.has(t)) return t;
    if (t.length >= 3) for (const v of index.vocab.keys()) if (v.startsWith(t)) return t; // prefijo ("audif")
    const max = t.length <= 3 ? 0 : t.length <= 7 ? 1 : 2;
    if (!max) return t;
    let best = null, bestD = max + 1, bestCount = 0;
    for (const [v, e] of index.vocab) {
      if (Math.abs(v.length - t.length) > max) continue;
      const dist = distance(t, v);
      if (dist < bestD || (dist === bestD && e.count > bestCount)) { best = v; bestD = dist; bestCount = e.count; }
    }
    if (best && bestD <= max) { changed = true; return best; }
    return t;
  });
  const text = tokens.map(t => index.vocab.get(t)?.display || t).join(" ");
  return { tokens, corrected: changed, text };
}

function scoreProduct(doc, tokens, mode){
  let total = 0, matched = 0;
  for (const t of tokens) {
    let s = 0;
    for (const w of doc.name) { if (w === t) s = Math.max(s, 10); else if (t.length >= 3 && w.startsWith(t)) s = Math.max(s, 6); }
    for (const w of doc.cat)  { if (w === t) s = Math.max(s, 8);  else if (t.length >= 3 && w.startsWith(t)) s = Math.max(s, 5); }
    for (const w of doc.desc) { if (w === t) s = Math.max(s, 2); }
    if (s > 0) matched++;
    total += s;
  }
  if (mode === "and" ? matched < tokens.length : matched === 0) return 0;
  return total;
}

function rank(products, index, tokens, mode = "and"){
  if (!tokens.length) return products.map(p => ({ p, score: 0 }));
  return products.map(p => ({ p, score: scoreProduct(index.docs.get(p.id), tokens, mode) })).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);
}

module.exports = { buildIndex, parseQuery, rank, norm };
