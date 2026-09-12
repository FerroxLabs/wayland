import fs from 'node:fs';
import path from 'node:path';

/**
 * Fuigo launch contract. Everything Desktop must tell the bundled engine that
 * a generic ACP backend does not need, in one place so the spawn layer and
 * the session layer cannot drift apart.
 *
 * Fuigo 1.0.13 is the first release-stamped binary, which turned two things
 * on that 1.0.7 (a dev-stamped build) silently skipped:
 *   - folder trust: with stdin not a TTY, an untrusted cwd resolves
 *     `Untrusted` without a prompt and project instructions/skills/MCP are
 *     dropped. Desktop is the consent authority, so its workspace trust is
 *     forwarded as the hidden `--trust` flag (persisted by Fuigo in
 *     `$FUIGO_HOME/trusted_folders.toml`).
 *   - `startupHints.nonInteractive` (1.0.12): stops advertising
 *     `ask_user_question` and skips the billed per-turn title/summary side
 *     calls. Set for unattended (scheduled) runs only.
 */

/** One engine home for every conversation, so memory, MCP config, trust
 *  grants and the model cache carry across chats. Sessions are keyed by cwd
 *  inside Fuigo, so sharing the home does not mix conversations. */
export function fuigoHomeDir(userDataDir: string): string {
  return path.join(userDataDir, 'fuigo');
}

/**
 * Desktop-managed `$FUIGO_HOME/config.toml`, rewritten before every spawn.
 *
 * `[plugins] auto_discover = false` is the only way to stop Fuigo importing
 * the user's Claude Code plugin marketplace (`~/.claude/plugins/installed_plugins.json`)
 * and dialling every MCP server those plugins declare — there is no env
 * switch for it, unlike the vendor-compat surfaces. Seen live on the ACP
 * stdio path: 9 worker spawns per session against the user's hosted Notion,
 * Supabase, Stripe, HF, Asana, Slack and Vercel connectors, each failing OAuth.
 */
export const FUIGO_MANAGED_CONFIG = `# Managed by Wayland Desktop. Rewritten at every engine start; edits do not persist.
[plugins]
auto_discover = false
`;

export function ensureFuigoHome(homeDir: string): void {
  fs.mkdirSync(homeDir, { recursive: true, mode: 0o700 });
  const file = path.join(homeDir, 'config.toml');
  let current: string | undefined;
  try {
    current = fs.readFileSync(file, 'utf8');
  } catch {
    /* absent */
  }
  if (current !== FUIGO_MANAGED_CONFIG) fs.writeFileSync(file, FUIGO_MANAGED_CONFIG, { mode: 0o600 });
}

/** Global flags go before the `agent` subcommand; `stdio` is the ACP transport. */
export function buildFuigoAcpArgs(opts: { trusted: boolean }): string[] {
  return ['--permission-mode', 'default', ...(opts.trusted ? ['--trust'] : []), 'agent', 'stdio'];
}

/**
 * Fuigo's vendor-compat layer auto-discovers Claude Code, Cursor and Codex
 * state from the user's home (`~/.claude.json` MCP servers, `~/.claude/skills`,
 * rules, agents, hooks, sessions) and connects to every MCP server it finds.
 * Under Desktop that is the wrong authority: Desktop provisions MCP servers on
 * `session/new`, stages skills into `$FUIGO_HOME/skills` and carries the persona
 * on `_meta`. Seen live: a fresh FUIGO_HOME in a throwaway cwd spawned workers
 * for the user's Notion/Supabase/Stripe/Slack/Vercel connectors and failed
 * their OAuth. Env beats config and remote flags in Fuigo's resolver.
 */
export const FUIGO_COMPAT_VENDORS = ['CLAUDE', 'CURSOR', 'CODEX'] as const;
export const FUIGO_COMPAT_SURFACES = ['SKILLS', 'RULES', 'AGENTS', 'MCPS', 'HOOKS', 'SESSIONS'] as const;

export function fuigoCompatIsolationEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const vendor of FUIGO_COMPAT_VENDORS)
    for (const surface of FUIGO_COMPAT_SURFACES) env[`FUIGO_${vendor}_${surface}_ENABLED`] = '0';
  return env;
}

/** `_meta` for `session/new` / `session/load`. Fuigo reads `startupHints`
 *  from the session request first, then from `initialize`. */
export function buildFuigoSessionMetadata(opts: { nonInteractive: boolean }): Record<string, unknown> {
  return {
    clientIdentifier: 'wayland-desktop',
    clientType: 'desktop',
    startupHints: { nonInteractive: opts.nonInteractive },
  };
}

/** Fuigo never emits `usage_update`; per-prompt usage rides the prompt
 *  response `_meta.usage` (`PromptUsage`, camelCase). Cost is in USD ticks,
 *  1e10 per dollar, and is absent when Fuigo scrubbed it as untrustworthy. */
export const FUIGO_USD_TICKS_PER_USD = 1e10;

export type FuigoPromptUsage = {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  /** undefined when Fuigo scrubbed or never had a trusted cost. */
  costUsd?: number;
  incomplete: boolean;
};

const nonNegative = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

export function extractFuigoPromptUsage(meta: unknown): FuigoPromptUsage | null {
  if (!meta || typeof meta !== 'object') return null;
  const usage = (meta as { usage?: unknown }).usage;
  if (!usage || typeof usage !== 'object') return null;
  const u = usage as Record<string, unknown>;
  const ticks = u.costUsdTicks;
  const costUsd =
    typeof ticks === 'number' && Number.isFinite(ticks) && ticks >= 0 && u.costIsPartial !== true
      ? ticks / FUIGO_USD_TICKS_PER_USD
      : undefined;
  return {
    totalTokens: nonNegative(u.totalTokens),
    inputTokens: nonNegative(u.inputTokens),
    outputTokens: nonNegative(u.outputTokens),
    costUsd,
    incomplete: u.usageIsIncomplete === true,
  };
}
