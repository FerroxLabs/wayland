/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseManagedWorkspaceInventoryReport } from '@/common/types/managedWorkspaceRetention';
import {
  collectDesktopManagedWorkspaceInventory,
  type DesktopManagedWorkspaceAuthoritySources,
} from '@/process/services/desktopManagedWorkspaceInventory';
import type { ArtifactRecord } from '@/process/services/artifacts/artifactLedger';

/**
 * P2-7, second half: the ledger has to be WIRED, or it is a write-only file.
 *
 * `desktopManagedWorkspaceInventory` shipped with
 * `artifact: 'unavailable'` and the standing note "Desktop does not yet have a
 * canonical ledger that proves every generated output and its owning
 * workspace". No collector ever emitted an `artifact` reference, so
 * `observedArtifactCount` was always 0, `artifactCount` was always null, and
 * `classifyManagedWorkspaceRetention` could not reach its `artifact-bearing`
 * branch on any workspace in the product. A whole retention classification was
 * unreachable code.
 *
 * A trap sits under this change, which is why the count and the references
 * move together: `parseManagedWorkspaceInventoryReport` requires
 * `evidence.artifactCount` to equal the number of artifact+receipt references
 * EXACTLY, and `workspaceRetentionBridge` throws on a null parse. Emitting one
 * without the other would not degrade Settings -> Storage, it would break it.
 */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 20, 0, 0, 0);
const INSTALLATION_ID = 'artifact-ledger-wiring';

function record(workspace: string, overrides: Partial<ArtifactRecord> = {}): ArtifactRecord {
  return {
    version: 1,
    artifactId: 'a'.repeat(32),
    taskId: 'weekday-morning-report',
    runId: 'r-1',
    workspace,
    relativePath: 'artifacts/market/2026-08-20/r-1/brief.html',
    sizeBytes: 14,
    sha256: 'f'.repeat(64),
    declaredBy: 'wayland-morning-report',
    runAt: new Date(NOW).toISOString(),
    state: 'published',
    ...overrides,
  };
}

describe('the artifact ledger reaches the retention classifier', () => {
  let root: string;
  let candidate: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-artifact-inventory-'));
    candidate = path.join(root, 'wcore-temp-1736900000000');
    await fs.mkdir(candidate);
    const stale = new Date(NOW - 31 * DAY);
    await fs.utimes(candidate, stale, stale);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  function sources(
    overrides: Partial<DesktopManagedWorkspaceAuthoritySources> = {}
  ): DesktopManagedWorkspaceAuthoritySources {
    return {
      listConversations: vi.fn(async () => []),
      listProjects: vi.fn(async () => []),
      listSchedules: vi.fn(async () => []),
      listActiveProcesses: vi.fn(() => []),
      loadProvenance: vi.fn(async () => ({
        state: 'unavailable' as const,
        records: [] as [],
        errors: ['workspace provenance ledger is absent'],
      })),
      ...overrides,
    };
  }

  it('classifies a workspace holding a declared artifact as artifact-bearing', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({ listArtifacts: async () => [record(candidate)] }),
    });

    expect(report.authorityCompleteness.artifact).toBe('complete');
    expect(report.entries[0].evidence.artifactCount).toBe(1);
    expect(report.entries[0].decision.classifications).toContain('artifact-bearing');
    expect(report.entries[0].decision.disposition).toBe('preserve');
    expect(report.entries[0].references).toEqual([{ source: 'artifact', id: 'a'.repeat(32) }]);
  });

  it('produces a report that still parses - count and references move together', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({ listArtifacts: async () => [record(candidate)] }),
    });

    // parseManagedWorkspaceInventoryReport cross-checks evidence.artifactCount
    // against the artifact+receipt reference count, and the bridge throws on a
    // null parse. This assertion IS the Settings -> Storage regression guard.
    expect(parseManagedWorkspaceInventoryReport(report)).not.toBeNull();
  });

  it('counts many artifacts in one workspace once each, and ignores other workspaces', async () => {
    const other = path.join(root, 'wcore-temp-1736900000001');
    await fs.mkdir(other);

    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({
        listArtifacts: async () => [
          record(candidate, { artifactId: 'a'.repeat(32) }),
          record(candidate, { artifactId: 'b'.repeat(32), relativePath: 'artifacts/market/2026-08-19/r-0/brief.html' }),
          record(other, { artifactId: 'c'.repeat(32) }),
        ],
      }),
    });

    // Keyed by basename: the inventory reports realpath-canonicalized paths,
    // and on macOS the OS temp dir is a symlink (/var -> /private/var).
    const byName = new Map(report.entries.map((entry) => [path.basename(entry.path), entry]));
    expect(byName.get(path.basename(candidate))?.evidence.artifactCount).toBe(2);
    expect(byName.get(path.basename(other))?.evidence.artifactCount).toBe(1);
    expect(parseManagedWorkspaceInventoryReport(report)).not.toBeNull();
  });

  it('reports error authority - never a silent zero - when the ledger cannot be read', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({
        listArtifacts: async () => {
          throw new Error('ledger is unreadable');
        },
      }),
    });

    expect(report.authorityCompleteness.artifact).toBe('error');
    expect(report.entries[0].evidence.artifactCount).toBeNull();
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('rejects a malformed record rather than trusting it', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({
        listArtifacts: async () => [record(candidate, { workspace: 42 as unknown as string })],
      }),
    });

    expect(report.authorityCompleteness.artifact).toBe('error');
    expect(report.entries[0].evidence.artifactCount).toBeNull();
  });

  it('leaves authority unavailable when no ledger producer is supplied at all', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources(),
    });

    expect(report.authorityCompleteness.artifact).toBe('unavailable');
    expect(report.entries[0].evidence.artifactCount).toBeNull();
  });
});
