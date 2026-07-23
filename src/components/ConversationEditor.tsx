'use client';

import React, {useEffect, useState} from 'react';
import type {MediaSlot, Message, Sender, Tapback} from '../lib/types';
import type {Preset} from '../lib/presets';
import {messagesToScript, parseScript} from '../lib/script';
import {MediaSlots} from './MediaSlotsSection';

type Props = {
  messages: Message[];
  presets: Preset[];
  onAdd: (sender: Sender) => void;
  onUpdateText: (id: string, text: string) => void;
  onToggleSender: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, targetIndex: number) => void;
  onSetReaction: (id: string, reaction: Tapback | undefined) => void;
  onApplyPreset: (preset: Preset) => void;
  /** Paste mode: replace the whole conversation with parsed script messages. */
  onReplaceMessages: (messages: Message[]) => void;
  /** Uploaded files per script slot ([photo1]–[photo10]). */
  mediaSlots: Record<number, MediaSlot>;
  /** Set or clear (undefined) the file for a photo/video slot. */
  onSetMediaSlot: (n: number, slot: MediaSlot | undefined) => void;
};

const DND_MIME = 'application/x-cantina-message';

/** Most-used iPhone emoji, shown in the per-message picker. */
const EMOJIS = [
  '😭', '💀', '❤️', '😂', '🔥', '🥺', '😳', '🙏',
  '😤', '🤯', '😈', '👻', '🐶', '🐱', '💔', '✨',
  '😅', '🤣', '😡', '🥰', '😬', '🫠', '👀', '💅',
  '🙄', '😴', '🤢', '🥳', '😇', '🤡', '👑', '🍕',
  '🚨', '⚠️', '❓', '‼️', '👍', '👎', '🙌', '👏',
  '😢', '😱', '🤗', '😉', '😐', '🤞', '💯', '🎉',
];

/** The six iOS Tapbacks, in the order iOS shows them. */
const TAPBACKS: {id: Tapback; emoji: string; label: string}[] = [
  {id: 'love', emoji: '❤️', label: 'Love'},
  {id: 'like', emoji: '👍', label: 'Like'},
  {id: 'dislike', emoji: '👎', label: 'Dislike'},
  {id: 'laugh', emoji: '😂', label: 'Haha'},
  {id: 'emphasize', emoji: '‼️', label: 'Emphasize'},
  {id: 'question', emoji: '❓', label: 'Question'},
];

const TAPBACK_EMOJI: Record<Tapback, string> = Object.fromEntries(
  TAPBACKS.map((t) => [t.id, t.emoji]),
) as Record<Tapback, string>;

type OpenPicker = {messageId: string; kind: 'emoji' | 'react'} | null;

export const ConversationEditor: React.FC<Props> = ({
  messages,
  presets,
  onAdd,
  onUpdateText,
  onToggleSender,
  onDelete,
  onReorder,
  onSetReaction,
  onApplyPreset,
  onReplaceMessages,
  mediaSlots,
  onSetMediaSlot,
}) => {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [mode, setMode] = useState<'builder' | 'paste'>('builder');
  const [scriptText, setScriptText] = useState('');
  const [scriptWarnings, setScriptWarnings] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  // Insertion index in the CURRENT list (before the dragged row is removed).
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  // Which emoji/reaction popover is open (only one at a time).
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  // Close the open popover on outside click or Escape.
  useEffect(() => {
    if (!openPicker) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.picker-root')) {
        setOpenPicker(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPicker(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openPicker]);

  const togglePicker = (messageId: string, kind: 'emoji' | 'react') => {
    setOpenPicker((prev) =>
      prev && prev.messageId === messageId && prev.kind === kind
        ? null
        : {messageId, kind},
    );
  };

  const endDrag = () => {
    setDragId(null);
    setDropIndex(null);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    message: Message,
  ) => {
    setDragId(message.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DND_MIME, message.id);
    // Ghost image: the whole chat row, not just the handle.
    const row = e.currentTarget.closest('li');
    if (row) e.dataTransfer.setDragImage(row, 24, 24);
  };

  const handleRowDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setDropIndex(before ? index : index + 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DND_MIME) || dragId;
    if (id && dropIndex !== null) {
      const from = messages.findIndex((m) => m.id === id);
      if (from >= 0) {
        // Adjust for the dragged row leaving the list before insertion.
        const targetIndex = dropIndex > from ? dropIndex - 1 : dropIndex;
        if (targetIndex !== from) onReorder(id, targetIndex);
      }
    }
    endDrag();
  };

  const indicatorAt = (index: number) =>
    dragId && dropIndex === index ? (
      <li key={`drop-${index}`} className="drop-indicator" aria-hidden />
    ) : null;

  const handleLoadScript = () => {
    const parsed = parseScript(scriptText);
    onReplaceMessages(parsed.messages);
    setScriptWarnings(parsed.warnings);
    setMode('builder');
  };

  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">3</span>
        <div>
          <h2>Fake conversation</h2>
          <p>
            Type in the bubbles. Drag ⠿ to reorder · click a me/them tag to flip
            sides.
          </p>
        </div>
      </header>

      <div
        className="preset-chips"
        role="tablist"
        aria-label="Conversation input mode"
        style={{marginBottom: 10}}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'builder'}
          className={`chip${mode === 'builder' ? ' chip--active' : ''}`}
          onClick={() => setMode('builder')}
        >
          Chat builder
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paste'}
          className={`chip${mode === 'paste' ? ' chip--active' : ''}`}
          onClick={() => setMode('paste')}
        >
          Paste script
        </button>
      </div>

      {scriptWarnings.length > 0 ? (
        <p className="section-note error" style={{marginTop: 0, marginBottom: 10}}>
          Script loaded with {scriptWarnings.length} warning
          {scriptWarnings.length === 1 ? '' : 's'}: {scriptWarnings.join(' · ')}
        </p>
      ) : null}

      {mode === 'paste' ? (
        <>
          <textarea
            className="input"
            aria-label="Conversation script"
            placeholder={
              'me: mom\nme: MOM\nthem: What is it\nme: the dog died\nthem: WHAT\nreact: ❤️\n[video]'
            }
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={12}
            style={{
              resize: 'vertical',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          />
          <div className="btn-row" style={{alignItems: 'center'}}>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!scriptText.trim()}
              onClick={handleLoadScript}
            >
              Load script
            </button>
            <button
              type="button"
              onClick={() => setScriptText(messagesToScript(messages))}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export current convo as script
            </button>
          </div>
          <p className="section-note">
            One per line: <code>me:</code> / <code>them:</code> text,{' '}
            <code>react: ❤️</code> reacts to the previous message,{' '}
            <code>[video]</code> marks where your uploaded Cantina clip goes,{' '}
            <code>[photo1]</code>–<code>[photo10]</code> (add <code>:me</code> to
            send them yourself) drop in a media slot below.
          </p>
        </>
      ) : (
        <>
      <div className="preset-chips" role="list" aria-label="Presets">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="listitem"
            className={`chip${activePresetId === preset.id ? ' chip--active' : ''}`}
            title={preset.description}
            onClick={() => {
              setActivePresetId(preset.id);
              onApplyPreset(preset);
            }}
          >
            {preset.title}
          </button>
        ))}
      </div>

      <ul
        className="chat-canvas"
        onDragOver={(e) => {
          if (dragId) e.preventDefault();
        }}
        onDrop={handleDrop}
      >
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {indicatorAt(index)}
            <li
              className={[
                'chat-row',
                `chat-row--${message.sender}`,
                dragId === message.id ? 'chat-row--dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onDragOver={(e) => handleRowDragOver(e, index)}
              onDrop={handleDrop}
            >
              <button
                type="button"
                className="drag-handle"
                aria-label="Drag to reorder"
                title="Drag to reorder"
                draggable
                onDragStart={(e) => handleDragStart(e, message)}
                onDragEnd={endDrag}
              >
                ⠿
              </button>

              <div className="bubble-wrap">
                <div className="bubble-anchor">
                  {message.kind === 'video' ? (
                    <div className="video-card">
                      <span className="video-card-icon">▶</span>
                      <div className="video-card-body">
                        <strong>
                          {message.slot ? `Video ${message.slot}` : 'Cantina video'}
                        </strong>
                        <span>{message.durationSec.toFixed(1)}s</span>
                      </div>
                    </div>
                  ) : message.kind === 'image' ? (
                    <div className="video-card">
                      <span className="video-card-icon">
                        {message.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={message.src}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 10,
                            }}
                          />
                        ) : (
                          '🖼'
                        )}
                      </span>
                      <div className="video-card-body">
                        <strong>
                          {message.slot ? `Photo ${message.slot}` : 'Photo'}
                        </strong>
                        <span>
                          {message.slot ? `[photo${message.slot}]` : 'image'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <input
                      className={`bubble bubble--${message.sender}`}
                      value={message.text}
                      placeholder="Message text…"
                      size={Math.max(message.text.length, 12)}
                      onChange={(e) => onUpdateText(message.id, e.target.value)}
                    />
                  )}
                  {message.reaction ? (
                    <span
                      className="reaction-badge"
                      title={`Tapback: ${message.reaction}`}
                    >
                      {TAPBACK_EMOJI[message.reaction]}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={`sender-tag sender-tag--${message.sender}`}
                  title="Click to flip sender"
                  onClick={() => onToggleSender(message.id)}
                >
                  {message.sender}
                </button>
              </div>

              {message.kind === 'text' ? (
                <span className="picker-root">
                  <button
                    type="button"
                    className="picker-toggle"
                    aria-label="Add emoji"
                    title="Add emoji"
                    onClick={() => togglePicker(message.id, 'emoji')}
                  >
                    😀
                  </button>
                  {openPicker?.messageId === message.id &&
                  openPicker.kind === 'emoji' ? (
                    <div className="picker-popover picker-popover--emoji" role="dialog" aria-label="Emoji picker">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="emoji-cell"
                          onClick={() => onUpdateText(message.id, message.text + emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </span>
              ) : null}

              <span className="picker-root">
                <button
                  type="button"
                  className="picker-toggle"
                  aria-label="Add reaction"
                  title="Add Tapback reaction"
                  onClick={() => togglePicker(message.id, 'react')}
                >
                  ♡<sup>+</sup>
                </button>
                {openPicker?.messageId === message.id &&
                openPicker.kind === 'react' ? (
                  <div className="picker-popover picker-popover--react" role="dialog" aria-label="Tapback reactions">
                    {TAPBACKS.map((tapback) => (
                      <button
                        key={tapback.id}
                        type="button"
                        className={`emoji-cell${
                          message.reaction === tapback.id ? ' emoji-cell--active' : ''
                        }`}
                        title={tapback.label}
                        aria-label={tapback.label}
                        aria-pressed={message.reaction === tapback.id}
                        onClick={() => {
                          onSetReaction(
                            message.id,
                            message.reaction === tapback.id ? undefined : tapback.id,
                          );
                          setOpenPicker(null);
                        }}
                      >
                        {tapback.emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </span>

              <button
                type="button"
                className="delete-btn"
                aria-label="Delete message"
                title="Delete message"
                onClick={() => onDelete(message.id)}
              >
                ×
              </button>
            </li>
          </React.Fragment>
        ))}
        {indicatorAt(messages.length)}
        {messages.length === 0 ? (
          <li className="section-note">No messages yet — add some below.</li>
        ) : null}
      </ul>

      <div className="btn-row">
        <button type="button" className="btn btn--blue" onClick={() => onAdd('me')}>
          + Add message (me)
        </button>
        <button type="button" className="btn btn--gray" onClick={() => onAdd('them')}>
          + Add message (them)
        </button>
      </div>

      <MediaSlots mediaSlots={mediaSlots} onSetMediaSlot={onSetMediaSlot} />
        </>
      )}
    </section>
  );
};
