/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getSection,
  mutateConfig,
  readConfig,
  resolveUserConfigPath,
  setSection,
} from '@process/agent/wcore/configBridge';
import {
  applyWcoreConfigPatch,
  isRawEngineModeIntent,
  parseRawEngineModePreference,
  projectWcoreBrowserPolicyRequest,
  readWcoreBrowserPolicyRequest,
  validateWcoreBrowserPolicy,
  validateWcoreConfigPatch,
  withEffectiveConfigTarget,
  WCORE_BROWSER_POLICY_PROJECTION_SCHEMA,
  WCORE_EDITABLE_MEMORY_SCHEMA,
} from '@process/bridge/wcoreConfigBridge';
import { withProfileAuthorityLock } from '@process/agent/wcore/profilePaths';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wcore-config-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('readConfig', () => {
  it('returns {} for a missing file', async () => {
    const result = await readConfig(join(dir, 'config.toml'));
    expect(result).toEqual({});
  });

  it('parses the entire file into a plain object', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(path, '[tools]\nallow_list = ["ls"]\n\n[custom]\nfoo = "bar"\n', 'utf-8');
    const result = await readConfig(path);
    expect(result.tools).toEqual({ allow_list: ['ls'] });
    expect(result.custom).toEqual({ foo: 'bar' });
  });
});

describe('getSection', () => {
  it('returns the typed section value', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(path, '[tools]\nauto_approve = true\nallow_list = ["ls", "cat"]\n', 'utf-8');
    const tools = await getSection<{ auto_approve: boolean; allow_list: string[] }>('tools', path);
    expect(tools).toEqual({ auto_approve: true, allow_list: ['ls', 'cat'] });
  });

  it('returns undefined for an absent section', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(path, '[tools]\nallow_list = []\n', 'utf-8');
    expect(await getSection('memory', path)).toBeUndefined();
  });
});

describe('setSection', () => {
  it('updates the targeted section and preserves unknown sections', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(path, '[custom]\nkeep = "me"\n\n[tools]\nallow_list = ["old"]\nauto_approve = false\n', 'utf-8');

    await setSection('tools', { allow_list: ['ls'] }, path);

    const after = await readConfig(path);
    expect(after.tools).toEqual({ allow_list: ['ls'] });
    // Unknown section must survive a round-trip (parse whole / re-stringify whole).
    expect(after.custom).toEqual({ keep: 'me' });
  });

  it('creates the file (and parent dir) on first write to a nonexistent path', async () => {
    const path = join(dir, 'nested', 'config.toml');
    await setSection('security', { sandbox: true }, path);
    const after = await readConfig(path);
    expect(after.security).toEqual({ sandbox: true });
  });

  it('writes atomically via a temp file + rename (no .tmp leftover, no truncation)', async () => {
    const path = join(dir, 'config.toml');
    const big = Array.from({ length: 5000 }, (_, i) => `item-${i}`);

    await setSection('tools', { allow_list: big }, path);

    const after = await readConfig(path);
    expect((after.tools as { allow_list: string[] }).allow_list).toHaveLength(5000);

    // A truncate-in-place write would leave a partial file; rename-over leaves
    // exactly one file and no temp artifact in the directory.
    const entries = await readdir(dir);
    expect(entries.filter((e) => e.includes('.tmp'))).toHaveLength(0);
    expect(entries).toContain('config.toml');
  });

  it('serializes concurrent writes to different sections (no lost update)', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(path, '[tools]\nallow_list = []\n', 'utf-8');

    // Fire both without awaiting between them - the single-flight lock must
    // serialize the read-modify-write so neither section is clobbered.
    await Promise.all([
      setSection('tools', { allow_list: ['ls'] }, path),
      setSection('memory', { enabled: true }, path),
    ]);

    const after = await readConfig(path);
    expect(after.tools).toEqual({ allow_list: ['ls'] });
    expect(after.memory).toEqual({ enabled: true });
  });
});

describe('atomic typed field patches', () => {
  it('preserves concurrent sibling edits queued behind a held config mutation lock', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(
      path,
      '[builtin_tools.script]\nenabled = false\nlabel = "keep-script"\n\n[builtin_tools.repomap]\nenabled = true\nlabel = "keep-repomap"\n',
      'utf-8'
    );
    let release!: () => void;
    let entered!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lockEntered = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const holder = mutateConfig(async (config) => {
      entered();
      await barrier;
      config.unrelated = { retained: true };
      return { value: undefined, changed: true };
    }, path);
    await lockEntered;

    const script = applyWcoreConfigPatch({ section: 'builtin_tools', field: 'script.enabled', value: true }, path);
    const repomap = applyWcoreConfigPatch({ section: 'builtin_tools', field: 'repomap.enabled', value: false }, path);
    release();
    await Promise.all([holder, script, repomap]);

    const after = await readConfig(path);
    expect(after.unrelated).toEqual({ retained: true });
    expect(after.builtin_tools).toEqual({
      script: { enabled: true, label: 'keep-script' },
      repomap: { enabled: false, label: 'keep-repomap' },
    });
  });

  it('does not resolve or enter an implicit config operation while profile authority is held', async () => {
    let release!: () => void;
    let entered!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lockEntered = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const profileMutation = withProfileAuthorityLock(async () => {
      entered();
      await barrier;
    });
    await lockEntered;

    let operationEntered = false;
    const patch = withEffectiveConfigTarget(async () => {
      operationEntered = true;
    });
    await Promise.resolve();
    expect(operationEntered).toBe(false);

    release();
    await Promise.all([profileMutation, patch]);
    expect(operationEntered).toBe(true);
  });

  it('preserves unknown section keys while independently patching every supported surface', async () => {
    const path = join(dir, 'config.toml');
    await writeFile(path, '[tools]\nskills = ["keep"]\n\n[memory]\nfuture = "keep"\n', 'utf-8');

    await Promise.all([
      applyWcoreConfigPatch({ section: 'tools', field: 'allow_list', value: ['Read'] }, path),
      applyWcoreConfigPatch({ section: 'default', field: 'approval_mode', value: 'auto-edit' }, path),
      applyWcoreConfigPatch({ section: 'memory', field: 'enabled', value: false }, path),
    ]);

    const after = await readConfig(path);
    expect(after.tools).toEqual({ skills: ['keep'], allow_list: ['Read'] });
    expect(after.default).toEqual({ approval_mode: 'auto-edit' });
    expect(after.memory).toEqual({
      future: 'keep',
      enabled: false,
    });
  });

  it.each([
    [{ section: 'default', field: 'model', value: 'attacker/model' }, 'default.approval_mode is invalid'],
    [{ section: 'default', field: 'approval_mode', value: 'yolo' }, 'default.approval_mode is invalid'],
    [{ section: 'builtin_tools', field: 'arbitrary.enabled', value: true }, 'only boolean builtin'],
    [{ section: 'builtin_tools', field: 'script.enabled', value: 'true' }, 'only boolean builtin'],
    [{ section: 'memory', field: 'provider', value: 'x' }, 'only memory.enabled'],
    [{ section: 'memory', field: 'provider', value: 'local' }, 'only memory.enabled'],
    [{ section: 'memory', field: 'recall_budget', value: 5000 }, 'only memory.enabled'],
    [{ section: 'memory', field: 'auto_consolidate', value: true }, 'only memory.enabled'],
  ])('rejects an out-of-contract intent %#', (intent, message) => {
    expect(validateWcoreConfigPatch(intent)).toContain(message);
  });

  it('rejects extras, accessors, custom prototypes, and inherited fields before reading values', () => {
    expect(validateWcoreConfigPatch({ section: 'memory', field: 'enabled', value: true, extra: true })).toContain(
      'exact plain data object'
    );
    const accessor = Object.defineProperty({ section: 'memory', field: 'enabled' }, 'value', {
      enumerable: true,
      get: () => true,
    });
    expect(validateWcoreConfigPatch(accessor)).toContain('exact plain data object');
    expect(
      validateWcoreConfigPatch(
        Object.assign(Object.create({ inherited: true }), { section: 'memory', field: 'enabled', value: true })
      )
    ).toContain('exact plain data object');
    expect(validateWcoreConfigPatch(Object.create({ section: 'memory', field: 'enabled', value: true }))).toContain(
      'exact plain data object'
    );
    const symbolExtra = { section: 'memory', field: 'enabled', value: true };
    Object.defineProperty(symbolExtra, Symbol('extra'), { value: true });
    expect(validateWcoreConfigPatch(symbolExtra)).toContain('exact plain data object');
    const sparse: string[] = [];
    sparse.length = 2;
    sparse[1] = 'Read';
    expect(validateWcoreConfigPatch({ section: 'tools', field: 'allow_list', value: sparse })).toContain(
      'only tools.allow_list'
    );
  });

  it('pins the editable UI schema to the bundled Core v0.12.25 MemoryConfig', () => {
    expect(WCORE_EDITABLE_MEMORY_SCHEMA).toEqual({
      coreVersion: '0.12.25',
      producerFields: ['enabled', 'dream_cycle_throttle_secs', 'decay_interval_secs', 'embedder'],
      editableFields: ['enabled'],
    });
  });
});

describe('browser policy producer parity', () => {
  it('accepts public IPv4 literals and public hostname patterns', () => {
    expect(
      validateWcoreBrowserPolicy({
        defaultAction: 'deny',
        allowedOrigins: ['example.com', '*.example.org', '1.1.1.1'],
        deniedOrigins: [],
      })
    ).toBeNull();
  });

  it('accepts public IPv6 literals supported by the bundled Core policy', () => {
    expect(
      validateWcoreBrowserPolicy({
        defaultAction: 'deny',
        allowedOrigins: ['2001:4860:4860::8888', '::8.8.8.8'],
        deniedOrigins: ['2606:4700:4700::1111'],
      })
    ).toBeNull();
  });

  it.each(['127.0.0.1', '10.0.0.1', '100.64.0.1', '169.254.169.254', '192.168.1.1', '224.0.0.1'])(
    'rejects Core-hard-blocked IPv4 literal %s',
    (origin) => {
      expect(
        validateWcoreBrowserPolicy({ defaultAction: 'allow', allowedOrigins: [origin], deniedOrigins: [] })
      ).toContain('public host patterns');
    }
  );

  it.each([
    '::',
    '::0',
    '::1',
    '::127.0.0.1',
    '::7f00:1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'ff02::1',
    '::ffff:0.0.0.0',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
  ])('rejects Core-hard-blocked IPv6 literal %s', (origin) => {
    expect(
      validateWcoreBrowserPolicy({ defaultAction: 'allow', allowedOrigins: [origin], deniedOrigins: [] })
    ).toContain('public host patterns');
  });

  it.each(['*.1.1.1', '*.2001:4860:4860::8888'])('rejects nonsensical wildcard IP pattern %s', (origin) => {
    expect(
      validateWcoreBrowserPolicy({ defaultAction: 'allow', allowedOrigins: [origin], deniedOrigins: [] })
    ).toContain('public host patterns');
  });

  it('does not fabricate a requested policy when the Browser section or policy is absent', () => {
    expect(readWcoreBrowserPolicyRequest({})).toBeNull();
    expect(readWcoreBrowserPolicyRequest({ browser: { user_agent: 'Wayland' } })).toBeNull();
  });

  it('reads only the exact requested policy stored in the selected Core config', () => {
    expect(
      readWcoreBrowserPolicyRequest({
        browser: {
          policy: {
            default_action: 'ask',
            allowed_origins: ['example.com'],
            denied_origins: ['blocked.example.com'],
          },
        },
      })
    ).toEqual({
      defaultAction: 'ask',
      allowedOrigins: ['example.com'],
      deniedOrigins: ['blocked.example.com'],
    });
  });

  it.each([
    { browser: null },
    { browser: 'policy' },
    { browser: [] },
    { browser: { policy: null } },
    {
      browser: {
        policy: { default_action: 'deny', allowed_origins: [], denied_origins: [], future_claim: true },
      },
    },
    { browser: { policy: { default_action: 'deny', allowed_origins: [] } } },
  ])('fails closed on malformed or unknown requested-policy evidence %#', (config) => {
    expect(() => readWcoreBrowserPolicyRequest(config as Record<string, unknown>)).toThrow(/malformed|unknown/);
  });

  it('projects requested truth against one exact runtime identity without claiming enforcement', () => {
    const source = { defaultAction: 'deny' as const, allowedOrigins: ['example.com'], deniedOrigins: [] };
    const projection = projectWcoreBrowserPolicyRequest(source, {
      mode: 'desktop-managed',
      profile: 'default',
      profileApplied: true,
      waylandHomeInjected: true,
      desktopModelOverrideApplied: true,
      desktopPromptOverlayApplied: true,
      selectedConnectorsAuthority: 'desktop',
      teamBridgePolicy: 'host-preserved',
      toolCredentialPolicy: 'allowlisted-host-forwarding',
      hostProtocolAuthority: 'desktop',
      engineConfigDir: '/profiles/default',
      engineConfigPath: '/profiles/default/config.toml',
      desktopConfigDir: '/desktop',
      desktopConfigPath: '/desktop/wayland-config.txt',
    });

    expect(WCORE_BROWSER_POLICY_PROJECTION_SCHEMA).toEqual({
      schemaVersion: 1,
      coreVersion: '0.12.25',
      effectiveState: 'producer-evidence-unavailable',
      restartState: 'unknown',
    });
    expect(projection).toEqual({
      schemaVersion: 1,
      coreVersion: '0.12.25',
      source: {
        mode: 'desktop-managed',
        profile: 'default',
        engineConfigPath: '/profiles/default/config.toml',
        desktopConfigPath: '/desktop/wayland-config.txt',
      },
      requested: {
        policy: source,
      },
      effective: null,
      effectiveState: 'producer-evidence-unavailable',
      restartState: 'unknown',
    });
    source.allowedOrigins.push('later.example.com');
    expect(projection.requested?.policy.allowedOrigins).toEqual(['example.com']);
  });

  it('exposes the inspected config identity even when no requested policy exists', () => {
    const projection = projectWcoreBrowserPolicyRequest(null, {
      mode: 'raw-engine',
      profile: null,
      profileApplied: false,
      waylandHomeInjected: false,
      desktopModelOverrideApplied: false,
      desktopPromptOverlayApplied: false,
      selectedConnectorsAuthority: 'engine',
      teamBridgePolicy: 'host-preserved',
      toolCredentialPolicy: 'allowlisted-host-forwarding',
      hostProtocolAuthority: 'engine',
      engineConfigDir: '/standalone',
      engineConfigPath: '/standalone/config.toml',
      desktopConfigDir: '/desktop',
      desktopConfigPath: '/desktop/wayland-config.txt',
    });

    expect(projection.requested).toBeNull();
    expect(projection.source).toEqual({
      mode: 'raw-engine',
      profile: null,
      engineConfigPath: '/standalone/config.toml',
      desktopConfigPath: '/desktop/wayland-config.txt',
    });
    expect(projection.effective).toBeNull();
    expect(projection.effectiveState).toBe('producer-evidence-unavailable');
    expect(projection.restartState).toBe('unknown');
  });

  it('refuses to project an invalid caller-supplied requested policy', () => {
    expect(() =>
      projectWcoreBrowserPolicyRequest(
        { defaultAction: 'allow', allowedOrigins: ['localhost'], deniedOrigins: [] },
        {} as never
      )
    ).toThrow('Requested Core Browser policy is invalid');
  });
});

describe('raw engine mode intent truth', () => {
  it('defaults only an absent preference and preserves stored booleans', () => {
    expect(parseRawEngineModePreference(undefined)).toBe(false);
    expect(parseRawEngineModePreference(false)).toBe(false);
    expect(parseRawEngineModePreference(true)).toBe(true);
  });

  it.each([null, 'false', 0, {}, []])('fails closed on malformed stored preference %#', (value) => {
    expect(() => parseRawEngineModePreference(value)).toThrow('stored raw engine mode is invalid');
  });

  it('accepts only an exact plain boolean intent', () => {
    expect(isRawEngineModeIntent({ enabled: true })).toBe(true);
    expect(isRawEngineModeIntent({ enabled: false })).toBe(true);
    expect(isRawEngineModeIntent({ enabled: 'true' })).toBe(false);
    expect(isRawEngineModeIntent({ enabled: true, extra: true })).toBe(false);
    expect(isRawEngineModeIntent(Object.assign(Object.create({}), { enabled: true }))).toBe(false);
    expect(isRawEngineModeIntent(Object.create({ enabled: true }))).toBe(false);
    expect(
      isRawEngineModeIntent(
        Object.defineProperty({}, 'enabled', {
          enumerable: true,
          get: () => true,
        })
      )
    ).toBe(false);
  });
});

describe('resolveUserConfigPath', () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('honors WAYLAND_HOME (config.toml directly inside it)', () => {
    process.env.WAYLAND_HOME = dir;
    expect(resolveUserConfigPath()).toBe(join(dir, 'config.toml'));
  });

  it('falls back to XDG_DATA_HOME/wayland-core when WAYLAND_HOME is unset', () => {
    delete process.env.WAYLAND_HOME;
    process.env.XDG_DATA_HOME = dir;
    expect(resolveUserConfigPath()).toBe(join(dir, 'wayland-core', 'config.toml'));
  });
});
