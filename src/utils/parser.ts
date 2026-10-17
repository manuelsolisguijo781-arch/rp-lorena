import { MessageBlock } from '../types';

/**
 * Parses a message string containing:
 * - *action* wrapped in asterisks
 * - ||secret|| wrapped in double pipes (blurred spoiler / secret)
 * - plain spoken dialogues
 * Example: "*te acerca lentamente* ||susurro en tu oído algo prohibido|| ¿te ha gustado?"
 */
export function parseMessageContent(rawContent: string): MessageBlock[] {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const blocks: MessageBlock[] = [];
  // Regex matches either *action* or ||secret||
  const tokenRegex = /(\*([^*]+)\*|\|\|([^|]+)\|\|)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(rawContent)) !== null) {
    // If there was text before this token, it's dialogue
    if (match.index > lastIndex) {
      const dialogueText = rawContent.slice(lastIndex, match.index).trim();
      if (dialogueText) {
        blocks.push({
          type: 'dialogue',
          text: dialogueText,
        });
      }
    }

    if (match[2]) {
      // Asterisks -> Action
      const actionText = match[2].trim();
      if (actionText) {
        blocks.push({
          type: 'action',
          text: actionText,
        });
      }
    } else if (match[3]) {
      // Double pipes -> Secret / Spoiler
      const secretText = match[3].trim();
      if (secretText) {
        blocks.push({
          type: 'secret',
          text: secretText,
        });
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Any remaining dialogue after the last match
  if (lastIndex < rawContent.length) {
    const trailingDialogue = rawContent.slice(lastIndex).trim();
    if (trailingDialogue) {
      blocks.push({
        type: 'dialogue',
        text: trailingDialogue,
      });
    }
  }

  // Fallback
  if (blocks.length === 0 && rawContent.trim()) {
    blocks.push({
      type: 'dialogue',
      text: rawContent.trim(),
    });
  }

  return blocks;
}
