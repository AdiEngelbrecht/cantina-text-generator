'use client';

import React, {useRef} from 'react';
import type {VideoTheme} from '../lib/types';

type Props = {
  contactName: string;
  theme: VideoTheme;
  onContactNameChange: (name: string) => void;
  onThemeChange: (theme: VideoTheme) => void;
  /** Contact avatar image (object URL or static path) for the chat header. */
  avatarSrc?: string;
  /** Called with the new avatar object URL, or `undefined` on remove. */
  onAvatarChange?: (src: string | undefined) => void;
  /** Status-bar clock time. Empty/undefined → composition default ('2:57'). */
  clockTime?: string;
  /** Called with the typed time, or `undefined` when the field is emptied. */
  onClockTimeChange?: (time: string | undefined) => void;
  /** Back-button unread count. Undefined → defaults to the message count. */
  unreadCount?: number;
  /** Number of messages, used as the effective unread-count default. */
  messageCount?: number;
  /** Called with the stepped count, or `undefined` to restore the default. */
  onUnreadCountChange?: (n: number | undefined) => void;
};

const clampUnread = (n: number) => Math.min(99, Math.max(0, n));

export const ContactSection: React.FC<Props> = ({
  contactName,
  theme,
  onContactNameChange,
  onThemeChange,
  avatarSrc,
  onAvatarChange,
  clockTime,
  onClockTimeChange,
  unreadCount,
  messageCount = 0,
  onUnreadCountChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveUnread = clampUnread(unreadCount ?? messageCount);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    // Keep the object URL alive — the composition renders from it.
    onAvatarChange?.(URL.createObjectURL(file));
  };

  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">4</span>
        <div>
          <h2>Who&apos;s it from</h2>
          <p>The contact name shown at the top of the chat.</p>
        </div>
      </header>

      <label className="field-label" htmlFor="contact-name">
        Contact name
      </label>
      <input
        id="contact-name"
        className="input"
        value={contactName}
        placeholder="Mom"
        maxLength={40}
        onChange={(e) => onContactNameChange(e.target.value)}
      />

      <label className="field-label">Avatar (optional)</label>
      <div className="avatar-row">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar-preview" src={avatarSrc} alt="Contact avatar" />
        ) : (
          <div className="avatar-placeholder" aria-hidden="true" />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleAvatarFile}
        />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </button>
        {avatarSrc ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onAvatarChange?.(undefined)}
          >
            Remove
          </button>
        ) : null}
      </div>

      <label className="field-label" htmlFor="clock-time">
        Time shown on the phone
      </label>
      <input
        id="clock-time"
        className="input"
        value={clockTime ?? ''}
        placeholder="2:57"
        maxLength={5}
        onChange={(e) => onClockTimeChange?.(e.target.value || undefined)}
      />

      <label className="field-label">Unread count (back button)</label>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          aria-label="Decrease unread count"
          disabled={effectiveUnread <= 0}
          onClick={() => onUnreadCountChange?.(clampUnread(effectiveUnread - 1))}
        >
          −
        </button>
        <span
          className={`stepper-value${unreadCount === undefined ? ' stepper-value--dim' : ''}`}
          title={
            unreadCount === undefined
              ? 'Default: matches the message count'
              : undefined
          }
        >
          {effectiveUnread}
        </span>
        <button
          type="button"
          className="stepper-btn"
          aria-label="Increase unread count"
          disabled={effectiveUnread >= 99}
          onClick={() => onUnreadCountChange?.(clampUnread(effectiveUnread + 1))}
        >
          +
        </button>
      </div>
      {unreadCount !== undefined ? (
        <button
          type="button"
          className="btn btn--ghost stepper-reset"
          onClick={() => onUnreadCountChange?.(undefined)}
        >
          Reset to message count
        </button>
      ) : null}

      <label className="field-label">Chat theme</label>
      <div className="segmented">
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`segmented-btn${theme === t ? ' segmented-btn--active' : ''}`}
            onClick={() => onThemeChange(t)}
          >
            {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        ))}
      </div>
    </section>
  );
};
