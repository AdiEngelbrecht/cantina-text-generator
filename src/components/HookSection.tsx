'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {HookClip} from '../lib/types';

type Props = {
  hook: HookClip | undefined;
  setHook: (hook: HookClip | undefined) => void;
};

type LibraryClip = {
  name: string;
  src: string;
};

const ACCEPT = 'video/*,image/*';

/** Manifest extensions treated as static image hooks. */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const isImageSrc = (src: string): boolean => {
  const lower = src.toLowerCase().split('?')[0];
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

/** How long an image hook shows by default, in seconds. */
const IMAGE_HOOK_DEFAULT_SECONDS = 3;

/** Measures the duration of a video at an object URL via a temporary <video>. */
const measureFileDuration = (url: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        resolve(video.duration);
      } else {
        reject(new Error('Could not read video duration'));
      }
    };
    video.onerror = () => reject(new Error('Could not read this video file'));
    video.src = url;
  });

/** Measures the duration of a video at a public URL via a temporary <video>. */
const measureUrlDuration = (src: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        resolve(video.duration);
      } else {
        reject(new Error('Could not read video duration'));
      }
    };
    video.onerror = () => reject(new Error('Could not load this clip'));
    video.src = src;
  });

const round2 = (n: number): number => Math.round(n * 100) / 100;

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

/** Display name for a hook src: last path segment without extension. */
const hookName = (src: string): string => {
  const file = src.split('/').pop() ?? src;
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
};

export const HookSection: React.FC<Props> = ({hook, setHook}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryClip[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimStart = hook?.trimStartSec ?? 0;
  const trimEnd = hook?.trimEndSec ?? hook?.durationSec ?? 0;
  const zoom = hook?.zoom ?? 1;
  const isImage = (hook?.mediaType ?? 'video') === 'image';
  const autoDuration = hook?.autoDuration !== false;
  const customDuration = clamp(
    hook?.customDurationSec ?? Math.min(hook?.durationSec ?? 3, 10),
    1,
    10,
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/hooks/manifest.json')
      .then((res) => (res.ok ? res.json() : {hooks: []}))
      .then((data: {hooks?: LibraryClip[]}) => {
        if (!cancelled) setLibrary(data.hooks ?? []);
      })
      .catch(() => {
        if (!cancelled) setLibrary([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectLibraryClip = useCallback(
    async (clip: LibraryClip) => {
      setBusy(true);
      setError(null);
      try {
        if (isImageSrc(clip.src)) {
          setHook({
            src: clip.src,
            mediaType: 'image',
            durationSec: IMAGE_HOOK_DEFAULT_SECONDS,
          });
        } else {
          const durationSec = await measureUrlDuration(clip.src);
          setHook({
            src: clip.src,
            mediaType: 'video',
            durationSec: round2(durationSec),
          });
        }
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this clip');
      } finally {
        setBusy(false);
      }
    },
    [setHook],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage && !file.type.startsWith('video/')) {
        setError('That file is not a video or an image.');
        return;
      }
      setBusy(true);
      setError(null);
      const url = URL.createObjectURL(file);
      if (isImage) {
        setHook({
          src: url,
          mediaType: 'image',
          durationSec: IMAGE_HOOK_DEFAULT_SECONDS,
        });
        setOpen(false);
        setBusy(false);
        return;
      }
      try {
        const durationSec = await measureFileDuration(url);
        setHook({src: url, mediaType: 'video', durationSec: round2(durationSec)});
        setOpen(false);
      } catch (err) {
        URL.revokeObjectURL(url);
        setError(err instanceof Error ? err.message : 'Could not load this clip');
      } finally {
        setBusy(false);
      }
    },
    [setHook],
  );

  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">2</span>
        <div>
          <h2>Hook video</h2>
          <p>
            Optional. A reaction clip that plays before the chat — caption it
            in CapCut first, it looks better that way.
          </p>
          <p className="section-note" style={{marginTop: 6}}>
            Need clips?{' '}
            <a
              href="https://drive.google.com/drive/folders/1suQPzPFb0i_6ATiABZsLOCMG2-AYYJqn?usp=sharing"
              target="_blank"
              rel="noreferrer"
            >
              Download crying hooks from our Drive folder
            </a>{' '}
            → add your caption in CapCut → upload the finished clip here.
          </p>
        </div>
      </header>

      {hook ? (
        <>
          <div className="hook-card">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="hook-card-video"
                src={hook.src}
                alt={hookName(hook.src)}
              />
            ) : (
              <video
                className="hook-card-video"
                src={hook.src}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            )}
            <div className="hook-card-body">
              <strong>{hookName(hook.src)}</strong>
              <span>
                {isImage ? `${hook.durationSec.toFixed(1)}s still` : `${hook.durationSec.toFixed(1)}s`}
              </span>
            </div>
            <button
              type="button"
              className="btn hook-remove"
              onClick={() => setHook(undefined)}
            >
              Remove hook
            </button>
          </div>

          {isImage ? (
            <>
              <label className="field-label">Hook duration</label>
              <div className="hook-trim">
                <div className="hook-trim-row">
                  <span className="hook-trim-label">Length</span>
                  <input
                    type="range"
                    className="hook-trim-slider"
                    min={1}
                    max={10}
                    step={0.5}
                    value={clamp(hook.durationSec, 1, 10)}
                    onChange={(e) => {
                      const v = clamp(parseFloat(e.target.value) || 3, 1, 10);
                      setHook({...hook, durationSec: v});
                    }}
                  />
                  <span className="hook-trim-value">
                    {clamp(hook.durationSec, 1, 10).toFixed(1)}s
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={autoDuration}
                  onChange={(e) =>
                    setHook({
                      ...hook,
                      autoDuration: e.target.checked ? undefined : false,
                    })
                  }
                  style={{
                    accentColor: 'var(--accent)',
                    width: 16,
                    height: 16,
                    margin: 0,
                  }}
                />
                Auto duration (match clip length)
              </label>

              {!autoDuration ? (
                <>
                  <label className="field-label">Hook duration</label>
                  <div className="hook-trim">
                    <div className="hook-trim-row">
                      <span className="hook-trim-label">Length</span>
                      <input
                        type="range"
                        className="hook-trim-slider"
                        min={1}
                        max={10}
                        step={0.5}
                        value={customDuration}
                        onChange={(e) => {
                          const v = clamp(
                            parseFloat(e.target.value) || 3,
                            1,
                            10,
                          );
                          setHook({
                            ...hook,
                            autoDuration: false,
                            customDurationSec: v,
                          });
                        }}
                      />
                      <span className="hook-trim-value">
                        {customDuration.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </>
              ) : null}

              <label className="field-label">Trim clip</label>
              <div className="hook-trim">
                <div className="hook-trim-row">
                  <span className="hook-trim-label">Start</span>
                  <input
                    type="range"
                    className="hook-trim-slider"
                    min={0}
                    max={hook.durationSec}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => {
                      const v = clamp(
                        parseFloat(e.target.value) || 0,
                        0,
                        trimEnd - 0.5,
                      );
                      setHook({
                        ...hook,
                        trimStartSec: round2(v),
                        trimEndSec: trimEnd,
                      });
                    }}
                  />
                  <span className="hook-trim-value">{trimStart.toFixed(1)}s</span>
                </div>
                <div className="hook-trim-row">
                  <span className="hook-trim-label">End</span>
                  <input
                    type="range"
                    className="hook-trim-slider"
                    min={0}
                    max={hook.durationSec}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => {
                      const v = clamp(
                        parseFloat(e.target.value) || 0,
                        trimStart + 0.5,
                        hook.durationSec,
                      );
                      setHook({
                        ...hook,
                        trimStartSec: trimStart,
                        trimEndSec: round2(v),
                      });
                    }}
                  />
                  <span className="hook-trim-value">{trimEnd.toFixed(1)}s</span>
                </div>
                <div className="hook-trim-footer">
                  <span className="section-note hook-trim-readout">
                    {trimStart.toFixed(1)}s – {trimEnd.toFixed(1)}s · shows{' '}
                    {(trimEnd - trimStart).toFixed(1)}s
                  </span>
                  <button
                    type="button"
                    className="btn hook-trim-reset"
                    onClick={() =>
                      setHook({
                        ...hook,
                        trimStartSec: 0,
                        trimEndSec: hook.durationSec,
                      })
                    }
                  >
                    Reset
                  </button>
                </div>
              </div>
            </>
          )}

          <label className="field-label">Zoom</label>
          <div className="hook-trim">
            <div className="hook-trim-row">
              <span className="hook-trim-label">Zoom</span>
              <input
                type="range"
                className="hook-trim-slider"
                min={1}
                max={1.5}
                step={0.01}
                value={zoom}
                onChange={(e) => {
                  const v = clamp(parseFloat(e.target.value) || 1, 1, 1.5);
                  setHook({...hook, zoom: round2(v)});
                }}
              />
              <span className="hook-trim-value">{zoom.toFixed(2)}×</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {!open ? (
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(true)}
            >
              Add hook video or image
            </button>
          ) : (
            <>
              {library.length > 0 ? (
                <div className="hook-grid">
                  {library.map((clip) => (
                    <button
                      key={clip.src}
                      type="button"
                      className="hook-clip-card"
                      disabled={busy}
                      onClick={() => selectLibraryClip(clip)}
                    >
                      {isImageSrc(clip.src) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="hook-clip-video"
                          src={clip.src}
                          alt={clip.name}
                        />
                      ) : (
                        <video
                          className="hook-clip-video"
                          src={clip.src}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onMouseEnter={(e) =>
                            void e.currentTarget.play().catch(() => {})
                          }
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      )}
                      <span className="hook-clip-name">{clip.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="section-note">
                  No clips yet — drop clips into <code>public/hooks</code> and
                  run <code>node scripts/update-hooks-manifest.mjs</code>, then
                  they&apos;ll show up here.
                </p>
              )}

              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  {busy ? 'Working…' : 'Upload your own'}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
            </>
          )}
        </>
      )}

      {error ? <p className="section-note error">{error}</p> : null}
    </section>
  );
};
