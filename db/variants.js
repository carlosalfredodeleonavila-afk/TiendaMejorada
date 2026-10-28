// Opciones de compra por tipo de producto: [etiqueta de talla, lista de tallas | null, etiqueta de color, paleta | null]
// Es determinista (depende solo del id), así que los productos y sus fotos no cambian al regenerar la base.
const ROPA = ["XS","S","M","L","XL"];
const PALETAS = {
  ropa:  ["Negro","Blanco","Gris","Azul marino","Beige","Vino","Verde","Café"],
  calzado: ["Negro","Blanco","Café","Gris","Azul marino","Beige"],
  tech:  ["Negro","Blanco","Plata","Azul"],
  basico:["Negro","Blanco","Gris","Azul","Rojo","Verde"],
  labios:["Rojo","Rosa","Vino","Nude","Coral","Berry"],
};
const TALLA = ["Talla", ROPA], NUM = ["Número", "calzado"];
const CFG = {
  "Chamarra impermeable":[...TALLA,"Color","ropa"], "Playera de algodón":[...TALLA,"Color","ropa"],
  "Camisa de vestir":[...TALLA,"Color","ropa"], "Sudadera con capucha":[...TALLA,"Color","ropa"],
  "Vestido casual":[...TALLA,"Color","ropa"], "Falda":[...TALLA,"Color","ropa"],
  "Suéter tejido":[...TALLA,"Color","ropa"], "Abrigo largo":[...TALLA,"Color","ropa"],
  "Pantalón de mezclilla":["Talla",["28","30","32","34","36","38"],"Color","ropa"],
  "Bufanda":[null,null,"Color","ropa"], "Gorra":[null,null,"Color","ropa"], "Mochila urbana":[null,null,"Color","basico"],
  "Guantes de box":["Peso",["10 oz","12 oz","14 oz","16 oz"],"Color","basico"],
  "Bicicleta de montaña":["Rodada",["26","27.5","29"],"Color","basico"],
  "Casco de ciclismo":["Talla",["S","M","L"],"Color","basico"],
  "Tienda de campaña":["Capacidad",["2 personas","4 personas","6 personas"],"Color","basico"],
  "Colchoneta de yoga":[null,null,"Color","basico"], "Bolsa de dormir":[null,null,"Color","basico"],
  "Botella deportiva":[null,null,"Color","basico"], "Cuerda para saltar":[null,null,"Color","basico"],
  "Juego de sábanas":["Tamaño",["Individual","Matrimonial","Queen","King"],"Color","ropa"],
  "Lámpara de escritorio":[null,null,"Color","tech"], "Hervidor eléctrico":[null,null,"Color","tech"],
  "Freidora de aire":[null,null,"Color","tech"], "Licuadora":[null,null,"Color","tech"], "Cafetera de goteo":[null,null,"Color","tech"],
  "Audífonos inalámbricos":[null,null,"Color","tech"], "Audífonos de diadema":[null,null,"Color","tech"],
  "Bocina bluetooth":[null,null,"Color","tech"], "Mouse inalámbrico":[null,null,"Color","tech"],
  "Cargador portátil":[null,null,"Color","tech"], "Smartwatch":["Caja",["40 mm","44 mm"],"Color","tech"],
  "Tableta":["Almacenamiento",["64 GB","128 GB","256 GB"],"Color","tech"],
  "Smartphone":["Almacenamiento",["128 GB","256 GB","512 GB"],"Color","tech"],
  "Labial":[null,null,"Tono","labios"], "Esmalte de uñas":[null,null,"Tono","labios"],
};
function variantsFor(category, type, id){
  let c = CFG[type];
  if (!c && category === "Calzado") c = NUM.concat(["Color","calzado"]);
  if (!c) return { size_label: null, sizes: null, color_label: null, colors: null };
  const [sl, sizes, cl, pal] = c;
  let sizeList = null;
  if (sizes === "calzado"){ const s = 22 + (id % 3); sizeList = Array.from({ length: 7 }, (_, i) => String(s + i)); }
  else if (sizes === ROPA) sizeList = id % 4 === 0 ? ROPA : ROPA.slice(1);
  else if (sizes) sizeList = sizes;
  const palette = PALETAS[pal], n = 3 + (id % 2);
  const colors = Array.from({ length: n }, (_, i) => palette[(id + i * 2) % palette.length]);
  return { size_label: sizeList ? sl : null, sizes: sizeList ? sizeList.join(",") : null,
           color_label: cl, colors: [...new Set(colors)].join(",") };
}
module.exports = { variantsFor };
