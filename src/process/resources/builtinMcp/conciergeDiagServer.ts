/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Built-in MCP server factory for the Concierge read-only diagnostics tools
 * (Phase 2a). Mirrors `searchSkillsServer.ts`: a factory returning tool methods,
 * NOT a stdio server (the stdio wrapper lives in `conciergeDiagServerEntry.ts`).
 *
 * This module is bundled into a standalone stdio NODE subprocess, so it has:
 *   - NO Electron APIs, NO main-process singletons, NO ipcBridge.
 *   - Only node builtins + `better-sqlite3`.
 *
 * It is strictly READ-ONLY. It reads on-disk sources whose paths are injected
 * via `deps` (tests) or `env` (the stdio transport, wired by the lead):
 *   - config JSON  (`mcp.config`)            → MCP health
 *   - cron SQLite  (`cron_jobs` table)       → scheduled-task health
 *   - provider SQLite (`model_registry_providers`, STATE columns only) → provider health
 *   - log dir                                → recent redacted errors
 *
 * Secret hygiene is non-negotiable: every string in every output is passed
 * through the central `sanitize()` choke point, which applies BOTH `redact()`
 * (key/token-shaped values masked to last-4) AND `scrubHome()` (home-directory
 * paths / OS usernames masked) to every string field — not just `source`
 * metadata. The provider creds column is NEVER read. No tool throws — a
 * missing/unreadable source degrades to an `available: false` section.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';

// ---------------------------------------------------------------------------
// Bounds (re-clamped here so output can never balloon, regardless of source).
// ---------------------------------------------------------------------------

const MAX_ITEMS = 100;
const MAX_STRING_CHARS = 500;
const MAX_LOG_FILES = 6;
const MAX_LOG_LINES = 40;
/** Tail at most this many bytes from the end of each log file. */
const MAX_LOG_TAIL_BYTES = 64 * 1024;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ConciergeDiagDeps = {
  /** Path to the base64-encoded app config JSON (holds `mcp.config`). */
  configPath?: string;
  /** Path to the SQLite DB holding the `cron_jobs` table. */
  cronDbPath?: string;
  /** Path to the SQLite DB holding `model_registry_providers`. */
  providerDbPath?: string;
  /**
   * Path to the SQLite DB holding `projects` + `conversations` (workspace
   * health). The app uses one shared `wayland.db`, so this defaults to the
   * provider DB path when unset.
   */
  workspaceDbPath?: string;
  /** Directory containing app log files (tailed for recent errors). */
  logDir?: string;
  /** Resolved app config directory (`.../Wayland/config`), for the paths report. */
  appConfigDir?: string;
  /** Resolved engine config directory (`nativeConfigDir()`), for the paths report. */
  engineConfigDir?: string;
};

export type ScheduledTaskHealth = {
  name: string;
  enabled: boolean;
  nextRunAtMs: number | null;
  lastRunAt: number | null;
  lastError: string | null;
  /** Plain-English reason it is not running, or null when healthy. */
  whyNotRunning: string | null;
};

export type McpServerHealth = {
  name: string;
  enabled: boolean;
  status: string | null;
  toolCount: number;
  lastError: string | null;
  /** Set when enabled but exposes 0 tools (likely failed to connect). */
  flag: string | null;
};

export type ProviderHealth = {
  id: string;
  state: string;
  error: string | null;
  /** Set when the provider is in a non-working state. */
  flag: string | null;
};

export type DiagSection<T> = {
  available: boolean;
  /** Where the data came from, or why it could not be read. */
  source: string;
  items: T[];
};

export type RecentErrorsSection = {
  available: boolean;
  source: string;
  lines: string[];
};

export type WorkspaceHealth = {
  /** "project" or "conversation". */
  kind: string;
  name: string;
  /** Resolved workspace path (home-scrubbed to `~/…`), or null when unset. */
  workspace: string | null;
  /** True when this is a throwaway temp/default workspace, not a real folder. */
  isTemporary: boolean;
  /** Plain-English problem when files would land somewhere the user can't find, else null. */
  whyProblem: string | null;
};

export type ConfigPathsInfo = {
  /** App settings/config directory (channels, providers, OAuth tokens live here). */
  appConfigDir: string | null;
  /** Engine (wayland-core) config directory — a SEPARATE location from the app config. */
  engineConfigDir: string | null;
  /** Plain-English note explaining the two distinct locations. */
  note: string;
};

export type ConfigPathsSection = {
  available: boolean;
  source: string;
  info: ConfigPathsInfo;
};

export type ConciergeDiagOverview = {
  scheduledTasks: DiagSection<ScheduledTaskHealth>;
  mcp: DiagSection<McpServerHealth>;
  providers: DiagSection<ProviderHealth>;
  workspace: DiagSection<WorkspaceHealth>;
  configPaths: ConfigPathsSection;
  recentErrors: RecentErrorsSection;
};

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

/**
 * Token/key shapes that must never be returned in full. Over-redaction is safe
 * for a diagnostics tool, so the bar is deliberately low. Matched runs are
 * masked to their last 4 characters (`••••1234`).
 */
/**
 * Key-name-driven masking: when a known secret key NAME is followed by a value
 * (`token: xxx`, `api_key=xxx`, `"secret":"xxx"`, `Authorization: Bearer xxx`),
 * mask the VALUE regardless of its shape. This is the rule that catches secrets
 * in log lines and SQLite `error`/`last_error` columns where a short or
 * base64url token would otherwise escape the shape-based rules below.
 */
const KEY_VALUE_REGEX =
  /\b(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|secret|password|passwd|token|bearer)\b(["']?\s*[:=]\s*|\s+)(bearer\s+)?(["']?)([^\s"',}]{6,})/gi;

/**
 * Shape-based token/key matchers. Over-redaction is safe for a diagnostics tool,
 * so the bar is deliberately low. Matched runs are masked to their last 4 chars.
 */
const SHAPE_REGEXES: readonly RegExp[] = [
  // OpenAI/Anthropic/Stripe-style prefixed keys: sk-..., sk-ant-..., etc.
  /sk-[A-Za-z0-9_-]{8,}/g,
  // AWS access key ids.
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  // Common provider token prefixes: slack, github (incl fine-grained PAT),
  // gitlab, groq, xai, replicate, digitalocean, google (incl 1// refresh).
  /\b(?:xox[abprs]-|gh[posru]_|github_pat_|glpat-|gsk_|xai-|r8_|dop_v1_|ya29\.|AIza|1\/\/)[A-Za-z0-9_./-]{6,}/g,
  // base64url-aware opaque blobs / long tokens (lowered floor; covers - and _,
  // so OAuth/JWT/refresh tokens no longer fragment below the threshold).
  /[A-Za-z0-9_-]{24,}={0,2}/g,
  // Long hex runs (keys, hashes, signatures).
  /\b[A-Fa-f0-9]{32,}\b/g,
];

/**
 * URL/DSN userinfo password masker. In `scheme://user:PASSWORD@host`, the
 * PASSWORD segment carries the secret (`postgres://admin:s3cr3t@db`,
 * `redis://default:p4ssw0rd@cache`, …). The shape/key-name rules miss these
 * because the password is short and has no key NAME, so mask it explicitly.
 */
const URL_USERINFO_REGEX = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:)([^\s@/]+)(@)/gi;

/**
 * Colon-less URL userinfo. `scheme://TOKEN@host` carries the whole secret in the
 * userinfo with no `user:pass` split (`https://ghp_xxx@github.com`,
 * `https://glpat-xxx@gitlab.example`), so URL_USERINFO_REGEX (which requires a
 * `:`) misses it. Mask the userinfo token, keeping scheme + host. The >=8 floor
 * avoids masking ordinary `scheme://host` URLs (no `@`) and trivial userinfo.
 */
const URL_USERINFO_NOCOLON_REGEX = /(\b[a-z][a-z0-9+.-]*:\/\/)([^\s:@/]{8,})(@)/gi;

/**
 * Generic delimiter-adjacent token rule: a token run of length >= 12 sitting
 * IMMEDIATELY after a `:`, `=`, or `@` delimiter is almost always a secret
 * (DSN password, `key=longsecret`, …) rather than prose. Requiring the run to
 * be adjacent to the delimiter (no whitespace) keeps ordinary sentences intact.
 * Over-redaction is safe here, so this errs toward masking.
 */
const DELIM_TOKEN_REGEX = /([:=@])([A-Za-z0-9_-]{12,})/g;

const maskTail = (run: string): string => (run.length > 4 ? `••••${run.slice(-4)}` : '••••');

/**
 * Mask any secret/key/token-shaped substrings to their last 4 characters.
 * Exported so callers and tests can verify the masking directly.
 */
export function redact(value: string): string {
  if (!value) return value;
  // URL/DSN userinfo first: mask only the password segment, keep scheme/user/host.
  let out = value.replace(URL_USERINFO_REGEX, (_m, prefix: string, secret: string, at: string) => {
    return `${prefix}${maskTail(secret)}${at}`;
  });
  // Colon-less userinfo (`scheme://TOKEN@host`): mask the userinfo token. Runs
  // after the colon variant, whose `user:••••@` output has no >=8 run before `@`.
  out = out.replace(URL_USERINFO_NOCOLON_REGEX, (_m, prefix: string, secret: string, at: string) => {
    return `${prefix}${maskTail(secret)}${at}`;
  });
  // Key-name-driven: preserve the key name, mask only the value.
  out = out.replace(KEY_VALUE_REGEX, (_m, key, sep, bearer, quote, val: string) => {
    return `${key}${sep}${bearer ?? ''}${quote}${maskTail(val)}`;
  });
  // Shape-based: mask the whole matched run.
  for (const re of SHAPE_REGEXES) {
    out = out.replace(re, (match) => maskTail(match));
  }
  // Generic delimiter-adjacent tokens: catch DSN passwords / `key=longsecret`
  // that escaped the rules above. Runs against already-masked output is a no-op
  // (the `••••` bullets are not token characters).
  out = out.replace(DELIM_TOKEN_REGEX, (_m, delim: string, token: string) => {
    return `${delim}${maskTail(token)}`;
  });
  return out;
}

/** Replacement token for a masked OS username segment. */
const USER_MASK = '<user>';

/**
 * Mask home-directory paths / OS usernames so no model-visible string discloses
 * the OS username. Applied to EVERY output string via `sanitize()` (not just
 * `source` metadata), so it also scrubs `recentErrors` log lines and the sqlite
 * `last_error` / `error` column values, wherever the path appears in the string.
 *
 * Two layers:
 *   1. The running process's exact home dir (`os.homedir()`) → `~`, anywhere it
 *      occurs (not only as a leading prefix).
 *   2. Generic per-OS user-home shapes whose `<name>` segment is the username —
 *      `/Users/<name>` (macOS), `/home/<name>` (Linux), `C:\Users\<name>`
 *      (Windows) — masked even when `<name>` is NOT the running user (e.g. a
 *      path copied into a log line from another machine).
 */
function scrubHome(p: string): string {
  if (!p) return p;
  let out = p;
  // Layer 1: replace every occurrence of the literal home dir with `~`.
  const home = os.homedir();
  if (home) out = out.split(home).join('~');
  // Layer 2a: POSIX user homes (/Users/<name>, /home/<name>).
  out = out.replace(/(\/(?:Users|home)\/)([^/\\\s]+)/g, (_m, prefix: string) => `${prefix}${USER_MASK}`);
  // Layer 2b: Windows user homes (C:\Users\<name>).
  out = out.replace(/([A-Za-z]:\\Users\\)([^\\/\s]+)/gi, (_m, prefix: string) => `${prefix}${USER_MASK}`);
  return out;
}

/**
 * Deep-sanitize a tool result: redact every string, bound string length, and
 * cap array sizes. This is the single choke point guaranteeing no oversized or
 * secret output escapes a tool.
 */
function sanitize<T>(value: T): T {
  if (typeof value === 'string') {
    // Both choke-point passes: secret masking AND home/username scrubbing, so
    // every string field is covered — recentErrors lines and the sqlite
    // last_error/error columns included, not just `source` metadata.
    const masked = scrubHome(redact(value));
    return (masked.length > MAX_STRING_CHARS ? `${masked.slice(0, MAX_STRING_CHARS)}…` : masked) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ITEMS).map((v) => sanitize(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v);
    return out as T;
  }
  return value;
}

// ---------------------------------------------------------------------------
// On-disk readers (each degrades gracefully — never throws)
// ---------------------------------------------------------------------------

/** Open a SQLite DB read-only, or null when missing/unopenable. */
function openReadonlyDb(dbPath: string | undefined): Database.Database | null {
  // Unset / absent path is the legitimate "no DB here" case — stay silent.
  if (!dbPath || !fs.existsSync(dbPath)) return null;
  try {
    return new BetterSqlite3(dbPath, { readonly: true, fileMustExist: false });
  } catch (error) {
    // The file exists but could not be opened (native driver failed to load,
    // corrupt file, permission denied). Surface it — redacted + home-scrubbed —
    // so this is distinguishable from a legitimately-missing DB. Still degrade.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[concierge-diag] failed to open sqlite db: ${redact(scrubHome(message))}`);
    return null;
  }
}

/**
 * Decode the app config file. The on-disk format is
 * `base64(encodeURIComponent(JSON))` (see initStorage `JsonFileBuilder`); we
 * also accept plain JSON as a fallback so the reader is robust.
 */
function readConfigJson(configPath: string | undefined): Record<string, unknown> | null {
  // Unset / absent path is the legitimate "no config here" case — stay silent.
  if (!configPath || !fs.existsSync(configPath)) return null;
  let raw: string;
  try {
    raw = fs.readFileSync(configPath, 'utf-8').toString();
  } catch (error) {
    // The file exists but could not be read (permission denied, I/O error).
    // Surface it — redacted + home-scrubbed — so it is distinguishable from a
    // legitimately-missing config. Still degrade to null.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[concierge-diag] failed to read config: ${redact(scrubHome(message))}`);
    return null;
  }
  if (!raw || raw.trim() === '') return null;
  // Preferred: base64(encodeURIComponent(JSON)).
  try {
    const decoded = decodeURIComponent(atob(raw));
    const parsed: unknown = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    // fall through to plain-JSON attempt
  }
  // Fallback: plain JSON on disk.
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    // not decodable
  }
  // File was present and non-empty but decoded as neither base64 nor plain JSON.
  // That is a real failure (not a missing config), so make it observable.
  console.error('[concierge-diag] config present but undecodable (not base64 nor JSON)');
  return null;
}

function asNullableNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asNullableString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/**
 * Derive a plain-English reason a scheduled task is not running. Only enabled
 * tasks that are stuck (no next run, or last run errored) get a reason; a
 * healthy enabled task returns null.
 */
function deriveWhyNotRunning(enabled: boolean, nextRunAtMs: number | null, lastError: string | null): string | null {
  if (!enabled) {
    return 'This task is turned off (disabled), so it will not run until you enable it.';
  }
  const noNextRun = nextRunAtMs == null;
  if (lastError && noNextRun) {
    return `Its last run failed (${lastError}) and no next run is scheduled, so it is stuck — re-open and re-save the schedule to recompute the next run.`;
  }
  if (lastError) {
    return `Its last run failed: ${lastError}. It is still scheduled and will retry at the next run time.`;
  }
  if (noNextRun) {
    return 'It is enabled but has no next run time scheduled, so it will not fire — re-open and re-save the schedule to recompute the next run.';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createConciergeDiagServer = (deps: ConciergeDiagDeps = {}) => {
  const configPath = deps.configPath ?? process.env.WAYLAND_CONFIG_PATH;
  const cronDbPath = deps.cronDbPath ?? process.env.WAYLAND_CRON_DB;
  const providerDbPath = deps.providerDbPath ?? process.env.WAYLAND_PROVIDER_DB;
  // projects + conversations live in the same shared wayland.db as providers.
  const workspaceDbPath = deps.workspaceDbPath ?? process.env.WAYLAND_WORKSPACE_DB ?? providerDbPath;
  const logDir = deps.logDir ?? process.env.WAYLAND_LOG_DIR;
  const appConfigDir = deps.appConfigDir ?? process.env.WAYLAND_APP_CONFIG_DIR;
  const engineConfigDir = deps.engineConfigDir ?? process.env.WAYLAND_ENGINE_CONFIG_DIR;

  /** Scheduled-task health from the cron store (`cron_jobs`). */
  const readScheduledTasks = (): DiagSection<ScheduledTaskHealth> => {
    const db = openReadonlyDb(cronDbPath);
    if (!db) {
      return {
        available: false,
        source: cronDbPath ? `cron db unavailable: ${scrubHome(cronDbPath)}` : 'cron db path not set',
        items: [],
      };
    }
    try {
      const rows = db
        .prepare('SELECT name, enabled, next_run_at, last_run_at, last_error FROM cron_jobs ORDER BY name ASC')
        .all() as Array<Record<string, unknown>>;
      const items: ScheduledTaskHealth[] = rows.map((r) => {
        const enabled = Number(r.enabled) === 1;
        const nextRunAtMs = asNullableNumber(r.next_run_at);
        const lastError = asNullableString(r.last_error);
        return {
          name: typeof r.name === 'string' ? r.name : '(unnamed)',
          enabled,
          nextRunAtMs,
          lastRunAt: asNullableNumber(r.last_run_at),
          lastError,
          whyNotRunning: deriveWhyNotRunning(enabled, nextRunAtMs, lastError),
        };
      });
      return { available: true, source: 'cron_jobs', items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, source: `cron_jobs read failed: ${scrubHome(message)}`, items: [] };
    } finally {
      try {
        db.close();
      } catch {
        /* ignore close errors */
      }
    }
  };

  /** MCP-server health from `mcp.config` in the config JSON. */
  const readMcpHealth = (): DiagSection<McpServerHealth> => {
    const config = readConfigJson(configPath);
    if (!config) {
      return {
        available: false,
        source: configPath ? `config unavailable: ${scrubHome(configPath)}` : 'config path not set',
        items: [],
      };
    }
    const servers = config['mcp.config'];
    if (!Array.isArray(servers)) {
      return { available: false, source: 'config has no mcp.config array', items: [] };
    }
    const items: McpServerHealth[] = servers.map((raw) => {
      const s = (raw ?? {}) as Record<string, unknown>;
      const enabled = s.enabled === true;
      const toolCount = Array.isArray(s.tools) ? s.tools.length : 0;
      const lastError = asNullableString(s.lastError);
      const flag =
        enabled && toolCount === 0
          ? 'Enabled but exposes 0 tools — it likely failed to connect or registered nothing; check its command, args, or credentials.'
          : null;
      return {
        name: typeof s.name === 'string' ? s.name : '(unnamed)',
        enabled,
        status: asNullableString(s.status),
        toolCount,
        lastError,
        flag,
      };
    });
    return { available: true, source: 'mcp.config', items };
  };

  /**
   * Provider health from `model_registry_providers`. Reads STATE columns ONLY
   * (`provider_id`, `state`, `error`) — the `creds_encrypted` column is never
   * selected, and even if it were it would be unreadable here (no Electron
   * safeStorage in a subprocess).
   */
  const readProviders = (): DiagSection<ProviderHealth> => {
    const db = openReadonlyDb(providerDbPath);
    if (!db) {
      return {
        available: false,
        source: providerDbPath ? `provider db unavailable: ${scrubHome(providerDbPath)}` : 'provider db path not set',
        items: [],
      };
    }
    try {
      const rows = db
        .prepare('SELECT provider_id, state, error FROM model_registry_providers ORDER BY provider_id ASC')
        .all() as Array<Record<string, unknown>>;
      const items: ProviderHealth[] = rows.map((r) => {
        const state = typeof r.state === 'string' ? r.state : 'unknown';
        const error = asNullableString(r.error);
        const working = state === 'connected' || state === 'ok';
        const flag =
          !working || error
            ? `Provider is in '${state}' state${error ? ` (${error})` : ''} — reconnect or re-enter credentials in Settings › Models.`
            : null;
        return {
          id: typeof r.provider_id === 'string' ? r.provider_id : '(unknown)',
          state,
          error,
          flag,
        };
      });
      return { available: true, source: 'model_registry_providers', items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, source: `model_registry_providers read failed: ${scrubHome(message)}`, items: [] };
    } finally {
      try {
        db.close();
      } catch {
        /* ignore close errors */
      }
    }
  };

  /** Recent error-ish lines tailed from the log directory (bounded, redacted). */
  const readRecentErrors = (): RecentErrorsSection => {
    if (!logDir || !fs.existsSync(logDir)) {
      return {
        available: false,
        source: logDir ? `log dir unavailable: ${scrubHome(logDir)}` : 'log dir not set',
        lines: [],
      };
    }
    let files: string[];
    try {
      files = fs
        .readdirSync(logDir)
        .filter((f) => f.endsWith('.log') || f.endsWith('.txt'))
        .slice(0, MAX_LOG_FILES);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, source: `log dir read failed: ${scrubHome(message)}`, lines: [] };
    }

    const collected: string[] = [];
    for (const file of files) {
      const full = path.join(logDir, file);
      try {
        const stat = fs.statSync(full);
        if (!stat.isFile()) continue;
        const start = Math.max(0, stat.size - MAX_LOG_TAIL_BYTES);
        const fd = fs.openSync(full, 'r');
        try {
          const length = stat.size - start;
          const buf = Buffer.alloc(length);
          fs.readSync(fd, buf, 0, length, start);
          const text = buf.toString('utf-8');
          for (const line of text.split(/\r?\n/)) {
            if (/error|fail|exception|warn/i.test(line) && line.trim() !== '') {
              collected.push(`${file}: ${line.trim()}`);
            }
          }
        } finally {
          fs.closeSync(fd);
        }
      } catch {
        // skip unreadable file
      }
    }

    // Keep only the most recent lines, bounded.
    const lines = collected.slice(-MAX_LOG_LINES);
    return { available: true, source: scrubHome(logDir), lines };
  };

  /**
   * Workspace health: flag projects/conversations writing to throwaway temp
   * dirs instead of a real, findable folder. This is the root cause behind
   * "Concierge looked in a temporary workspace" / "my file went nowhere".
   */
  const readWorkspaceHealth = (): DiagSection<WorkspaceHealth> => {
    const db = openReadonlyDb(workspaceDbPath);
    if (!db) {
      return {
        available: false,
        source: workspaceDbPath
          ? `workspace db unavailable: ${scrubHome(workspaceDbPath)}`
          : 'workspace db path not set',
        items: [],
      };
    }
    // Default/temp workspaces are named `<kind>-temp-<Date.now()>` (see initAgent),
    // or sit under the OS temp dir. A null path means no workspace at all, which
    // also falls back to a temp dir. The timestamp run must be >=10 digits (a
    // Unix-ms timestamp is 13) so user folders like `client-temp-2024` (a year
    // or small counter suffix) are NOT mistaken for engine temp dirs.
    const isTempPath = (p: string | null): boolean => {
      if (!p) return true;
      return /(^|[/\\])[a-z]+-temp-\d{10,}([/\\]|$)/i.test(p) || p.includes(os.tmpdir());
    };
    try {
      const items: WorkspaceHealth[] = [];
      try {
        const projects = db.prepare('SELECT name, workspace FROM projects ORDER BY name ASC').all() as Array<
          Record<string, unknown>
        >;
        for (const r of projects) {
          const workspace = asNullableString(r.workspace);
          const temp = isTempPath(workspace);
          items.push({
            kind: 'project',
            name: typeof r.name === 'string' ? r.name : '(unnamed)',
            workspace,
            isTemporary: temp,
            whyProblem: temp
              ? 'This project has no persistent workspace folder, so files it creates go to a temporary directory and are easily lost. Set a workspace folder for the project.'
              : null,
          });
        }
      } catch {
        /* projects table may be absent on older DBs - skip */
      }
      try {
        const convs = db
          .prepare('SELECT name, extra FROM conversations ORDER BY updated_at DESC LIMIT 50')
          .all() as Array<Record<string, unknown>>;
        for (const r of convs) {
          let workspace: string | null = null;
          let customWorkspace: boolean | null = null;
          const extraRaw = asNullableString(r.extra);
          if (extraRaw) {
            try {
              const extra = JSON.parse(extraRaw) as Record<string, unknown>;
              workspace = asNullableString(extra.workspace);
              customWorkspace = typeof extra.customWorkspace === 'boolean' ? extra.customWorkspace : null;
            } catch {
              /* unparseable extra - leave nulls */
            }
          }
          if (workspace == null && customWorkspace == null) continue;
          // `customWorkspace === false` is the app's own authoritative "this is a
          // temp/default workspace" flag.
          const temp = customWorkspace === false || isTempPath(workspace);
          if (!temp) continue;
          items.push({
            kind: 'conversation',
            name: typeof r.name === 'string' ? r.name : '(unnamed)',
            workspace,
            isTemporary: true,
            whyProblem:
              'This chat is using a temporary workspace, so files it writes (e.g. "save to the local workspace") land in a throwaway directory you may not be able to find. Open it inside a project that has a workspace folder, or set one.',
          });
        }
      } catch {
        /* conversations table may be absent - skip */
      }
      return { available: true, source: 'projects + conversations', items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, source: `workspace read failed: ${scrubHome(message)}`, items: [] };
    } finally {
      try {
        db.close();
      } catch {
        /* ignore close errors */
      }
    }
  };

  /** Config-path report: the app config dir vs the engine config dir (the "two paths"). */
  const readConfigPaths = (): ConfigPathsSection => {
    const appDir = appConfigDir ?? (configPath ? path.dirname(configPath) : null);
    const info: ConfigPathsInfo = {
      appConfigDir: appDir ? scrubHome(appDir) : null,
      engineConfigDir: engineConfigDir ? scrubHome(engineConfigDir) : null,
      note: 'Wayland keeps two separate config locations: the desktop app settings (providers, channels, OAuth) live in the app config directory; the wayland-core engine reads its own config from the engine config directory. Uninstalling the app does NOT delete these, so a stale config can survive a reinstall.',
    };
    return { available: appDir != null || engineConfigDir != null, source: 'resolved paths', info };
  };

  return {
    name: 'wayland_concierge_diag',

    /** One-shot health snapshot across all sources. */
    overview(): ConciergeDiagOverview {
      return sanitize({
        scheduledTasks: readScheduledTasks(),
        mcp: readMcpHealth(),
        providers: readProviders(),
        workspace: readWorkspaceHealth(),
        configPaths: readConfigPaths(),
        recentErrors: readRecentErrors(),
      });
    },

    /** Scheduled-task health only ("why didn't my task run?"). */
    scheduledTasks(): DiagSection<ScheduledTaskHealth> {
      return sanitize(readScheduledTasks());
    },

    /** MCP-server health only ("MCP enabled but 0 tools"). */
    mcpHealth(): DiagSection<McpServerHealth> {
      return sanitize(readMcpHealth());
    },

    /** Provider/model connection health only (state, never creds). */
    providers(): DiagSection<ProviderHealth> {
      return sanitize(readProviders());
    },

    /** Workspace health only ("my file went nowhere" / temp-workspace fallback). */
    workspace(): DiagSection<WorkspaceHealth> {
      return sanitize(readWorkspaceHealth());
    },

    /** Config-path report only (app config dir vs engine config dir). */
    configPaths(): ConfigPathsSection {
      return sanitize(readConfigPaths());
    },

    /** Recent redacted error lines from the log directory. */
    recentErrors(): RecentErrorsSection {
      return sanitize(readRecentErrors());
    },
  };
};

export type ConciergeDiagServer = ReturnType<typeof createConciergeDiagServer>;
