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
import type { ArtifactOpenTarget, ArtifactSaveResult, ArtifactSummary } from '@/common/types/artifacts';
import { refuseUnsafeOpenTarget } from '@process/bridge/shellOpenSafety';

import type { ArtifactRecord } from './artifactLedger';
import { readVerifiedArtifact, resolveArtifactTarget } from './artifactTarget';
import { cachedDefaultApplicationName } from './defaultApplication';

/**
 * The host capabilities these actions need. Injected so the decision logic can
 * be tested against a real filesystem with only the OS launcher recorded.
 */
export interface ArtifactHostEffects {
  readLedger(): Promise<ArtifactRecord[]>;
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
export async function saveArtifactCopy(
  artifactId: unknown,
  effects: ArtifactHostEffects
): Promise<ArtifactSaveResult> {
  const verified = await readVerifiedArtifact(artifactId, await effects.readLedger());
  if (!verified.ok) return verified;

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
 * The series, newest first, with the canonical target the controls must show.
 *
 * Records are NOT filesystem-verified here. Verification opens and hashes every
 * file, which is right for an action on one artifact and wrong for a listing of
 * hundreds - and a listing that quietly dropped anything unreadable would hide
 * exactly the missing-deliverable case the user needs to see. Every action
 * re-verifies before it does anything.
 */
export async function listArtifactSummaries(effects: ArtifactHostEffects): Promise<ArtifactSummary[]> {
  const records = await effects.readLedger();
  return records
    .toSorted((left, right) => (right.runAt ?? '').localeCompare(left.runAt ?? ''))
    .slice(0, MAX_LISTED_ARTIFACTS)
    .map(toArtifactSummary);
}

/**
 * The renderer-facing projection of one ledger record.
 *
 * Shared with the series view rather than duplicated: the two surfaces must
 * agree on what `canonicalPath` is, and a second copy of this mapping is how
 * the bar ends up showing a different target than the history row that opens
 * the same file.
 */
export function toArtifactSummary(record: ArtifactRecord): ArtifactSummary {
  return {
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
