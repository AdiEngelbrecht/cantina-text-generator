import React from 'react';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {ConversationProps, Message, VideoMessage} from '../lib/types';
import type {MessageTiming, Timeline} from '../lib/timing';
import {ME_FRAMES_PER_CHAR, getTimeline} from '../lib/timing';
import {Keyboard} from './components/Keyboard';
import {StatusBar} from './components/StatusBar';
import {ChatHeader} from './components/ChatHeader';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';
import {VideoBubble} from './components/VideoBubble';
import {TAPBACK_DELAY} from './components/Tapback';
import {HookClip} from './components/HookClip';
import {CantinaAppScene} from './components/CantinaAppScene';
import {FONT_STACK, getPalette} from './components/theme';

/** Frames after the last `me` bubble lands until the read receipt shows. */
const READ_RECEIPT_DELAY = 14;

const Entrance: React.FC<{
  localFrame: number;
  fps: number;
  sender: 'me' | 'them';
  subtle?: boolean;
  children: React.ReactNode;
}> = ({localFrame, fps, sender, subtle, children}) => {
  const pop = spring({
    frame: localFrame,
    fps,
    config: {damping: subtle ? 22 : 17, stiffness: 300, mass: 0.7},
  });
  const scale = interpolate(pop, [0, 1], [subtle ? 0.85 : 0.3, 1]);
  const opacity = interpolate(pop, [0, 1], [0, 1]);
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: sender === 'me' ? 'flex-end' : 'flex-start',
        transform: `scale(${scale})`,
        transformOrigin: sender === 'me' ? 'bottom right' : 'bottom left',
        opacity,
      }}
    >
      {children}
    </div>
  );
};

/**
 * The iMessage chat layout: status bar, header, message area, keyboard.
 * Must be rendered INSIDE a Sequence offset by `timeline.hookFrames` so that
 * `useCurrentFrame()` here returns the hook-relative local frame, matching
 * the frames in `timeline.items` directly.
 */
const ChatScene: React.FC<{props: ConversationProps; timeline: Timeline}> = ({
  props,
  timeline,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const palette = getPalette(props.theme);
  const clockTime = props.clockTime ?? '2:57';
  const chatSounds = props.chatSounds ?? true;
  const perCharFrames = Math.max(
    1,
    Math.round(ME_FRAMES_PER_CHAR / (props.typingSpeed ?? 1)),
  );

  const messages = props.messages;
  const itemsById = new Map<string, MessageTiming>(
    timeline.items.map((item) => [item.id, item]),
  );

  // Keyboard typing state: the `me` message currently being typed out.
  const activeTypingItem = timeline.items.find(
    (item) =>
      item.typeStartFrame !== null &&
      frame >= item.typeStartFrame &&
      frame < item.appearFrame,
  );
  const activeTypingMessage = activeTypingItem
    ? (messages.find(
        (m): m is Extract<Message, {kind: 'text'}> =>
          m.id === activeTypingItem.id && m.kind === 'text',
      ) ?? null)
    : null;

  // Typing indicator for the upcoming `them` text message.
  const themTypingItem = timeline.items.find(
    (item) =>
      item.typingStartFrame !== null &&
      frame >= item.typingStartFrame &&
      frame < item.appearFrame,
  );

  // Read receipt under the last-sent `me` message.
  const lastMeIndex = messages.reduce(
    (acc, m, i) => (m.sender === 'me' ? i : acc),
    -1,
  );
  const lastMeTiming =
    lastMeIndex >= 0
      ? itemsById.get(messages[lastMeIndex].id) ?? null
      : null;
  const readAt = lastMeTiming ? lastMeTiming.appearFrame + READ_RECEIPT_DELAY : null;
  const receiptOpacity =
    readAt !== null
      ? interpolate(frame, [readAt, readAt + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.background,
        fontFamily: FONT_STACK,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusBar theme={props.theme} time={clockTime} />
      <ChatHeader
        theme={props.theme}
        name={props.contactName}
        count={props.unreadCount ?? messages.length}
        avatarSrc={props.avatarSrc}
      />

      {/* Message area, anchored to the bottom of the chat zone. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 26px 26px 26px',
          overflow: 'hidden',
        }}
      >
        {messages.map((message, i) => {
          const item = itemsById.get(message.id);
          if (!item || frame < item.appearFrame) return null;
          const sameAsPrev = i > 0 && messages[i - 1].sender === message.sender;
          const showTail =
            i === messages.length - 1 ||
            messages[i + 1].sender !== message.sender;
          return (
            <div key={message.id} style={{marginTop: i === 0 ? 0 : sameAsPrev ? 6 : 22}}>
              <Entrance
                localFrame={frame - item.appearFrame}
                fps={fps}
                sender={message.sender}
                subtle={message.kind === 'video'}
              >
                {message.kind === 'text' ? (
                  <MessageBubble
                    theme={props.theme}
                    sender={message.sender}
                    text={message.text}
                    showTail={showTail}
                    reaction={message.reaction}
                    reactionLocalFrame={
                      frame - item.appearFrame - TAPBACK_DELAY
                    }
                  />
                ) : (
                  <VideoBubble
                    theme={props.theme}
                    message={message}
                    timing={item}
                    showTail={showTail}
                  />
                )}
              </Entrance>
              {i === lastMeIndex && readAt !== null && frame >= readAt ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 6,
                    marginRight: 10,
                    fontSize: 26,
                    color: palette.secondaryText,
                    opacity: receiptOpacity,
                  }}
                >
                  Read {clockTime}
                </div>
              ) : null}
            </div>
          );
        })}
        {themTypingItem ? (
          <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: 22}}>
            <TypingIndicator theme={props.theme} />
          </div>
        ) : null}
      </div>

      {/* On-screen keyboard, pinned to the bottom of the frame. The Keyboard
          renders position:absolute, so the wrapper must reserve its exact
          rendered height (input bar 110 + 4 key rows + bottom bar = 666). */}
      <div style={{position: 'relative', flexShrink: 0, height: 666}}>
        <Keyboard
          theme={props.theme}
          typingText={
            activeTypingItem && activeTypingMessage
              ? activeTypingMessage.text
              : null
          }
          typingStartFrame={activeTypingItem?.typeStartFrame ?? null}
          typingFrames={
            activeTypingItem
              ? activeTypingItem.appearFrame - (activeTypingItem.typeStartFrame ?? 0)
              : 0
          }
          perCharFrames={perCharFrames}
        />
      </div>

      {/* iMessage send/receive blips, one per message at its appear frame. */}
      {chatSounds
        ? timeline.items.map((item) =>
            item.appearFrame >= 0 ? (
              <Sequence key={item.id} from={item.appearFrame}>
                <Audio
                  src={staticFile(
                    item.sender === 'me'
                      ? 'sounds/imessage-send.wav'
                      : 'sounds/imessage-receive.wav',
                  )}
                  volume={0.5}
                />
              </Sequence>
            ) : null,
          )
        : null}
    </AbsoluteFill>
  );
};

export const ConversationVideo: React.FC<ConversationProps> = (props) => {
  const timeline = getTimeline(props);
  const chatStartFrame = timeline.hookFrames + timeline.cantinaAppFrames;
  const videoMessage = props.messages.find(
    (m): m is VideoMessage => m.kind === 'video',
  );

  return (
    <>
      {/* Optional hook clip: fullscreen reaction video (captioned in CapCut
          beforehand), occupying frames [0, hookFrames). Hard cut to chat. */}
      {props.hook && timeline.hookFrames > 0 ? (
        <Sequence durationInFrames={timeline.hookFrames}>
          <HookClip hook={props.hook} />
        </Sequence>
      ) : null}

      {/* Optional Cantina app simulation scene, after the hook, before the
          chat. useCurrentFrame() inside is scene-local. */}
      {props.cantinaApp && videoMessage && timeline.cantinaAppFrames > 0 ? (
        <Sequence
          from={timeline.hookFrames}
          durationInFrames={timeline.cantinaAppFrames}
        >
          <CantinaAppScene
            scene={props.cantinaApp}
            videoMessage={videoMessage}
            theme={props.theme}
          />
        </Sequence>
      ) : null}

      {/* Chat. The timeline items are relative to AFTER hook + app scene, so
          the whole chat layout is shifted by both; useCurrentFrame() inside
          ChatScene is local to this Sequence and matches the items directly.
          With neither, both offsets are 0 and this is the full comp. */}
      <Sequence from={chatStartFrame}>
        <ChatScene props={props} timeline={timeline} />
      </Sequence>

      {/* Soundtrack: plays from frame 0 through the whole video — under the
          hook and through the entire chat. */}
      {props.sound !== 'none' ? (
        <Audio src={staticFile(`sounds/${props.sound}`)} />
      ) : null}
    </>
  );
};
