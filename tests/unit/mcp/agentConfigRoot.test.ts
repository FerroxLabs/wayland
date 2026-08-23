/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LANE 1 / DELIVERABLE 1. Wayland publishes MCP entries into files it does not
 * own, at hardcoded `os.homedir()` paths, with NO override of any kind. That is
 * why the path could not be exercised safely and why it reached a real
 * `~/.claude.json`.
 *
 * These tests pin the seam: the default is production, the override is honoured
 * for both the paths WE resolve and the paths a CHILD CLI resolves, and a
 * relative override is refused rather than resolved against `process.cwd()`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  AGENT_CONFIG_ROOT_ENV,
  agentConfigCliEnv,
  agentConfigPath,
  agentConfigRoot,
  isAgentConfigRootOverridden,
} from '@process/services/mcpServices/agentConfigRoot';

let sandbox: string;
const priorEnv = process.env[AGENT_CONFIG_ROOT_ENV];

beforeEach(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'w4a-seam-'));
  delete process.env[AGENT_CONFIG_ROOT_ENV];
});

afterEach(() => {
  if (priorEnv === undefined) delete process.env[AGENT_CONFIG_ROOT_ENV];
  else process.env[AGENT_CONFIG_ROOT_ENV] = priorEnv;
  fs.rmSync(sandbox, { recursive: true, force: true });
});

describe('agent config root seam', () => {
  it('defaults to the real home so production behaviour is unchanged', () => {
    expect(isAgentConfigRootOverridden()).toBe(false);
    expect(agentConfigRoot()).toBe(os.homedir());
    expect(agentConfigPath('.codebuddy', 'mcp.json')).toBe(path.join(os.homedir(), '.codebuddy', 'mcp.json'));
  });

  it('redirects every resolved config path when the override is set', () => {
    process.env[AGENT_CONFIG_ROOT_ENV] = sandbox;
    expect(isAgentConfigRootOverridden()).toBe(true);
    expect(agentConfigRoot()).toBe(sandbox);
    expect(agentConfigPath('.codebuddy', 'mcp.json')).toBe(path.join(sandbox, '.codebuddy', 'mcp.json'));
    // The point of the whole exercise: nothing under the real home.
    expect(agentConfigPath('.codebuddy', 'mcp.json').startsWith(os.homedir())).toBe(false);
  });

  it('is read live, not captured at module load', () => {
    expect(agentConfigRoot()).toBe(os.homedir());
    process.env[AGENT_CONFIG_ROOT_ENV] = sandbox;
    expect(agentConfigRoot()).toBe(sandbox);
    delete process.env[AGENT_CONFIG_ROOT_ENV];
    expect(agentConfigRoot()).toBe(os.homedir());
  });

  it('refuses a relative override instead of resolving it against the cwd', () => {
    process.env[AGENT_CONFIG_ROOT_ENV] = 'agents';
    expect(() => agentConfigRoot()).toThrow(/must be an absolute path/);
  });

  it('treats a blank override as unset', () => {
    process.env[AGENT_CONFIG_ROOT_ENV] = '   ';
    expect(isAgentConfigRootOverridden()).toBe(false);
    expect(agentConfigRoot()).toBe(os.homedir());
  });

  describe('child-process redirection', () => {
    it('adds nothing to the environment in production', () => {
      const base = { PATH: '/usr/bin', HOME: '/Users/real' } as NodeJS.ProcessEnv;
      expect(agentConfigCliEnv(base)).toBe(base);
    });

    it('overrides every home-ish variable the agent CLIs honour', () => {
      process.env[AGENT_CONFIG_ROOT_ENV] = sandbox;
      const env = agentConfigCliEnv({ PATH: '/usr/bin', HOME: '/Users/real' } as NodeJS.ProcessEnv);

      // Measured against the real binaries on 2026-08-23: `claude` follows
      // CLAUDE_CONFIG_DIR, `qwen`/`gemini` follow HOME, `codex` follows
      // CODEX_HOME. Missing any one of them leaves that CLI writing to the
      // customer's real config.
      expect(env.HOME).toBe(sandbox);
      expect(env.USERPROFILE).toBe(sandbox);
      expect(env.XDG_CONFIG_HOME).toBe(path.join(sandbox, '.config'));
      expect(env.CLAUDE_CONFIG_DIR).toBe(path.join(sandbox, '.claude'));
      expect(env.CODEX_HOME).toBe(path.join(sandbox, '.codex'));
      // Everything else is carried through untouched.
      expect(env.PATH).toBe('/usr/bin');
    });

    it('creates the sub-directories, because codex refuses a CODEX_HOME that does not exist', () => {
      process.env[AGENT_CONFIG_ROOT_ENV] = path.join(sandbox, 'fresh');
      agentConfigCliEnv({} as NodeJS.ProcessEnv);
      for (const dir of ['.claude', '.codex', '.config', '.qwen', '.gemini', '.codebuddy']) {
        expect(fs.existsSync(path.join(sandbox, 'fresh', dir))).toBe(true);
      }
    });
  });
});
