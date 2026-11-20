import { Product, Brand, Coupon, Review, HeroBanner } from '../types';

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'jordan',
    name: 'Jordan',
    slug: 'jordan',
    logo: '/brands/jordan.png',
    story: 'Creada para Michael Jordan en 1984, la marca de la corona y el Jumpman revolucionó las canchas de baloncesto y definió el streetwear contemporáneo.',
    heroImage: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'nike',
    name: 'Nike',
    slug: 'nike',
    logo: '/brands/nike.png',
    story: 'Inspiración e innovación para cada atleta del mundo. Just Do It. Pioneros en el diseño de calzado de rendimiento e íconos de la cultura urbana.',
    heroImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'adidas',
    name: 'Adidas',
    slug: 'adidas',
    logo: '/brands/adidas.png',
    story: 'Fundada en Alemania por Adi Dassler, Adidas representa la unión impecable entre la innovación deportiva y el estilo clásico de la herencia Originals.',
    heroImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'newbalance',
    name: 'New Balance',
    slug: 'new-balance',
    logo: '/brands/newbalance.png',
    story: 'Con un enfoque inigualable en el confort, la calidad de los materiales y la artesanía impecable, New Balance une el dad shoe clásico con el estilo moderno.',
    heroImage: 'https://images.unsplash.com/photo-1551201602-3f9456f07bc8?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'puma',
    name: 'Puma',
    slug: 'puma',
    logo: '/brands/puma.png',
    story: 'Nacida en Herzogenaurach, Alemania, en 1948, Puma une la velocidad del deporte con la actitud de la calle en siluetas que cruzan del estadio al streetwear.',
    heroImage: ''
  },
  {
    id: 'lacoste',
    name: 'Lacoste',
    slug: 'lacoste',
    logo: '/brands/lacoste.png',
    story: 'Fundada en 1933 por el tenista René Lacoste, la marca del cocodrilo lleva la elegancia francesa del tenis a zapatillas limpias y atemporales.',
    heroImage: ''
  },
  {
    id: 'louisvuitton',
    name: 'Louis Vuitton',
    slug: 'louis-vuitton',
    logo: '/brands/louisvuitton.png',
    story: 'Maison francesa fundada en 1854, referente del lujo. Sus sneakers combinan artesanía de alta gama con el lenguaje de la cultura urbana.',
    heroImage: ''
  },
  {
    id: 'tommyhilfiger',
    name: 'Tommy Hilfiger',
    slug: 'tommy-hilfiger',
    logo: '/brands/tommyhilfiger.png',
    story: 'Desde 1985, Tommy Hilfiger reinterpreta el estilo clásico americano con un toque preppy, cómodo y versátil para el día a día.',
    heroImage: ''
  },
  {
    id: 'armaniexchange',
    name: 'Armani Exchange',
    slug: 'armani-exchange',
    logo: '/brands/armaniexchange.png',
    story: 'La línea urbana de Giorgio Armani: diseño italiano minimalista con espíritu metropolitano, pensado para moverse por la ciudad con estilo.',
    heroImage: ''
  },
  {
    id: 'skechers',
    name: 'Skechers',
    slug: 'skechers',
    logo: '/brands/skechers.png',
    story: 'Nacida en California en 1992, Skechers es sinónimo de comodidad: amortiguación, ligereza y diseños para caminar todo el día.',
    heroImage: ''
  },
  {
    id: 'lecoqsportif',
    name: 'Le Coq Sportif',
    slug: 'le-coq-sportif',
    logo: '/brands/lecoqsportif.png',
    story: 'Marca francesa con herencia deportiva desde 1882. El gallo representa un estilo retro y sofisticado que vuelve una y otra vez a las calles.',
    heroImage: ''
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'jordan-4-black-cat',
    brandId: 'jordan',
    name: 'Air Jordan 4 Retro "Black Cat"',
    slug: 'air-jordan-4-retro-black-cat',
    sku: 'CU1110-010',
    description: 'La silueta mítica de Tinker Hatfield regresa en una versión totalmente negra y mate inspirada en uno de los apodos legendarios de Michael Jordan: Black Cat.',
    history: 'Lanzadas originalmente en 2006, las Air Jordan 4 "Black Cat" se convirtieron rápidamente en un santo grial de la cultura sneaker. Su construcción monocromática en nubuck premium, la jaula del panel lateral y los ojales brillantes de color grafito oscuro representan el equilibrio perfecto entre agresividad táctica y elegancia sofisticada. En las calles, esta silueta trasciende las canchas, ofreciendo un perfil robusto pero sutil que complementa cualquier outfit urbano de manera inigualable.',
    basePrice: 1250000,
    discount: 10,
    images: [
      'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Black/Black-Light Graphite', hex: '#111111' },
      { name: 'Dark Slate', hex: '#2C2E35' }
    ],
    sizes: [40, 41, 42, 42.5, 43, 44, 44.5, 45, 46],
    technologies: ['Visible Air-Sole Unit', 'Encapsulated Forefoot Air', 'Premium Nubuck Upper'],
    isLimited: true,
    isBestSeller: true,
    isTrending: true,
    rating: 4.9,
    reviewsCount: 142,
    materials: ['Nubuck premium impermeable', 'Malla sintética tejida', 'Suela de goma de alta tracción', 'Forro textil acolchado']
  },
  {
    id: 'nike-dunk-low-panda',
    brandId: 'nike',
    name: 'Nike Dunk Low "Panda"',
    slug: 'nike-dunk-low-panda',
    sku: 'DD1391-100',
    description: 'El clásico indiscutible del calzado de los años 80 regresa con su icónico bloque de color blanco y negro en cuero de primera calidad.',
    history: 'Las Dunk nacieron en 1985 como la zapatilla de baloncesto universitaria por excelencia de Nike, pero fue en el skate y el streetwear de los 2000 donde encontraron su verdadero hogar eterno. El esquema "Panda" es, sin duda, la paleta más versátil y codiciada de la última década. Su simplicidad simétrica de cuero blanco y paneles superpuestos en negro la convierten en un lienzo universal indispensable para cualquier armario.',
    basePrice: 590000,
    discount: 0,
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'White/Black', hex: '#ffffff' },
      { name: 'Black Accent', hex: '#000000' }
    ],
    sizes: [39, 40, 41, 42, 42.5, 43, 44, 44.5, 45, 46],
    technologies: ['Cupsole Construction', 'Perforated Toe Box', 'Padded Low-Cut Collar'],
    isLimited: false,
    isBestSeller: true,
    isTrending: false,
    rating: 4.6,
    reviewsCount: 512,
    materials: ['Cuero de grano entero', 'Suela de goma antideslizante', 'Plantilla acolchada de espuma']
  },
  {
    id: 'jordan-1-chicago-lost-found',
    brandId: 'jordan',
    name: 'Air Jordan 1 Retro High OG "Lost & Found"',
    slug: 'air-jordan-1-retro-high-lost-and-found',
    sku: 'DZ5485-612',
    description: 'Las legendarias Jordan 1 Chicago de 1985 reciben un tratamiento "envejecido por el tiempo" que imita el desgaste de una caja perdida de época.',
    history: 'Las Jordan 1 Chicago representan el big bang de la cultura de las zapatillas. Las "Lost & Found" capturan de manera sublime el espíritu de la búsqueda de tesoros vintage en las pequeñas tiendas familiares de los años 80 y 90. Cuentan con detalles desgastados en el cuero blanco agrietado, un tobillo de cuero negro envejecido con grietas finas, y una caja de aspecto avejentado junto con un recibo impreso de época.',
    basePrice: 1450000,
    discount: 15,
    images: [
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Varsity Red/Black-Sail-Muslin', hex: '#C61E34' },
      { name: 'Sail/Black', hex: '#F0EAD6' }
    ],
    sizes: [40, 41, 42, 42.5, 43, 44, 44.5, 45, 46, 47.5],
    technologies: ['Encapsulated Air-Sole Unit', 'High-Top Support Collar', 'Full-Grain Cracked Leather'],
    isLimited: true,
    isBestSeller: true,
    isTrending: true,
    rating: 4.95,
    reviewsCount: 388,
    materials: ['Cuero envejecido agrietado', 'Suela cupsole de goma', 'Lámina protectora y recibo vintage']
  },
  {
    id: 'adidas-yeezy-350-onyx',
    brandId: 'adidas',
    name: 'Adidas Yeezy Boost 350 V2 "Onyx"',
    slug: 'adidas-yeezy-boost-350-v2-onyx',
    sku: 'HQ6316',
    description: 'La silueta ultraligera de punto Primeknit y amortiguación Boost revolucionaria se sumerge en una paleta de color Onyx de tono triple negro.',
    history: 'El Yeezy 350 V2 de Adidas cambió el paradigma del calzado deportivo de lujo al combinar tecnología de punta y silueta de calcetín de vanguardia. La versión "Onyx" entrega un aspecto futurista y aerodinámico en un negro azabache sutilmente jaspeado, cruzado por la icónica franja lateral translúcida en monofilamento. Su entresuela Boost amortigua cada paso con una sensación de flotabilidad absoluta.',
    basePrice: 1100000,
    discount: 5,
    images: [
      'https://images.unsplash.com/photo-1551201602-3f9456f07bc8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Onyx/Core Black', hex: '#1C1C1C' }
    ],
    sizes: [39, 40, 41, 42, 42.5, 43, 44, 44.5, 45, 46],
    technologies: ['Full-Length Boost Cushioning', 'Primeknit Engineered Upper', 'Translucent TPU Cage'],
    isLimited: true,
    isBestSeller: false,
    isTrending: true,
    rating: 4.8,
    reviewsCount: 198,
    materials: ['Hilo Primeknit reciclado de alta resistencia', 'TPU flexible en mediasuela', 'Suela de goma estriada antideslizante']
  },
  {
    id: 'nb-550-white-green',
    brandId: 'newbalance',
    name: 'New Balance 550 "White Green"',
    slug: 'new-balance-550-white-green',
    sku: 'BB550WT1',
    description: 'La silueta clásica de baloncesto de archivo de 1989 se redefine con una estética retro impecable en cuero blanco y acentos verdes.',
    history: 'El New Balance 550 estuvo en los archivos durante décadas antes de ser redescubierto y reintroducido, convirtiéndose instantáneamente en un fenómeno global de la moda retro. Su diseño rinde homenaje al calzado de baloncesto vintage de los 80, con un perfil de corte bajo, paneles de cuero perforado, y la inconfundible marca "N" en relieve acolchado de sutil color verde bosque.',
    basePrice: 650000,
    discount: 0,
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551201602-3f9456f07bc8?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'White/Green', hex: '#ffffff' },
      { name: 'Green Accent', hex: '#1B4D3E' }
    ],
    sizes: [40, 41, 42, 42.5, 43, 44, 44.5, 45],
    technologies: ['Ortholite Comfort Insole', 'Perforated Leather Side Panels', 'Non-Marking Rubber Cupsole'],
    isLimited: false,
    isBestSeller: true,
    isTrending: true,
    rating: 4.7,
    reviewsCount: 224,
    materials: ['Cuero liso de grano superior', 'Paneles de gamuza fina en puntera', 'Suela de caucho vulcanizado bicolor']
  },
  {
    id: 'nike-air-max-90-infared',
    brandId: 'nike',
    name: 'Nike Air Max 90 "Infrared"',
    slug: 'nike-air-max-90-infrared',
    sku: 'CT1685-100',
    description: 'La obra maestra de Tinker Hatfield que llevó el aire visible al extremo absoluto vuelve en su icónico esquema Infrared.',
    history: 'Originalmente conocidas como Air Max III en 1990, las Air Max 90 ampliaron los límites de la tecnología visible de Nike con una ventana de amortiguación más grande y una silueta agresiva de paneles angulares. El acento "Infrared" (un rojo neón vibrante e inconfundible) resalta de manera magistral la ventana Air y los ojales termoplásticos, evocando la nostalgia dorada de los noventa deportivos.',
    basePrice: 680000,
    discount: 20,
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'White/Black-Cool Grey-Infrared', hex: '#FF3366' },
      { name: 'Cool Grey', hex: '#8A8D8F' }
    ],
    sizes: [40, 41, 42, 42.5, 43, 44, 44.5, 45, 46],
    technologies: ['Visible Max Air Heel Unit', 'Padded Mesh & Suede Spliced Upper', 'Waffle Pattern Rubber Outsole'],
    isLimited: false,
    isBestSeller: false,
    isTrending: false,
    rating: 4.8,
    reviewsCount: 165,
    materials: ['Malla sintética transpirable', 'Superposiciones de gamuza sintética', 'Guardabarros de cuero negro duradero']
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'WELCOME10',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    validFrom: '2026-01-01',
    validTo: '2027-12-31'
  },
  {
    id: 'SNEAKERHEAD50',
    code: 'SNEAKERHEAD50',
    type: 'fixed',
    value: 50000,
    validFrom: '2026-01-01',
    validTo: '2027-12-31'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'jordan-4-black-cat',
    customerName: 'Santiago Restrepo',
    rating: 5,
    comment: 'Impecable calidad, el nubuck se siente increíblemente premium. El color negro mate combina absolutamente con todo. ¡La mejor compra del año!',
    createdAt: 'Hace 3 días'
  },
  {
    id: 'rev-2',
    productId: 'jordan-4-black-cat',
    customerName: 'Valeria Gómez',
    rating: 5,
    comment: 'Completamente originales. Llegó con el certificado de Sneakers Collection y el embalaje impecable. El envío a Bogotá fue ultra rápido.',
    createdAt: 'Hace 1 semana'
  },
  {
    id: 'rev-3',
    productId: 'nike-dunk-low-panda',
    customerName: 'Mateo Cárdenas',
    rating: 4,
    comment: 'Muy cómodas y combinan con todo. Un clásico obligatorio para cualquier sneakerhead. El envío tardó 2 días más de lo previsto, pero valió la pena.',
    createdAt: 'Hace 2 semanas'
  },
  {
    id: 'rev-4',
    productId: 'jordan-1-chicago-lost-found',
    customerName: 'Camilo Ochoa',
    rating: 5,
    comment: 'La textura del cuero agrietado y la caja desgastada son obras de arte nostálgicas. La atención por WhatsApp fue excelente y despejó todas mis dudas sobre la talla.',
    createdAt: 'Hace 5 días'
  }
];

export const INITIAL_HERO_BANNERS: HeroBanner[] = [
  {
    id: 'banner-1',
    title: 'AIR JORDAN 4 "BLACK CAT"',
    subtitle: 'El sigilo y la elegancia definitiva del nubuck negro mate.',
    image: '/models/1182726603991655.mp4',
    productId: 'jordan-4-black-cat',
    tag: 'EDICIÓN LIMITADA',
    active: true
  },
  {
    id: 'banner-2',
    title: 'JORDAN 1 "LOST & FOUND"',
    subtitle: 'Un viaje en el tiempo al año 1985 con detalles vintage auténticos.',
    image: '/models/1484357129391172.mp4',
    productId: 'jordan-1-chicago-lost-found',
    tag: 'MÍTICA CHICAGO',
    active: true
  },
  {
    id: 'banner-3',
    title: 'NEW BALANCE 550',
    subtitle: 'La silueta clásica de baloncesto retro para el día a día.',
    image: '/models/1494530822373557.mp4',
    productId: 'nb-550-white-green',
    tag: 'NUEVA TENDENCIA',
    active: true
  }
];