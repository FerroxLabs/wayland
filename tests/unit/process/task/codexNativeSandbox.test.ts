/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #536: Wayland must NOT rewrite the user's own ~/.codex/config.toml to set the
 * Codex sandbox mode. Instead every native codex spawn gets a Wayland-scoped
 * CODEX_HOME (materializeNativeCodexHome) whose config.toml Wayland owns. These
 * tests prove:
 *   (a) the user's real config.toml is NEVER written,
 *   (b) the default sandbox mode is read-only (least privilege),
 *   (c) an explicit escalated mode still reaches Codex via the scoped home,
 *   (d) the user's config is cloned in + auth.json is symlinked through (so a
 *       token refresh writes back to the user's real file).
 *
 * Uses real temp dirs (no fs mocking) and reads the materialized files back.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lstat, mkdtemp, readFile, readlink, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse as parseToml } from 'smol-toml';
import {
  getCodexSandboxModeForSessionMode,
  materializeNativeCodexHome,
  normalizeCodexSandboxMode,
} from '@process/task/codexConfig';

describe('normalizeCodexSandboxMode (#536 default read-only)', () => {
  it('defaults to read-only when nothing explicit is provided', () => {
    expect(normalizeCodexSandboxMode()).toBe('read-only');
    expect(normalizeCodexSandboxMode(null)).toBe('read-only');
    expect(normalizeCodexSandboxMode(undefined)).toBe('read-only');
  });

  it('honors an explicit escalated mode', () => {
    expect(normalizeCodexSandboxMode('workspace-write')).toBe('workspace-write');
    expect(normalizeCodexSandboxMode('danger-full-access')).toBe('danger-full-access');
  });

  it('coerces read-only through unchanged', () => {
    expect(normalizeCodexSandboxMode('read-only')).toBe('read-only');
  });
});

describe('getCodexSandboxModeForSessionMode (#536)', () => {
  it('yields read-only with no explicit session mode and no fallback', () => {
    expect(getCodexSandboxModeForSessionMode(null)).toBe('read-only');
    expect(getCodexSandboxModeForSessionMode(undefined)).toBe('read-only');
  });

  it('respects an escalated fallback when no session mode is set', () => {
    expect(getCodexSandboxModeForSessionMode(null, 'workspace-write')).toBe('workspace-write');
    expect(getCodexSandboxModeForSessionMode(undefined, 'danger-full-access')).toBe('danger-full-access');
  });

  it('maps an explicit non-yolo session mode to workspace-write', () => {
    expect(getCodexSandboxModeForSessionMode('default')).toBe('workspace-write');
    expect(getCodexSandboxModeForSessionMode('autoEdit')).toBe('workspace-write');
  });

  it('maps an explicit no-sandbox (yolo) session mode to danger-full-access', () => {
    expect(getCodexSandboxModeForSessionMode('yoloNoSandbox')).toBe('danger-full-access');
  });
});

describe('materializeNativeCodexHome (#536 scoped CODEX_HOME)', () => {
  let userDataDir: string;
  let userHome: string;
  let userConfig: string;
  let userAuth: string;

  beforeEach(async () => {
    userDataDir = await mkdtemp(join(tmpdir(), 'native-codex-data-'));
    userHome = await mkdtemp(join(tmpdir(), 'native-codex-user-'));
    userConfig = join(userHome, 'config.toml');
    userAuth = join(userHome, 'auth.json');
  });

  afterEach(async () => {
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    await rm(userHome, { recursive: true, force: true }).catch(() => {});
  });

  const readScopedConfig = async (home: string): Promise<string> => readFile(join(home, 'config.toml'), 'utf8');

  it("NEVER writes the user's real config.toml, only the scoped clone", async () => {
    const original = [
      '# my codex config',
      'model = "gpt-5"',
      'sandbox_mode = "read-only"',
      '',
      '[features]',
      'hooks = true',
      '',
    ].join('\n');
    await writeFile(userConfig, original, 'utf8');
    const before = await stat(userConfig);

    const home = await materializeNativeCodexHome(userDataDir, 'workspace-write', userConfig, userAuth);

    // The scoped home is inside userData, NOT the user's home.
    expect(home).toBe(join(userDataDir, 'codex-home'));
    expect(home).not.toBe(userHome);

    // The user's real file is byte-identical + mtime unchanged (never touched).
    const after = await stat(userConfig);
    expect(await readFile(userConfig, 'utf8')).toBe(original);
    expect(after.mtimeMs).toBe(before.mtimeMs);

    // The scoped clone carries the escalated mode + preserves user settings + comments.
    const scoped = await readScopedConfig(home);
    expect(scoped).toContain('sandbox_mode = "workspace-write"');
    expect(scoped).toContain('# my codex config');
    expect(scoped).toContain('model = "gpt-5"');
    expect(scoped).toContain('[features]');
    expect(scoped).toContain('hooks = true');
  });

  it('defaults the scoped sandbox_mode to read-only', async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    const home = await materializeNativeCodexHome(userDataDir, undefined, userConfig, userAuth);
    const parsed = parseToml(await readScopedConfig(home)) as { sandbox_mode?: string; model?: string };
    expect(parsed.sandbox_mode).toBe('read-only');
    expect(parsed.model).toBe('gpt-5');
  });

  it('overrides an existing user sandbox_mode with the escalated mode in the scoped clone', async () => {
    await writeFile(userConfig, ['model = "gpt-5"', 'sandbox_mode = "read-only"', ''].join('\n'), 'utf8');
    const home = await materializeNativeCodexHome(userDataDir, 'danger-full-access', userConfig, userAuth);
    const parsed = parseToml(await readScopedConfig(home)) as { sandbox_mode?: string };
    expect(parsed.sandbox_mode).toBe('danger-full-access');
    // And the user's file still says read-only.
    const parsedUser = parseToml(await readFile(userConfig, 'utf8')) as { sandbox_mode?: string };
    expect(parsedUser.sandbox_mode).toBe('read-only');
  });

  it("symlinks the scoped auth.json at the user's real auth.json (native login survives)", async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    await writeFile(userAuth, JSON.stringify({ tokens: { access_token: 'acc' } }), 'utf8');

    const home = await materializeNativeCodexHome(userDataDir, 'read-only', userConfig, userAuth);
    const scopedAuth = join(home, 'auth.json');

    // It is a symlink pointing at the user's real auth.json.
    const link = await lstat(scopedAuth);
    expect(link.isSymbolicLink()).toBe(true);
    expect(await readlink(scopedAuth)).toBe(userAuth);

    // Reading through the link yields the user's token.
    const seen = JSON.parse(await readFile(scopedAuth, 'utf8')) as { tokens?: { access_token?: string } };
    expect(seen.tokens?.access_token).toBe('acc');
  });

  it("a token refresh written through the scoped auth.json lands in the user's real file", async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    await writeFile(userAuth, JSON.stringify({ tokens: { access_token: 'old' } }), 'utf8');

    const home = await materializeNativeCodexHome(userDataDir, 'read-only', userConfig, userAuth);
    // Simulate codex-acp refreshing the token INSIDE the scoped home.
    await writeFile(join(home, 'auth.json'), JSON.stringify({ tokens: { access_token: 'refreshed' } }), 'utf8');

    const userSide = JSON.parse(await readFile(userAuth, 'utf8')) as { tokens?: { access_token?: string } };
    expect(userSide.tokens?.access_token).toBe('refreshed');
  });

  it('re-materialization replaces a stale scoped auth.json (relinks to the current user path)', async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    const home = join(userDataDir, 'codex-home');
    // First spawn: user not logged in yet, then a stale plain file gets left behind.
    await materializeNativeCodexHome(userDataDir, 'read-only', userConfig, join(userHome, 'absent.json'));
    await writeFile(join(home, 'auth.json'), 'stale', 'utf8');

    // Now the user logs in; re-materialize must replace the stale file with a link.
    await writeFile(userAuth, JSON.stringify({ tokens: { access_token: 'fresh' } }), 'utf8');
    await materializeNativeCodexHome(userDataDir, 'read-only', userConfig, userAuth);

    const scopedAuth = join(home, 'auth.json');
    expect((await lstat(scopedAuth)).isSymbolicLink()).toBe(true);
    expect(await readlink(scopedAuth)).toBe(userAuth);
  });

  it('does not create a scoped auth.json when the user has none (graceful skip)', async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    const home = await materializeNativeCodexHome(userDataDir, 'read-only', userConfig, join(userHome, 'nope.json'));
    await expect(lstat(join(home, 'auth.json'))).rejects.toThrow();
  });

  it('degrades gracefully when the user has no config or auth (still writes a valid scoped config)', async () => {
    const home = await materializeNativeCodexHome(
      userDataDir,
      'read-only',
      join(userHome, 'nope.toml'),
      join(userHome, 'nope.json')
    );
    const parsed = parseToml(await readScopedConfig(home)) as { sandbox_mode?: string };
    expect(parsed.sandbox_mode).toBe('read-only');
  });
});
