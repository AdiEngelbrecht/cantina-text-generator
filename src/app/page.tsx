'use client';

import React, {useCallback, useReducer} from 'react';
import {
  DEFAULT_PROPS,
  type ConversationProps,
  type HookClip,
  type Message,
  type Sender,
  type Tapback,
  type VideoTheme,
} from '../lib/types';
import {PRESETS, type Preset} from '../lib/presets';
import {UploadSection} from '../components/UploadSection';
import {HookSection} from '../components/HookSection';
import {ConversationEditor} from '../components/ConversationEditor';
import {ContactSection} from '../components/ContactSection';
import {SoundPicker} from '../components/SoundPicker';
import {PreviewPanel} from '../components/PreviewPanel';
import {RenderPanel} from '../components/RenderPanel';

type Action =
  | {type: 'addMessage'; sender: Sender}
  | {type: 'updateText'; id: string; text: string}
  | {type: 'toggleSender'; id: string}
  | {type: 'deleteMessage'; id: string}
  | {type: 'reorderMessage'; id: string; targetIndex: number}
  | {type: 'setReaction'; id: string; reaction: Tapback | undefined}
  | {type: 'setVideo'; src: string; durationSec: number}
  | {type: 'setHook'; hook: HookClip | undefined}
  | {type: 'setContactName'; name: string}
  | {type: 'setTheme'; theme: VideoTheme}
  | {type: 'setSound'; sound: string}
  | {type: 'applyPreset'; preset: Preset};

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const reducer = (state: ConversationProps, action: Action): ConversationProps => {
  switch (action.type) {
    case 'addMessage':
      return {
        ...state,
        messages: [
          ...state.messages,
          {id: newId(), kind: 'text', sender: action.sender, text: ''},
        ],
      };
    case 'updateText':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id && m.kind === 'text' ? {...m, text: action.text} : m,
        ),
      };
    case 'toggleSender':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? {...m, sender: m.sender === 'me' ? ('them' as const) : ('me' as const)}
            : m,
        ),
      };
    case 'deleteMessage':
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.id),
      };
    case 'reorderMessage': {
      const from = state.messages.findIndex((m) => m.id === action.id);
      if (from < 0) return state;
      // targetIndex is an insertion index in the list AFTER the dragged
      // message has been removed.
      const to = Math.max(
        0,
        Math.min(action.targetIndex, state.messages.length - 1),
      );
      const messages = state.messages.filter((m) => m.id !== action.id);
      messages.splice(to, 0, state.messages[from]);
      return {...state, messages};
    }
    case 'setReaction':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? {...m, reaction: action.reaction} : m,
        ),
      };
    case 'setVideo': {
      // Only one Cantina video per conversation: replace in place if present,
      // otherwise append at the end.
      const video: Message = {
        id: newId(),
        kind: 'video',
        sender: 'them',
        src: action.src,
        durationSec: action.durationSec,
      };
      const existingIndex = state.messages.findIndex((m) => m.kind === 'video');
      if (existingIndex >= 0) {
        const messages = [...state.messages];
        messages[existingIndex] = {...video, sender: state.messages[existingIndex].sender};
        return {...state, messages};
      }
      return {...state, messages: [...state.messages, video]};
    }
    case 'setContactName':
      return {...state, contactName: action.name};
    case 'setHook':
      return {...state, hook: action.hook};
    case 'setTheme':
      return {...state, theme: action.theme};
    case 'setSound':
      return {...state, sound: action.sound};
    case 'applyPreset': {
      const presetMessages = Array.isArray(action.preset.messages)
        ? action.preset.messages
        : [];
      // Fresh ids so applying the same preset twice never collides with existing keys.
      const messages = presetMessages.map((m) => ({...m, id: newId()}));
      const contactName = action.preset.contactName ?? state.contactName;
      return {...state, messages, contactName};
    }
    default:
      return state;
  }
};

export default function Home() {
  const [props, dispatch] = useReducer(reducer, DEFAULT_PROPS);

  const handleVideoReady = useCallback(
    (src: string, durationSec: number) =>
      dispatch({type: 'setVideo', src, durationSec}),
    [],
  );

  const hasVideo = props.messages.some((m) => m.kind === 'video');

  return (
    <main className="page">
      <header className="page-header">
        <div className="brand-lockup">
          <img
            src="/brand/clipfarm-logo.png"
            alt="ClipFarm"
            className="brand-logo brand-logo--clipfarm"
          />
          <span className="brand-x">×</span>
          <img
            src="/brand/cantina-logo.jpg"
            alt="Cantina"
            className="brand-logo brand-logo--cantina"
          />
        </div>
        <h1>
          <span className="brand-word">Cantina</span> Generator
        </h1>
        <p>Fake text conversation videos for the Cantina campaign — by ClipFarm.</p>
      </header>

      <div className="page-grid">
        <div className="editor-column">
          <UploadSection onVideoReady={handleVideoReady} hasVideo={hasVideo} />

          <HookSection
            hook={props.hook}
            setHook={(hook) => dispatch({type: 'setHook', hook})}
          />

          <ConversationEditor
            messages={props.messages}
            presets={PRESETS}
            onAdd={(sender) => dispatch({type: 'addMessage', sender})}
            onUpdateText={(id, text) => dispatch({type: 'updateText', id, text})}
            onToggleSender={(id) => dispatch({type: 'toggleSender', id})}
            onDelete={(id) => dispatch({type: 'deleteMessage', id})}
            onReorder={(id, targetIndex) =>
              dispatch({type: 'reorderMessage', id, targetIndex})
            }
            onSetReaction={(id, reaction) =>
              dispatch({type: 'setReaction', id, reaction})
            }
            onApplyPreset={(preset) => dispatch({type: 'applyPreset', preset})}
          />

          <ContactSection
            contactName={props.contactName}
            theme={props.theme}
            onContactNameChange={(name) => dispatch({type: 'setContactName', name})}
            onThemeChange={(theme) => dispatch({type: 'setTheme', theme})}
          />

          <SoundPicker
            sound={props.sound}
            onSoundChange={(sound) => dispatch({type: 'setSound', sound})}
          />

          <RenderPanel props={props} />
        </div>

        <PreviewPanel props={props} />
      </div>
    </main>
  );
}
