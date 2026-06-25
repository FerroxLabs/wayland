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
  codexAuthPath,
  buildCodexAuthDoc,
  parseCodexAuthDoc,
  writeCodexAuthFile,
  readCodexAuthFile,
} from '@/process/onboarding/codexAuthFile';
import type { ChatGptTokens } from '@/process/onboarding/chatgptOAuthCore';

// A minimal unsigned JWT id_token carrying the OpenAI auth claim, so the parser
// can derive account id / plan / expiry. base64url, no signature (the real flow
// trusts the TLS token endpoint).
function makeIdToken(claim: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claim)).toString('base64url');
  return `${header}.${payload}.`;
}

describe('codexAuthPath', () => {
  it('defaults to ~/.codex/auth.json', () => {
    expect(codexAuthPath({})).toBe(path.join(os.homedir(), '.codex', 'auth.json'));
  });

  it('honors $CODEX_HOME', () => {
    const home = path.join('/tmp', 'custom-codex');
    expect(codexAuthPath({ CODEX_HOME: home })).toBe(path.join(home, 'auth.json'));
  });

  it('ignores a blank $CODEX_HOME', () => {
    expect(codexAuthPath({ CODEX_HOME: '   ' })).toBe(path.join(os.homedir(), '.codex', 'auth.json'));
  });
});

describe('buildCodexAuthDoc', () => {
  it('produces the standard Codex auth.json shape', () => {
    const tokens: ChatGptTokens = {
      accessToken: 'acc',
      refreshToken: 'ref',
      idToken: 'idt',
      accountId: 'acct-1',
    };
    expect(buildCodexAuthDoc(tokens, '2026-06-16T00:00:00.000Z')).toEqual({
      OPENAI_API_KEY: null,
      tokens: { id_token: 'idt', access_token: 'acc', refresh_token: 'ref', account_id: 'acct-1' },
      last_refresh: '2026-06-16T00:00:00.000Z',
    });
  });

  it('fills missing optional fields with empty strings', () => {
    const doc = buildCodexAuthDoc({ accessToken: 'acc' }, '2026-06-16T00:00:00.000Z');
    expect(doc.tokens).toEqual({ id_token: '', access_token: 'acc', refresh_token: '', account_id: '' });
  });
});

describe('parseCodexAuthDoc', () => {
  it('reads access/refresh/id/account from the tokens object', () => {
    const bundle = parseCodexAuthDoc({
      tokens: { access_token: 'acc', refresh_token: 'ref', id_token: 'idt', account_id: 'acct-1' },
    });
    expect(bundle).toMatchObject({ accessToken: 'acc', refreshToken: 'ref', idToken: 'idt', accountId: 'acct-1' });
  });

  it('derives account id / plan / expiry from the id_token when present', () => {
    const idToken = makeIdToken({
      exp: 1893456000,
      'https://api.openai.com/auth': { chatgpt_account_id: 'acct-jwt', chatgpt_plan_type: 'pro' },
    });
    const bundle = parseCodexAuthDoc({ tokens: { access_token: 'acc', id_token: idToken } });
    expect(bundle?.accountId).toBe('acct-jwt');
    expect(bundle?.planType).toBe('pro');
    expect(bundle?.expiresAt).toBe(1893456000 * 1000);
  });

  it('prefers an explicit account_id over the id_token claim', () => {
    const idToken = makeIdToken({ 'https://api.openai.com/auth': { chatgpt_account_id: 'acct-jwt' } });
    const bundle = parseCodexAuthDoc({ tokens: { access_token: 'acc', id_token: idToken, account_id: 'acct-explicit' } });
    expect(bundle?.accountId).toBe('acct-explicit');
  });

  it('returns null for an API-key-only file (no tokens object) or no access token', () => {
    expect(parseCodexAuthDoc({ OPENAI_API_KEY: 'sk-...' })).toBeNull();
    expect(parseCodexAuthDoc({ tokens: { refresh_token: 'ref' } })).toBeNull();
    expect(parseCodexAuthDoc(null)).toBeNull();
    expect(parseCodexAuthDoc('nope')).toBeNull();
  });
});

describe('writeCodexAuthFile / readCodexAuthFile round-trip', () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-codex-'));
    env = { CODEX_HOME: path.join(dir, '.codex') };
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes ~/.codex/auth.json (mode 0o600) and reads it back', async () => {
    const tokens: ChatGptTokens = {
      accessToken: 'acc',
      refreshToken: 'ref',
      idToken: makeIdToken({ 'https://api.openai.com/auth': { chatgpt_account_id: 'acct-1', chatgpt_plan_type: 'plus' } }),
      accountId: 'acct-1',
    };

    const ok = await writeCodexAuthFile(tokens, '2026-06-16T00:00:00.000Z', env);
    expect(ok).toBe(true);

    const file = codexAuthPath(env);
    expect(fs.existsSync(file)).toBe(true);
    if (process.platform !== 'win32') {
      expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    }

    const onDisk = JSON.parse(fs.readFileSync(file, 'utf-8'));
    expect(onDisk.tokens.access_token).toBe('acc');
    expect(onDisk.OPENAI_API_KEY).toBeNull();

    const bundle = await readCodexAuthFile(env);
    expect(bundle).toMatchObject({ accessToken: 'acc', refreshToken: 'ref', accountId: 'acct-1', planType: 'plus' });
  });

  it('readCodexAuthFile returns null when the file is absent', async () => {
    expect(await readCodexAuthFile(env)).toBeNull();
  });
});
