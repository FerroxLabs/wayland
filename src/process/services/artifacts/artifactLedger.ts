/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The artifact ledger: METADATA ONLY, deliberately NOT a store.
 *
 * The deliverable's bytes never move and are never duplicated. This records
 * what one is - id, owning task and run, workspace-relative location, size,
 * sha256, who declared it, when the run happened, publication state - so that:
 *
 *  - a recurring task's output can be listed as a SERIES without rescanning
 *    the filesystem and trusting whatever the skill named its folders;
 *  - a deliverable has PROVENANCE (this run, this skill produced this file);
 *  - a file the user drags somewhere else in Finder can be re-identified by
 *    digest instead of dangling;
 *  - the retention classifier can finally SEE an artifact-bearing workspace.
 *    `desktopManagedWorkspaceInventory` reported `artifact: 'unavailable'`
 *    with the note "Desktop does not yet have a canonical ledger". This is it.
 *
 * A blob store was explicitly rejected: it would double the disk cost of every
 * deliverable and add a quota, GC and retention surface the acceptance bar does
 * not need.
 *
 * -------------------------------------------------------------------------
 * A DECLARATION IS AN UNTRUSTED CLAIM.
 * -------------------------------------------------------------------------
 * The declaring party is a SKILL: model-authored text running in a shell.
 * "I produced ../../../../.ssh/id_rsa" is a sentence anyone can write, and a
 * ledger that believed it would hand a later Open/Reveal affordance a
 * host-blessed pointer to it. So a claim becomes a record only after the
 * filesystem agrees with it:
 *
 *  - relative path only; no absolute, home-relative, UNC, device, ADS or NUL
 *    form, and no `..` segment;
 *  - the resolved path stays inside the workspace AFTER the ancestor chain is
 *    realpath-collapsed, so a symlinked intermediate directory cannot redirect
 *    an in-workspace-looking path out of it;
 *  - `lstat` says regular file, so a symlink is refused OUTRIGHT rather than
 *    followed (following one would make the recorded location a lie), and a
 *    FIFO - which would block the hashing read forever - never gets read;
 *  - the open handle's device/inode must still match what `lstat` saw, closing
 *    the swap window between the check and the read;
 *  - count and size caps, so a runaway skill cannot turn the ledger into the
 *    unbounded thing it was designed not to be.
 *
 * A rejected claim is REPORTED, never thrown: one bad declaration must not
 * lose a run's real deliverables.
 *
 * -------------------------------------------------------------------------
 * ON-DISK FORM: append-only JSON Lines.
 * -------------------------------------------------------------------------
 * Appending one line per record needs no read-modify-write, so two runs
 * registering at once cannot lose each other's records, and a crash can only
 * truncate the final line - which the reader drops. Ids are DETERMINISTIC
 * (workspace + run + relative path), so a retried registration re-appends the
 * same id and the reader collapses it; a random id would have inflated the
 * artifact counts the retention classifier reads.
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

import type { ArtifactRejectionReason } from '@/common/types/artifacts';

/**
 * The ledger file, app-owned, beside the workspace provenance ledger. NOT
 * inside a workspace: a workspace the user deletes or moves must not take the
 * record of what was in it with it.
 */
export const ARTIFACT_LEDGER_FILE = 'artifact-ledger.jsonl';

/** Resolve the ledger for an authority root (Desktop's userData). */
export const artifactLedgerPath = (authorityRoot: string): string =>
  path.join(path.resolve(authorityRoot), ARTIFACT_LEDGER_FILE);

/**
 * THE ONE NAME UNDER `artifacts/` THAT IS NOT A SERIES.
 *
 * `<workspace>/artifacts/` was already occupied when chat became the second
 * writer: it is the cron SERIES ROOT, holding `.latest.json`, `.aliases.json`
 * and `.staging/`, and series membership is decided by PATH SHAPE ALONE - five
 * segments beginning with `artifacts` IS a series deliverable, because nothing
 * anywhere records that it is one. So a chat writing `artifacts/a/b/c/d.md`
 * fabricates a Series row for a series called `a`, and if a scheduled task ever
 * publishes into a series of that name, `retireStaleAliases` will `fs.rm` the
 * chat's file as a stale alias.
 *
 * This segment is therefore reserved in BOTH directions, and one half alone is
 * not a guard:
 *
 *  - READ: `seriesAliasPathFor` and `locateInSeries` refuse to read a series
 *    out of it, so a chat deliverable never grows a phantom Series row.
 *  - WRITE: `seriesDirFor` and `sanitizeSeriesName` refuse to produce it, so
 *    the publishing path that deletes stale aliases can never be aimed at the
 *    namespace at all.
 *
 * Compared case-INSENSITIVELY everywhere it is enforced: macOS and Windows fold
 * case, so a series called `Chat` would land on the same directory as `chat`
 * and a case-sensitive guard would be a guard only on Linux.
 */
export const CHAT_NAMESPACE = 'chat';

/** True when `segment` is the reserved chat namespace on ANY filesystem. */
export function isChatNamespace(segment: string | undefined): boolean {
  return typeof segment === 'string' && segment.toLowerCase() === CHAT_NAMESPACE;
}

/** Refuse to hash anything larger. A deliverable is a report, not a disk image. */
export const MAX_ARTIFACT_BYTES = 64 * 1024 * 1024;

/** Refuse to record more than this from a single run. */
export const MAX_DECLARATIONS_PER_RUN = 64;

/**
 * The rejection vocabulary now lives in `common/types/artifacts` and is
 * re-exported here so every existing importer keeps its import.
 *
 * It moved because the CARD renders it. A host-private debugging vocabulary was
 * fine while nothing but a log read it; the moment a non-technical user is
 * shown `1 escapes-workspace` at the exact moment their report did not arrive,
 * the renderer needs the union to translate it - and the renderer cannot import
 * from `@process`.
 */
export type { ArtifactRejectionReason };

/** What a skill claims it produced. Every field is untrusted. */
export interface ArtifactDeclaration {
  path: string;
  title?: string;
}

/** What the ledger records once the filesystem has agreed with the claim. */
export interface ArtifactRecord {
  version: 1;
  artifactId: string;
  taskId: string;
  runId: string;
  /** Canonical absolute workspace root the relative path is resolved against. */
  workspace: string;
  /** POSIX-separated, relative to `workspace`. Never absolute, never escaping. */
  relativePath: string;
  title?: string;
  sizeBytes: number;
  sha256: string;
  /** The skill/workflow name as declared. A LABEL, not an authenticated identity. */
  declaredBy: string;
  runAt: string;
  state: 'published';
}

export interface ArtifactRejection {
  path: unknown;
  reason: ArtifactRejectionReason;
}

export interface RegistrationResult {
  registered: ArtifactRecord[];
  rejected: ArtifactRejection[];
}

export interface RegisterArtifactsInput {
  ledgerPath: string;
  /** Absolute workspace root. Everything recorded must live under it. */
  workspace: string;
  /** Absolute directory the declarations are relative to (the run directory). */
  runDir: string;
  taskId: string;
  runId: string;
  declaredBy: string;
  declarations: unknown;
  now?: Date;
}

/** Path forms that are unsafe before any resolution is attempted. */
function unsafeForm(raw: string): boolean {
  if (raw.includes('\0')) return true;
  const slashed = raw.replaceAll('\\', '/');
  // UNC / Windows device namespace.
  if (slashed.startsWith('//')) return true;
  // Any colon: a drive letter is an absolute path (caught separately) and an
  // NTFS alternate data stream has no business in a declaration.
  if (raw.includes(':')) return true;
  // Windows strips a trailing dot or space, so `secret.txt ` and `secret.txt.`
  // resolve to `secret.txt` and defeat any suffix reasoning downstream.
  return slashed
    .split('/')
    .some((segment) => segment.length > 0 && /[ .]$/.test(segment) && segment !== '.' && segment !== '..');
}

/** Validate the shape of a claim. Returns the raw relative path or a reason. */
function validateDeclarationShape(
  declaration: unknown
): { relative: string; title?: string } | ArtifactRejectionReason {
  if (typeof declaration !== 'object' || declaration === null || Array.isArray(declaration)) return 'not-an-object';
  const raw = (declaration as { path?: unknown }).path;
  if (typeof raw !== 'string') return 'not-a-string';
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.startsWith('~')) return 'home-relative';
  if (path.isAbsolute(trimmed) || /^[A-Za-z]:/.test(trimmed)) return 'absolute';
  // Traversal is checked before the generic form rules so the reported reason
  // names what actually happened, which is what a skill author has to fix.
  if (trimmed.replaceAll('\\', '/').split('/').includes('..')) return 'traversal';
  if (unsafeForm(trimmed)) return 'unsafe-form';
  const title = (declaration as { title?: unknown }).title;
  return { relative: trimmed, title: typeof title === 'string' && title.trim() ? title.trim() : undefined };
}

/** True when `child` is `root` itself or nested beneath it. */
function isInside(root: string, child: string): boolean {
  const rel = path.relative(root, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

async function realpathOrSelf(target: string): Promise<string> {
  try {
    return await fs.realpath(target);
  } catch {
    return target;
  }
}

/**
 * Turn one claim into a record, or into the reason it is not one.
 *
 * The order is deliberate: cheap string rejections, then containment, then a
 * single `lstat` that settles symlink-ness and regular-ness together, then the
 * read. Nothing opens a file that has not already been proven to be a plain
 * file inside the workspace.
 */
async function verifyDeclaration(
  input: RegisterArtifactsInput,
  workspaceReal: string,
  declaration: unknown
): Promise<{ record: Omit<ArtifactRecord, 'artifactId'> } | { reason: ArtifactRejectionReason }> {
  const shape = validateDeclarationShape(declaration);
  if (typeof shape === 'string') return { reason: shape };

  const resolved = path.resolve(input.runDir, shape.relative);
  if (!isInside(input.runDir, resolved)) return { reason: 'traversal' };

  // Collapse the ancestor chain. A symlinked intermediate directory is how an
  // in-workspace-LOOKING path reaches out of the workspace, and no amount of
  // string checking on the declaration can see it.
  const parentReal = await realpathOrSelf(path.dirname(resolved));
  const realTarget = path.join(parentReal, path.basename(resolved));
  if (!isInside(workspaceReal, realTarget)) return { reason: 'escapes-workspace' };

  let stat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    stat = await fs.lstat(realTarget);
  } catch {
    return { reason: 'missing' };
  }
  // lstat does not follow, so a symlink reports as a symlink. Refused outright
  // rather than followed: recording the link's path while hashing the target's
  // bytes would make the record a lie.
  if (stat.isSymbolicLink()) return { reason: 'symlink' };
  if (!stat.isFile()) return { reason: 'not-regular-file' };
  if (stat.size > MAX_ARTIFACT_BYTES) return { reason: 'too-large' };

  let sha256: string;
  try {
    sha256 = await hashRegularFile(realTarget, stat.dev, stat.ino);
  } catch {
    return { reason: 'unreadable' };
  }

  return {
    record: {
      version: 1,
      taskId: input.taskId,
      runId: input.runId,
      workspace: workspaceReal,
      relativePath: path.relative(workspaceReal, realTarget).split(path.sep).join('/'),
      ...(shape.title ? { title: shape.title } : {}),
      sizeBytes: stat.size,
      sha256,
      declaredBy: input.declaredBy,
      runAt: (input.now ?? new Date()).toISOString(),
      state: 'published',
    },
  };
}

/**
 * Hash a file that `lstat` already proved is a plain file, re-checking the open
 * handle's identity. Between the lstat and the open, a hostile skill could
 * replace the file with a symlink; comparing device+inode on the open handle
 * closes that window without needing O_NOFOLLOW, which Windows does not have.
 */
async function hashRegularFile(target: string, expectedDev: number, expectedIno: number): Promise<string> {
  const handle = await fs.open(target, 'r');
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== expectedDev || opened.ino !== expectedIno) {
      throw new Error('artifact changed identity between validation and read');
    }
    const hash = createHash('sha256');
    // Streamed off the ALREADY-OPEN handle, never re-resolved from the path:
    // re-opening by name would reintroduce the swap window just closed.
    const stream = handle.createReadStream({ autoClose: false });
    for await (const chunk of stream) hash.update(chunk as Buffer);
    return hash.digest('hex');
  } finally {
    await handle.close();
  }
}

/**
 * Deterministic id: the same file, from the same run, in the same workspace is
 * always the same artifact. A retried registration therefore re-appends an id
 * the reader already knows and collapses, instead of inflating the counts the
 * retention classifier reads as "artifact-bearing".
 */
function artifactIdFor(workspace: string, runId: string, relativePath: string): string {
  return createHash('sha256').update(`${workspace}\0${runId}\0${relativePath}`).digest('hex').slice(0, 32);
}

/** Verify a run's declarations and append the ones that check out. */
export async function registerArtifacts(input: RegisterArtifactsInput): Promise<RegistrationResult> {
  const declarations = Array.isArray(input.declarations) ? input.declarations : [];
  const registered: ArtifactRecord[] = [];
  const rejected: ArtifactRejection[] = [];
  const workspaceReal = await realpathOrSelf(path.resolve(input.workspace));

  for (const declaration of declarations) {
    const declaredPath = (declaration as { path?: unknown })?.path ?? declaration;
    if (registered.length >= MAX_DECLARATIONS_PER_RUN) {
      rejected.push({ path: declaredPath, reason: 'too-many' });
      continue;
    }
    // eslint-disable-next-line no-await-in-loop -- serialized on purpose: the count cap is enforced against `registered.length` as it grows, and parallelizing would open every declared file at once
    const outcome = await verifyDeclaration(input, workspaceReal, declaration);
    if ('reason' in outcome) {
      rejected.push({ path: declaredPath, reason: outcome.reason });
      continue;
    }
    registered.push({
      artifactId: artifactIdFor(workspaceReal, input.runId, outcome.record.relativePath),
      ...outcome.record,
    });
  }

  if (registered.length > 0) {
    await fs.mkdir(path.dirname(input.ledgerPath), { recursive: true });
    await fs.appendFile(
      input.ledgerPath,
      `${registered.map((record) => JSON.stringify(record)).join('\n')}\n`,
      'utf-8'
    );
  }

  return { registered, rejected };
}

/**
 * A line that RETIRES a row. The append-only answer to "remove this from my
 * list".
 *
 * Not a rewrite of the file: rewriting an append-only ledger is a
 * read-modify-write, which is the exact thing the format was chosen to avoid -
 * two runs registering at once could then lose each other's records, and a
 * crash mid-rewrite could lose the lot. One extra line costs nothing and cannot
 * corrupt anything.
 *
 * It carries no path, no workspace and no digest, so a tombstone can never be
 * mistaken for a record: `readArtifactLedgerEntries` keys on `kind` before it
 * looks at anything else.
 */
export interface ArtifactForgetLine {
  kind: 'forget';
  artifactId: string;
  forgottenAt: string;
}

/**
 * Retire one row.
 *
 * Order in the file is the semantics. A tombstone drops the id; a record line
 * AFTER it puts the id back. That is what makes re-registration restore a
 * forgotten deliverable, which is the correct behaviour - the file exists
 * again, so the row should too.
 */
export async function appendArtifactTombstone(
  ledgerPath: string,
  artifactId: string,
  now: Date = new Date()
): Promise<void> {
  const line: ArtifactForgetLine = { kind: 'forget', artifactId, forgottenAt: now.toISOString() };
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.appendFile(ledgerPath, `${JSON.stringify(line)}\n`, 'utf-8');
}

/**
 * Every record in the ledger, later entries superseding earlier ones with the
 * same id. A truncated final line (the only shape a crash can leave) and any
 * line that fails validation are dropped rather than thrown: the ledger is a
 * convenience over the filesystem, and losing it must not take Settings ->
 * Storage or the series UI down with it.
 */
export async function readArtifactLedger(ledgerPath: string): Promise<ArtifactRecord[]> {
  return (await readArtifactLedgerEntries(ledgerPath)).records;
}

/**
 * Is this a workspace root the reader is willing to resolve a path against?
 *
 * `relativePath` was validated from the beginning and `workspace` was not - it
 * was checked for `typeof === 'string'` and nothing else - even though the two
 * are joined together to produce the absolute path every action then acts on. A
 * clean relative path resolved against a hostile root is a hostile path.
 *
 * That gap was unreachable while the cron executor was the only writer, because
 * `registerArtifacts` always records `realpath(resolve(workspace))`. A second
 * writer, whose workspace is whatever folder a conversation points at, is
 * exactly the change that makes it reachable.
 *
 * Structural checks only, deliberately. Whether a root is AUTHORIZED is a
 * question about host state that this module has no access to and must not
 * import - `effects.confine` answers it, at every one of the four actions.
 * What is enforced here is that the value is a single, absolute, already
 * canonical path, so nothing downstream is normalizing a surprise.
 */
function isCanonicalWorkspace(workspace: unknown): workspace is string {
  if (typeof workspace !== 'string' || workspace.length === 0) return false;
  // A NUL truncates the path at the syscall boundary, so the path that gets
  // opened is not the path that was validated.
  if (workspace.includes('\0')) return false;
  if (!path.isAbsolute(workspace)) return false;
  const segments = workspace.split(/[\\/]/);
  if (segments.includes('..') || segments.includes('.')) return false;
  // Already canonical: refuse rather than silently normalize, so a record that
  // does not round-trip is dropped instead of being quietly rewritten into a
  // different path than the one that was published.
  return path.resolve(workspace) === workspace;
}

/**
 * The same read, plus how many lines it had to throw away.
 *
 * Dropping a bad line is the right behaviour - the ledger is a convenience over
 * the filesystem and one corrupt entry must not take a whole surface down - but
 * dropping it SILENTLY means a user whose deliverable is missing from the list
 * is shown a list that looks complete. The count is what lets a surface say
 * "some entries could not be read" instead of quietly lying.
 */
/**
 * Is this line a tombstone rather than a record?
 *
 * Strict on the id: a malformed tombstone must NOT silently retire nothing and
 * be forgotten about. It falls through to the record validation, which counts
 * it as an unreadable entry - so a surface can say the list may be short
 * instead of quietly presenting it as complete.
 */
function isForgetLine(parsed: unknown): parsed is ArtifactForgetLine {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const line = parsed as Partial<ArtifactForgetLine>;
  return line.kind === 'forget' && typeof line.artifactId === 'string' && line.artifactId.length > 0;
}

export async function readArtifactLedgerEntries(
  ledgerPath: string
): Promise<{ records: ArtifactRecord[]; unreadableEntries: number }> {
  let raw: string;
  try {
    raw = await fs.readFile(ledgerPath, 'utf-8');
  } catch {
    // No ledger at all is "nothing published yet", not corruption.
    return { records: [], unreadableEntries: 0 };
  }

  let unreadableEntries = 0;
  const byId = new Map<string, ArtifactRecord>();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      unreadableEntries += 1;
      continue;
    }
    // THE ONE CHOKEPOINT. Every surface and every action reads through this
    // function, so dropping the id here removes the row from the rail, the
    // card, the series view and all five actions at once - and it cannot
    // resurface inside a run-history block, which a per-surface filter would
    // have missed.
    //
    // Checked BEFORE the record validation below, because a tombstone has no
    // `version` and would otherwise be counted as a corrupt line.
    if (isForgetLine(parsed)) {
      byId.delete(parsed.artifactId);
      continue;
    }
    const record = parsed as ArtifactRecord;
    if (
      record?.version !== 1 ||
      typeof record.artifactId !== 'string' ||
      !isCanonicalWorkspace(record.workspace) ||
      typeof record.relativePath !== 'string' ||
      record.relativePath.startsWith('/') ||
      record.relativePath.split('/').includes('..') ||
      typeof record.sha256 !== 'string' ||
      !Number.isSafeInteger(record.sizeBytes)
    ) {
      unreadableEntries += 1;
      continue;
    }
    byId.set(record.artifactId, record);
  }
  return { records: [...byId.values()], unreadableEntries };
}
