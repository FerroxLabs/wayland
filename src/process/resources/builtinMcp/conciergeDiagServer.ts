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
 *   - config JSON  (`mcp.config`)            → MCP health, TVControl connector
 *   - cron SQLite  (`cron_jobs` table)       → scheduled-task health
 *   - provider SQLite (`model_registry_providers`, STATE columns only) → provider health
 *   - log dir                                → recent redacted errors
 *   - bundled voice-models dir               → speech-input (STT) readiness
 *   - agent install root                     → agent install-receipt integrity
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
// Relative, and from the deliberately dependency-free constants module: this file
// is esbuild-bundled into a standalone stdio server, so an alias or a module with
// side effects would be a build/runtime hazard here.
import { isBundledWaylandMcpEntryId } from './constants';

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
  /**
   * `process.arch` of the APP (not of this subprocess — the subprocess node
   * binary can differ), for the platform report.
   */
  appArch?: string;
  /**
   * The app's `app.runningUnderARM64Translation`. Electron-only, so it is
   * injected: this module never touches Electron.
   */
  runningUnderARM64Translation?: boolean;
  /**
   * The bundled voice-models directory (`getVoiceModelsDir()` in
   * `src/process/extensions/constants.ts`), which holds the on-device
   * Whisper-tiny STT model.
   *
   * INJECTED, not derived. That resolver branches on
   * `getPlatformServices().paths.isPackaged()` and `process.resourcesPath`,
   * neither of which exists in this subprocess — a local re-derivation would
   * answer confidently and WRONGLY.
   */
  voiceModelsDir?: string;
  /**
   * The root under which managed agent installs live (`<userData>/agents`).
   *
   * INJECTED for the same reason. `resolveAgentInstallPrefix` reads
   * `getPlatformServices().paths.getDataDir()`, whose Node fallback returns
   * `~/.wayland-server` — a directory this app never installs agents into. A
   * confident wrong answer is worse than no answer, so the prefix arrives from
   * the app or the section degrades.
   */
  agentInstallRoot?: string;
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

export type PlatformInfo = {
  /** The OS this install runs on (`darwin` / `win32` / `linux`). */
  os: string;
  /** CPU architecture the installed build was compiled for, or null when unknown. */
  appArch: string | null;
  /**
   * True when an x64 build is running on an ARM64 machine through macOS Rosetta
   * or Windows ARM64 emulation instead of natively.
   */
  runningUnderARM64Translation: boolean;
  /** Plain-English problem when the wrong build is installed, else null. */
  whyProblem: string | null;
};

export type PlatformSection = {
  available: boolean;
  source: string;
  info: PlatformInfo;
};

export type VoiceSttInfo = {
  /** Is the bundled on-device Whisper model actually on disk and complete? */
  bundledModelPresent: boolean;
  /** Where the bundled model was looked for (home-scrubbed), or null when unknown. */
  modelDir: string | null;
  /** Required model files that were absent. Empty when the model is complete. */
  missingFiles: string[];
  /** Plain-English problem when speech input cannot run, else null. */
  whyProblem: string | null;
};

export type VoiceTtsInfo = {
  /** The OS this install runs on. */
  platform: string;
  /**
   * The local synthesizer this platform RESOLVES to (`system-native` on macOS,
   * `windows-native` on Windows), or null where the build has none.
   */
  resolvedLocalProvider: string | null;
  /** Plain-English problem when no local synthesizer exists here, else null. */
  whyProblem: string | null;
  /** What this field does and does NOT claim. */
  note: string;
};

export type VoiceSection = {
  /**
   * Whether the on-disk STT source could be inspected. `tts` is a pure
   * platform derivation with no on-disk source, so it is always populated.
   */
  available: boolean;
  source: string;
  stt: VoiceSttInfo;
  tts: VoiceTtsInfo;
};

/**
 * Why a managed agent install is (or is not) usable.
 *
 * `receipt-missing`, `receipt-unreadable`, `receipt-mismatch` and
 * `launch-target-missing` are all cases `resolveManagedAgentLaunch` collapses to
 * a bare `null`, which its caller silently skips. That is why a half-broken
 * install is INVISIBLE in the app today: "the receipt points at a binary that is
 * gone" and "this agent was never installed" look identical. This section is the
 * only place they are told apart.
 */
export type AgentInstallStatus =
  | 'ok'
  | 'receipt-missing'
  | 'receipt-unreadable'
  | 'receipt-mismatch'
  | 'launch-target-missing';

export type AgentInstallHealth = {
  /** Directory name under the install root — the agent id the app would use. */
  agentId: string;
  status: AgentInstallStatus;
  /** Version the receipt records, or null when there is no readable receipt. */
  version: string | null;
  /** ISO-8601 install timestamp from the receipt, or null. */
  installedAt: string | null;
  /**
   * Launch targets the receipt names that are no longer on disk (home-scrubbed).
   * Non-empty only for `launch-target-missing`.
   */
  missingLaunchTargets: string[];
  /** Plain-English problem, or null when the install is intact. */
  whyProblem: string | null;
};

export type TvControlInfo = {
  /** Is the TVControl connector present in `mcp.config` at all? */
  present: boolean;
  /** Is it switched on? False whenever it is absent. */
  enabled: boolean;
  /** Last persisted probe status, or null. */
  status: string | null;
  /** Tool count recorded in the config, 0 when absent. */
  toolCount: number;
  lastError: string | null;
  /** Plain-English problem, or null when present and enabled. */
  whyProblem: string | null;
  /** What this section does and does NOT claim. */
  note: string;
};

export type TvControlSection = {
  available: boolean;
  source: string;
  info: TvControlInfo;
};

export type ConciergeDiagOverview = {
  scheduledTasks: DiagSection<ScheduledTaskHealth>;
  mcp: DiagSection<McpServerHealth>;
  providers: DiagSection<ProviderHealth>;
  workspace: DiagSection<WorkspaceHealth>;
  configPaths: ConfigPathsSection;
  platform: PlatformSection;
  voice: VoiceSection;
  agentInstalls: DiagSection<AgentInstallHealth>;
  tvControl: TvControlSection;
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
  // base64url-aware opaque blobs / long tokens (covers - and _, so OAuth/JWT/
  // refresh tokens no longer fragment below the threshold). The leading lookahead
  // requires at least one uppercase letter OR digit in the run: real base64/hex
  // tokens always carry that entropy, but all-lowercase snake/kebab identifiers
  // (our own `model_registry_providers` source label, reverse-DNS MCP server
  // names like `com.acme-something-mcp`) do not — masking those garbled the
  // Doctor report's section labels and the very server names it exists to name.
  /(?=[A-Za-z0-9_-]*[A-Z0-9])[A-Za-z0-9_-]{24,}={0,2}/g,
  // ...but an all-lowercase run is only an identifier if it is BROKEN UP by a
  // separator: `model_registry_providers`, `com.acme-…-mcp`. An unbroken
  // lowercase run of 24+ is token-shaped, not name-shaped, so the entropy
  // lookahead above must not exempt it — otherwise a bare lowercase secret in
  // free-text (an error string with no `key=` and no `:`/`=`/`@` in front, which
  // is all that KEY_VALUE_REGEX and DELIM_TOKEN_REGEX key off) would print in
  // the clear. `_`/`-` are excluded from the class, so identifiers never match.
  /\b[a-z0-9]{24,}\b/g,
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
// Voice
// ---------------------------------------------------------------------------

/**
 * Subdirectory of the bundled voice-models dir holding the on-device model.
 * Must match `MODEL_ID` in `src/renderer/workers/whisperWorker.ts`, which is
 * what transformers.js actually loads (`${localModelPath}${MODEL_ID}/<file>`).
 */
const BUNDLED_STT_MODEL_ID = 'whisper-tiny';

/**
 * Files that must all be present for the bundled model to load. The tokenizer
 * and preprocessor configs are as load-bearing as the weights — transformers.js
 * throws on a directory that has weights but no tokenizer, so checking only for
 * the `.onnx` files would report a model that cannot transcribe as present.
 */
const BUNDLED_STT_REQUIRED_FILES = ['config.json', 'preprocessor_config.json', 'tokenizer.json'] as const;

/** Subdirectory of the model dir holding the ONNX weights. */
const BUNDLED_STT_WEIGHTS_DIR = 'onnx';

/**
 * Which synthesizer THIS OS ships with — restated here, deliberately, rather
 * than imported from `resolveLocalTtsProvider` in `@/common/types/ttsTypes`
 * (re-exported as `platformNativeTtsProvider` from
 * `@/common/voice/voiceReadiness`).
 *
 * This module is bundled into a standalone node subprocess with no Electron and
 * no app singletons, and it has ZERO imports into app code — that property is
 * what keeps the subprocess startable. Reaching into `@/common/...` for a
 * three-line pure mapping trades it away for nothing, and an Electron-shaped
 * import added ANYWHERE in that graph later would break this subprocess
 * silently, at runtime, in a tool whose whole job is to be trustworthy about
 * what works.
 *
 * `resolveLocalTtsProvider` remains the authority. The unit test asserts this
 * function agrees with it on every platform, so the two cannot drift apart
 * unnoticed.
 */
function localTtsProviderForPlatform(platform: string): string | null {
  if (platform === 'darwin') return 'system-native';
  if (platform === 'win32') return 'windows-native';
  return null;
}

// ---------------------------------------------------------------------------
// Managed agent installs
// ---------------------------------------------------------------------------

/**
 * Receipt filename written at the root of an agent's install prefix. Must match
 * `RECEIPT_FILENAME` in `src/process/services/agentInstaller/installManifest.ts`
 * — restated for the same no-app-imports reason as the TTS mapping above, and
 * pinned by the unit test.
 */
const AGENT_RECEIPT_FILENAME = '.wayland-agent-install.json';

/** True when `candidate` resolves to somewhere inside `root`. */
function isInside(root: string, candidate: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Inspect one install prefix. Never throws: an unreadable prefix is itself a
 * finding, not a reason to take the section down.
 */
function inspectAgentInstall(prefix: string, agentId: string): AgentInstallHealth {
  const base = {
    agentId,
    version: null as string | null,
    installedAt: null as string | null,
    missingLaunchTargets: [] as string[],
  };
  const receiptPath = path.join(prefix, AGENT_RECEIPT_FILENAME);

  let raw: string;
  try {
    raw = fs.readFileSync(receiptPath, 'utf-8');
  } catch {
    return {
      ...base,
      status: 'receipt-missing',
      whyProblem: `An install folder for "${agentId}" exists but has no install receipt, so Wayland will not launch it and the Agents list shows it as not installed. This is what an install that was interrupted partway through leaves behind. Re-install the agent from Settings, or delete the folder.`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (parsed === null || typeof parsed !== 'object') {
    return {
      ...base,
      status: 'receipt-unreadable',
      whyProblem: `The install receipt for "${agentId}" is not readable JSON, so Wayland treats the agent as not installed and will not launch it. Re-install the agent from Settings to write a fresh receipt.`,
    };
  }

  const receipt = parsed as Record<string, unknown>;
  const version = asNullableString(receipt.version);
  const installedAt = asNullableString(receipt.installedAt);
  const recordedPrefix = asNullableString(receipt.prefix);
  const recordedAgentId = asNullableString(receipt.agentId);
  const withMeta = { agentId, version, installedAt, missingLaunchTargets: [] as string[] };

  const launchSpec = (receipt.launchSpec ?? null) as Record<string, unknown> | null;
  const command =
    launchSpec && typeof launchSpec === 'object' && typeof launchSpec.command === 'string' ? launchSpec.command : null;
  const args =
    launchSpec && typeof launchSpec === 'object' && Array.isArray(launchSpec.args)
      ? launchSpec.args.filter((a): a is string => typeof a === 'string')
      : null;
  if (!command || command.length === 0 || args === null) {
    return {
      ...withMeta,
      status: 'receipt-unreadable',
      whyProblem: `The install receipt for "${agentId}" has no usable launch command, so Wayland cannot start the agent and treats it as not installed. Re-install the agent from Settings.`,
    };
  }

  // A receipt naming a different agent or a different folder was copied in from
  // somewhere else. The real uninstall path refuses to act on one; report it
  // rather than trusting the paths inside it.
  if (recordedAgentId && recordedAgentId !== agentId) {
    return {
      ...withMeta,
      status: 'receipt-mismatch',
      whyProblem: `The receipt in the "${agentId}" folder says it belongs to "${recordedAgentId}". Wayland refuses to act on a receipt that disagrees with where it sits, so the agent will neither launch nor uninstall cleanly. Re-install it from Settings.`,
    };
  }
  if (recordedPrefix && path.resolve(recordedPrefix) !== path.resolve(prefix)) {
    return {
      ...withMeta,
      status: 'receipt-mismatch',
      whyProblem: `The receipt for "${agentId}" records a different install folder than the one it sits in, which happens when a profile is copied between machines or accounts. Wayland refuses to act on it, so the agent will neither launch nor uninstall cleanly. Re-install it from Settings.`,
    };
  }

  // The launch target: the command itself, plus any absolute argument that
  // points INSIDE this prefix (the installed package entry point — the thing an
  // `npm`/`bun` prune or a partial delete takes away while the receipt survives).
  const targets = [command, ...args.filter((a) => path.isAbsolute(a) && isInside(prefix, a))];
  const missing = targets.filter((t) => !fs.existsSync(t));
  if (missing.length > 0) {
    return {
      ...withMeta,
      missingLaunchTargets: missing.map((m) => scrubHome(m)),
      status: 'launch-target-missing',
      whyProblem: `"${agentId}" has a valid install receipt, but the program it points at is no longer on disk. Wayland cannot tell this apart from "never installed", so the agent simply does not appear and nothing explains why. Re-install it from Settings.`,
    };
  }

  return { ...withMeta, status: 'ok', whyProblem: null };
}

// ---------------------------------------------------------------------------
// TVControl
// ---------------------------------------------------------------------------

/** Catalog id of the TVControl connector (`src/renderer/mcp-catalog`). */
const TVCONTROL_LIBRARY_ENTRY_ID = 'com.ferroxlabs/tvcontrol';

/**
 * The one claim this section is careful NOT to make. Nothing here opens a
 * socket, so "present and enabled" is a statement about a config file, not
 * about a reachable chart.
 */
const TVCONTROL_NOTE =
  'This reports only what the settings file records about the TVControl connector. This diagnostics tool cannot connect to TVControl or to TradingView, so "present and enabled" is not proof that a chart is reachable right now.';

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
  const appArch = deps.appArch ?? process.env.WAYLAND_APP_ARCH;
  const arm64Translated = deps.runningUnderARM64Translation ?? process.env.WAYLAND_ARM64_TRANSLATED === '1';
  const voiceModelsDir = deps.voiceModelsDir ?? process.env.WAYLAND_VOICE_MODELS_DIR;
  const agentInstallRoot = deps.agentInstallRoot ?? process.env.WAYLAND_AGENT_INSTALL_ROOT;

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
      // #1008: a bundled first-party server has no command, args or credentials
      // the user owns, so telling them to check those sends them looking for a
      // mistake they cannot have made. Say plainly that it is ours to fix.
      // #1015: the four sibling @wayland servers (Apple/IMAP/News/Cal.com) do NOT
      // carry `builtin`, so they fell into the user-error branch and were told to
      // check a command and args Wayland wrote. Their spawn is ours; their
      // credentials genuinely are the user's, so they get their own line rather
      // than either of the other two.
      const flag =
        enabled && toolCount === 0
          ? s.builtin === true
            ? 'Enabled but exposes 0 tools — this is a server bundled with Wayland, so there is nothing for you to configure. It either failed to start or has not been probed yet. Please report it.'
            : isBundledWaylandMcpEntryId(asNullableString(s.libraryEntryId))
              ? 'Enabled but exposes 0 tools — this server ships with Wayland, so its command and args are not yours to fix. Check any credentials you entered for it; if those are correct, please report it.'
              : 'Enabled but exposes 0 tools — it likely failed to connect or registered nothing; check its command, args, or credentials.'
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
    // #1038: readdirSync returns DIRECTORY order, not sorted and not by time, so
    // taking the first MAX_LOG_FILES entries kept an arbitrary subset that in
    // practice skewed oldest. A diagnostics bundle then reported stale lines
    // under the heading "recent errors", and every triage that trusted it was
    // reading the wrong data. Select by mtime, newest first, then walk the
    // survivors oldest-first so the trailing MAX_LOG_LINES slice below really is
    // the most recent output rather than whichever file happened to be last.
    let files: Array<{ name: string; stat: fs.Stats }>;
    try {
      files = fs
        .readdirSync(logDir)
        .filter((f) => f.endsWith('.log') || f.endsWith('.txt'))
        .map((name) => {
          try {
            const stat = fs.statSync(path.join(logDir, name));
            return stat.isFile() ? { name, stat } : null;
          } catch {
            // Vanished or turned unreadable between readdir and stat. A rotating
            // log directory does this routinely, and one missing file must not
            // cost the whole section.
            return null;
          }
        })
        .filter((entry): entry is { name: string; stat: fs.Stats } => entry !== null)
        .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs)
        .slice(0, MAX_LOG_FILES)
        .reverse();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, source: `log dir read failed: ${scrubHome(message)}`, lines: [] };
    }

    const collected: string[] = [];
    for (const { name: file, stat } of files) {
      const full = path.join(logDir, file);
      try {
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

  /**
   * Platform report: is the INSTALLED build the right one for this machine?
   * We publish separate macOS x64 and arm64 builds, and macOS silently runs the
   * Intel one under Rosetta on Apple Silicon — it works, it is just slower and
   * burns more battery, with nothing on screen to say so. This is the section
   * that answers "why is Wayland slow on my new Mac?".
   */
  const readPlatform = (): PlatformSection => {
    const info: PlatformInfo = {
      os: os.platform(),
      appArch: appArch ?? null,
      runningUnderARM64Translation: arm64Translated,
      whyProblem: arm64Translated
        ? 'This install is the Intel/x64 build of Wayland running on an ARM64 machine through a translation layer (macOS Rosetta / Windows ARM64 emulation) rather than natively. Everything works, but it is slower and uses more battery. Installing the ARM64 build over this copy fixes it and keeps all settings and chats.'
        : null,
    };
    return { available: appArch != null || arm64Translated, source: 'app runtime', info };
  };

  /**
   * Voice report: can this install LISTEN, and can it resolve something to
   * SPEAK with?
   *
   * The two legs are answered by two completely different kinds of evidence and
   * are deliberately not merged into one verdict:
   *
   *  - LISTENING is a file question. The on-device transcriber is a model
   *    bundled in the installer, so "is speech input usable" reduces to "is that
   *    model complete on disk", which this can check directly.
   *  - SPEAKING is a platform question. `resolveLocalTtsProvider` maps the OS to
   *    its built-in synthesizer, and that is ALL that is reported. Nothing in
   *    this codebase enumerates the voices an OS actually has installed, so
   *    saying "text to speech is available" would be a claim no evidence
   *    supports. Resolution is stated; availability is not.
   */
  const readVoice = (): VoiceSection => {
    const platform = os.platform();
    const resolvedLocalProvider = localTtsProviderForPlatform(platform);
    const tts: VoiceTtsInfo = {
      platform,
      resolvedLocalProvider,
      whyProblem: resolvedLocalProvider
        ? null
        : 'This operating system has no built-in speech synthesizer Wayland can drive (macOS uses `say`, Windows uses System.Speech; this build has neither elsewhere), so Wayland cannot read replies aloud here without a hosted voice provider.',
      note: 'This says which local synthesizer Wayland would resolve for this platform. It does NOT check that a system voice is installed or that any audio would actually be produced, so a resolved provider is not a promise that speech output will be audible.',
    };

    const unreadableStt = (whyProblem: string | null): VoiceSttInfo => ({
      bundledModelPresent: false,
      modelDir: null,
      missingFiles: [],
      whyProblem,
    });

    if (!voiceModelsDir) {
      return {
        available: false,
        source: 'voice models dir not set',
        stt: unreadableStt(
          'Wayland did not tell this diagnostics tool where the bundled speech model lives, so whether speech input can run could not be checked here.'
        ),
        tts,
      };
    }

    const modelDir = path.join(voiceModelsDir, BUNDLED_STT_MODEL_ID);
    if (!fs.existsSync(modelDir)) {
      return {
        available: false,
        source: `voice models dir unavailable: ${scrubHome(voiceModelsDir)}`,
        stt: {
          bundledModelPresent: false,
          modelDir: scrubHome(modelDir),
          missingFiles: [],
          whyProblem:
            'The on-device speech model that ships with Wayland is not on disk, so speech input cannot run. Re-installing Wayland restores it.',
        },
        tts,
      };
    }

    const missingFiles: string[] = [];
    for (const file of BUNDLED_STT_REQUIRED_FILES) {
      if (!fs.existsSync(path.join(modelDir, file))) missingFiles.push(file);
    }
    let weightCount = 0;
    try {
      weightCount = fs
        .readdirSync(path.join(modelDir, BUNDLED_STT_WEIGHTS_DIR))
        .filter((f) => f.endsWith('.onnx')).length;
    } catch {
      // Missing or unreadable weights dir — reported as the missing entry below.
    }
    if (weightCount === 0) missingFiles.push(`${BUNDLED_STT_WEIGHTS_DIR}/*.onnx`);

    const present = missingFiles.length === 0;
    return {
      available: true,
      source: scrubHome(modelDir),
      stt: {
        bundledModelPresent: present,
        modelDir: scrubHome(modelDir),
        missingFiles,
        whyProblem: present
          ? null
          : 'The on-device speech model that ships with Wayland is incomplete on disk, so speech input cannot run. Re-installing Wayland restores it.',
      },
      tts,
    };
  };

  /**
   * Agent-install report: is each managed agent's install receipt intact, or is
   * it an orphan?
   *
   * Driven by the FILESYSTEM, not by the pinned agent catalogue, and that is the
   * point: the catalogue can only describe agents Wayland knows how to install,
   * while the failures that go unreported are folders left behind by installs
   * that died, and receipts pointing at programs that have since been deleted.
   * Listing what is actually on disk surfaces both.
   */
  const readAgentInstalls = (): DiagSection<AgentInstallHealth> => {
    if (!agentInstallRoot || !fs.existsSync(agentInstallRoot)) {
      return {
        available: false,
        source: agentInstallRoot
          ? `agent install root unavailable: ${scrubHome(agentInstallRoot)}`
          : 'agent install root not set',
        items: [],
      };
    }
    let names: string[];
    try {
      names = fs
        .readdirSync(agentInstallRoot, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { available: false, source: `agent install root read failed: ${scrubHome(message)}`, items: [] };
    }
    const items = names.map((name) => inspectAgentInstall(path.join(agentInstallRoot, name), name));
    return { available: true, source: 'agent install receipts', items };
  };

  /** TVControl connector presence/enablement, read from `mcp.config`. */
  const readTvControl = (): TvControlSection => {
    const absent: TvControlInfo = {
      present: false,
      enabled: false,
      status: null,
      toolCount: 0,
      lastError: null,
      whyProblem: null,
      note: TVCONTROL_NOTE,
    };
    const config = readConfigJson(configPath);
    if (!config) {
      return {
        available: false,
        source: configPath ? `config unavailable: ${scrubHome(configPath)}` : 'config path not set',
        info: absent,
      };
    }
    const servers = config['mcp.config'];
    if (!Array.isArray(servers)) {
      return { available: false, source: 'config has no mcp.config array', info: absent };
    }
    // Matched on `libraryEntryId` ONLY — the canonical catalogue slug the
    // installer stamps. The display name is user-editable, so matching it would
    // let a renamed connector read as absent and an unrelated one read as
    // present.
    const raw = servers.find(
      (entry) => (entry as Record<string, unknown> | null)?.['libraryEntryId'] === TVCONTROL_LIBRARY_ENTRY_ID
    ) as Record<string, unknown> | undefined;
    if (!raw) {
      return {
        available: true,
        source: 'mcp.config',
        info: {
          ...absent,
          whyProblem:
            'The TVControl connector is not installed, so nothing here can read or drive a TradingView chart. Install it from Settings, MCP Library.',
        },
      };
    }
    const enabled = raw.enabled === true;
    const toolCount = Array.isArray(raw.tools) ? raw.tools.length : 0;
    const lastError = asNullableString(raw.lastError);
    const whyProblem = !enabled
      ? 'The TVControl connector is installed but switched off, so its tools are not offered to the agent. Turn it on in Settings, MCP.'
      : lastError
        ? `The TVControl connector is on, but its last connection attempt failed: ${lastError}.`
        : toolCount === 0
          ? 'The TVControl connector is on but exposes no tools, which usually means it never connected. Check that TradingView Desktop is running, then re-test the connector in Settings, MCP.'
          : null;
    return {
      available: true,
      source: 'mcp.config',
      info: {
        present: true,
        enabled,
        status: asNullableString(raw.status),
        toolCount,
        lastError,
        whyProblem,
        note: TVCONTROL_NOTE,
      },
    };
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
        platform: readPlatform(),
        voice: readVoice(),
        agentInstalls: readAgentInstalls(),
        tvControl: readTvControl(),
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

    /** Voice only: bundled speech model on disk + which local synthesizer resolves. */
    voice(): VoiceSection {
      return sanitize(readVoice());
    },

    /** Managed agent installs only: receipt intact, orphaned, or pointing at nothing. */
    agentInstalls(): DiagSection<AgentInstallHealth> {
      return sanitize(readAgentInstalls());
    },

    /** TVControl connector only: present and enabled, per the settings file. */
    tvControl(): TvControlSection {
      return sanitize(readTvControl());
    },

    /** Recent redacted error lines from the log directory. */
    recentErrors(): RecentErrorsSection {
      return sanitize(readRecentErrors());
    },
  };
};

export type ConciergeDiagServer = ReturnType<typeof createConciergeDiagServer>;
