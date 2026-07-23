/**
 * Timing contract — pure functions shared by the Remotion composition
 * (via calculateMetadata), the live preview, and the render API.
 * Everything is deterministic: same props in, same frames out.
 *
 * DO NOT change these without updating every consumer.
 */

import type {ConversationProps, Message} from './types';

export const FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

/** Frames before the first message appears. */
export const LEAD_IN = 15;
/** Typing-indicator frames shown before a `them` text message. */
export const THEM_TYPING_FRAMES = 26;
/** Frames per character while a `me` message is typed on the keyboard. */
export const ME_FRAMES_PER_CHAR = 2;
export const ME_MIN_TYPING_FRAMES = 8;
export const ME_MAX_TYPING_FRAMES = 42;
/** Pause after any text bubble lands. */
export const TEXT_HOLD_FRAMES = 20;
/** Frames between the video bubble appearing and playback starting. */
export const VIDEO_LEAD_FRAMES = 12;
/** Hold after the video finishes playing. */
export const VIDEO_TAIL_FRAMES = 40;
/** Hold at the very end of the composition. */
export const OUTRO_FRAMES = 45;
/** Cap on how much of an uploaded Cantina clip is shown. */
export const VIDEO_MAX_SECONDS = 15;
/** Cap on how much of the optional hook clip is shown before the chat. */
export const HOOK_MAX_SECONDS = 10;

/** Frames the optional hook occupies at the start of the composition. */
export const getHookFrames = (props: ConversationProps): number => {
  if (!props.hook) return 0;
  if ((props.hook.mediaType ?? 'video') === 'image') {
    return Math.round(
      Math.min(Math.max(props.hook.durationSec, 0.5), HOOK_MAX_SECONDS) * FPS,
    );
  }
  if (props.hook.autoDuration === false) {
    const custom = props.hook.customDurationSec ?? props.hook.durationSec;
    return Math.round(Math.min(Math.max(custom, 0.5), HOOK_MAX_SECONDS) * FPS);
  }
  const start = Math.max(0, props.hook.trimStartSec ?? 0);
  const end = Math.min(
    props.hook.durationSec,
    props.hook.trimEndSec ?? props.hook.durationSec,
  );
  const effective = Math.max(end - start, 0.5);
  return Math.round(Math.min(effective, HOOK_MAX_SECONDS) * FPS);
};

export type MessageTiming = {
  id: string;
  kind: Message['kind'];
  sender: Message['sender'];
  /** Frame at which the bubble pops into the chat. */
  appearFrame: number;
  /** `them` text messages: typing indicator visible [typingStartFrame, appearFrame). */
  typingStartFrame: number | null;
  /** `me` text messages: keyboard typing visible [typeStartFrame, appearFrame). */
  typeStartFrame: number | null;
  /** Video messages: frame at which the clip starts playing. */
  playFromFrame: number | null;
  /** Video messages: how many frames of the clip are shown. */
  videoDurationFrames: number | null;
};

export type Timeline = {
  totalFrames: number;
  items: MessageTiming[];
  /** Frames the hook clip occupies at the start (0 when no hook). The chat
   *  timeline in `items` is relative to AFTER hook + app scene — add
   *  `hookFrames + cantinaAppFrames` to place it absolutely. */
  hookFrames: number;
  /** Frames the Cantina app scene occupies (0 when disabled). Plays after
   *  the hook, before the chat. */
  cantinaAppFrames: number;
};

/** Typing pacing for 'me' messages, scaled by the typingSpeed multiplier. */
export const getMeTypingFrames = (text: string, typingSpeed = 1): number =>
  Math.min(
    ME_MAX_TYPING_FRAMES,
    Math.max(
      ME_MIN_TYPING_FRAMES,
      Math.round((text.length * ME_FRAMES_PER_CHAR) / Math.max(typingSpeed, 0.25)),
    ),
  );

export const getVideoDurationFrames = (durationSec: number): number =>
  Math.round(Math.min(Math.max(durationSec, 1), VIDEO_MAX_SECONDS) * FPS);

/** Seconds of lead-in before the composer appears in the Cantina app scene. */
export const CANTINA_APP_LEAD_SEC = 0.5;
/** Seconds the response reveal holds at the end of the Cantina app scene. */
export const CANTINA_APP_REVEAL_SEC = 1.5;

/** Frames the Cantina app simulation scene occupies (0 when not enabled or
 *  when there is no video message to "generate"). */
export const getCantinaAppFrames = (props: ConversationProps): number => {
  if (!props.cantinaApp) return 0;
  if (!props.messages.some((m) => m.kind === 'video')) return 0;
  const sec =
    CANTINA_APP_LEAD_SEC +
    (props.cantinaApp.typingSec ?? 3) +
    (props.cantinaApp.generatingSec ?? 4) +
    CANTINA_APP_REVEAL_SEC;
  return Math.round(sec * FPS);
};

export const getTimeline = (props: ConversationProps): Timeline => {
  const items: MessageTiming[] = [];
  const typingSpeed = props.typingSpeed ?? 1;
  const replyDelay = props.replyDelay ?? 1;
  const themTypingFrames = Math.round(THEM_TYPING_FRAMES * replyDelay);
  const textHoldFrames = Math.round(TEXT_HOLD_FRAMES * replyDelay);
  let cursor = LEAD_IN;

  for (const message of props.messages) {
    if (message.kind === 'text' && message.sender === 'them') {
      const typingStartFrame = cursor;
      const appearFrame = cursor + themTypingFrames;
      items.push({
        id: message.id,
        kind: message.kind,
        sender: message.sender,
        appearFrame,
        typingStartFrame,
        typeStartFrame: null,
        playFromFrame: null,
        videoDurationFrames: null,
      });
      cursor = appearFrame + textHoldFrames;
    } else if (message.kind === 'image' && message.sender === 'them') {
      // Photos from them also get the typing indicator first.
      const typingStartFrame = cursor;
      const appearFrame = cursor + themTypingFrames;
      items.push({
        id: message.id,
        kind: message.kind,
        sender: message.sender,
        appearFrame,
        typingStartFrame,
        typeStartFrame: null,
        playFromFrame: null,
        videoDurationFrames: null,
      });
      cursor = appearFrame + textHoldFrames;
    } else if (message.kind === 'text') {
      const typingFrames = getMeTypingFrames(message.text, typingSpeed);
      const typeStartFrame = cursor;
      const appearFrame = cursor + typingFrames;
      items.push({
        id: message.id,
        kind: message.kind,
        sender: message.sender,
        appearFrame,
        typingStartFrame: null,
        typeStartFrame,
        playFromFrame: null,
        videoDurationFrames: null,
      });
      cursor = appearFrame + textHoldFrames;
    } else if (message.kind === 'image') {
      // Photos from me appear instantly, like videos.
      const appearFrame = cursor;
      items.push({
        id: message.id,
        kind: message.kind,
        sender: message.sender,
        appearFrame,
        typingStartFrame: null,
        typeStartFrame: null,
        playFromFrame: null,
        videoDurationFrames: null,
      });
      cursor = appearFrame + textHoldFrames;
    } else {
      const videoDurationFrames = getVideoDurationFrames(message.durationSec);
      const appearFrame = cursor;
      items.push({
        id: message.id,
        kind: message.kind,
        sender: message.sender,
        appearFrame,
        typingStartFrame: null,
        typeStartFrame: null,
        playFromFrame: appearFrame + VIDEO_LEAD_FRAMES,
        videoDurationFrames,
      });
      cursor = appearFrame + VIDEO_LEAD_FRAMES + videoDurationFrames + VIDEO_TAIL_FRAMES;
    }
  }

  const prefixFrames = getHookFrames(props) + getCantinaAppFrames(props);
  return {
    totalFrames: prefixFrames + cursor + OUTRO_FRAMES,
    items,
    hookFrames: getHookFrames(props),
    cantinaAppFrames: getCantinaAppFrames(props),
  };
};
