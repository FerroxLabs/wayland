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
 *
 * `[claude_compat] imported = true` is Fuigo's "Claude import complete" marker.
 * With it set, every `~/.claude.json` MCP loader returns empty, so Desktop can
 * leave `FUIGO_CLAUDE_MCPS_ENABLED` ON (see `fuigoCompatIsolationEnv`) without
 * Fuigo dialling the user's own Claude Code servers. Both halves are needed:
 * the marker alone does not stop the kill-switch attribution described there,
 * and the env switch alone re-imports every user server.
 */
export const FUIGO_MANAGED_CONFIG = `# Managed by Wayland Desktop. Rewritten at every engine start; edits do not persist.
[plugins]
auto_discover = false

[claude_compat]
imported = true
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
  /** Request header → env var carrying its value (Azure's `api-key`); `env_http_headers`, never on disk. */
  envHttpHeaders?: Record<string, string>;
  contextWindow?: number;
  /**
   * The `reasoning_effort` values this MODEL accepts, written as Fuigo's
   * `reasoning_efforts` plus `supports_reasoning_effort = true`.
   *
   * Fuigo offers the ACP `reasoning_effort` config option only for a model
   * that declares support (auto-true for `messages`, otherwise off), and only
   * over the listed values, so an endpoint whose accepted set differs from
   * Fuigo's built-in menu must name its own. Set it only where every listed
   * value is known to succeed on this model: a value the model rejects does
   * not no-op, it fails the turn. Nothing here puts the field on the wire -
   * `reasoning_effort` stays unset until the session picks a value - and no
   * option is marked `default`, which would only preselect a row in the picker
   * without proving the request behind it works.
   */
  reasoningEfforts?: readonly string[];
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

/**
 * The managed config plus one `[model.<id>]` block per BYOK entry, and
 * `[models] default` when the caller names one (Fuigo reports it as the
 * session's `currentModelId` on `session/new`).
 */
export function buildFuigoManagedConfig(
  entries: readonly FuigoByokModelEntry[] = [],
  opts: { defaultModel?: string } = {}
): string {
  let out = FUIGO_MANAGED_CONFIG;
  if (opts.defaultModel) out += `\n[models]\ndefault = ${tomlString(opts.defaultModel)}\n`;
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
    const headers = Object.entries(e.envHttpHeaders ?? {});
    if (headers.length > 0) {
      out += `env_http_headers = { ${headers.map(([h, v]) => `${tomlString(h)} = ${tomlString(v)}`).join(', ')} }\n`;
    }
    if (typeof e.contextWindow === 'number' && Number.isInteger(e.contextWindow) && e.contextWindow > 0) {
      out += `context_window = ${e.contextWindow}\n`;
    }
    if (e.reasoningEfforts && e.reasoningEfforts.length > 0) {
      out += `supports_reasoning_effort = true\n`;
      out += `reasoning_efforts = [${e.reasoningEfforts.map(tomlString).join(', ')}]\n`;
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
 * the staged 1.0.15 and again on 1.0.19 over stdio:
 *   - calls: the last admission is reserved for a final answer, then the
 *     prompt returns `-32603` whose `data` is the execution receipt
 *     (`partial: true`, `reason: "Execution stopped with bounded capacity …"`;
 *     1.0.18+ adds `message` = reason and `error_kind: "execution_incomplete"`).
 *   - wall: a prompt past the deadline returns `-32602` with
 *     `data: "execution budget: wall deadline exhausted"` up to 1.0.17 and
 *     `data: {message: <that string>, error_kind: "invalid_request"}` from
 *     1.0.18; a running turn is cancelled. The process stays alive either way.
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
 *
 * Fuigo's terminal error `data` carries the budget text in two shapes and both
 * are live: 1.0.16 (the pinned engine, `scripts/fuigo/authority.json`) answers
 * `acp::Error::invalid_params().data(WALL_LIMIT)` — a bare string — while
 * 1.0.18 types every terminal error as an object
 * (`acp_error::invalid_params(WALL_LIMIT)` -> `{ message, error_kind }`), the
 * same shape `errorNormalize` reads elsewhere in this process. Matching only
 * the string left a wall-budget stop on 1.0.18 showing the generic
 * engine-failure banner with no explanation, so the budget text is matched
 * wherever it is: `data`, or `data.message`.
 */
export function describeFuigoBudgetStop(err: unknown): string | null {
  const minutes = Math.round(FUIGO_UNATTENDED_MAX_RUNTIME_SECS / 60);
  const fromBudgetText = (text: string): string | null => {
    const m = BUDGET_DATA.exec(text.trim());
    if (!m) return null;
    return m[1] === 'wall deadline'
      ? `Stopped by the run budget: this run passed its ${minutes}-minute limit. Work finished before the stop is kept; the next run starts fresh.`
      : `Stopped by the run budget: this run used all ${FUIGO_UNATTENDED_MAX_MODEL_CALLS} of its model calls. Work finished before the stop is kept; the next run starts fresh.`;
  };
  for (
    let e: unknown = err, depth = 0;
    e && typeof e === 'object' && depth < 4;
    e = (e as { cause?: unknown }).cause, depth++
  ) {
    const data = (e as { data?: unknown }).data;
    if (typeof data === 'string') {
      const stop = fromBudgetText(data);
      if (stop) return stop;
      continue;
    }
    if (data && typeof data === 'object') {
      const r = data as { partial?: unknown; reason?: unknown; message?: unknown };
      if (typeof r.message === 'string') {
        const stop = fromBudgetText(r.message);
        if (stop) return stop;
      }
      if (r.partial === true && typeof r.reason === 'string' && BUDGET_RECEIPT_REASON.test(r.reason)) {
        return `Stopped by the run budget: this run used all ${FUIGO_UNATTENDED_MAX_MODEL_CALLS} of its model calls before it finished. Work done so far is kept; the next run starts fresh.`;
      }
    }
  }
  return null;
}

/**
 * The user-facing reason when a prompt ENDED NORMALLY because Fuigo stopped it,
 * or null for an ordinary turn.
 *
 * Up to 1.0.18 the per-prompt `--max-turns` cap failed the prompt with
 * `-32603`, so it arrived through `describeFuigoBudgetStop` above. From 1.0.19
 * (`fuigo-shell` `turn.rs`, `TurnOutcome::MaxTurnsReached`) it is a normal
 * result instead: `stopReason: "cancelled"` with
 * `_meta.cancellationCategory: "max_turns_reached"` — measured on the staged
 * 1.0.19 over stdio. Without this, that stop is indistinguishable from the
 * user pressing Stop and the turn just ends blank.
 *
 * The process budgets (`FUIGO_MAX_MODEL_CALLS` / `FUIGO_MAX_RUNTIME_SECS`)
 * still fail the prompt; they stay in `describeFuigoBudgetStop`.
 */
export function describeFuigoTurnStop(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  if ((result as { stopReason?: unknown }).stopReason !== 'cancelled') return null;
  const meta = (result as { _meta?: unknown })._meta;
  if (!meta || typeof meta !== 'object') return null;
  if ((meta as { cancellationCategory?: unknown }).cancellationCategory !== 'max_turns_reached') return null;
  return 'Stopped by the turn limit: this turn used all the agentic turns it was allowed. Work done so far is kept; send another message to continue.';
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
  // The cross-vendor `~/.agents/skills` root is scanned unconditionally by
  // 1.0.14/1.0.15 (every session listed the user's ~200 personal skills on top
  // of the workspace ones); 1.0.16 gates it behind this cell (fuigo#16).
  env.FUIGO_AGENTS_SKILLS_ENABLED = '0';
  // CLAUDE/MCPS stays ON, on purpose. With the switch OFF, Fuigo's
  // `admit_client_mcp_servers` treats every name in the user's `~/.claude.json`
  // as a "Claude-sourced" server and silently drops any client-forwarded stdio
  // server with the same name — and Wayland's own Library publication writes
  // its connectors into `~/.claude.json` (`com-ferroxlabs-tvcontrol`, ...).
  // Net effect on 1.0.15/1.0.16: TVControl vanished from every Fuigo session
  // on a machine with Claude Code installed, with no log line. The managed
  // `[claude_compat] imported = true` marker (FUIGO_MANAGED_CONFIG) is what
  // keeps the user's servers out when this is ON. Measured on the staged
  // binary: OFF -> 4 of Desktop's 5 servers admitted; ON without marker -> 8
  // (user's github/supabase/dev servers dialled); ON + marker -> exactly 5.
  env.FUIGO_CLAUDE_MCPS_ENABLED = '1';
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
 *  from the session request first, then from `initialize`.
 *
 *  `rules` is the assistant's standing instructions (Constitution, persona,
 *  team guide, capabilities, connector guidance). Fuigo appends it to its own
 *  system prompt as `<human_rules>` and stores that system message with the
 *  session, so it survives a process restart and `session/load` (which ignores
 *  a re-sent `rules` by design). Carried here rather than in the first user
 *  message, which pushed every fresh chat over Fuigo's 25,000-byte prompt
 *  offload (`LARGE_PROMPT_THRESHOLD`) and cost a `read_file prompt_0.txt`.
 *
 *  Fuigo 1.0.16 DROPS `<human_rules>` whenever `session/set_model` changes the
 *  model (the harness rebuild swaps in a fresh template, measured: history
 *  40,580 -> 7,328 B), before or after a turn, and `session/load` keeps it
 *  dropped. So `modelId` creates the session on the chat's model (no switch at
 *  bootstrap), and a later switch re-injects the rules into the next user
 *  message (`AcpAgentManager.markFuigoRulesStale`).
 *
 *  `modelId` creates the session on the chat's model. Without it Fuigo starts
 *  on its own default (`flux-auto`), and a Flux tier persisted on the row is
 *  never re-applied at bootstrap (a Flux id on a Flux-capable backend is
 *  treated as carried by the spawn env, which Fuigo's spawn does not set), so
 *  the header showed the row's model while `flux-auto` ran. */
export function buildFuigoSessionMetadata(opts: {
  nonInteractive: boolean;
  pluginDirs?: string[];
  rules?: string;
  modelId?: string;
}): Record<string, unknown> {
  return {
    clientIdentifier: 'wayland-desktop',
    clientType: 'desktop',
    startupHints: { nonInteractive: opts.nonInteractive },
    ...(opts.pluginDirs?.length ? { pluginDirs: opts.pluginDirs } : {}),
    ...(opts.rules ? { rules: opts.rules } : {}),
    ...(opts.modelId ? { modelId: opts.modelId } : {}),
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
