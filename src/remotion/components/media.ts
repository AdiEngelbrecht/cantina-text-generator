import {staticFile} from 'remotion';

/**
 * Resolves a message media source for both CLI renders and the browser
 * preview: root-relative paths (`/hooks/x.mp4`, `/sample/x.mp4`) are
 * public-folder assets and must go through `staticFile` so the render
 * server can find them; `/api/…` paths and absolute URLs are passed
 * through untouched.
 */
export const resolveMediaSrc = (src: string): string =>
  src.startsWith('/') && !src.startsWith('/api/')
    ? staticFile(src.slice(1))
    : src;
