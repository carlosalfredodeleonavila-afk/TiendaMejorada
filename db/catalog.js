// Catálogo base: 6 categorías x 12 tipos de producto x 7 variantes = 504 productos.
// [nombre, búsqueda en inglés para Pixabay, precio mín, precio máx, descripción]
module.exports = {
  "Electrónica": {
    imgQuery: "electronics gadget",
    features: [
      "Incluye garantía de 12 meses y soporte técnico en español.",
      "Diseño compacto, fácil de configurar y listo para usarse desde el primer día.",
      "Compatible con Android, iOS y Windows.",
      "Construcción resistente pensada para el uso diario."
    ],
    types: [
      ["Audífonos inalámbricos", "wireless earbuds", 349, 1899, "Audífonos in-ear con Bluetooth 5.3, estuche de carga y hasta 24 horas de batería."],
      ["Audífonos de diadema", "headphones", 499, 2499, "Audífonos over-ear con cancelación de ruido, almohadillas acolchadas y micrófono integrado."],
      ["Bocina bluetooth", "bluetooth speaker", 299, 1999, "Bocina portátil resistente al agua con sonido de 360° y 12 horas de reproducción."],
      ["Smartwatch", "smartwatch", 599, 3499, "Reloj inteligente con monitor de ritmo cardiaco, GPS y notificaciones del celular."],
      ["Teclado mecánico", "mechanical keyboard", 449, 1899, "Teclado mecánico con iluminación RGB, switches táctiles y base antiderrapante."],
      ["Mouse inalámbrico", "computer mouse", 149, 899, "Mouse ergonómico con sensor de alta precisión y batería de larga duración."],
      ["Cargador portátil", "power bank", 199, 999, "Batería externa de alta capacidad con carga rápida y dos puertos USB."],
      ["Tableta", "tablet computer", 2499, 8999, "Tableta con pantalla nítida, procesador veloz y batería para todo el día."],
      ["Cámara de seguridad", "security camera", 399, 1799, "Cámara Wi-Fi con visión nocturna, detección de movimiento y audio de dos vías."],
      ["Monitor", "computer monitor", 1999, 6999, "Monitor Full HD con panel IPS, bordes delgados y tecnología que cuida la vista."],
      ["Laptop", "laptop", 7999, 19999, "Laptop ligera con procesador de última generación, SSD rápido y pantalla antirreflejante."],
      ["Smartphone", "smartphone", 2499, 14999, "Teléfono con cámara de alta resolución, pantalla fluida y carga rápida."]
    ]
  },
  "Calzado": {
    imgQuery: "shoes",
    features: [
      "Suela flexible y antiderrapante para mayor seguridad al caminar.",
      "Plantilla acolchada que ofrece comodidad durante todo el día.",
      "Materiales transpirables y fáciles de limpiar.",
      "Disponible en tallas del 22 al 30 MX."
    ],
    types: [
      ["Tenis para correr", "running shoes", 599, 2499, "Tenis de running ligeros con amortiguación reactiva y malla transpirable para entrenar."],
      ["Tenis casuales", "casual sneakers", 399, 1699, "Tenis de estilo urbano, cómodos y fáciles de combinar con cualquier outfit."],
      ["Botas de piel", "leather boots", 899, 2599, "Botas de piel genuina con costuras reforzadas y suela de goma resistente."],
      ["Botines", "ankle boots", 499, 1799, "Botines de caña corta con cierre lateral y tacón estable."],
      ["Sandalias", "sandals", 199, 899, "Sandalias ligeras con correas ajustables, ideales para clima cálido."],
      ["Zapatos de vestir", "dress shoes", 699, 2299, "Zapatos formales con acabado pulido, perfectos para oficina y eventos."],
      ["Mocasines", "loafers shoes", 499, 1599, "Mocasines sin agujetas, de corte clásico y interior suave."],
      ["Tacones", "high heels", 399, 1499, "Zapatillas de tacón con plantilla acolchada y punta elegante."],
      ["Botas de senderismo", "hiking boots", 799, 2799, "Botas con agarre profundo y protección impermeable para caminatas."],
      ["Pantuflas", "slippers", 129, 449, "Pantuflas suaves con interior afelpado para estar en casa."],
      ["Chanclas", "flip flops", 99, 399, "Chanclas ligeras de secado rápido para playa y alberca."],
      ["Tenis de básquetbol", "basketball shoes", 899, 2999, "Tenis de caña media con soporte de tobillo y excelente tracción en duela."]
    ]
  },
  "Hogar y Cocina": {
    imgQuery: "kitchen home",
    features: [
      "Fácil de limpiar y de guardar en cualquier cocina.",
      "Ahorra tiempo en tu rutina diaria con un funcionamiento sencillo.",
      "Fabricado con materiales libres de BPA.",
      "Incluye manual en español y garantía de 6 meses."
    ],
    types: [
      ["Cafetera de goteo", "coffee maker", 399, 1799, "Cafetera de 12 tazas con jarra térmica, filtro reutilizable y apagado automático."],
      ["Licuadora", "blender", 449, 1999, "Licuadora potente con vaso de vidrio, varias velocidades y función para triturar hielo."],
      ["Juego de sartenes", "frying pan", 499, 1899, "Set de sartenes antiadherentes aptas para todo tipo de estufa."],
      ["Olla de presión", "pressure cooker", 599, 2199, "Olla de acero inoxidable con válvula de seguridad que reduce el tiempo de cocción."],
      ["Tostador de pan", "toaster", 249, 899, "Tostador con ranuras amplias, control de dorado y bandeja recolectora de migajas."],
      ["Freidora de aire", "air fryer", 899, 3299, "Freidora de aire que cocina con poco o nada de aceite, con temporizador digital."],
      ["Set de cuchillos", "kitchen knives", 299, 1599, "Set de cuchillos de acero inoxidable con bloque de madera y filo duradero."],
      ["Horno de microondas", "microwave oven", 1299, 3999, "Microondas con panel digital, descongelado rápido y plato giratorio."],
      ["Lámpara de escritorio", "desk lamp", 179, 799, "Lámpara LED con brazo flexible, tres niveles de brillo y luz que no cansa la vista."],
      ["Juego de sábanas", "bed sheets", 299, 1399, "Sábanas suaves de microfibra que no se arrugan y resisten múltiples lavados."],
      ["Almohada", "pillow bed", 149, 699, "Almohada de fibra hipoalergénica con soporte firme para cuello y espalda."],
      ["Hervidor eléctrico", "electric kettle", 299, 1099, "Hervidor de 1.7 litros con apagado automático y base giratoria de 360°."]
    ]
  },
  "Ropa": {
    imgQuery: "clothing fashion",
    features: [
      "Tela suave que conserva su forma después de muchos lavados.",
      "Corte cómodo disponible en tallas CH, M, G y XG.",
      "Diseño versátil para combinar con tu guardarropa.",
      "Costuras reforzadas para mayor durabilidad."
    ],
    types: [
      ["Chamarra impermeable", "rain jacket", 599, 2299, "Chamarra ligera con capucha ajustable, bolsillos sellados y tela transpirable."],
      ["Playera de algodón", "t-shirt", 129, 499, "Playera de algodón peinado con cuello redondo y ajuste regular."],
      ["Camisa de vestir", "dress shirt", 349, 1099, "Camisa de manga larga con cuello clásico y tela que se plancha fácil."],
      ["Pantalón de mezclilla", "jeans pants", 399, 1299, "Jeans de mezclilla elástica con corte recto y cinco bolsillos."],
      ["Sudadera con capucha", "hoodie", 299, 999, "Sudadera con interior afelpado, bolsa frontal y cordones ajustables."],
      ["Vestido casual", "summer dress", 349, 1299, "Vestido ligero de caída suave, ideal para el día a día."],
      ["Falda", "skirt clothing", 249, 799, "Falda con cintura elástica y forro interior cómodo."],
      ["Suéter tejido", "knit sweater", 349, 1199, "Suéter de punto grueso con cuello redondo, cálido y suave al tacto."],
      ["Abrigo largo", "winter coat", 899, 2999, "Abrigo largo con botones al frente y forro interior térmico."],
      ["Bufanda", "scarf", 99, 449, "Bufanda tejida de tacto suave que protege del frío."],
      ["Gorra", "baseball cap", 129, 449, "Gorra de visera curva con cierre ajustable y tela transpirable."],
      ["Mochila urbana", "backpack", 349, 1299, "Mochila resistente al agua con compartimento acolchado para laptop de 15 pulgadas."]
    ]
  },
  "Deportes": {
    imgQuery: "sports equipment",
    features: [
      "Pensado para entrenar con comodidad, en casa o al aire libre.",
      "Materiales resistentes al sudor y al uso rudo.",
      "Ligero y fácil de transportar a donde vayas.",
      "Recomendado por entrenadores y deportistas aficionados."
    ],
    types: [
      ["Colchoneta de yoga", "yoga mat", 199, 799, "Colchoneta antiderrapante de 6 mm de grosor, ecológica e incluye correa de transporte."],
      ["Juego de mancuernas", "dumbbells", 249, 1499, "Mancuernas con recubrimiento de neopreno y agarre ergonómico."],
      ["Balón de fútbol", "soccer ball", 199, 899, "Balón de fútbol tamaño 5 con costuras reforzadas y gran vuelo."],
      ["Balón de básquetbol", "basketball ball", 249, 999, "Balón con cubierta de alta adherencia para canchas interiores y exteriores."],
      ["Bicicleta de montaña", "mountain bike", 3999, 9999, "Bicicleta de aluminio con suspensión delantera y cambios de 21 velocidades."],
      ["Casco de ciclismo", "bicycle helmet", 299, 1299, "Casco ligero con ventilación y ajuste rápido que protege en cada recorrido."],
      ["Tienda de campaña", "camping tent", 799, 3299, "Tienda para 4 personas, impermeable y de armado rápido."],
      ["Bolsa de dormir", "sleeping bag", 399, 1599, "Bolsa de dormir térmica con cierre completo y funda compresible."],
      ["Raqueta de tenis", "tennis racket", 599, 2799, "Raqueta de grafito con balance ligero y gran control de la pelota."],
      ["Cuerda para saltar", "jump rope", 79, 349, "Cuerda ajustable con mangos antiderrapantes y rodamientos de alta velocidad."],
      ["Guantes de box", "boxing gloves", 349, 1399, "Guantes acolchados con cierre de velcro que protegen muñeca y nudillos."],
      ["Botella deportiva", "sports water bottle", 99, 449, "Botella de 750 ml con tapa antiderrames, libre de BPA y fácil de limpiar."]
    ]
  },
  "Belleza": {
    imgQuery: "beauty cosmetics",
    features: [
      "Probado dermatológicamente y libre de crueldad animal.",
      "Fórmula suave, adecuada para uso diario.",
      "Presentación práctica para llevar en el bolso o de viaje.",
      "Resultados visibles con uso constante."
    ],
    types: [
      ["Set de brochas de maquillaje", "makeup brushes", 199, 899, "Set de brochas profesionales de cerdas suaves, con estuche de viaje."],
      ["Labial", "lipstick", 99, 449, "Labial cremoso de larga duración con acabado satinado y color intenso."],
      ["Perfume", "perfume bottle", 299, 1999, "Fragancia de notas frescas y duraderas en frasco de vidrio con atomizador."],
      ["Crema hidratante facial", "face cream", 149, 799, "Crema ligera con ácido hialurónico que hidrata la piel por 24 horas."],
      ["Sérum de vitamina C", "face serum", 199, 999, "Sérum antioxidante que ilumina y unifica el tono de la piel."],
      ["Shampoo", "shampoo bottle", 79, 399, "Shampoo que limpia suavemente y deja el cabello brillante y manejable."],
      ["Secadora de cabello", "hair dryer", 299, 1699, "Secadora de 2000 W con tecnología iónica y boquilla concentradora."],
      ["Plancha para cabello", "hair straightener", 249, 1399, "Plancha con placas de cerámica y control de temperatura para un alaciado sin frizz."],
      ["Protector solar", "sunscreen", 129, 599, "Protector solar FPS 50+ de textura ligera, resistente al agua."],
      ["Paleta de sombras", "eyeshadow palette", 149, 799, "Paleta con 18 tonos mates y brillantes de alta pigmentación."],
      ["Esmalte de uñas", "nail polish", 49, 249, "Esmalte de secado rápido con acabado brillante y duradero."],
      ["Afeitadora eléctrica", "electric razor", 349, 1799, "Afeitadora recargable con cabezal flotante para un rasurado al ras y sin irritación."]
    ]
  }
};
