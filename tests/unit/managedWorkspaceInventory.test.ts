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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 6, 16, 0, 0, 0);

const COMPLETE_AUTHORITIES: WorkspaceAuthorityCompleteness = {
  conversation: 'complete',
  project: 'complete',
  schedule: 'complete',
  artifact: 'complete',
  receipt: 'complete',
  'active-process': 'complete',
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
      nowMs: NOW,
      ...overrides,
    });
  }

  it('reports an old empty direct child as a review candidate without mutating it', async () => {
    const candidate = await makeCandidate();
    const report = await collect();

    expect(report).toMatchObject({
      complete: true,
      summary: { discovered: 1, preserved: 0, reviewCandidate: 1, unknown: 0 },
    });
    expect(report.entries[0]).toMatchObject({
      canonicalPath: await fs.realpath(candidate),
      decision: { disposition: 'review-candidate', classifications: ['empty-abandoned'] },
    });
    await expect(fs.stat(candidate)).resolves.toBeTruthy();
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

  it('captures a canonical directory from Wayland’s CLI-safe work-root alias', async () => {
    const candidate = await makeCandidate();
    const alias = `${root}-alias`;
    await fs.symlink(root, alias, 'dir');
    try {
      const report = await collectManagedWorkspaceInventory({
        workDir: alias,
        references: [],
        authorityCompleteness: COMPLETE_AUTHORITIES,
        retentionWindowMs: 30 * DAY,
        nowMs: NOW,
      });
      expect(report).toMatchObject({
        root: path.resolve(alias),
        canonicalRoot: await fs.realpath(root),
        complete: true,
        summary: { discovered: 1, reviewCandidate: 1 },
      });
      expect(report.entries[0].canonicalPath).toBe(await fs.realpath(candidate));
    } finally {
      await fs.unlink(alias);
    }
  });
});
