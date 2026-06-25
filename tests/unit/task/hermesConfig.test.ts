/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `materializeFluxHermesHome`: the scoped HERMES_HOME that makes a
 * flux-routed hermes spawn select Flux via the literal `custom` provider against
 * the Flux openai surface, with `api_mode: chat_completions` and the connected
 * flux key written INLINE on the model block (hermes ignores key_env for a custom
 * provider, proven live). The user's real ~/.hermes config is never touched - only
 * files under the provided userData dir are written.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync } from 'fs';
import { readFile, rm, stat } from 'fs/promises';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { FLUX_SURFACE } from '@/common/config/flux';
import { materializeFluxHermesHome } from '@process/task/hermesConfig';

const TEST_KEY = 'sk-flux-UNITTESTKEY1234567890';

const tmpDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

function makeUserData(): string {
  const dir = mkdtempSync(join(tmpdir(), 'wl-hermescfg-'));
  tmpDirs.push(dir);
  return dir;
}

describe('materializeFluxHermesHome', () => {
  it('returns <userData>/flux-hermes-home and writes config.yaml there', async () => {
    const userData = makeUserData();
    const dir = await materializeFluxHermesHome(userData, TEST_KEY);
    expect(dir).toBe(join(userData, 'flux-hermes-home'));
    expect(existsSync(join(dir, 'config.yaml'))).toBe(true);
  });

  it('writes the Flux schema with the default openai surface base_url', async () => {
    const userData = makeUserData();
    const dir = await materializeFluxHermesHome(userData, TEST_KEY);
    const yaml = await readFile(join(dir, 'config.yaml'), 'utf8');
    expect(yaml).toContain('provider: custom');
    expect(yaml).toContain('default: flux-auto');
    expect(yaml).toContain('api_mode: chat_completions');
    expect(yaml).toContain(`base_url: ${FLUX_SURFACE.openai}`);
    expect(yaml).toContain('base_url: https://api.fluxrouter.ai/v1');
  });

  it('writes the connected flux key INLINE (quoted) - hermes ignores key_env for custom', async () => {
    const userData = makeUserData();
    const dir = await materializeFluxHermesHome(userData, TEST_KEY);
    const yaml = await readFile(join(dir, 'config.yaml'), 'utf8');
    expect(yaml).toContain(`api_key: '${TEST_KEY}'`);
    // the key_env FIELD must NOT be used (hermes silently ignores it for a custom
    // provider and falls back to a stale stored token - the reason we write inline).
    expect(yaml).not.toMatch(/key_env:/);
  });

  it('single-quote-escapes a key so it is always valid YAML', async () => {
    const userData = makeUserData();
    const dir = await materializeFluxHermesHome(userData, "ab'cd");
    const yaml = await readFile(join(dir, 'config.yaml'), 'utf8');
    expect(yaml).toContain("api_key: 'ab''cd'");
  });

  it.skipIf(process.platform === 'win32')('writes the credential file owner-only (0o600) in a 0o700 dir', async () => {
    const userData = makeUserData();
    const dir = await materializeFluxHermesHome(userData, TEST_KEY);
    const fileMode = (await stat(join(dir, 'config.yaml'))).mode & 0o777;
    const dirMode = (await stat(dir)).mode & 0o777;
    expect(fileMode).toBe(0o600);
    expect(dirMode).toBe(0o700);
  });

  it('honors an explicit Flux Desktop daemon base_url', async () => {
    const userData = makeUserData();
    const dir = await materializeFluxHermesHome(userData, TEST_KEY, 'http://127.0.0.1:7878/v1');
    const yaml = await readFile(join(dir, 'config.yaml'), 'utf8');
    expect(yaml).toContain('base_url: http://127.0.0.1:7878/v1');
    expect(yaml).not.toContain('base_url: https://api.fluxrouter.ai/v1');
  });

  it('writes only under userData - never creates the real ~/.hermes', async () => {
    const userData = makeUserData();
    const realHermes = join(homedir(), '.hermes');
    const existedBefore = existsSync(realHermes);

    await materializeFluxHermesHome(userData, TEST_KEY);

    // The function must not create ~/.hermes if it was absent.
    if (!existedBefore) {
      expect(existsSync(realHermes)).toBe(false);
    }
  });
});
