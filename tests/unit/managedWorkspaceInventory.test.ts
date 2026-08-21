/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  collectManagedWorkspaceInventory,
  type WorkspaceAuthorityCompleteness,
  type WorkspaceAuthorityReference,
} from '@/process/services/managedWorkspaceInventory';
import { parseManagedWorkspaceInventoryReport } from '@/common/types/managedWorkspaceRetention';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 6, 16, 0, 0, 0);
const INSTALLATION_ID = 'desktop-test-installation';

const COMPLETE_AUTHORITIES: WorkspaceAuthorityCompleteness = {
  conversation: 'complete',
  project: 'complete',
  schedule: 'complete',
  artifact: 'complete',
  receipt: 'complete',
  'active-process': 'complete',
  provenance: 'unavailable',
  snapshot: 'unavailable',
};

describe('collectManagedWorkspaceInventory', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-workspace-inventory-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(root, { recursive: true, force: true });
  });

  async function makeCandidate(name = 'wcore-temp-1736900000000', ageDays = 31): Promise<string> {
    const candidate = path.join(root, name);
    await fs.mkdir(candidate);
    const timestamp = new Date(NOW - ageDays * DAY);
    await fs.utimes(candidate, timestamp, timestamp);
    return candidate;
  }

  async function collect(references: WorkspaceAuthorityReference[] = [], overrides = {}) {
    return collectManagedWorkspaceInventory({
      workDir: root,
      references,
      authorityCompleteness: COMPLETE_AUTHORITIES,
      retentionWindowMs: 30 * DAY,
      installationId: INSTALLATION_ID,
      provenanceRecords: [],
      nowMs: NOW,
      ...overrides,
    });
  }

  it('preserves an old empty direct child until an immutable snapshot authority exists', async () => {
    const candidate = await makeCandidate();
    const report = await collect();

    expect(report).toMatchObject({
      complete: false,
      summary: { discovered: 1, preserved: 1, reviewCandidate: 0, unknown: 1 },
    });
    expect(report.entries[0]).toMatchObject({
      canonicalPath: await fs.realpath(candidate),
      decision: { disposition: 'preserve', classifications: ['unknown'] },
    });
    await expect(fs.stat(candidate)).resolves.toBeTruthy();
  });

  it('does not treat a matching filename as process-owned workspace provenance', async () => {
    const foreignWorkspace = await makeCandidate('client-temp-1736900000000');

    const report = await collect();

    expect(report.entries[0]).toMatchObject({
      canonicalPath: await fs.realpath(foreignWorkspace),
      evidence: { managedProvenance: false },
      decision: { disposition: 'preserve', classifications: ['unknown'] },
    });
  });

  it('accepts provenance only when installation, root, path, device, and inode all match', async () => {
    const candidate = await makeCandidate();
    const stat = await fs.lstat(candidate);
    const canonicalRoot = await fs.realpath(root);
    const canonicalPath = await fs.realpath(candidate);
    const report = await collect([], {
      authorityCompleteness: { ...COMPLETE_AUTHORITIES, provenance: 'complete' },
      provenanceRecords: [
        {
          schemaVersion: 1,
          workspaceId: '0d8ac3d5-3e33-4d40-a236-47b4526ef475',
          installationId: INSTALLATION_ID,
          canonicalRoot,
          canonicalPath,
          device: stat.dev,
          inode: stat.ino,
          createdAtMs: NOW - 31 * DAY,
        },
      ],
    });

    expect(report.entries[0].evidence.managedProvenance).toBe(true);
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('canonicalizes aliases and preserves every referenced authority', async () => {
    const candidate = await makeCandidate();
    const alias = path.join(root, 'candidate-alias');
    await fs.symlink(candidate, alias, 'dir');
    const references: WorkspaceAuthorityReference[] = [
      { source: 'conversation', id: 'chat-1', workspace: alias },
      { source: 'project', id: 'project-1', workspace: candidate, userPromoted: true },
      { source: 'schedule', id: 'cron-1', workspace: candidate },
      { source: 'artifact', id: 'report-1', workspace: candidate },
      { source: 'receipt', id: 'receipt-1', workspace: candidate },
      { source: 'active-process', id: 'run-1', workspace: candidate },
    ];

    const report = await collect(references);
    const entry = report.entries[0];
    expect(entry.decision.disposition).toBe('preserve');
    expect(entry.decision.classifications).toEqual([
      'referenced',
      'scheduled',
      'active',
      'artifact-bearing',
      'user-promoted',
    ]);
    expect(entry.references).toHaveLength(6);
  });

  it('counts a schedule reference as explicit user promotion', async () => {
    const candidate = await makeCandidate();
    const report = await collect([{ source: 'schedule', id: 'cron-1', workspace: candidate }]);

    // P2-11: scheduling a workspace IS promoting it. Without this the only
    // evidence of the user's choice is the schedule row, and a deleter would
    // read the workspace as unreferenced.
    expect(report.entries[0].evidence.userPromoted).toBe(true);
    expect(report.entries[0].decision).toMatchObject({
      disposition: 'preserve',
      classifications: ['scheduled', 'user-promoted'],
    });
  });

  it('keeps a schedule-only workspace promoted at any age', async () => {
    const candidate = await makeCandidate('wcore-temp-1736900000003', 4000);
    const report = await collect([{ source: 'schedule', id: 'cron-1', workspace: candidate }], {
      retentionWindowMs: 0,
    });

    expect(report.entries[0].evidence.userPromoted).toBe(true);
    expect(report.entries[0].decision.disposition).toBe('preserve');
    expect(report.entries[0].decision.classifications).not.toContain('empty-abandoned');
  });

  it('preserves content-bearing workspaces even when no authority references them', async () => {
    const candidate = await makeCandidate();
    await fs.writeFile(path.join(candidate, 'report.md'), '# user report');

    const report = await collect();
    expect(report.entries[0]).toMatchObject({
      evidence: { userContent: 'present', modified: true },
      decision: { disposition: 'preserve', classifications: ['modified'] },
    });
  });

  it('preserves a fresh empty shell until the retention window elapses', async () => {
    await makeCandidate('gemini-temp-1736900000001', 2);
    const report = await collect();
    expect(report.entries[0].decision).toMatchObject({ disposition: 'preserve', classifications: ['unknown'] });
  });

  it('fails closed for an incomplete authority source', async () => {
    await makeCandidate();
    const report = await collect([], {
      authorityCompleteness: { ...COMPLETE_AUTHORITIES, schedule: 'unavailable' },
    });
    expect(report.complete).toBe(false);
    expect(report.entries[0]).toMatchObject({
      evidence: { inventoryComplete: false, scheduleCount: null },
      decision: { disposition: 'preserve', classifications: ['unknown'] },
    });
  });

  it('fails closed for a missing or extra authority key', async () => {
    await makeCandidate();
    const report = await collect([], {
      authorityCompleteness: {
        conversation: 'complete',
        project: 'complete',
        schedule: 'complete',
        artifact: 'complete',
        receipt: 'complete',
        unexpected: 'complete',
      } as unknown as WorkspaceAuthorityCompleteness,
    });

    expect(report.complete).toBe(false);
    expect(report.entries[0]).toMatchObject({
      evidence: { inventoryComplete: false },
      decision: { disposition: 'preserve', classifications: ['unknown'] },
    });
  });

  it('fails closed when a candidate changes identity during inventory', async () => {
    const candidate = await makeCandidate();
    const realpath = fs.realpath.bind(fs);
    const canonicalCandidate = await realpath(candidate);
    let candidateCalls = 0;
    vi.spyOn(fs, 'realpath').mockImplementation(async (value) => {
      if (String(value) === canonicalCandidate && ++candidateCalls === 2) {
        return path.join(root, 'swapped-temp-1736900000009');
      }
      return realpath(value);
    });

    const report = await collect();

    expect(report.complete).toBe(false);
    expect(report.entries[0]).toMatchObject({
      decision: { disposition: 'preserve', classifications: ['unknown'] },
      errors: ['candidate changed during inventory'],
    });
    await expect(fs.stat(candidate)).resolves.toBeTruthy();
  });

  it('does not publish empty-shell evidence when content appears after the final stat check', async () => {
    const candidate = await makeCandidate();
    const canonicalCandidate = await fs.realpath(candidate);
    const lstat = fs.lstat.bind(fs);
    let candidateStats = 0;
    vi.spyOn(fs, 'lstat').mockImplementation(async (value, options) => {
      const result = await lstat(value, options as never);
      if (String(value) === canonicalCandidate && ++candidateStats === 2) {
        await fs.writeFile(path.join(canonicalCandidate, 'arrived-during-classification.md'), '# must be preserved');
      }
      return result;
    });

    const report = await collect();

    await expect(
      fs.readFile(path.join(canonicalCandidate, 'arrived-during-classification.md'), 'utf8')
    ).resolves.toContain('must be preserved');
    expect(report.complete).toBe(false);
    expect(report.entries[0].decision).toMatchObject({
      disposition: 'preserve',
      classifications: ['unknown'],
    });
  });

  it('fails closed rather than throwing for an invalid date-range timestamp', async () => {
    await makeCandidate();
    const report = await collect([], { nowMs: Number.MAX_SAFE_INTEGER });
    expect(report.generatedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(report.complete).toBe(false);
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('fails closed when a declared reference cannot be canonicalized', async () => {
    await makeCandidate();
    const report = await collect([{ source: 'conversation', id: 'missing', workspace: path.join(root, 'missing') }]);
    expect(report.complete).toBe(false);
    expect(report.errors[0]).toContain('cannot be canonicalized');
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('fails closed when a reference carries malformed promotion authority', async () => {
    const candidate = await makeCandidate();
    const report = await collect([
      {
        source: 'conversation',
        id: 'chat-1',
        workspace: candidate,
        userPromoted: 'yes' as unknown as boolean,
      },
    ]);

    expect(report.complete).toBe(false);
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('returns a preservation-safe report for malformed runtime input instead of throwing', async () => {
    await expect(collectManagedWorkspaceInventory(null)).resolves.toMatchObject({
      complete: false,
      entries: [],
    });
    await expect(collectManagedWorkspaceInventory([])).resolves.toMatchObject({
      complete: false,
      entries: [],
    });
  });

  it('materializes sparse reference holes and returns a preservation-safe report', async () => {
    const candidate = await makeCandidate();
    const references: WorkspaceAuthorityReference[] = [];
    references.length = 2;
    references[1] = { source: 'conversation', id: 'chat-1', workspace: candidate };

    await expect(collect(references)).resolves.toMatchObject({
      complete: false,
      summary: { discovered: 1, preserved: 1, reviewCandidate: 0 },
      entries: [
        {
          decision: { disposition: 'preserve' },
          references: [{ source: 'conversation', id: 'chat-1' }],
        },
      ],
      errors: expect.arrayContaining(['authority reference is malformed or has no absolute workspace path']),
    });
  });

  it('canonicalizes authority ordering and coalesces exact duplicates deterministically', async () => {
    const candidate = await makeCandidate();
    const first = await collect([
      { source: 'schedule', id: 'schedule-1', workspace: candidate },
      { source: 'conversation', id: 'chat-1', workspace: candidate },
      { source: 'conversation', id: 'chat-1', workspace: candidate },
    ]);
    const second = await collect([
      { source: 'conversation', id: 'chat-1', workspace: candidate },
      { source: 'schedule', id: 'schedule-1', workspace: candidate },
    ]);

    expect(first.entries[0].references).toEqual(second.entries[0].references);
    expect(first.entries[0].references).toEqual([
      { source: 'conversation', id: 'chat-1' },
      { source: 'schedule', id: 'schedule-1' },
    ]);
  });

  it('fails closed for contradictory duplicate authority identities', async () => {
    const candidate = await makeCandidate();
    const other = await makeCandidate('gemini-temp-1736900000009');
    const report = await collect([
      { source: 'conversation', id: 'chat-1', workspace: candidate },
      { source: 'conversation', id: 'chat-1', workspace: other },
    ]);

    expect(report.complete).toBe(false);
    expect(report.errors).toContain('authority reference conversation:chat-1 is contradictory');
    expect(report.entries.every((entry) => entry.decision.disposition === 'preserve')).toBe(true);
  });

  it('lists but never follows a matching symlink candidate', async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-workspace-outside-'));
    const link = path.join(root, 'wcore-temp-1736900000002');
    try {
      await fs.symlink(outside, link, 'dir');
      const report = await collect();
      expect(report.complete).toBe(false);
      expect(report.entries[0]).toMatchObject({
        canonicalPath: null,
        decision: { disposition: 'preserve', classifications: ['unknown'] },
        errors: ['candidate is a symbolic link'],
      });
    } finally {
      await fs.rm(outside, { recursive: true, force: true });
    }
  });

  it('ignores ordinary user directories that do not match the generated-workspace grammar', async () => {
    await fs.mkdir(path.join(root, 'my-book-project'));
    await fs.mkdir(path.join(root, 'client-temp-2024'));
    const report = await collect();
    expect(report.entries).toEqual([]);
  });

  it('discovers collision-safe managed names that remain inside the shared grammar', async () => {
    const collisionSafe = `wcore-temp-1736900000000${'7'.repeat(39)}`;
    const candidate = await makeCandidate(collisionSafe);
    const report = await collect();

    expect(report.summary.discovered).toBe(1);
    expect(report.entries[0]).toMatchObject({
      path: await fs.realpath(candidate),
      decision: { disposition: 'preserve' },
    });
  });

  it('captures a canonical directory from Wayland’s CLI-safe work-root alias', async () => {
    const candidate = await makeCandidate();
    const alias = `${root}-alias`;
    await fs.symlink(root, alias, 'dir');
    try {
      const report = await collectManagedWorkspaceInventory({
        workDir: alias,
        references: [],
        authorityCompleteness: COMPLETE_AUTHORITIES,
        installationId: INSTALLATION_ID,
        provenanceRecords: [],
        retentionWindowMs: 30 * DAY,
        nowMs: NOW,
      });
      expect(report).toMatchObject({
        root: path.resolve(alias),
        canonicalRoot: await fs.realpath(root),
        complete: false,
        summary: { discovered: 1, preserved: 1, reviewCandidate: 0, unknown: 1 },
      });
      expect(report.entries[0].canonicalPath).toBe(await fs.realpath(candidate));
      expect(parseManagedWorkspaceInventoryReport(report)).not.toBeNull();
    } finally {
      await fs.unlink(alias);
    }
  });
});
