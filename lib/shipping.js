// Envíos: costo según la distancia entre la tienda (Ciudad Victoria, Tamaulipas) y el código postal del cliente.
// CP → (estado, municipio) con el catálogo de SEPOMEX → coordenadas de la ciudad (o de la capital del estado) → km → tarifa.
const cp = require("./cp");
const STORE = { name: "Ciudad Victoria, Tamaulipas", lat: 23.7369, lng: -99.1411 };
const ROAD_FACTOR = 1.3; // la distancia por carretera es ~30 % mayor que en línea recta

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Capital de cada estado (coordenadas aproximadas)
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
const STATE_BY_NORM = Object.fromEntries(Object.keys(STATES).map(n => [norm(n), n]));
const STATE_ALIAS = { "cdmx":"Ciudad de México", "df":"Ciudad de México", "distrito federal":"Ciudad de México", "mexico":"Estado de México",
  "edomex":"Estado de México", "edo de mexico":"Estado de México", "nl":"Nuevo León", "tamps":"Tamaulipas", "qro":"Querétaro",
  "slp":"San Luis Potosí", "bc":"Baja California", "bcs":"Baja California Sur", "q roo":"Quintana Roo" };

// Convierte cualquier forma de escribir un estado (incluida la de SEPOMEX) al nombre canónico
function canonState(name){
  const n = norm(name);
  if (!n) return null;
  if (STATE_BY_NORM[n]) return STATE_BY_NORM[n];
  if (STATE_ALIAS[n]) return STATE_ALIAS[n];
  const hit = Object.keys(STATE_BY_NORM).filter(k => n.startsWith(k + " ")).sort((a, b) => b.length - a.length)[0];
  return hit ? STATE_BY_NORM[hit] : null; // "Coahuila de Zaragoza" → Coahuila, "Veracruz de Ignacio de la Llave" → Veracruz
}

// Ciudades: nombre | estado | latitud | longitud
const CITY_DATA = `
Ciudad Victoria|Tamaulipas|23.7369|-99.1411
Tampico|Tamaulipas|22.2331|-97.8611
Ciudad Madero|Tamaulipas|22.2767|-97.8311
Altamira|Tamaulipas|22.393|-97.9427
Reynosa|Tamaulipas|26.0923|-98.2775
Matamoros|Tamaulipas|25.869|-97.5027
Nuevo Laredo|Tamaulipas|27.4763|-99.5164
El Mante|Tamaulipas|22.743|-98.974
Río Bravo|Tamaulipas|25.9884|-98.0933
Valle Hermoso|Tamaulipas|25.6667|-97.8167
San Fernando|Tamaulipas|24.8478|-98.1558
González|Tamaulipas|22.8167|-98.4333
Xicoténcatl|Tamaulipas|23|-98.95
Aldama|Tamaulipas|22.9167|-98.0667
Soto la Marina|Tamaulipas|23.7667|-98.2
Güémez|Tamaulipas|23.9167|-99.0167
Jaumave|Tamaulipas|23.4167|-99.3833
Llera|Tamaulipas|23.3167|-99.0167
Hidalgo|Tamaulipas|24.25|-99.4667
Padilla|Tamaulipas|24.05|-98.8833
Miguel Alemán|Tamaulipas|26.4|-99.0167
Camargo|Tamaulipas|26.3167|-98.8333
Gustavo Díaz Ordaz|Tamaulipas|26.25|-98.6
Tula|Tamaulipas|23|-99.7167
Villagrán|Tamaulipas|24.4833|-99.4833
Burgos|Tamaulipas|24.95|-98.8
Jiménez|Tamaulipas|24.2|-98.4667
Abasolo|Tamaulipas|24.0667|-98.3667
Antiguo Morelos|Tamaulipas|22.55|-98.7833
Gómez Farías|Tamaulipas|23.05|-99.15
Monterrey|Nuevo León|25.6866|-100.3161
Guadalupe|Nuevo León|25.6775|-100.2597
San Nicolás de los Garza|Nuevo León|25.7417|-100.3022
Apodaca|Nuevo León|25.7817|-100.1883
Santa Catarina|Nuevo León|25.6733|-100.4583
San Pedro Garza García|Nuevo León|25.6575|-100.4025
General Escobedo|Nuevo León|25.7978|-100.3392
Linares|Nuevo León|24.8594|-99.5683
Montemorelos|Nuevo León|25.1881|-99.8319
Cadereyta Jiménez|Nuevo León|25.5833|-99.9833
Sabinas Hidalgo|Nuevo León|26.5|-100.1833
Santiago|Nuevo León|25.4267|-100.1522
Guadalajara|Jalisco|20.6597|-103.3496
Zapopan|Jalisco|20.7214|-103.3918
Tlaquepaque|Jalisco|20.6409|-103.3126
Tonalá|Jalisco|20.624|-103.234
Tlajomulco de Zúñiga|Jalisco|20.4739|-103.4466
Puerto Vallarta|Jalisco|20.6534|-105.2253
Lagos de Moreno|Jalisco|21.35|-101.9333
Tijuana|Baja California|32.5149|-117.0382
Mexicali|Baja California|32.6245|-115.4523
Ensenada|Baja California|31.8667|-116.5964
Tecate|Baja California|32.5667|-116.6333
Playas de Rosarito|Baja California|32.3333|-117.0333
La Paz|Baja California Sur|24.1426|-110.3128
Los Cabos|Baja California Sur|22.8905|-109.9167
Ciudad Juárez|Chihuahua|31.6904|-106.4245
Chihuahua|Chihuahua|28.633|-106.0691
Delicias|Chihuahua|28.19|-105.47
Cuauhtémoc|Chihuahua|28.405|-106.867
Hidalgo del Parral|Chihuahua|26.9333|-105.6667
Saltillo|Coahuila|25.4232|-101.0053
Torreón|Coahuila|25.5428|-103.4068
Monclova|Coahuila|26.907|-101.421
Piedras Negras|Coahuila|28.7|-100.5233
Acuña|Coahuila|29.3233|-100.9522
Ramos Arizpe|Coahuila|25.5333|-100.95
Gómez Palacio|Durango|25.5628|-103.4986
Lerdo|Durango|25.5333|-103.5167
Durango|Durango|24.0277|-104.6532
Hermosillo|Sonora|29.0729|-110.9559
Cajeme|Sonora|27.4864|-109.9408
Nogales|Sonora|31.3086|-110.9422
Guaymas|Sonora|27.9333|-110.9
San Luis Río Colorado|Sonora|32.4567|-114.7708
Culiacán|Sinaloa|24.8091|-107.394
Mazatlán|Sinaloa|23.2494|-106.4111
Ahome|Sinaloa|25.7935|-108.9859
Tepic|Nayarit|21.5042|-104.8946
Aguascalientes|Aguascalientes|21.8853|-102.2916
Zacatecas|Zacatecas|22.7709|-102.5832
Fresnillo|Zacatecas|23.1769|-102.8683
San Luis Potosí|San Luis Potosí|22.1565|-100.9855
Matehuala|San Luis Potosí|23.6489|-100.6431
Ciudad Valles|San Luis Potosí|21.9875|-99.0136
León|Guanajuato|21.125|-101.686
Irapuato|Guanajuato|20.6761|-101.3563
Celaya|Guanajuato|20.5235|-100.8157
Salamanca|Guanajuato|20.5719|-101.1956
Guanajuato|Guanajuato|21.019|-101.2574
Querétaro|Querétaro|20.5888|-100.3899
San Juan del Río|Querétaro|20.3883|-99.9967
Pachuca de Soto|Hidalgo|20.1011|-98.7591
Toluca|Estado de México|19.2826|-99.6557
Naucalpan de Juárez|Estado de México|19.4785|-99.2397
Ecatepec de Morelos|Estado de México|19.6012|-99.0506
Nezahualcóyotl|Estado de México|19.4006|-99.0148
Tlalnepantla de Baz|Estado de México|19.54|-99.195
Texcoco|Estado de México|19.5167|-98.8833
Cuautitlán Izcalli|Estado de México|19.6458|-99.2128
Atizapán de Zaragoza|Estado de México|19.5667|-99.2667
Puebla|Puebla|19.0414|-98.2063
Tehuacán|Puebla|18.46|-97.392
Atlixco|Puebla|18.9|-98.4333
Tlaxcala|Tlaxcala|19.3182|-98.2375
Cuernavaca|Morelos|18.9186|-99.2342
Cuautla|Morelos|18.8167|-98.95
Oaxaca de Juárez|Oaxaca|17.0732|-96.7266
Salina Cruz|Oaxaca|16.1667|-95.2
Juchitán de Zaragoza|Oaxaca|16.4333|-95.0167
Chilpancingo de los Bravo|Guerrero|17.5506|-99.5058
Acapulco de Juárez|Guerrero|16.8531|-99.8237
Zihuatanejo de Azueta|Guerrero|17.64|-101.55
Taxco de Alarcón|Guerrero|18.55|-99.6
Morelia|Michoacán|19.706|-101.195
Uruapan|Michoacán|19.4142|-102.0521
Zamora|Michoacán|19.9833|-102.2833
Lázaro Cárdenas|Michoacán|17.9558|-102.1992
Colima|Colima|19.2433|-103.725
Manzanillo|Colima|19.05|-104.3167
Veracruz|Veracruz|19.1738|-96.1342
Boca del Río|Veracruz|19.105|-96.105
Xalapa|Veracruz|19.5438|-96.9102
Coatzacoalcos|Veracruz|18.15|-94.42
Minatitlán|Veracruz|17.9833|-94.5333
Poza Rica de Hidalgo|Veracruz|20.5331|-97.459
Tuxpan|Veracruz|20.957|-97.401
Córdoba|Veracruz|18.8847|-96.9283
Orizaba|Veracruz|18.85|-97.1
Tuxtla Gutiérrez|Chiapas|16.7539|-93.1156
Tapachula|Chiapas|14.905|-92.265
San Cristóbal de las Casas|Chiapas|16.737|-92.6376
Centro|Tabasco|17.9892|-92.9475
Campeche|Campeche|19.8301|-90.5349
Carmen|Campeche|18.65|-91.8333
Mérida|Yucatán|20.9674|-89.5926
Valladolid|Yucatán|20.6894|-88.2019
Benito Juárez|Quintana Roo|21.1619|-86.8515
Solidaridad|Quintana Roo|20.6296|-87.0739
Cozumel|Quintana Roo|20.423|-86.9223
Othón P. Blanco|Quintana Roo|18.5001|-88.2961
`;
// Algunos municipios de SEPOMEX llevan otro nombre que la ciudad conocida (el estado evita confusiones)
const CITY_ALIAS = [["victoria","Tamaulipas","Ciudad Victoria"],["madero","Tamaulipas","Ciudad Madero"],["mante","Tamaulipas","El Mante"],
  ["juarez","Chihuahua","Ciudad Juárez"],["cd juarez","Chihuahua","Ciudad Juárez"],["cd victoria","Tamaulipas","Ciudad Victoria"],
  ["cancun","Quintana Roo","Benito Juárez"],["playa del carmen","Quintana Roo","Solidaridad"],["ciudad obregon","Sonora","Cajeme"],
  ["los mochis","Sinaloa","Ahome"],["ciudad del carmen","Campeche","Carmen"],["villahermosa","Tabasco","Centro"],
  ["chetumal","Quintana Roo","Othón P. Blanco"],["pachuca","Hidalgo","Pachuca de Soto"],["naucalpan","Estado de México","Naucalpan de Juárez"],
  ["ecatepec","Estado de México","Ecatepec de Morelos"],["tlalnepantla","Estado de México","Tlalnepantla de Baz"],
  ["acapulco","Guerrero","Acapulco de Juárez"],["oaxaca","Oaxaca","Oaxaca de Juárez"],["tuxtla gutierrez","Chiapas","Tuxtla Gutiérrez"],
  ["cadereyta","Nuevo León","Cadereyta Jiménez"],["san pedro","Nuevo León","San Pedro Garza García"]];

const CITIES = [];   // { name, state, coords }
for (const line of CITY_DATA.trim().split("\n")) {
  const [name, state, lat, lng] = line.split("|");
  CITIES.push({ name, state, coords: [Number(lat), Number(lng)] });
}
const CITY_INDEX = new Map(); // norm(nombre) → [ciudad]
const addIdx = (k, c) => CITY_INDEX.set(k, [...(CITY_INDEX.get(k) || []), c]);
for (const c of CITIES) addIdx(norm(c.name), c);
for (const [alias, state, target] of CITY_ALIAS) addIdx(alias, CITIES.find(c => c.name === target && c.state === state));

function findCity(name, state){
  const list = CITY_INDEX.get(norm(name));
  if (!list) return null;
  return (state ? list.find(c => c.state === state) : list[0]) || null;
}

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

// loc = { zip, city, state }. Prioridad: código postal → ciudad/estado escritos por el cliente.
function quote(loc){
  loc = loc || {};
  let state = null, coords = null, place = null, matchedBy = null;
  const info = cp.lookup(loc.zip);
  if (info) {
    state = canonState(info.e);
    const city = findCity(info.c, state) || findCity(info.m, state);
    place = `${info.m || info.c}, ${info.e}`;
    if (city) { coords = city.coords; matchedBy = "cp"; }
    else if (state) { coords = STATES[state]; matchedBy = "cp-estado"; }
  } else {
    state = canonState(loc.state);
    const city = findCity(loc.city, state);
    if (city) { coords = city.coords; place = `${city.name}, ${city.state}`; matchedBy = "ciudad"; }
    else if (state) { coords = STATES[state]; place = state; matchedBy = "estado"; }
  }
  if (!coords) return { ok: false, error: "No pudimos calcular el envío con ese código postal. Revisa que tenga 5 dígitos y sea de México." };
  const km = Math.round(haversine([STORE.lat, STORE.lng], coords) * ROAD_FACTOR);
  const tier = TIERS.find(t => km <= t.upTo);
  return { ok: true, km, cost: tier.cost, days: tier.days, zone: tier.zone, place, state, zip: loc.zip || null, matchedBy, origin: STORE.name };
}

const places = () => ({ states: Object.keys(STATES), cities: CITIES.map(c => c.name) });
module.exports = { quote, places, canonState, TIERS, STORE };
