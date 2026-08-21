/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The live revoke, and the registry it reaches through.
 *
 * A removal that only edits the durable file leaves every engine already
 * running still reading the folder, because Core holds grants in session memory
 * and nothing re-reads the list mid-session. That is the failure this module
 * exists to prevent, so the tests below are about WHICH sessions get the
 * command and whether a revoke that did not land is allowed to report success.
 *
 * They exercise the production functions, never a local re-implementation: a
 * guard proved against a copy can be unwired from the caller while the whole
 * suite stays green.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearLivePathGrantSessionsForTest,
  listLivePathGrantSessions,
  registerLivePathGrantSession,
} from '@process/agent/wcore/pathGrantSessions';
import { revokeFolderGrantInLiveSessions } from '@process/services/workspace/folderGrantSurface';

const WORKSPACE = '/Users/x/Documents/Wayland/Projects/Ledger';
const OTHER_WORKSPACE = '/Users/x/Documents/Wayland/Projects/Payroll';

/** A receipt object stands for "Core acknowledged"; null is the host failing to send. */
const RECEIPT = { readable_roots: [] };

const session = (workspace: string, revokePath = vi.fn(async () => RECEIPT as unknown)) => ({
  workspace,
  revokePath,
});

afterEach(() => {
  clearLivePathGrantSessionsForTest();
});

describe('revokeFolderGrantInLiveSessions', () => {
  it('revokes in the matching workspace and leaves every other session alone', async () => {
    const mine = session(WORKSPACE);
    const theirs = session(OTHER_WORKSPACE);

    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [mine, theirs]);

    expect(mine.revokePath).toHaveBeenCalledWith('g-1');
    // Not merely "revoked === 1": a rule that revoked EVERYWHERE would also
    // report 1 if it happened to see one session. The other session is the
    // assertion that matters.
    expect(theirs.revokePath).not.toHaveBeenCalled();
    expect(outcome).toEqual({ revoked: 1, failed: 0 });
  });

  it('matches a workspace path that differs only by a trailing separator', async () => {
    const mine = session(`${WORKSPACE}/`);
    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [mine]);
    expect(outcome).toEqual({ revoked: 1, failed: 0 });
  });

  it('counts a revoke the engine never acknowledged as FAILED, not as revoked', async () => {
    // `revokePath` resolves null when the host could not get the command out.
    // Counting that as a success is exactly the lie this whole surface exists
    // to avoid: the user would be told the folder is no longer readable.
    const dead = session(WORKSPACE, vi.fn(async () => null as unknown));
    const live = session(WORKSPACE);

    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [dead, live]);

    expect(outcome).toEqual({ revoked: 1, failed: 1 });
  });

  it('counts a revoke that THREW as failed and still revokes the other sessions', async () => {
    // The live shape today: `revoke_path` is absent from the pinned
    // host-command schema, so the outbound contract validator throws
    // synchronously before anything reaches stdin
    // (FerroxLabs/wayland-core#314). One wedged session must not swallow the
    // others, and must not be reported as done.
    const throwing = {
      workspace: WORKSPACE,
      revokePath: vi.fn(() => {
        throw new Error('command not in the negotiated contract');
      }),
    };
    const healthy = session(WORKSPACE);

    const outcome = await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [throwing, healthy]);

    expect(outcome).toEqual({ revoked: 1, failed: 1 });
    expect(healthy.revokePath).toHaveBeenCalledWith('g-1');
  });

  it('revokes nothing when the workspace id resolved to no folder', async () => {
    const mine = session(WORKSPACE);
    expect(await revokeFolderGrantInLiveSessions(null, 'g-1', [mine])).toEqual({ revoked: 0, failed: 0 });
    expect(mine.revokePath).not.toHaveBeenCalled();
    // Positive control: the same session IS reachable when the folder resolves.
    expect(await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1', [mine])).toEqual({ revoked: 1, failed: 0 });
  });

  it('reads the LIVE registry when no session list is supplied', async () => {
    // Pins the default argument to the real registry. With it defaulted to an
    // empty array instead, every removal would silently revoke nothing.
    const mine = session(WORKSPACE);
    registerLivePathGrantSession(mine);
    expect(await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1')).toEqual({ revoked: 1, failed: 0 });
  });
});

describe('the live-session registry', () => {
  it('publishes a session and withdraws it again through the returned handle', async () => {
    const mine = session(WORKSPACE);
    const unpublish = registerLivePathGrantSession(mine);
    expect(listLivePathGrantSessions()).toContain(mine);

    unpublish();

    expect(listLivePathGrantSessions()).not.toContain(mine);
    // A withdrawn session must not still be revoked through.
    expect(await revokeFolderGrantInLiveSessions(WORKSPACE, 'g-1')).toEqual({ revoked: 0, failed: 0 });
    expect(mine.revokePath).not.toHaveBeenCalled();
  });

  it('returns a snapshot, so registering during a fan-out cannot disturb it', () => {
    const first = session(WORKSPACE);
    registerLivePathGrantSession(first);
    const snapshot = listLivePathGrantSessions();
    registerLivePathGrantSession(session(WORKSPACE));
    expect(snapshot).toHaveLength(1);
    expect(listLivePathGrantSessions()).toHaveLength(2);
  });
});
