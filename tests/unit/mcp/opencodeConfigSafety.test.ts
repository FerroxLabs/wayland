/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE THREAT MODEL, executed. `~/.config/opencode/opencode.json` is a file
 * OpenCode owns and reads on startup. Wayland writing into it must never:
 *   (1) leave it invalid JSON,
 *   (2) drop a sibling entry the customer put there,
 *   (3) leave a truncated file if the process dies mid-write.
 *
 * The previous implementation failed all three: a bare `fs.writeFileSync` with
 * no round-trip check and no temp+rename, fed by `this.readConfig() || {}` -
 * which swallowed a parse or permission error into `{}` and then wrote that
 * back, erasing every provider, model and key the customer had.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { IMcpServer } from '@/common/config/storage';

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: '/usr/bin' }) }));

import { AGENT_CONFIG_ROOT_ENV } from '@process/services/mcpServices/agentConfigRoot';
import { OpencodeMcpAgent } from '@process/services/mcpServices/agents/OpencodeMcpAgent';

let sandbox: string;
let configPath: string;
const priorEnv = process.env[AGENT_CONFIG_ROOT_ENV];

/** A realistic user-owned opencode.json: siblings we must never touch. */
const USER_CONFIG = {
  $schema: 'https://opencode.ai/config.json',
  theme: 'tokyonight',
  model: 'anthropic/claude-sonnet-4',
  provider: {
    flux: { options: { baseURL: 'https://api.fluxrouter.ai/v1', apiKey: 'sk-user-key' } },
  },
  mcp: {
    'the-customers-own-server': { type: 'local', command: ['/usr/local/bin/mine'], enabled: true },
  },
  keybinds: { leader: 'ctrl+x' },
};

const server: IMcpServer = {
  id: 'mcp-tv',
  name: 'com-ferroxlabs-tvcontrol',
  enabled: true,
  status: 'disconnected',
  transport: { type: 'stdio', command: 'bunx', args: ['--bun', '@ferroxlabs/tvcontrol@2.3.1'] },
  createdAt: 1,
  updatedAt: 2,
};

beforeEach(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'w4a-oc-'));
  process.env[AGENT_CONFIG_ROOT_ENV] = sandbox;
  configPath = path.join(sandbox, '.config', 'opencode', 'opencode.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(USER_CONFIG, null, 2)}\n`);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (priorEnv === undefined) delete process.env[AGENT_CONFIG_ROOT_ENV];
  else process.env[AGENT_CONFIG_ROOT_ENV] = priorEnv;
  fs.rmSync(sandbox, { recursive: true, force: true });
});

describe('OpenCode config is never corrupted by a publication', () => {
  it('(2) keeps every sibling key and every sibling MCP entry', async () => {
    const result = await new OpencodeMcpAgent().installMcpServers([server]);
    expect(result.success).toBe(true);

    const after = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(after.$schema).toBe(USER_CONFIG.$schema);
    expect(after.theme).toBe('tokyonight');
    expect(after.model).toBe('anthropic/claude-sonnet-4');
    expect(after.provider).toEqual(USER_CONFIG.provider);
    expect(after.keybinds).toEqual({ leader: 'ctrl+x' });
    // The customer's own MCP entry survives alongside ours.
    expect(after.mcp['the-customers-own-server']).toEqual(USER_CONFIG.mcp['the-customers-own-server']);
    expect(after.mcp['com-ferroxlabs-tvcontrol']).toBeDefined();
  });

  it('(2) removal deletes only our entry, never a sibling', async () => {
    await new OpencodeMcpAgent().installMcpServers([server]);
    const result = await new OpencodeMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('applied');

    const after = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(after.mcp['com-ferroxlabs-tvcontrol']).toBeUndefined();
    expect(after.mcp['the-customers-own-server']).toEqual(USER_CONFIG.mcp['the-customers-own-server']);
    expect(after.provider).toEqual(USER_CONFIG.provider);
  });

  it('(1) refuses to publish over a config it could not parse, rather than replacing it', async () => {
    fs.writeFileSync(configPath, '{ this is not json at all ');
    const before = fs.readFileSync(configPath, 'utf-8');

    const result = await new OpencodeMcpAgent().installMcpServers([server]);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe('failed');
    // The customer's file is byte-identical. The old code wrote `{mcp:{...}}`
    // over it and the rest of their config was gone.
    expect(fs.readFileSync(configPath, 'utf-8')).toBe(before);
  });

  it('(1) never leaves the file as invalid JSON after a successful publish', async () => {
    await new OpencodeMcpAgent().installMcpServers([server]);
    expect(() => JSON.parse(fs.readFileSync(configPath, 'utf-8'))).not.toThrow();
  });

  it('(3) writes through a temp sibling and a rename, so a crash cannot truncate the real file', async () => {
    const renameSpy = vi.spyOn(fs.promises, 'rename');

    await new OpencodeMcpAgent().installMcpServers([server]);

    // The real path is only ever reached by rename(tmp -> target).
    const renamedInto = renameSpy.mock.calls.map((call) => String(call[1]));
    expect(renamedInto).toContain(configPath);

    // The temp source is a SIBLING in the same directory. That is what makes
    // the rename atomic - a cross-filesystem rename degrades to copy+unlink,
    // which has a window where the target is truncated.
    const tmpSource = renameSpy.mock.calls.map((call) => String(call[0])).find((src) => src !== configPath);
    expect(tmpSource).toBeDefined();
    expect(path.dirname(tmpSource as string)).toBe(path.dirname(configPath));

    // No temp file survives a successful write.
    expect(fs.readdirSync(path.dirname(configPath))).toEqual(['opencode.json']);
  });

  it('(3) a crash before the rename leaves the original intact', async () => {
    const before = fs.readFileSync(configPath, 'utf-8');
    vi.spyOn(fs.promises, 'rename').mockRejectedValueOnce(new Error('process died before rename'));

    const result = await new OpencodeMcpAgent().installMcpServers([server]);

    expect(result.success).toBe(false);
    expect(fs.readFileSync(configPath, 'utf-8')).toBe(before);
  });

  it('reports an absent server as already-absent, which is a SUCCESS', async () => {
    const result = await new OpencodeMcpAgent().removeMcpServer('never-installed');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('already-absent');
  });
});
