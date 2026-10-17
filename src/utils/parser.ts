import { MessageBlock } from '../types';

/**
 * Parses a message string containing:
 * - *action* wrapped in asterisks
 * - ||secret|| wrapped in double pipes (blurred spoiler / secret)
 * - (off-rol text) wrapped in parentheses → displayed in a muted off-rol style
 * - plain spoken dialogues
 * Example: "*te acerca lentamente* ||susurro en tu oído algo prohibido|| (off-rol: ¿seguimos?) ¿te ha gustado?"
 */
export function parseMessageContent(rawContent: string): MessageBlock[] {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const blocks: MessageBlock[] = [];
  // Matches: *action*, ||secret||, or (off-rol text in parentheses)
  const tokenRegex = /(\*([^*]+)\*|\|\|([^|]+)\|\||\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(rawContent)) !== null) {
    // Text before this token → dialogue
    if (match.index > lastIndex) {
      const dialogueText = rawContent.slice(lastIndex, match.index).trim();
      if (dialogueText) {
        blocks.push({ type: 'dialogue', text: dialogueText });
      }
    }

    if (match[2]) {
      // *action*
      const actionText = match[2].trim();
      if (actionText) blocks.push({ type: 'action', text: actionText });
    } else if (match[3]) {
      // ||secret||
      const secretText = match[3].trim();
      if (secretText) blocks.push({ type: 'secret', text: secretText });
    } else if (match[4]) {
      // (off-rol / fuera de personaje)
      const offText = match[4].trim();
      if (offText) blocks.push({ type: 'offtopic', text: offText });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Trailing dialogue
  if (lastIndex < rawContent.length) {
    const trailingDialogue = rawContent.slice(lastIndex).trim();
    if (trailingDialogue) {
      blocks.push({ type: 'dialogue', text: trailingDialogue });
    }
  }

  // Fallback: if nothing matched, treat whole string as dialogue
  if (blocks.length === 0 && rawContent.trim()) {
    blocks.push({ type: 'dialogue', text: rawContent.trim() });
  }

  return blocks;
}
