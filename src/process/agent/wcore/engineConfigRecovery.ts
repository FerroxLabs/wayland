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
 *     read-then-write TOCTOU window as well. "Renamed back" is subject to
 *     invariant 8: if the path is no longer free, both files are kept instead.
 *  3. Nothing is ever written to `config.toml` while the original is still
 *     there. After the rename the path does not exist, so the repair is written
 *     with an EXCLUSIVE create (`wx`) - no temp file, no predictable temp name,
 *     and no symlink for a write to follow. Any failure renames the backup back,
 *     subject to invariant 8.
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
 *  8. No rollback replaces a `config.toml` this module did not create, except in
 *     the one window where the two are genuinely INDISTINGUISHABLE. Between the
 *     backup move and any rollback the path does not exist, and a concurrent
 *     writer can fill it - the engine writing defaults on a launch retry, or the
 *     user hand-saving the file "Show me the file" just invited them to open. Every
 *     rollback therefore CLASSIFIES the path first ({@link restoreOriginal}) and
 *     refuses rather than clobbers, reporting `restore-conflict` with both files
 *     kept and both named. This module's own failed write is the one thing it will
 *     clear, identified by its bytes - and only on the branch where such a write is
 *     POSSIBLE. D4: after a write that SUCCEEDED, a 0-byte or truncated occupant is
 *     PROOF of a concurrent writer rather than of our own partial write, so it is
 *     kept. The residual is the write-FAILURE branch alone, where a failed `wx` may
 *     or may not have created the file and no error code distinguishes the two.
 *
 * SECURITY: nothing here returns `config.toml` CONTENT. Only the path, the
 * failure's LINE and COLUMN (credential-free integers), and a scrubbed one-line
 * reason cross the process boundary. `desktopProfileSplice.ts` documents why the
 * echoed source line must be dropped - a `smol-toml` parse error quotes the
 * offending line verbatim, and that line can be an `api_key`. This module
 * follows that precedent exactly, and additionally routes the surviving reason
 * through the shared `redactCommandSecrets` scrubber.
 */
import { lstat, readFile, rename, unlink, writeFile } from 'node:fs/promises';
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
  /**
   * The backup could not be PROVEN, so nothing was ever written. Usually nothing
   * moved either and `config.toml` is untouched - but if the move succeeded and
   * could not be undone, the config path is EMPTY and `backupPath` is set to the
   * one place the original bytes are (F3b).
   */
  | 'backup-failed'
  /** Regenerate was called without confirmation; nothing happened. */
  | 'not-confirmed'
  /** The file parses, or no unambiguous fix exists. */
  | 'nothing-to-repair'
  /** There is no file to act on. */
  | 'missing'
  /**
   * Something else created `config.toml` while the recovery was in flight, so
   * BOTH that file and the backup were left in place. `backupPath` is always set.
   */
  | 'restore-conflict'
  /**
   * `config.toml` is not a regular file (a symlink, a directory, a device). This
   * module refuses to write through it - see {@link refuseIrregularConfig}.
   */
  | 'not-a-regular-file'
  /** The write failed AFTER a good backup was taken. */
  | 'write-failed';

/**
 * Outcome of a write-side recovery action.
 *
 * A FLAT shape with optional members rather than an `ok: true | false`
 * discriminated union, deliberately: this repo's `tsconfig.json` does not enable
 * `strictNullChecks`, so a boolean discriminant does not narrow and every
 * consumer would need a cast. `ShellOpenResult` in `ipcBridge.ts` is flat for the
 * same reason. `backupPath` is set on success and on EVERY failure in which
 * `config.toml` may not hold the user's original bytes - the user still needs to
 * know where their data went - and deliberately absent otherwise, which is what
 * lets the renderer tell those two apart; `reason`/`detail` are set only on
 * failure.
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
   * `lstat` WITHOUT following a link, reporting only whether `path` is a plain
   * regular file. Deliberately not the full `Stats`: the one bit this module acts
   * on is that bit, and a narrow seam is one the tests can drive honestly.
   * Rejects when `path` cannot be stat'd at all.
   */
  isRegularFile: (path: string) => Promise<boolean>;
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
  /**
   * Set ONLY when the move already happened and was NOT undone, so `config.toml`
   * does not hold the user's original bytes and they exist nowhere but here.
   * Absent whenever the config path still holds those bytes, because then naming
   * a backup would point the user at a file that is not the one they need. The
   * callers turn this into the `backupPath` on their failure result.
   */
  readonly backupPath?: string;
  /**
   * D3. Set when the undo was REFUSED because a foreign `config.toml` had appeared
   * in the window, rather than having been attempted and failed. Both files are on
   * disk and both are reported, so the callers report `restore-conflict` - the
   * reason code F2 already spends on exactly this situation - instead of
   * `backup-failed`.
   */
  readonly restoreConflict?: true;
  constructor(detail: string, backupPath?: string, restoreConflict?: boolean) {
    super(`Could not create a verified backup of the engine config: ${detail}`);
    this.name = 'EngineConfigBackupError';
    if (backupPath) this.backupPath = backupPath;
    if (restoreConflict) this.restoreConflict = true;
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
    // NOT a bug that `backupPath` is omitted, and NOT to be "fixed" into naming it.
    // If the cleanup ALSO fails, a 0-byte placeholder is left behind - but the
    // user's file is byte-intact at its canonical path, so "nothing was changed" is
    // literally true, and naming that placeholder would point the user at an empty
    // file instead of at their config. It also needs two independent failures to
    // reach. Reporting it would be the lie, not the omission.
    throw new EngineConfigBackupError(summarizeReason(error));
  }

  // From here on the move HAS happened, so `configPath` does not exist. Every
  // exit below either puts the original back or reports where it is; a failure
  // that does neither is the "nothing was changed" lie F3b was filed about.
  let backupBytes: Buffer;
  try {
    backupBytes = await deps.readFileBytes(backupPath);
  } catch (error) {
    throw await backupUndoFailure(
      `backup could not be read back: ${summarizeReason(error)}`,
      configPath,
      backupPath,
      deps
    );
  }

  if (!backupBytes.equals(originalBytes)) {
    throw await backupUndoFailure('the file changed while it was being backed up', configPath, backupPath, deps);
  }

  return backupPath;
}

/**
 * What became of an attempt to put the moved-aside original back at `configPath`.
 *
 *  - `restored`: `configPath` holds the user's original bytes again.
 *  - `conflict`: a `config.toml` this module did not create was sitting there, so
 *    the restore was REFUSED. Both files are still on disk.
 *  - `failed`: the restoring rename was attempted and threw. The bytes are still
 *    at the backup, which the caller reports.
 */
type RestoreOutcome = 'restored' | 'conflict' | 'failed';

/**
 * The text a rollback's caller tried to write, and whether a HALF-FINISHED write of
 * it can have happened on that caller's branch.
 *
 * Two fields rather than one so the prefix allowance cannot be inherited by a
 * branch that has no partial write to forgive. `partial` has no default for the
 * same reason.
 */
type OwnWrite = { text: string; partial: boolean };

/**
 * Whether anything occupies `configPath`, and whether it is this module's own
 * failed write.
 *
 * `ownWrite` is the text the repair TRIED to write, or `undefined` on the paths
 * that have written nothing at all - where any file present is by definition
 * foreign.
 *
 * `partial` says whether a HALF-FINISHED write of that text is possible here, and
 * it is the whole reason the two are separate fields. On the write-FAILURE branch a
 * failed `wx` can still leave the file it created behind holding a PREFIX of the
 * intended text (0 bytes when the disk filled between the create and the write), so
 * a prefix counts as ours: nothing unique is lost by clearing it, since every byte
 * in it is a byte of the repair, which is itself the original plus line breaks.
 *
 * D4: on the VERIFY branches the exclusive create already returned with the FULL
 * text, so a 0-byte or truncated occupant cannot be that write. It is the signature
 * of a write still IN PROGRESS - and for 0 bytes the prefix test needs no content
 * coincidence at all, so an editor that truncates before saving matched it every
 * time. Executed with the same occupant bytes in both windows before this split:
 * 0-byte and 63-byte-prefix occupants were reported `restore-conflict` with the
 * backup named from `backup-readback-eio`, and `write-failed` with NO path from
 * `verify-eio`, having been `unlink`ed - sending the writer's remaining bytes,
 * possibly a fresh credential, to an unlinked inode. So the prefix allowance is
 * spent only where a partial write can actually have happened.
 *
 * A read that fails for any reason OTHER than ENOENT means there is something
 * there this module cannot identify. That resolves to `foreign`, which is the
 * fail-safe direction: keep the file and report the backup.
 */
async function classifyRestoreTarget(
  configPath: string,
  deps: EngineConfigRecoveryDeps,
  ownWrite: OwnWrite | undefined
): Promise<'absent' | 'ours' | 'foreign'> {
  let bytes: Buffer;
  try {
    bytes = await deps.readFileBytes(configPath);
  } catch (error) {
    return (error as { code?: string } | null)?.code === 'ENOENT' ? 'absent' : 'foreign';
  }
  if (ownWrite === undefined) return 'foreign';
  const intended = Buffer.from(ownWrite.text, 'utf-8');
  if (!ownWrite.partial) return intended.equals(bytes) ? 'ours' : 'foreign';
  return intended.subarray(0, bytes.length).equals(bytes) ? 'ours' : 'foreign';
}

/**
 * Put the moved-aside original back at `configPath` - but NEVER over a file this
 * module did not create.
 *
 * D3 (#1031 delta audit). Both rollbacks used to clobber unconditionally: the
 * post-move undo was a bare `rename(backup, config)`, and the post-write rollback
 * `unlink`ed whatever sat at `configPath` first. Between the move and either
 * rollback `config.toml` DOES NOT EXIST, and that window is conditioned on a live
 * concurrent writer rather than on chance - a byte mismatch IS proof one is active,
 * and "Show me the file" has just invited the user to open it in an editor. So if
 * the engine wrote defaults on a launch retry, or the user hand-saved, the rollback
 * destroyed a brand new credential with no backup anywhere, and because the rename
 * SUCCEEDED it reported `restored`, so the panel said "nothing was changed".
 *
 * Executed on a real filesystem with a foreign `config.toml` planted inside the
 * window, before this guard, on all four (readback-EIO, byte-mismatch race) x
 * (repair, regenerate) and on EDQUOT-on-write / EIO-on-verify / unparseable-verify:
 * `FOREIGN_KEY_SURVIVED=false` every time, the backup gone from disk, and the panel
 * either "nothing was changed" or "could not be completed" with no path named.
 * Known positive: the EEXIST window that `f261e7997` already guarded reports
 * `restore-conflict` with BOTH files kept, which is what this makes the others do.
 *
 * The residual window between the classify and the rename is not closable with a
 * `rename` - only the EEXIST branch gets that atomically, from the exclusive create
 * itself - but it is a single syscall gap rather than the multi-operation window
 * the findings are about.
 */
async function restoreOriginal(
  configPath: string,
  backupPath: string,
  deps: EngineConfigRecoveryDeps,
  ownWrite?: OwnWrite
): Promise<RestoreOutcome> {
  const occupant = await classifyRestoreTarget(configPath, deps, ownWrite);
  if (occupant === 'foreign') return 'conflict';
  // Clear this module's own failed write so the restoring rename is not mistaken
  // for one that replaced a file it should have kept.
  //
  // Load-bearing only on WINDOWS, which is why removing it survives the suite on a
  // POSIX runner: POSIX `rename` overwrites an existing destination atomically, so
  // the unlink is redundant there, while `fs.rename` on Windows fails with EPERM /
  // EEXIST when the destination exists - which would turn every own-failed-write
  // rollback into `failed` and name a backup the user does not need to find.
  if (occupant === 'ours') await deps.removeFile(configPath).catch(ignoreCleanupFailure);
  try {
    await deps.renameFile(backupPath, configPath);
    return 'restored';
  } catch {
    return 'failed';
  }
}

/**
 * Appended to a conflict's detail so the sentence matches what is on disk. The
 * panel already renders the config path in every branch and the backup name in
 * this one, so both files are named without a new locale key.
 */
const CONFLICT_NOTE = 'a new config.toml appeared before the original could be put back, so both files were kept';

/**
 * Undo the backup move and describe the failure that made it necessary.
 *
 * Nothing has been written at this point, so there is no `ownWrite`: any file at
 * `configPath` came from somewhere else and is kept.
 */
async function backupUndoFailure(
  detail: string,
  configPath: string,
  backupPath: string,
  deps: EngineConfigRecoveryDeps
): Promise<EngineConfigBackupError> {
  const outcome = await restoreOriginal(configPath, backupPath, deps);
  if (outcome === 'conflict') {
    return new EngineConfigBackupError(`${detail}; ${CONFLICT_NOTE}`, backupPath, true);
  }
  return new EngineConfigBackupError(detail, outcome === 'restored' ? undefined : backupPath);
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
    // `lstat`, NOT `stat`: the whole point is to notice the link itself rather
    // than following it to whatever it points at.
    //
    // `nlink > 1` is the HARDLINK half of the same fault, and `isFile()` alone
    // cannot see it - a hardlink IS a regular file. Executed on a hardlinked
    // config before this clause: `nlink=2 sameInode=true` going in, then
    // `ok:true`, `config.toml AFTER = repaired`, `dotfile AFTER = still the
    // original broken bytes`, `inodes now differ = true`. Exactly the outcome the
    // symlink rationale above refuses: the other name keeps the broken content
    // forever and Wayland quietly stops writing to it.
    //
    // Written as `!(nlink > 1)` rather than `=== 1` on purpose: only a PROVEN
    // multiple-link count refuses. A platform that reports 0 or an unreliable
    // count falls back to today's behaviour instead of refusing every config,
    // which is the failure mode worth avoiding here.
    isRegularFile: async (path) => {
      const stats = await lstat(path);
      return stats.isFile() && !(stats.nlink > 1);
    },
    removeFile: (path) => unlink(path),
    now: () => new Date(),
  };
}

/**
 * Turn a failed repair WRITE, plus the outcome of rolling it back, into a result.
 *
 * D3: `restored` is the only outcome in which `config.toml` holds the user's
 * original bytes, so it is the only one that names no path. A `conflict` is the
 * same situation `restore-conflict` is already spent on - a foreign `config.toml`
 * appeared, both files were kept - and a `failed` rollback leaves the bytes at the
 * backup, which is `write-failed` carrying the path, as before.
 */
function rollbackResult(detail: string, backupPath: string, outcome: RestoreOutcome): EngineConfigRecoveryResult {
  if (outcome === 'restored') return { ok: false, reason: 'write-failed', detail };
  if (outcome === 'conflict') {
    return { ok: false, reason: 'restore-conflict', detail: `${detail}; ${CONFLICT_NOTE}`, backupPath };
  }
  return { ok: false, reason: 'write-failed', detail, backupPath };
}

/**
 * Refuse a `config.toml` that is not a regular SINGLE-LINK file (F4, D2).
 *
 * Every write path here is `rename` the original aside, then EXCLUSIVE-create a
 * fresh file at `configPath`. On a symlinked config that silently converts the
 * link into a regular file: `readFile` follows the link, `rename` moves the LINK
 * itself into the backup name, and the `wx` create then makes a brand new regular
 * file where the link used to be. No bytes are lost - but the real target keeps
 * the broken content forever and Wayland quietly stops writing to it, which for a
 * dotfiles or shared config is exactly the opposite of a repair. Executed on a
 * symlinked config before this guard: `configStillSymlink=false`,
 * `backupIsSymlink=true`, `targetStillOriginalBroken=true`.
 *
 * The earlier copy-based version of this module wrote THROUGH the link, so this is
 * a regression the rename-based backup introduced. Writing through a link is not
 * the fix - that is the symlink-following write the exclusive create exists to
 * remove - so the honest answer is to refuse and point at Reveal.
 *
 * D2: a HARDLINK decouples the same way and `lstat().isFile()` is TRUE for one, so
 * the seam checks the link COUNT as well. That is not a regression - the
 * copy-based version wrote through a hardlink correctly and the rename-based one
 * never caught it - but the rationale above applies to it verbatim, and a hardlink
 * is the only irregular kind besides a symlink that can actually reach this
 * refusal: executed on each, a directory inspects as `unreadable`, a device as
 * `ok` and a FIFO blocks in the read, so none of them is ever offered an action,
 * while a hardlink inspects as `invalid` with BOTH buttons live.
 *
 * @returns a typed failure when the path is not a regular file, else `null`. A
 *   failing `lstat` is NOT treated as a refusal: the read that follows reports it
 *   with a better message, and a missing file already has its own branch.
 */
async function refuseIrregularConfig(
  path: string,
  deps: EngineConfigRecoveryDeps
): Promise<EngineConfigRecoveryResult | null> {
  let regular: boolean;
  try {
    regular = await deps.isRegularFile(path);
  } catch {
    return null;
  }
  if (regular) return null;
  return {
    ok: false,
    reason: 'not-a-regular-file',
    detail: 'the engine config is not a regular file, so Wayland will not replace it',
  };
}

/** `true` when a failed exclusive create means the path already existed. */
const isAlreadyExists = (error: unknown): boolean => (error as { code?: string } | null)?.code === 'EEXIST';

/**
 * Spread of the backup path a backup failure is carrying, or nothing.
 *
 * A spread rather than an assignment so `backupPath` stays ABSENT on the common
 * case, which is what the renderer keys the "nothing was changed" line off.
 */
const backupPathOf = (error: unknown): { backupPath?: string } => {
  const backupPath = (error as EngineConfigBackupError | null)?.backupPath;
  return backupPath ? { backupPath } : {};
};

/**
 * Turn a thrown {@link EngineConfigBackupError} into a result.
 *
 * D3: a REFUSED undo is not the same state as a failed one. When the undo was
 * refused because a foreign `config.toml` had appeared, both files are on disk, so
 * the honest code is `restore-conflict` - which the panel already renders with the
 * backup named - rather than `backup-failed`, whose text is "nothing was changed".
 */
const backupFailureResult = (error: unknown): EngineConfigRecoveryResult => ({
  ok: false,
  reason: (error as EngineConfigBackupError | null)?.restoreConflict ? 'restore-conflict' : 'backup-failed',
  detail: summarizeReason(error),
  ...backupPathOf(error),
});

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
  const irregular = await refuseIrregularConfig(path, deps);
  if (irregular) return irregular;

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
    return backupFailureResult(error);
  }

  // `config.toml` does not exist now, so this is an exclusive create: no temp
  // file, no predictable temp name, and nothing for a planted symlink to redirect.
  try {
    await deps.writeFileExclusive(path, repair.repaired);
  } catch (error) {
    // F2. EEXIST means something ELSE created `config.toml` inside the recovery
    // window - the engine writing defaults on a launch retry, or the user
    // hand-saving the file that "Show me the file" just invited them to open. That
    // file is not ours, it can hold a brand new credential, and the rollback below
    // would `unlink` it to put the CORRUPT original back. Destroying a file this
    // module never created is precisely the data loss it exists to prevent, so
    // keep BOTH and report where the original went.
    if (isAlreadyExists(error)) {
      return { ok: false, reason: 'restore-conflict', detail: summarizeReason(error), backupPath };
    }
    // `partial: true`: the `wx` create may have succeeded with the write failing
    // after it, and no error code says which happened. This is the one branch that
    // forgives a prefix (invariant 8).
    const outcome = await restoreOriginal(path, backupPath, deps, { text: repair.repaired, partial: true });
    return rollbackResult(summarizeReason(error), backupPath, outcome);
  }

  // Confirm from DISK, not from the in-memory candidate: the point of the whole
  // flow is that the app can launch against the file that is actually there.
  try {
    const writtenBytes = await deps.readFileBytes(path);
    const written = decodeStrictUtf8(writtenBytes);
    if (written === null || findParseProblem(written)) {
      // `partial: false` on both verify branches: `writeFileExclusive` returned, so
      // the FULL text reached the path. Anything shorter is a concurrent writer.
      const outcome = await restoreOriginal(path, backupPath, deps, { text: repair.repaired, partial: false });
      return rollbackResult('the repaired file still does not parse', backupPath, outcome);
    }
  } catch (error) {
    const outcome = await restoreOriginal(path, backupPath, deps, { text: repair.repaired, partial: false });
    return rollbackResult(summarizeReason(error), backupPath, outcome);
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
  const irregular = await refuseIrregularConfig(path, deps);
  if (irregular) return irregular;

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
    return backupFailureResult(error);
  }

  return { ok: true, backupPath };
}
