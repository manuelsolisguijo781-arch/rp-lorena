export type VisionElement = 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo';

export type Expression = 'normal' | 'blush' | 'smirk' | 'surprised' | 'teasing' | 'serious';

export interface Character {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  vision: VisionElement;
  color: string;
}

export type DiceType = 'd20' | 'd100' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4';

export type RollOutcome = 'critical_success' | 'success' | 'mixed' | 'failure' | 'critical_failure';

export interface DiceRoll {
  diceType: DiceType;
  actionName: string;
  rollValue: number;
  modifier: number;
  total: number;
  outcome: RollOutcome;
  description?: string;
}

export interface MessageBlock {
  type: 'action' | 'dialogue';
  text: string;
}

export interface Message {
  id: string;
  roomId: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  characterVision: VisionElement;
  expression: Expression;
  content: string; // Raw text
  parsedBlocks: MessageBlock[];
  diceRoll?: DiceRoll;
  imageUrl?: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  location: string;
  region: 'Mondstadt' | 'Liyue' | 'Inazuma' | 'Sumeru' | 'Fontaine' | 'Custom';
  description: string;
  backgroundUrl: string;
  ambientType: 'tavern' | 'night' | 'rain' | 'fireplace';
  createdAt: number;
}
