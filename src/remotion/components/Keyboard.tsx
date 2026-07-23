import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ME_FRAMES_PER_CHAR} from '../../lib/timing';
import type {VideoTheme} from '../../lib/types';

/**
 * Contract between the video engine and the keyboard component.
 * The keyboard agent owns this file and may restyle freely, but must
 * keep this exact props signature.
 */
export type KeyboardProps = {
  theme: VideoTheme;
  /** Full text of the `me` message currently being typed, or null when idle. */
  typingText: string | null;
  /** Composition frame at which typing of `typingText` started. */
  typingStartFrame: number | null;
  /** Total frames over which `typingText` is typed (per-char cadence in timing.ts). */
  typingFrames: number;
  /** Frames per character; defaults to ME_FRAMES_PER_CHAR. Pass the
   *  typingSpeed-scaled cadence so typing matches the timeline. */
  perCharFrames?: number;
};

type ThemeColors = {
  keyboardBg: string;
  key: string;
  keyPressed: string;
  specialKey: string;
  specialKeyPressed: string;
  keyText: string;
  barBg: string;
  fieldBorder: string;
  fieldText: string;
  placeholder: string;
  caret: string;
  sendBlue: string;
  plusBg: string;
  homeBar: string;
};

const THEMES: Record<VideoTheme, ThemeColors> = {
  dark: {
    keyboardBg: '#1c1c1e',
    key: '#4a4a4c',
    keyPressed: '#636366',
    specialKey: '#3a3a3c',
    specialKeyPressed: '#545456',
    keyText: '#ffffff',
    barBg: '#1c1c1e',
    fieldBorder: '#3a3a3c',
    fieldText: '#ffffff',
    placeholder: '#8e8e93',
    caret: '#0a84ff',
    sendBlue: '#0a84ff',
    plusBg: '#3a3a3c',
    homeBar: '#8e8e93',
  },
  light: {
    keyboardBg: '#d2d5db',
    key: '#ffffff',
    keyPressed: '#e2e2e7',
    specialKey: '#acb3bd',
    specialKeyPressed: '#99a1ab',
    keyText: '#000000',
    barBg: '#f6f6f6',
    fieldBorder: '#c7c7cc',
    fieldText: '#000000',
    placeholder: '#8e8e93',
    caret: '#007aff',
    sendBlue: '#007aff',
    plusBg: '#e9e9eb',
    homeBar: '#aeaeb2',
  },
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

const ROW_1 = 'qwertyuiop'.split('');
const ROW_2 = 'asdfghjkl'.split('');
const ROW_3 = 'zxcvbnm'.split('');

const KEY_HEIGHT = 108;
const KEY_GAP = 10;
const KEY_RADIUS = 12;
const LETTER_SIZE = 58;

/**
 * Split text into grapheme clusters so multi-code-unit emoji (surrogate
 * pairs, ZWJ sequences) are never sliced in half mid-typing.
 */
const graphemeSegmenter = new Intl.Segmenter('en', {granularity: 'grapheme'});
const toGraphemes = (text: string): string[] =>
  Array.from(graphemeSegmenter.segment(text), (part) => part.segment);

// ---------------------------------------------------------------------------
// Icons (inline SVG, sized to the 1080px canvas)
// ---------------------------------------------------------------------------

const iconStyle = (color: string): React.CSSProperties => ({
  stroke: color,
  fill: 'none',
  strokeWidth: 5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

const PlusIcon: React.FC<{color: string}> = ({color}) => (
  <svg width="44" height="44" viewBox="0 0 44 44" style={iconStyle(color)}>
    <line x1="22" y1="10" x2="22" y2="34" />
    <line x1="10" y1="22" x2="34" y2="22" />
  </svg>
);

const MicIcon: React.FC<{color: string; size?: number}> = ({color, size = 40}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={iconStyle(color)}>
    <rect x="14" y="5" width="12" height="20" rx="6" />
    <path d="M8 19 a12 12 0 0 0 24 0" />
    <line x1="20" y1="31" x2="20" y2="36" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" style={iconStyle('#ffffff')}>
    <line x1="20" y1="32" x2="20" y2="9" />
    <polyline points="9 20 20 9 31 20" />
  </svg>
);

const ShiftIcon: React.FC<{color: string; active: boolean}> = ({color, active}) => (
  <svg width="52" height="52" viewBox="0 0 52 52">
    <path
      d="M26 8 L44 28 H34 V42 H18 V28 H8 Z"
      fill={active ? color : 'none'}
      stroke={color}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </svg>
);

const BackspaceIcon: React.FC<{color: string}> = ({color}) => (
  <svg width="58" height="58" viewBox="0 0 58 58" style={iconStyle(color)}>
    <path d="M20 12 H46 a4 4 0 0 1 4 4 V42 a4 4 0 0 1 -4 4 H20 L7 29 Z" />
    <line x1="24" y1="22" x2="38" y2="36" />
    <line x1="38" y1="22" x2="24" y2="36" />
  </svg>
);

const EmojiIcon: React.FC<{color: string}> = ({color}) => (
  <svg width="48" height="48" viewBox="0 0 48 48" style={iconStyle(color)}>
    <circle cx="24" cy="24" r="19" />
    <circle cx="17.5" cy="19" r="1.6" fill={color} stroke="none" />
    <circle cx="30.5" cy="19" r="1.6" fill={color} stroke="none" />
    <path d="M15 29 a10 10 0 0 0 18 0" />
  </svg>
);

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

type KeySlotProps = {
  flex: number;
  children: React.ReactNode;
};

/** Fixed-size slot in a keyboard row; the key inside may scale when pressed. */
const KeySlot: React.FC<KeySlotProps> = ({flex, children}) => (
  <div
    style={{
      flex,
      height: KEY_HEIGHT,
      position: 'relative',
      display: 'flex',
    }}
  >
    {children}
  </div>
);

type LetterKeyProps = {
  letter: string;
  flex: number;
  pressed: boolean;
  /** The actual character typed (may be uppercase) for the popup. */
  popupChar: string | null;
  colors: ThemeColors;
};

const LetterKey: React.FC<LetterKeyProps> = ({
  letter,
  flex,
  pressed,
  popupChar,
  colors,
}) => (
  <KeySlot flex={flex}>
    {popupChar !== null ? (
      // iOS-style key popup: enlarged letter in a bubble above the key
      <div
        style={{
          position: 'absolute',
          bottom: KEY_HEIGHT + 4,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            minWidth: 116,
            height: 128,
            borderRadius: 16,
            backgroundColor: colors.key,
            color: colors.keyText,
            fontFamily: FONT,
            fontSize: 84,
            fontWeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          {popupChar}
        </div>
        {/* Tail merging the bubble into the key below */}
        <div
          style={{
            width: 52,
            height: 26,
            marginTop: -6,
            backgroundColor: colors.key,
            borderRadius: '0 0 14px 14px',
          }}
        />
      </div>
    ) : null}
    <div
      style={{
        flex: 1,
        height: '100%',
        borderRadius: KEY_RADIUS,
        backgroundColor: pressed ? colors.keyPressed : colors.key,
        color: colors.keyText,
        fontFamily: FONT,
        fontSize: LETTER_SIZE,
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: pressed ? 'scale(0.92)' : 'none',
        boxShadow: '0 2px 0 rgba(0,0,0,0.25)',
      }}
    >
      {letter}
    </div>
  </KeySlot>
);

type SpecialKeyProps = {
  flex: number;
  pressed?: boolean;
  colors: ThemeColors;
  children: React.ReactNode;
  fontSize?: number;
};

const SpecialKey: React.FC<SpecialKeyProps> = ({
  flex,
  pressed = false,
  colors,
  children,
  fontSize = 40,
}) => (
  <KeySlot flex={flex}>
    <div
      style={{
        flex: 1,
        height: '100%',
        borderRadius: KEY_RADIUS,
        backgroundColor: pressed ? colors.specialKeyPressed : colors.specialKey,
        color: colors.keyText,
        fontFamily: FONT,
        fontSize,
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: pressed ? 'scale(0.92)' : 'none',
        boxShadow: '0 2px 0 rgba(0,0,0,0.25)',
      }}
    >
      {children}
    </div>
  </KeySlot>
);

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

export const Keyboard: React.FC<KeyboardProps> = ({
  theme,
  typingText,
  typingStartFrame,
  typingFrames,
  perCharFrames = ME_FRAMES_PER_CHAR,
}) => {
  const frame = useCurrentFrame();
  const colors = THEMES[theme];

  const isTyping = typingText !== null && typingStartFrame !== null;

  // Raw character count from the timing contract; may overshoot while the
  // compositor holds before the bubble sends, so clamp for display.
  const rawCount = isTyping
    ? Math.floor((frame - (typingStartFrame as number)) / perCharFrames) + 1
    : 0;
  const withinWindow = isTyping && frame - (typingStartFrame as number) < typingFrames;
  // Reveal per grapheme cluster, not per UTF-16 code unit, so emoji never
  // render as broken half-glyphs while being typed.
  const graphemes = isTyping ? toGraphemes(typingText as string) : [];
  const charCount = Math.min(Math.max(rawCount, 0), graphemes.length);
  const shownText = graphemes.slice(0, charCount).join('');

  // The grapheme whose key is down this frame (null when idle / between chars).
  const pressedChar =
    isTyping && withinWindow && rawCount >= 1 && rawCount <= graphemes.length
      ? graphemes[rawCount - 1]
      : null;
  const pressedLetter =
    pressedChar !== null && /[a-z]/i.test(pressedChar)
      ? pressedChar.toLowerCase()
      : null;
  const shiftActive =
    pressedChar !== null &&
    /[a-z]/i.test(pressedChar) &&
    pressedChar === pressedChar.toUpperCase();

  // Blinking caret (~0.53s period at 30fps), only while a message is in progress.
  const caretVisible = isTyping && Math.floor(frame / 16) % 2 === 0;

  const letterKey = (letter: string, flex = 1) => {
    const pressed = pressedLetter === letter;
    return (
      <LetterKey
        key={letter}
        letter={letter}
        flex={flex}
        pressed={pressed}
        popupChar={pressed ? (pressedChar as string) : null}
        colors={colors}
      />
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        fontFamily: FONT,
        userSelect: 'none',
      }}
    >
      {/* ------- iMessage input bar ------- */}
      <div
        style={{
          height: 110,
          backgroundColor: colors.barBg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 18,
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            backgroundColor: colors.plusBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <PlusIcon color={colors.keyText} />
        </div>
        <div
          style={{
            flex: 1,
            height: 76,
            borderRadius: 38,
            border: `3px solid ${colors.fieldBorder}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 30px',
            fontSize: 44,
            color: colors.fieldText,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {shownText.length > 0 ? (
            <>
              <span>{shownText}</span>
              <div
                style={{
                  width: 4,
                  height: 48,
                  marginLeft: 3,
                  borderRadius: 2,
                  backgroundColor: colors.caret,
                  opacity: caretVisible ? 1 : 0,
                  flexShrink: 0,
                }}
              />
            </>
          ) : isTyping ? (
            <div
              style={{
                width: 4,
                height: 48,
                borderRadius: 2,
                backgroundColor: colors.caret,
                opacity: caretVisible ? 1 : 0,
                flexShrink: 0,
              }}
            />
          ) : (
            <span style={{color: colors.placeholder}}>iMessage</span>
          )}
        </div>
        {shownText.length > 0 ? (
          // iOS swaps the mic for a blue send button once text exists
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              backgroundColor: colors.sendBlue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SendIcon />
          </div>
        ) : (
          <div
            style={{
              width: 76,
              height: 76,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MicIcon color={colors.placeholder} size={48} />
          </div>
        )}
      </div>

      {/* ------- Keyboard body ------- */}
      <div
        style={{
          backgroundColor: colors.keyboardBg,
          padding: `${KEY_GAP}px 8px 0`,
        }}
      >
        {/* Row 1: qwertyuiop */}
        <div style={{display: 'flex', gap: KEY_GAP, marginBottom: KEY_GAP}}>
          {ROW_1.map((l) => letterKey(l))}
        </div>
        {/* Row 2: asdfghjkl (inset) */}
        <div
          style={{
            display: 'flex',
            gap: KEY_GAP,
            marginBottom: KEY_GAP,
            padding: '0 26px',
          }}
        >
          {ROW_2.map((l) => letterKey(l))}
        </div>
        {/* Row 3: shift + zxcvbnm + backspace */}
        <div style={{display: 'flex', gap: KEY_GAP, marginBottom: KEY_GAP}}>
          <SpecialKey flex={1.45} pressed={shiftActive} colors={colors}>
            <ShiftIcon color={colors.keyText} active={shiftActive} />
          </SpecialKey>
          {ROW_3.map((l) => letterKey(l))}
          <SpecialKey flex={1.45} colors={colors}>
            <BackspaceIcon color={colors.keyText} />
          </SpecialKey>
        </div>
        {/* Bottom row: 123 / space / return */}
        <div style={{display: 'flex', gap: KEY_GAP}}>
          <SpecialKey flex={1.7} colors={colors} fontSize={42}>
            123
          </SpecialKey>
          <KeySlot flex={5}>
            <div
              style={{
                flex: 1,
                height: '100%',
                borderRadius: KEY_RADIUS,
                backgroundColor:
                  pressedChar === ' ' ? colors.keyPressed : colors.key,
                transform: pressedChar === ' ' ? 'scale(0.98)' : 'none',
                boxShadow: '0 2px 0 rgba(0,0,0,0.25)',
              }}
            />
          </KeySlot>
          <SpecialKey flex={1.7} colors={colors} fontSize={42}>
            return
          </SpecialKey>
        </div>

        {/* Home-indicator area: emoji + mic, home bar centered */}
        <div
          style={{
            height: 84,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 44px',
          }}
        >
          <EmojiIcon color={colors.placeholder} />
          <MicIcon color={colors.placeholder} size={44} />
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 360,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.homeBar,
            }}
          />
        </div>
      </div>
    </div>
  );
};
