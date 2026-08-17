/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1024 - in-app recovery for an engine `config.toml` that is not valid TOML.
 *
 * WHY THIS EXISTS AND WHAT IT DELIBERATELY DOES NOT DO
 *
 * `spliceDesktopMcpProfile` (desktopProfileSplice.ts) REFUSES to touch an
 * unparseable global `config.toml`, and that refusal is correct: that file holds
 * the user's real providers, credentials and memory/skills settings, so
 * discarding it would be catastrophic data loss rather than a benign reset. This
 * module does NOT loosen that guard, does not make the splice tolerant, and
 * never resets the file on its own. It exists because the refusal used to be a
 * DEAD END - the app told a non-technical user to hand-edit TOML and stopped
 * (#1024: a reporter spent ~2h in a terminal). The way out has to preserve their
 * data, so every write here is preceded by a VERIFIED timestamped backup.
 *
 * INVARIANTS, in the order they are enforced:
 *  1. A backup is written and PROVEN byte-identical (length + sha256) before the
 *     original is touched. If the backup cannot be proven, nothing is written
 *     and the caller is told so - see {@link createVerifiedBackup}.
 *  2. The one automatic repair only ever INSERTS `\n` characters. Enforced by
 *     comparing both texts with every `\n` removed ({@link isLineBreakOnlyEdit}),
 *     so a repair can never alter, reorder or drop a single user byte.
 *  3. A repair is only offered when it is UNAMBIGUOUS: exactly one candidate
 *     line-break position makes the whole document parse. Two candidates that
 *     both parse produce different files, so we refuse to guess.
 *  4. Regenerating defaults requires an explicit `confirmed` flag from the
 *     caller AND still takes the verified backup first.
 *
 * SECURITY: nothing here returns `config.toml` CONTENT. Only the path, the
 * failure's LINE and COLUMN (credential-free integers), and a scrubbed one-line
 * reason cross the process boundary. `desktopProfileSplice.ts` documents why the
 * echoed source line must be dropped - a `smol-toml` parse error quotes the
 * offending line verbatim, and that line can be an `api_key`. This module
 * follows that precedent exactly, and additionally routes the surviving reason
 * through the shared `redactCommandSecrets` scrubber.
 */
import { createHash } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parse } from 'smol-toml';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';
import { multilineStringLineStates } from './desktopProfileSplice';
import { resolveActiveConfigPath } from './profilePaths';

/** Where the parser gave up. Integers only - never the offending line's text. */
export type EngineConfigProblem = {
  /** 1-based line number of the first parse failure. */
  line: number;
  /** 1-based column number of the first parse failure. */
  column: number;
  /**
   * The parser's own one-line reason, scrubbed. The echoed source block a
   * `smol-toml` message carries after a blank line is dropped entirely.
   */
  reason: string;
};

/**
 * The automatic repair, described WITHOUT quoting the file. `lineBreaks` is how
 * many `\n` characters would be inserted; nothing else about the file changes.
 */
export type EngineConfigRepairPlan = { lineBreaks: number };

/** What {@link inspectEngineConfig} reports to the UI. Content-free by design. */
export type EngineConfigInspection =
  | { status: 'ok'; path: string }
  | { status: 'missing'; path: string }
  | { status: 'unreadable'; path: string; reason: string }
  | {
      status: 'invalid';
      path: string;
      problem: EngineConfigProblem;
      /** `null` when no unambiguous automatic fix exists. */
      repair: EngineConfigRepairPlan | null;
    };

/** Why a write-side recovery action did not complete. */
export type EngineConfigRecoveryFailure =
  /** The backup could not be proven; NOTHING was written. */
  | 'backup-failed'
  /** Regenerate was called without confirmation; nothing happened. */
  | 'not-confirmed'
  /** The file parses, or no unambiguous fix exists. */
  | 'nothing-to-repair'
  /** There is no file to act on. */
  | 'missing'
  /** The write failed AFTER a good backup was taken. */
  | 'write-failed';

/**
 * Outcome of a write-side recovery action.
 *
 * A FLAT shape with optional members rather than an `ok: true | false`
 * discriminated union, deliberately: this repo's `tsconfig.json` does not enable
 * `strictNullChecks`, so a boolean discriminant does not narrow and every
 * consumer would need a cast. `ShellOpenResult` in `ipcBridge.ts` is flat for the
 * same reason. `backupPath` is set on success and also on a post-backup failure
 * (the user still needs to know where their data went); `reason`/`detail` are set
 * only on failure.
 */
export type EngineConfigRecoveryResult = {
  ok: boolean;
  /** Path of the verified backup, when one was taken. */
  backupPath?: string;
  /** Stable machine code for the failure. Absent on success. */
  reason?: EngineConfigRecoveryFailure;
  /** Scrubbed one-line detail for the log/UI. Never file content. */
  detail?: string;
};

/** Injectable seam so the tests can force each branch (incl. a failing backup). */
export type EngineConfigRecoveryDeps = {
  resolveConfigPath: () => Promise<string>;
  readFileUtf8: (path: string) => Promise<string>;
  writeFileExclusive: (path: string, data: string) => Promise<void>;
  writeFileAtomic: (path: string, data: string) => Promise<void>;
  removeFile: (path: string) => Promise<void>;
  now: () => Date;
};

/** Hard cap on the repair loop: a file needing more than this is not "one line". */
const MAX_REPAIR_STEPS = 8;

/** Any bare TOML key immediately followed by `=`, anchored at a candidate offset. */
const BARE_KEY_ASSIGNMENT_RE = /^[A-Za-z0-9_-]+[ \t]*=/;

/**
 * First line of a parse error's message, scrubbed.
 *
 * Byte-for-byte the same posture as `summarizeTomlError` in
 * `desktopProfileSplice.ts`: keep only the human-readable reason, drop the
 * echoed source block. The extra `redactCommandSecrets` pass is belt-and-braces
 * for the shapes that DO name a key (e.g. a duplicate-key message).
 */
function summarizeReason(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return redactCommandSecrets(raw.split('\n', 1)[0].trim());
}

/** Duck-typed `smol-toml` `TomlError` position. Returns `null` for other errors. */
function parsePosition(error: unknown): { line: number; column: number } | null {
  const candidate = error as { line?: unknown; column?: unknown } | null;
  if (!candidate || typeof candidate.line !== 'number' || typeof candidate.column !== 'number') return null;
  if (!Number.isFinite(candidate.line) || !Number.isFinite(candidate.column)) return null;
  return { line: candidate.line, column: candidate.column };
}

/** `null` when `source` parses; otherwise where and why it failed. */
export function findParseProblem(source: string): EngineConfigProblem | null {
  try {
    parse(source);
    return null;
  } catch (error) {
    const position = parsePosition(error);
    return {
      line: position?.line ?? 1,
      column: position?.column ?? 1,
      reason: summarizeReason(error),
    };
  }
}

/**
 * True iff `after` differs from `before` ONLY by inserted line breaks.
 *
 * This is the invariant that makes the automatic repair safe to offer at all: a
 * candidate that changed, reordered or dropped any other byte fails here and is
 * discarded, so no repair can ever lose a character of the user's config.
 */
export function isLineBreakOnlyEdit(before: string, after: string): boolean {
  if (after.length <= before.length) return false;
  return before.replace(/\n/g, '') === after.replace(/\n/g, '');
}

/**
 * Offsets on `line` where a line break could plausibly belong: the start of a
 * bare `key =` assignment, or a `[` table header, that is NOT the line's own
 * first token. Positions inside a single-line string or after a `#` comment are
 * excluded - there the bracket or `key =` shape is DATA, not structure.
 */
function candidateBreakOffsets(line: string): number[] {
  const firstToken = line.search(/\S/);
  if (firstToken < 0) return [];

  const offsets: number[] = [];
  let inQuoted = false;
  let inApostrophe = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuoted) {
      if (ch === '\\') i += 1;
      else if (ch === '"') inQuoted = false;
      continue;
    }
    if (inApostrophe) {
      if (ch === "'") inApostrophe = false;
      continue;
    }
    if (ch === '#') break; // the rest of the line is a comment
    if (ch === '"') {
      inQuoted = true;
      continue;
    }
    if (ch === "'") {
      inApostrophe = true;
      continue;
    }
    // Only a position strictly after the line's own opening token can be a
    // missing line break; splitting before it would just re-create the line.
    if (i <= firstToken) continue;
    if (ch === '[' || BARE_KEY_ASSIGNMENT_RE.test(line.slice(i))) offsets.push(i);
  }

  return offsets;
}

/**
 * One repair step: insert exactly one `\n` on `lineNumber` so the whole document
 * parses. Returns `null` unless EXACTLY ONE distinct candidate works - two
 * working candidates produce two different files, and guessing which one the
 * user meant is precisely the data-loss risk this module exists to avoid.
 */
function planSingleLineBreak(source: string, lineNumber: number): { column: number; next: string } | null {
  const lines = source.split('\n');
  const index = lineNumber - 1;
  if (index < 0 || index >= lines.length) return null;

  // A line that BEGINS inside a `"""`/`'''` string is user DATA, not structure.
  // Inserting a newline there would silently rewrite the value even if the
  // result parses, so refuse - the same reasoning `removeReservedProfileTables`
  // relies on for its own line scanner.
  if (multilineStringLineStates(source)[index]) return null;

  const line = lines[index];
  const accepted: { column: number; next: string }[] = [];
  const seen = new Set<string>();

  for (const offset of candidateBreakOffsets(line)) {
    const patched = [...lines];
    patched[index] = `${line.slice(0, offset)}\n${line.slice(offset)}`;
    const next = patched.join('\n');
    if (seen.has(next)) continue;
    seen.add(next);
    if (!isLineBreakOnlyEdit(source, next)) continue;
    // The step is accepted when THIS line stops being the failure point. A later
    // line may still be malformed; the caller loops for that.
    const problem = findParseProblem(next);
    if (problem && problem.line <= lineNumber) continue;
    accepted.push({ column: offset + 1, next });
  }

  return accepted.length === 1 ? accepted[0] : null;
}

/**
 * The full automatic repair: repeatedly insert one unambiguous line break until
 * the document parses. `null` when `source` already parses, when any step is
 * ambiguous, or when it would take more than {@link MAX_REPAIR_STEPS} steps.
 */
export function planLineBreakRepair(source: string): { plan: EngineConfigRepairPlan; repaired: string } | null {
  let current = source;
  let lineBreaks = 0;

  for (let step = 0; step < MAX_REPAIR_STEPS; step += 1) {
    const problem = findParseProblem(current);
    if (!problem) {
      if (lineBreaks === 0) return null; // already valid - nothing to repair
      // Re-assert the whole-document invariant against the ORIGINAL source, not
      // just per step, so no accumulation of steps can drift off it.
      if (!isLineBreakOnlyEdit(source, current)) return null;
      return { plan: { lineBreaks }, repaired: current };
    }
    const next = planSingleLineBreak(current, problem.line);
    if (!next) return null;
    current = next.next;
    lineBreaks += 1;
  }

  return null;
}

/** Timestamp for a backup filename. NO colons - illegal on NTFS (Windows ADS). */
export function backupStamp(when: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${when.getFullYear()}${pad(when.getMonth() + 1)}${pad(when.getDate())}` +
    `-${pad(when.getHours())}${pad(when.getMinutes())}${pad(when.getSeconds())}`
  );
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf-8').digest('hex');
}

/** Thrown when a backup could not be written AND proven identical. */
export class EngineConfigBackupError extends Error {
  readonly code = 'ENGINE_CONFIG_BACKUP_FAILED' as const;
  constructor(detail: string) {
    super(`Could not create a verified backup of the engine config: ${detail}`);
    this.name = 'EngineConfigBackupError';
  }
}

/**
 * Write `content` to a timestamped sibling of `configPath` and PROVE the bytes
 * landed: the backup is read back and compared by length and sha256.
 *
 * This is step 1 of every write path in this module and it is not optional. An
 * unproven backup throws {@link EngineConfigBackupError}, and every caller
 * treats that as "do nothing at all" - the user's broken config is still their
 * only copy of their credentials, so a repair we cannot undo is worse than no
 * repair. An exclusive (`wx`) create means a colliding name is retried rather
 * than an existing backup being overwritten.
 */
export async function createVerifiedBackup(
  configPath: string,
  content: string,
  deps: EngineConfigRecoveryDeps
): Promise<string> {
  const dir = dirname(configPath);
  const stamp = backupStamp(deps.now());
  let lastError = 'no candidate name available';

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const backupPath = join(dir, `config.toml.backup-${stamp}${suffix}`);
    try {
      await deps.writeFileExclusive(backupPath, content);
    } catch (error) {
      // EEXIST just means this second already has a backup; anything else is a
      // real failure (permissions, disk full) and must not be retried silently.
      const code = (error as { code?: string } | null)?.code;
      lastError = summarizeReason(error);
      if (code === 'EEXIST') continue;
      throw new EngineConfigBackupError(lastError);
    }

    let readBack: string;
    try {
      readBack = await deps.readFileUtf8(backupPath);
    } catch (error) {
      throw new EngineConfigBackupError(`backup could not be read back: ${summarizeReason(error)}`);
    }
    if (readBack.length !== content.length || sha256(readBack) !== sha256(content)) {
      throw new EngineConfigBackupError('backup does not match the original byte-for-byte');
    }
    return backupPath;
  }

  throw new EngineConfigBackupError(lastError);
}

/** Live dependencies: atomic (tmp + rename) writes, real clock, active profile. */
export function defaultRecoveryDeps(): EngineConfigRecoveryDeps {
  return {
    resolveConfigPath: resolveActiveConfigPath,
    readFileUtf8: (path) => readFile(path, 'utf-8'),
    writeFileExclusive: async (path, data) => {
      await writeFile(path, data, { encoding: 'utf-8', flag: 'wx', mode: 0o600 });
    },
    writeFileAtomic: async (path, data) => {
      const temp = `${path}.wayland-recovery-${process.pid}.tmp`;
      await writeFile(temp, data, { encoding: 'utf-8', mode: 0o600 });
      await rename(temp, path);
    },
    removeFile: (path) => unlink(path),
    now: () => new Date(),
  };
}

/**
 * Inspect the ACTIVE profile's `config.toml` and report an actionable state.
 *
 * Never throws: an unreadable file is a reported status, because this is the
 * function the failure UI calls and it must always have something to render.
 */
export async function inspectEngineConfig(
  deps: EngineConfigRecoveryDeps = defaultRecoveryDeps()
): Promise<EngineConfigInspection> {
  let path: string;
  try {
    path = await deps.resolveConfigPath();
  } catch (error) {
    return { status: 'unreadable', path: '', reason: summarizeReason(error) };
  }

  let source: string;
  try {
    source = await deps.readFileUtf8(path);
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'ENOENT') return { status: 'missing', path };
    return { status: 'unreadable', path, reason: summarizeReason(error) };
  }

  const problem = findParseProblem(source);
  if (!problem) return { status: 'ok', path };
  return { status: 'invalid', path, problem, repair: planLineBreakRepair(source)?.plan ?? null };
}

/**
 * Apply the unambiguous line-break repair. Order is load-bearing: inspect,
 * verify a repair exists, take a VERIFIED backup, and only then write. A failed
 * backup returns `backup-failed` with the original untouched.
 */
export async function repairEngineConfig(
  deps: EngineConfigRecoveryDeps = defaultRecoveryDeps()
): Promise<EngineConfigRecoveryResult> {
  const path = await deps.resolveConfigPath();
  let source: string;
  try {
    source = await deps.readFileUtf8(path);
  } catch (error) {
    const missing = (error as { code?: string } | null)?.code === 'ENOENT';
    return {
      ok: false,
      reason: missing ? 'missing' : 'write-failed',
      detail: summarizeReason(error),
    };
  }

  const repair = planLineBreakRepair(source);
  if (!repair) {
    return { ok: false, reason: 'nothing-to-repair', detail: 'no unambiguous single-line fix was found' };
  }

  let backupPath: string;
  try {
    backupPath = await createVerifiedBackup(path, source, deps);
  } catch (error) {
    return { ok: false, reason: 'backup-failed', detail: summarizeReason(error) };
  }

  try {
    await deps.writeFileAtomic(path, repair.repaired);
  } catch (error) {
    return { ok: false, reason: 'write-failed', detail: summarizeReason(error), backupPath };
  }

  // Confirm from DISK, not from the in-memory candidate: the point of the whole
  // flow is that the app can launch against the file that is actually there.
  try {
    const written = await deps.readFileUtf8(path);
    if (findParseProblem(written)) {
      await deps.writeFileAtomic(path, source);
      return { ok: false, reason: 'write-failed', detail: 'the repaired file still does not parse', backupPath };
    }
  } catch (error) {
    return { ok: false, reason: 'write-failed', detail: summarizeReason(error), backupPath };
  }

  return { ok: true, backupPath };
}

/**
 * Remove `config.toml` so the engine writes fresh defaults on the next launch.
 *
 * DESTRUCTIVE: it discards the user's providers, credentials and memory/skills
 * settings from the live file. Two guards, both mandatory: `confirmed` must be
 * `true` (the UI only sets it from an explicit confirmation that NAMES what is
 * lost), and the verified backup must already be on disk - so "discarded" means
 * "moved to a file we proved is identical", never "gone".
 */
export async function regenerateEngineConfig(
  options: { confirmed: boolean },
  deps: EngineConfigRecoveryDeps = defaultRecoveryDeps()
): Promise<EngineConfigRecoveryResult> {
  if (!options.confirmed) {
    return { ok: false, reason: 'not-confirmed', detail: 'regenerate requires an explicit confirmation' };
  }

  const path = await deps.resolveConfigPath();
  let source: string;
  try {
    source = await deps.readFileUtf8(path);
  } catch (error) {
    const missing = (error as { code?: string } | null)?.code === 'ENOENT';
    return { ok: false, reason: missing ? 'missing' : 'write-failed', detail: summarizeReason(error) };
  }

  let backupPath: string;
  try {
    backupPath = await createVerifiedBackup(path, source, deps);
  } catch (error) {
    return { ok: false, reason: 'backup-failed', detail: summarizeReason(error) };
  }

  try {
    await deps.removeFile(path);
  } catch (error) {
    return { ok: false, reason: 'write-failed', detail: summarizeReason(error), backupPath };
  }

  return { ok: true, backupPath };
}
