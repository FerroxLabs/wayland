/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  REQUIRED_LOGICAL_STATE,
  type AuthorityConsistency,
  type AuthorityCoverage,
  type LogicalStateId,
  type StateAuthorityId,
} from './recoveryManifest';
import type { RecoveryInventory, StateAuthorityInventory } from './stateAuthorityInventory';

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
    return authority.state === 'absent' ? 'absent' : 'reference-only';
  }
  return authority.recommendedCoverage;
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

  const authorityIds = new Set(inventory.authorities.map(({ id }) => id));
  for (const logicalStateId of REQUIRED_LOGICAL_STATE) {
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
    const captureCoverage = plannedCoverage(authority);
    const copied = captureCoverage === 'copied' || captureCoverage === 'encrypted-copy';
    const unsafeEvidence = authority.evidence.some(
      (evidence) => evidence.state === 'unreadable' || evidence.state === 'symlink' || evidence.symlinkCount > 0
    );
    const unsafeExternalEvidence = authority.evidence.some(
      (evidence) =>
        evidence.state === 'absent' ||
        evidence.state === 'unreadable' ||
        evidence.state === 'symlink' ||
        evidence.symlinkCount > 0
    );
    const truncatedEvidence = authority.evidence.some((evidence) => evidence.truncated);

    if (copied && unsafeEvidence) {
      blockers.push(
        block(
          'AUTHORITY_PATH_UNSAFE',
          `${authority.id} contains unreadable or symlinked state and cannot be copied safely.`,
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
