/**
 * Shared contract for the Cantina fake-text video generator.
 *
 * These types are the single source of truth. The Remotion composition,
 * the web editor UI, and the render API all build against them.
 * DO NOT change these without updating every consumer.
 */

export type Sender = 'me' | 'them';

/** iMessage Tapback reactions, attached to any message. */
export type Tapback =
  | 'love' // ❤️ heart
  | 'like' // 👍 thumbs up
  | 'dislike' // 👎 thumbs down
  | 'laugh' // 😂 haha
  | 'emphasize' // ‼️
  | 'question'; // ❓

export type TextMessage = {
  id: string;
  kind: 'text';
  sender: Sender;
  text: string;
  /** Optional Tapback badge shown on the bubble. */
  reaction?: Tapback;
};

/** The Cantina response video, embedded in the chat as a video bubble. */
export type VideoMessage = {
  id: string;
  kind: 'video';
  sender: Sender;
  /** API URL path, e.g. `/api/uploads/abc123.mp4` */
  src: string;
  /** Duration in seconds, measured client-side at upload time. */
  durationSec: number;
  /** Optional Tapback badge shown on the bubble. */
  reaction?: Tapback;
};

export type Message = TextMessage | VideoMessage;

export type VideoTheme = 'dark' | 'light';

/**
 * Optional hook clip that plays BEFORE the chat: a short reaction video
 * (e.g. girl crying, captioned in CapCut beforehand).
 */
export type HookClip = {
  /** URL path, e.g. `/hooks/crying-1.mp4` (static) or `/api/uploads/abc.mp4` (temp) */
  src: string;
  /** Duration in seconds, measured client-side at selection/upload time. */
  durationSec: number;
  /**
   * Trim window into the source clip, in seconds.
   * Defaults: trimStartSec 0, trimEndSec = durationSec.
   * The composition plays [trimStartSec, trimEndSec), capped by HOOK_MAX_SECONDS.
   */
  trimStartSec?: number;
  trimEndSec?: number;
};

/** Root props for the `ConversationVideo` composition and the render API. */
export type ConversationProps = {
  contactName: string;
  messages: Message[];
  /** Sound filename under `public/sounds/`, e.g. `gymnopedie-piano.mp3`, or `none`. */
  sound: string;
  theme: VideoTheme;
  /** Optional hook clip shown before the conversation. */
  hook?: HookClip;
};

export const DEFAULT_PROPS: ConversationProps = {
  contactName: 'Mom',
  sound: 'gymnopedie-piano.mp3',
  theme: 'dark',
  messages: [
    {id: 'm1', kind: 'text', sender: 'me', text: 'mom'},
    {id: 'm2', kind: 'text', sender: 'me', text: 'MOM'},
    {id: 'm3', kind: 'text', sender: 'them', text: 'What is it'},
    {id: 'm4', kind: 'text', sender: 'me', text: 'the dog died'},
    {id: 'm5', kind: 'text', sender: 'them', text: 'WHAT'},
    {id: 'm6', kind: 'text', sender: 'them', text: 'are you serious right now'},
    {
      id: 'm7',
      kind: 'video',
      sender: 'them',
      src: '/sample/cantina-response.mp4',
      durationSec: 6,
    },
    {id: 'm8', kind: 'text', sender: 'them', text: 'he sent you this'},
  ],
};
