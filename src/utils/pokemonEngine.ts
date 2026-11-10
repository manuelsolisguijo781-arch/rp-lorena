import { PokedexEntry, PokemonInstance, BattleResult, PersonalityType } from '../types/pokemon';
import { getFullAlolaPokedex } from '../data/alolaPokedex';

export const PERSONALITY_OPTIONS: PersonalityType[] = [
  'Pasota (propenso a la desidia)',
  'Valeroso (prioriza el respeto y honor)',
  'Amoroso (vínculo y entrega máxima)',
  'Explosivo (ira y furia desatada)',
  'Depresivo (sensible a la desesperación)',
  'Sereno (calculador y equilibrado)',
  'Orgulloso (intolerante a la derrota)'
];

// Generar una instancia única de Pokémon
export const createPokemonInstance = (
  entry: PokedexEntry,
  level = 10,
  ownerId = 'bruno',
  ownerName = 'Bruno',
  isStarter = false,
  isTotem = false,
  customNickname?: string,
  customPlotArmor?: boolean,
  customPersonality?: PersonalityType
): PokemonInstance => {
  const statVariation = () => Math.floor(Math.random() * 7) - 3;
  const hpBase = entry.baseStats.hp + level * 2 + statVariation();
  const atkBase = entry.baseStats.attack + Math.floor(level * 1.5) + statVariation();
  const defBase = entry.baseStats.defense + Math.floor(level * 1.3) + statVariation();
  const spdBase = entry.baseStats.speed + Math.floor(level * 1.2) + statVariation();

  const multiplier = isTotem ? 1.6 : (isStarter ? 1.2 : 1.0);
  const chosenPersonality = customPersonality || PERSONALITY_OPTIONS[Math.floor(Math.random() * PERSONALITY_OPTIONS.length)];

  return {
    id: `pk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dexId: entry.id,
    name: entry.name,
    nickname: customNickname || entry.name,
    types: entry.types,
    level,
    currentHp: Math.round(hpBase * multiplier),
    maxHp: Math.round(hpBase * multiplier),
    attack: Math.round(atkBase * multiplier),
    defense: Math.round(defBase * multiplier),
    speed: Math.round(spdBase * multiplier),
    isStarter: isStarter || !!entry.isStarter,
    hasPlotArmor: customPlotArmor !== undefined ? customPlotArmor : (isStarter || !!entry.isStarter),
    isTotem,
    personality: chosenPersonality,
    ownerId,
    ownerName,
    affection: {
      love: isStarter ? 80 : 35,
      respect: isStarter ? 75 : 40,
      anger: 0,
      despair: 0,
      apathy: 0,
      motivation: isStarter ? 70 : 40
    },
    hunger: 40,
    streak: 0,
    hazañas: isStarter ? ['Comenzó su viaje como compañero inicial de Alola'] : [],
    spriteKey: entry.spriteKey,
    caughtAt: Date.now()
  };
};

// Acciones de cuidado
export const feedPokemon = (pk: PokemonInstance): { pokemon: PokemonInstance; narrative: string } => {
  const updated = { ...pk };
  const isAmoroso = updated.personality.includes('Amoroso');

  updated.hunger = Math.max(0, updated.hunger - 40);
  updated.affection.love = Math.min(100, updated.affection.love + (isAmoroso ? 15 : 8));
  updated.affection.respect = Math.min(100, updated.affection.respect + 3);
  updated.affection.anger = Math.max(0, updated.affection.anger - 8);
  updated.affection.apathy = Math.max(0, updated.affection.apathy - 5);
  updated.affection.motivation = Math.min(100, updated.affection.motivation + 5);

  const narrative = `${updated.nickname} comió con gran entusiasmo su comida favorita. Su afecto y confianza hacia ti han florecido.`;
  return { pokemon: updated, narrative };
};

export const petPokemon = (pk: PokemonInstance): { pokemon: PokemonInstance; narrative: string } => {
  const updated = { ...pk };
  const isAmoroso = updated.personality.includes('Amoroso');

  updated.affection.love = Math.min(100, updated.affection.love + (isAmoroso ? 12 : 6));
  updated.affection.anger = Math.max(0, updated.affection.anger - 10);
  updated.affection.despair = Math.max(0, updated.affection.despair - 8);
  updated.affection.apathy = Math.max(0, updated.affection.apathy - 8);

  let narrative = '';
  if (updated.personality.includes('Pasota')) {
    narrative = `${updated.nickname} dio un largo bostezo mientras te dejaba acariciarlo perezosamente. Parece un poco más dócil.`;
  } else if (updated.personality.includes('Explosivo') || updated.affection.anger > 40) {
    narrative = `${updated.nickname} resopló con fiereza pero calmó gradualmente su furia al sentir tu tacto cálido y sereno.`;
  } else if (updated.personality.includes('Depresivo')) {
    narrative = `${updated.nickname} levantó la mirada conmovido y apoyó su peso en ti; tus caricias disiparon gran parte de su angustia.`;
  } else {
    narrative = `Acariciaste a ${updated.nickname}. El lazo entre ambos se fortalece visiblemente.`;
  }

  return { pokemon: updated, narrative };
};

export const trainPokemon = (pk: PokemonInstance): { pokemon: PokemonInstance; narrative: string } => {
  const updated = { ...pk };
  const isValeroso = updated.personality.includes('Valeroso');

  updated.level += 1;
  updated.maxHp += 4;
  updated.currentHp = updated.maxHp;
  updated.attack += 3;
  updated.defense += 2;
  updated.speed += 2;

  updated.affection.respect = Math.min(100, updated.affection.respect + (isValeroso ? 14 : 8));
  updated.affection.motivation = Math.min(100, updated.affection.motivation + 20);
  updated.affection.apathy = Math.max(0, updated.affection.apathy - 15);
  updated.hunger = Math.min(100, updated.hunger + 25);

  const narrative = `¡Entrenamiento completado! ${updated.nickname} subió al Nivel ${updated.level}. Su respeto y motivación están por las nubes.`;
  return { pokemon: updated, narrative };
};

// Comprobar evolución
export const checkAndEvolve = (pk: PokemonInstance): { evolved: boolean; pokemon: PokemonInstance; message?: string } => {
  const pokedex = getFullAlolaPokedex();
  const entry = pokedex.find(p => p.id === pk.dexId);
  if (!entry || !entry.evolvesTo) return { evolved: false, pokemon: pk };

  const target = pokedex.find(p => p.id === entry.evolvesTo!.targetId);
  if (!target) return { evolved: false, pokemon: pk };

  const levelReq = entry.evolvesTo.level || 0;
  const affectionReq = entry.evolvesTo.affection || 0;

  const canEvolve = (pk.level >= levelReq) && (pk.affection.love >= affectionReq);

  if (canEvolve) {
    const updated: PokemonInstance = {
      ...pk,
      dexId: target.id,
      name: target.name,
      nickname: pk.nickname === entry.name ? target.name : pk.nickname,
      types: target.types,
      spriteKey: target.spriteKey,
      maxHp: pk.maxHp + 25,
      currentHp: pk.maxHp + 25,
      attack: pk.attack + 18,
      defense: pk.defense + 15,
      speed: pk.speed + 12,
      hazañas: [...pk.hazañas, `Evolucionó a ${target.name} tras un entrenamiento riguroso`]
    };

    return {
      evolved: true,
      pokemon: updated,
      message: `¡Increíble momento! Rodeado de un resplandor cegador, ${pk.nickname} ha evolucionado a ${target.name}!`
    };
  }

  return { evolved: false, pokemon: pk };
};

// Generar encuentro salvaje con coherencia evolutiva
export const generateWildPokemon = (playerTeam: PokemonInstance[] = []): PokemonInstance => {
  const pokedex = getFullAlolaPokedex();

  const avgLevel = playerTeam.length > 0
    ? Math.round(playerTeam.reduce((acc, p) => acc + p.level, 0) / playerTeam.length)
    : 10;

  const wildLevel = Math.max(3, avgLevel + Math.floor(Math.random() * 5) - 2);
  const legendaries = ['Solgaleo', 'Lunala', 'Necrozma', 'Marshadow', 'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini'];
  
  const validPool = pokedex.filter(p => {
    if (legendaries.includes(p.name)) return false;
    const minReq = p.minWildLevel || 1;
    return minReq <= wildLevel;
  });

  const finalPool = validPool.length > 0 ? validPool : pokedex.filter(p => (p.minWildLevel || 1) <= 5);
  const chosen = finalPool[Math.floor(Math.random() * finalPool.length)];

  return createPokemonInstance(chosen, wildLevel, 'wild', 'Salvaje', false, false);
};

// Lanza una Pokéball
export const attemptCatch = (
  wild: PokemonInstance,
  trainerId: string,
  trainerName: string
): { success: boolean; pokemon?: PokemonInstance; narrative: string } => {
  const catchChance = Math.max(25, 75 - wild.level * 1.5);
  const roll = Math.random() * 100;

  if (roll <= catchChance) {
    const caught = {
      ...wild,
      ownerId: trainerId,
      ownerName: trainerName,
      hazañas: [`Capturado en la hierba salvaje de Alola por ${trainerName}`]
    };
    return {
      success: true,
      pokemon: caught,
      narrative: `¡La Pokéball rodó una... dos... tres veces y emitió un destello final! ¡Has capturado con éxito a ${wild.name} (Nivel ${wild.level})!`
    };
  } else {
    return {
      success: false,
      narrative: `¡La Pokéball vibró intensamente pero ${wild.name} rompió el sello de energía y escapó velozmente entre la vegetación de Alola!`
    };
  }
};

// =========================================================================
// REPERTORIO CINEMÁTICO: ATAQUES, REACCIONES Y VOCES DE ENTRENADOR
// =========================================================================

interface MoveFlavor {
  name: string;
  attackDesc: (att: string, def: string) => string;
}

const TYPE_ATTACKS: Record<string, MoveFlavor[]> = {
  Planta: [
    {
      name: 'Follaje Afilado',
      attackDesc: (a, d) => `${a} batió sus alas agitando el aire y desató una densa ráfaga de hojas cortantes como cuchillas directas hacia ${d}`
    },
    {
      name: 'Látigo Cepa Elástico',
      attackDesc: (a, d) => `${a} extendió dos gruesas lianas espinosas desde su torso, haciéndolas chasquear en el aire con velocidad de látigo buscando envolver a ${d}`
    },
    {
      name: 'Bomba Germen',
      attackDesc: (a, d) => `${a} concentró la energía de la flora de Alola en una semilla gigantesca y la arrojó como un mortero explosivo hacia ${d}`
    }
  ],
  Fuego: [
    {
      name: 'Ascuas Volcánicas',
      attackDesc: (a, d) => `${a} arqueó el lomo acumulando un calor incandescente en su garganta y escupió una lluvia de ascuas ardientes sobre ${d}`
    },
    {
      name: 'Colmillo Ígneo',
      attackDesc: (a, d) => `${a} rugió envolviendo sus fauces en llamaradas carmesí y se abalanzó a gran velocidad para morder el flanco de ${d}`
    },
    {
      name: 'Llamarada Voraz',
      attackDesc: (a, d) => `${a} liberó una columna de fuego abrasador con forma de estrella que tiñó de rojo toda la arena buscando incinerar a ${d}`
    }
  ],
  Agua: [
    {
      name: 'Pistola Agua Presurizada',
      attackDesc: (a, d) => `${a} infló sus mejillas y disparó un torrente de agua marina a altísima presión que silbó por el aire hacia ${d}`
    },
    {
      name: 'Aqua Jet Propulsado',
      attackDesc: (a, d) => `${a} se rodeó de una envoltura de agua torrencial y salió disparado como un torpedo sónico directo contra ${d}`
    },
    {
      name: 'Hidropulso Sonoro',
      attackDesc: (a, d) => `${a} generó una esfera líquida pulsante que vibraba con ecos desorientadores antes de lanzarla de lleno contra ${d}`
    }
  ],
  Eléctrico: [
    {
      name: 'Impactrueno Fulgurante',
      attackDesc: (a, d) => `${a} cargó sus reservas eléctricas hasta hacer chisporrotear el suelo y liberó un relámpago en zigzag directo hacia ${d}`
    },
    {
      name: 'Chispazo Envolvente',
      attackDesc: (a, d) => `${a} dio un salto giratorio descargando arcos voltaicos en todas direcciones que formaron una jaula estática alrededor de ${d}`
    }
  ],
  Normal: [
    {
      name: 'Ataque Rápido Cegador',
      attackDesc: (a, d) => `${a} desapareció de la vista en un pestañeo gracias a una aceleración fulgurante, reapareciendo en la espalda de ${d}`
    },
    {
      name: 'Placaje Férreo',
      attackDesc: (a, d) => `${a} bajó el centro de gravedad y embistió con todo su peso corporal como un ariete sin titubear contra ${d}`
    }
  ]
};

// Generador de diálogos y gritos de ánimo según el entrenador
const getTrainerShout = (trainerName: string, pkName: string, mood: 'attack' | 'support' | 'boss'): string => {
  const lower = trainerName.toLowerCase();

  if (lower.includes('miu') || lower.includes('iruma')) {
    const miuQuotes = [
      `«¡Oye, ${pkName}, más te vale no hacerme quedar como una idiota! ¡Muéstrales lo que hace un invento de la Gran Miu Iruma!», chilló Miu ajustándose las gafas con una carcajada arrogante.`,
      `«¡Ja, ja, ja! ¿Eso es todo lo que tienen? ¡${pkName}, aplasta a ese pedazo de basura antes de que me aburra!», berreó Miu Iruma con descaro y desdén.`,
      `«¡Atrévete a fallar y te desmantelo! ¡Demuestra quién manda en este maldito archipiélago!», vociferó Miu Iruma agitando los puños en el aire.`
    ];
    return miuQuotes[Math.floor(Math.random() * miuQuotes.length)];
  }

  if (lower.includes('bruno')) {
    const brunoQuotes = [
      `«¡${pkName}, confía en tus reflejos! ¡Conectemos nuestro ritmo y ataca sin dudar!», exclamó Bruno con mirada decidida y serena.`,
      `«¡Resiste con firmeza, ${pkName}! ¡Estamos juntos en este combate y no nos rendiremos jamás!», arengó Bruno desde la línea de banda.`,
      `«¡Esa es la chispa que hemos entrenado! ¡Aprovecha la apertura ahora!», gritó Bruno con el puño cerrado en alto.`
    ];
    return brunoQuotes[Math.floor(Math.random() * brunoQuotes.length)];
  }

  if (lower.includes('lore')) {
    const lorenaQuotes = [
      `«¡${pkName}, mantén la calma y encuentra su punto ciego! ¡Ahora, ejecuta la jugada!», ordenó Loreeena con voz templada y calculadora.`,
      `«¡No bajes la guardia por nada del mundo, ${pkName}! ¡Enséñales la fuerza de nuestro vínculo!», animó Loreeena con pasión en sus ojos.`,
      `«¡Esa fue una maniobra impecable! ¡Sigue manteniendo el control de la arena!», felicitó Loreeena con una sonrisa de confianza.`
    ];
    return lorenaQuotes[Math.floor(Math.random() * lorenaQuotes.length)];
  }

  // Genérico para NPCs o Jefes
  const genericQuotes = [
    `«¡${pkName}, demuéstrales la fuerza del verdadero entrenamiento insular!», gritó ${trainerName} con autoridad.`,
    `«¡No cedas ni un centímetro de terreno! ¡Haz valer tu orgullo!», exclamó ${trainerName}.`
  ];
  return genericQuotes[Math.floor(Math.random() * genericQuotes.length)];
};

// =========================================================================
// MOTOR NARRATIVO DE COMBATE CON ESTRUCTURA EN 3 TIEMPOS:
// 1. EL ATAQUE -> 2. LA REACCIÓN DEL DEFENSOR -> 3. EL RESULTADO Y DAÑO
// =========================================================================
export const simulateNarrativeBattle = (
  team1: { name: string; pokemons: PokemonInstance[]; isCoop?: boolean },
  team2: { name: string; pokemons: PokemonInstance[]; isTotemBoss?: boolean },
  strategy: 'lead' | 'anchor' = 'lead'
): BattleResult => {
  const chronicle: string[] = [];
  const highlights: string[] = [];

  const fighters1 = [...team1.pokemons];
  const fighters2 = [...team2.pokemons];

  if (fighters1.length === 0 || fighters2.length === 0) {
    return {
      title: 'Combate Cancelado',
      winnerTeam: 'team1',
      winnerNames: team1.name,
      chronicleLines: ['No había suficientes contendientes listos para la batalla.'],
      mvpPokemon: 'Ninguno',
      generatedAt: Date.now()
    };
  }

  let active1: PokemonInstance;
  let active2: PokemonInstance;

  if (strategy === 'anchor' && fighters1.length > 1) {
    active1 = fighters1.shift()!;
  } else {
    active1 = fighters1.shift()!;
  }
  active2 = fighters2.shift()!;

  // 1. APERTURA NARRATIVA CON CARISMA
  chronicle.push(`⚡ ¡El árbitro de la arena da la señal de inicio y el público contiene el aliento en Alola!`);

  if (team2.isTotemBoss) {
    chronicle.push(`Un rugido atronador sacude el suelo. ${team2.name} desciende imbuido de un aura dorada cegadora: ¡un Pokémon Dominante colosal que eclipsa el sol!`);
  }

  if (team1.isCoop) {
    chronicle.push(`Bruno y Loreeena intercambian una mirada cómplice cargada de determinación antes de enviar a sus compañeros en perfecta sincronía.`);
  }

  chronicle.push(`${team1.name} envía con decisión a ${active1.nickname} (Nivel ${active1.level} • ${active1.personality}), mientras que ${team2.name} desafía con ${active2.nickname} (Nivel ${active2.level} • ${active2.personality}).`);
  chronicle.push(`Ambas criaturas se plantan cara a cara en el centro del terreno midiendo cada respiración del rival.`);

  let hp1 = active1.maxHp;
  let hp2 = active2.maxHp;
  let revived1 = false;
  let mvpCandidate = active1.nickname;

  // 2. RONDAS EN 3 TIEMPOS: (ATAQUE -> REACCIÓN -> DAÑO/RESULTADO)
  for (let round = 1; round <= 6; round++) {
    // Alternancia de iniciativa
    const team1AttacksFirst = (round % 2 !== 0);
    const attacker = team1AttacksFirst ? active1 : active2;
    const defender = team1AttacksFirst ? active2 : active1;
    const attackerTrainer = team1AttacksFirst ? team1.name : team2.name;
    const defenderTrainer = team1AttacksFirst ? team2.name : team1.name;

    // Diálogo del entrenador al inicio del asalto
    if (round === 1 || round === 4) {
      chronicle.push(getTrainerShout(attackerTrainer, attacker.nickname, 'attack'));
    }

    const typePool = TYPE_ATTACKS[attacker.types[0]] || TYPE_ATTACKS['Normal'];
    const move = typePool[Math.floor(Math.random() * typePool.length)];

    // TIEMPO 1: DESCRIPCIÓN DEL ATAQUE
    const step1 = `▶ [ATAQUE]: ${move.attackDesc(attacker.nickname, defender.nickname)}.`;

    // Factores emocionales
    const isDesidia = Math.random() * 100 < (defender.affection.apathy * 0.45);
    const isDespair = defender.affection.despair > 40;
    const isMotivated = Math.random() * 100 < (attacker.affection.motivation * 0.5);
    const isAngerBuff = attacker.affection.anger > 30;

    // TIEMPO 2: REACCIÓN DEL DEFENSOR
    let step2 = '';
    if (isDesidia) {
      step2 = `▶ [REACCIÓN]: Sin embargo, ${defender.nickname}, invadido por una desidia abrumadora, se quedó mirando a otra parte con desgana y tardó una eternidad en percatarse de la embestida.`;
    } else if (isDespair) {
      step2 = `▶ [REACCIÓN]: Preso de una desesperación frenética, ${defender.nickname} se lanzó en un esquive imprudente y caótico buscando salvarse por puro instinto animal.`;
    } else if (defender.affection.respect >= 50) {
      step2 = `▶ [REACCIÓN]: Con una disciplina marcial forjada en el respeto a ${defenderTrainer}, ${defender.nickname} plantó firmemente sus apoyos en la tierra y cruzó sus extremidades para amortiguar la colisión.`;
    } else {
      step2 = `▶ [REACCIÓN]: ${defender.nickname} reaccionó en una fracción de segundo, arqueando el cuerpo e intentando un salto evasivo lateral para esquivar la trayectoria.`;
    }

    // TIEMPO 3: RESOLUCIÓN Y DAÑO
    let step3 = '';
    const levelDiff = attacker.level - defender.level;
    const hitRoll = Math.random() * 100;
    const hitThreshold = 65 + (levelDiff * 4) + (isDesidia ? 30 : 0) - (defender.affection.respect * 0.2);

    if (hitRoll < hitThreshold) {
      // El ataque conecta
      const isCrit = Math.random() > 0.6 || isMotivated;
      const effectiveAtk = attacker.attack + (isAngerBuff ? Math.round(attacker.affection.anger * 0.4) : 0);
      const effectiveDef = Math.max(5, defender.defense + Math.round(defender.affection.respect * 0.3) - (isDespair ? 10 : 0));
      const damage = Math.max(12, Math.round((effectiveAtk * (isCrit ? 1.5 : 1.0)) - (effectiveDef * 0.35)));

      if (team1AttacksFirst) {
        hp2 -= damage;
      } else {
        hp1 -= damage;
      }

      if (isMotivated) {
        step3 = `▶ [IMPACTO]: ¡Y la motivación de ${attacker.nickname} obró magia! Leyó la reacción del defensor en el aire y corrigió su trayectoria con una floritura acrobática. ¡El impacto fue demoledor en un punto crítico, levantando una nube de polvo y arrancándole un jadeo de dolor a ${defender.nickname}!`;
        highlights.push(`${attacker.nickname} ejecutó un impacto crítico motivado.`);
      } else if (isCrit) {
        step3 = `▶ [IMPACTO]: ¡Golpe rotundo! El ${move.name} impactó de lleno en la guardia de ${defender.nickname}. La onda de choque lo hizo derrapar varios metros sobre la arena, dejándolo visiblemente maltrecho (-${damage} PS).`;
        highlights.push(`${attacker.nickname} asestó un golpe crítico.`);
      } else {
        step3 = `▶ [IMPACTO]: Aunque ${defender.nickname} intentó mitigar el golpe, la contundencia de la técnica fue innegable: recibió el castigo en pleno torso y retrocedió con un gruñido ahogado (-${damage} PS).`;
      }
    } else {
      // El ataque falla o es bloqueado
      step3 = `▶ [IMPACTO]: ¡Maniobra defensiva impecable! ${defender.nickname} consiguió esquivar por escasos milímetros el proyectil, que estalló inofensivamente contra el muro de la arena sin causarle daño alguno.`;
    }

    // Añadir el bloque de 3 tiempos a la crónica
    chronicle.push(`${step1}\n${step2}\n${step3}`);

    // PLOT ARMOR / RESURRECCIÓN DE INICIALES
    if (hp1 <= 0 && active1.hasPlotArmor && !revived1) {
      revived1 = true;
      hp1 = Math.round(active1.maxHp * 0.45);
      chronicle.push(`💥 ¡EL CLÍMAX DE LA TRAMA! ${active1.nickname} cayó de rodillas sobre la arena con la mirada desvaneciéndose... pero al escuchar la voz desesperada de ${active1.ownerName}, un lazo inquebrantable de amor puro encendió una llama salvaje en su pecho. ¡Negándose a perder ante ${active2.nickname}, rugió hacia el cielo y se levantó rodeado de un aura indomable!`);
      highlights.push(`¡${active1.nickname} revivió por su Plot Armor y amor inquebrantable!`);
    }

    // Caída de combatientes
    if (hp2 <= 0) {
      chronicle.push(`💀 ¡El cuerpo de ${active2.nickname} no resistió más castigo y cayó exhausto sobre la arena, fuera de combate!`);
      if (fighters2.length > 0) {
        active2 = fighters2.shift()!;
        hp2 = active2.maxHp;
        chronicle.push(`¡${team2.name} retira a su compañero caído y manda de inmediato a la arena a ${active2.nickname} (Nv.${active2.level})!`);
      } else {
        break;
      }
    }

    if (hp1 <= 0) {
      chronicle.push(`💀 ¡${active1.nickname} no pudo sostenerse en pie y cayó debilitado entre jadeos tras vaciar hasta su última gota de energía!`);
      if (fighters1.length > 0) {
        active1 = fighters1.shift()!;
        hp1 = active1.maxHp;
        mvpCandidate = active1.nickname;
        chronicle.push(`¡${team1.name} aprieta los dientes y envía al campo a su reserva: ¡adelante, ${active1.nickname} (Nv.${active1.level})!`);
      } else {
        break;
      }
    }
  }

  // 3. DESENLACE ÉPICO
  const team1Won = hp2 <= 0 || hp1 > hp2;
  const winnerTeam = team1Won ? 'team1' : 'team2';
  const winnerNames = team1Won ? team1.name : team2.name;

  chronicle.push(`\n🏁 EL GOLPE DE GRACIA:`);
  if (team1Won) {
    chronicle.push(`Con la adrenalina al límite y la arena envuelta en tensión, ${active1.nickname} cargó toda su energía restante en un último envite definitivo. El impacto selló la victoria levantando una ovación en la sala.`);
    chronicle.push(`🏆 ¡${team1.name} se corona como vencedor absoluto tras una batalla inolvidable!`);
    mvpCandidate = active1.nickname;
  } else {
    chronicle.push(`Aprovechando el agotamiento rival, ${active2.nickname} encontró la apertura final y asestó una estocada certera que zanjó el duelo.`);
    chronicle.push(`🏆 ¡${team2.name} resiste con entereza y se alza con la victoria en Alola!`);
    mvpCandidate = active2.nickname;
  }

  return {
    title: `Crónica de Batalla: ${team1.name} vs ${team2.name}`,
    winnerTeam,
    winnerNames,
    chronicleLines: chronicle,
    mvpPokemon: mvpCandidate,
    dramaticMoment: highlights[0] || 'El intercambio en 3 tiempos desató el momento más épico del duelo.',
    generatedAt: Date.now()
  };
};

// Aplicar consecuencias emocionales tras el combate
export const applyPostBattleEmotions = (
  team: PokemonInstance[],
  won: boolean,
  isRivalBattle: boolean,
  activeFighterIds: string[]
): PokemonInstance[] => {
  return team.map(pk => {
    const updated = { ...pk, affection: { ...pk.affection } };
    const participated = activeFighterIds.includes(pk.id);
    const personality = pk.personality || '';

    if (won) {
      if (participated) {
        updated.streak = updated.streak > 0 ? updated.streak + 1 : 1;
        updated.affection.motivation = Math.min(100, updated.affection.motivation + 15);
        updated.affection.apathy = Math.max(0, updated.affection.apathy - 12);
        updated.affection.respect = Math.min(100, updated.affection.respect + (personality.includes('Valeroso') ? 8 : 4));
        updated.affection.anger = Math.max(0, updated.affection.anger - 5);
      }
    } else {
      if (participated) {
        updated.streak = updated.streak < 0 ? updated.streak - 1 : -1;
        const angerGain = isRivalBattle ? 25 : 15;
        const angerMult = personality.includes('Explosivo') ? 1.8 : 1.0;
        updated.affection.anger = Math.min(100, updated.affection.anger + Math.round(angerGain * angerMult));

        if (updated.streak <= -2) {
          const apathyMult = personality.includes('Pasota') ? 1.8 : 1.0;
          updated.affection.apathy = Math.min(100, updated.affection.apathy + Math.round(15 * apathyMult));
          updated.affection.motivation = Math.max(0, updated.affection.motivation - 15);
        }
      } else {
        const despairGain = personality.includes('Depresivo') ? 25 : 15;
        updated.affection.despair = Math.min(100, updated.affection.despair + despairGain);
      }
    }

    return updated;
  });
};
