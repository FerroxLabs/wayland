/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { FLUX_MODEL_IDS } from '@/common/config/flux';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Materialize a Wayland-scoped CLAUDE_CONFIG_DIR for Flux-routed claude spawns.
 *
 * Why this exists: the claude-agent-acp bridge will only accept a model id that
 * is NOT one of its SDK slots (default/opus/sonnet/haiku) when that id appears in
 * the `availableModels` allowlist of the user settings.json it reads from
 * `<CLAUDE_CONFIG_DIR>/settings.json`. Without the allowlist, `ANTHROPIC_MODEL=
 * flux-auto` silently falls back to the `default` slot (which the Flux Anthropic
 * surface rejects with HTTP 400), and any `session/set_model('flux-auto')` is
 * rejected by the SDK ("model flux-auto may not exist"). Listing the Flux ids in
 * `availableModels` makes the bridge treat `flux-auto` as a first-class, literal
 * model value: `resolveModelPreference` matches it, `ANTHROPIC_MODEL=flux-auto`
 * resolves, and the request goes out as `model=flux-auto`.
 *
 * R13-safe: the user's real `~/.claude/settings.json` is never modified. We point
 * CLAUDE_CONFIG_DIR at a scoped, disposable dir and SEED its settings.json from
 * the real one (shallow) so user-level keys (permissions defaultMode, effortLevel,
 * env, model) still apply on a Flux turn, then add the Flux ids to availableModels.
 *
 * @param userDataDir  Electron `app.getPath('userData')`.
 * @param realClaudeDir  The user's real claude config dir (defaults to ~/.claude);
 *                       only its `settings.json` is read, for seeding.
 * @returns the scoped CLAUDE_CONFIG_DIR path.
 */
export async function materializeFluxClaudeConfigDir(
  userDataDir: string,
  realClaudeDir: string = join(homedir(), '.claude'),
  /** Per-conversation reasoning effort. When set, overrides the seeded `effortLevel`. */
  effort?: 'low' | 'medium' | 'high'
): Promise<string> {
  const configDir = join(userDataDir, 'flux-claude-home');
  const settingsPath = join(configDir, 'settings.json');

  // Seed ONLY the model-relevant keys from the user's real settings.json so a
  // Flux turn keeps the user's permission mode / effort / existing allowlist,
  // WITHOUT copying hooks, mcpServers, enabledPlugins, statusLine, etc. (the
  // claude binary reads the full settings.json from CLAUDE_CONFIG_DIR and would
  // otherwise run all the user's hooks and load every MCP server on each Flux
  // turn). `model` is deliberately NOT carried: ANTHROPIC_MODEL=flux-auto drives
  // selection. Missing or malformed files are ignored (the bridge does the same).
  //
  // Dropping `hooks` is deliberate and stays that way, but it is no longer
  // SILENT: see `readDroppedUserHookEvents` below, which AcpAgentManager uses to
  // tell the user in the chat which of their own hook events this turn will not
  // run (#1027). Silent non-enforcement of a user's own policy was the defect.
  let real: Record<string, unknown> = {};
  try {
    const raw = await readFile(join(realClaudeDir, 'settings.json'), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      real = parsed as Record<string, unknown>;
    }
  } catch {
    // ENOENT or invalid JSON: fall through to a minimal allowlist-only settings.
  }

  const existing = Array.isArray(real.availableModels) ? (real.availableModels as unknown[]).filter(Boolean) : [];
  const availableModels = Array.from(new Set([...existing.map(String), ...FLUX_MODEL_IDS]));

  const settings: Record<string, unknown> = { availableModels };
  if (real.permissions !== undefined) settings.permissions = real.permissions;
  if (real.effortLevel !== undefined) settings.effortLevel = real.effortLevel;
  // Per-conversation effort takes precedence over the seeded user-level value.
  if (effort !== undefined) settings.effortLevel = effort;

  await mkdir(configDir, { recursive: true });
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  return configDir;
}

/**
 * The hook EVENT names the user configured at user level (`~/.claude/
 * settings.json` -> `hooks`), which a Flux-routed claude turn does NOT run.
 *
 * `materializeFluxClaudeConfigDir` deliberately omits `hooks` from the scoped
 * settings it seeds, and that omission stays: the claude binary reads the whole
 * settings.json from `CLAUDE_CONFIG_DIR`, so seeding them would execute the
 * user's arbitrary hook commands on every Flux turn. What was wrong is that the
 * drop was SILENT (#1027) - a user who wrote a `PreToolUse` hook to enforce
 * their own policy got non-enforcement with nothing saying so, and the same
 * hook still fired on a native turn, so the behaviour read as intermittent
 * rather than routed.
 *
 * Only user-level hooks are affected; project- and local-level hooks reach the
 * agent through the bridge's other setting sources and still fire.
 *
 * Never throws: a missing, unreadable or malformed settings.json means "nothing
 * was dropped", because nothing was configured that we could drop.
 */
export async function readDroppedUserHookEvents(realClaudeDir: string = join(homedir(), '.claude')): Promise<string[]> {
  try {
    const raw = await readFile(join(realClaudeDir, 'settings.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    const hooks = (parsed as Record<string, unknown>).hooks;
    if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) return [];
    return Object.keys(hooks as Record<string, unknown>);
  } catch {
    return [];
  }
}

/**
 * The sentence shown in the chat when a Flux-routed claude turn drops the
 * user's own hooks. Empty string when nothing was dropped, so the caller can
 * splice it in unconditionally and a user with no hooks is never told anything.
 */
export function buildDroppedUserHooksNotice(events: readonly string[]): string {
  if (events.length === 0) return '';
  return (
    `This chat is routed through Flux, and your user-level Claude Code hooks ` +
    `(${events.join(', ')}) do not run on a Flux-routed turn. ` +
    `Project-level and local-level hooks are unaffected. ` +
    `Pick a native Claude model for this chat if you need those hooks enforced.`
  );
}
