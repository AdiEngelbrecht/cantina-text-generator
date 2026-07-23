'use client';

import React from 'react';
import type {MediaSlot} from '../lib/types';

type Props = {
  /** Uploaded files per script slot ([photo1]–[photo10]). */
  mediaSlots: Record<number, MediaSlot>;
  /** Set or clear (undefined) the file for slot n. */
  onSetMediaSlot: (n: number, slot: MediaSlot | undefined) => void;
};

const SLOT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Measure a video's duration client-side with a detached probe element. */
const measureVideoDuration = (src: string): Promise<number> =>
  new Promise((resolve) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.onloadedmetadata = () => resolve(probe.duration || 0);
    probe.onerror = () => resolve(0);
    probe.src = src;
  });

const styles: Record<string, React.CSSProperties> = {
  wrap: {marginTop: 14},
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 4,
  },
  note: {fontSize: 12, color: 'var(--text-dim)', margin: '0 0 10px'},
  grid: {display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8},
  tile: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: 10,
    overflow: 'hidden',
  },
  empty: {
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    border: '2px dashed var(--border)',
    borderRadius: 10,
    background: 'var(--surface-2)',
    color: 'var(--text-dim)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  media: {width: '100%', height: '100%', objectFit: 'cover', display: 'block'},
  badge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    padding: '1px 6px',
    borderRadius: 6,
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'var(--text)',
    fontSize: 10,
    fontWeight: 700,
    pointerEvents: 'none',
  },
  clear: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    display: 'grid',
    placeItems: 'center',
    border: 'none',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.65)',
    color: 'var(--text)',
    fontSize: 13,
    lineHeight: 1,
    cursor: 'pointer',
  },
};

/**
 * The 10 photo/video slots referenced by `[photoN]` script lines. Embedded
 * inside ConversationEditor's section (not a standalone editor section).
 */
export const MediaSlots: React.FC<Props> = ({mediaSlots, onSetMediaSlot}) => {
  const handleFile = async (n: number, file: File | undefined) => {
    if (!file) return;
    const kind: MediaSlot['kind'] = file.type.startsWith('video/')
      ? 'video'
      : 'image';
    const src = URL.createObjectURL(file); // kept alive for the session
    const durationSec = kind === 'video' ? await measureVideoDuration(src) : 0;
    onSetMediaSlot(n, {src, kind, durationSec});
  };

  return (
    <div style={styles.wrap}>
      <span style={styles.label}>Photos &amp; videos (photo1–photo10)</span>
      <p style={styles.note}>
        Used by <code>[photoN]</code> script lines. Click a slot to upload an
        image or video.
      </p>
      <div style={styles.grid}>
        {SLOT_NUMBERS.map((n) => {
          const slot = mediaSlots[n];
          return (
            <div key={n} style={styles.tile}>
              {slot ? (
                <>
                  {slot.kind === 'video' ? (
                    <video
                      src={slot.src}
                      style={styles.media}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => {
                        void e.currentTarget.play().catch(() => {});
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slot.src} alt={`Slot ${n}`} style={styles.media} />
                  )}
                  <span style={styles.badge}>
                    {n}
                    {slot.kind === 'video'
                      ? ` · ${slot.durationSec.toFixed(1)}s`
                      : ''}
                  </span>
                  <button
                    type="button"
                    style={styles.clear}
                    aria-label={`Clear slot ${n}`}
                    title={`Clear slot ${n}`}
                    onClick={() => onSetMediaSlot(n, undefined)}
                  >
                    ×
                  </button>
                </>
              ) : (
                <label style={styles.empty} title={`Upload to slot ${n}`}>
                  {n}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    aria-label={`Upload photo or video for slot ${n}`}
                    onChange={(e) => {
                      void handleFile(n, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
