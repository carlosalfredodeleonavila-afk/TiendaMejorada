/* Los productos ahora viven en la base de datos (SQLite) y se piden a la API.
   `cache` guarda los que ya se mostraron para abrir modal / carrito sin volver a pedirlos. */
let CATEGORIES = [];
const cache = new Map();
const API = "/api";
const MAX_PRICE = 20000;
const IMG_FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='500' height='375'><rect width='100%' height='100%' fill='#F3EBDA'/><text x='50%' y='50%' fill='#635A4C' font-family='sans-serif' font-size='18' text-anchor='middle'>Imagen no disponible</text></svg>");
const IMG_ERR = `onerror="this.onerror=null;this.src=IMG_FALLBACK"`;
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* Ícono de carrito reutilizable dentro de los botones "Agregar al carrito" */
const CART_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;">
  <circle cx="9" cy="21" r="1.4"/><circle cx="19" cy="21" r="1.4"/>
  <path d="M2.5 3h2.4l2.5 12.4a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.6l1.6-8.4H6"/>
</svg>`;

/* ---------------------- ESTADO ---------------------- */
const state = {
  search: "",
  category: "Todas",
  onlyStock: false,
  maxPrice: MAX_PRICE,
  page: 1,
  minRating: 0,
  sort: "relevance",
};

/* ---------------------- CUENTAS ----------------------
   Cada cuenta (por correo) guarda sus propios datos y su propio carrito,
   para que al cerrar sesión y volver a entrar todo siga como lo dejaste. */
function loadAccounts(){
  try{ return JSON.parse(localStorage.getItem("mv_accounts")) || {}; }catch(e){ return {}; }
}
function saveAccounts(accounts){ localStorage.setItem("mv_accounts", JSON.stringify(accounts)); }

function cartKeyFor(email){ return "mv_cart_" + (email || "guest"); }

function loadCartFor(email){
  try{ return (JSON.parse(localStorage.getItem(cartKeyFor(email))) || []).filter(i => i && i.name); }catch(e){ return []; }
}
function saveCart(){
  localStorage.setItem(cartKeyFor(currentUser ? currentUser.email : null), JSON.stringify(cart));
}

/* Sesión activa: qué correo está actualmente conectado (o ninguno = invitado) */
function loadCurrentUser(){
  const email = localStorage.getItem("mv_current_email");
  if(!email) return null;
  const accounts = loadAccounts();
  return accounts[email] || null;
}

let currentUser = loadCurrentUser();               // objeto usuario o null (invitado)
let cart = loadCartFor(currentUser ? currentUser.email : null); // [{id, qty}] del usuario activo
let reviews = loadReviews();    // { productId: [{author, rating, text, date}] }
let activeProductId = null;

/* Cambia de cuenta activa (o a invitado con email=null) y carga su carrito guardado */
function switchToAccount(user){
  currentUser = user;
  if(user){
    localStorage.setItem("mv_current_email", user.email);
  }else{
    localStorage.removeItem("mv_current_email");
  }
  cart = loadCartFor(user ? user.email : null);
  updateLoginUI();
  renderCartBadge();
  renderCartDrawer();
}

function logout(){
  const name = currentUser ? currentUser.fullName.split(" ")[0] : "";
  switchToAccount(null);
  showToast(name ? `Hasta pronto, ${name}. Tu carrito quedó guardado para la próxima vez.` : "Cerraste sesión.");
}

function loadReviews(){
  try{
    const stored = JSON.parse(localStorage.getItem("mv_reviews"));
    if(stored) return stored;
  }catch(e){ /* ignore */ }
  // Reseñas semilla para que la tienda no se sienta vacía
  return {
    "1": [
      { author: "Marisol T.", rating: 5, text: "Excelente cancelación de ruido, los uso todos los días en el camión.", date: "2026-06-14" },
      { author: "Iván R.", rating: 4, text: "Muy cómodos, la batería sí rinde lo que dicen.", date: "2026-05-02" }
    ],
    "85": [
      { author: "Carla G.", rating: 5, text: "Corrí mi primer 10K con ellos, cero rozaduras.", date: "2026-07-20" }
    ],
    "337": [
      { author: "Renata M.", rating: 5, text: "Grosor perfecto, no resbala nada.", date: "2026-04-11" },
      { author: "Diego P.", rating: 4, text: "Buena calidad, huele fuerte los primeros días.", date: "2026-03-30" }
    ]
  };
}
function saveReviews(){ localStorage.setItem("mv_reviews", JSON.stringify(reviews)); }

/* ---------------------- UTILIDADES ---------------------- */
function formatPrice(n){
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function starString(rating){
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
function getProduct(id){
  id = String(id);
  return cache.get(id) || cart.find(i => String(i.id) === id && i.name);   // el carrito guarda una copia del producto
}
async function openProduct(id){
  id = String(id);
  if(!cache.has(id)){
    try{ const r = await fetch(`${API}/products/${id}`); if(!r.ok) throw 0; cache.set(id, await r.json()); }
    catch(e){ showToast("No pudimos abrir ese producto.", { isError: true }); return; }
  }
  openProductModal(id);
}

function showToast(message, { actionLabel, onAction, isError } = {}){
  const region = document.getElementById("toastRegion");
  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " toast--error" : "");
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>${message}</span>`;
  if(actionLabel){
    const btn = document.createElement("button");
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => { onAction && onAction(); toast.remove(); });
    toast.appendChild(btn);
  }
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

/* =========================================================
   RENDER: BARRA DE CATEGORÍAS
   ========================================================= */
function renderCategoryBar(){
  const list = document.getElementById("categoryList");
  const listMobile = document.getElementById("categoryListMobile");
  const catFilters = document.getElementById("categoryFilters");

  const all = ["Todas", ...CATEGORIES];

  list.innerHTML = all.map(cat =>
    `<li><button data-cat="${cat}" class="${state.category === cat ? "active" : ""}">${cat}</button></li>`
  ).join("");

  listMobile.innerHTML = all.map(cat =>
    `<li><button data-cat="${cat}" class="${state.category === cat ? "active" : ""}">${cat}</button></li>`
  ).join("");

  catFilters.innerHTML = all.map(cat => `
    <label class="checkbox-row">
      <input type="radio" name="catRadio" value="${cat}" ${state.category === cat ? "checked" : ""}>
      <span>${cat}</span>
    </label>
  `).join("");

  [list, listMobile].forEach(el => {
    el.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        state.category = btn.dataset.cat;
        closeCategoryDrawer();
        renderCategoryBar();
        renderProducts();
      });
    });
  });

  catFilters.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      state.category = input.value;
      renderCategoryBar();
      renderProducts();
    });
  });
}

/* =========================================================
   RENDER: FILTRO DE CALIFICACIÓN
   ========================================================= */
function renderRatingFilters(){
  const container = document.getElementById("ratingFilters");
  const options = [0, 3, 4, 4.5];
  container.innerHTML = options.map(val => `
    <label class="checkbox-row">
      <input type="radio" name="ratingRadio" value="${val}" ${state.minRating === val ? "checked" : ""}>
      <span>${val === 0 ? "Todas" : `${val}+ ${starString(val).slice(0,1)}`}</span>
    </label>
  `).join("");
  container.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      state.minRating = parseFloat(input.value);
      renderProducts();
    });
  });
}

/* =========================================================
   BÚSQUEDA Y FILTROS → consultan a la API (/api/products)
   ========================================================= */
let loadSeq = 0, loadTimer = null, loadedItems = [];

function buildParams(page){
  const p = new URLSearchParams();
  if(state.search.trim()) p.set("q", state.search.trim());
  if(state.category !== "Todas") p.set("category", state.category);
  if(state.onlyStock) p.set("inStock", "true");
  if(state.maxPrice < MAX_PRICE) p.set("maxPrice", state.maxPrice);
  if(state.minRating > 0) p.set("minRating", state.minRating);
  p.set("sort", state.sort);
  p.set("page", page);
  return p;
}

/* Los filtros llaman a renderProducts(): espera un instante (para el deslizador de precio) y consulta */
function renderProducts(){
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => loadProducts(true), 120);
}

async function loadProducts(reset){
  const seq = ++loadSeq;
  const page = reset ? 1 : state.page + 1;
  const loadMore = $("loadMore");
  if(reset) $("resultsCount").textContent = "Buscando…";
  loadMore.disabled = true;
  try{
    const res = await fetch(`${API}/products?${buildParams(page)}`);
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    if(seq !== loadSeq) return;                 // llegó una respuesta de una búsqueda anterior
    state.page = page;
    [...data.items, ...data.related].forEach(p => cache.set(p.id, p));
    loadedItems = reset ? data.items : loadedItems.concat(data.items);
    paintResults(data);
  }catch(e){
    if(seq !== loadSeq) return;
    $("resultsCount").textContent = "No pudimos cargar los productos.";
    showToast("No se pudo conectar con el servidor.", { isError: true, actionLabel: "Reintentar", onAction: () => loadProducts(reset) });
  }finally{
    loadMore.disabled = false;
  }
}

/* Resalta en el nombre las palabras buscadas (ignora acentos y mayúsculas) */
function highlight(text, query){
  const base = [...text].map(c => c.normalize("NFD")[0].toLowerCase()).join("");
  const words = (query || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/)
    .filter(w => w.length >= 2).map(w => w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
  const mark = new Array(text.length).fill(false);
  words.forEach(w => { let i = base.indexOf(w); while(i !== -1){ for(let k = i; k < i + w.length; k++) mark[k] = true; i = base.indexOf(w, i + 1); } });
  let out = "", open = false;
  [...text].forEach((ch, i) => {
    if(mark[i] && !open){ out += "<mark>"; open = true; }
    if(!mark[i] && open){ out += "</mark>"; open = false; }
    out += esc(ch);
  });
  return out + (open ? "</mark>" : "");
}

function productCard(p, hlQuery){
  const outOfStock = p.stock <= 0;
  const lowStock = !outOfStock && p.stock <= 5;
  return `
  <article class="product-card">
    <div class="product-card__imgwrap">
      ${outOfStock ? `<span class="badge badge--out">Agotado</span>` : (lowStock ? `<span class="badge">¡Últimas piezas!</span>` : "")}
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="500" height="375" ${IMG_ERR}>
    </div>
    <div class="product-card__body">
      <span class="product-card__category">${esc(p.category)}</span>
      <button class="product-card__title" data-open="${p.id}">${highlight(p.name, hlQuery)}</button>
      <div class="stars">
        <span class="stars__icons" aria-hidden="true">${starString(p.rating)}</span>
        <span>${p.rating.toFixed(1)} (${p.ratingCount + (reviews[p.id]?.length || 0)})</span>
      </div>
      <div class="product-card__price-row">
        <span class="product-card__price">${formatPrice(p.price)}</span>
        <span class="product-card__stock ${outOfStock ? "product-card__stock--out" : lowStock ? "product-card__stock--low" : ""}">
          ${outOfStock ? "Sin existencia" : `${p.stock} disponibles`}
        </span>
      </div>
    </div>
    <div class="product-card__actions">
      <button class="btn btn--primary btn--full" data-add="${p.id}" ${outOfStock ? "disabled" : ""}>
        ${outOfStock ? "Agotado" : `${CART_ICON_SVG} Agregar al carrito`}
      </button>
    </div>
  </article>`;
}

function paintResults(data){
  const grid = $("productGrid"), empty = $("emptyState"), dym = $("didYouMean");
  const shown = data.correctedQuery || data.query;

  // Mensaje de "quisiste decir"
  if(data.correctedQuery){
    dym.innerHTML = `Mostrando resultados para <strong>${esc(data.correctedQuery)}</strong>. Buscaste “${esc(data.query)}”.`;
    dym.hidden = false;
  }else{ dym.hidden = true; }

  // Contador de resultados
  const noun = data.total === 1 ? "producto" : "productos";
  let text = `${data.total} ${noun}` + (shown ? ` para “${shown}”` : "");
  if(data.total > loadedItems.length) text += ` · mostrando ${loadedItems.length}`;
  $("resultsCount").textContent = text;

  if(data.total === 0){
    grid.innerHTML = "";
    $("loadMore").hidden = true;
    renderEmpty(data);
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = loadedItems.map(p => productCard(p, shown)).join("");
  $("loadMore").hidden = state.page >= data.pages;
}

/* Estado "sin resultados": explica qué pasó y ofrece salidas */
function renderEmpty(data){
  const q = data.query;
  const title = q ? `No encontramos resultados para “${esc(q)}”` : "No encontramos productos con esos filtros";
  const tip = q
    ? "Revisa la ortografía, usa una palabra más general (por ejemplo “tenis” en lugar de “tenis azules de running”) o quita algún filtro."
    : "Prueba subiendo el precio máximo o quitando algún filtro.";
  const related = data.related.length ? `
    <p class="empty-state__label">Productos que podrían interesarte:</p>
    <div class="chips">${data.related.map(p => `<button class="chip" data-open-product="${p.id}">${esc(p.name)}</button>`).join("")}</div>` : "";
  const cats = CATEGORIES.length ? `
    <p class="empty-state__label">O explora por categoría:</p>
    <div class="chips">${CATEGORIES.map(c => `<button class="chip" data-go-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : "";
  $("emptyState").innerHTML = `
    <div class="empty-state__icon" aria-hidden="true">🔍</div>
    <h3>${title}</h3>
    <p>${tip}</p>${related}${cats}
    <button class="link-btn" data-reset>Quitar todos los filtros</button>`;
}

function handleEmptyClick(e){
  const cat = e.target.closest("[data-go-cat]");
  const prod = e.target.closest("[data-open-product]");
  if(cat){
    state.category = cat.dataset.goCat; state.search = ""; $("searchInput").value = "";
    renderCategoryBar(); loadProducts(true);
  }else if(prod){ openProduct(prod.dataset.openProduct); }
  else if(e.target.closest("[data-reset]")){ resetFilters(); }
}

function setupGrid(){
  $("productGrid").addEventListener("click", e => {
    const open = e.target.closest("[data-open]"), add = e.target.closest("[data-add]");
    if(open) openProductModal(open.dataset.open);
    else if(add) addToCart(add.dataset.add);
  });
}

/* ---------------- Barra de búsqueda con autocompletado ---------------- */
let suggestTimer = null, suggestSeq = 0, suggestActive = -1;

function hideSuggest(){
  const box = $("suggestBox"); box.hidden = true; box.innerHTML = ""; suggestActive = -1;
  $("searchInput").setAttribute("aria-expanded", "false");
}

async function fetchSuggestions(q){
  const seq = ++suggestSeq;
  if(q.trim().length < 2){ hideSuggest(); return; }
  try{
    const data = await (await fetch(`${API}/suggest?q=${encodeURIComponent(q.trim())}`)).json();
    if(seq !== suggestSeq) return;
    const rows = [];
    if(data.correctedQuery) rows.push({ type: "term", value: data.correctedQuery, label: `¿Quisiste decir “${data.correctedQuery}”?`, hint: "" });
    data.categories.forEach(c => rows.push({ type: "cat", value: c, label: c, hint: "Categoría" }));
    data.products.forEach(p => rows.push({ type: "prod", value: p.name, label: p.name, hint: "" }));
    if(!rows.length){ hideSuggest(); return; }
    const base = data.correctedQuery || q;
    $("suggestBox").innerHTML = rows.map((r, i) => `
      <li role="option" id="sug-${i}" aria-selected="false" data-type="${r.type}" data-value="${esc(r.value)}">
        <span>${r.type === "term" ? esc(r.label) : highlight(r.label, base)}</span>
        <span class="suggest__hint">${r.hint}</span>
      </li>`).join("");
    suggestActive = -1;
    $("suggestBox").hidden = false;
    $("searchInput").setAttribute("aria-expanded", "true");
  }catch(e){ hideSuggest(); }
}

function chooseSuggestion(li){
  const input = $("searchInput");
  hideSuggest();
  if(li.dataset.type === "cat"){
    state.category = li.dataset.value; state.search = ""; input.value = "";
    renderCategoryBar();
  }else{
    input.value = li.dataset.value; state.search = li.dataset.value;
  }
  loadProducts(true);
}

function setupSearch(){
  const input = $("searchInput"), box = $("suggestBox"), form = $("searchForm");
  let typeTimer = null;

  input.addEventListener("input", () => {
    state.search = input.value;
    clearTimeout(typeTimer);  typeTimer = setTimeout(() => loadProducts(true), 300);   // espera a que dejes de escribir
    clearTimeout(suggestTimer); suggestTimer = setTimeout(() => fetchSuggestions(input.value), 180);
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    clearTimeout(typeTimer); hideSuggest();
    state.search = input.value;
    loadProducts(true);
  });
  input.addEventListener("keydown", e => {
    const items = [...box.querySelectorAll("li")];
    if(e.key === "Escape"){ hideSuggest(); return; }
    if(!items.length || box.hidden) return;
    if(e.key === "ArrowDown" || e.key === "ArrowUp"){
      e.preventDefault();
      suggestActive = (suggestActive + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => { li.classList.toggle("active", i === suggestActive); li.setAttribute("aria-selected", i === suggestActive); });
      input.setAttribute("aria-activedescendant", items[suggestActive].id);
    }else if(e.key === "Enter" && suggestActive >= 0){
      e.preventDefault(); clearTimeout(typeTimer); chooseSuggestion(items[suggestActive]);
    }
  });
  box.addEventListener("mousedown", e => e.preventDefault());   // no pierde el foco al hacer clic
  box.addEventListener("click", e => { const li = e.target.closest("li"); if(li) chooseSuggestion(li); });
  input.addEventListener("focus", () => { if(input.value.trim().length >= 2) fetchSuggestions(input.value); });
  document.addEventListener("click", e => { if(!form.contains(e.target)) hideSuggest(); });
}

/* =========================================================
   CARRITO
   ========================================================= */
function addToCart(productId, qty = 1){
  const product = getProduct(productId);
  if(!product || product.stock <= 0) return;

  const existing = cart.find(item => item.id === productId);
  const currentQty = existing ? existing.qty : 0;

  if(currentQty + qty > product.stock){
    showToast(`Solo quedan ${product.stock} de "${product.name}" en existencia.`, { isError: true });
    return;
  }

  if(existing){ existing.qty += qty; }
  else{ cart.push({ id: productId, qty, name: product.name, price: product.price, image: product.image, stock: product.stock, category: product.category }); }

  saveCart();
  renderCartBadge();
  renderCartDrawer();
  showToast(`"${product.name}" se agregó al carrito.`, {
    actionLabel: "Ver carrito",
    onAction: openCart
  });
}

function updateQty(productId, delta){
  const item = cart.find(i => i.id === productId);
  if(!item) return;
  const product = getProduct(productId);
  const newQty = item.qty + delta;

  if(newQty <= 0){
    removeFromCart(productId, { silent: true });
    return;
  }
  if(newQty > product.stock){
    showToast(`Solo hay ${product.stock} unidades disponibles.`, { isError: true });
    return;
  }
  item.qty = newQty;
  saveCart();
  renderCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId, { silent } = {}){
  const removedItem = cart.find(i => i.id === productId);
  const product = getProduct(productId);
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  renderCartBadge();
  renderCartDrawer();

  if(!silent && removedItem){
    showToast(`Se quitó "${product.name}" del carrito.`, {
      actionLabel: "Deshacer",
      onAction: () => {
        cart.push(removedItem);
        saveCart();
        renderCartBadge();
        renderCartDrawer();
      }
    });
  }
}

function clearCart(){
  if(cart.length === 0) return;
  if(!confirm("¿Vaciar todo el carrito? Esta acción no se puede deshacer.")) return;
  cart = [];
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  showToast("Se vació el carrito.");
}

function cartCount(){ return cart.reduce((sum, i) => sum + i.qty, 0); }
function cartSubtotal(){
  return cart.reduce((sum, i) => {
    const p = getProduct(i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function renderCartBadge(){
  document.getElementById("cartBadge").textContent = cartCount();
}

function renderCartDrawer(){
  const body = document.getElementById("cartBody");
  const subtotalEl = document.getElementById("cartSubtotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if(cart.length === 0){
    body.innerHTML = `<div class="cart-empty">Tu carrito está vacío.<br>Explora los productos y agrega lo que te guste.</div>`;
    checkoutBtn.disabled = true;
  }else{
    checkoutBtn.disabled = false;
    body.innerHTML = cart.map(item => {
      const p = getProduct(item.id);
      if(!p) return "";
      return `
      <div class="cart-item">
        <img src="${p.image}" alt="${esc(p.name)}" width="64" height="64" ${IMG_ERR}>
        <div class="cart-item__info">
          <div class="cart-item__name">${p.name}</div>
          <div class="cart-item__price">${formatPrice(p.price)} c/u</div>
          <div class="qty-control">
            <button data-dec="${p.id}" aria-label="Quitar una unidad de ${p.name}">−</button>
            <span aria-live="polite">${item.qty}</span>
            <button data-inc="${p.id}" aria-label="Agregar una unidad de ${p.name}">+</button>
          </div>
        </div>
        <button class="cart-item__remove" data-remove="${p.id}" aria-label="Eliminar ${p.name} del carrito" title="Eliminar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>`;
    }).join("");
  }

  subtotalEl.textContent = formatPrice(cartSubtotal());

  body.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => updateQty(b.dataset.inc, 1)));
  body.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => updateQty(b.dataset.dec, -1)));
  body.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
}

/* Cierra cualquier panel/modal que esté abierto (evita tener dos a la vez) */
function closeAllOverlays(){
  closeCart();
  closeLoginModal();
  closeProductModal();
  closeCategoryDrawer();
}

/* Abrir / cerrar carrito */
function openCart(){
  closeLoginModal();
  closeProductModal();
  closeCategoryDrawer();
  document.getElementById("cartOverlay").hidden = false;
  const drawer = document.getElementById("cartDrawer");
  drawer.hidden = false;
  document.getElementById("closeCart").focus();
  document.body.style.overflow = "hidden";
}
function closeCart(){
  document.getElementById("cartOverlay").hidden = true;
  document.getElementById("cartDrawer").hidden = true;
  document.body.style.overflow = "";
}

/* =========================================================
   LOGIN / SESIÓN
   ========================================================= */
const REQUIRED_FIELDS = ["fullName", "email", "phone", "street", "neighborhood", "zip", "city", "state"];

function validateField(id, value){
  switch(id){
    case "fullName":
      return value.trim().length >= 3 ? "" : "Escribe tu nombre completo.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Escribe un correo válido.";
    case "phone":
      return /^\d{10}$/.test(value.replace(/\s/g, "")) ? "" : "Escribe un teléfono a 10 dígitos.";
    case "zip":
      return /^\d{4,5}$/.test(value.trim()) ? "" : "Escribe un código postal válido.";
    default:
      return value.trim().length >= 2 ? "" : "Este campo es obligatorio.";
  }
}

function handleLoginSubmit(e){
  e.preventDefault();
  const form = e.target;
  let hasError = false;
  const data = {};

  REQUIRED_FIELDS.forEach(id => {
    const input = document.getElementById(id);
    const error = validateField(id, input.value);
    data[id] = input.value.trim();
    const errEl = document.getElementById("err-" + id);
    if(error){
      hasError = true;
      input.setAttribute("aria-invalid", "true");
      errEl.textContent = error;
    }else{
      input.removeAttribute("aria-invalid");
      errEl.textContent = "";
    }
  });

  if(hasError){
    showToast("Revisa los campos marcados en rojo.", { isError: true });
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  data.references = document.getElementById("references").value.trim();

  const accounts = loadAccounts();
  const isNewAccount = !accounts[data.email];
  accounts[data.email] = data;
  saveAccounts(accounts);

  switchToAccount(data);
  closeLoginModal();
  showToast(isNewAccount
    ? `¡Bienvenido/a, ${data.fullName.split(" ")[0]}! Guardamos tu domicilio para tus envíos.`
    : `¡Qué bueno verte de nuevo, ${data.fullName.split(" ")[0]}!`);
}

function updateLoginUI(){
  const label = document.getElementById("loginLabel");
  const logoutBtn = document.getElementById("logoutBtn");
  if(currentUser){
    label.textContent = currentUser.fullName.split(" ")[0];
    logoutBtn.hidden = false;
  }else{
    label.textContent = "Iniciar sesión";
    logoutBtn.hidden = true;
  }
}

function prefillLoginForm(){
  if(!currentUser) return;
  Object.entries(currentUser).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if(input) input.value = value;
  });
}

function openLoginModal(){
  closeCart();
  closeProductModal();
  closeCategoryDrawer();
  document.getElementById("loginOverlay").hidden = false;
  document.getElementById("loginModal").hidden = false;
  prefillLoginForm();
  document.getElementById("fullName").focus();
  document.body.style.overflow = "hidden";
}
function closeLoginModal(){
  document.getElementById("loginOverlay").hidden = true;
  document.getElementById("loginModal").hidden = true;
  document.body.style.overflow = "";
}

/* =========================================================
   MODAL DE PRODUCTO + RESEÑAS
   ========================================================= */
let selectedStars = 0;

function openProductModal(productId){
  activeProductId = productId;
  const p = getProduct(productId);
  if(!p) return;

  const content = document.getElementById("productModalContent");
  const productReviews = reviews[productId] || [];
  const outOfStock = p.stock <= 0;

  content.innerHTML = `
    <div class="product-detail">
      <div class="product-detail__img"><img src="${p.image}" alt="${esc(p.name)}" ${IMG_ERR}></div>
      <div class="product-detail__info">
        <span class="product-detail__meta">${p.category}</span>
        <h2 id="productModalTitle">${p.name}</h2>
        <div class="stars">
          <span class="stars__icons" aria-hidden="true">${starString(p.rating)}</span>
          <span>${p.rating.toFixed(1)} · ${p.ratingCount + productReviews.length} reseñas</span>
        </div>
        <div class="product-detail__price">${formatPrice(p.price)}</div>
        <p class="product-detail__desc">${p.description}</p>
        <p class="product-card__stock ${outOfStock ? "product-card__stock--out" : ""}">${outOfStock ? "Sin existencia por ahora" : `${p.stock} piezas disponibles`}</p>
        <button class="btn btn--primary btn--full" id="modalAddBtn" ${outOfStock ? "disabled" : ""}>
          ${outOfStock ? "Agotado" : `${CART_ICON_SVG} Agregar al carrito`}
        </button>
      </div>

      <div class="reviews">
        <h3>Reseñas de clientes (${productReviews.length})</h3>
        <div id="reviewsList">
          ${productReviews.length === 0
            ? `<p class="cart-hint">Aún no hay reseñas. ¡Sé la primera persona en opinar!</p>`
            : productReviews.map(r => `
              <div class="review-item">
                <div class="review-item__head">
                  <span class="review-item__author">${r.author}</span>
                  <span class="review-item__date">${r.date}</span>
                </div>
                <div class="stars__icons" aria-hidden="true">${starString(r.rating)}</div>
                <p class="review-item__text">${r.text}</p>
              </div>
            `).join("")}
        </div>

        <form class="review-form" id="reviewForm">
          <label for="reviewText">Escribe tu reseña</label>
          <p class="review-form__note" id="reviewRatingLabel">Selecciona tu calificación:</p>
          <div class="star-picker" id="starPicker" role="radiogroup" aria-label="Calificación en estrellas">
            ${[1,2,3,4,5].map(n => `<button type="button" data-star="${n}" role="radio" aria-checked="false" aria-label="${n} estrella${n>1?"s":""}">★</button>`).join("")}
          </div>
          <textarea id="reviewText" placeholder="¿Qué te pareció el producto?" required></textarea>
          <p class="error-msg" id="reviewError"></p>
          <button type="submit" class="btn btn--secondary" style="margin-top:10px;">Publicar reseña</button>
        </form>
      </div>
    </div>
  `;

  selectedStars = 0;
  document.getElementById("modalAddBtn")?.addEventListener("click", () => {
    addToCart(productId);
  });

  const starPicker = document.getElementById("starPicker");
  starPicker.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedStars = parseInt(btn.dataset.star, 10);
      starPicker.querySelectorAll("button").forEach(b => {
        const active = parseInt(b.dataset.star, 10) <= selectedStars;
        b.classList.toggle("selected", active);
        b.setAttribute("aria-checked", parseInt(b.dataset.star,10) === selectedStars ? "true" : "false");
      });
    });
  });

  document.getElementById("reviewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const textEl = document.getElementById("reviewText");
    const errorEl = document.getElementById("reviewError");

    if(selectedStars === 0){
      errorEl.textContent = "Selecciona una calificación en estrellas.";
      return;
    }
    if(textEl.value.trim().length < 5){
      errorEl.textContent = "Escribe un poco más sobre tu experiencia.";
      textEl.focus();
      return;
    }
    errorEl.textContent = "";

    const author = currentUser ? currentUser.fullName : "Usuario invitado";
    const newReview = {
      author,
      rating: selectedStars,
      text: textEl.value.trim(),
      date: new Date().toISOString().slice(0, 10)
    };
    if(!reviews[productId]) reviews[productId] = [];
    reviews[productId].unshift(newReview);
    saveReviews();
    showToast("¡Gracias por tu reseña!");
    openProductModal(productId); // re-render con la nueva reseña
    renderProducts(); // actualiza conteo en la tarjeta
  });

  closeCart();
  closeLoginModal();
  closeCategoryDrawer();
  document.getElementById("productOverlay").hidden = false;
  document.getElementById("productModal").hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("closeProduct").focus();
}

function closeProductModal(){
  document.getElementById("productOverlay").hidden = true;
  document.getElementById("productModal").hidden = true;
  document.body.style.overflow = "";
  activeProductId = null;
}

/* =========================================================
   DRAWER DE CATEGORÍAS (móvil)
   ========================================================= */
function openCategoryDrawer(){
  closeCart();
  closeLoginModal();
  closeProductModal();
  document.getElementById("categoryOverlay").hidden = false;
  document.getElementById("categoryDrawer").hidden = false;
  document.getElementById("menuToggle").setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}
function closeCategoryDrawer(){
  document.getElementById("categoryOverlay").hidden = true;
  document.getElementById("categoryDrawer").hidden = true;
  document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

/* =========================================================
   INICIALIZACIÓN Y EVENTOS GLOBALES
   ========================================================= */
async function init(){
  try{ CATEGORIES = (await (await fetch(`${API}/categories`)).json()).map(c => c.name); }catch(e){ CATEGORIES = []; }
  renderCategoryBar();
  renderRatingFilters();
  renderProducts();
  renderCartBadge();
  renderCartDrawer();
  updateLoginUI();

  // Buscador (con sugerencias) y rejilla de productos
  setupSearch();
  setupGrid();

  // Filtros
  document.getElementById("onlyStock").addEventListener("change", (e) => {
    state.onlyStock = e.target.checked;
    renderProducts();
  });
  document.getElementById("priceRange").addEventListener("input", (e) => {
    state.maxPrice = parseInt(e.target.value, 10);
    document.getElementById("priceOutput").textContent = formatPrice(state.maxPrice);
    renderProducts();
  });
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderProducts();
  });
  document.getElementById("clearFilters").addEventListener("click", resetFilters);
  document.getElementById("emptyState").addEventListener("click", handleEmptyClick);
  document.getElementById("loadMore").addEventListener("click", () => loadProducts(false));

  // Carrito
  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", () => { closeCart(); document.getElementById("cartToggle").focus(); });
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document.getElementById("clearCartBtn").addEventListener("click", clearCart);
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    if(!currentUser){
      closeCart();
      showToast("Inicia sesión para guardar tu domicilio antes de finalizar la compra.", { isError: true });
      openLoginModal();
      return;
    }
    showToast(`¡Gracias por tu compra, ${currentUser.fullName.split(" ")[0]}! Se enviará a ${currentUser.street}, ${currentUser.neighborhood}.`);
    cart = [];
    saveCart();
    renderCartBadge();
    renderCartDrawer();
    closeCart();
  });

  // Login
  document.getElementById("loginBtn").addEventListener("click", openLoginModal);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("closeLogin").addEventListener("click", () => { closeLoginModal(); document.getElementById("loginBtn").focus(); });
  document.getElementById("loginOverlay").addEventListener("click", closeLoginModal);
  document.getElementById("loginForm").addEventListener("submit", handleLoginSubmit);

  // Producto / reseñas
  document.getElementById("closeProduct").addEventListener("click", closeProductModal);
  document.getElementById("productOverlay").addEventListener("click", closeProductModal);

  // Drawer categorías móvil
  document.getElementById("menuToggle").addEventListener("click", openCategoryDrawer);
  document.getElementById("closeCategoryDrawer").addEventListener("click", () => { closeCategoryDrawer(); document.getElementById("menuToggle").focus(); });
  document.getElementById("categoryOverlay").addEventListener("click", closeCategoryDrawer);

  // Ayuda (heurística: ayuda y documentación)
  document.getElementById("helpBtn").addEventListener("click", () => {
    alert("LocalStore:\n\n1) Usa los filtros o la barra de categorías para explorar productos.\n2) Da clic en un producto para ver detalles y reseñas.\n3) Agrega productos al carrito y ajusta cantidades con + y -.\n4) Inicia sesión para guardar tu domicilio y finalizar tu compra.");
  });

  // Cerrar modales con tecla Escape (heurística: control y libertad del usuario)
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeAllOverlays();
  });
}

function resetFilters(){
  state.search = "";
  state.category = "Todas";
  state.onlyStock = false;
  state.maxPrice = MAX_PRICE;
  state.minRating = 0;
  state.sort = "relevance";

  document.getElementById("searchInput").value = "";
  hideSuggest();
  document.getElementById("onlyStock").checked = false;
  document.getElementById("priceRange").value = MAX_PRICE;
  document.getElementById("priceOutput").textContent = formatPrice(MAX_PRICE);
  document.getElementById("sortSelect").value = "relevance";

  renderCategoryBar();
  renderRatingFilters();
  renderProducts();
}

document.addEventListener("DOMContentLoaded", init);
