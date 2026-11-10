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
  spriteKey: string; // clave para sprite 3D animado en Showdown
  isStarter?: boolean;
  minWildLevel?: number; // Nivel mínimo lógico para aparecer salvaje (coherencia evolutiva)
  evolvesTo?: {
    targetId: number;
    level?: number;
    affection?: number;
  };
}

export interface PokemonInstance {
  id: string; // UUID de la criatura única
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
  hasPlotArmor: boolean; // Controlable manualmente por el usuario
  isTotem: boolean;
  personality: string;
  ownerId: string;
  ownerName: string;
  // Medidores emocionales (0 a 100)
  affection: {
    love: number;     // Afecto / Cariño
    respect: number;  // Respeto / Disciplina
    anger: number;    // Ira / Desprecio / Agresividad
  };
  hunger: number;     // 0 = lleno, 100 = hambriento
  hazañas: string[];  // Memoria de hazañas épicas pasadas
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
  title: string; // ej: "Líder de Gimnasio", "Kahuna de Melemele", "Capitana de Akala"
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
