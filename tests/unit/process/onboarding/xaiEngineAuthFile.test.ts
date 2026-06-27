/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  xaiEngineAuthPath,
  buildXaiEngineAuthDoc,
  writeXaiEngineAuthFile,
} from '@/process/onboarding/xaiEngineAuthFile';
import { XAI_SCOPES, type XaiTokens } from '@/process/onboarding/xaiOAuthCore';

describe('xaiEngineAuthPath', () => {
  it('defaults to ~/.wayland/oauth/xai.json', () => {
    expect(xaiEngineAuthPath({})).toBe(path.join(os.homedir(), '.wayland', 'oauth', 'xai.json'));
  });

  it('honors $WAYLAND_HOME so the desktop writes where the engine reads', () => {
    const home = path.join('/tmp', 'custom-wayland');
    expect(xaiEngineAuthPath({ WAYLAND_HOME: home })).toBe(path.join(home, 'oauth', 'xai.json'));
  });

  it('ignores a blank $WAYLAND_HOME', () => {
    expect(xaiEngineAuthPath({ WAYLAND_HOME: '   ' })).toBe(path.join(os.homedir(), '.wayland', 'oauth', 'xai.json'));
  });
});

describe('buildXaiEngineAuthDoc', () => {
  it('maps the token bundle onto the engine OAuthTokens shape (ms expiry → unix seconds)', () => {
    const tokens: XaiTokens = { accessToken: 'acc', refreshToken: 'ref', expiresAt: 1_893_456_000_000 };
    expect(buildXaiEngineAuthDoc(tokens)).toEqual({
      access_token: 'acc',
      refresh_token: 'ref',
      expires_at_unix_secs: 1_893_456_000,
      token_type: 'Bearer',
      scope: XAI_SCOPES,
    });
  });

  it('omits refresh_token and expires_at_unix_secs when the bundle lacks them', () => {
    const doc = buildXaiEngineAuthDoc({ accessToken: 'acc' });
    expect(doc).toEqual({ access_token: 'acc', token_type: 'Bearer', scope: XAI_SCOPES });
    expect(doc.refresh_token).toBeUndefined();
    expect(doc.expires_at_unix_secs).toBeUndefined();
  });
});

describe('writeXaiEngineAuthFile', () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-xai-'));
    env = { WAYLAND_HOME: path.join(dir, '.wayland') };
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes ~/.wayland/oauth/xai.json (mode 0o600) with the engine schema', async () => {
    const tokens: XaiTokens = { accessToken: 'acc', refreshToken: 'ref', expiresAt: 1_893_456_000_000 };
    const ok = await writeXaiEngineAuthFile(tokens, env);
    expect(ok).toBe(true);

    const file = xaiEngineAuthPath(env);
    expect(fs.existsSync(file)).toBe(true);
    if (process.platform !== 'win32') {
      expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    }

    const onDisk = JSON.parse(fs.readFileSync(file, 'utf-8'));
    expect(onDisk.access_token).toBe('acc');
    expect(onDisk.refresh_token).toBe('ref');
    expect(onDisk.expires_at_unix_secs).toBe(1_893_456_000);
    expect(onDisk.token_type).toBe('Bearer');
  });

  it('returns false (never throws) when the target path cannot be written', async () => {
    // Point WAYLAND_HOME at a FILE, so mkdir of the oauth dir underneath fails.
    const filePath = path.join(dir, 'not-a-dir');
    fs.writeFileSync(filePath, 'x');
    const ok = await writeXaiEngineAuthFile({ accessToken: 'acc' }, { WAYLAND_HOME: filePath });
    expect(ok).toBe(false);
  });
});
