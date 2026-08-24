/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE RENDERER'S "CAN THIS BE REPAIRED?" MUST AGREE WITH THE HOST'S.
 *
 * The action bar offers an Update button after a changed-file refusal. The host
 * will only honour that for a CHAT deliverable: `refreshChatArtifact` refuses a
 * published series run on purpose, because re-registering one would launder a
 * tampered file into a fresh valid record. An Update button on a series run is
 * therefore a button that ALWAYS fails, which is worse than no button.
 *
 * The renderer cannot see `relativePath` - the summary carries `taskId` - so the
 * predicate is a second expression of the same rule, and a second expression of
 * a rule is a thing that drifts. This file makes drift impossible to ship
 * silently: it builds a REAL chat deliverable and a REAL series deliverable
 * through the production registration paths, asks the REAL
 * `refreshChatArtifact` what it actually does to each, and asserts the
 * renderer's predicate returned the same verdict. Nothing here hand-writes a
 * ledger row or a summary.
 */

// @vitest-environment jsdom

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The predicate lives in the action bar because that is the only place it is
 * used, and importing that module pulls the whole renderer preview stack in.
 * Importing it into a plain `node` environment HANGS - measured, not guessed -
 * so this file uses the same jsdom + stubbed-bridge shape the rail's DOM test
 * already uses. `@/common/types/artifacts` is a different module path and stays
 * REAL, which matters: the host modules under test are the real ones.
 */
vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      open: { invoke: vi.fn() },
      reveal: { invoke: vi.fn() },
      saveCopy: { invoke: vi.fn() },
      refresh: { invoke: vi.fn() },
      series: { invoke: vi.fn() },
      openTarget: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@renderer/hooks/file/usePreviewLauncher', () => ({
  usePreviewLauncher: () => ({ launchPreview: vi.fn(), loading: false }),
}));

vi.mock('@/renderer/hooks/file/usePreviewLauncher', () => ({
  usePreviewLauncher: () => ({ launchPreview: vi.fn(), loading: false }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import {
  listArtifacts,
  refreshChatArtifact,
  type ArtifactHostEffects,
} from '@process/services/artifacts/artifactActions';
import {
  artifactLedgerPath,
  readArtifactLedger,
  readArtifactLedgerEntries,
} from '@process/services/artifacts/artifactLedger';
import { sweepChatRun, clearChatSweepMemo } from '@process/services/artifacts/chatRun';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';
import type { ArtifactSummary } from '@/common/types/artifacts';

import { canRepairArtifact } from '@renderer/pages/conversation/Preview/components/PreviewPanel/ArtifactActionBar';

let root = '';
let workspace = '';
let ledgerPath = '';

function effects(): ArtifactHostEffects {
  return {
    readLedger: () => readArtifactLedger(ledgerPath),
    readLedgerEntries: () => readArtifactLedgerEntries(ledgerPath),
    confine: async (target: string) => target,
    launch: async () => ({ ok: true }),
    reveal: async () => ({ ok: true }),
    chooseSaveDestination: async () => null,
  };
}

beforeEach(async () => {
  clearChatSweepMemo();
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-repair-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

/** A real chat deliverable, written where a turn writes one and swept for real. */
async function publishChatDeliverable(conversationId: string, name: string): Promise<void> {
  const dir = path.join(workspace, 'artifacts', 'chat', conversationId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), '# chat deliverable\n', 'utf8');
  const swept = await sweepChatRun({ conversationId, workspace, ledgerPath, declaredBy: 'Chat' });
  expect(swept.registered.length, 'the sweep must have registered the chat file').toBeGreaterThan(0);
}

/** A real published series run, through begin/commit. */
async function publishSeriesRun(series: string, name: string): Promise<void> {
  const handle = await beginTaskRun({ workspace, taskId: 'cron_repair_test', series, now: new Date() });
  await fs.writeFile(path.join(handle.stagingDir, name), '# series deliverable\n', 'utf8');
  await commitTaskRun(handle, { ledgerPath, declaredBy: 'Repair Test', now: new Date() });
}

/** What the host ACTUALLY does, not what we believe it does. */
async function hostWouldRepair(summary: ArtifactSummary): Promise<boolean> {
  const result = await refreshChatArtifact(summary.artifactId, effects(), ledgerPath);
  if (result.ok) return true;
  // The one refusal that means "not eligible" as opposed to "eligible but the
  // bytes are bad". Any other refusal here would be a different bug and must
  // not be silently read as ineligibility.
  expect(result.error, `unexpected refusal: ${result.error}`).toBe('only a chat deliverable can be refreshed');
  return false;
}

describe('canRepairArtifact', () => {
  it('agrees with the host on a real CHAT deliverable (the known positive)', async () => {
    await publishChatDeliverable('conv-abc', 'notes.md');
    const listing = await listArtifacts(effects());
    const summary = listing.artifacts.find((entry) => entry.fileName === 'notes.md');
    expect(summary, 'the chat deliverable must be listed').toBeDefined();

    expect(await hostWouldRepair(summary!)).toBe(true);
    expect(canRepairArtifact(summary!)).toBe(true);
  });

  it('agrees with the host on a real published SERIES run - no always-failing Update', async () => {
    await publishSeriesRun('morning', 'brief.html');
    const listing = await listArtifacts(effects());
    const summary = listing.artifacts.find((entry) => entry.fileName === 'brief.html');
    expect(summary, 'the series deliverable must be listed').toBeDefined();

    expect(await hostWouldRepair(summary!)).toBe(false);
    expect(canRepairArtifact(summary!)).toBe(false);
  });

  it('matches the host on BOTH at once, in one ledger', async () => {
    await publishChatDeliverable('conv-xyz', 'draft.md');
    await publishSeriesRun('evening', 'wrap.html');
    const listing = await listArtifacts(effects());
    expect(listing.artifacts.length).toBe(2);

    for (const summary of listing.artifacts) {
      // eslint-disable-next-line no-await-in-loop -- two records, sequential on purpose
      const host = await hostWouldRepair(summary);
      expect(canRepairArtifact(summary), `${summary.fileName} disagreed with the host`).toBe(host);
    }
  });
});
