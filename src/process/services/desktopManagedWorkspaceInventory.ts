/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import type { CronJob } from './cron/CronStore';
import {
  collectManagedWorkspaceInventory,
  type ManagedWorkspaceInventoryReport,
  type WorkspaceAuthorityCompleteness,
  type WorkspaceAuthorityReference,
  type WorkspaceAuthoritySource,
} from './managedWorkspaceInventory';

export const DEFAULT_MANAGED_WORKSPACE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type ActiveWorkspaceProcess = {
  id: string;
  workspace?: string;
};

/**
 * Read-only producers used by the Desktop inventory projection. Keeping this
 * dependency-injected makes the authority joins independently testable and
 * prevents the classifier from acquiring mutation capabilities.
 */
export type DesktopManagedWorkspaceAuthoritySources = {
  listConversations: () => Promise<TChatConversation[]>;
  listProjects: () => Promise<IProject[]>;
  listSchedules: () => Promise<CronJob[]>;
  listActiveProcesses: () => ActiveWorkspaceProcess[] | Promise<ActiveWorkspaceProcess[]>;
};

export type CollectDesktopManagedWorkspaceInventoryInput = {
  workDir: string;
  sources: DesktopManagedWorkspaceAuthoritySources;
  retentionWindowMs?: number;
  nowMs?: number;
};

type AuthorityLoad<T> = { state: 'complete'; value: T } | { state: 'error'; value: T; error: string };

function workspaceOf(conversation: TChatConversation | undefined): string | undefined {
  const workspace = (conversation?.extra as { workspace?: unknown } | undefined)?.workspace;
  return typeof workspace === 'string' && workspace.trim() ? workspace.trim() : undefined;
}

async function loadAuthority<T>(
  source: WorkspaceAuthoritySource,
  load: () => T | Promise<T>
): Promise<AuthorityLoad<T>> {
  try {
    return { state: 'complete', value: await load() };
  } catch (error) {
    return {
      state: 'error',
      value: [] as T,
      error: `${source} authority failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Join Desktop's current workspace authorities and project them through the
 * fail-closed filesystem classifier.
 *
 * Artifact and receipt authority is deliberately `unavailable`: Desktop does
 * not yet have a canonical ledger that proves every generated output/receipt
 * and its owning workspace. Filesystem contents still preserve non-empty
 * directories, but no production directory can become quarantine-eligible
 * until both ledgers exist and report complete inventories.
 */
export async function collectDesktopManagedWorkspaceInventory(
  input: CollectDesktopManagedWorkspaceInventoryInput
): Promise<ManagedWorkspaceInventoryReport> {
  const [conversationLoad, projectLoad, scheduleLoad, processLoad] = await Promise.all([
    loadAuthority('conversation', input.sources.listConversations),
    loadAuthority('project', input.sources.listProjects),
    loadAuthority('schedule', input.sources.listSchedules),
    loadAuthority('active-process', input.sources.listActiveProcesses),
  ]);

  const authorityCompleteness: WorkspaceAuthorityCompleteness = {
    conversation: conversationLoad.state,
    project: projectLoad.state,
    schedule: scheduleLoad.state,
    artifact: 'unavailable',
    receipt: 'unavailable',
    'active-process': processLoad.state,
  };
  const references: WorkspaceAuthorityReference[] = [];
  const conversationsById = new Map<string, TChatConversation>();

  for (const conversation of conversationLoad.value) {
    conversationsById.set(conversation.id, conversation);
    const workspace = workspaceOf(conversation);
    if (!workspace) continue;
    references.push({
      source: 'conversation',
      id: conversation.id,
      workspace,
      userPromoted: (conversation.extra as { customWorkspace?: unknown } | undefined)?.customWorkspace === true,
    });
  }

  for (const project of projectLoad.value) {
    if (!project.workspace?.trim()) continue;
    references.push({
      source: 'project',
      id: project.id,
      workspace: project.workspace.trim(),
      // A Project is an explicitly persistent user container, regardless of
      // whether Desktop allocated its default directory or the user chose one.
      userPromoted: true,
    });
  }

  for (const schedule of scheduleLoad.value) {
    const workspace =
      schedule.metadata.agentConfig?.workspace?.trim() ||
      workspaceOf(conversationsById.get(schedule.metadata.conversationId));
    if (!workspace) {
      authorityCompleteness.schedule = 'error';
      continue;
    }
    references.push({ source: 'schedule', id: schedule.id, workspace });
  }

  for (const process of processLoad.value) {
    const workspace = process.workspace?.trim() || workspaceOf(conversationsById.get(process.id));
    if (!workspace) {
      authorityCompleteness['active-process'] = 'error';
      continue;
    }
    references.push({ source: 'active-process', id: process.id, workspace });
  }

  return collectManagedWorkspaceInventory({
    workDir: input.workDir,
    references,
    authorityCompleteness,
    retentionWindowMs: input.retentionWindowMs ?? DEFAULT_MANAGED_WORKSPACE_RETENTION_MS,
    nowMs: input.nowMs,
  });
}
