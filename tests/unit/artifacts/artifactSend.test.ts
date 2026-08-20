/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Send to..., the decision layer.
 *
 * Sending a deliverable off the machine is an EXFILTRATION PRIMITIVE, so these
 * run the REAL resolver, the REAL ledger and the REAL verifier with only the
 * last inch - the human confirmation and the connector handoff - replaced by a
 * recorder. "It refused" therefore means the connector was never reached, not
 * that an assertion about source text held.
 *
 * The four properties every case here exists to pin:
 *
 *  1. The renderer names a TARGET and a DESTINATION, never a path and never an
 *     address. Both are re-resolved against the LIVE connector list on every
 *     call, so a renderer that invents either reaches nothing.
 *  2. The artifact is addressed by ID and verified against the ledger TWICE -
 *     once for the confirmation the human reads, and again after they answer,
 *     because the pause in between is unbounded and a file can change inside it.
 *  3. Declining is not a failure, and it is not a send.
 *  4. Nothing throws. The bridge has no rejection channel, so every outcome is
 *     a resolved value the card can render.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerArtifacts, type ArtifactRecord } from '@process/services/artifacts/artifactLedger';
import {
  MAX_SEND_BYTES,
  describeSendConfirmation,
  listArtifactSendTargets,
  sendArtifactTo,
  type ArtifactSendEffects,
} from '@process/services/artifacts/artifactSend';
import type { ArtifactSendTarget } from '@/common/types/artifacts';

let root: string;
let workspace: string;
let ledgerPath: string;
let records: ArtifactRecord[];

const register = async (relative: string, contents: string): Promise<ArtifactRecord> => {
  const absolute = path.join(workspace, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, contents);
  const result = await registerArtifacts({
    ledgerPath,
    workspace,
    runDir: workspace,
    taskId: 'morning-brief',
    runId: 'r1',
    declaredBy: 'market-open-report',
    declarations: [{ path: relative, title: 'Morning Brief' }],
  });
  expect(result.rejected).toEqual([]);
  const record = result.registered[0];
  records.push(record);
  return record;
};

const EMAIL_TARGET: ArtifactSendTarget = {
  targetId: 'plugin-email-1',
  channel: 'email-imap',
  label: 'me@example.com',
  destinations: [
    { destinationId: 'team@example.com', label: 'The Team' },
    { destinationId: 'boss@example.com', label: 'boss@example.com' },
  ],
};

const buildEffects = (overrides: Partial<ArtifactSendEffects> = {}) => {
  const listTargets = vi.fn(async () => [EMAIL_TARGET]);
  const confirmSend = vi.fn(async () => true);
  const deliver = vi.fn(async () => undefined);
  const effects: ArtifactSendEffects = {
    readLedger: async () => records,
    listTargets,
    confirmSend,
    deliver,
    ...overrides,
  };
  return { effects, listTargets, confirmSend, deliver };
};

beforeEach(async () => {
  // realpath, because the ledger records the realpath-collapsed workspace and
  // macOS collapses /var to /private/var.
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'artifact-send-')));
  workspace = path.join(root, 'workspace');
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
  records = [];
  await fs.mkdir(workspace, { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('listArtifactSendTargets', () => {
  it('offers nothing at all when no connector is configured', async () => {
    // An empty list is the signal the card uses to render NO button. A button
    // that opens an empty menu is the dead click this slot exists to avoid.
    const { effects } = buildEffects({ listTargets: vi.fn(async () => []) });
    expect(await listArtifactSendTargets(effects)).toEqual([]);
  });

  it('drops a configured connector that has nobody to send to', async () => {
    // A connector with no authorized recipient cannot complete a send, so
    // offering it would be the same dead click one level down.
    const { effects } = buildEffects({
      listTargets: vi.fn(async () => [{ ...EMAIL_TARGET, destinations: [] }]),
    });
    expect(await listArtifactSendTargets(effects)).toEqual([]);
  });

  it('offers a configured connector that has a recipient', async () => {
    const { effects } = buildEffects();
    expect(await listArtifactSendTargets(effects)).toEqual([EMAIL_TARGET]);
  });

  it('resolves to an empty list rather than rejecting when enumeration throws', async () => {
    const { effects } = buildEffects({
      listTargets: vi.fn(async () => {
        throw new Error('database unavailable');
      }),
    });
    // The bridge cannot carry a rejection, and no connectors is the honest
    // rendering of "we could not tell".
    await expect(listArtifactSendTargets(effects)).resolves.toEqual([]);
  });
});

describe('sendArtifactTo', () => {
  it('sends the VERIFIED BYTES to a configured destination', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, deliver } = buildEffects();

    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects
    );

    expect(result).toEqual({ ok: true, sentTo: 'The Team' });
    expect(deliver).toHaveBeenCalledTimes(1);
    const delivery = deliver.mock.calls[0][0];
    expect(delivery.targetId).toBe(EMAIL_TARGET.targetId);
    expect(delivery.destinationId).toBe('team@example.com');
    expect(delivery.fileName).toBe('brief.html');
    // The BYTES, read from the handle whose digest matched the ledger.
    expect(delivery.contents.toString()).toBe('<h1>brief</h1>');
  });

  it('never lets a renderer-supplied PATH reach the connector', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, deliver } = buildEffects();

    await sendArtifactTo(
      {
        artifactId: record.artifactId,
        targetId: EMAIL_TARGET.targetId,
        destinationId: 'team@example.com',
        // A compromised renderer's best try: smuggle a path alongside the id.
        path: '/etc/passwd',
        canonicalPath: '/etc/passwd',
      } as never,
      effects
    );

    const delivery = deliver.mock.calls[0][0];
    expect(JSON.stringify(delivery)).not.toContain('/etc/passwd');
    expect(delivery.contents.toString()).toBe('<h1>brief</h1>');
  });

  it('refuses a destination the live connector list does not contain', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, deliver, confirmSend } = buildEffects();

    // The address the renderer asked for is not one the user ever authorized.
    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'attacker@evil.test' },
      effects
    );

    expect(result).toEqual({ ok: false, errorCode: 'unknown_destination' });
    expect(confirmSend).not.toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });

  it('refuses a connector the live list does not contain', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, deliver } = buildEffects();

    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: 'plugin-that-is-not-configured', destinationId: 'team@example.com' },
      effects
    );

    expect(result).toEqual({ ok: false, errorCode: 'unknown_target' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('refuses an artifact id the ledger does not vouch for', async () => {
    const { effects, deliver, confirmSend } = buildEffects();

    const result = await sendArtifactTo(
      { artifactId: 'f'.repeat(32), targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects
    );

    expect(result).toEqual({ ok: false, errorCode: 'unknown_artifact' });
    expect(confirmSend).not.toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });

  it('names the DESTINATION and the FILE in the confirmation, not jargon', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, confirmSend } = buildEffects();

    await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects
    );

    expect(confirmSend).toHaveBeenCalledTimes(1);
    const request = confirmSend.mock.calls[0][0];
    expect(request.destinationLabel).toBe('The Team');
    expect(request.fileName).toBe('brief.html');
    expect(request.targetLabel).toBe('me@example.com');
    expect(request.sizeBytes).toBe(record.sizeBytes);
  });

  it('treats declining as a non-event: no send, no error', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects, deliver } = buildEffects({ confirmSend: vi.fn(async () => false) });

    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects
    );

    // `ok` with no `sentTo`, exactly as a cancelled save dialog reports. An
    // error toast in front of a user who changed their mind is a bug.
    expect(result).toEqual({ ok: true });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('re-verifies AFTER the human answers, so a swap during the pause cannot ride along', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const absolute = path.join(workspace, 'artifacts/2026-08-20/r1/brief.html');

    // The confirmation dialog is an unbounded human pause. Anything that can
    // write into the workspace can swap the file inside it, and a single
    // pre-dialog verification would happily send whatever landed after.
    const confirmSend = vi.fn(async () => {
      await fs.writeFile(absolute, '<h1>every password I could find</h1>');
      return true;
    });
    const { effects, deliver } = buildEffects({ confirmSend });

    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects
    );

    expect(result).toEqual({ ok: false, errorCode: 'unknown_artifact' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('classifies a connector failure instead of throwing it', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const { effects } = buildEffects({
      deliver: vi.fn(async () => {
        throw new Error('SMTP 535 authentication failed');
      }),
    });

    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects
    );

    expect(result).toMatchObject({ ok: false, errorCode: 'send_failed' });
    expect((result as { message?: string }).message).toContain('SMTP 535');
  });

  it('refuses a deliverable larger than the send cap', async () => {
    const record = await register('artifacts/2026-08-20/r1/big.txt', 'x'.repeat(64));
    // Pin the cap rather than write 20MB: the rule under test is the
    // comparison, and a 20MB temp file per run is a slow way to assert it.
    const { effects, deliver, confirmSend } = buildEffects();

    const result = await sendArtifactTo(
      { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
      effects,
      /* maxBytes */ 8
    );

    expect(result).toEqual({ ok: false, errorCode: 'too_large' });
    expect(deliver).not.toHaveBeenCalled();
    // Decided BEFORE the human is asked. Confirming a send that is then refused
    // for a reason we already knew wastes the one gesture that matters.
    expect(confirmSend).not.toHaveBeenCalled();
    expect(MAX_SEND_BYTES).toBeGreaterThan(64);
  });

  it('resolves rather than rejecting whatever the effects do', async () => {
    const record = await register('artifacts/2026-08-20/r1/brief.html', '<h1>brief</h1>');
    const boom = () => {
      throw new Error('exploded');
    };
    const { effects } = buildEffects({
      listTargets: vi.fn(async () => boom() as never),
      confirmSend: vi.fn(async () => boom() as never),
      deliver: vi.fn(async () => boom()),
    });

    // A rejection here is a renderer that hangs forever, not an error it can
    // show. `.resolves` is the whole assertion.
    await expect(
      sendArtifactTo(
        { artifactId: record.artifactId, targetId: EMAIL_TARGET.targetId, destinationId: 'team@example.com' },
        effects
      )
    ).resolves.toMatchObject({ ok: false });
  });

  it('rejects a malformed request without consulting anything', async () => {
    const { effects, listTargets, deliver } = buildEffects();
    for (const bad of [null, undefined, 'brief', { artifactId: 123 }, { targetId: 'x' }]) {
      const result = await sendArtifactTo(bad as never, effects);
      expect(result).toMatchObject({ ok: false });
    }
    expect(deliver).not.toHaveBeenCalled();
    expect(listTargets).not.toHaveBeenCalled();
  });
});

describe('describeSendConfirmation', () => {
  /**
   * The wording IS the gate. Everything else here proves the agent cannot
   * answer this prompt; these prove the prompt is worth answering.
   */
  it('names the FILE and the DESTINATION in the first line', () => {
    const { message } = describeSendConfirmation({
      destinationLabel: 'The Team',
      fileName: 'brief.html',
      targetLabel: 'me@example.com',
      sizeBytes: 2048,
    });
    expect(message).toBe('Send "brief.html" to The Team?');
    // No jargon. A prompt the user cannot act on is a button they learn to
    // click, which is worse than no prompt at all.
    expect(message).not.toMatch(/confirm|allow|proceed|tool|action/i);
  });

  it('says the file LEAVES THE COMPUTER, and that we never hold the password', () => {
    const { detail } = describeSendConfirmation({
      destinationLabel: 'The Team',
      fileName: 'brief.html',
      targetLabel: 'me@example.com',
      sizeBytes: 2048,
    });
    expect(detail).toContain('2 KB');
    expect(detail).toContain('leave this computer');
    expect(detail).toContain('me@example.com');
    expect(detail).toContain('never sees or stores its password');
  });
});
