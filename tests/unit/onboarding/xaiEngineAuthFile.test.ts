/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  readXaiEngineAuthFile,
  writeXaiEngineAuthFile,
  xaiEngineAuthPath,
} from '@process/onboarding/xaiEngineAuthFile';
import type { XaiTokens } from '@process/onboarding/xaiOAuthCore';

// A scratch WAYLAND_HOME per test so the real fs round-trips without touching
// the user's ~/.wayland. Each function takes an explicit `env` override.
let home = '';
const env = (): NodeJS.ProcessEnv => ({ WAYLAND_HOME: home }) as NodeJS.ProcessEnv;

beforeEach(async () => {
  home = await fs.mkdtemp(path.join(os.tmpdir(), 'xai-engine-'));
});

afterEach(async () => {
  await fs.rm(home, { recursive: true, force: true }).catch(() => {});
});

describe('xaiEngineAuthPath (#391 WAYLAND_HOME parity with the engine)', () => {
  it('uses $WAYLAND_HOME verbatim — does NOT trim surrounding whitespace (matches the engine)', () => {
    const raw = ' /tmp/spaced ';
    expect(xaiEngineAuthPath({ WAYLAND_HOME: raw } as NodeJS.ProcessEnv)).toBe(path.join(raw, 'oauth', 'xai.json'));
  });

  it('falls back to ~/.wayland when WAYLAND_HOME is absent or empty', () => {
    const def = path.join(os.homedir(), '.wayland', 'oauth', 'xai.json');
    expect(xaiEngineAuthPath({} as NodeJS.ProcessEnv)).toBe(def);
    expect(xaiEngineAuthPath({ WAYLAND_HOME: '' } as NodeJS.ProcessEnv)).toBe(def);
  });
});

describe('writeXaiEngineAuthFile / readXaiEngineAuthFile round-trip (#391)', () => {
  it('writes the engine doc and reads it back into our token shape', async () => {
    const expiresAt = 1_900_000_000_000; // round ms → no sub-second loss
    const tokens: XaiTokens = { accessToken: 'acc-1', refreshToken: 'ref-1', expiresAt };

    expect(await writeXaiEngineAuthFile(tokens, env())).toBe(true);

    const back = await readXaiEngineAuthFile(env());
    expect(back).toEqual({ accessToken: 'acc-1', refreshToken: 'ref-1', expiresAt });
  });

  it('persists the engine contract (snake_case + epoch SECONDS) on disk', async () => {
    await writeXaiEngineAuthFile({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 2_000_000_000_000 }, env());
    const onDisk = JSON.parse(await fs.readFile(xaiEngineAuthPath(env()), 'utf-8'));
    expect(onDisk.access_token).toBe('acc');
    expect(onDisk.refresh_token).toBe('ref');
    expect(onDisk.expires_at_unix_secs).toBe(2_000_000_000); // ms / 1000
    expect(onDisk.token_type).toBe('Bearer');
  });

  it('reads back an access-only doc (no refresh token / no expiry)', async () => {
    await writeXaiEngineAuthFile({ accessToken: 'acc-only' }, env());
    expect(await readXaiEngineAuthFile(env())).toEqual({ accessToken: 'acc-only' });
  });
});

describe('readXaiEngineAuthFile defensiveness (#391)', () => {
  it('returns null when the file is missing', async () => {
    expect(await readXaiEngineAuthFile(env())).toBeNull();
  });

  it('returns null on malformed JSON', async () => {
    const file = xaiEngineAuthPath(env());
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, 'not json');
    expect(await readXaiEngineAuthFile(env())).toBeNull();
  });

  it('returns null when the doc has no access_token', async () => {
    const file = xaiEngineAuthPath(env());
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify({ refresh_token: 'r' }));
    expect(await readXaiEngineAuthFile(env())).toBeNull();
  });
});

describe('writeXaiEngineAuthFile failure handling (#391)', () => {
  it('returns false and leaves no stray .tmp file when the rename target cannot be written', async () => {
    // Pre-create the destination path AS A DIRECTORY so the final `rename(tmp →
    // file)` fails after the temp file is written — exercising the catch/cleanup.
    const file = xaiEngineAuthPath(env());
    await fs.mkdir(file, { recursive: true });

    expect(await writeXaiEngineAuthFile({ accessToken: 'acc', refreshToken: 'ref' }, env())).toBe(false);

    const oauthDir = path.dirname(file);
    const leftovers = (await fs.readdir(oauthDir)).filter((n) => n.includes('.tmp-'));
    expect(leftovers).toEqual([]);
  });
});
