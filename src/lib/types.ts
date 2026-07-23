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
  /** URL: blob: object URL or static path. */
  src: string;
  /** Duration in seconds, measured client-side at upload time. */
  durationSec: number;
  /** Optional Tapback badge shown on the bubble. */
  reaction?: Tapback;
  /** Transient (editor only): script slot [photoN] this message came from. */
  slot?: number;
};

/** A photo embedded in the chat as an image bubble. */
export type ImageMessage = {
  id: string;
  kind: 'image';
  sender: Sender;
  /** URL: blob: object URL or static path. */
  src: string;
  /** Optional Tapback badge shown on the bubble. */
  reaction?: Tapback;
  /** Transient (editor only): script slot [photoN] this message came from. */
  slot?: number;
};

export type Message = TextMessage | VideoMessage | ImageMessage;

/** An uploaded photo/video slot ([photo1]–[photo10]) in the editor. */
export type MediaSlot = {
  /** blob: object URL or static path. */
  src: string;
  kind: 'image' | 'video';
  /** Videos only; seconds, measured client-side. */
  durationSec: number;
};

export type VideoTheme = 'dark' | 'light';

/**
 * Optional hook clip that plays BEFORE the chat: a short reaction video
 * (e.g. girl crying, captioned in CapCut beforehand).
 */
export type HookClip = {
  /** URL path, e.g. `/hooks/crying-1.mp4` (static) or blob: object URL. */
  src: string;
  /** 'video' (default) or 'image' (static hook photo). */
  mediaType?: 'video' | 'image';
  /**
   * Videos: source duration in seconds (measured client-side).
   * Images: how long the still shows, seconds (default 3).
   */
  durationSec: number;
  /**
   * Videos only. When false, `customDurationSec` caps how long the hook
   * plays instead of the full trimmed window. Default true.
   */
  autoDuration?: boolean;
  /** Videos only, used when autoDuration is false. Seconds (1–HOOK_MAX_SECONDS). */
  customDurationSec?: number;
  /**
   * Trim window into the source clip, in seconds (videos only).
   * Defaults: trimStartSec 0, trimEndSec = durationSec.
   */
  trimStartSec?: number;
  trimEndSec?: number;
  /** Slow zoom target (Ken Burns) over the hook, 1–1.5. Default 1 (no zoom). */
  zoom?: number;
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
  /** Contact avatar image (object URL or static path) for the chat header. */
  avatarSrc?: string;
  /** Memoji preset avatar: emoji glyph on a colored circle. Overrides avatarSrc. */
  avatarEmoji?: string;
  /** Memoji preset avatar: circle background color (hex). */
  avatarBg?: string;
  /** Status-bar clock and read-receipt time. Default '2:57'. */
  clockTime?: string;
  /** Back-button unread count. Default: message count. */
  unreadCount?: number;
  /** Typing speed multiplier for 'me' messages (0.5–2, default 1). */
  typingSpeed?: number;
  /** Reply pacing multiplier for 'them' messages (0.5–2, default 1). */
  replyDelay?: number;
  /** iMessage send/receive blips on each message. Default true. */
  chatSounds?: boolean;
  /**
   * Editor-only: uploaded photo/video slot files referenced by `[photoN]`
   * script lines. The composition reads only `messages`; slots are resolved
   * into concrete messages by the editor.
   */
  mediaSlots?: Record<number, MediaSlot>;
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
