/**
 * Shared state for the render API.
 *
 * Both the job store and the Remotion bundle dir live on `globalThis` so
 * they survive Next.js dev-server HMR module reloads (routes re-import on
 * every edit; globalThis does not reset).
 */

export type RenderJob = {
  status: 'rendering' | 'done' | 'error';
  /** 0..1, combined render+encode progress from renderMedia. */
  progress: number;
  url?: string;
  error?: string;
};

type RenderApiGlobal = {
  __cantinaRenderJobs?: Map<string, RenderJob>;
  __cantinaBundleDir?: Promise<string>;
};

const g = globalThis as unknown as RenderApiGlobal;

export const getJobs = (): Map<string, RenderJob> => {
  if (!g.__cantinaRenderJobs) {
    g.__cantinaRenderJobs = new Map<string, RenderJob>();
  }
  return g.__cantinaRenderJobs;
};

/**
 * Bundle the Remotion project exactly once per server process and cache the
 * resulting serveUrl. Concurrent render requests share the same in-flight
 * bundle promise.
 */
export const getBundleDir = (): Promise<string> => {
  if (!g.__cantinaBundleDir) {
    // webpackIgnore: load via Node at runtime — bundling @remotion/bundler
    // with webpack chokes on its binary assets.
    g.__cantinaBundleDir = import(
      /* webpackIgnore: true */ '@remotion/bundler'
    ).then(({bundle}) =>
      bundle({
        entryPoint: 'src/remotion/index.ts',
        // Render API runs in the node runtime; webpack override not needed.
      }),
    );
    // If bundling fails, drop the cache so a later request can retry.
    g.__cantinaBundleDir.catch(() => {
      g.__cantinaBundleDir = undefined;
    });
  }
  return g.__cantinaBundleDir;
};
