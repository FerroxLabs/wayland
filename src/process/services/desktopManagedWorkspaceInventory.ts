/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import type { CronJob } from './cron/CronStore';
import type { ArtifactRecord } from './artifacts/artifactLedger';
import type { ManagedWorkspaceProvenanceLoad } from './managedWorkspaceProvenance';
import {
  DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS,
  retentionWindowMsFor,
} from '@/common/types/workspaceRetentionSettings';
import {
  collectManagedWorkspaceInventory,
  type ManagedWorkspaceInventoryReport,
  type WorkspaceAuthorityCompleteness,
  type WorkspaceAuthorityReference,
  type WorkspaceAuthoritySource,
} from './managedWorkspaceInventory';

/**
 * The tier-2 review window used when no caller supplies one. Derived from the
 * single shared setting so there is exactly one default in the tree.
 */
export const DEFAULT_MANAGED_WORKSPACE_RETENTION_MS = retentionWindowMsFor(DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS);

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
  loadProvenance: () => Promise<ManagedWorkspaceProvenanceLoad>;
  /**
   * The artifact ledger (P2-7). OPTIONAL on purpose: a caller that has not
   * wired one keeps the previous `artifact: 'unavailable'` posture rather than
   * silently reporting a zero it cannot prove.
   */
  listArtifacts?: () => ArtifactRecord[] | Promise<ArtifactRecord[]>;
};

export type CollectDesktopManagedWorkspaceInventoryInput = {
  workDir: string;
  installationId: string;
  sources: DesktopManagedWorkspaceAuthoritySources;
  retentionWindowMs?: number;
  nowMs?: number;
};

type AuthorityLoad<T> =
  | { state: 'complete'; value: T[] }
  | { state: 'error'; value: T[]; error: string }
  | { state: 'unavailable'; value: T[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function workspaceOf(conversation: TChatConversation | undefined): string | undefined {
  const workspace = (conversation?.extra as { workspace?: unknown } | undefined)?.workspace;
  return typeof workspace === 'string' && workspace.trim() ? workspace.trim() : undefined;
}

async function loadAuthority<T>(
  source: WorkspaceAuthoritySource,
  load: () => T[] | Promise<T[]>
): Promise<AuthorityLoad<T>> {
  try {
    const value = await load();
    if (!Array.isArray(value)) throw new Error('producer returned a non-array result');
    return { state: 'complete', value };
  } catch (error) {
    return {
      state: 'error',
      value: [],
      error: `${source} authority failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Join Desktop's current workspace authorities and project them through the
 * fail-closed filesystem classifier.
 *
 * Artifact authority comes from the artifact ledger when the caller wires one
 * (`sources.listArtifacts`); without it the previous `unavailable` posture is
 * kept, because a producer that does not exist cannot prove a zero.
 *
 * Receipt authority remains `unavailable`: Desktop has no canonical ledger of
 * generated receipts. Filesystem contents still preserve non-empty
 * directories, and no production directory can become a review candidate until
 * that ledger exists too.
 */
export async function collectDesktopManagedWorkspaceInventory(
  input: CollectDesktopManagedWorkspaceInventoryInput
): Promise<ManagedWorkspaceInventoryReport> {
  const listArtifacts = input.sources.listArtifacts;
  const [conversationLoad, projectLoad, scheduleLoad, processLoad, artifactLoad, provenanceLoad] = await Promise.all([
    loadAuthority('conversation', input.sources.listConversations),
    loadAuthority('project', input.sources.listProjects),
    loadAuthority('schedule', input.sources.listSchedules),
    loadAuthority('active-process', input.sources.listActiveProcesses),
    listArtifacts
      ? loadAuthority('artifact', listArtifacts)
      : Promise.resolve<AuthorityLoad<ArtifactRecord>>({ state: 'unavailable', value: [] }),
    input.sources.loadProvenance().catch(
      (error): ManagedWorkspaceProvenanceLoad => ({
        state: 'error',
        records: [],
        errors: [`provenance authority failed: ${error instanceof Error ? error.message : String(error)}`],
      })
    ),
  ]);

  const authorityCompleteness: WorkspaceAuthorityCompleteness = {
    conversation: conversationLoad.state,
    project: projectLoad.state,
    schedule: scheduleLoad.state,
    artifact: artifactLoad.state,
    receipt: 'unavailable',
    'active-process': processLoad.state,
    provenance: provenanceLoad.state,
    snapshot: 'unavailable',
  };
  const references: WorkspaceAuthorityReference[] = [];
  const conversationsById = new Map<string, TChatConversation>();

  for (const conversation of conversationLoad.value) {
    if (!isRecord(conversation) || typeof conversation.id !== 'string' || !conversation.id.trim()) {
      authorityCompleteness.conversation = 'error';
      continue;
    }
    conversationsById.set(conversation.id, conversation);
    const workspace = workspaceOf(conversation);
    if (!workspace) continue;
    const customWorkspace = (conversation.extra as { customWorkspace?: unknown } | undefined)?.customWorkspace;
    if (customWorkspace !== undefined && typeof customWorkspace !== 'boolean') {
      authorityCompleteness.conversation = 'error';
      continue;
    }
    references.push({
      source: 'conversation',
      id: conversation.id,
      workspace,
      userPromoted: customWorkspace === true,
    });
  }

  for (const project of projectLoad.value) {
    if (!isRecord(project) || typeof project.id !== 'string' || !project.id.trim()) {
      authorityCompleteness.project = 'error';
      continue;
    }
    if (typeof project.workspace !== 'string' || !project.workspace.trim()) {
      authorityCompleteness.project = 'error';
      continue;
    }
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
    if (
      !isRecord(schedule) ||
      typeof schedule.id !== 'string' ||
      !schedule.id.trim() ||
      !isRecord(schedule.metadata) ||
      typeof schedule.metadata.conversationId !== 'string'
    ) {
      authorityCompleteness.schedule = 'error';
      continue;
    }
    if (
      isRecord(schedule.metadata.agentConfig) &&
      schedule.metadata.agentConfig.workspace !== undefined &&
      typeof schedule.metadata.agentConfig.workspace !== 'string'
    ) {
      authorityCompleteness.schedule = 'error';
      continue;
    }
    const workspace =
      (isRecord(schedule.metadata.agentConfig) && typeof schedule.metadata.agentConfig.workspace === 'string'
        ? schedule.metadata.agentConfig.workspace.trim()
        : '') || workspaceOf(conversationsById.get(schedule.metadata.conversationId));
    if (!workspace) {
      authorityCompleteness.schedule = 'error';
      continue;
    }
    references.push({ source: 'schedule', id: schedule.id, workspace });
  }

  // An artifact record is produced by `registerArtifacts`, which has already
  // verified the claim against the filesystem. Re-validate the SHAPE anyway:
  // this collector reads a file on disk that a future writer, a partial
  // upgrade, or a user with a text editor could leave malformed, and a
  // malformed record must degrade authority to `error` rather than silently
  // vanish into a zero the classifier would read as "no artifacts".
  for (const artifact of artifactLoad.value) {
    if (
      !isRecord(artifact) ||
      typeof artifact.artifactId !== 'string' ||
      !artifact.artifactId.trim() ||
      typeof artifact.workspace !== 'string' ||
      !artifact.workspace.trim()
    ) {
      authorityCompleteness.artifact = 'error';
      continue;
    }
    references.push({ source: 'artifact', id: artifact.artifactId.trim(), workspace: artifact.workspace.trim() });
  }

  for (const process of processLoad.value) {
    if (!isRecord(process) || typeof process.id !== 'string' || !process.id.trim()) {
      authorityCompleteness['active-process'] = 'error';
      continue;
    }
    if (process.workspace !== undefined && typeof process.workspace !== 'string') {
      authorityCompleteness['active-process'] = 'error';
      continue;
    }
    const workspace =
      (typeof process.workspace === 'string' ? process.workspace.trim() : '') ||
      workspaceOf(conversationsById.get(process.id));
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
    installationId: input.installationId,
    provenanceRecords: provenanceLoad.records,
    retentionWindowMs: input.retentionWindowMs ?? DEFAULT_MANAGED_WORKSPACE_RETENTION_MS,
    nowMs: input.nowMs,
  });
}
