export interface PokedexEntry {
  id: number; // 1 a 303 (Alola Regional Dex)
  nationalId: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  spriteKey: string;
  isStarter?: boolean;
  minWildLevel?: number;
  evolvesTo?: {
    targetId: number;
    level?: number;
    affection?: number;
  };
}

export type PersonalityType = 
  | 'Pasota (propenso a la desidia)'
  | 'Valeroso (prioriza el respeto y honor)'
  | 'Amoroso (vínculo y entrega máxima)'
  | 'Explosivo (ira y furia desatada)'
  | 'Depresivo (sensible a la desesperación)'
  | 'Sereno (calculador y equilibrado)'
  | 'Orgulloso (intolerante a la derrota)';

export interface PokemonInstance {
  id: string;
  dexId: number;
  name: string;
  nickname: string;
  types: string[];
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isStarter: boolean;
  hasPlotArmor: boolean;
  isTotem: boolean;
  personality: PersonalityType | string;
  ownerId: string;
  ownerName: string;
  // Medidores psicológicos y emocionales completos
  affection: {
    love: number;        // Amor / Cariño (No baja jamás; activa milagros y Plot Armor)
    respect: number;     // Respeto / Disciplina (No baja jamás; potencia Defensa)
    anger: number;       // Ira / Frustración (Potencia Ataque; sube tras perder ante el rival)
    despair: number;     // Desesperación (Sube Velocidad pero baja Defensa; sube al quedar en banca)
    apathy: number;      // Desidia (Hace que desobedezca; sube en rachas de derrotas)
    motivation: number;  // Motivación (Genera movimientos impredecibles/críticos; sube con victorias y entreno)
  };
  hunger: number;
  streak: number;        // Racha de victorias (>0) o derrotas (<0)
  hazañas: string[];
  spriteKey: string;
  signatureMove?: string;
  caughtAt: number;
}

export interface TrainerProfile {
  id: string;
  name: string;
  title: string;
  role: 'jugador' | 'npc' | 'totem';
  avatarUrl: string;
  bio: string;
  activePokemonId?: string;
  team: PokemonInstance[];
}

export interface NPCProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  isTotemBoss?: boolean;
  team: PokemonInstance[];
}

export interface BattleResult {
  title: string;
  winnerTeam: 'team1' | 'team2';
  winnerNames: string;
  chronicleLines: string[];
  mvpPokemon: string;
  dramaticMoment?: string;
  generatedAt: number;
}
