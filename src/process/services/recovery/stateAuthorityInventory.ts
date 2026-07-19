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
  hardlinkCount: number;
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
  userDataRoots: UserDataRootInventoryEntry[];
};

export type UserDataRootInventoryEntry = {
  relativePath: string;
  disposition: 'captured' | 'excluded' | 'unknown';
  authorityIds: StateAuthorityId[];
  evidence: InventoryPathEvidence;
  restoreConsequence: string;
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

export const MAX_RECOVERY_INVENTORY_ENTRIES_PER_ROOT = 20_000;

const codeUnitCompare = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);

const CAPTURED_USER_DATA_ROOTS: Readonly<Record<string, readonly StateAuthorityId[]>> = {
  wayland: ['desktop.database'],
  config: ['desktop.config'],
  conversations: ['desktop.runtime-files'],
  attachments: ['desktop.runtime-files'],
  constitution: ['desktop.runtime-files', 'constitution.revision-authority', 'credentials.key-material'],
  'transfer-source-authority-v1': ['credentials.key-material'],
  signal: ['desktop.runtime-files'],
  'cockpit-rollout': ['desktop.runtime-files'],
  'cohort-evidence': ['desktop.runtime-files'],
  voice: ['desktop.runtime-files'],
  'codex-home': ['credentials.key-material'],
  '.cursor': ['credentials.key-material'],
  '.github': ['credentials.key-material'],
  '.vscode': ['credentials.key-material'],
  'Local Storage': ['desktop.runtime-files'],
  'Session Storage': ['desktop.runtime-files'],
  Cookies: ['desktop.runtime-files'],
  'Cookies-journal': ['desktop.runtime-files'],
  DIPS: ['desktop.runtime-files'],
  'DIPS-wal': ['desktop.runtime-files'],
  'Local State': ['desktop.runtime-files'],
  'Network Persistent State': ['desktop.runtime-files'],
  Preferences: ['desktop.runtime-files'],
  SharedStorage: ['desktop.runtime-files'],
  'SharedStorage-wal': ['desktop.runtime-files'],
  TransportSecurity: ['desktop.runtime-files'],
  'Trust Tokens': ['desktop.runtime-files'],
  'Trust Tokens-journal': ['desktop.runtime-files'],
  '.secret-key': ['credentials.key-material'],
  'keys.json': ['credentials.key-material'],
  'pending-update.json': ['updater.state'],
  'analytics.json': ['desktop.runtime-files'],
  'cdp.config.json': ['desktop.runtime-files'],
  'flux-connectors.json': ['desktop.runtime-files'],
  'flux-connector-backups': ['desktop.runtime-files'],
  'nicknames.json': ['desktop.runtime-files'],
  'sync-state.json': ['desktop.runtime-files'],
  'webhook-audit.log': ['desktop.runtime-files'],
  'webhook-audit.log.1': ['desktop.runtime-files'],
  'webui-activity.json': ['desktop.runtime-files'],
  'webui.config.json': ['desktop.runtime-files'],
  'modelsdev-cache.json': ['desktop.runtime-files'],
};

const EXCLUDED_USER_DATA_ROOTS = new Set([
  '.DS_Store',
  '.updaterId',
  '.windsurfrules',
  'Cache',
  'Code Cache',
  'DawnGraphiteCache',
  'DawnWebGPUCache',
  'GPUCache',
  'Shared Dictionary',
  'blob_storage',
  'bun-cache',
  'bun-tmp',
  'cache',
  'logs',
  'DevToolsActivePort',
  'SingletonCookie',
  'SingletonLock',
  'SingletonSocket',
]);

const CONSTITUTION_USER_DATA_CHILDREN = new Set([
  'revision-authority.enc',
  'revision-authority.enc.legacy-v1-migration.json',
  'restore-operations.enc',
  'classic-recovery-operations.enc',
  'external-recovery-authority-v1',
]);

const DATABASE_USER_DATA_CHILDREN = new Set(['wayland.db', 'wayland.db-wal', 'wayland.db-shm']);

function resolveMaxEntries(value: number | undefined): number {
  const candidate = value ?? MAX_RECOVERY_INVENTORY_ENTRIES_PER_ROOT;
  if (!Number.isSafeInteger(candidate) || candidate < 1 || candidate > MAX_RECOVERY_INVENTORY_ENTRIES_PER_ROOT) {
    throw new RangeError(
      `maxEntriesPerRoot must be a safe integer between 1 and ${MAX_RECOVERY_INVENTORY_ENTRIES_PER_ROOT}.`
    );
  }
  return candidate;
}

function emptyEvidence(candidatePath: string, state: InventoryPathState, errorCode?: string): InventoryPathEvidence {
  return {
    path: candidatePath,
    state,
    size: 0,
    fileCount: 0,
    directoryCount: 0,
    symlinkCount: state === 'symlink' ? 1 : 0,
    hardlinkCount: 0,
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
      hardlinkCount: stat.nlink === 1 ? 0 : 1,
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
  names.sort(codeUnitCompare);

  for (const name of names) {
    if (budget.remaining <= 0) {
      budget.truncated = true;
      evidence.truncated = true;
      break;
    }
    budget.remaining -= 1;
    // One shared budget must be consumed deterministically across the tree.
    // oxlint-disable-next-line no-await-in-loop
    const child = await scanContained(path.join(candidatePath, name), budget);
    evidence.size += child.size;
    evidence.fileCount += child.fileCount;
    evidence.directoryCount += child.directoryCount;
    evidence.symlinkCount += child.symlinkCount;
    evidence.hardlinkCount += child.hardlinkCount;
    evidence.truncated ||= child.truncated;
    if (child.state === 'unreadable') {
      evidence.state = 'unreadable';
      evidence.errorCode ??= child.errorCode;
    }
  }
  evidence.truncated ||= budget.truncated;
  return evidence;
}

async function inventoryUserDataRoots(
  userDataRoot: string,
  maxEntries: number
): Promise<UserDataRootInventoryEntry[]> {
  let names: string[];
  try {
    names = await readdir(userDataRoot);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    return [
      {
        relativePath: '.',
        disposition: 'unknown',
        authorityIds: [],
        evidence: emptyEvidence(userDataRoot, 'unreadable', code ?? 'UNKNOWN'),
        restoreConsequence: 'The user-data namespace could not be enumerated, so recovery cannot prove completeness.',
      },
    ];
  }

  names.sort(codeUnitCompare);
  const roots = await Promise.all(
    names.map(async (name): Promise<UserDataRootInventoryEntry> => {
      const candidate = path.join(userDataRoot, name);
      const evidence = await inspectRoot(candidate, maxEntries, false);
      const authorities =
        CAPTURED_USER_DATA_ROOTS[name] ??
        (name.startsWith('ijfw-latest-cache-') && name.endsWith('.json') ? ['desktop.runtime-files'] : undefined);
      if (authorities) {
        return {
          relativePath: name,
          disposition: 'captured',
          authorityIds: [...authorities],
          evidence,
          restoreConsequence: 'This application-owned state is sealed into the recovery point.',
        };
      }
      if (EXCLUDED_USER_DATA_ROOTS.has(name)) {
        return {
          relativePath: name,
          disposition: 'excluded',
          authorityIds: [],
          evidence,
          restoreConsequence: 'This transient cache, lock, or rebuildable runtime artifact is recreated after restore.',
        };
      }
      return {
        relativePath: name,
        disposition: 'unknown',
        authorityIds: [],
        evidence,
        restoreConsequence: 'No recovery authority or explicit exclusion owns this root.',
      };
    })
  );

  const constitution = roots.find(({ relativePath }) => relativePath === 'constitution');
  if (constitution?.evidence.state === 'directory') {
    let children: string[];
    try {
      children = await readdir(path.join(userDataRoot, 'constitution'));
    } catch (error) {
      roots.push({
        relativePath: 'constitution/.',
        disposition: 'unknown',
        authorityIds: [],
        evidence: emptyEvidence(
          path.join(userDataRoot, 'constitution'),
          'unreadable',
          (error as NodeJS.ErrnoException).code ?? 'UNKNOWN'
        ),
        restoreConsequence: 'The Constitution authority namespace could not be enumerated.',
      });
      return roots.toSorted((left, right) => codeUnitCompare(left.relativePath, right.relativePath));
    }
    children.sort(codeUnitCompare);
    for (const child of children) {
      if (CONSTITUTION_USER_DATA_CHILDREN.has(child)) continue;
      const relativePath = `constitution/${child}`;
      // Sequential inspection preserves deterministic evidence ordering.
      // oxlint-disable-next-line no-await-in-loop
      const evidence = await inspectRoot(path.join(userDataRoot, ...relativePath.split('/')), maxEntries, false);
      roots.push({
        relativePath,
        disposition: 'unknown',
        authorityIds: [],
        evidence,
        restoreConsequence: 'No recovery authority or explicit exclusion owns this Constitution child.',
      });
    }
  }
  const database = roots.find(({ relativePath }) => relativePath === 'wayland');
  if (database?.evidence.state === 'directory') {
    let children: string[];
    try {
      children = await readdir(path.join(userDataRoot, 'wayland'));
    } catch (error) {
      roots.push({
        relativePath: 'wayland/.',
        disposition: 'unknown',
        authorityIds: [],
        evidence: emptyEvidence(
          path.join(userDataRoot, 'wayland'),
          'unreadable',
          (error as NodeJS.ErrnoException).code ?? 'UNKNOWN'
        ),
        restoreConsequence: 'The Desktop database namespace could not be enumerated.',
      });
      return roots.toSorted((left, right) => codeUnitCompare(left.relativePath, right.relativePath));
    }
    children.sort(codeUnitCompare);
    for (const child of children) {
      if (DATABASE_USER_DATA_CHILDREN.has(child)) continue;
      const relativePath = `wayland/${child}`;
      // Sequential inspection preserves deterministic evidence ordering.
      // oxlint-disable-next-line no-await-in-loop
      const evidence = await inspectRoot(path.join(userDataRoot, 'wayland', child), maxEntries, false);
      roots.push({
        relativePath,
        disposition: 'unknown',
        authorityIds: [],
        evidence,
        restoreConsequence: 'No recovery authority owns this Desktop database child.',
      });
    }
  }
  return roots.toSorted((left, right) => codeUnitCompare(left.relativePath, right.relativePath));
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
  if (stat.isFile()) {
    return {
      ...emptyEvidence(candidatePath, 'file'),
      size: stat.size,
      fileCount: 1,
      hardlinkCount: stat.nlink === 1 ? 0 : 1,
    };
  }
  if (stat.isDirectory()) return { ...emptyEvidence(candidatePath, 'directory'), directoryCount: 1 };
  return emptyEvidence(candidatePath, 'unreadable', 'UNSUPPORTED_FILE_TYPE');
}

/** Recompute the claimed authority state solely from read-only path evidence. */
export function classifyInventoryEvidenceState(evidence: InventoryPathEvidence[]): StateAuthorityInventory['state'] {
  if (evidence.some((entry) => entry.state === 'symlink' || entry.symlinkCount > 0 || entry.hardlinkCount > 0)) {
    return 'symlink-risk';
  }
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
  return { id, state: stateOverride ?? classifyInventoryEvidenceState(evidence), evidence, ...authorityOptions };
}

/**
 * Inspect every state authority without opening SQLite, reading file contents,
 * resolving symlinks, or changing the filesystem. The result is discovery
 * evidence only: it cannot promote a recovery point to `complete`.
 */
export async function inventoryRecoveryAuthorities(inputs: RecoveryInventoryInputs): Promise<RecoveryInventory> {
  const maxEntries = resolveMaxEntries(inputs.maxEntriesPerRoot);
  const desktopDataRoot = path.join(inputs.userDataRoot, 'wayland');
  const databaseEvidence = await Promise.all(
    ['wayland.db', 'wayland.db-wal', 'wayland.db-shm'].map((name) =>
      inspectRoot(path.join(desktopDataRoot, name), maxEntries, false)
    )
  );
  const configEvidence = [await inspectRoot(path.join(inputs.userDataRoot, 'config'), maxEntries)];
  const runtimeFileCandidates = [
    'conversations',
    'attachments',
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
    'modelsdev-cache.json',
    'signal',
    'cockpit-rollout',
    'cohort-evidence',
    'voice',
    'Local Storage',
    'Session Storage',
    'Cookies',
    'Cookies-journal',
    'DIPS',
    'DIPS-wal',
    'Local State',
    'Network Persistent State',
    'Preferences',
    'SharedStorage',
    'SharedStorage-wal',
    'TransportSecurity',
    'Trust Tokens',
    'Trust Tokens-journal',
    path.join('constitution', 'restore-operations.enc'),
    path.join('constitution', 'classic-recovery-operations.enc'),
  ];
  const dynamicRuntimeCandidates = (await readdir(inputs.userDataRoot).catch((): string[] => []))
    .filter((name) => name.startsWith('ijfw-latest-cache-') && name.endsWith('.json'))
    .toSorted(codeUnitCompare);
  const runtimeEvidence = await Promise.all(
    [...runtimeFileCandidates, ...dynamicRuntimeCandidates].map(async (name) => {
      const evidence = await inspectRoot(path.join(inputs.userDataRoot, name), maxEntries);
      evidence.authorityRelativePath = name.split(path.sep).join('/');
      return evidence;
    })
  );
  const constitutionPaths = [
    'CONSTITUTION.md',
    'SOUL.md',
    'specialists',
    '.constitution-keys.enc',
    path.join('archives', 'constitution-history'),
  ];
  const constitutionFilesystemEvidence = await Promise.all(
    constitutionPaths.map(async (relativePath) => {
      const evidence = await inspectRoot(path.join(inputs.constitutionRoot, relativePath), maxEntries);
      evidence.authorityRelativePath = relativePath.split(path.sep).join('/');
      return evidence;
    })
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
  const credentialEvidence = await Promise.all(
    [
      '.secret-key',
      'keys.json',
      'transfer-source-authority-v1',
      'codex-home',
      '.cursor',
      '.github',
      '.vscode',
      path.join('constitution', 'external-recovery-authority-v1'),
    ].map(async (name) => {
      const evidence = await inspectRoot(path.join(inputs.userDataRoot, name), maxEntries);
      evidence.authorityRelativePath = name.split(path.sep).join('/');
      return evidence;
    })
  );
  const updaterEvidence = [await inspectRoot(path.join(inputs.userDataRoot, 'pending-update.json'), maxEntries, false)];
  const workspaceInputs = (inputs.externalWorkspaces ?? []).toSorted((left, right) =>
    codeUnitCompare(`${left.projectId}\0${left.path}`, `${right.projectId}\0${right.path}`)
  );
  const workspaceEvidence = await Promise.all(
    workspaceInputs.map((workspace) => inspectRoot(workspace.path, maxEntries, false))
  );
  const externalAgentConfigInputs = (inputs.externalAgentConfigs ?? []).toSorted((left, right) =>
    codeUnitCompare(`${left.backendId}\0${left.path}`, `${right.backendId}\0${right.path}`)
  );
  const externalAgentConfigEvidence = await Promise.all(
    externalAgentConfigInputs.map((entry) => inspectRoot(entry.path, maxEntries, false))
  );

  const coreCoverage = (evidence: InventoryPathEvidence[]): AuthorityCoverage =>
    classifyInventoryEvidenceState(evidence) === 'absent' ? 'absent' : 'encrypted-copy';
  const userDataRoots = await inventoryUserDataRoots(inputs.userDataRoot, maxEntries);

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
        recommendedCoverage: classifyInventoryEvidenceState(runtimeEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency:
          classifyInventoryEvidenceState(runtimeEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: classifyInventoryEvidenceState(runtimeEvidence) !== 'absent',
        sensitive: true,
        note: 'Durable root files include WebUI state, connector receipts/backups, sync state, nicknames, and local device preferences.',
      }),
      authority('constitution.filesystem', constitutionFilesystemEvidence, {
        recommendedCoverage:
          classifyInventoryEvidenceState(constitutionFilesystemEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency:
          classifyInventoryEvidenceState(constitutionFilesystemEvidence) === 'absent'
            ? 'not-applicable'
            : 'quiesced-copy',
        requiredForRestore: classifyInventoryEvidenceState(constitutionFilesystemEvidence) !== 'absent',
        sensitive: true,
        note: 'Desktop Constitution prose, specialist overlays, authenticated keys, archives, journals, and locks are one filesystem authority.',
      }),
      authority('constitution.revision-authority', revisionAuthorityEvidence, {
        recommendedCoverage:
          classifyInventoryEvidenceState(revisionAuthorityEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency:
          classifyInventoryEvidenceState(revisionAuthorityEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: classifyInventoryEvidenceState(revisionAuthorityEvidence) !== 'absent',
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
        requiredConsistency:
          classifyInventoryEvidenceState(defaultCoreEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: classifyInventoryEvidenceState(defaultCoreEvidence) !== 'absent',
        sensitive: true,
        note: 'Wayland Core owns this tree; Desktop may copy it only through the negotiated quiescence contract.',
      }),
      authority('core.named-profiles', namedCoreEvidence, {
        recommendedCoverage: coreCoverage(namedCoreEvidence),
        requiredConsistency:
          classifyInventoryEvidenceState(namedCoreEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: classifyInventoryEvidenceState(namedCoreEvidence) !== 'absent',
        sensitive: true,
        note: 'Every named profile is an independent Core authority and must retain directory isolation.',
      }),
      authority('credentials.key-material', credentialEvidence, {
        recommendedCoverage:
          classifyInventoryEvidenceState(credentialEvidence) === 'absent' ? 'absent' : 'encrypted-copy',
        requiredConsistency:
          classifyInventoryEvidenceState(credentialEvidence) === 'absent' ? 'not-applicable' : 'immutable-copy',
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
        recommendedCoverage: classifyInventoryEvidenceState(updaterEvidence) === 'absent' ? 'absent' : 'copied',
        requiredConsistency:
          classifyInventoryEvidenceState(updaterEvidence) === 'absent' ? 'not-applicable' : 'quiesced-copy',
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
      projectId: workspace.projectId,
      path: workspace.path,
      state: workspaceEvidence[index].state,
    })),
    externalAgentConfigs: externalAgentConfigInputs.map((entry, index) => ({
      backendId: entry.backendId,
      path: entry.path,
      state: externalAgentConfigEvidence[index].state,
    })),
    userDataRoots,
  };
}
