#!/usr/bin/env node
// Scans public/hooks for video clips and writes public/hooks/manifest.json.
// Run this after adding/removing hook clips, before deploying.

import {readdirSync, writeFileSync} from 'node:fs';
import {join, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const hooksDir = fileURLToPath(new URL('../public/hooks', import.meta.url));
const EXTENSIONS = new Set(['.mp4', '.mov', '.webm']);

const hooks = readdirSync(hooksDir)
  .filter((file) => EXTENSIONS.has(extname(file).toLowerCase()))
  .sort()
  .map((file) => ({
    name: file.slice(0, file.length - extname(file).length),
    src: `/hooks/${file}`,
  }));

const manifestPath = join(hooksDir, 'manifest.json');
writeFileSync(manifestPath, `${JSON.stringify({hooks}, null, 2)}\n`);
console.log(`Wrote ${manifestPath} with ${hooks.length} hook(s).`);
