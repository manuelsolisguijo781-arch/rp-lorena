export type Expression = 'normal' | 'blush' | 'smirk' | 'surprised' | 'teasing' | 'serious';

export interface Player {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  password?: string;
  createdAt: number;
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
  type: 'action' | 'dialogue' | 'secret';
  text: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  expression: Expression;
  content: string; // Raw text with *actions* and ||secrets||
  parsedBlocks: MessageBlock[];
  diceRoll?: DiceRoll;
  imageUrl?: string; // Single image or primary thumbnail
  imageUrls?: string[]; // Multiple images attached to the message
  isSecret?: boolean; // If true, the entire message / photos are blurred until tapped
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  members: string[]; // usernames of members in this room
  backgroundUrl: string;
  ambientType: 'tavern' | 'night' | 'rain' | 'fireplace';
  createdAt: number;
}
