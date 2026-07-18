/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renameControl = vi.hoisted(() => ({
  before: null as null | ((from: string, to: string) => Promise<void>),
}));
const unlinkControl = vi.hoisted(() => ({
  before: null as null | ((target: string) => Promise<void>),
}));
const openControl = vi.hoisted(() => ({
  before: null as null | ((target: string) => Promise<void>),
  seen: [] as string[],
}));

vi.mock('node:fs/promises', async (orig) => {
  const actual = await orig<typeof import('node:fs/promises')>();
  return {
    ...actual,
    rename: async (from: Parameters<typeof actual.rename>[0], to: Parameters<typeof actual.rename>[1]) => {
      await renameControl.before?.(String(from), String(to));
      return actual.rename(from, to);
    },
    unlink: async (target: Parameters<typeof actual.unlink>[0]) => {
      await unlinkControl.before?.(String(target));
      return actual.unlink(target);
    },
    open: async (
      target: Parameters<typeof actual.open>[0],
      flags: Parameters<typeof actual.open>[1],
      mode?: Parameters<typeof actual.open>[2]
    ) => {
      const rendered = String(target);
      openControl.seen.push(rendered);
      await openControl.before?.(rendered);
      return actual.open(target, flags, mode);
    },
  };
});

// profileStore imports ipcBridge from '@/common' (for initWcoreProfileIpc, which
// we never call here) - stub it so the module loads in a node test env.
vi.mock('@/common', () => ({ ipcBridge: { wcoreProfiles: {} } }));

// Root the profiles/native dirs at a scratch home.
let home: string;
vi.mock('node:os', async (orig) => {
  const actual = await orig<typeof import('node:os')>();
  return { ...actual, homedir: () => home };
});

import {
  activateProfile,
  cloneProfile,
  createProfile,
  listProfiles,
  removeProfile,
} from '@process/agent/wcore/profileStore';
import {
  DEFAULT_PROFILE,
  acquireProfileLaunchLease,
  getActiveProfile,
  nativeConfigDir,
  profilesRoot,
  resolveActiveConfigDir,
  resolveProfileDir,
} from '@process/agent/wcore/profilePaths';

const ORIGINAL_ENV = { ...process.env };

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'wcore-store-'));
  renameControl.before = null;
  unlinkControl.before = null;
  openControl.before = null;
  openControl.seen = [];
  delete process.env.WAYLAND_HOME;
  delete process.env.XDG_DATA_HOME;
});

afterEach(async () => {
  process.env = { ...ORIGINAL_ENV };
  renameControl.before = null;
  unlinkControl.before = null;
  openControl.before = null;
  openControl.seen = [];
  await rm(home, { recursive: true, force: true }).catch(() => {});
});

describe('listProfiles - per-profile stats from the isolated config tree', () => {
  it('reads model + tool count + skill count + dir for a named profile', async () => {
    const dir = await resolveProfileDir('work');
    await mkdir(join(dir, 'skills', 'alpha'), { recursive: true });
    await mkdir(join(dir, 'skills', 'beta'), { recursive: true });
    await writeFile(
      join(dir, 'config.toml'),
      '[default]\nprovider = "anthropic"\nmodel = "anthropic/claude-opus-4.8"\n\n[tools]\nallow_list = ["ls", "cat", "grep"]\n',
      'utf-8'
    );
    // Make "work" the active profile.
    await mkdir(profilesRoot(), { recursive: true });
    await writeFile(join(profilesRoot(), 'active'), 'work\n', 'utf-8');

    const profiles = await listProfiles();
    const work = profiles.find((p) => p.name === 'work');
    expect(work).toBeTruthy();
    expect(work?.active).toBe(true);
    expect(work?.model).toBe('anthropic/claude-opus-4.8');
    expect(work?.tools).toBe(3);
    expect(work?.skills).toBe(2);
    // dir is realpath'd (macOS /var -> /private/var), so compare by suffix.
    expect(work?.dir?.endsWith(join('wayland-core-profiles', 'work'))).toBe(true);
    expect(typeof work?.updatedAt).toBe('number');
  });

  it('OMITS stats (no fabricated zeros) for a profile with no config yet', async () => {
    await mkdir(join(profilesRoot(), 'empty'), { recursive: true });
    const profiles = await listProfiles();
    const empty = profiles.find((p) => p.name === 'empty');
    expect(empty).toBeTruthy();
    expect(empty?.model).toBeUndefined();
    expect(empty?.tools).toBeUndefined();
    expect(empty?.skills).toBeUndefined();
    expect(empty?.updatedAt).toBeUndefined();
  });

  it('always lists the implicit default profile', async () => {
    const profiles = await listProfiles();
    expect(profiles.some((p) => p.kind === 'native' && p.name === 'Default')).toBe(true);
  });

  it('lists explicit recovery targets without silently promoting an invalid active marker', async () => {
    await mkdir(join(profilesRoot(), 'work'), { recursive: true });
    await writeFile(join(profilesRoot(), 'active'), '../escape\n', 'utf-8');

    const profiles = await listProfiles();

    expect(profiles.map((profile) => profile.name)).toEqual(['Default', 'work']);
    expect(profiles.every((profile) => profile.active === false)).toBe(true);
    await expect(getActiveProfile()).rejects.toThrow('active-profile marker is invalid');
  });
});

describe('profile mutation authority and rollback', () => {
  it('clones the real native default profile into a named isolated profile', async () => {
    const source = nativeConfigDir();
    await mkdir(join(source, 'skills', 'writer'), { recursive: true });
    await writeFile(
      join(source, 'config.toml'),
      [
        '[default]',
        'model = "native-model"',
        '[bedrock]',
        'region = "us-east-1"',
        'access_key_id = "AKIA-SECRET"',
        'secret_access_key = "bedrock-secret"',
        'session_token = "bedrock-session"',
        '[vertex]',
        'project_id = "safe-project"',
        'service_account_json = "{ private_key = secret }"',
        '[providers.anthropic]',
        'base_url = "https://api.anthropic.com"',
        'api_key = "sk-live-provider"',
        '[providers.credential_url]',
        'base_url = "https://provider-user:provider-password-live@api.example.com/v1"',
        '[providers.query_url]',
        'url = "https://api.example.com/v1?api_key=provider-query-live"',
        '[providers.fragment_url]',
        'url = "https://api.example.com/v1#provider-fragment-live"',
        '[compat]',
        'azure_auth_mode = "aad-bearer"',
        'auth_fallback_base_url = "https://api.minimaxi.com"',
        'api_key_env = "ANTHROPIC_API_KEY"',
        '[channels.telegram]',
        'bot_token = "telegram-compound-live"',
        '[hooks]',
        'webhook_secret = "webhook-compound-live"',
        'clientPassword = "mixed-case-password-live"',
        'AuthorizationToken = "mixed-case-token-live"',
        '[unsafe_exceptions]',
        'api_key_env = "sk-direct-secret"',
        'azure_auth_mode = "Bearer mode-secret"',
        'auth_fallback_base_url = "https://user:url-password-live@example.com"',
        '[unsafe_query]',
        'auth_fallback_base_url = "https://api.example.com/v1?token=query-secret-live"',
        '[unsafe_fragment]',
        'auth_fallback_base_url = "https://api.example.com/v1#fragment-secret-live"',
        '[mcp.servers.firecrawl]',
        'transport = "stdio"',
        'command = "npx"',
        'args = ["-y", "firecrawl-mcp", "--token", "mcp-argv-live"]',
        'env = { FIRECRAWL_API_KEY = "fc-live" }',
        'headers = { Authorization = "Bearer live-token" }',
        '[mcp.servers.safe_http]',
        'transport = "streamable_http"',
        'url = "https://mcp.example.com/v1"',
        '[mcp.servers.credential_http]',
        'transport = "streamable_http"',
        'url = "https://mcp-user:mcp-password-live@mcp.example.com/v1"',
        '[mcp.servers.query_http]',
        'transport = "streamable_http"',
        'url = "https://mcp.example.com/v1?token=mcp-query-live"',
        '',
      ].join('\n'),
      'utf-8'
    );
    await writeFile(join(source, '.env'), 'OPENAI_API_KEY=sk-dotenv\n', 'utf-8');
    await mkdir(join(source, 'channels'), { recursive: true });
    await writeFile(join(source, 'channels', 'telegram.toml'), 'bot_token = "telegram-live"\n', 'utf-8');
    await writeFile(join(source, 'memory.db'), 'native-memory', 'utf-8');
    await writeFile(join(source, 'memory.db-wal'), 'native-memory-wal', 'utf-8');
    await writeFile(join(source, 'credentials.enc'), 'ciphertext', 'utf-8');
    await writeFile(join(source, 'credentials.kdf.json'), '{"salt":"secret"}', 'utf-8');
    await writeFile(join(source, 'credentials.toml'), '[secrets]\nOPENAI_API_KEY = "sk-live"\n', 'utf-8');
    await writeFile(join(source, 'credentials.future'), 'future-secret', 'utf-8');
    await writeFile(join(source, 'credentials'), 'bare-secret', 'utf-8');
    await mkdir(join(source, 'oauth'), { recursive: true });
    await writeFile(join(source, 'oauth', 'token.json'), '{"token":"secret"}', 'utf-8');
    await writeFile(join(source, 'skills', 'writer', 'SKILL.md'), 'native skill', 'utf-8');

    await cloneProfile(DEFAULT_PROFILE, 'work');
    const target = await resolveProfileDir('work');
    const clonedConfig = await readFile(join(target, 'config.toml'), 'utf-8');
    expect(clonedConfig).toContain('native-model');
    expect(clonedConfig).toContain('safe-project');
    expect(clonedConfig).toContain('https://api.anthropic.com');
    expect(clonedConfig).toContain('azure_auth_mode = "aad-bearer"');
    expect(clonedConfig).toContain('auth_fallback_base_url = "https://api.minimaxi.com"');
    expect(clonedConfig).toContain('api_key_env = "ANTHROPIC_API_KEY"');
    expect(clonedConfig).toContain('command = "npx"');
    expect(clonedConfig).toContain('url = "https://mcp.example.com/v1"');
    expect(clonedConfig).not.toMatch(/^args\s*=/m);
    for (const secret of [
      'AKIA-SECRET',
      'bedrock-secret',
      'bedrock-session',
      'private_key',
      'sk-live-provider',
      'telegram-compound-live',
      'webhook-compound-live',
      'mixed-case-password-live',
      'mixed-case-token-live',
      'sk-direct-secret',
      'mode-secret',
      'url-password-live',
      'query-secret-live',
      'fragment-secret-live',
      'fc-live',
      'Bearer live-token',
      'provider-password-live',
      'provider-query-live',
      'provider-fragment-live',
      'mcp-argv-live',
      'mcp-password-live',
      'mcp-query-live',
    ]) {
      expect(clonedConfig).not.toContain(secret);
    }
    await expect(readFile(join(target, 'skills', 'writer', 'SKILL.md'), 'utf-8')).resolves.toBe('native skill');
    await Promise.all(
      [
        'memory.db',
        'memory.db-wal',
        'credentials.enc',
        'credentials.kdf.json',
        'credentials.toml',
        'credentials.future',
        'credentials',
        'oauth',
        '.env',
        'channels',
      ].map((excluded) => expect(lstat(join(target, excluded))).rejects.toMatchObject({ code: 'ENOENT' }))
    );
  });

  it('keeps the native home distinct from Core\'s valid named profile "default"', async () => {
    await createProfile('default');
    const namedDefault = await resolveProfileDir('default');
    expect((await lstat(namedDefault)).isDirectory()).toBe(true);
    await activateProfile('default');
    await expect(getActiveProfile()).resolves.toBe('default');
    await expect(resolveActiveConfigDir()).resolves.toBe(namedDefault);
    await activateProfile(DEFAULT_PROFILE);
    await expect(getActiveProfile()).resolves.toBe(DEFAULT_PROFILE);
    await expect(resolveActiveConfigDir()).resolves.toBe(nativeConfigDir());
  });

  it('rejects a missing named clone source and never creates the source or target', async () => {
    await expect(cloneProfile('missing', 'target')).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(lstat(join(profilesRoot(), 'missing'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(lstat(join(profilesRoot(), 'target'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects nested links during clone and removes the reserved target', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'wcore-clone-outside-'));
    const source = await resolveProfileDir('source');
    await mkdir(source, { recursive: true });
    await writeFile(join(outside, 'config.toml'), '[default]\nmodel = "outside"\n', 'utf-8');
    await symlink(join(outside, 'config.toml'), join(source, 'config.toml'));

    await expect(cloneProfile('source', 'target')).rejects.toThrow(/symbolic link/);
    await expect(lstat(join(profilesRoot(), 'target'))).rejects.toMatchObject({ code: 'ENOENT' });
    await rm(outside, { recursive: true, force: true });
  });

  it('activates default without creating the invisible profiles/default orphan', async () => {
    await activateProfile(DEFAULT_PROFILE);
    await expect(getActiveProfile()).resolves.toBe(DEFAULT_PROFILE);
    await expect(lstat(join(profilesRoot(), 'default'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects an unsafe profile tree before changing the active marker', async () => {
    await createProfile('safe');
    await activateProfile('safe');
    await createProfile('unsafe');
    const outside = join(home, 'outside-config.toml');
    await writeFile(outside, '[default]\nmodel = "outside"\n', 'utf-8');
    await symlink(outside, join(await resolveProfileDir('unsafe'), 'config.toml'));

    await expect(activateProfile('unsafe')).rejects.toThrow('symbolic link');
    await expect(getActiveProfile()).resolves.toBe('safe');
  });

  it('publishes default before moving an active profile so concurrent resolution never recreates a blank profile', async () => {
    await createProfile('work');
    const work = await resolveProfileDir('work');
    await writeFile(join(work, 'config.toml'), '[default]\nmodel = "work"\n', 'utf-8');
    await activateProfile('work');

    let releaseRename!: () => void;
    let renameReached!: () => void;
    const blocked = new Promise<void>((resolve) => {
      releaseRename = resolve;
    });
    const reached = new Promise<void>((resolve) => {
      renameReached = resolve;
    });
    renameControl.before = async (from) => {
      if (from === work) {
        renameReached();
        await blocked;
      }
    };

    const removing = removeProfile('work');
    await reached;
    await expect(resolveActiveConfigDir()).resolves.toBe(nativeConfigDir());
    await expect(getActiveProfile()).resolves.toBe(DEFAULT_PROFILE);
    releaseRename();
    await removing;
    await expect(lstat(work)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not move an active profile when default-marker publication fails', async () => {
    await createProfile('work');
    const work = await resolveProfileDir('work');
    await writeFile(join(work, 'config.toml'), '[default]\nmodel = "work"\n', 'utf-8');
    await activateProfile('work');
    unlinkControl.before = async (target) => {
      if (target.endsWith('active')) throw new Error('marker publication denied');
    };

    await expect(removeProfile('work')).rejects.toThrow('marker publication denied');
    expect((await lstat(work)).isDirectory()).toBe(true);
    await expect(getActiveProfile()).resolves.toBe('work');
  });

  it('does not remove a profile while a running Core launch lease owns it', async () => {
    await createProfile('work');
    await activateProfile('work');
    const work = await resolveActiveConfigDir();
    const release = await acquireProfileLaunchLease(work);

    await activateProfile(DEFAULT_PROFILE);
    await expect(removeProfile('work')).rejects.toThrow('in use by a running Wayland Core conversation');
    expect((await lstat(work)).isDirectory()).toBe(true);

    await release();
    await removeProfile('work');
    await expect(lstat(work)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects a symlinked archive root without moving profile data outside the profiles boundary', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'wcore-trash-outside-'));
    await createProfile('work');
    const work = await resolveProfileDir('work');
    await writeFile(join(work, 'config.toml'), '[default]\nmodel = "work"\n', 'utf-8');
    await symlink(outside, join(profilesRoot(), '.trash'), 'dir');

    await expect(removeProfile('work')).rejects.toThrow(/archive root must be a real directory/);
    expect((await lstat(work)).isDirectory()).toBe(true);
    expect(await lstat(outside)).toBeTruthy();
    await expect(readdir(outside)).resolves.toEqual([]);

    await rm(outside, { recursive: true, force: true });
  });

  it('flushes both directory boundaries before reporting archive success', async () => {
    await createProfile('work');
    const root = profilesRoot();
    const trash = join(root, '.trash');

    await removeProfile('work');

    expect(openControl.seen).toContain(root);
    expect(openControl.seen).toContain(trash);
    await expect(lstat(join(root, 'work'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect((await readdir(trash)).some((entry) => entry.startsWith('work-'))).toBe(true);
  });

  it('surfaces archive durability failure and rolls the profile move back', async () => {
    await createProfile('work');
    const root = profilesRoot();
    const trash = join(root, '.trash');
    let failedOnce = false;
    openControl.before = async (target) => {
      if (target === trash && !failedOnce) {
        failedOnce = true;
        throw new Error('directory sync denied');
      }
    };

    await expect(removeProfile('work')).rejects.toThrow('directory sync denied');

    expect((await lstat(join(root, 'work'))).isDirectory()).toBe(true);
    await expect(readdir(trash)).resolves.toEqual([]);
  });
});
