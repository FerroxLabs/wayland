/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import type { CronJob } from '@/process/services/cron/CronStore';
import {
  DEFAULT_MANAGED_WORKSPACE_RETENTION_MS,
  collectDesktopManagedWorkspaceInventory,
  type DesktopManagedWorkspaceAuthoritySources,
} from '@/process/services/desktopManagedWorkspaceInventory';
import {
  DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS,
  retentionWindowMsFor,
} from '@/common/types/workspaceRetentionSettings';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 6, 16, 0, 0, 0);
const INSTALLATION_ID = 'desktop-test-installation';

function conversation(id: string, workspace: string, customWorkspace = false): TChatConversation {
  return {
    id,
    name: id,
    createTime: NOW,
    modifyTime: NOW,
    type: 'acp',
    extra: { backend: 'claude', workspace, customWorkspace },
    model: {} as TChatConversation['model'],
  } as TChatConversation;
}

function project(id: string, workspace: string): IProject {
  return {
    id,
    name: id,
    workspace,
    pinned: false,
    createTime: NOW,
    modifyTime: NOW,
  };
}

function schedule(id: string, conversationId: string, workspace?: string): CronJob {
  return {
    id,
    name: id,
    enabled: true,
    schedule: { kind: 'every', everyMs: DAY, description: 'daily' },
    target: { payload: { kind: 'message', text: 'run' } },
    metadata: {
      conversationId,
      agentType: 'claude',
      createdBy: 'user',
      createdAt: NOW,
      updatedAt: NOW,
      agentConfig: workspace ? { backend: 'claude', name: 'Claude', workspace } : undefined,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };
}

describe('collectDesktopManagedWorkspaceInventory', () => {
  let root: string;
  let candidate: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-desktop-authorities-'));
    candidate = path.join(root, 'claude-temp-1736900000000');
    await fs.mkdir(candidate);
    const timestamp = new Date(NOW - 31 * DAY);
    await fs.utimes(candidate, timestamp, timestamp);
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

  it('joins conversations, Projects, schedules, and active processes by canonical workspace', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({
        listConversations: async () => [conversation('chat-1', candidate, true)],
        listProjects: async () => [project('project-1', candidate)],
        // No explicit job workspace: prove the conversation fallback join.
        listSchedules: async () => [schedule('schedule-1', 'chat-1')],
        listActiveProcesses: () => [{ id: 'chat-1', workspace: candidate }],
      }),
    });

    expect(report.authorityCompleteness).toEqual({
      conversation: 'complete',
      project: 'complete',
      schedule: 'complete',
      artifact: 'unavailable',
      receipt: 'unavailable',
      'active-process': 'complete',
      provenance: 'unavailable',
      snapshot: 'unavailable',
    });
    expect(report.complete).toBe(false);
    expect(report.entries[0]).toMatchObject({
      decision: {
        disposition: 'preserve',
        classifications: ['referenced', 'scheduled', 'active', 'user-promoted'],
      },
    });
    expect(report.entries[0].references).toEqual([
      { source: 'active-process', id: 'chat-1' },
      { source: 'conversation', id: 'chat-1' },
      { source: 'project', id: 'project-1' },
      { source: 'schedule', id: 'schedule-1' },
    ]);
  });

  it('never calls an old empty shell eligible while artifact and receipt ledgers are unavailable', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources(),
    });

    expect(report.summary).toEqual({ discovered: 1, preserved: 1, reviewCandidate: 0, unknown: 1 });
    expect(report.entries[0].decision.disposition).toBe('preserve');
    await expect(fs.stat(candidate)).resolves.toBeTruthy();
  });

  it('defaults the review window to the locked 60-day choice', async () => {
    expect(DEFAULT_MANAGED_WORKSPACE_RETENTION_MS).toBe(retentionWindowMsFor(DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS));
    expect(DEFAULT_MANAGED_WORKSPACE_RETENTION_MS).toBe(60 * DAY);

    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources(),
    });
    expect(report.entries[0].evidence.retentionWindowMs).toBe(60 * DAY);
  });

  it('carries the configured review window into the evidence the classifier reads', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      retentionWindowMs: retentionWindowMsFor('never'),
      sources: sources(),
    });
    expect(report.entries[0].evidence.retentionWindowMs).toBe(Number.MAX_SAFE_INTEGER);
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('fails closed and reports the exact authority when a producer throws', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({
        listSchedules: async () => {
          throw new Error('database locked');
        },
      }),
    });

    expect(report.authorityCompleteness.schedule).toBe('error');
    expect(report.complete).toBe(false);
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('fails closed when a producer returns a malformed non-array payload', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({
        listProjects: vi.fn(async () => ({ forged: 'project' })) as unknown as () => Promise<IProject[]>,
      }),
    });

    expect(report.authorityCompleteness.project).toBe('error');
    expect(report.complete).toBe(false);
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('fails closed when a producer returns a malformed record', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({ listSchedules: async () => [{} as CronJob] }),
    });

    expect(report.authorityCompleteness.schedule).toBe('error');
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('fails closed when a conversation forges promotion authority', async () => {
    const forged = conversation('chat-1', candidate) as TChatConversation & {
      extra: { workspace: string; customWorkspace: unknown };
    };
    forged.extra.customWorkspace = 'yes';
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({ listConversations: async () => [forged] }),
    });

    expect(report.authorityCompleteness.conversation).toBe('error');
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('marks schedule authority erroneous when a persisted job has no resolvable workspace', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({ listSchedules: async () => [schedule('schedule-1', 'missing-chat')] }),
    });

    expect(report.authorityCompleteness.schedule).toBe('error');
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });

  it('marks live-process authority erroneous when an active process has no resolvable workspace', async () => {
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: root,
      installationId: INSTALLATION_ID,
      nowMs: NOW,
      sources: sources({ listActiveProcesses: () => [{ id: 'orphan-process' }] }),
    });

    expect(report.authorityCompleteness['active-process']).toBe('error');
    expect(report.entries[0].decision.disposition).toBe('preserve');
  });
});
