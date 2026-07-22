/**
 * The punchline sound. Files live in `public/sounds/`.
 * The Gymnopédie piano is the viral TikTok audio — see the README's
 * "TikTok boost tip" for why clippers should attach it in-app on TikTok.
 */
export type SoundOption = {
  /** Filename under `public/sounds/`, e.g. `gymnopedie-piano.mp3`. */
  file: string;
  label: string;
};

export const SOUNDS: SoundOption[] = [
  {file: 'gymnopedie-piano.mp3', label: 'Gymnopédie Piano (TikTok viral)'},
];
