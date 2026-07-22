'use client';

import React from 'react';
import type {VideoTheme} from '../lib/types';

type Props = {
  contactName: string;
  theme: VideoTheme;
  onContactNameChange: (name: string) => void;
  onThemeChange: (theme: VideoTheme) => void;
};

export const ContactSection: React.FC<Props> = ({
  contactName,
  theme,
  onContactNameChange,
  onThemeChange,
}) => {
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
