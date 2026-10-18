import { MessageBlock } from '../types';

/**
 * Splits a dialogue string by slash prefixes (/ to /////) to assign character voice colors.
 * - / (1 slash)     → Color 1: Rosa
 * - // (2 slashes)   → Color 2: Verde
 * - /// (3 slashes)  → Color 3: Azul / Celeste
 * - //// (4 slashes) → Color 4: Violeta / Morado
 * - ///// (5 slashes)→ Color 5: Naranja / Ámbar
 */
function parseDialogueWithSlashes(
  text: string,
  inheritedColor?: 1 | 2 | 3 | 4 | 5
): { blocks: MessageBlock[]; lastColor?: 1 | 2 | 3 | 4 | 5 } {
  const result: MessageBlock[] = [];
  if (!text || !text.trim()) {
    return { blocks: result, lastColor: inheritedColor };
  }

  // Regex matches 1 to 5 slashes preceded by start of line or whitespace,
  // not followed by a slash, and not part of a URL (e.g. ://)
  const slashRegex = /(?:^|\s)(\/{1,5})(?!\/)/g;
  let currentColor = inheritedColor;
  let match: RegExpExecArray | null;

  const matches: { index: number; length: number; count: 1 | 2 | 3 | 4 | 5 }[] = [];

  while ((match = slashRegex.exec(text)) !== null) {
    const precedingIndex = match.index;
    // Guard against URLs like http:// or https://
    if (precedingIndex > 0 && text[precedingIndex - 1] === ':') {
      continue;
    }
    const fullMatch = match[0];
    const slashToken = match[1];
    const slashStart = match.index + (fullMatch.length - slashToken.length);
    const count = slashToken.length as 1 | 2 | 3 | 4 | 5;
    matches.push({ index: slashStart, length: slashToken.length, count });
  }

  if (matches.length === 0) {
    const trimmed = text.trim();
    if (trimmed) {
      result.push({
        type: 'dialogue',
        text: trimmed,
        slashColor: currentColor,
      });
    }
    return { blocks: result, lastColor: currentColor };
  }

  // Text before the first slash match
  if (matches[0].index > 0) {
    const beforeText = text.slice(0, matches[0].index).trim();
    if (beforeText) {
      result.push({
        type: 'dialogue',
        text: beforeText,
        slashColor: currentColor,
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const textStart = currentMatch.index + currentMatch.length;
    const textEnd = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chunkText = text.slice(textStart, textEnd).trim();

    currentColor = currentMatch.count;

    if (chunkText) {
      result.push({
        type: 'dialogue',
        text: chunkText,
        slashColor: currentColor,
      });
    }
  }

  return { blocks: result, lastColor: currentColor };
}

/**
 * Parses a message string containing:
 * - *action* wrapped in asterisks
 * - ||secret|| wrapped in double pipes (blurred spoiler / secret)
 * - (off-rol text) wrapped in parentheses → displayed in a muted off-rol style
 * - / to ///// slash character voices (colors)
 * - plain spoken dialogues
 * Example: "*te mira* / Hola cariño // ¿Quién eres tú? (off-rol: ya voy)"
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
  let activeSlashColor: 1 | 2 | 3 | 4 | 5 | undefined = undefined;

  while ((match = tokenRegex.exec(rawContent)) !== null) {
    // Text before this token → dialogue
    if (match.index > lastIndex) {
      const dialogueText = rawContent.slice(lastIndex, match.index);
      if (dialogueText.trim()) {
        const { blocks: dialogueBlocks, lastColor } = parseDialogueWithSlashes(
          dialogueText,
          activeSlashColor
        );
        blocks.push(...dialogueBlocks);
        activeSlashColor = lastColor;
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

  // Trailing dialogue after the last special token
  if (lastIndex < rawContent.length) {
    const trailingDialogue = rawContent.slice(lastIndex);
    if (trailingDialogue.trim()) {
      const { blocks: dialogueBlocks } = parseDialogueWithSlashes(
        trailingDialogue,
        activeSlashColor
      );
      blocks.push(...dialogueBlocks);
    }
  }

  // Fallback: if nothing matched, treat whole string as dialogue
  if (blocks.length === 0 && rawContent.trim()) {
    const { blocks: dialogueBlocks } = parseDialogueWithSlashes(rawContent.trim());
    if (dialogueBlocks.length > 0) {
      blocks.push(...dialogueBlocks);
    } else {
      blocks.push({ type: 'dialogue', text: rawContent.trim() });
    }
  }

  return blocks;
}
