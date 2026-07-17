/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { AuthorityConsistency, AuthorityCoverage, LogicalStateId, StateAuthorityId } from './recoveryManifest';

export type InventoryPathState = 'file' | 'directory' | 'symlink' | 'absent' | 'unreadable';

export type InventoryPathEvidence = {
  path: string;
  /** Authority-owned restore prefix relative to its logical root. */
  authorityRelativePath?: string;
  state: InventoryPathState;
  size: number;
  fileCount: number;
  directoryCount: number;
  symlinkCount: number;
  truncated: boolean;
  errorCode?: string;
};

export type StateAuthorityInventory = {
  id: StateAuthorityId;
  state: 'present' | 'absent' | 'partial' | 'unreadable' | 'symlink-risk' | 'external';
  evidence: InventoryPathEvidence[];
  recommendedCoverage: AuthorityCoverage;
  requiredConsistency: AuthorityConsistency;
  requiredForRestore: boolean;
  sensitive: boolean;
  note: string;
  credentialBinding?: {
    scope: 'same-device';
    backend: 'electron-safe-storage';
    envelope: 'constitution-revision-authority/v3';
  };
};

export type RecoveryInventory = {
  observedAt: string;
  readOnly: true;
  sourceReleaseTrack: 'stable' | 'preview';
  authorities: StateAuthorityInventory[];
  logicalState: Array<{
    id: LogicalStateId;
    authorityIds: StateAuthorityId[];
    state: 'mapped';
    note: string;
  }>;
  externalWorkspaces: Array<{ projectId: string; path: string; state: InventoryPathState }>;
  externalAgentConfigs: Array<{ backendId: string; path: string; state: InventoryPathState }>;
};

export type RecoveryInventoryInputs = {
  userDataRoot: string;
  constitutionRoot: string;
  coreDefaultProfileRoot: string;
  coreNamedProfilesRoot: string;
  externalWorkspaces?: Array<{ projectId: string; path: string }>;
  externalAgentConfigs?: Array<{ backendId: string; path: string }>;
  sourceReleaseTrack?: 'stable' | 'preview';
  maxEntriesPerRoot?: number;
};

type ScanBudget = { remaining: number; truncated: boolean };

function emptyEvidence(candidatePath: string, state: InventoryPathState, errorCode?: string): InventoryPathEvidence {
  return {
    path: candidatePath,
    state,
    size: 0,
    fileCount: 0,
    directoryCount: 0,
    symlinkCount: state === 'symlink' ? 1 : 0,
    truncated: false,
    ...(errorCode ? { errorCode } : {}),
  };
}

async function scanContained(candidatePath: string, budget: ScanBudget): Promise<InventoryPathEvidence> {
  let stat: Awaited<ReturnType<typeof lstat>>;
  try {
    stat = await lstat(candidatePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return emptyEvidence(candidatePath, code === 'ENOENT' ? 'absent' : 'unreadable', code ?? 'UNKNOWN');
  }

  if (stat.isSymbolicLink()) return emptyEvidence(candidatePath, 'symlink');
  if (stat.isFile()) {
    return {
      ...emptyEvidence(candidatePath, 'file'),
      size: stat.size,
      fileCount: 1,
    };
  }
  if (!stat.isDirectory()) return emptyEvidence(candidatePath, 'unreadable', 'UNSUPPORTED_FILE_TYPE');

  const evidence: InventoryPathEvidence = {
    ...emptyEvidence(candidatePath, 'directory'),
    directoryCount: 1,
  };
  let names: string[];
  try {
    names = await readdir(candidatePath);
  } catch (error) {
    return emptyEvidence(candidatePath, 'unreadable', (error as NodeJS.ErrnoException).code ?? 'UNKNOWN');
  }

  for (const name of names) {
    if (budget.remaining <= 0) {
      budget.truncated = true;
      evidence.truncated = true;
      break;
    }
    budget.remaining -= 1;
    const child = await scanContained(path.join(candidatePath, name), budget);
    evidence.size += child.size;
    evidence.fileCount += child.fileCount;
    evidence.directoryCount += child.directoryCount;
    evidence.symlinkCount += child.symlinkCount;
    evidence.truncated ||= child.truncated;
    if (child.state === 'unreadable') {
      evidence.state = 'unreadable';
      evidence.errorCode ??= child.errorCode;
    }
  }
  evidence.truncated ||= budget.truncated;
  return evidence;
}

async function inspectRoot(
  candidatePath: string,
  maxEntries: number,
  recursive = true
): Promise<InventoryPathEvidence> {
  if (recursive) return scanContained(candidatePath, { remaining: maxEntries, truncated: false });
  let stat: Awaited<ReturnType<typeof lstat>>;
  try {
    stat = await lstat(candidatePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return emptyEvidence(candidatePath, code === 'ENOENT' ? 'absent' : 'unreadable', code ?? 'UNKNOWN');
  }
  if (stat.isSymbolicLink()) return emptyEvidence(candidatePath, 'symlink');
  if (stat.isFile()) return { ...emptyEvidence(candidatePath, 'file'), size: stat.size, fileCount: 1 };
  if (stat.isDirectory()) return { ...emptyEvidence(candidatePath, 'directory'), directoryCount: 1 };
  return emptyEvidence(candidatePath, 'unreadable', 'UNSUPPORTED_FILE_TYPE');
}

function summarizeState(evidence: InventoryPathEvidence[]): StateAuthorityInventory['state'] {
  if (evidence.some((entry) => entry.state === 'symlink' || entry.symlinkCount > 0)) return 'symlink-risk';
  if (evidence.some((entry) => entry.state === 'unreadable')) return 'unreadable';
  const present = evidence.filter((entry) => entry.state === 'file' || entry.state === 'directory').length;
  if (present === 0) return 'absent';
  if (present !== evidence.length) return 'partial';
  return 'present';
}

function authority(
  id: StateAuthorityId,
  evidence: InventoryPathEvidence[],
  options: Omit<StateAuthorityInventory, 'id' | 'state' | 'evidence'> & {
    stateOverride?: StateAuthorityInventory['state'];
  }
): StateAuthorityInventory {
  const { stateOverride, ...authorityOptions } = options;
  return { id, state: stateOverride ?? summarizeState(evidence), evidence, ...authorityOptions };
}

/**
 * Inspect every state authority without opening SQLite, reading file contents,
 * resolving symlinks, or changing the filesystem. The result is discovery
 * evidence only: it cannot promote a recovery point to `complete`.
 */
export async function inventoryRecoveryAuthorities(inputs: RecoveryInventoryInputs): Promise<RecoveryInventory> {
  const maxEntries = Math.max(1, inputs.maxEntriesPerRoot ?? 20_000);
  const desktopDataRoot = path.join(inputs.userDataRoot, 'wayland');
  const databaseEvidence = await Promise.all(
    ['wayland.db', 'wayland.db-wal', 'wayland.db-shm'].map((name) =>
      inspectRoot(path.join(desktopDataRoot, name), maxEntries, false)
    )
  );
  const configEvidence = [await inspectRoot(path.join(inputs.userDataRoot, 'config'), maxEntries)];
  const runtimeFileCandidates = [
    'analytics.json',
    'cdp.config.json',
    'flux-connectors.json',
    'flux-connector-backups',
    'nicknames.json',
    'sync-state.json',
    'webhook-audit.log',
    'webhook-audit.log.1',
    'webui-activity.json',
    'webui.config.json',
  ];
  const runtimeEvidence = await Promise.all(
    runtimeFileCandidates.map((name) => inspectRoot(path.join(inputs.userDataRoot, name), maxEntries))
  );
  const constitutionPaths = [
    'CONSTITUTION.md',
    'SOUL.md',
    'specialists',
    '.constitution-keys.enc',
    path.join('archives', 'constitution-history'),
  ];
  const constitutionFilesystemEvidence = await Promise.all(
    constitutionPaths.map(async (relativePath) => ({
      ...(await inspectRoot(path.join(inputs.constitutionRoot, relativePath), maxEntries)),
      authorityRelativePath: relativePath.split(path.sep).join('/'),
    }))
  );
  const revisionAuthorityEvidence = [
    await inspectRoot(path.join(inputs.userDataRoot, 'constitution', 'revision-authority.enc'), maxEntries, false),
  ];
  const revisionMigrationMarkerEvidence = await inspectRoot(
    path.join(inputs.userDataRoot, 'constitution', 'revision-authority.enc.legacy-v1-migration.json'),
    maxEntries,
    false
  );
  if (revisionMigrationMarkerEvidence.state !== 'absent') {
    revisionAuthorityEvidence.push(revisionMigrationMarkerEvidence);
  }
  const defaultCoreEvidence = [await inspectRoot(inputs.coreDefaultProfileRoot, maxEntries)];
  const namedCoreEvidence = [await inspectRoot(inputs.coreNamedProfilesRoot, maxEntries)];
  const credentialEvidence = [await inspectRoot(path.join(inputs.userDataRoot, '.secret-key'), maxEntries, false)];
  const updaterEvidence = [await inspectRoot(path.join(inputs.userDataRoot, 'pending-update.json'), maxEntries, false)];
  const workspaceInputs = inputs.externalWorkspaces ?? [];
  const workspaceEvidence = await Promise.all(
    workspaceInputs.map((workspace) => inspectRoot(workspace.path, maxEntries, false))
  );
  const externalAgentConfigInputs = inputs.externalAgentConfigs ?? [];
  const externalAgentConfigEvidence = await Promise.all(
    externalAgentConfigInputs.map((entry) => inspectRoot(entry.path, maxEntries, false))
  );

  const coreCoverage = (evidence: InventoryPathEvidence[]): AuthorityCoverage =>
    summarizeState(evidence) === 'absent' ? 'absent' : 'encrypted-copy';

  return {
    observedAt: new Date().toISOString(),
    readOnly: true,
    sourceReleaseTrack: inputs.sourceReleaseTrack ?? 'stable',
    authorities: [
      authority('desktop.database', databaseEvidence, {
        recommendedCoverage: 'encrypted-copy',
        requiredConsistency: 'sqlite-online-backup',
        requiredForRestore: true,
        sensitive: true,
        note: 'The main database must be captured with SQLite online backup; WAL/SHM are discovery evidence only.',
      }),
      authority('desktop.config', configEvidence, {
        recommendedCoverage: 'encrypted-copy',
        requiredConsistency: 'quiesced-copy',
        requiredForRestore: true,
        sensitive: true,
        note: 'Config contains provider and application state and must be quiesced before copying.',
      }),
      authority('desktop.runtime-files', runtimeEvidence, {
        recommendedCoverage: summarizeState(runtimeEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency: summarizeState(runtimeEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: summarizeState(runtimeEvidence) !== 'absent',
        sensitive: true,
        note: 'Durable root files include WebUI state, connector receipts/backups, sync state, nicknames, and local device preferences.',
      }),
      authority('constitution.filesystem', constitutionFilesystemEvidence, {
        recommendedCoverage: summarizeState(constitutionFilesystemEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency:
          summarizeState(constitutionFilesystemEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: summarizeState(constitutionFilesystemEvidence) !== 'absent',
        sensitive: true,
        note: 'Desktop Constitution prose, specialist overlays, authenticated keys, archives, journals, and locks are one filesystem authority.',
      }),
      authority('constitution.revision-authority', revisionAuthorityEvidence, {
        recommendedCoverage: summarizeState(revisionAuthorityEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency:
          summarizeState(revisionAuthorityEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: summarizeState(revisionAuthorityEvidence) !== 'absent',
        sensitive: true,
        credentialBinding: {
          scope: 'same-device',
          backend: 'electron-safe-storage',
          envelope: 'constitution-revision-authority/v3',
        },
        note: 'Encrypted Constitution revision authority preserves active and retired revision keys; its OS-vault envelope is same-device only.',
      }),
      authority('core.default-profile', defaultCoreEvidence, {
        recommendedCoverage: coreCoverage(defaultCoreEvidence),
        requiredConsistency: summarizeState(defaultCoreEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: summarizeState(defaultCoreEvidence) !== 'absent',
        sensitive: true,
        note: 'Wayland Core owns this tree; Desktop may copy it only through the negotiated quiescence contract.',
      }),
      authority('core.named-profiles', namedCoreEvidence, {
        recommendedCoverage: coreCoverage(namedCoreEvidence),
        requiredConsistency: summarizeState(namedCoreEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: summarizeState(namedCoreEvidence) !== 'absent',
        sensitive: true,
        note: 'Every named profile is an independent Core authority and must retain directory isolation.',
      }),
      authority('credentials.key-material', credentialEvidence, {
        recommendedCoverage: summarizeState(credentialEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency: summarizeState(credentialEvidence) === 'absent' ? 'not-applicable' : 'immutable-copy',
        requiredForRestore: false,
        sensitive: true,
        note: 'File-backed key material must never enter a plaintext recovery point; OS-keychain material is external.',
      }),
      authority('credentials.os-keychain', [], {
        stateOverride: 'external',
        recommendedCoverage: 'excluded',
        requiredConsistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        note: 'OS-keychain entries cannot be copied by a filesystem recovery point and may require reconnection after restore.',
      }),
      authority('updater.state', updaterEvidence, {
        recommendedCoverage: summarizeState(updaterEvidence) === 'absent' ? 'absent' : 'copied',
        requiredConsistency: summarizeState(updaterEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: false,
        sensitive: false,
        note: `Pending update markers must agree with the ${inputs.sourceReleaseTrack ?? 'stable'} release track and restored app version.`,
      }),
      authority('external.agent-configs', externalAgentConfigEvidence, {
        recommendedCoverage: externalAgentConfigEvidence.length === 0 ? 'absent' : 'reference-only',
        requiredConsistency: externalAgentConfigEvidence.length === 0 ? 'not-applicable' : 'reference-snapshot',
        requiredForRestore: false,
        sensitive: true,
        note: 'Third-party CLI configuration remains user-owned; recovery records paths while Desktop connector receipts/backups live in runtime files.',
      }),
      authority('external.workspaces', workspaceEvidence, {
        recommendedCoverage: workspaceEvidence.length === 0 ? 'absent' : 'reference-only',
        requiredConsistency: workspaceEvidence.length === 0 ? 'not-applicable' : 'reference-snapshot',
        requiredForRestore: false,
        sensitive: false,
        note: 'User workspaces remain external; recovery records paths and never recursively copies project content.',
      }),
    ],
    logicalState: [
      {
        id: 'desktop.chats-projects',
        authorityIds: ['desktop.database'],
        state: 'mapped',
        note: 'Chats, messages, and Project metadata are held in Desktop SQLite; Project workspaces remain external.',
      },
      {
        id: 'desktop.scheduler',
        authorityIds: ['desktop.database'],
        state: 'mapped',
        note: 'Scheduled jobs and their conversation links are stored in Desktop SQLite.',
      },
      {
        id: 'desktop.workflows-teams',
        authorityIds: ['desktop.database'],
        state: 'mapped',
        note: 'Workflow sessions, Teams, tasks, mailbox, and event history are stored in Desktop SQLite.',
      },
      {
        id: 'desktop.artifacts-receipts',
        authorityIds: ['desktop.database', 'desktop.runtime-files', 'external.workspaces'],
        state: 'mapped',
        note: 'Conversation evidence is in SQLite, connector receipts are runtime files, and user-created artifacts remain in referenced workspaces.',
      },
      {
        id: 'desktop.webui',
        authorityIds: ['desktop.config', 'desktop.runtime-files'],
        state: 'mapped',
        note: 'WebUI preferences are split between ConfigStorage and durable WebUI root files.',
      },
      {
        id: 'desktop.preferences',
        authorityIds: ['desktop.config', 'desktop.runtime-files'],
        state: 'mapped',
        note: 'Application preferences use ConfigStorage plus a bounded set of durable root files.',
      },
      {
        id: 'core.engine-state',
        authorityIds: ['constitution.filesystem', 'core.default-profile', 'core.named-profiles'],
        state: 'mapped',
        note: 'Core state is directory-isolated across the native default profile and every named profile.',
      },
      {
        id: 'external.backend-handles',
        authorityIds: ['external.agent-configs', 'desktop.runtime-files'],
        state: 'mapped',
        note: 'External configs are referenced; Desktop-owned connector receipts and rollback copies are runtime files.',
      },
      {
        id: 'credentials.secrets',
        authorityIds: [
          'credentials.key-material',
          'credentials.os-keychain',
          'constitution.revision-authority',
          'constitution.filesystem',
          'desktop.config',
          'desktop.database',
        ],
        state: 'mapped',
        note: 'Secret-bearing state spans encrypted values, file key material, the Constitution revision envelope, and OS-keychain entries; plaintext export is forbidden.',
      },
      {
        id: 'updater.release-channel',
        authorityIds: ['updater.state'],
        state: 'mapped',
        note: `Inventory is pinned to the ${inputs.sourceReleaseTrack ?? 'stable'} build track and its pending-update marker.`,
      },
      {
        id: 'external.workspaces',
        authorityIds: ['external.workspaces'],
        state: 'mapped',
        note: 'External workspaces are referenced and never recursively copied by Desktop recovery.',
      },
    ],
    externalWorkspaces: workspaceInputs.map((workspace, index) => ({
      ...workspace,
      state: workspaceEvidence[index].state,
    })),
    externalAgentConfigs: externalAgentConfigInputs.map((entry, index) => ({
      ...entry,
      state: externalAgentConfigEvidence[index].state,
    })),
  };
}
