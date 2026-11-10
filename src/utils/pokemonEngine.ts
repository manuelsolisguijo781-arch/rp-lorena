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
  // El amor nunca baja, solo sube
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
    narrative = `${updated.nickname} levantó la mirada tontamente y apoyó su peso en ti; tus caricias disiparon gran parte de su angustia.`;
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

  // Respeto y motivación nunca bajan, suben al entrenar
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

// Generar encuentro salvaje con coherencia evolutiva y nivel medio del equipo
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

// Nombres temáticos de habilidades por tipo elemental
const TYPE_MOVES: Record<string, { fast: string[]; heavy: string[]; ultimate: string[]; effect: string }> = {
  Planta: {
    fast: ['Látigo Cepa certero', 'Hoja Afilada cortante'],
    heavy: ['Bomba Germen expansiva', 'Mazazo demoledor'],
    ultimate: ['Rayo Solar cargado con la luz de Alola'],
    effect: 'envolvió el campo con lianas espinosas'
  },
  Fuego: {
    fast: ['Ascuas incandescentes', 'Nitrocarga a toda velocidad'],
    heavy: ['Lanzallamas abrasador', 'Rueda Fuego voraz'],
    ultimate: ['Llamarada destructiva con forma de kanji'],
    effect: 'elevó la temperatura hasta hacer arder el aire'
  },
  Agua: {
    fast: ['Pistola Agua de precisión', 'Aqua Jet propulsado'],
    heavy: ['Hidropulso aturdidor', 'Cascada implacable'],
    ultimate: ['Hidrobomba torrencial que barrió la arena'],
    effect: 'cubrió el suelo de una densa capa marina'
  },
  Eléctrico: {
    fast: ['Impactrueno veloz', 'Chispazo zigzag'],
    heavy: ['Rayo de alto voltaje', 'Chispas envolventes'],
    ultimate: ['Trueno atronador caído directamente de los cielos'],
    effect: 'cargó la atmósfera con estática ensordecedora'
  },
  Fantasma: {
    fast: ['Tinieblas etéreas', 'Sombra Vil traicionera'],
    heavy: ['Bola Sombra tenebrosa', 'Garra Umbría'],
    ultimate: ['Fuerza Espectral que desgarró la realidad'],
    effect: 'hizo descender la temperatura a un frío espectral'
  },
  Hada: {
    fast: ['Viento Feérico deslumbrante', 'Voz Cautivadora'],
    heavy: ['Brillo Mágico cegador', 'Beso Drenaje'],
    ultimate: ['Fuerza Lunar cargada de magia pura'],
    effect: 'llenó la sala con destellos prismáticos'
  },
  Roca: {
    fast: ['Lanza Rocas afilado', 'Pedrada continua'],
    heavy: ['Avalancha violenta', 'Roca Afilada'],
    ultimate: ['Rocazo descomunal que agrietó el suelo'],
    effect: 'hizo temblar la tierra con estruendo'
  },
  Lucha: {
    fast: ['Golpe Kárate seco', 'Ultrapuño repentino'],
    heavy: ['A Bocajarro sin piedad', 'Sumisión de hierro'],
    ultimate: ['Fuerza Bruta que hizo resonar las paredes'],
    effect: 'dejó escapar una onda de choque física demoledora'
  },
  Dragón: {
    fast: ['Garra Dragón implacable', 'Dragoaliento abrasador'],
    heavy: ['Carga Dragón arrolladora', 'Pulso Dragón'],
    ultimate: ['Cometa Draco desatando una lluvia de meteoros'],
    effect: 'hizo rugir a los ancestros con un aura colosal'
  },
  Normal: {
    fast: ['Ataque Rápido fulgurante', 'Placaje directo'],
    heavy: ['Golpe Cabeza rotundo', 'Doble Filo arriesgado'],
    ultimate: ['Hiperrayo de energía pura y destructiva'],
    effect: 'creó un impacto sordo que levantó una nube de humo'
  }
};

const getFlavorMove = (type: string, power: 'fast' | 'heavy' | 'ultimate') => {
  const table = TYPE_MOVES[type] || TYPE_MOVES['Normal'];
  const list = table[power];
  return list[Math.floor(Math.random() * list.length)];
};

// =========================================================================
// MOTOR NARRATIVO DE COMBATE CON EFECTOS PSICOLÓGICOS / EMOCIONALES
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

  // Identificar quién sale al campo
  let active1: PokemonInstance;
  let active2: PokemonInstance;

  if (strategy === 'anchor' && fighters1.length > 1) {
    active1 = fighters1.shift()!;
  } else {
    active1 = fighters1.shift()!;
  }
  active2 = fighters2.shift()!;

  // 1. APERTURA
  chronicle.push(`⚡ ¡El desafío ha comenzado en la arena de Alola!`);
  if (team2.isTotemBoss) {
    chronicle.push(`Un rugido atronador sacude el suelo. ${team2.name} desciende imbuido de un aura dorada cegadora: ¡un Pokémon Dominante de proporciones descomunales!`);
  }
  if (team1.isCoop) {
    chronicle.push(`Bruno y Lorena avanzan hombro con hombro, sincronizando sus miradas antes de liberar a sus compañeros al unísono.`);
  }

  chronicle.push(`${team1.name} confía el liderazgo a ${active1.nickname} (Nivel ${active1.level} • ${active1.maxHp} PS), mientras que ${team2.name} responde enviando al frente a ${active2.nickname} (Nivel ${active2.level} • ${active2.maxHp} PS).`);
  chronicle.push(`Ambas criaturas se miden en el centro del terreno. La tensión en la sala es absoluta.`);

  let hp1 = active1.maxHp;
  let hp2 = active2.maxHp;
  let revived1 = false;
  let mvpCandidate = active1.nickname;

  // 2. NUDO Y CRUCE DE GOLPES NARRATIVOS (CON IMPACTO EMOCIONAL)
  for (let round = 1; round <= 7; round++) {
    const type1 = active1.types[0] || 'Normal';
    const type2 = active2.types[0] || 'Normal';

    // MODIFICADORES EMOCIONALES:
    // Respeto -> +Defensa
    // Ira -> +Ataque
    // Desesperación -> +Velocidad, -Defensa
    // Desidia -> Posibilidad de desobedecer
    // Motivación -> Posibilidad de golpe impredecible / crítico
    const isDesidia1 = Math.random() * 100 < (active1.affection.apathy * 0.5);
    const isMotivated1 = Math.random() * 100 < (active1.affection.motivation * 0.45);

    if (isDesidia1) {
      chronicle.push(`⚠️ ¡Desobediencia! La desidia de ${active1.nickname} se hizo patente en el campo: ignoró la orden de su entrenador, distraído y apático, quedando totalmente expuesto.`);
    }

    const effectiveAtk1 = active1.attack + Math.round(active1.affection.anger * 0.45);
    const effectiveDef2 = active2.defense + Math.round(active2.affection.respect * 0.35);

    const levelDiff = active1.level - active2.level;
    const speedBoost1 = Math.round(active1.affection.despair * 0.4);
    const baseAdvantage1 = 50 + (levelDiff * 5) + (active1.hasPlotArmor ? 15 : 0) - (active2.isTotem ? 20 : 0) + (isMotivated1 ? 20 : 0) - (isDesidia1 ? 25 : 0) + speedBoost1;

    const roll = Math.random() * 100;
    const roundMove1 = getFlavorMove(type1, round > 4 ? 'ultimate' : 'heavy');
    const roundMove2 = getFlavorMove(type2, round > 4 ? 'ultimate' : 'heavy');

    if (roll < baseAdvantage1) {
      // Éxito de Team 1
      const isCritical = Math.random() > 0.55 || isMotivated1;
      const baseDmg = Math.max(10, effectiveAtk1 - Math.round(effectiveDef2 * 0.4));
      hp2 -= Math.round(baseDmg * (isCritical ? 1.5 : 1.0));

      if (isMotivated1) {
        chronicle.push(`🌟 ¡Maniobra Impredecible! Inspirado por una motivación arrolladora, ${active1.nickname} improvisó un quiebro inverosímil antes de clavar un ${roundMove1} en el punto ciego de su adversario.`);
        highlights.push(`${active1.nickname} realizó una genialidad motivada.`);
      } else if (isCritical) {
        chronicle.push(`¡Impacto crítico! ${active1.nickname} desató un ${roundMove1} con furia concentrada. El golpe quebró la guardia de ${active2.nickname}, haciéndolo retroceder varios metros entre jadeos.`);
        highlights.push(`${active1.nickname} conectó un golpe crítico rotundo.`);
      } else {
        chronicle.push(`${active1.nickname} tomó la delantera ejecutando un ${roundMove1}. En respuesta, ${active2.nickname} intentó contraatacar con ${roundMove2}, pero la sólida defensa enemiga amortiguó el golpe.`);
      }
    } else {
      // Éxito de Team 2
      const effectiveAtk2 = active2.attack + Math.round(active2.affection.anger * 0.45);
      const effectiveDef1 = Math.max(5, (active1.defense + Math.round(active1.affection.respect * 0.35)) - Math.round(active1.affection.despair * 0.25));
      const baseDmg = Math.max(10, effectiveAtk2 - Math.round(effectiveDef1 * 0.4));
      
      hp1 -= Math.round(baseDmg * (active1.hasPlotArmor ? 0.7 : 1.1));
      chronicle.push(`${active2.nickname} hizo valer su presencia. Con un rápido movimiento liberó un ${roundMove2} que impactó de lleno en ${active1.nickname}, levantando una densa polvareda en el campo.`);
    }

    // Comprobar eventos de drama (resurrección emocional de Plot Armor / Amor)
    if (hp1 <= 0 && active1.hasPlotArmor && !revived1) {
      revived1 = true;
      hp1 = Math.round(active1.maxHp * 0.45);
      
      let reasonText = '';
      if (active1.affection.love >= 50) {
        reasonText = `al escuchar la voz decidida de ${active1.ownerName}, un lazo sagrado de amor y devoción encendió una llama interior en su pecho. Negándose a permitir que su entrenador cayera derrotado, ${active1.nickname} rugió con lágrimas en los ojos y se levantó rodeado de un aura indomable!`;
      } else if (active1.affection.anger >= 35) {
        reasonText = `un estallido de orgullo salvaje y furia pura recorrió su columna. ¡Con los ojos inyectados en rabia y despreciando la idea de arrodillarse, ${active1.nickname} desafió las leyes del combate y se mantuvo en pie por pura fuerza de voluntad!`;
      } else {
        reasonText = `un destello de respeto marcial hacia ${active1.ownerName} le impidió rendirse, recuperando el aliento en el último segundo.`;
      }

      chronicle.push(`💥 ¡GIRO EN EL COMBATE! Cuando todo parecía perdido para ${active1.nickname}, ${reasonText}`);
      highlights.push(`¡${active1.nickname} revivió gracias a su Plot Armor y su vínculo emocional inquebrantable!`);
    }

    if (hp2 <= 0) {
      chronicle.push(`El castigo acumulado fue demasiado: ${active2.nickname} se tambaleó y finalmente cayó debilitado sobre la arena.`);
      if (fighters2.length > 0) {
        active2 = fighters2.shift()!;
        hp2 = active2.maxHp;
        chronicle.push(`Sin tiempo que perder, ${team2.name} retira a su caído y manda inmediatamente al combate a ${active2.nickname} (Nv.${active2.level})!`);
      } else {
        break;
      }
    }

    if (hp1 <= 0) {
      chronicle.push(`${active1.nickname} no pudo continuar y cayó exhausto tras darlo todo.`);
      if (fighters1.length > 0) {
        active1 = fighters1.shift()!;
        hp1 = active1.maxHp;
        mvpCandidate = active1.nickname;
        chronicle.push(`¡La batalla no ha terminado! ${team1.name} envía al campo a su siguiente combatiente: ¡adelante, ${active1.nickname} (Nv.${active1.level})!`);
      } else {
        break;
      }
    }
  }

  // 3. CLÍMAX Y DESENLACE
  const team1Won = hp2 <= 0 || hp1 > hp2;
  const winnerTeam = team1Won ? 'team1' : 'team2';
  const winnerNames = team1Won ? team1.name : team2.name;

  chronicle.push(`\n🏁 EL DESENLACE:`);
  if (team1Won) {
    const finalMove = getFlavorMove(active1.types[0] || 'Normal', 'ultimate');
    chronicle.push(`En el instante decisivo, ${active1.nickname} concentró hasta la última gota de su energía vital en un ${finalMove}. El ataque selló la arena con una detonación ensordecedora, dejando fuera de combate a su adversario.`);
    chronicle.push(`🏆 ¡${team1.name} se alza con una victoria indiscutible y épica!`);
    mvpCandidate = active1.nickname;
  } else {
    const finalMove = getFlavorMove(active2.types[0] || 'Normal', 'ultimate');
    chronicle.push(`Con un último despliegue de poder, ${active2.nickname} desató un ${finalMove} que superó toda resistencia defensiva.`);
    chronicle.push(`🏆 ¡${team2.name} resiste el asedio y se corona como vencedor del encuentro!`);
    mvpCandidate = active2.nickname;
  }

  return {
    title: `Crónica de Batalla: ${team1.name} vs ${team2.name}`,
    winnerTeam,
    winnerNames,
    chronicleLines: chronicle,
    mvpPokemon: mvpCandidate,
    dramaticMoment: highlights[0] || 'El intercambio final de habilidades desató el clímax de la arena.',
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
        // Racha de victorias alimenta motivación
        updated.affection.motivation = Math.min(100, updated.affection.motivation + 15);
        updated.affection.apathy = Math.max(0, updated.affection.apathy - 12);
        updated.affection.respect = Math.min(100, updated.affection.respect + (personality.includes('Valeroso') ? 8 : 4));
        updated.affection.anger = Math.max(0, updated.affection.anger - 5);
      }
    } else {
      // Derrota
      if (participated) {
        updated.streak = updated.streak < 0 ? updated.streak - 1 : -1;
        
        // Ira sube por perder, y más si es rival (Bruno vs Lorena)
        const angerGain = isRivalBattle ? 25 : 15;
        const angerMult = personality.includes('Explosivo') ? 1.8 : 1.0;
        updated.affection.anger = Math.min(100, updated.affection.anger + Math.round(angerGain * angerMult));

        // Racha de derrotas alimenta la desidia
        if (updated.streak <= -2) {
          const apathyMult = personality.includes('Pasota') ? 1.8 : 1.0;
          updated.affection.apathy = Math.min(100, updated.affection.apathy + Math.round(15 * apathyMult));
          updated.affection.motivation = Math.max(0, updated.affection.motivation - 15);
        }
      } else {
        // No participó en el combate (quedó en banquillo sin salir): sube la desesperación
        const despairGain = personality.includes('Depresivo') ? 25 : 15;
        updated.affection.despair = Math.min(100, updated.affection.despair + despairGain);
      }
    }

    // Amor y respeto NUNCA bajan
    return updated;
  });
};
