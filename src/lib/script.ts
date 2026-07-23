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
 *   [photoN]       → placeholder image bubble from them for media slot N (1–10);
 *                    the integrator resolves it against `mediaSlots` into a real
 *                    image or video message, and drops it when slot N is empty
 *   [photoN:me]    → same, but sent from me
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

/** `[photoN]` / `[photoN:me]` on its own line, case-insensitive. */
const PHOTO_LINE = /^\[photo(\d{1,2})(:me)?\]$/i;

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
      const photo = PHOTO_LINE.exec(line);
      if (photo) {
        const slot = Number(photo[1]);
        if (slot < 1 || slot > 10) {
          messages.push({id: newId(), kind: 'text', sender: 'them', text: line});
          warnings.push(
            `Line ${lineNo}: [photo${slot}] out of range (1–10) — treated as "them:" text.`,
          );
        } else {
          // Placeholder: page.tsx resolves this against mediaSlots[N] into a
          // real image or video message; dropped when the slot is empty.
          messages.push({
            id: newId(),
            kind: 'image',
            sender: photo[2] ? 'me' : 'them',
            src: '',
            slot,
          });
        }
      } else {
        messages.push({id: newId(), kind: 'text', sender: 'them', text: line});
        warnings.push(`Line ${lineNo}: no known prefix — treated as "them:" text.`);
      }
    }
  });

  return {messages, warnings};
};

/**
 * Inverse of parseScript: slot message → `[photoN]` / `[photoN:me]`,
 * slot-less video → `[video]`, reaction → `react:` line after its message.
 * Slot-less images cannot round-trip (their src would be lost) and are dropped.
 */
export const messagesToScript = (messages: Message[]): string =>
  messages
    .map((message): string | null => {
      let first: string;
      if (message.kind !== 'text' && message.slot !== undefined) {
        first = `[photo${message.slot}${message.sender === 'me' ? ':me' : ''}]`;
      } else if (message.kind === 'video') {
        first = '[video]';
      } else if (message.kind === 'text') {
        first = `${message.sender}: ${message.text}`;
      } else {
        return null;
      }
      return message.reaction
        ? `${first}\nreact: ${EMOJI_BY_TAPBACK[message.reaction]}`
        : first;
    })
    .filter((line): line is string => line !== null)
    .join('\n');
