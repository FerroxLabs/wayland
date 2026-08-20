/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Send to..., the decision layer.
 *
 * Open, Reveal and Save a copy all end on THIS machine. This one does not: it
 * puts the bytes on a wire. That makes it an EXFILTRATION PRIMITIVE, and it is
 * held to a different bar than its three neighbours in `artifactActions`.
 *
 * WHAT THIS IS NOT. It is not a mail client, and it never sees a credential.
 * The user has already configured a connector in Settings -> Channels and
 * already authorized the people it may talk to; this hands that connector a
 * file and a recipient it already knows. Every secret stays where the user put
 * it. The same shape is what "Save to Google Drive" is on other products - the
 * difference is that our artifact is already a real file in the user's own
 * Documents folder, so this is a convenience, not the only way out.
 *
 * FIVE RULES, each because dropping it reopens a specific hole:
 *
 * 1. ONLY WHAT THE USER CONFIGURED. The target list is rebuilt from the live
 *    connector registry on every single call. It is never cached and never
 *    taken from the caller. An empty list is a real answer, and the card
 *    renders NO BUTTON for it - not a button that opens an empty menu.
 *
 * 2. THE RENDERER NAMES AN ID, NEVER AN ADDRESS AND NEVER A PATH. Both the
 *    connector and the recipient are looked up in that live list, so a
 *    compromised renderer asking for `attacker@evil.test` is asking for a
 *    destination that does not exist rather than supplying one. This is the
 *    same rule the rest of the seam applies to paths, extended to the far end:
 *    an address from the renderer is attacker input, and there is no
 *    validation that turns it back into a trustworthy one.
 *
 * 3. VERIFY, CONFIRM, VERIFY AGAIN. The confirmation is an unbounded human
 *    pause. A single check before it would describe one file to the user and
 *    send whatever occupied that path afterwards - and an agent that can write
 *    into the workspace is exactly what is on the other side of that window.
 *    So identity is proved once to build an honest dialog, and proved AGAIN
 *    after the answer; the bytes sent are the ones from the second, post-
 *    consent read.
 *
 * 4. THE CONSENT MUST BE UNANSWERABLE BY THE AGENT. Deliberately NOT an
 *    `IConfirmation`. This product has seven independent auto-approve paths -
 *    `BaseAgentManager.addConfirmation` takes `options[0]` blindly under
 *    yoloMode, and `ConversationChatConfirm` matches the VALUES
 *    `proceed_once`/`proceed_always` - so a consent card in the message stream
 *    is answered before a human ever sees it. `confirmSend` is host chrome
 *    driven from the main process, outside the conversation entirely, and
 *    nothing in the engine can reach it.
 *
 * 5. NOTHING THROWS. `buildProvider(...).invoke` has no reject and no timeout,
 *    so a throw is not an error the renderer catches - it is a promise that
 *    never settles and a button that spins forever. Every path here returns a
 *    classified, resolved value.
 */

import path from 'path';

import type { ArtifactSendResult, ArtifactSendTarget } from '@/common/types/artifacts';

import type { ArtifactRecord } from './artifactLedger';
import { readVerifiedArtifact } from './artifactTarget';

/**
 * Cap on what may leave the machine in one gesture.
 *
 * Lower than the ledger's own artifact cap on purpose: this is a mail-shaped
 * limit, and a connector that silently truncates or rejects a 200MB attachment
 * produces a "sent" that never arrived. Refusing here is the honest answer.
 */
export const MAX_SEND_BYTES = 20 * 1024 * 1024;

/** What the human is asked, in the words they are asked it. */
export interface ArtifactSendConfirmation {
  /** Who it goes to. First line of the dialog, never jargon. */
  destinationLabel: string;
  /** The file that goes. Also first line. */
  fileName: string;
  /** Which configured account it leaves from. */
  targetLabel: string;
  sizeBytes: number;
}

/**
 * The exact words the human is shown.
 *
 * Lives here, in the pure module, because the WORDING is a security property
 * rather than presentation. A prompt that says "Confirm this action?" is not
 * consent to send a specific file to a specific person - it is a button that
 * the user learns to click. So the first line names both, and the detail says
 * plainly that the file leaves the computer and that we never hold the
 * account's password.
 */
export function describeSendConfirmation(request: ArtifactSendConfirmation): {
  message: string;
  detail: string;
} {
  return {
    message: `Send "${request.fileName}" to ${request.destinationLabel}?`,
    detail:
      `${formatSendSize(request.sizeBytes)} will leave this computer via ${request.targetLabel}. ` +
      `Wayland hands the file to that connector and never sees or stores its password.`,
  };
}

/** Whole units. The question is "is this the file I meant", not the byte count. */
export function formatSendSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The handoff. Bytes, because a path would re-open the window rule 3 closes. */
export interface ArtifactDelivery {
  targetId: string;
  destinationId: string;
  fileName: string;
  contents: Buffer;
  /** Skill-declared label. UNTRUSTED text - a subject line, never a filename. */
  title?: string;
}

/**
 * The host capabilities this needs. Injected so the rules above can be
 * exercised for real: a refusal means the connector was never reached.
 */
export interface ArtifactSendEffects {
  readLedger(): Promise<ArtifactRecord[]>;
  /** The LIVE configured-connector list. Rebuilt per call, never cached here. */
  listTargets(): Promise<ArtifactSendTarget[]>;
  /** Host chrome, main process. NOT an IConfirmation - see rule 4. */
  confirmSend(request: ArtifactSendConfirmation): Promise<boolean>;
  /** Hand the connector the verified bytes. May throw; the caller classifies. */
  deliver(delivery: ArtifactDelivery): Promise<void>;
}

type SendRequest = {
  artifactId: string;
  targetId: string;
  destinationId: string;
};

function parseRequest(request: unknown): SendRequest | null {
  if (!request || typeof request !== 'object') return null;
  const { artifactId, targetId, destinationId } = request as Record<string, unknown>;
  if (typeof artifactId !== 'string' || !artifactId) return null;
  if (typeof targetId !== 'string' || !targetId) return null;
  if (typeof destinationId !== 'string' || !destinationId) return null;
  // Only these three fields are carried forward. Anything else the renderer
  // attached - a path, a canonicalPath, an address - is dropped here and can
  // never reach the connector, which is what makes rule 2 structural rather
  // than a promise.
  return { artifactId, targetId, destinationId };
}

/**
 * The connectors this deliverable may be sent to, right now.
 *
 * A connector with no authorized recipient is dropped: it cannot complete a
 * send, so offering it would just move the dead click one level down. An empty
 * result is the signal to render no button at all.
 */
export async function listArtifactSendTargets(effects: ArtifactSendEffects): Promise<ArtifactSendTarget[]> {
  let targets: ArtifactSendTarget[];
  try {
    targets = await effects.listTargets();
  } catch {
    // "We could not tell" renders honestly as "no connectors". The alternative
    // is a rejection the bridge cannot carry.
    return [];
  }
  if (!Array.isArray(targets)) return [];
  return targets.filter((target) => target && target.destinations?.length > 0);
}

/**
 * Send one deliverable to one recipient on one configured connector.
 *
 * `maxBytes` is a parameter only so the cap itself can be exercised without
 * writing twenty megabytes to a temp directory per test run.
 */
export async function sendArtifactTo(
  request: unknown,
  effects: ArtifactSendEffects,
  maxBytes: number = MAX_SEND_BYTES
): Promise<ArtifactSendResult> {
  const parsed = parseRequest(request);
  if (!parsed) return { ok: false, errorCode: 'invalid_request' };

  const targets = await listArtifactSendTargets(effects);
  const target = targets.find((candidate) => candidate.targetId === parsed.targetId);
  if (!target) return { ok: false, errorCode: 'unknown_target' };

  const destination = target.destinations.find((candidate) => candidate.destinationId === parsed.destinationId);
  if (!destination) return { ok: false, errorCode: 'unknown_destination' };

  const records = await readLedgerQuietly(effects);

  // First verification: proves the id names a real, unmodified deliverable, and
  // supplies the name and size the human is about to be shown.
  const described = await readVerifiedArtifact(parsed.artifactId, records);
  if (!described.ok) return { ok: false, errorCode: 'unknown_artifact' };

  if (described.record.sizeBytes > maxBytes) return { ok: false, errorCode: 'too_large' };

  // `path.basename` on the RECORDED relative path, which the ledger already
  // proved has no `..` and no separator tricks. The declared title is never
  // used as a filename: it is model-authored text.
  const fileName = path.basename(described.record.relativePath);

  let confirmed: boolean;
  try {
    confirmed = await effects.confirmSend({
      destinationLabel: destination.label,
      fileName,
      targetLabel: target.label,
      sizeBytes: described.record.sizeBytes,
    });
  } catch {
    // A dialog that could not be shown is not consent.
    return { ok: false, errorCode: 'send_failed', message: 'The confirmation could not be shown.' };
  }

  // Declining is not a failure and not a send. Reported exactly as a cancelled
  // save dialog is, so neither puts a toast in front of a user who just
  // changed their mind.
  if (!confirmed) return { ok: true };

  // Second verification, after the answer. The bytes below are the ones whose
  // digest matched the ledger AFTER consent was given, so nothing written into
  // the workspace during the dialog can ride along on the user's decision.
  const verified = await readVerifiedArtifact(parsed.artifactId, records);
  if (!verified.ok) return { ok: false, errorCode: 'unknown_artifact' };
  if (verified.contents.byteLength > maxBytes) return { ok: false, errorCode: 'too_large' };

  try {
    await effects.deliver({
      targetId: target.targetId,
      destinationId: destination.destinationId,
      fileName,
      contents: verified.contents,
      ...(verified.record.title ? { title: verified.record.title } : {}),
    });
  } catch (error) {
    return { ok: false, errorCode: 'send_failed', message: (error as Error)?.message ?? 'The connector refused it.' };
  }

  return { ok: true, sentTo: destination.label };
}

async function readLedgerQuietly(effects: ArtifactSendEffects): Promise<ArtifactRecord[]> {
  try {
    return await effects.readLedger();
  } catch {
    // An unreadable ledger vouches for nothing, which is the same outcome as an
    // id that is not in it.
    return [];
  }
}
