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
 *  1. The backup is made by RENAMING the original aside, never by copying it.
 *     A rename is atomic and byte-exact by construction: no decode, no
 *     re-encode, no partial write. This is not a style choice - the first
 *     version of this file copied via `readFile(path, 'utf-8')`, and Node
 *     substitutes U+FFFD for every invalid byte DURING that decode, so a
 *     sha256 taken over the resulting string compared a mangled string to
 *     itself and ALWAYS passed. Executed against a config holding a lone
 *     `0xE9`: a 96-byte original produced a 98-byte "verified" backup with
 *     `EF BF BD` substituted, and regenerate then deleted the only copy of the
 *     real bytes. A truncated or legacy-encoded config is precisely the
 *     corruption class this feature exists to handle.
 *  2. The rename is still VERIFIED, now at the BUFFER level: the backup is read
 *     back as raw bytes and compared with `Buffer.equals` against the bytes the
 *     repair was planned from. A mismatch means the file changed underneath us,
 *     so the backup is renamed back and the caller is refused - which closes the
 *     read-then-write TOCTOU window as well.
 *  3. Nothing is ever written to `config.toml` while the original is still
 *     there. After the rename the path does not exist, so the repair is written
 *     with an EXCLUSIVE create (`wx`) - no temp file, no predictable temp name,
 *     and no symlink for a write to follow. Any failure renames the backup back.
 *  4. Text is decoded for PARSING with a FATAL `TextDecoder`, so a file that is
 *     not losslessly UTF-8 can never be offered an automatic repair. TOML
 *     documents must be valid UTF-8, so such a file is reported as invalid with
 *     no repair rather than silently rewritten.
 *  5. The one automatic repair only ever INSERTS `\n` characters. Enforced by
 *     comparing both texts with every `\n` removed ({@link isLineBreakOnlyEdit}),
 *     so a repair can never alter, reorder or drop a single user byte.
 *  6. A repair is only offered when it is UNAMBIGUOUS: exactly one candidate
 *     line-break position makes the whole document parse. Two candidates that
 *     both parse produce different files, so we refuse to guess.
 *  7. Regenerating defaults requires `confirmed === true` (identity, not
 *     truthiness) AND refuses outright when the file actually parses - deleting
 *     a healthy credential-bearing config on a caller's say-so is not a
 *     recovery path. It is the rename itself that "removes" the file, so the
 *     user's data is always still on disk under the backup name.
 *
 * SECURITY: nothing here returns `config.toml` CONTENT. Only the path, the
 * failure's LINE and COLUMN (credential-free integers), and a scrubbed one-line
 * reason cross the process boundary. `desktopProfileSplice.ts` documents why the
 * echoed source line must be dropped - a `smol-toml` parse error quotes the
 * offending line verbatim, and that line can be an `api_key`. This module
 * follows that precedent exactly, and additionally routes the surviving reason
 * through the shared `redactCommandSecrets` scrubber.
 */
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
      /**
       * Where the TOML parser gave up. ABSENT when the file is not losslessly
       * UTF-8: there is no meaningful line/column for a byte-level encoding
       * fault, and the document was never decoded to look for one.
       */
      problem?: EngineConfigProblem;
      /**
       * True when the file's bytes are not valid UTF-8. TOML documents must be
       * valid UTF-8, so this is a real fault and not a warning - and it is a
       * hard stop for the automatic repair, which would otherwise write back a
       * U+FFFD-substituted rendering of the user's own bytes. `repair` is always
       * `null` when this is set.
       */
      encodingLossy?: boolean;
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
  /**
   * Read RAW BYTES. Deliberately not a string: `readFile(path, 'utf-8')`
   * substitutes U+FFFD for invalid bytes during the decode, which is what made
   * the original byte-identical check blind (see invariant 1 in the head).
   */
  readFileBytes: (path: string) => Promise<Buffer>;
  /** Create `path` with `wx` - fails if anything, including a symlink, exists. */
  writeFileExclusive: (path: string, data: string) => Promise<void>;
  /** Atomic, byte-exact move. The ONLY way this module makes a backup. */
  renameFile: (from: string, to: string) => Promise<void>;
  /**
   * Delete a file. Used ONLY to clean up a backup-name placeholder this module
   * created moments earlier, or a repair write it is about to roll back - never
   * to delete the user's `config.toml`. That "deletion" is the rename in
   * {@link createVerifiedBackup}, so the bytes are always still on disk.
   */
  removeFile: (path: string) => Promise<void>;
  now: () => Date;
};

/** Hard cap on the repair loop: a file needing more than this is not "one line". */
const MAX_REPAIR_STEPS = 8;

/**
 * THE cost bound on the automatic repair (F7): one CUMULATIVE budget spent by
 * every parse the planner performs.
 *
 * Each candidate break position costs a full re-parse of the WHOLE document, so
 * the real cost is a PRODUCT - steps x candidates x document size - and all of it
 * is synchronous work on the Electron MAIN thread, in a channel that auto-fires
 * when the recovery panel mounts. The first version of this bounded the three
 * factors SEPARATELY, which does not bound their product: an input can sit just
 * under every individual cap and still land in the expensive regime. Measured on
 * a realistic config with the glued line near the END of the document (so every
 * re-parse has to chew through the whole valid prefix before it reaches the
 * break): 514 KB and 116 candidates, both under their caps, spent 58 MB across
 * 117 parses. One parse of that document is ~310ms, so that is tens of seconds of
 * frozen app - every window and all IPC - on the one surface a user only reaches
 * when they are already broken.
 *
 * So the bound has to be on the total, not on the factors. `spendParseBudget`
 * charges every parse against both a byte budget and a wall-clock deadline, and
 * the planner gives up the moment either runs out. The byte budget is the
 * deterministic one a test can assert; the deadline is what actually bounds the
 * freeze on a machine slower than the one this was measured on.
 *
 * The real #1024 shape is ~150 bytes with 24 candidates and spends well under
 * 1 MB, so this costs nothing real. Past it the honest answer is "no automatic
 * fix" plus the reveal escape hatch, not a frozen app.
 */
const MAX_REPAIR_PARSE_BYTES = 2 * 1024 * 1024;
const MAX_REPAIR_MILLIS = 250;

/**
 * Cheap pre-filters kept in FRONT of the budget. These are not the cost bound -
 * the budget above is - but each still earns its place:
 *
 *  - `MAX_REPAIR_LINE_BYTES` bounds work the parse budget cannot see.
 *    `candidateBreakOffsets` calls `line.slice(i)` once per character, which is
 *    quadratic in the line's length and never reaches a parse at all.
 *  - `MAX_BREAK_CANDIDATES` and `MAX_REPAIR_SOURCE_BYTES` refuse the pathological
 *    shapes outright instead of letting them burn the whole budget first.
 */
const MAX_REPAIR_LINE_BYTES = 4096;
const MAX_BREAK_CANDIDATES = 128;
const MAX_REPAIR_SOURCE_BYTES = 512 * 1024;

/**
 * The running cost of one {@link planLineBreakRepair} call. `remaining` is in
 * bytes of document fed to the parser; `deadline` is an absolute epoch time.
 */
type ParseBudget = { remaining: number; deadline: number };

const newParseBudget = (): ParseBudget => ({
  remaining: MAX_REPAIR_PARSE_BYTES,
  deadline: Date.now() + MAX_REPAIR_MILLIS,
});

/**
 * Charge one parse of `source` to `budget`.
 *
 * @returns `false` when the parse must NOT happen - the budget is spent, or the
 *   deadline has passed. Every caller turns that into "no automatic fix".
 */
function spendParseBudget(budget: ParseBudget, source: string): boolean {
  const cost = Buffer.byteLength(source, 'utf-8');
  if (cost > budget.remaining) return false;
  if (Date.now() > budget.deadline) return false;
  budget.remaining -= cost;
  return true;
}

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
function planSingleLineBreak(
  source: string,
  lineNumber: number,
  budget: ParseBudget
): { column: number; next: string } | null {
  const lines = source.split('\n');
  const index = lineNumber - 1;
  if (index < 0 || index >= lines.length) return null;

  // A line that BEGINS inside a `"""`/`'''` string is user DATA, not structure.
  // Inserting a newline there would silently rewrite the value even if the
  // result parses, so refuse - the same reasoning `removeReservedProfileTables`
  // relies on for its own line scanner.
  if (multilineStringLineStates(source)[index]) return null;

  const line = lines[index];
  // F7 pre-filters. The real bound is `budget`, charged per parse below; these two
  // just refuse the pathological shapes before they burn any of it. Refusing here
  // is a correct outcome - the panel still offers reveal and regenerate.
  if (Buffer.byteLength(line, 'utf-8') > MAX_REPAIR_LINE_BYTES) return null;
  const candidates = candidateBreakOffsets(line);
  if (candidates.length > MAX_BREAK_CANDIDATES) return null;

  const accepted: { column: number; next: string }[] = [];
  const seen = new Set<string>();

  for (const offset of candidates) {
    const patched = [...lines];
    patched[index] = `${line.slice(0, offset)}\n${line.slice(offset)}`;
    const next = patched.join('\n');
    if (seen.has(next)) continue;
    seen.add(next);
    if (!isLineBreakOnlyEdit(source, next)) continue;
    // Out of budget. Bail on the WHOLE step rather than returning what has been
    // accepted so far: the ambiguity check below is only sound once EVERY
    // candidate has been tried, so a partial sweep must not produce a repair.
    if (!spendParseBudget(budget, next)) return null;
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
 * ambiguous, when it would take more than {@link MAX_REPAIR_STEPS} steps, or when
 * the cumulative parse budget runs out (see {@link MAX_REPAIR_PARSE_BYTES}).
 */
export function planLineBreakRepair(source: string): { plan: EngineConfigRepairPlan; repaired: string } | null {
  // F7 pre-filter; the cumulative budget below is what actually bounds the cost.
  if (Buffer.byteLength(source, 'utf-8') > MAX_REPAIR_SOURCE_BYTES) return null;

  const budget = newParseBudget();
  let current = source;
  let lineBreaks = 0;

  for (let step = 0; step < MAX_REPAIR_STEPS; step += 1) {
    if (!spendParseBudget(budget, current)) return null;
    const problem = findParseProblem(current);
    if (!problem) {
      if (lineBreaks === 0) return null; // already valid - nothing to repair
      // Re-assert the whole-document invariant against the ORIGINAL source, not
      // just per step, so no accumulation of steps can drift off it.
      if (!isLineBreakOnlyEdit(source, current)) return null;
      return { plan: { lineBreaks }, repaired: current };
    }
    const next = planSingleLineBreak(current, problem.line, budget);
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

/**
 * Swallow a best-effort CLEANUP failure.
 *
 * Only ever attached to rolling back this module's own placeholder or a failed
 * repair write. Never to an operation whose failure could lose user bytes: those
 * are all reported, and the user's data is on disk under the backup name either
 * way. Named rather than inline because `strictNullChecks` is off in this repo,
 * so `() => undefined` infers as an implicit `any` return.
 */
const ignoreCleanupFailure = (): void => {};

/**
 * Decode `bytes` as UTF-8, LOSSLESSLY or not at all.
 *
 * `TextDecoder` with `fatal: true` throws on any invalid sequence instead of
 * substituting U+FFFD. That distinction is the whole point: the substituting
 * decode is what let the first version of this file "verify" a backup against a
 * mangled copy of itself, and then rewrite a `0xE9` byte out of the live config.
 * A `null` return means "Wayland cannot read this file as text", which is a hard
 * stop for anything that would write it back.
 */
export function decodeStrictUtf8(bytes: Buffer): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch {
    return null;
  }
}

/** Thrown when the original could not be moved aside and PROVEN intact. */
export class EngineConfigBackupError extends Error {
  readonly code = 'ENGINE_CONFIG_BACKUP_FAILED' as const;
  constructor(detail: string) {
    super(`Could not create a verified backup of the engine config: ${detail}`);
    this.name = 'EngineConfigBackupError';
  }
}

/**
 * Reserve an unused timestamped backup name next to `configPath`.
 *
 * The reservation is a 0-byte EXCLUSIVE (`wx`) create, so two concurrent
 * recoveries cannot pick the same name and the subsequent rename cannot land on
 * top of an older backup. The placeholder is replaced atomically by the rename.
 */
async function reserveBackupName(configPath: string, deps: EngineConfigRecoveryDeps): Promise<string> {
  const dir = dirname(configPath);
  const stamp = backupStamp(deps.now());
  let lastError = 'no candidate name available';

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const backupPath = join(dir, `config.toml.backup-${stamp}${suffix}`);
    try {
      await deps.writeFileExclusive(backupPath, '');
      return backupPath;
    } catch (error) {
      // EEXIST just means this second already has a backup; anything else is a
      // real failure (permissions, disk full) and must not be retried silently.
      lastError = summarizeReason(error);
      if ((error as { code?: string } | null)?.code === 'EEXIST') continue;
      throw new EngineConfigBackupError(lastError);
    }
  }

  throw new EngineConfigBackupError(lastError);
}

/**
 * Move `configPath` aside to a timestamped sibling and PROVE the bytes are the
 * ones `originalBytes` was read from.
 *
 * This is step 1 of every write path and it is not optional. The move is a
 * `rename`: atomic, byte-exact, and decode-free, so there is no encoding step to
 * corrupt (invariant 1). The verification then compares RAW BUFFERS - a mismatch
 * means the file changed between the read and the rename, so the backup is
 * renamed back and the caller is refused rather than proceeding against bytes it
 * never planned for.
 *
 * On return, `configPath` DOES NOT EXIST. That is deliberate: it is what lets the
 * repair write with an exclusive create, and it is what "removing" the file means
 * for regenerate - the user's providers, credentials and memory/skills settings
 * are still on disk, under the returned path.
 */
export async function createVerifiedBackup(
  configPath: string,
  originalBytes: Buffer,
  deps: EngineConfigRecoveryDeps
): Promise<string> {
  const backupPath = await reserveBackupName(configPath, deps);

  try {
    await deps.renameFile(configPath, backupPath);
  } catch (error) {
    // The rename never happened, so the original is untouched. Drop the
    // placeholder so a retry does not have to skip past it.
    await deps.removeFile(backupPath).catch(ignoreCleanupFailure);
    throw new EngineConfigBackupError(summarizeReason(error));
  }

  let backupBytes: Buffer;
  try {
    backupBytes = await deps.readFileBytes(backupPath);
  } catch (error) {
    await deps.renameFile(backupPath, configPath).catch(ignoreCleanupFailure);
    throw new EngineConfigBackupError(`backup could not be read back: ${summarizeReason(error)}`);
  }

  if (!backupBytes.equals(originalBytes)) {
    await deps.renameFile(backupPath, configPath).catch(ignoreCleanupFailure);
    throw new EngineConfigBackupError('the file changed while it was being backed up');
  }

  return backupPath;
}

/** Live dependencies: raw-byte reads, exclusive creates, real renames. */
export function defaultRecoveryDeps(): EngineConfigRecoveryDeps {
  return {
    resolveConfigPath: resolveActiveConfigPath,
    readFileBytes: (path) => readFile(path),
    writeFileExclusive: async (path, data) => {
      // `wx` is `O_CREAT | O_EXCL`, which fails if the path exists AT ALL -
      // including an existing symlink, dangling or not. That is what removes the
      // symlink-following write the temp-file version of this had (F4).
      await writeFile(path, data, { encoding: 'utf-8', flag: 'wx', mode: 0o600 });
    },
    renameFile: (from, to) => rename(from, to),
    removeFile: (path) => unlink(path),
    now: () => new Date(),
  };
}

/**
 * Put the original back after a failed repair write.
 *
 * @returns `true` when `configPath` holds the user's original bytes again. On
 *   `false` the bytes are still safe - they are at `backupPath`, which the caller
 *   reports so the user is never left wondering where their config went.
 */
async function restoreFromBackup(
  configPath: string,
  backupPath: string,
  deps: EngineConfigRecoveryDeps
): Promise<boolean> {
  // Clear whatever the failed write left behind; a leftover file would make the
  // restoring rename replace it, which is fine, but an exclusive-create failure
  // must not be mistaken for a lost original.
  await deps.removeFile(configPath).catch(ignoreCleanupFailure);
  try {
    await deps.renameFile(backupPath, configPath);
    return true;
  } catch {
    return false;
  }
}

/** Read the config's raw bytes, mapping a missing file onto a typed result. */
async function readConfigBytes(
  path: string,
  deps: EngineConfigRecoveryDeps
): Promise<{ bytes: Buffer } | { failure: EngineConfigRecoveryResult }> {
  try {
    return { bytes: await deps.readFileBytes(path) };
  } catch (error) {
    const missing = (error as { code?: string } | null)?.code === 'ENOENT';
    return {
      failure: {
        ok: false,
        reason: missing ? 'missing' : 'write-failed',
        detail: summarizeReason(error),
      },
    };
  }
}

/**
 * Inspect the ACTIVE profile's `config.toml` and report an actionable state.
 *
 * Never throws: an unreadable file is a reported status, because this is the
 * function the failure UI calls and it must always have something to render.
 *
 * NOTE (F5): the Doctor's own `config.engineConfig` check currently reads
 * `resolveUserConfigPath()` (the NATIVE config) while this reads
 * `resolveActiveConfigPath()` (the ACTIVE PROFILE's). With a named profile active
 * those are different files. This module is right - the launch path that throws
 * `DesktopProfileSpliceError` splices the ACTIVE profile's config - so the fix
 * belongs on the check side (#1029 lane). Until then the resolved path is
 * rendered in EVERY branch, so a mismatch is visible to the user rather than
 * silently confusing.
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

  let bytes: Buffer;
  try {
    bytes = await deps.readFileBytes(path);
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'ENOENT') return { status: 'missing', path };
    return { status: 'unreadable', path, reason: summarizeReason(error) };
  }

  // A TOML document MUST be valid UTF-8, so bytes that do not decode losslessly
  // are a genuine fault, not a warning - and one Desktop must never try to
  // "repair", since the only text it could write back is a U+FFFD-substituted
  // rendering of the user's own bytes.
  const source = decodeStrictUtf8(bytes);
  if (source === null) return { status: 'invalid', path, encodingLossy: true, repair: null };

  const problem = findParseProblem(source);
  if (!problem) return { status: 'ok', path };
  return { status: 'invalid', path, problem, repair: planLineBreakRepair(source)?.plan ?? null };
}

/**
 * Apply the unambiguous line-break repair.
 *
 * Order is load-bearing and every step is reversible: read the raw bytes, refuse
 * unless they decode losslessly, plan the repair, MOVE the original aside and
 * prove the move (which leaves `config.toml` absent), write the repair with an
 * exclusive create, then re-read and re-parse from DISK. Any failure after the
 * move renames the original back.
 */
export async function repairEngineConfig(
  deps: EngineConfigRecoveryDeps = defaultRecoveryDeps()
): Promise<EngineConfigRecoveryResult> {
  const path = await deps.resolveConfigPath();
  const read = await readConfigBytes(path, deps);
  if ('failure' in read) return read.failure;

  const source = decodeStrictUtf8(read.bytes);
  if (source === null) {
    return {
      ok: false,
      reason: 'nothing-to-repair',
      detail: 'the file is not valid UTF-8, so Wayland will not rewrite it',
    };
  }

  const repair = planLineBreakRepair(source);
  if (!repair) {
    return { ok: false, reason: 'nothing-to-repair', detail: 'no unambiguous single-line fix was found' };
  }

  let backupPath: string;
  try {
    backupPath = await createVerifiedBackup(path, read.bytes, deps);
  } catch (error) {
    return { ok: false, reason: 'backup-failed', detail: summarizeReason(error) };
  }

  // `config.toml` does not exist now, so this is an exclusive create: no temp
  // file, no predictable temp name, and nothing for a planted symlink to redirect.
  try {
    await deps.writeFileExclusive(path, repair.repaired);
  } catch (error) {
    const restored = await restoreFromBackup(path, backupPath, deps);
    return {
      ok: false,
      reason: 'write-failed',
      detail: summarizeReason(error),
      ...(restored ? {} : { backupPath }),
    };
  }

  // Confirm from DISK, not from the in-memory candidate: the point of the whole
  // flow is that the app can launch against the file that is actually there.
  try {
    const writtenBytes = await deps.readFileBytes(path);
    const written = decodeStrictUtf8(writtenBytes);
    if (written === null || findParseProblem(written)) {
      const restored = await restoreFromBackup(path, backupPath, deps);
      return {
        ok: false,
        reason: 'write-failed',
        detail: 'the repaired file still does not parse',
        ...(restored ? {} : { backupPath }),
      };
    }
  } catch (error) {
    const restored = await restoreFromBackup(path, backupPath, deps);
    return {
      ok: false,
      reason: 'write-failed',
      detail: summarizeReason(error),
      ...(restored ? {} : { backupPath }),
    };
  }

  return { ok: true, backupPath };
}

/**
 * Move `config.toml` aside so the engine writes fresh defaults on the next launch.
 *
 * DESTRUCTIVE for the LIVE file: the user's providers, credentials and
 * memory/skills settings stop applying. Three mandatory guards:
 *
 *  1. `confirmed` must be the boolean `true` - IDENTITY, not truthiness. The
 *     bridge already coerces, but a module that documents its own re-check has to
 *     actually do one; `'true'` and `1` used to reach the delete.
 *  2. The file must genuinely be broken. A config that decodes and PARSES is
 *     healthy, and deleting a healthy credential-bearing file because a caller
 *     passed a flag is not a recovery path - it is the data loss this module
 *     exists to prevent. The UI only offers the button for an invalid file, so
 *     this check costs nothing and closes the capability outright.
 *  3. The verified backup must succeed first - and since that backup IS the
 *     rename, "removed" always means "moved to a file we proved holds the same
 *     bytes", never "gone".
 */
export async function regenerateEngineConfig(
  options: { confirmed: boolean },
  deps: EngineConfigRecoveryDeps = defaultRecoveryDeps()
): Promise<EngineConfigRecoveryResult> {
  if (options?.confirmed !== true) {
    return { ok: false, reason: 'not-confirmed', detail: 'regenerate requires an explicit confirmation' };
  }

  const path = await deps.resolveConfigPath();
  const read = await readConfigBytes(path, deps);
  if ('failure' in read) return read.failure;

  const source = decodeStrictUtf8(read.bytes);
  // Guard 2. A lossy decode is NOT healthy - TOML must be UTF-8 - so that case
  // stays eligible: regenerating is the only in-app way out of a file Wayland
  // cannot even read as text.
  if (source !== null && findParseProblem(source) === null) {
    return {
      ok: false,
      reason: 'nothing-to-repair',
      detail: 'the engine config parses cleanly, so it will not be replaced',
    };
  }

  let backupPath: string;
  try {
    // This rename IS the removal. There is no `unlink` on this path at all.
    backupPath = await createVerifiedBackup(path, read.bytes, deps);
  } catch (error) {
    return { ok: false, reason: 'backup-failed', detail: summarizeReason(error) };
  }

  return { ok: true, backupPath };
}
