/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The WhatsApp bridge's npm shims must stay OUT of Authenticode signing.
 *
 * Signing rewrites a binary, and scripts/verify-packaged-resources.js compares
 * the staged bridge byte-for-byte against the source tree, so a signed shim is a
 * mismatch and the release gate refuses the build. electron-builder.yml already
 * says as much and warns that a lockfile which grows a new shim "needs the new
 * name" -- but nothing enforced it, so the sharp 0.35.4 bump (which pulls a
 * newer semver and gives @puppeteer/browsers its own nested copy) added a shim
 * the list did not cover and cost a full Windows build to discover: run
 * 33391945572, where signing took semver.exe from 15,872 to 31,624 bytes.
 *
 * This turns that into a local failure. It reads the shims actually installed by
 * the frozen lockfile rather than a hand-kept list, so the NEXT resolution
 * change fails here instead of 30 minutes into a platform build.
 */
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_DIR = path.join(REPO_ROOT, 'src', 'process', 'channels', 'whatsapp-bridge');
const BRIDGE_MODULES = path.join(BRIDGE_DIR, 'node_modules');

/** Every `.bin` entry under the bridge, as the `\`-separated tail Windows produces. */
function installedShimTails(): string[] {
  const tails: string[] = [];
  const walk = (dir: string, relative: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const next = path.join(dir, entry.name);
      const nextRelative = `${relative}/${entry.name}`;
      if (entry.name === '.bin') {
        for (const shim of fs.readdirSync(next)) {
          // bun materialises each shim as `<name>.exe` on Windows.
          const bare = shim.replace(/\.(?:exe|cmd|ps1)$/i, '');
          tails.push(`\\whatsapp-bridge${nextRelative.replace(/\//g, '\\')}\\${bare}.exe`);
        }
        continue;
      }
      if (entry.isDirectory()) walk(next, nextRelative);
    }
  };
  walk(BRIDGE_MODULES, '/node_modules');
  return [...new Set(tails)].sort();
}

/** The negative `signExts` patterns, as electron-builder matches them: endsWith. */
function signExtExclusions(): string[] {
  const yml = fs.readFileSync(path.join(REPO_ROOT, 'electron-builder.yml'), 'utf8');
  const block = yml.match(/\n {2}signExts:\n((?: {4}(?:-[^\n]*|#[^\n]*)?\n)+)/);
  if (!block) throw new Error('electron-builder.yml has no win.signExts block');
  return [...block[1].matchAll(/^ {4}- '(![^']+)'$/gm)].map((match) => match[1].slice(1));
}

describe('every WhatsApp bridge npm shim is excluded from Windows signing', () => {
  it('has the bridge installed, so this check can actually fail', () => {
    // A skip here would make the whole file decorative on exactly the machines
    // that matter. postinstall installs the bridge; if it did not, say so.
    expect(fs.existsSync(BRIDGE_MODULES)).toBe(true);
    expect(installedShimTails().length).toBeGreaterThan(0);
  });

  it('covers every shim the frozen lockfile produces, nested ones included', () => {
    const exclusions = signExtExclusions();
    const uncovered = installedShimTails().filter((tail) => !exclusions.some((pattern) => tail.endsWith(pattern)));
    expect(uncovered).toEqual([]);
  });

  it('names the nested @puppeteer/browsers semver that run 33391945572 caught', () => {
    // Pinned by name because the hoisted `\node_modules\.bin\semver.exe` entry
    // does NOT endsWith-match the nested path, which is precisely why signing
    // reached it. Deleting either line must fail, not silently re-open the hole.
    const exclusions = signExtExclusions();
    for (const tail of [
      '\\whatsapp-bridge\\node_modules\\.bin\\semver.exe',
      '\\whatsapp-bridge\\node_modules\\@puppeteer\\browsers\\node_modules\\.bin\\semver.exe',
    ]) {
      expect(exclusions.some((pattern) => tail.endsWith(pattern))).toBe(true);
    }
  });
});
