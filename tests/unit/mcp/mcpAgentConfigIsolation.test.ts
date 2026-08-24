/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LANE 1 / DELIVERABLE 1, at the adapters.
 *
 * The seam only helps if EVERY adapter goes through it. Two shapes have to be
 * covered separately:
 *
 *   - adapters that resolve the path themselves (CodeBuddy, OpenCode), and
 *   - adapters that shell out, where the CHILD picks the path and the only
 *     lever we have is the environment we hand it.
 *
 * An adapter that missed the second half would look isolated in a path test and
 * still write to the customer's real `~/.claude.json`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { IMcpServer } from '@/common/config/storage';

const { execFileSpy } = vi.hoisted(() => ({ execFileSpy: vi.fn(async () => ({ stdout: 'removed', stderr: '' })) }));

vi.mock('@process/utils/safeExec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/utils/safeExec')>();
  return { ...actual, safeExecFile: execFileSpy, safeExec: vi.fn(async () => ({ stdout: '', stderr: '' })) };
});
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: '/usr/bin' }) }));

import { AGENT_CONFIG_ROOT_ENV } from '@process/services/mcpServices/agentConfigRoot';
import { ClaudeMcpAgent } from '@process/services/mcpServices/agents/ClaudeMcpAgent';
import { CodexMcpAgent } from '@process/services/mcpServices/agents/CodexMcpAgent';
import { GeminiMcpAgent } from '@process/services/mcpServices/agents/GeminiMcpAgent';
import { QwenMcpAgent } from '@process/services/mcpServices/agents/QwenMcpAgent';
import { CodebuddyMcpAgent } from '@process/services/mcpServices/agents/CodebuddyMcpAgent';
import { OpencodeMcpAgent } from '@process/services/mcpServices/agents/OpencodeMcpAgent';

let sandbox: string;
const priorEnv = process.env[AGENT_CONFIG_ROOT_ENV];

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
  vi.clearAllMocks();
  execFileSpy.mockResolvedValue({ stdout: 'removed', stderr: '' });
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'w4a-iso-'));
  process.env[AGENT_CONFIG_ROOT_ENV] = sandbox;
});

afterEach(() => {
  if (priorEnv === undefined) delete process.env[AGENT_CONFIG_ROOT_ENV];
  else process.env[AGENT_CONFIG_ROOT_ENV] = priorEnv;
  fs.rmSync(sandbox, { recursive: true, force: true });
});

/** Every env a shell-out adapter handed to the child, across all its calls. */
function envsPassedToChildren(): NodeJS.ProcessEnv[] {
  return execFileSpy.mock.calls.map(
    (call) => (call as unknown as [string, string[], { env: NodeJS.ProcessEnv }])[2].env
  );
}

/**
 * A STRUCTURAL guard, not a behavioural one, and it earned its place the hard
 * way: while proving these tests fail when the seam is broken, one mutation
 * replaced `agentConfigPath(...)` with `os.homedir()` in a single line of
 * OpencodeMcpAgent - and the very next test run wrote a connector entry into
 * the developer's REAL `~/.config/opencode/opencode.json`. The behavioural test
 * caught it (it went red), but only AFTER the write had happened. One line is
 * all it takes, and no env var outside this seam stops it.
 */
describe('no adapter can reach the real home directly', () => {
  it('no file under agents/ imports os', () => {
    const dir = path.join(__dirname, '../../../src/process/services/mcpServices/agents');
    const offenders = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.ts'))
      .filter((file) => {
        const source = fs.readFileSync(path.join(dir, file), 'utf-8');
        // Strip comments so the prose explaining WHY os is banned is not itself
        // an offender.
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        return /from\s+['"](node:)?os['"]/.test(code) || /require\(\s*['"](node:)?os['"]\s*\)/.test(code);
      });
    expect(offenders).toEqual([]);
  });

  it('no file under agents/ calls homedir()', () => {
    const dir = path.join(__dirname, '../../../src/process/services/mcpServices/agents');
    const offenders = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.ts'))
      .filter((file) => {
        const source = fs.readFileSync(path.join(dir, file), 'utf-8');
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        return /homedir\s*\(/.test(code);
      });
    expect(offenders).toEqual([]);
  });
});

describe('every MCP agent adapter honours the config-root override', () => {
  it.each([
    ['claude', () => new ClaudeMcpAgent()],
    ['codex', () => new CodexMcpAgent()],
    ['gemini', () => new GeminiMcpAgent()],
    ['qwen', () => new QwenMcpAgent()],
  ])('%s publishes with a redirected home, never the real one', async (_name, make) => {
    await make().installMcpServers([server]);

    const envs = envsPassedToChildren();
    expect(envs.length).toBeGreaterThan(0);
    for (const env of envs) {
      expect(env.HOME).toBe(sandbox);
      expect(env.USERPROFILE).toBe(sandbox);
      expect(env.CLAUDE_CONFIG_DIR).toBe(path.join(sandbox, '.claude'));
      expect(env.CODEX_HOME).toBe(path.join(sandbox, '.codex'));
      expect(env.XDG_CONFIG_HOME).toBe(path.join(sandbox, '.config'));
      // The exact assertion this whole lane exists for.
      expect(env.HOME).not.toBe(os.homedir());
    }
  });

  it.each([
    ['claude', () => new ClaudeMcpAgent()],
    ['codex', () => new CodexMcpAgent()],
    ['gemini', () => new GeminiMcpAgent()],
    ['qwen', () => new QwenMcpAgent()],
  ])('%s removes with a redirected home too', async (_name, make) => {
    await make().removeMcpServer('com-ferroxlabs-tvcontrol');
    const envs = envsPassedToChildren();
    expect(envs.length).toBeGreaterThan(0);
    for (const env of envs) expect(env.HOME).toBe(sandbox);
  });

  it('CodeBuddy reads its config out of the sandbox, not the real home', async () => {
    fs.mkdirSync(path.join(sandbox, '.codebuddy'), { recursive: true });
    fs.writeFileSync(
      path.join(sandbox, '.codebuddy', 'mcp.json'),
      JSON.stringify({ mcpServers: { 'sandbox-only': { command: '/bin/echo', disabled: true } } })
    );

    const detected = await new CodebuddyMcpAgent().detectMcpServers();
    expect(detected.map((s) => s.name)).toEqual(['sandbox-only']);
  });

  it('OpenCode writes into the sandbox and leaves the real home untouched', async () => {
    const result = await new OpencodeMcpAgent().installMcpServers([server]);
    expect(result.success).toBe(true);

    const written = path.join(sandbox, '.config', 'opencode', 'opencode.json');
    expect(fs.existsSync(written)).toBe(true);
    expect(JSON.parse(fs.readFileSync(written, 'utf-8')).mcp).toHaveProperty('com-ferroxlabs-tvcontrol');
  });
});
