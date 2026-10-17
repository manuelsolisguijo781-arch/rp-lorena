export interface LoreSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  summary: string;
  content: {
    heading: string;
    description: string;
    bullets?: string[];
  }[];
}

export interface RegionLocation {
  id: string;
  name: string;
  element: string;
  color: string;
  tagline: string;
  description: string;
  notablePlaces: string[];
  imageUrl: string;
}

export const COSMOLOGY_LORE: LoreSection[] = [
  {
    id: 'mortal-plane',
    title: '1. La Naturaleza de Teyvat',
    subtitle: 'El Plano Mortal',
    icon: '🌍',
    summary: 'Teyvat es un plano de existencia cerrado y protegido, un "oasis" de orden en medio de un océano de caos primordial.',
    content: [
      {
        heading: 'Los Siete Elementos',
        description:
          'Todo en Teyvat —la materia, la vida, la geografía y la magia— está impregnado por la energía de los siete elementos: Anemo, Geo, Electro, Dendro, Hydro, Pyro y Cryo. La armonía elemental sostiene las leyes de la física y el clima en cada nación.',
      },
      {
        heading: 'Las Líneas Ley',
        description:
          'Son la "red de venas y nervios" que recorren el subsuelo del planeta. Por ellas fluyen los recuerdos de los caídos, la energía elemental pura y la historia misma del mundo.',
        bullets: [
          'Si una Línea Ley se corrompe o se fractura, la zona circundante sufre desastres mágicos.',
          'Provocan mutaciones en la fauna local y la aparición de espectros o ecos del pasado.',
          'Los árboles petrificados conectan directamente con esta red subterránea.',
        ],
      },
      {
        heading: 'Las Naciones Mortales',
        description:
          'El continente está repartido en reinos y naciones soberanas gobernadas por monarcas, parlamentos, oligarquías comerciales o senados. Aunque veneran a sus respectivos dioses, el día a día mortal (impuestos, ejércitos, leyes, diplomacia y justicia) es gestionado íntegramente por los humanos.',
      },
    ],
  },
  {
    id: 'celestia',
    title: '2. Celestia: El Orden Celestial y la Fe',
    subtitle: 'El Dominio de lo Divino',
    icon: '✨',
    summary: 'Celestia es la islaela flotante que se divisa en el firmamento, la sede del poder absoluto y las leyes inmutables sobre el plano mortal.',
    content: [
      {
        heading: 'El Principio y las Reglas del Mundo',
        description:
          'Celestia impuso el "Orden Celestial" en eras remotas para reestructurar la materia prima del mundo y proteger a la humanidad de la locura del Abismo. Fijó leyes metafísicas inmutables para contener el caos.',
      },
      {
        heading: 'El Letargo / Silencio de Celestia',
        description:
          'Tras cataclismos ancestrales, Celestia ha entrado en una fase de silencio prolongado. No interviene en las guerras mortales, la política ni las injusticias cotidianas. Solo despertaría o enviaría sus temibles Clavos Celestiales (armas de purificación masiva) si los mortales cruzan "líneas rojas": usar poder abismal a gran escala o intentar derrocar las leyes de la existencia.',
      },
      {
        heading: 'Los Arcontes (Los Siete Regentes)',
        description:
          'Siete entidades de inmenso poder a las que Celestia otorgó una Gnosis (canalizadores de energía divina directamente conectados con el cielo). Cada Arconte vela por una de las siete regiones. No son omnipotentes; son guardianes patronales encargados de preservar la estabilidad de sus tierras.',
      },
      {
        heading: 'Las Visiones (Bendición o Marca)',
        description:
          'Cuando un mortal demuestra un anhelo, ambición o determinación que resuena con un elemento, recibe una gema mágica llamada Visión. Otorga la capacidad de manifestar magia elemental sin herramientas.',
        bullets: [
          'Para los mortales: un tesoro codiciado que confiere estatus militar, nobiliario y poder.',
          'Para Celestia: herramientas de vigilancia y "marcas" que identifican a candidatos a la ascensión.',
        ],
      },
    ],
  },
  {
    id: 'abyss',
    title: '3. El Abismo y las Sombras del Vacío',
    subtitle: 'El Caos Primordial',
    icon: '🌑',
    summary: 'El Abismo es el reverso oscuro de Teyvat: la masa de caos primordial, materia oscura y energía destructiva que existía antes de la creación.',
    content: [
      {
        heading: 'La Corrupción Mutagénica',
        description:
          'La energía del Abismo es altamente corrosiva y tóxica para los seres vivos de Teyvat. Degrada las Líneas Ley, altera los ecosistemas y muta a la fauna engendrando aberraciones, bestias voraces y necrófagos (al más puro estilo de fantasía oscura y The Witcher).',
      },
      {
        heading: 'Puntos de Filtración en el Mundo',
        description:
          'La frontera espacial entre Teyvat y el Abismo se agrieta en puntos vulnerables del continente:',
        bullets: [
          'Grietas y Ruinas: En catacumbas profundas, simas sin explorar y los restos de civilizaciones caídas (como Khaenri\'ah).',
          'Santuarios Daédricos: Lugares donde Príncipes Daédricos del Abismo han abierto portales para tentar y pactar con mortales.',
          'Líneas Ley Podridas: Zonas donde tragedias o sacrificios de magia negra han gangrenado la savia subterránea.',
        ],
      },
      {
        heading: 'La Orden del Abismo',
        description:
          'Organización bélica y fanática formada por supervivientes de guerras antiguas, cultistas proscritos y monstruos abismales. Su objetivo supremo es derrocar a las naciones de los Arcontes y erradicar el Orden Celestial.',
      },
      {
        heading: 'Los Príncipes Daédricos',
        description:
          'Entidades supredimensionales e independientes con sus propios dominios en los Planos de Oblivion abismales (equiparables a los Cinco Pecadores). No sirven ciegamente a la Orden del Abismo; son fuerzas de la tentación que comercian con la ambición humana mediante pactos prohibidos y reliquias de inmenso poder.',
      },
    ],
  },
];

export const WORLD_REGIONS: RegionLocation[] = [
  {
    id: 'mondstadt',
    name: 'Mondstadt',
    element: 'Anemo (Viento)',
    color: '#74c2a8',
    tagline: 'Ciudad de la Libertad, los Molinos y el Vino de Diente de León',
    description:
      'Tierras de colinas verdes, lagos cristalinos y viñedos centenarios. Sus habitantes valoran la libertad individual y las noches de taberna con baladas de bardos errantes.',
    notablePlaces: ['Viñedo del Amanecer', 'Catedral de Favonius', 'Guarida de Stormterror', 'Punto del Acantilado'],
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'liyue',
    name: 'Liyue',
    element: 'Geo (Tierra y Contratos)',
    color: '#e6b34b',
    tagline: 'Puerto de las Mil Linternas y Acantilados de Piedra Ancestral',
    description:
      'Un próspero imperio mercantil rodeado de montañas afiladas, ríos de niebla y bosques de piedra. Rige el comercio continental bajo la solemnidad de los contratos sagrados.',
    notablePlaces: ['Pabellón Liuli', 'Posada Wangshu', 'Poblado Qingce', 'Bosque de Piedra Huaguang'],
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'inazuma',
    name: 'Inazuma',
    element: 'Electro (Rayo y Eternidad)',
    color: '#b079d8',
    tagline: 'Archipiélago de las Tormentas y los Cerezos Púrpuras',
    description:
      'Islas azotadas por tormentas eléctricas perpetuas y cerezos que nunca marchitan. Una tierra de honor samurái, cortesanos sutiles y misterios entre las brumas del mar.',
    notablePlaces: ['Gran Santuario Narukami', 'Ciudadela del Shogunato', 'Isla Yashiori', 'Playa de Nazuchi'],
    imageUrl: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sumeru',
    name: 'Sumeru',
    element: 'Dendro (Naturaleza y Sabiduría)',
    color: '#65c466',
    tagline: 'El Mar de Arena Infinita y la Selva Tropical Primordial',
    description:
      'Un reino dividido entre exuberantes selvas milenarias de hongos gigantescos y un vasto desierto donde yacen templos olvidados y máquinas sepultadas de civilizaciones caídas.',
    notablePlaces: ['Academia de Sumeru', 'Selva Lokapala', 'Mausoleo del Rey Deshret', 'Oasis de Sobek'],
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'fontaine',
    name: 'Fontaine',
    element: 'Hydro (Agua y Justicia)',
    color: '#4fa8e0',
    tagline: 'Cuna del Arte, el Vapor y los Grandes Tribunales Acuáticos',
    description:
      'Nación de canales navegables, arquitectura victoriana y tecnología de vapor (pneuma y ousia). La elegancia oculta pasiones peligrosas y secretos bajo las aguas profundas.',
    notablePlaces: ['Ópera Epíclesis', 'Distrito de Lyonnais', 'Fuerte Merópide', 'Trinchera Elton'],
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'abyss-realms',
    name: 'Las Tierras del Abismo & Ruinas de Khaenri\'ah',
    element: 'Oscuridad / Vacío',
    color: '#7c3aed',
    tagline: 'El Reino Subterráneo sin Dioses y las Grietas de las Sombras',
    description:
      'Bajo la corteza de Teyvat yacen los restos de la civilización sin Arcontes, infestada de criaturas del vacío, monstruos mutantes y portales a los santuarios daédricos.',
    notablePlaces: ['La Puerta del Vacío', 'Santuario de los Pecadores', 'La Cima Subterránea', 'Palacio Quebrado'],
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
  },
];
