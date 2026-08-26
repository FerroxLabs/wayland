/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #980 remaining half - the leader believed an artifact existed and could not
 * find it.
 *
 * v0.12.4 reconciled the STATUS half of the control plane: teammate status is
 * live data, DB-loaded statuses are reconciled on session load, and a Watchdog
 * rewrite of the task board notifies the leader instead of leaving it holding a
 * stale belief. The ARTIFACT half was untouched, and it is a different
 * mechanism: nothing in the team layer ever compared a claim against the disk.
 *
 * A teammate reports "wrote report.md" over `team_send_message`. That sentence
 * is the ONLY thing the leader ever learns about the file - the mailbox has no
 * artifact channel, `TeamTask` has no deliverable field, and the per-conversation
 * artifact sweep that DOES check claims (`chatRun` -> `savedFileClaims`) renders
 * its verdict in the teammate's own chat, which the leader never reads. So the
 * control plane's belief and the execution plane's filesystem were never
 * compared, and a hallucinated file propagated to the leader as fact.
 *
 * This closes it at the seam where the belief is formed: the claim is checked
 * against the team workspace as the message is written, and a claim the disk
 * does not support is annotated on the message the leader reads.
 *
 * PRECISION OVER RECALL, inherited deliberately from `savedFileClaims`: a false
 * accusation contradicts a truthful teammate in front of the leader and is a
 * worse failure than silence.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { formatTeamClaimNotice, reconcileTeamMessageClaims } from '@process/team/artifactClaims';

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-team-claims-'));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe('#980 a teammate claim is reconciled against the team workspace', () => {
  it('reports a claimed deliverable that is nowhere under the workspace', async () => {
    const unsupported = await reconcileTeamMessageClaims(
      'Done. I wrote artifacts/chat/42d0fd61/chart-brief.md with the full brief.',
      workspace
    );

    expect(unsupported).toEqual([{ fileName: 'chart-brief.md', verdict: 'absent' }]);
  });

  it('says nothing when the claimed file is exactly where the teammate said', async () => {
    await fs.mkdir(path.join(workspace, 'reports'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'reports', 'summary.md'), '# ok');

    expect(await reconcileTeamMessageClaims('I wrote reports/summary.md for you.', workspace)).toEqual([]);
  });

  it('tells the leader WHERE the file actually is when the path was wrong but the file is real', async () => {
    await fs.mkdir(path.join(workspace, 'notes'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'notes', 'summary.md'), '# ok');

    expect(await reconcileTeamMessageClaims('Saved to reports/summary.md.', workspace)).toEqual([
      { fileName: 'summary.md', verdict: 'elsewhere', actualPath: 'notes/summary.md' },
    ]);
  });

  it('makes no accusation about a path that leaves the workspace', async () => {
    // Outside the jail the host cannot honestly say the file is missing, and it
    // has no business stat-ing there either. Unverifiable is silence, never a
    // verdict.
    expect(await reconcileTeamMessageClaims('I wrote ../../elsewhere/secret.md.', workspace)).toEqual([]);
    expect(await reconcileTeamMessageClaims('I wrote /etc/hosts.md.', workspace)).toEqual([]);
  });

  it('says nothing about a message that makes no claim at all', async () => {
    expect(await reconcileTeamMessageClaims('Starting on the research now.', workspace)).toEqual([]);
    expect(await reconcileTeamMessageClaims('', workspace)).toEqual([]);
  });

  it('says nothing when the workspace cannot be read', async () => {
    // A check that fails must never become an accusation.
    expect(await reconcileTeamMessageClaims('I wrote report.md.', path.join(workspace, 'gone'))).toEqual([]);
    expect(await reconcileTeamMessageClaims('I wrote report.md.', '')).toEqual([]);
  });

  it('names every unsupported file in one notice, and nothing when there are none', () => {
    const notice = formatTeamClaimNotice([
      { fileName: 'chart-brief.md', verdict: 'absent' },
      { fileName: 'summary.md', verdict: 'elsewhere', actualPath: 'notes/summary.md' },
    ]);

    expect(notice).toContain('chart-brief.md');
    expect(notice).toContain('summary.md');
    expect(notice).toContain('notes/summary.md');
    expect(formatTeamClaimNotice([])).toBe('');
  });
});
