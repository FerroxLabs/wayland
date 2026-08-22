/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9. Open / Reveal / Save a copy, addressed by ARTIFACT ID.
 *
 * This is the "email it to my team" clause of the acceptance bar. Getting a
 * generated report out of a workspace and into a mail client is the whole
 * point, and the naive version of it - a renderer button that posts a path to
 * `shell.openPath` - is how a compromised renderer gets `open <anything>`.
 *
 * Four rules shape everything here, and each exists because dropping it
 * reopens a specific hole:
 *
 * 1. THE RENDERER SENDS AN ID. Not a path. A path from the renderer is
 *    attacker input the moment the renderer is compromised, and there is no
 *    validation that turns it back into a trustworthy one.
 * 2. RESOLVE, THEN RE-VALIDATE, IMMEDIATELY BEFORE USE. `artifactTarget` walks
 *    the ancestor chain for symlinks, proves the leaf is still a regular file,
 *    and re-hashes the bytes against the ledger - on every single action, never
 *    once at registration.
 * 3. GATE ON TYPE, NOT ONLY LOCATION. Confinement bounds WHERE a path points.
 *    The workspace IS an authorized root, so `report.command`, `payload.desktop`
 *    and `Evil.app` written by an agent INSIDE it pass confinement trivially -
 *    and the OS handler then executes them. `refuseUnsafeOpenTarget` is the
 *    missing half, and it is the SAME module the shell providers already use;
 *    forking it would guarantee the two drift.
 * 4. THE ENGINE NEVER GETS A GENERIC OPEN. Nothing here is reachable from a
 *    tool call. It is reachable from a user clicking a control in host chrome
 *    that is showing them the canonical target.
 *
 * The OS effects are injected rather than imported so the rules above can be
 * exercised for real - a refusal here means the launcher was never reached,
 * which is the only form of that claim worth making.
 */

import { promises as fs } from 'fs';
import path from 'path';

import type { ShellOpenResult } from '@/common/adapter/ipcBridge';
import type {
  ArtifactDiskStatus,
  ArtifactListing,
  ArtifactOpenTarget,
  ArtifactPreview,
  ArtifactRefreshResult,
  ArtifactSaveResult,
  ArtifactSummary,
} from '@/common/types/artifacts';
import { ARTIFACT_CHANGED_ERROR } from '@/common/types/artifacts';
import { refuseUnsafeOpenTarget } from '@process/bridge/shellOpenSafety';

import { isReservedSeriesEntry } from './artifactSeries';
import { ARTIFACTS_DIR_NAME } from './taskRun';

import { isChatNamespace, registerArtifacts, type ArtifactRecord } from './artifactLedger';
import { readVerifiedArtifact, resolveArtifactTarget } from './artifactTarget';
import { cachedDefaultApplicationName } from './defaultApplication';

/**
 * The host capabilities these actions need. Injected so the decision logic can
 * be tested against a real filesystem with only the OS launcher recorded.
 */
export interface ArtifactHostEffects {
  readLedger(): Promise<ArtifactRecord[]>;
  /**
   * `readLedger`, plus the count of lines it had to discard.
   *
   * Optional so every existing caller and test fake keeps working with the
   * plain reader; a fake serving an in-memory array genuinely has nothing
   * unreadable to report. The rail supplies it because it is the one surface
   * that tells the user the list may be short.
   */
  readLedgerEntries?(): Promise<{ records: ArtifactRecord[]; unreadableEntries: number }>;
  /** `confinePath`. Returns the confined absolute path, or null to refuse. */
  confine(target: string): Promise<string | null>;
  /** `shell.openPath` and friends, already reporting rather than throwing. */
  launch(target: string): Promise<ShellOpenResult>;
  /** `shell.showItemInFolder`, likewise. */
  reveal(target: string): Promise<ShellOpenResult>;
  /** The save dialog. Returns the chosen absolute path, or null if cancelled. */
  chooseSaveDestination(suggestedName: string): Promise<string | null>;
}

/**
 * Cap on what `list` returns.
 *
 * The ledger is append-only and a daily task runs forever, so "every record"
 * is a number that only grows. The renderer needs enough to show a series, not
 * the archive; anything older is a query, not a list.
 */
export const MAX_LISTED_ARTIFACTS = 500;

/**
 * Open a deliverable in the OS default application.
 *
 * Order: identity, then location, then type. Each is a different question and
 * passing one says nothing about the others.
 */
export async function openArtifact(artifactId: unknown, effects: ArtifactHostEffects): Promise<ShellOpenResult> {
  const resolved = await resolveArtifactTarget(artifactId, await effects.readLedger());
  if (!resolved.ok) return resolved;

  const confined = await effects.confine(resolved.path);
  if (!confined) return { ok: false, error: 'path not allowed' };

  const refusal = await refuseUnsafeOpenTarget(confined);
  if (refusal) return refusal;

  return effects.launch(confined);
}

/**
 * Name the application `openArtifact` would reach for this deliverable.
 *
 * Same first two steps as opening it - resolve the id through the ledger, then
 * confine - because naming an app must not become a second, laxer way to turn
 * an id into a path. The resolver then consults the type gate itself, so a
 * target `openArtifact` would refuse is never labelled with an app that will
 * not open it, and no subprocess is spent on one.
 *
 * Every failure is `{ applicationName: null }`, which renders as the plain
 * "Open". A label is not worth an error toast, and a button that names the
 * wrong app is worse than one that names none.
 */
export async function describeArtifactOpenTarget(
  artifactId: unknown,
  effects: ArtifactHostEffects,
  resolveApplicationName: (target: string) => Promise<string | null> = cachedDefaultApplicationName
): Promise<ArtifactOpenTarget> {
  const resolved = await resolveArtifactTarget(artifactId, await effects.readLedger());
  if (!resolved.ok) return { applicationName: null };

  const confined = await effects.confine(resolved.path);
  if (!confined) return { applicationName: null };

  return { applicationName: await resolveApplicationName(confined) };
}

/**
 * Reveal a deliverable in the OS file manager.
 *
 * Deliberately NOT type-gated. Selecting a file in Finder or Explorer never
 * executes it, so refusing to reveal a `.command` would remove the user's only
 * way to see what an agent actually wrote - which is the opposite of safety.
 * Identity and confinement still apply: revealing the wrong file would be a
 * lie about where the deliverable lives.
 */
export async function revealArtifact(artifactId: unknown, effects: ArtifactHostEffects): Promise<ShellOpenResult> {
  const resolved = await resolveArtifactTarget(artifactId, await effects.readLedger());
  if (!resolved.ok) return resolved;

  const confined = await effects.confine(resolved.path);
  if (!confined) return { ok: false, error: 'path not allowed' };

  return effects.reveal(confined);
}

/**
 * Copy a deliverable somewhere the user can reach it - a Desktop, a Dropbox, a
 * mail attachment.
 *
 * This is the one action with NO re-resolution window: the bytes written are
 * the bytes read from the handle whose digest matched the ledger, so nothing
 * can be swapped in between the check and the copy. That is why it does not
 * simply `fs.copyFile` the resolved path.
 *
 * Not type-gated, and that is deliberate: copying bytes never executes them,
 * and the file is already on the user's disk. Refusing would be theatre.
 */
export async function saveArtifactCopy(artifactId: unknown, effects: ArtifactHostEffects): Promise<ArtifactSaveResult> {
  const verified = await readVerifiedArtifact(artifactId, await effects.readLedger());
  if (!verified.ok) return verified;

  // Confine the SOURCE, like `openArtifact` and `revealArtifact` already do.
  // This was the only one of the four actions without it, which was unreachable
  // only while the cron executor was the sole writer to the ledger: containment
  // was proved by publication, and publication was the one thing that wrote a
  // record. A SECOND writer whose workspace is whatever folder a conversation
  // happens to point at removes that guarantee, and a record naming a workspace
  // outside every authorized root would have had its bytes read and handed to
  // the user with nothing in the way.
  //
  // The DESTINATION is deliberately NOT confined: the user picks it in an OS
  // save dialog, it is their own act rather than a renderer-supplied path, and
  // nothing is executed at the far end.
  const confined = await effects.confine(verified.path);
  if (!confined) return { ok: false, error: 'path not allowed' };

  // `path.basename` on the RECORDED relative path, which the ledger already
  // proved has no `..` and no separator tricks. The declared title is never
  // used as a filename: it is model-authored text.
  const suggested = path.basename(verified.record.relativePath);
  const destination = await effects.chooseSaveDestination(suggested);
  // A cancelled dialog is not a failure. Reporting it as one would put an error
  // toast in front of a user who just changed their mind.
  if (!destination) return { ok: true };

  try {
    await fs.writeFile(destination, verified.contents);
    return { ok: true, savedTo: destination };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * How much of a deliverable the host will even consider previewing.
 *
 * `MAX_ARTIFACT_BYTES` is 64 MB and the IPC bridge can neither reject nor carry
 * a reply that size, so a cap that lives only at the ledger is not a cap for
 * this channel. Both are applied to `record.sizeBytes` BEFORE the file is
 * opened, so an over-cap deliverable costs one ledger lookup rather than a
 * 64 MB read into the main process.
 */
const MAX_PREVIEW_SOURCE_BYTES = 4 * 1024 * 1024;

/**
 * Tighter, because an image is sent whole and base64 inflates it by a third.
 * A 4 MB PNG would cross the bridge as a 5.5 MB string.
 */
const MAX_PREVIEW_IMAGE_BYTES = 1024 * 1024;

/** How much text the card can use. The rest is a scroll bar nobody drags. */
const PREVIEW_TEXT_BYTES = 4096;

/** How much of the head the binary sniff looks at. */
const PREVIEW_SNIFF_BYTES = 1024;

/**
 * The CLOSED set of extensions that may be sent as an image, and the MIME each
 * one is labelled with.
 *
 * Closed, and mapped rather than derived, because the alternative is handing
 * the renderer a `data:` URL whose type came from a filename a model chose.
 */
const PREVIEW_IMAGE_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

/**
 * Extensions that are NEITHER an image nor a useful text preview.
 *
 * An SVG is a picture to the user and markup to the machine. Rendering it as an
 * `<img>` would put attacker-influenced markup into a document-shaped element,
 * and rendering its source in the hero band of a card would show a person who
 * asked for a diagram a wall of XML. The file glyph is the honest answer, and
 * Open here still opens it.
 *
 * DELIVERABLE DEVIATION FROM THE PLAN, STATED LOUDLY: the plan's prose listed
 * `xhtml`, `mhtml` and `htm` here as well, while its own test list and the card
 * spec both say an HTML deliverable previews as its SOURCE. Those three are
 * treated as TEXT, which is what the card was specified to show. Only `svg` and
 * `svgz` - the two that are pictures to a person - are refused outright.
 */
const PREVIEW_REFUSED_TYPES: ReadonlySet<string> = new Set(['svg', 'svgz']);

/** Lower-cased extension with no dot, or '' when there is none. */
function extensionOf(relativePath: string): string {
  return path.extname(relativePath).replace(/^\./, '').toLowerCase();
}

/**
 * A few VERIFIED bytes of a deliverable, so a card can show what is in the file.
 *
 * -------------------------------------------------------------------------
 * THE ORDER IS THE SECURITY. Half the value of each gate is in what it stops
 * from being READ AT ALL.
 * -------------------------------------------------------------------------
 *  1. ledger identity     - an id the ledger does not know resolves to nothing
 *  2. type gate           - a closed extension map, on the RECORDED path
 *  3. size gate           - on `record.sizeBytes`, so nothing is opened
 *  4. host confinement    - `effects.confine`, THE authorized-root question
 *  5. full verification   - `readVerifiedArtifact`: ancestor symlink walk,
 *                           regular-file check, dev/ino re-check, sha256
 *  6. binary sniff        - host-side, so the renderer never has to guess
 *  7. head only           - never the whole file, never a split codepoint
 *
 * Step 4 is the one that was easy to miss. `readVerifiedArtifact` proves only
 * that the file sits inside `record.workspace`; `isCanonicalWorkspace` accepts
 * ANY well-formed absolute path, so the ledger is NOT the authorized-root gate.
 * Chat is exactly the second writer the comment above `saveArtifactCopy` warns
 * about, and a record naming `/etc` or a home directory as its workspace would
 * otherwise have had its bytes read and handed to the renderer.
 *
 * Steps 2 and 3 run in that order rather than the reverse because the image cap
 * is tighter than the source cap, so the size question cannot be answered until
 * the type is known. Both are pure string and integer work on the record, which
 * is the property that matters: neither opens anything.
 *
 * Every refusal is a TYPED verdict, never raw bytes and never a host error
 * string. The renderer gets `{ kind: 'none', reason }` and translates it.
 */
export async function previewArtifact(artifactId: unknown, effects: ArtifactHostEffects): Promise<ArtifactPreview> {
  const records = await effects.readLedger();
  const record = typeof artifactId === 'string' ? records.find((entry) => entry.artifactId === artifactId) : undefined;
  // "Not in the ledger" and "forgotten" and "malformed id" are one answer on
  // purpose: a preview must not become an oracle for which ids exist.
  if (!record) return { kind: 'none', reason: 'unavailable' };

  const extension = extensionOf(record.relativePath);
  if (PREVIEW_REFUSED_TYPES.has(extension)) return { kind: 'none', reason: 'unsupported-type' };
  const imageMime = PREVIEW_IMAGE_TYPES[extension];

  const cap = imageMime ? MAX_PREVIEW_IMAGE_BYTES : MAX_PREVIEW_SOURCE_BYTES;
  if (!Number.isSafeInteger(record.sizeBytes) || record.sizeBytes > cap) {
    return { kind: 'none', reason: 'too-large' };
  }

  // The SAME expression the summary uses, so the path handed to confinement is
  // the path every other surface calls canonical. A second derivation here is
  // how a gate ends up guarding a different file than the one that opens.
  const target = toArtifactSummary(record).canonicalPath;
  const confined = await effects.confine(target);
  if (!confined) return { kind: 'none', reason: 'unavailable' };

  const verified = await readVerifiedArtifact(artifactId, records);
  // `=== false` rather than `!verified.ok`: the success arm of
  // `VerifiedArtifactOutcome` is an INTERSECTION, and TypeScript does not
  // narrow that union through the negation - it does through the explicit
  // comparison. Simplifying this back breaks the build, not just the style.
  if (verified.ok === false) {
    // Only the digest/size refusal is actionable by the user ("you edited it").
    // Everything else - gone, a symlink now, a directory now - is unavailable.
    return { kind: 'none', reason: verified.error === ARTIFACT_CHANGED_ERROR ? 'changed' : 'unavailable' };
  }

  if (imageMime) {
    return { kind: 'image', dataUrl: `data:${imageMime};base64,${verified.contents.toString('base64')}` };
  }

  if (looksBinary(verified.contents)) return { kind: 'none', reason: 'binary' };

  return {
    kind: 'text',
    text: decodeWholeCodepoints(verified.contents.subarray(0, PREVIEW_TEXT_BYTES)),
    truncated: verified.contents.length > PREVIEW_TEXT_BYTES,
  };
}

/**
 * Is this a file whose head should never be shown as text?
 *
 * Two signals over the first kilobyte, because either alone is porous. A NUL
 * byte catches the compiled and container formats; a strict UTF-8 decode
 * catches the ones that are dense high bytes with no NUL - a JPEG, a zip, most
 * of Office. Together they are what stops `%PDF-1.7 %âãÏÓ` appearing in the
 * hero band of a card.
 *
 * `stream: true` is load-bearing: it makes the decoder HOLD BACK an incomplete
 * trailing sequence instead of emitting U+FFFD for it, so a UTF-8 file that
 * merely happens to have a multi-byte character straddling byte 1024 is not
 * misread as binary.
 */
function looksBinary(contents: Buffer): boolean {
  const head = contents.subarray(0, PREVIEW_SNIFF_BYTES);
  if (head.includes(0)) return true;
  return new TextDecoder('utf-8').decode(head, { stream: true }).includes('\uFFFD');
}

/**
 * Decode a byte slice, dropping a trailing partial character rather than
 * emitting the replacement glyph for it.
 *
 * Cutting a preview at a fixed byte count lands mid-character often enough to
 * notice, and `\uFFFD` at the end of every truncated preview reads as a
 * corrupted file. Same `stream: true` trick as the sniff.
 */
function decodeWholeCodepoints(slice: Buffer): string {
  return new TextDecoder('utf-8').decode(slice, { stream: true });
}

/**
 * Re-register a chat deliverable the user has since edited.
 *
 * -------------------------------------------------------------------------
 * THIS IS NOT A RELAXATION, AND THE DIFFERENCE IS THE WHOLE POINT.
 * -------------------------------------------------------------------------
 * `openVerified` refuses a size mismatch and a digest mismatch, and that
 * refusal gates Open, Reveal AND Save-a-copy. It is what proves the bytes about
 * to be handed to an OS launcher are the bytes the host actually verified, so
 * it stays byte-exact and untouched. What was missing was not tolerance - it
 * was a way to say "yes, I edited it, record what it is NOW".
 *
 * So the repair re-runs `registerArtifacts`: the FULL path, applying
 * containment, symlink refusal, non-regular-file refusal, the size cap, and the
 * device/inode re-check to the new bytes exactly as the first registration did.
 * Nothing is skipped, nothing is trusted from the old record except its
 * IDENTITY - the run id and relative path, which is what keeps the artifact id
 * stable so the card already on the user's screen survives the repair.
 *
 * CHAT DELIVERABLES ONLY. A published series run is the record of what a
 * scheduled task produced on a given day. A change there is not an edit, it is
 * tampering, and re-registering it would launder that into a fresh valid
 * record. The namespace check is the guard, and it is the same one T1 reserved.
 */
export async function refreshChatArtifact(
  artifactId: unknown,
  effects: ArtifactHostEffects,
  ledgerPath: string
): Promise<ArtifactRefreshResult> {
  if (typeof artifactId !== 'string' || !artifactId) return { ok: false, error: 'unknown artifact' };
  const record = (await effects.readLedger()).find((entry) => entry.artifactId === artifactId);
  if (!record) return { ok: false, error: 'unknown artifact' };

  const location = chatDeliverableLocation(record);
  if (!location) return { ok: false, error: 'only a chat deliverable can be refreshed' };

  const { registered, rejected } = await registerArtifacts({
    ledgerPath,
    workspace: record.workspace,
    runDir: location.runDir,
    taskId: record.taskId,
    // IDENTITY IS PRESERVED, DELIBERATELY. `artifactIdFor` is deterministic on
    // (workspace, runId, relativePath), so reusing the run id re-appends the
    // SAME id and the reader collapses it to one current row - which is why the
    // card the user is looking at keeps working instead of being replaced.
    runId: record.runId,
    declaredBy: record.declaredBy,
    declarations: [{ path: location.insideRunDir }],
  });

  const refreshed = registered[0];
  if (!refreshed) {
    // The verification refused it - a symlink, a directory, a file now gone,
    // one over the cap. Report the reason; never fall back to the old record.
    return { ok: false, error: `artifact could not be refreshed: ${rejected[0]?.reason ?? 'unknown'}` };
  }
  return { ok: true, artifact: toArtifactSummary(refreshed) };
}

/**
 * Where a record sits inside the chat namespace, or null when it is not a chat
 * deliverable at all.
 *
 * The path is taken apart the same way the series classifiers take it apart, so
 * "is this a chat deliverable" cannot drift away from "is this a series one".
 */
function chatDeliverableLocation(record: ArtifactRecord): { runDir: string; insideRunDir: string } | null {
  const segments = record.relativePath.split('/').filter((segment) => segment.length > 0);
  // artifacts / chat / <conversationId> / <one or more segments>
  if (segments.length < 4) return null;
  if (segments[0] !== ARTIFACTS_DIR_NAME) return null;
  if (!isChatNamespace(segments[1])) return null;
  return {
    runDir: path.resolve(record.workspace, ...segments.slice(0, 3)),
    insideRunDir: segments.slice(3).join('/'),
  };
}

/**
 * The series, newest first, with the canonical target the controls must show.
 *
 * Records are NOT filesystem-verified here. Verification opens and hashes every
 * file, which is right for an action on one artifact and wrong for a listing of
 * hundreds - and a listing that quietly dropped anything unreadable would hide
 * exactly the missing-deliverable case the user needs to see. Every action
 * re-verifies before it does anything.
 */
export async function listArtifactSummaries(effects: ArtifactHostEffects): Promise<ArtifactSummary[]> {
  return (await listArtifacts(effects)).artifacts;
}

/**
 * The listing plus what the ledger read could not account for.
 *
 * Same ordering, same cap and same per-row disk status as
 * `listArtifactSummaries` - which is now a projection of this - so the rail and
 * the preview panel can never disagree about what is in the list.
 */
export async function listArtifacts(effects: ArtifactHostEffects): Promise<ArtifactListing> {
  const entries = effects.readLedgerEntries
    ? await effects.readLedgerEntries()
    : { records: await effects.readLedger(), unreadableEntries: 0 };
  const records = entries.records;
  const sorted = records.toSorted((left, right) => (right.runAt ?? '').localeCompare(left.runAt ?? ''));
  const listed = sorted.slice(0, MAX_LISTED_ARTIFACTS);
  // Measured on what the ledger HELD, not on what survived the slice: at
  // exactly the cap nothing was dropped, and reporting `length === cap` as
  // truncated would put a permanent "older rows are hidden" line under a list
  // that is complete.
  const truncated = sorted.length > MAX_LISTED_ARTIFACTS;
  const newestRunPerSeries = newestRunBySeries(listed);
  const artifacts = await Promise.all(
    listed.map(async (record) => {
      const alias = seriesAliasPathFor(record);
      const mirrored = alias !== null && newestRunPerSeries.get(alias.seriesKey) === record.runId;
      const summary = toArtifactSummary(record, mirrored ? [alias.aliasPath] : undefined);
      return { ...summary, diskStatus: await diskStatusOf(summary.canonicalPath) };
    })
  );
  return { artifacts, unreadableEntries: entries.unreadableEntries, truncated };
}

/**
 * What to SAY about a listed deliverable's file, established by one `lstat`.
 *
 * Deliberately NOT `readVerifiedArtifact`: that opens and sha256s the file, and
 * doing it for up to 500 rows to render a list would hash hundreds of megabytes
 * every time the page opens. This is a label, not a permission - nothing is
 * opened, revealed or copied on the strength of it, and every action still
 * re-verifies in full.
 *
 * `lstat`, not `stat`, so a dangling symlink reports `missing` rather than
 * following through to whatever it points at.
 *
 * Anything that is not a plain readable regular file reports `missing`: from
 * the user's side "it is a directory now" and "it is gone" are the same event -
 * the file they were promised is not there.
 */
async function diskStatusOf(canonicalPath: string): Promise<ArtifactDiskStatus> {
  try {
    const stat = await fs.lstat(canonicalPath);
    if (!stat.isFile()) return 'missing';
    return stat.size === 0 ? 'empty' : 'ready';
  } catch {
    return 'missing';
  }
}

/**
 * THE STABLE COPY IS DERIVED, NOT READ.
 *
 * `refreshSeriesAliases` mirrors the newest run's deliverables to the series
 * root at `<series>/<path-inside-the-run-dir>` and retires everything the newest
 * run did not reproduce, so the alias set is a pure function of the newest run's
 * ledger records - the same records this listing already holds. Deriving it here
 * keeps the listing a single ledger read: asking the filesystem would mean an
 * `.aliases.json` read per series on every preview selection, for a path the
 * caller is already looking at.
 *
 * The two rules that decide whether a record HAS an alias are applied here as
 * well, because both are what publication applied: the entry must sit inside a
 * `artifacts/<series>/<date>/<run-id>/` run directory, and its path inside that
 * run directory must not be a reserved series entry.
 *
 * Returns null for anything that is not a series-published run artifact.
 */
function seriesAliasPathFor(record: ArtifactRecord): { seriesKey: string; aliasPath: string } | null {
  const segments = record.relativePath.split('/').filter((segment) => segment.length > 0);
  // artifacts / <series> / <date> / <run-id> / <one or more segments>
  if (segments.length < 5) return null;
  if (segments[0] !== ARTIFACTS_DIR_NAME) return null;
  // T1: `artifacts/chat/<conversationId>/sub/file.md` has the series SHAPE and
  // is not one. Without this a chat deliverable grows a phantom alias at the
  // series root, and a real series of that name would then retire it.
  if (isChatNamespace(segments[1])) return null;
  const insideRunDir = segments.slice(4).join('/');
  if (isReservedSeriesEntry(insideRunDir)) return null;
  return {
    // NUL cannot occur in either half, so the join cannot alias two different
    // (workspace, series) pairs onto one key.
    seriesKey: `${record.workspace}\u0000${segments[1]}`,
    aliasPath: path.resolve(record.workspace, segments[0], segments[1], ...segments.slice(4)),
  };
}

/**
 * Which run is the newest in each series, by the same ordering the caller
 * already sorted by. Only that run's deliverables are mirrored to the series
 * root; every earlier run's copies were retired when it published.
 */
function newestRunBySeries(records: readonly ArtifactRecord[]): Map<string, string> {
  const newest = new Map<string, { runId: string; runAt: string }>();
  for (const record of records) {
    const alias = seriesAliasPathFor(record);
    if (!alias) continue;
    const current = newest.get(alias.seriesKey);
    // Ties broken by run id so the answer does not depend on ledger order: two
    // runs sharing a `runAt` is a clock artefact, not a reason to be arbitrary.
    const runAt = record.runAt ?? '';
    if (!current || runAt > current.runAt || (runAt === current.runAt && record.runId > current.runId)) {
      newest.set(alias.seriesKey, { runId: record.runId, runAt });
    }
  }
  return new Map([...newest].map(([key, value]) => [key, value.runId]));
}

/**
 * The renderer-facing projection of one ledger record.
 *
 * Shared with the series view rather than duplicated: the two surfaces must
 * agree on what `canonicalPath` is, and a second copy of this mapping is how
 * the bar ends up showing a different target than the history row that opens
 * the same file.
 */
export function toArtifactSummary(record: ArtifactRecord, aliasPaths?: readonly string[]): ArtifactSummary {
  return {
    ...(aliasPaths?.length ? { aliasPaths: [...aliasPaths] } : {}),
    artifactId: record.artifactId,
    taskId: record.taskId,
    runId: record.runId,
    ...(record.title ? { title: record.title } : {}),
    fileName: path.basename(record.relativePath),
    canonicalPath: path.resolve(record.workspace, ...record.relativePath.split('/')),
    sizeBytes: record.sizeBytes,
    runAt: record.runAt,
    declaredBy: record.declaredBy,
  };
}
