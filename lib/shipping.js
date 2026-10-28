// Envíos: costo según la distancia entre la tienda (Ciudad Victoria, Tamaulipas) y la ciudad del cliente.
const STORE = { name: "Ciudad Victoria, Tamaulipas", lat: 23.7369, lng: -99.1411 };
const ROAD_FACTOR = 1.3; // la distancia por carretera es ~30 % mayor que en línea recta

// Capitales (una por estado) con coordenadas aproximadas
const STATES = {
  "Aguascalientes":[21.8853,-102.2916], "Baja California":[32.6245,-115.4523], "Baja California Sur":[24.1426,-110.3128],
  "Campeche":[19.8301,-90.5349], "Chiapas":[16.7539,-93.1156], "Chihuahua":[28.633,-106.0691], "Ciudad de México":[19.4326,-99.1332],
  "Coahuila":[25.4232,-101.0053], "Colima":[19.2433,-103.725], "Durango":[24.0277,-104.6532], "Guanajuato":[21.019,-101.2574],
  "Guerrero":[17.5506,-99.5058], "Hidalgo":[20.1011,-98.7591], "Jalisco":[20.6597,-103.3496], "Estado de México":[19.2826,-99.6557],
  "Michoacán":[19.706,-101.195], "Morelos":[18.9186,-99.2342], "Nayarit":[21.5042,-104.8946], "Nuevo León":[25.6866,-100.3161],
  "Oaxaca":[17.0732,-96.7266], "Puebla":[19.0414,-98.2063], "Querétaro":[20.5888,-100.3899], "Quintana Roo":[18.5001,-88.2961],
  "San Luis Potosí":[22.1565,-100.9855], "Sinaloa":[24.8091,-107.394], "Sonora":[29.0729,-110.9559], "Tabasco":[17.9892,-92.9475],
  "Tamaulipas":[23.7369,-99.1411], "Tlaxcala":[19.3182,-98.2375], "Veracruz":[19.5438,-96.9102], "Yucatán":[20.9674,-89.5926],
  "Zacatecas":[22.7709,-102.5832],
};
const STATE_ALIAS = { "cdmx":"Ciudad de México", "df":"Ciudad de México", "distrito federal":"Ciudad de México", "mexico":"Estado de México",
  "edomex":"Estado de México", "edo de mexico":"Estado de México", "nl":"Nuevo León", "tamps":"Tamaulipas", "qro":"Querétaro",
  "slp":"San Luis Potosí", "bc":"Baja California", "bcs":"Baja California Sur", "q roo":"Quintana Roo" };

// Ciudades importantes (si no está la ciudad se usa la capital del estado)
const CITIES = {
  "Ciudad Victoria":[23.7369,-99.1411], "Tampico":[22.2331,-97.8611], "Ciudad Madero":[22.2767,-97.8311], "Altamira":[22.393,-97.9427],
  "Reynosa":[26.0923,-98.2775], "Matamoros":[25.869,-97.5027], "Nuevo Laredo":[27.4763,-99.5164], "El Mante":[22.743,-98.974],
  "Río Bravo":[25.9884,-98.0933], "Güémez":[23.9167,-99.0167], "Llera":[23.3167,-99.0167], "Jaumave":[23.4167,-99.3833],
  "Soto la Marina":[23.7667,-98.2], "Hidalgo":[24.25,-99.4667], "Ciudad Valles":[21.9875,-99.0136], "Linares":[24.8594,-99.5683],
  "Monterrey":[25.6866,-100.3161], "Guadalupe":[25.6775,-100.2597], "San Nicolás de los Garza":[25.7417,-100.3022], "Apodaca":[25.7817,-100.1883],
  "Guadalajara":[20.6597,-103.3496], "Zapopan":[20.7214,-103.3918], "Tijuana":[32.5149,-117.0382], "Ciudad Juárez":[31.6904,-106.4245],
  "León":[21.125,-101.686], "Cancún":[21.1619,-86.8515], "Playa del Carmen":[20.6296,-87.0739], "Acapulco":[16.8531,-99.8237],
  "Veracruz":[19.1738,-96.1342], "Coatzacoalcos":[18.15,-94.42], "Poza Rica":[20.5331,-97.459], "Tuxpan":[20.957,-97.401],
  "Torreón":[25.5428,-103.4068], "Mazatlán":[23.2494,-106.4111], "Mérida":[20.9674,-89.5926], "Toluca":[19.2826,-99.6557],
  "Querétaro":[20.5888,-100.3899], "Puebla":[19.0414,-98.2063], "Saltillo":[25.4232,-101.0053], "San Luis Potosí":[22.1565,-100.9855],
};

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const STATE_N = Object.fromEntries(Object.keys(STATES).map(n => [norm(n), n]));
const CITY_N = Object.fromEntries(Object.keys(CITIES).map(n => [norm(n), n]));
Object.assign(CITY_N, { "cd victoria": "Ciudad Victoria", "victoria": "Ciudad Victoria", "cd madero": "Ciudad Madero", "cd juarez": "Ciudad Juarez".replace("Juarez", "Juárez"),
  "juarez": "Ciudad Juárez", "cd valles": "Ciudad Valles", "nvo laredo": "Nuevo Laredo", "cd mante": "El Mante", "mante": "El Mante" });

const rad = d => d * Math.PI / 180;
function haversine(a, b){
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(x));
}

// Tarifas por distancia en carretera
const TIERS = [
  { upTo: 15,   cost: 39,  days: "1 día",       zone: "Local" },
  { upTo: 150,  cost: 89,  days: "1 a 2 días",  zone: "Regional" },
  { upTo: 400,  cost: 139, days: "2 a 3 días",  zone: "Zona noreste" },
  { upTo: 800,  cost: 189, days: "3 a 5 días",  zone: "Nacional cercano" },
  { upTo: 1500, cost: 249, days: "4 a 6 días",  zone: "Nacional" },
  { upTo: Infinity, cost: 329, days: "5 a 8 días", zone: "Nacional lejano" },
];

function quote(city, state){
  const st = STATE_N[norm(state)] || STATE_N[norm(STATE_ALIAS[norm(state)])] || STATE_ALIAS[norm(state)];
  const ct = CITY_N[norm(city)];
  let coords, place, matchedBy;
  if (ct) { coords = CITIES[ct]; place = ct; matchedBy = "ciudad"; }
  else if (st) { coords = STATES[st]; place = st; matchedBy = "estado"; }
  else return { ok: false, error: "No reconocimos tu ciudad ni tu estado. Revisa tu domicilio (por ejemplo: Monterrey, Nuevo León)." };
  const km = Math.round(haversine([STORE.lat, STORE.lng], coords) * ROAD_FACTOR);
  const tier = TIERS.find(t => km <= t.upTo);
  return { ok: true, km, cost: tier.cost, days: tier.days, zone: tier.zone, place, matchedBy, origin: STORE.name };
}

const places = () => ({ states: Object.keys(STATES), cities: Object.keys(CITIES) });
module.exports = { quote, places, TIERS, STORE };
