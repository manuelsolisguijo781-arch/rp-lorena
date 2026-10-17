import { Character, Room, Message } from '../types';
import { parseMessageContent } from '../utils/parser';

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'char-bruno',
    name: 'Bruno',
    title: 'Caballero Errante',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vision: 'Pyro',
    color: '#e05353',
  },
  {
    id: 'char-lorena',
    name: 'Lorena',
    title: 'Dama de las Estrellas',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    vision: 'Cryo',
    color: '#58d3d9',
  },
];

export const DEFAULT_ROOMS: Room[] = [
  {
    id: 'room-dawn-winery',
    name: 'Viñedo del Amanecer',
    location: 'Mondstadt • Terraza Privada',
    region: 'Mondstadt',
    description: 'Bajo la luz tenue de las velas y el cielo estrellado de Teyvat. La brisa trae aroma a uvas y madera vieja.',
    backgroundUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
    ambientType: 'tavern',
    createdAt: Date.now() - 1000000,
  },
  {
    id: 'room-liyue-harbor',
    name: 'Puerto de Liyue',
    location: 'Liyue • Mirador del Pabellón Liuli',
    region: 'Liyue',
    description: 'Miles de linternas flotan suavemente en el mar nocturno mientras la brisa marina roza vuestras mejillas.',
    backgroundUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    ambientType: 'night',
    createdAt: Date.now() - 500000,
  },
  {
    id: 'room-dnd-chamber',
    name: 'Cámara de las Sombras (D&D)',
    location: 'Mazmorra Olvidada • Sala del Trono',
    region: 'Custom',
    description: 'Un templo arcano donde cada paso resuena y el destino se decide al filo del dado.',
    backgroundUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    ambientType: 'fireplace',
    createdAt: Date.now(),
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-demo-1',
    roomId: 'room-dawn-winery',
    characterId: 'char-bruno',
    characterName: 'Bruno',
    characterAvatar: DEFAULT_CHARACTERS[0].avatarUrl,
    characterVision: 'Pyro',
    expression: 'smirk',
    content: '*se acerca lentamente y le ofrece una copa con una sonrisa cálida* Lorena, la noche apenas comienza...',
    parsedBlocks: parseMessageContent('*se acerca lentamente y le ofrece una copa con una sonrisa cálida* Lorena, la noche apenas comienza...'),
    timestamp: Date.now() - 120000,
  },
  {
    id: 'msg-demo-2',
    roomId: 'room-dawn-winery',
    characterId: 'char-lorena',
    characterName: 'Lorena',
    characterAvatar: DEFAULT_CHARACTERS[1].avatarUrl,
    characterVision: 'Cryo',
    expression: 'blush',
    content: '*acepta la copa con los dedos rozando los suyos* ¿Acaso tienes algo planeado, caballero?',
    parsedBlocks: parseMessageContent('*acepta la copa con los dedos rozando los suyos* ¿Acaso tienes algo planeado, caballero?'),
    diceRoll: {
      diceType: 'd20',
      actionName: 'Persuasión / Seducción',
      rollValue: 19,
      modifier: 2,
      total: 21,
      outcome: 'critical_success',
      description: 'Intento de leer sus intenciones y cautivarle',
    },
    timestamp: Date.now() - 60000,
  },
];
