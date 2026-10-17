import { MessageBlock } from '../types';

/**
 * Parses a message string containing actions wrapped in asterisks (*action*)
 * and spoken dialogues into an array of structured blocks.
 * Example: "*bruno le agarra la mano* Lorena ha sido un placer verte"
 */
export function parseMessageContent(rawContent: string): MessageBlock[] {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const blocks: MessageBlock[] = [];
  // Regex matches *action text*
  const actionRegex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = actionRegex.exec(rawContent)) !== null) {
    // If there was text before this action, it's dialogue
    if (match.index > lastIndex) {
      const dialogueText = rawContent.slice(lastIndex, match.index).trim();
      if (dialogueText) {
        blocks.push({
          type: 'dialogue',
          text: dialogueText,
        });
      }
    }

    // The action text
    const actionText = match[1].trim();
    if (actionText) {
      blocks.push({
        type: 'action',
        text: actionText,
      });
    }

    lastIndex = actionRegex.lastIndex;
  }

  // Any remaining dialogue after the last action
  if (lastIndex < rawContent.length) {
    const trailingDialogue = rawContent.slice(lastIndex).trim();
    if (trailingDialogue) {
      blocks.push({
        type: 'dialogue',
        text: trailingDialogue,
      });
    }
  }

  // If no blocks were created (e.g. only asterisks with empty text), return full trimmed text as dialogue
  if (blocks.length === 0 && rawContent.trim()) {
    blocks.push({
      type: 'dialogue',
      text: rawContent.trim(),
    });
  }

  return blocks;
}
