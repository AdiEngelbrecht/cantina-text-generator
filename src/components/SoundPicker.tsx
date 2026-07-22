'use client';

import React, {useEffect, useRef, useState} from 'react';
import {SOUNDS} from '../lib/sounds';

type Props = {
  sound: string;
  onSoundChange: (sound: string) => void;
};

const NONE = 'none';

export const SoundPicker: React.FC<Props> = ({sound, onSoundChange}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const preview = (file: string) => {
    if (playing === file) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(`/sounds/${file}`);
    audioRef.current = audio;
    setPlaying(file);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    audio.play().catch(() => setPlaying(null));
  };

  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">5</span>
        <div>
          <h2>Pick a sound</h2>
          <p>Plays through the whole video from the start, hook included.</p>
        </div>
      </header>

      <div className="sound-grid">
        <button
          type="button"
          className={`sound-chip${sound === NONE ? ' sound-chip--active' : ''}`}
          onClick={() => onSoundChange(NONE)}
        >
          <span className="sound-chip-name">None</span>
        </button>
        {SOUNDS.map((option) => (
          <div
            key={option.file}
            className={`sound-chip${sound === option.file ? ' sound-chip--active' : ''}`}
          >
            <button
              type="button"
              className="sound-chip-name"
              onClick={() => onSoundChange(option.file)}
            >
              {option.label}
            </button>
            <button
              type="button"
              className="sound-chip-play"
              aria-label={`Preview ${option.label}`}
              onClick={() => preview(option.file)}
            >
              {playing === option.file ? '⏸' : '▶'}
            </button>
          </div>
        ))}
      </div>

      <p className="section-note">
        Posting on TikTok? For a boost, attach the sound in TikTok itself from
        the original audio instead of the baked-in mp3:{' '}
        <a
          href="https://www.tiktok.com/music/Classic-classical-gymnopedie-solo-piano-1034554-6974451099088455681"
          target="_blank"
          rel="noreferrer"
        >
          Gymnopédie solo piano — original sound
        </a>
        . Posting anywhere else? The bundled &quot;Gymnopédie Piano&quot; option
        is the same audio.
      </p>
    </section>
  );
};
