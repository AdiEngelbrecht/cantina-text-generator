import {staticFile} from 'remotion';

/**
 * Resolves a message media source for both CLI renders and the browser
 * preview: root-relative paths (`/uploads/x.mp4`) are public-folder assets
 * and must go through `staticFile` so the render server can find them;
 * absolute URLs are passed through untouched.
 */
export const resolveMediaSrc = (src: string): string =>
  src.startsWith('/') ? staticFile(src.slice(1)) : src;
