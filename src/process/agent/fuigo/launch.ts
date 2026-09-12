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

/**
 * One BYOK model as Fuigo's `[model.<id>]` config entry (`ConfigModelOverride`,
 * `fuigo-shell/src/agent/config.rs`; user guide `11-custom-models.md`).
 *
 * The API key is NEVER written: `env_key` names the process env var that
 * carries it, and the spawn layer sets that var from the provider row. Fuigo
 * resolves `api_key` → `env_key` → session token → `FUIGO_API_KEY`, so a
 * per-entry `env_key` keeps a BYOK model off the Flux key.
 *
 * `apiBackend`: `messages` is the Anthropic Messages protocol (`/v1/messages`,
 * credential in `x-api-key`, protocol version header required);
 * `chat_completions` is OpenAI Chat Completions (`/v1/chat/completions`,
 * bearer). Fuigo appends the endpoint path to `baseUrl`, so an Anthropic base
 * must end in `/v1` and an OpenAI-compatible one is the usual `.../v1`.
 */
export type FuigoByokModelEntry = {
  /** Catalog id sent on `session/set_model`; never a Flux id. */
  id: string;
  /** Picker label. */
  name: string;
  /** Model id sent to the provider. */
  model: string;
  baseUrl: string;
  apiBackend: 'chat_completions' | 'messages';
  /** Env var carrying the key. */
  envKey: string;
  contextWindow?: number;
};

/** TOML basic string: escape the backslash, the quote and control characters. */
function tomlString(value: string): string {
  // eslint-disable-next-line no-control-regex -- TOML basic strings must escape U+0000-U+001F and U+007F.
  return `"${value.replace(/[\\"\u0000-\u001f\u007f]/g, (c) => {
    if (c === '\\') return '\\\\';
    if (c === '"') return '\\"';
    return `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
  })}"`;
}

/** The managed config plus one `[model.<id>]` block per BYOK entry. */
export function buildFuigoManagedConfig(entries: readonly FuigoByokModelEntry[] = []): string {
  let out = FUIGO_MANAGED_CONFIG;
  for (const e of entries) {
    out += `\n[model.${tomlString(e.id)}]\n`;
    out += `model = ${tomlString(e.model)}\n`;
    out += `name = ${tomlString(e.name)}\n`;
    out += `base_url = ${tomlString(e.baseUrl)}\n`;
    out += `api_backend = ${tomlString(e.apiBackend)}\n`;
    out += `env_key = ${tomlString(e.envKey)}\n`;
    if (e.apiBackend === 'messages') {
      out += `auth_scheme = "x_api_key"\n`;
      out += `extra_headers = { "anthropic-version" = "2023-06-01" }\n`;
    }
    if (typeof e.contextWindow === 'number' && Number.isInteger(e.contextWindow) && e.contextWindow > 0) {
      out += `context_window = ${e.contextWindow}\n`;
    }
  }
  return out;
}

export function ensureFuigoHome(homeDir: string, config: string = FUIGO_MANAGED_CONFIG): void {
  fs.mkdirSync(homeDir, { recursive: true, mode: 0o700 });
  const file = path.join(homeDir, 'config.toml');
  let current: string | undefined;
  try {
    current = fs.readFileSync(file, 'utf8');
  } catch {
    /* absent */
  }
  if (current !== config) fs.writeFileSync(file, config, { mode: 0o600 });
}

/**
 * Global flags go before the `agent` subcommand; `stdio` is the ACP transport.
 *
 * No `--sandbox` (Fuigo's kernel sandbox: Seatbelt on darwin, Landlock on
 * linux, nothing on win32), on purpose. Measured on the staged 1.0.15 under
 * `--sandbox workspace`, from inside an MCP server Fuigo spawned on
 * `session/new` (the profile is process-wide, so every MCP child inherits
 * it): loopback HTTP to 127.0.0.1 OK, `node -e` subprocess OK, writes to the
 * temp dir OK, writes to `$HOME` and `~/.npm/_npx` EPERM. That last one is
 * every `npx`-launched connector — including the TC-TIDE brief's TVControl
 * fallback — so a chat with MCP servers must keep the sandbox OFF, and there
 * is no Desktop-side sandbox setting left to key it on (Core's `strict |
 * trusted_local_smart` profile lived in Core's own config.toml and went with
 * it). If a setting is ever added, default it off for any chat that carries
 * MCP servers.
 *
 * `--max-turns` is a top-level clap arg (`value_parser!(u32).range(1..)`) that
 * `run_agent_command` copies into `cli_agent_overrides.max_turns`, so it binds
 * the ACP session exactly as it binds headless mode. A non-positive or
 * non-integer value is dropped rather than forwarded: Fuigo rejects `0` at
 * argv parse time, which would kill the spawn instead of merely un-capping it.
 */
export function buildFuigoAcpArgs(opts: { trusted: boolean; maxTurns?: number }): string[] {
  const maxTurns =
    typeof opts.maxTurns === 'number' && Number.isInteger(opts.maxTurns) && opts.maxTurns >= 1
      ? ['--max-turns', String(opts.maxTurns)]
      : [];
  return ['--permission-mode', 'default', ...(opts.trusted ? ['--trust'] : []), ...maxTurns, 'agent', 'stdio'];
}

/**
 * Process budgets for UNATTENDED runs (routines, team runs): the engine-side
 * hard stop that replaced Core's BudgetController hard-stop + RunawayMonitor.
 *
 * Fuigo reads `FUIGO_MAX_MODEL_CALLS` / `FUIGO_MAX_RUNTIME_SECS` once per
 * process (`fuigo-sampler/src/execution_budget.rs`; positive integers; the
 * wall clock starts at process init and both are aggregate across every
 * session, model switch, subagent and side call in that process). Verified on
 * the staged 1.0.15 over stdio:
 *   - calls: the last admission is reserved for a final answer, then the
 *     prompt returns `-32603` whose `data` is the execution receipt
 *     (`partial: true`, `reason: "Execution stopped with bounded capacity …"`).
 *   - wall: a prompt past the deadline returns `-32602` with
 *     `data: "execution budget: wall deadline exhausted"`; a running turn is
 *     cancelled. The process stays alive either way.
 * A scheduled run is one process per run (the idle reaper SIGTERMs it), so a
 * per-process budget is a per-run budget. Core had no persisted keys for
 * these — its hard stops were fixed thresholds — so the defaults live here
 * and nothing is exposed in the UI.
 *
 * An interactive chat is deliberately uncapped: its process lives as long as
 * the user keeps talking, and a wall clock started at spawn would end a long
 * conversation mid-thought.
 */
export const FUIGO_UNATTENDED_MAX_MODEL_CALLS = 200;
export const FUIGO_UNATTENDED_MAX_RUNTIME_SECS = 3600;

export function fuigoBudgetEnv(opts: { unattended: boolean }): Record<string, string> {
  if (!opts.unattended) return {};
  return {
    FUIGO_MAX_MODEL_CALLS: String(FUIGO_UNATTENDED_MAX_MODEL_CALLS),
    FUIGO_MAX_RUNTIME_SECS: String(FUIGO_UNATTENDED_MAX_RUNTIME_SECS),
  };
}

const BUDGET_RECEIPT_REASON = /^Execution stopped with bounded capacity/;
const BUDGET_DATA = /^execution budget: (model dispatch limit|wall deadline) exhausted/;

/**
 * The user-facing reason when a prompt failed because Fuigo hit a process
 * budget, or null for any other failure. Reads the JSON-RPC `data` of the
 * prompt error (walking `cause`, since the ACP layer wraps the SDK error).
 */
export function describeFuigoBudgetStop(err: unknown): string | null {
  const minutes = Math.round(FUIGO_UNATTENDED_MAX_RUNTIME_SECS / 60);
  for (
    let e: unknown = err, depth = 0;
    e && typeof e === 'object' && depth < 4;
    e = (e as { cause?: unknown }).cause, depth++
  ) {
    const data = (e as { data?: unknown }).data;
    if (typeof data === 'string') {
      const m = BUDGET_DATA.exec(data.trim());
      if (m) {
        return m[1] === 'wall deadline'
          ? `Stopped by the run budget: this run passed its ${minutes}-minute limit. Work finished before the stop is kept; the next run starts fresh.`
          : `Stopped by the run budget: this run used all ${FUIGO_UNATTENDED_MAX_MODEL_CALLS} of its model calls. Work finished before the stop is kept; the next run starts fresh.`;
      }
      continue;
    }
    if (data && typeof data === 'object') {
      const r = data as { partial?: unknown; reason?: unknown };
      if (r.partial === true && typeof r.reason === 'string' && BUDGET_RECEIPT_REASON.test(r.reason)) {
        return `Stopped by the run budget: this run used all ${FUIGO_UNATTENDED_MAX_MODEL_CALLS} of its model calls before it finished. Work done so far is kept; the next run starts fresh.`;
      }
    }
  }
  return null;
}

/**
 * Fuigo's vendor-compat layer auto-discovers Claude Code, Cursor and Codex
 * state from the user's home (`~/.claude.json` MCP servers, `~/.claude/skills`,
 * rules, agents, hooks, sessions) and connects to every MCP server it finds.
 * Under Desktop that is the wrong authority: Desktop provisions MCP servers on
 * `session/new`, stages skills into `<workspace>/.wayland/skills` (passed as
 * `_meta.pluginDirs`) and carries the persona on `_meta`. Seen live: a fresh FUIGO_HOME in a throwaway cwd spawned workers
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

/**
 * Per-session plugin roots for `_meta.pluginDirs` on `session/new` / `session/load`.
 *
 * Fuigo loads each entry as a plugin at CliOverride scope (always trusted,
 * this session only); with no manifest a root is convention-based, and
 * `<root>/skills/<name>/SKILL.md` is exactly what setupAssistantWorkspace
 * stages under `<workspace>/.wayland`. The root must live inside the workspace:
 * a skill's scripts are read through Desktop's fs guard, which refuses paths
 * outside it (`$FUIGO_HOME` included). Entries are canonicalised and must be
 * absolute, existing directories or Fuigo drops them with a warning.
 */
export const FUIGO_WORKSPACE_PLUGIN_DIR = '.wayland';

export function fuigoPluginDirs(workspace: string): string[] {
  const root = path.resolve(workspace, FUIGO_WORKSPACE_PLUGIN_DIR);
  try {
    if (fs.statSync(path.join(root, 'skills')).isDirectory()) return [root];
  } catch {
    /* no staged skills (non-project custom workspace) */
  }
  return [];
}

/** `_meta` for `session/new` / `session/load`. Fuigo reads `startupHints`
 *  from the session request first, then from `initialize`. */
export function buildFuigoSessionMetadata(opts: {
  nonInteractive: boolean;
  pluginDirs?: string[];
}): Record<string, unknown> {
  return {
    clientIdentifier: 'wayland-desktop',
    clientType: 'desktop',
    startupHints: { nonInteractive: opts.nonInteractive },
    ...(opts.pluginDirs?.length ? { pluginDirs: opts.pluginDirs } : {}),
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

/**
 * Fuigo's prompt offload. A `session/prompt` over `LARGE_PROMPT_THRESHOLD`
 * (25,000 bytes, `prompt_build.rs`) is truncated to a preview, written to
 * `$FUIGO_HOME/sessions/<cwd>/<session>/prompts/prompt_N.txt`, and the model is
 * told to `read_file` it before answering. That read comes back to Desktop as
 * `fs/read_text_file`, and the workspace-only fs guard refused it ($FUIGO_HOME
 * is outside every workspace): the model then fell back to a terminal `cat`,
 * hit a permission prompt, and a fresh profile's first chat stalled for the
 * whole prompt timeout.
 *
 * True only for an existing regular `.txt` / `.md` file whose real path is
 * under `<home>/sessions/`; both sides are canonicalised with the same
 * libuv realpath so a symlink planted under `sessions/` cannot reach
 * `config.toml`, keys, or anything outside the tree. Read-only by contract:
 * the caller must never route `fs/write_text_file` through this.
 */
export function isFuigoSessionPromptFile(homeDir: string, filePath: string): boolean {
  let realSessions: string;
  let realFile: string;
  try {
    realSessions = fs.realpathSync.native(path.join(homeDir, 'sessions'));
    realFile = fs.realpathSync.native(filePath);
  } catch {
    return false;
  }
  if (!realFile.startsWith(realSessions + path.sep)) return false;
  const ext = path.extname(realFile).toLowerCase();
  if (ext !== '.txt' && ext !== '.md') return false;
  try {
    return fs.statSync(realFile).isFile();
  } catch {
    return false;
  }
}
