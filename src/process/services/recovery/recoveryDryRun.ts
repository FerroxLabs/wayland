/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  REQUIRED_LOGICAL_STATE,
  REQUIRED_STATE_AUTHORITIES,
  type AuthorityConsistency,
  type AuthorityCoverage,
  type LogicalStateId,
  type StateAuthorityId,
} from './recoveryManifest';
import {
  classifyInventoryEvidenceState,
  type RecoveryInventory,
  type StateAuthorityInventory,
} from './stateAuthorityInventory';

export type RecoveryCaptureCapabilities = {
  sqliteOnlineBackup: boolean;
  desktopQuiescence: boolean;
  coreQuiescence: boolean;
  mutationEpoch: boolean;
  sealedSensitiveCopies: boolean;
};

export type RecoveryDryRunFinding = {
  code: string;
  severity: 'blocker' | 'warning';
  authorityId?: StateAuthorityId;
  logicalStateId?: LogicalStateId;
  message: string;
};

export type RecoveryAuthorityCapturePlan = {
  id: StateAuthorityId;
  coverage: AuthorityCoverage;
  consistency: AuthorityConsistency;
  evidencePaths: string[];
};

export type RecoveryDryRun = {
  dryRunOnly: true;
  readyToCapture: boolean;
  observedAt: string;
  sourceReleaseTrack: 'stable' | 'preview';
  blockers: RecoveryDryRunFinding[];
  warnings: RecoveryDryRunFinding[];
  authorities: RecoveryAuthorityCapturePlan[];
};

const block = (
  code: string,
  message: string,
  scope: Pick<RecoveryDryRunFinding, 'authorityId' | 'logicalStateId'> = {}
): RecoveryDryRunFinding => ({ code, severity: 'blocker', message, ...scope });

const warn = (
  code: string,
  message: string,
  scope: Pick<RecoveryDryRunFinding, 'authorityId' | 'logicalStateId'> = {}
): RecoveryDryRunFinding => ({ code, severity: 'warning', message, ...scope });

function findAuthority(inventory: RecoveryInventory, id: StateAuthorityId): StateAuthorityInventory | undefined {
  return inventory.authorities.find((authority) => authority.id === id);
}

function plannedCoverage(authority: StateAuthorityInventory): AuthorityCoverage {
  if (authority.id === 'credentials.os-keychain') return 'excluded';
  if (authority.id === 'external.agent-configs' || authority.id === 'external.workspaces') {
    return authority.evidence.length === 0 ? 'absent' : 'reference-only';
  }
  return authority.recommendedCoverage;
}

function expectedAuthorityPolicy(authority: StateAuthorityInventory): {
  coverage: AuthorityCoverage;
  consistency: AuthorityConsistency;
  requiredForRestore: boolean;
} {
  const absent = authority.state === 'absent';
  switch (authority.id) {
    case 'desktop.database':
      return { coverage: 'encrypted-copy', consistency: 'sqlite-online-backup', requiredForRestore: true };
    case 'desktop.config':
      return { coverage: 'encrypted-copy', consistency: 'quiesced-copy', requiredForRestore: true };
    case 'desktop.runtime-files':
    case 'constitution.filesystem':
    case 'constitution.revision-authority':
    case 'core.default-profile':
    case 'core.named-profiles':
      return {
        coverage: absent ? 'absent' : 'encrypted-copy',
        consistency: absent ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: !absent,
      };
    case 'credentials.key-material':
      return {
        coverage: absent ? 'absent' : 'encrypted-copy',
        consistency: absent ? 'not-applicable' : 'immutable-copy',
        requiredForRestore: false,
      };
    case 'credentials.os-keychain':
      return { coverage: 'excluded', consistency: 'not-applicable', requiredForRestore: false };
    case 'updater.state':
      return {
        coverage: absent ? 'absent' : 'copied',
        consistency: absent ? 'not-applicable' : 'quiesced-copy',
        requiredForRestore: false,
      };
    case 'external.agent-configs':
    case 'external.workspaces':
      return {
        coverage: authority.evidence.length === 0 ? 'absent' : 'reference-only',
        consistency: authority.evidence.length === 0 ? 'not-applicable' : 'reference-snapshot',
        requiredForRestore: false,
      };
  }
}

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validateExternalReferenceBinding(
  inventory: RecoveryInventory,
  authorityId: 'external.workspaces' | 'external.agent-configs',
  blockers: RecoveryDryRunFinding[]
): void {
  const authority = findAuthority(inventory, authorityId);
  const references =
    authorityId === 'external.workspaces'
      ? inventory.externalWorkspaces.map((entry) => ({ id: entry.projectId, path: entry.path, state: entry.state }))
      : inventory.externalAgentConfigs.map((entry) => ({ id: entry.backendId, path: entry.path, state: entry.state }));
  const expected = references.toSorted((left, right) =>
    codeUnitCompare(`${left.id}\0${left.path}\0${left.state}`, `${right.id}\0${right.path}\0${right.state}`)
  );
  const uniqueIds = new Set(references.map(({ id }) => id));
  const evidence = authority?.evidence ?? [];

  if (uniqueIds.size !== references.length) {
    blockers.push(
      block('EXTERNAL_REFERENCE_DUPLICATE', `${authorityId} contains duplicate identifiers.`, { authorityId })
    );
  }
  if (references.some((entry, index) => entry !== expected[index])) {
    blockers.push(
      block('EXTERNAL_REFERENCE_ORDER_INVALID', `${authorityId} references are not in deterministic order.`, {
        authorityId,
      })
    );
  }
  if (evidence.length !== references.length) {
    blockers.push(
      block('EXTERNAL_REFERENCE_COUNT_MISMATCH', `${authorityId} evidence and references are not one-to-one.`, {
        authorityId,
      })
    );
    return;
  }
  for (const [index, reference] of references.entries()) {
    const observed = evidence[index];
    if (observed.path !== reference.path || observed.state !== reference.state) {
      blockers.push(
        block(
          'EXTERNAL_REFERENCE_EVIDENCE_MISMATCH',
          `${authorityId} reference ${reference.id} contradicts evidence.`,
          {
            authorityId,
          }
        )
      );
    }
  }
}

/**
 * Evaluate whether the discovered state can enter an application-consistent
 * capture. This function is read-only and never claims that a recovery point
 * exists: `readyToCapture` means only that a separate builder has all required
 * safety primitives and accounted-for inputs.
 */
export function evaluateRecoveryDryRun(
  inventory: RecoveryInventory,
  capabilities: RecoveryCaptureCapabilities
): RecoveryDryRun {
  const blockers: RecoveryDryRunFinding[] = [];
  const warnings: RecoveryDryRunFinding[] = [];

  if (inventory.readOnly !== true) {
    blockers.push(block('INVENTORY_NOT_READ_ONLY', 'Authority inventory is not authenticated as inspect-only.'));
  }

  if (!Array.isArray(inventory.userDataRoots)) {
    blockers.push(block('USER_DATA_ROOT_INVENTORY_MISSING', 'The canonical user-data root inventory is missing.'));
  } else {
    const seenRoots = new Set<string>();
    let previous = '';
    for (const root of inventory.userDataRoots) {
      if (!root.relativePath || seenRoots.has(root.relativePath)) {
        blockers.push(block('USER_DATA_ROOT_DUPLICATE', 'The user-data root inventory contains a duplicate path.'));
      }
      if (previous && codeUnitCompare(previous, root.relativePath) > 0) {
        blockers.push(block('USER_DATA_ROOT_ORDER_INVALID', 'The user-data root inventory is not deterministic.'));
      }
      seenRoots.add(root.relativePath);
      previous = root.relativePath;
      if (root.disposition === 'unknown') {
        blockers.push(
          block('UNKNOWN_AUTHORITY_ROOT', `No recovery authority owns user-data path ${root.relativePath}.`)
        );
      }
      if (
        root.disposition === 'captured' &&
        (root.authorityIds.length === 0 ||
          root.evidence.state === 'symlink' ||
          root.evidence.state === 'unreadable' ||
          root.evidence.symlinkCount > 0 ||
          root.evidence.hardlinkCount > 0)
      ) {
        blockers.push(block('USER_DATA_ROOT_UNSAFE', `Captured user-data path ${root.relativePath} is unsafe.`));
      }
      if (root.disposition === 'excluded' && root.restoreConsequence.trim().length === 0) {
        blockers.push(
          block('USER_DATA_EXCLUSION_UNJUSTIFIED', `Excluded user-data path ${root.relativePath} has no consequence.`)
        );
      }
    }
  }

  if (!Array.isArray(inventory.constitutionRoots)) {
    blockers.push(block('CONSTITUTION_ROOT_INVENTORY_MISSING', 'The Constitution namespace inventory is missing.'));
  } else {
    const seenRoots = new Set<string>();
    let previous = '';
    for (const root of inventory.constitutionRoots) {
      if (!root.relativePath || seenRoots.has(root.relativePath)) {
        blockers.push(block('CONSTITUTION_ROOT_DUPLICATE', 'The Constitution inventory contains a duplicate path.'));
      }
      if (previous && codeUnitCompare(previous, root.relativePath) > 0) {
        blockers.push(block('CONSTITUTION_ROOT_ORDER_INVALID', 'The Constitution inventory is not deterministic.'));
      }
      seenRoots.add(root.relativePath);
      previous = root.relativePath;
      if (root.disposition === 'unknown') {
        blockers.push(
          block('UNKNOWN_CONSTITUTION_ROOT', `No recovery authority owns Constitution path ${root.relativePath}.`)
        );
      }
      if (
        root.disposition === 'captured' &&
        (root.authorityIds.length === 0 ||
          root.evidence.state === 'symlink' ||
          root.evidence.state === 'unreadable' ||
          root.evidence.symlinkCount > 0 ||
          root.evidence.hardlinkCount > 0 ||
          root.evidence.truncated)
      ) {
        blockers.push(block('CONSTITUTION_ROOT_UNSAFE', `Captured Constitution path ${root.relativePath} is unsafe.`));
      }
      if (root.disposition === 'excluded' && root.restoreConsequence.trim().length === 0) {
        blockers.push(
          block(
            'CONSTITUTION_EXCLUSION_UNJUSTIFIED',
            `Excluded Constitution path ${root.relativePath} has no consequence.`
          )
        );
      }
    }
  }

  validateExternalReferenceBinding(inventory, 'external.workspaces', blockers);
  validateExternalReferenceBinding(inventory, 'external.agent-configs', blockers);

  const requiredAuthorityIds = new Set<string>(REQUIRED_STATE_AUTHORITIES);
  const authorityCounts = new Map<string, number>();
  for (const authority of inventory.authorities) {
    const authorityId = authority.id as string;
    authorityCounts.set(authorityId, (authorityCounts.get(authorityId) ?? 0) + 1);
    if (!requiredAuthorityIds.has(authorityId)) {
      blockers.push(block('AUTHORITY_UNKNOWN', `Unknown state authority ${authorityId} cannot enter capture.`));
      continue;
    }
    if (authority.id !== 'credentials.os-keychain') {
      const classifiedState = classifyInventoryEvidenceState(authority.evidence);
      if (authority.state !== classifiedState) {
        blockers.push(
          block(
            'AUTHORITY_STATE_MISMATCH',
            `${authority.id} claims ${authority.state} but its evidence classifies as ${classifiedState}.`,
            { authorityId: authority.id }
          )
        );
      }
    } else if (authority.state !== 'external' || authority.evidence.length !== 0) {
      blockers.push(
        block(
          'EXTERNAL_AUTHORITY_INVALID',
          'OS-keychain authority must remain external and contain no filesystem evidence.',
          { authorityId: authority.id }
        )
      );
    }
    const expectedPolicy = expectedAuthorityPolicy(authority);
    if (
      authority.recommendedCoverage !== expectedPolicy.coverage ||
      authority.requiredConsistency !== expectedPolicy.consistency ||
      authority.requiredForRestore !== expectedPolicy.requiredForRestore
    ) {
      blockers.push(
        block('AUTHORITY_POLICY_MISMATCH', `${authority.id} capture policy does not match its classified state.`, {
          authorityId: authority.id,
        })
      );
    }
  }
  for (const authorityId of REQUIRED_STATE_AUTHORITIES) {
    const count = authorityCounts.get(authorityId) ?? 0;
    if (count === 0) {
      blockers.push(
        block('AUTHORITY_UNDISCOVERED', `Required state authority ${authorityId} is missing.`, { authorityId })
      );
    } else if (count > 1) {
      blockers.push(
        block('AUTHORITY_DUPLICATE', `State authority ${authorityId} was classified more than once.`, { authorityId })
      );
    }
  }

  const authorityIds = new Set(inventory.authorities.map(({ id }) => id));
  const logicalCounts = new Map<string, number>();
  for (const logicalState of inventory.logicalState) {
    const logicalStateId = logicalState.id as string;
    logicalCounts.set(logicalStateId, (logicalCounts.get(logicalStateId) ?? 0) + 1);
    if (!(REQUIRED_LOGICAL_STATE as readonly string[]).includes(logicalStateId)) {
      blockers.push(block('LOGICAL_STATE_UNKNOWN', `Unknown logical state ${logicalStateId} cannot enter capture.`));
    }
  }
  for (const logicalStateId of REQUIRED_LOGICAL_STATE) {
    if ((logicalCounts.get(logicalStateId) ?? 0) > 1) {
      blockers.push(
        block('LOGICAL_STATE_DUPLICATE', `Logical state ${logicalStateId} was mapped more than once.`, {
          logicalStateId,
        })
      );
    }
    const mapping = inventory.logicalState.find(({ id }) => id === logicalStateId);
    if (!mapping) {
      blockers.push(
        block('LOGICAL_STATE_UNMAPPED', `Logical state ${logicalStateId} is not mapped.`, { logicalStateId })
      );
      continue;
    }
    for (const authorityId of mapping.authorityIds) {
      if (!authorityIds.has(authorityId)) {
        blockers.push(
          block(
            'LOGICAL_AUTHORITY_UNDISCOVERED',
            `Logical state ${logicalStateId} references undiscovered ${authorityId}.`,
            {
              logicalStateId,
              authorityId,
            }
          )
        );
      }
    }
  }

  for (const authority of inventory.authorities) {
    if (!requiredAuthorityIds.has(authority.id)) continue;
    const captureCoverage = plannedCoverage(authority);
    const copied = captureCoverage === 'copied' || captureCoverage === 'encrypted-copy';
    const unsafeEvidence = authority.evidence.some(
      (evidence) =>
        evidence.state === 'unreadable' ||
        evidence.state === 'symlink' ||
        evidence.symlinkCount > 0 ||
        evidence.hardlinkCount > 0
    );
    const unsafeExternalEvidence = authority.evidence.some(
      (evidence) =>
        evidence.state === 'absent' ||
        evidence.state === 'unreadable' ||
        evidence.state === 'symlink' ||
        evidence.symlinkCount > 0
    );
    const truncatedEvidence = authority.evidence.some((evidence) => evidence.truncated);

    if (
      authority.id !== 'credentials.os-keychain' &&
      authority.id !== 'external.agent-configs' &&
      authority.id !== 'external.workspaces' &&
      authority.state !== 'absent' &&
      !copied
    ) {
      blockers.push(
        block('AUTHORITY_COVERAGE_INVALID', `${authority.id} is present but its capture policy does not copy it.`, {
          authorityId: authority.id,
        })
      );
    }

    if (copied && unsafeEvidence) {
      blockers.push(
        block(
          'AUTHORITY_PATH_UNSAFE',
          `${authority.id} contains unreadable or linked state and cannot be copied safely.`,
          {
            authorityId: authority.id,
          }
        )
      );
    }
    if (copied && truncatedEvidence) {
      blockers.push(
        block('AUTHORITY_INVENTORY_TRUNCATED', `${authority.id} exceeded the discovery budget.`, {
          authorityId: authority.id,
        })
      );
    }
    if (copied && authority.sensitive && !capabilities.sealedSensitiveCopies) {
      blockers.push(
        block(
          'SEALED_COPY_UNAVAILABLE',
          `${authority.id} contains sensitive state but no sealing primitive is available.`,
          {
            authorityId: authority.id,
          }
        )
      );
    }
    if (
      (authority.id === 'external.agent-configs' || authority.id === 'external.workspaces') &&
      unsafeExternalEvidence
    ) {
      warnings.push(
        warn('EXTERNAL_REFERENCE_UNSAFE', `${authority.id} contains a missing, unreadable, or symlinked reference.`, {
          authorityId: authority.id,
        })
      );
    }
  }

  const database = findAuthority(inventory, 'desktop.database');
  const mainDatabase = database?.evidence[0];
  if (!database || !mainDatabase || mainDatabase.state !== 'file') {
    blockers.push(
      block('DATABASE_SOURCE_MISSING', 'The authoritative Desktop SQLite file is missing.', {
        authorityId: 'desktop.database',
      })
    );
  }
  if (!capabilities.sqliteOnlineBackup) {
    blockers.push(
      block('SQLITE_ONLINE_BACKUP_UNAVAILABLE', 'SQLite online backup support is required.', {
        authorityId: 'desktop.database',
      })
    );
  }

  const desktopConfig = findAuthority(inventory, 'desktop.config');
  if (!desktopConfig || desktopConfig.state === 'absent') {
    blockers.push(
      block('DESKTOP_CONFIG_MISSING', 'Desktop config state is missing.', { authorityId: 'desktop.config' })
    );
  }
  if (!capabilities.desktopQuiescence) {
    blockers.push(
      block(
        'DESKTOP_QUIESCENCE_UNAVAILABLE',
        'Desktop config, runtime files, and updater state cannot share one mutation epoch.',
        {
          authorityId: 'desktop.config',
        }
      )
    );
  }
  if (!capabilities.mutationEpoch) {
    blockers.push(block('MUTATION_EPOCH_UNAVAILABLE', 'No start/end mutation epoch authority is available.'));
  }

  const corePresent = (['core.default-profile', 'core.named-profiles'] as const).some((id) => {
    const state = findAuthority(inventory, id)?.state;
    return state !== undefined && state !== 'absent';
  });
  if (corePresent && !capabilities.coreQuiescence) {
    blockers.push(
      block(
        'CORE_QUIESCENCE_UNAVAILABLE',
        'Core state is present but Core has not granted a quiesced snapshot lease.',
        {
          authorityId: 'core.default-profile',
        }
      )
    );
  }

  warnings.push(
    warn(
      'OS_KEYCHAIN_EXTERNAL',
      'OS-keychain entries are intentionally excluded; credentials may require reconnection after restore.',
      { authorityId: 'credentials.os-keychain' }
    )
  );

  return {
    dryRunOnly: true,
    readyToCapture: blockers.length === 0,
    observedAt: inventory.observedAt,
    sourceReleaseTrack: inventory.sourceReleaseTrack,
    blockers,
    warnings,
    authorities: inventory.authorities.map((authority) => ({
      id: authority.id,
      coverage: plannedCoverage(authority),
      consistency: authority.requiredConsistency,
      evidencePaths: authority.evidence.map(({ path }) => path),
    })),
  };
}
