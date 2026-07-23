/**
 * Paste-mode script parser.
 *
 * Grammar (one instruction per line, trimmed, prefix case-insensitive):
 *   me: <text>     → text message from me
 *   them: <text>   → text message from them
 *   react: <emoji> → Tapback on the PREVIOUS message
 *                    (❤️ love · 👍 like · 👎 dislike · 😂 laugh · ‼️ emphasize · ❓ question)
 *   [video]        → placeholder video bubble from them; the integrator swaps
 *                    in the real uploaded clip's src/duration at that position
 *
 * Blank lines are ignored. Unknown lines become `them:` text plus a warning.
 * Parsing never throws: problems are collected in `warnings`.
 */

import type {Message, Tapback} from './types';

export type ParsedScript = {
  messages: Message[];
  warnings: string[];
};

const TAPBACK_BY_EMOJI: Record<string, Tapback> = {
  '❤': 'love',
  '🧡': 'love',
  '👍': 'like',
  '👎': 'dislike',
  '😂': 'laugh',
  '🤣': 'laugh',
  '‼': 'emphasize',
  '❗': 'emphasize',
  '❓': 'question',
  '?': 'question',
};

const EMOJI_BY_TAPBACK: Record<Tapback, string> = {
  love: '❤️',
  like: '👍',
  dislike: '👎',
  laugh: '😂',
  emphasize: '‼️',
  question: '❓',
};

/** crypto.randomUUID() with a fallback for older/insecure contexts. */
const newId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/** Strip variation selectors so ❤️ and ❤ map the same. */
const normalizeEmoji = (raw: string): string => raw.replace(/️/g, '').trim();

export const parseScript = (text: string): ParsedScript => {
  const messages: Message[] = [];
  const warnings: string[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const lineNo = index + 1;
    const lower = line.toLowerCase();

    if (lower.startsWith('me:')) {
      const body = line.slice(3).trim();
      if (!body) {
        warnings.push(`Line ${lineNo}: "me:" with no text — skipped.`);
        return;
      }
      messages.push({id: newId(), kind: 'text', sender: 'me', text: body});
    } else if (lower.startsWith('them:')) {
      const body = line.slice(5).trim();
      if (!body) {
        warnings.push(`Line ${lineNo}: "them:" with no text — skipped.`);
        return;
      }
      messages.push({id: newId(), kind: 'text', sender: 'them', text: body});
    } else if (lower.startsWith('react:')) {
      const emoji = normalizeEmoji(line.slice(6));
      const tapback = TAPBACK_BY_EMOJI[emoji];
      const previous = messages[messages.length - 1];
      if (!previous) {
        warnings.push(`Line ${lineNo}: "react:" with no previous message — ignored.`);
      } else if (!tapback) {
        warnings.push(
          `Line ${lineNo}: no Tapback matches "${line.slice(6).trim()}" — ignored.`,
        );
      } else {
        previous.reaction = tapback;
      }
    } else if (lower === '[video]') {
      // Placeholder: page.tsx swaps in the uploaded clip's src/duration at
      // this position; the marker is dropped if there is no uploaded clip.
      messages.push({id: newId(), kind: 'video', sender: 'them', src: '', durationSec: 0});
    } else {
      messages.push({id: newId(), kind: 'text', sender: 'them', text: line});
      warnings.push(`Line ${lineNo}: no known prefix — treated as "them:" text.`);
    }
  });

  return {messages, warnings};
};

/** Inverse of parseScript: video → `[video]`, reaction → `react:` line after its message. */
export const messagesToScript = (messages: Message[]): string =>
  messages
    .map((message) => {
      const first =
        message.kind === 'video' ? '[video]' : `${message.sender}: ${message.text}`;
      return message.reaction
        ? `${first}\nreact: ${EMOJI_BY_TAPBACK[message.reaction]}`
        : first;
    })
    .join('\n');
