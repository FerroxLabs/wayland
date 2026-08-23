/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * THE ONE PLACE WAYLAND DECIDES WHERE ANOTHER PRODUCT'S CONFIG LIVES.
 *
 * Publishing an MCP connector means writing into files Wayland does not own -
 * `~/.claude.json`, `~/.qwen/settings.json`, `~/.gemini/settings.json`,
 * `~/.codebuddy/mcp.json`, `~/.config/opencode/opencode.json`, `~/.codex/` -
 * that other products read on startup. Until this module existed every adapter
 * resolved those paths with a bare `os.homedir()` and there was NO override of
 * any kind, which had two consequences:
 *
 *   1. The path could not be exercised by a test or an agent without editing
 *      the developer's own live configs. It reached them. An entry named
 *      `tvcontrol-broken` pointing at a path that does not exist was left in a
 *      real `~/.claude.json`, and every one of those tools tried to spawn it on
 *      startup.
 *   2. `WAYLAND_HOME` / `WAYLAND_DEV_PROFILE` do not help. They isolate
 *      Wayland's OWN state. They say nothing about where `claude` or `codex`
 *      writes.
 *
 * Setting {@link AGENT_CONFIG_ROOT_ENV} redirects BOTH halves of the problem:
 *
 *   - Adapters that write the file themselves (OpenCode, and CodeBuddy's read
 *     path) resolve through {@link agentConfigPath}.
 *   - Adapters that shell out to another product's CLI cannot resolve anything
 *     - the CHILD PROCESS picks the path. {@link agentConfigCliEnv} redirects
 *     the child instead, by overriding every home-ish variable those CLIs
 *     honour. Measured on 2026-08-23 against the real binaries: `claude`
 *     followed `CLAUDE_CONFIG_DIR`, `qwen` and `gemini` followed `HOME`, and
 *     `codex` followed `CODEX_HOME`, with the developer's real configs
 *     byte-identical (sha256) across 64 add/remove calls.
 *
 * DEFAULT IS PRODUCTION. With the variable unset this resolves to
 * `os.homedir()`, exactly as before, and {@link agentConfigCliEnv} adds
 * nothing at all to the child environment.
 */
export const AGENT_CONFIG_ROOT_ENV = 'WAYLAND_AGENT_CONFIG_ROOT';

/**
 * Read the override, or `undefined` when it is unset/blank.
 *
 * Read live from `process.env` on every call rather than captured at module
 * load: a test that sets the variable in `beforeEach` must be honoured, and a
 * module-load capture would freeze whichever value happened to exist when the
 * first importer pulled the module in.
 *
 * A RELATIVE path is rejected rather than resolved against `process.cwd()`.
 * The whole point of the override is to name a specific sandbox; silently
 * resolving `agents` against whatever directory the main process happens to be
 * in would produce a confident write to the wrong place.
 */
export function agentConfigRootOverride(): string | undefined {
  const raw = process.env[AGENT_CONFIG_ROOT_ENV];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  if (!path.isAbsolute(trimmed)) {
    throw new Error(
      `${AGENT_CONFIG_ROOT_ENV} must be an absolute path (got "${trimmed}"). ` +
        'It names the sandbox that stands in for the home directory of every third-party agent config.'
    );
  }
  return trimmed;
}

/** True when third-party agent config is being redirected away from the real home. */
export function isAgentConfigRootOverridden(): boolean {
  return agentConfigRootOverride() !== undefined;
}

/**
 * The directory that stands in for `$HOME` for every third-party agent config.
 * `os.homedir()` in production; the override when one is set.
 */
export function agentConfigRoot(): string {
  return agentConfigRootOverride() ?? os.homedir();
}

/** Join segments onto {@link agentConfigRoot}. The only way an adapter should build such a path. */
export function agentConfigPath(...segments: string[]): string {
  return path.join(agentConfigRoot(), ...segments);
}

/**
 * Home-ish variables the agent CLIs resolve their config against.
 *
 * `HOME`/`USERPROFILE` are the POSIX and Windows base. The other three are the
 * product-specific escapes those CLIs document, and they must be set as well:
 * a CLI that prefers its own variable would otherwise keep writing to the real
 * home even with `HOME` redirected, which is exactly the failure mode that
 * makes a "safe" test unsafe.
 */
const CLI_HOME_VARS = ['HOME', 'USERPROFILE', 'XDG_CONFIG_HOME', 'CLAUDE_CONFIG_DIR', 'CODEX_HOME'] as const;

/**
 * Sub-directories a redirected root must already contain. `codex` refuses to
 * create `CODEX_HOME` itself and warns "points to <path>, but that path does
 * not exist"; the others tolerate a missing directory but not all of them
 * create the parent. Creating them up front makes the override behave like a
 * real home for every CLI.
 */
const CLI_HOME_SUBDIRS = ['.claude', '.codex', '.config', '.qwen', '.gemini', '.codebuddy'] as const;

/**
 * Return `base` with every home-ish variable pointed at the override.
 *
 * Returns `base` UNCHANGED when no override is set, so production behaviour is
 * byte-identical to before this module existed.
 */
export function agentConfigCliEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const root = agentConfigRootOverride();
  if (root === undefined) return base;

  fs.mkdirSync(root, { recursive: true });
  for (const dir of CLI_HOME_SUBDIRS) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }

  const redirected: NodeJS.ProcessEnv = { ...base };
  for (const name of CLI_HOME_VARS) {
    redirected[name] = name === 'XDG_CONFIG_HOME' ? path.join(root, '.config') : root;
  }
  redirected.CLAUDE_CONFIG_DIR = path.join(root, '.claude');
  redirected.CODEX_HOME = path.join(root, '.codex');
  return redirected;
}
