import {staticFile} from 'remotion';

/**
 * Resolves a message media source for both CLI renders and the browser
 * preview: root-relative paths (`/hooks/x.mp4`, `/sample/x.mp4`) are
 * public-folder assets and must go through `staticFile` so the render
 * server can find them; `/api/…` paths, `blob:` object URLs (in-browser
 * uploads) and absolute URLs are passed through untouched.
 */
export const resolveMediaSrc = (src: string): string =>
  src.startsWith('blob:') ||
  !src.startsWith('/') ||
  src.startsWith('/api/')
    ? src
    : staticFile(src.slice(1));
