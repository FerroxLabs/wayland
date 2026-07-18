/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WAYLAND_TRANSFER_DESTINATION_SUITE,
  WAYLAND_TRANSFER_FORMAT_VERSION,
  WAYLAND_TRANSFER_PREFLIGHT_CONTRACT,
  WAYLAND_TRANSFER_RECOVERY_SUITE,
  type WaylandTransferFamilyDisposition,
  type WaylandTransferFamilyPreview,
  type WaylandTransferPreflight,
  type WaylandTransferPreflightFinding,
  type WaylandTransferPreflightRequest,
} from '@/common/types/transfer';
import {
  REQUIRED_LOGICAL_STATE,
  REQUIRED_STATE_AUTHORITIES,
  type LogicalStateId,
  type StateAuthorityId,
} from '@/process/services/recovery/recoveryManifest';
import {
  evaluateRecoveryDryRun,
  type RecoveryCaptureCapabilities,
} from '@/process/services/recovery/recoveryDryRun';
import {
  inventoryRecoveryAuthorities,
  type RecoveryInventory,
  type RecoveryInventoryInputs,
} from '@/process/services/recovery/stateAuthorityInventory';

const MAX_DESTINATION_BINDING_MS = 15 * 60 * 1_000;
const LOGICAL_STATE_SET = new Set<string>(REQUIRED_LOGICAL_STATE);
const AUTHORITY_SET = new Set<string>(REQUIRED_STATE_AUTHORITIES);

const emptyTotals = (): WaylandTransferPreflightTotals => ({ familyCount: 0, fileCount: 0, estimatedBytes: 0 });

const EXECUTABLE_FAMILIES = new Set<LogicalStateId>([
  'desktop.scheduler',
  'desktop.workflows-teams',
  'core.engine-state',
]);

const FAMILY_DISPOSITIONS: Partial<Record<LogicalStateId, WaylandTransferFamilyDisposition>> = {
  'external.backend-handles': 'reference-only',
  'credentials.secrets': 'reconnect-required',
  'updater.release-channel': 'excluded',
  'external.workspaces': 'reference-only',
};

export type WaylandTransferPreflightTotals = {
  familyCount: number;
  fileCount: number;
  estimatedBytes: number;
};

export type WaylandTransferPreflightSummary = {
  included: WaylandTransferPreflightTotals;
  reference: WaylandTransferPreflightTotals;
  excluded: WaylandTransferPreflightTotals;
};

export type WaylandTransferInventoryFamilyPreview = WaylandTransferFamilyPreview & {
  activation: 'not-applicable' | 'paused-quarantine-required';
};

export type WaylandTransferInventoryPreflight = Omit<WaylandTransferPreflight, 'families'> & {
  families: WaylandTransferInventoryFamilyPreview[];
  /** Family-level totals; shared physical authorities can contribute to more than one logical family. */
  summary: WaylandTransferPreflightSummary;
};

export type WaylandTransferInventoryPreflightInputs = {
  request: WaylandTransferPreflightRequest;
  inventory: RecoveryInventoryInputs;
  recoveryCapabilities: RecoveryCaptureCapabilities;
  now?: Date;
};

const blocker = (
  code: string,
  message: string,
  scope: Pick<WaylandTransferPreflightFinding, 'logicalStateId' | 'authorityId'> = {}
): WaylandTransferPreflightFinding => ({ code, severity: 'blocker', message, ...scope });

const warning = (
  code: string,
  message: string,
  scope: Pick<WaylandTransferPreflightFinding, 'logicalStateId' | 'authorityId'> = {}
): WaylandTransferPreflightFinding => ({ code, severity: 'warning', message, ...scope });

function pushUnique(target: WaylandTransferPreflightFinding[], finding: WaylandTransferPreflightFinding): void {
  const key = `${finding.code}:${finding.logicalStateId ?? ''}:${finding.authorityId ?? ''}`;
  if (!target.some((entry) => `${entry.code}:${entry.logicalStateId ?? ''}:${entry.authorityId ?? ''}` === key)) {
    target.push(finding);
  }
}

function validateRegistry(inventory: RecoveryInventory, blockers: WaylandTransferPreflightFinding[]): void {
  const authorityIds = new Set<string>();
  for (const authority of inventory.authorities as Array<{ id: string }>) {
    if (!AUTHORITY_SET.has(authority.id)) {
      pushUnique(blockers, blocker('AUTHORITY_UNREGISTERED', `State authority ${authority.id} is not registered.`));
    } else if (authorityIds.has(authority.id)) {
      pushUnique(
        blockers,
        blocker('AUTHORITY_DUPLICATE', `State authority ${authority.id} is registered more than once.`, {
          authorityId: authority.id as StateAuthorityId,
        })
      );
    }
    authorityIds.add(authority.id);
  }

  const mappings = new Map<string, number>();
  for (const mapping of inventory.logicalState as Array<{ id: string; authorityIds: string[] }>) {
    mappings.set(mapping.id, (mappings.get(mapping.id) ?? 0) + 1);
    if (!LOGICAL_STATE_SET.has(mapping.id)) {
      pushUnique(blockers, blocker('LOGICAL_STATE_UNREGISTERED', `Logical state ${mapping.id} is not registered.`));
    }
    for (const authorityId of mapping.authorityIds) {
      if (!AUTHORITY_SET.has(authorityId)) {
        pushUnique(
          blockers,
          blocker('MAPPING_AUTHORITY_UNREGISTERED', `Logical state ${mapping.id} uses unregistered ${authorityId}.`)
        );
      }
    }
  }

  for (const logicalStateId of REQUIRED_LOGICAL_STATE) {
    const count = mappings.get(logicalStateId) ?? 0;
    if (count === 0) {
      pushUnique(
        blockers,
        blocker('LOGICAL_STATE_UNMAPPED', `Logical state ${logicalStateId} is not mapped.`, { logicalStateId })
      );
    } else if (count > 1) {
      pushUnique(
        blockers,
        blocker('LOGICAL_STATE_DUPLICATE', `Logical state ${logicalStateId} is mapped more than once.`, {
          logicalStateId,
        })
      );
    }
  }
}

function validateSelection(
  request: WaylandTransferPreflightRequest,
  blockers: WaylandTransferPreflightFinding[]
): LogicalStateId[] {
  const selected: LogicalStateId[] = [];
  const seen = new Set<string>();
  if (!Array.isArray(request.selectedLogicalState)) {
    pushUnique(blockers, blocker('SELECTION_INVALID', 'Selected logical state must be an array.'));
    return [];
  }
  for (const rawId of request.selectedLogicalState as unknown[]) {
    if (typeof rawId !== 'string') {
      pushUnique(blockers, blocker('SELECTION_INVALID', 'Every selected logical state must be a string.'));
      continue;
    }
    if (!LOGICAL_STATE_SET.has(rawId)) {
      pushUnique(blockers, blocker('SELECTION_UNKNOWN_STATE', `Selected logical state ${rawId} is not registered.`));
      continue;
    }
    if (seen.has(rawId)) {
      pushUnique(
        blockers,
        blocker('SELECTION_DUPLICATE_STATE', `Selected logical state ${rawId} appears more than once.`, {
          logicalStateId: rawId as LogicalStateId,
        })
      );
      continue;
    }
    seen.add(rawId);
    selected.push(rawId as LogicalStateId);
  }

  if (request.scope === 'selected' && selected.length === 0) {
    pushUnique(blockers, blocker('SELECTION_EMPTY', 'Selected scope requires at least one registered state family.'));
  }
  if (request.scope === 'full') {
    for (const logicalStateId of REQUIRED_LOGICAL_STATE) {
      if (!seen.has(logicalStateId)) {
        pushUnique(
          blockers,
          blocker('FULL_SCOPE_INCOMPLETE', `Full scope omits ${logicalStateId}.`, { logicalStateId })
        );
      }
    }
  }
  return request.scope === 'full' ? [...REQUIRED_LOGICAL_STATE] : selected;
}

function validateAuthorization(
  request: WaylandTransferPreflightRequest,
  selected: LogicalStateId[],
  now: Date,
  blockers: WaylandTransferPreflightFinding[]
): void {
  if (request.ownerConfirmed !== true) {
    pushUnique(blockers, blocker('OWNER_CONFIRMATION_REQUIRED', 'The data owner must explicitly confirm this preflight.'));
  }
  if (request.stepUpAuthenticated !== true) {
    pushUnique(blockers, blocker('STEP_UP_REQUIRED', 'A fresh step-up authentication is required.'));
  }

  if (request.mode === 'recovery') {
    if (!request.recoveryCredentialReady) {
      pushUnique(blockers, blocker('RECOVERY_CREDENTIAL_REQUIRED', 'Recovery mode requires a ready recovery credential.'));
    }
    if (request.destination) {
      pushUnique(blockers, blocker('DESTINATION_NOT_ALLOWED', 'Recovery mode cannot consume a destination binding.'));
    }
    return;
  }

  const destination = request.destination as unknown;
  if (!destination || typeof destination !== 'object' || Array.isArray(destination)) {
    pushUnique(blockers, blocker('DESTINATION_BINDING_REQUIRED', 'Destination-bound mode requires a binding.'));
    return;
  }
  const binding = destination as Record<string, unknown>;
  if (
    typeof binding.instanceId !== 'string' ||
    !binding.instanceId.trim() ||
    typeof binding.principalId !== 'string' ||
    !binding.principalId.trim() ||
    typeof binding.publicKeyFingerprint !== 'string' ||
    !binding.publicKeyFingerprint.trim() ||
    (binding.tenantId !== undefined && (typeof binding.tenantId !== 'string' || !binding.tenantId.trim()))
  ) {
    pushUnique(blockers, blocker('DESTINATION_IDENTITY_INVALID', 'Destination identity fields must be non-empty.'));
  }

  const expiry = typeof binding.expiresAt === 'string' ? Date.parse(binding.expiresAt) : Number.NaN;
  if (!Number.isFinite(expiry)) {
    pushUnique(blockers, blocker('DESTINATION_EXPIRY_INVALID', 'Destination expiry is not a valid timestamp.'));
  } else if (expiry <= now.getTime()) {
    pushUnique(blockers, blocker('DESTINATION_BINDING_EXPIRED', 'Destination binding has expired.'));
  } else if (expiry - now.getTime() > MAX_DESTINATION_BINDING_MS) {
    pushUnique(blockers, blocker('DESTINATION_BINDING_TOO_LONG', 'Destination binding exceeds 15 minutes.'));
  }

  const approved = new Set<string>();
  if (!Array.isArray(binding.approvedLogicalState)) {
    pushUnique(blockers, blocker('DESTINATION_SCOPE_INVALID', 'Destination approval must be an array.'));
    return;
  }
  for (const rawId of binding.approvedLogicalState) {
    if (typeof rawId !== 'string') {
      pushUnique(blockers, blocker('DESTINATION_SCOPE_INVALID', 'Every destination approval must be a string.'));
      continue;
    }
    if (!LOGICAL_STATE_SET.has(rawId)) {
      pushUnique(blockers, blocker('DESTINATION_SCOPE_UNKNOWN', `Destination approves unknown state ${rawId}.`));
    } else if (approved.has(rawId)) {
      pushUnique(
        blockers,
        blocker('DESTINATION_SCOPE_DUPLICATE', `Destination approves ${rawId} more than once.`, {
          logicalStateId: rawId as LogicalStateId,
        })
      );
    }
    approved.add(rawId);
  }
  for (const logicalStateId of selected) {
    if (!approved.has(logicalStateId)) {
      pushUnique(
        blockers,
        blocker('DESTINATION_SCOPE_WIDENING', `Requested state ${logicalStateId} exceeds destination approval.`, {
          logicalStateId,
        })
      );
    }
  }
}

function familyPreview(
  inventory: RecoveryInventory,
  id: LogicalStateId,
  selected: boolean
): WaylandTransferInventoryFamilyPreview {
  const mapping = inventory.logicalState.find((entry) => entry.id === id);
  const authorities = (mapping?.authorityIds ?? []).filter((authorityId) => AUTHORITY_SET.has(authorityId));
  let estimatedBytes = 0;
  let fileCount = 0;
  let sensitive = false;
  for (const authorityId of authorities) {
    const authority = inventory.authorities.find((entry) => entry.id === authorityId);
    if (!authority) continue;
    sensitive ||= authority.sensitive;
    for (const evidence of authority.evidence) {
      estimatedBytes += Math.max(0, evidence.size);
      fileCount += Math.max(0, evidence.fileCount);
    }
  }

  const executableCapable = EXECUTABLE_FAMILIES.has(id);
  const disposition = selected ? (FAMILY_DISPOSITIONS[id] ?? 'included') : 'excluded';
  const reason = !selected
    ? 'This state family is outside the explicitly selected transfer scope.'
    : executableCapable
    ? 'Imported executable-capable state remains paused and requires quarantine review before activation.'
    : id === 'credentials.secrets'
      ? 'Credential material is excluded from portable copy and must be reconnected at the destination.'
      : id === 'external.workspaces'
        ? 'External workspace content remains user-owned and is transferred as a reference only.'
        : id === 'external.backend-handles'
          ? 'External backend configuration remains reference-only and may require reconnection.'
          : id === 'updater.release-channel'
            ? 'Updater state is instance-specific and excluded from transfer.'
            : undefined;

  return {
    id,
    disposition,
    authorityIds: authorities,
    sensitive,
    executableCapable,
    activation: selected && executableCapable ? 'paused-quarantine-required' : 'not-applicable',
    estimatedBytes,
    fileCount,
    ...(reason ? { reason } : {}),
  };
}

function summarize(families: WaylandTransferInventoryFamilyPreview[]): WaylandTransferPreflightSummary {
  const summary = { included: emptyTotals(), reference: emptyTotals(), excluded: emptyTotals() };
  for (const family of families) {
    const bucket =
      family.disposition === 'included'
        ? summary.included
        : family.disposition === 'reference-only'
          ? summary.reference
          : summary.excluded;
    bucket.familyCount += 1;
    bucket.fileCount += family.fileCount;
    bucket.estimatedBytes += family.estimatedBytes;
  }
  return summary;
}

/**
 * Convert recovery discovery evidence into a strict transfer preview. The
 * result never contains source paths and never creates or mutates an export.
 */
export function evaluateWaylandTransferInventoryPreflight(
  request: WaylandTransferPreflightRequest,
  inventory: RecoveryInventory,
  recoveryCapabilities: RecoveryCaptureCapabilities,
  now = new Date()
): WaylandTransferInventoryPreflight {
  const blockers: WaylandTransferPreflightFinding[] = [];
  const warnings: WaylandTransferPreflightFinding[] = [];
  const mode = request.mode === 'recovery' ? 'recovery' : 'destination-bound';
  const scope = request.scope === 'full' ? 'full' : 'selected';
  if (request.mode !== 'destination-bound' && request.mode !== 'recovery') {
    pushUnique(blockers, blocker('MODE_INVALID', 'Transfer mode must be destination-bound or recovery.'));
  }
  if (request.scope !== 'full' && request.scope !== 'selected') {
    pushUnique(blockers, blocker('SCOPE_INVALID', 'Transfer scope must be full or selected.'));
  }
  const normalizedRequest: WaylandTransferPreflightRequest = { ...request, mode, scope };
  validateRegistry(inventory, blockers);
  const selected = validateSelection(normalizedRequest, blockers);
  validateAuthorization(normalizedRequest, selected, now, blockers);

  const recoveryDryRun = evaluateRecoveryDryRun(inventory, recoveryCapabilities);
  for (const finding of recoveryDryRun.blockers) {
    pushUnique(
      blockers,
      blocker(`RECOVERY_${finding.code}`, finding.message, {
        ...(finding.logicalStateId ? { logicalStateId: finding.logicalStateId } : {}),
        ...(finding.authorityId ? { authorityId: finding.authorityId } : {}),
      })
    );
  }
  for (const finding of recoveryDryRun.warnings) {
    pushUnique(
      warnings,
      warning(`RECOVERY_${finding.code}`, finding.message, {
        ...(finding.logicalStateId ? { logicalStateId: finding.logicalStateId } : {}),
        ...(finding.authorityId ? { authorityId: finding.authorityId } : {}),
      })
    );
  }

  const selectedSet = new Set(selected);
  const families = REQUIRED_LOGICAL_STATE.map((id) => familyPreview(inventory, id, selectedSet.has(id)));
  for (const family of families) {
    if (selectedSet.has(family.id) && family.executableCapable) {
      pushUnique(
        warnings,
        warning(
          'EXECUTABLE_IMPORT_QUARANTINED',
          `${family.id} will remain paused until quarantine review succeeds.`,
          { logicalStateId: family.id }
        )
      );
    }
    if (selectedSet.has(family.id) && family.disposition === 'reconnect-required') {
      pushUnique(
        warnings,
        warning('CREDENTIAL_RECONNECT_REQUIRED', 'Credentials must be reconnected after import.', {
          logicalStateId: family.id,
        })
      );
    }
  }

  return {
    contract: WAYLAND_TRANSFER_PREFLIGHT_CONTRACT,
    formatVersion: WAYLAND_TRANSFER_FORMAT_VERSION,
    dryRunOnly: true,
    mode,
    suite: mode === 'recovery' ? WAYLAND_TRANSFER_RECOVERY_SUITE : WAYLAND_TRANSFER_DESTINATION_SUITE,
    scope,
    readyToExport: blockers.length === 0,
    observedAt: inventory.observedAt,
    families,
    blockers,
    warnings,
    summary: summarize(families),
  };
}

export async function buildWaylandTransferInventoryPreflight(
  inputs: WaylandTransferInventoryPreflightInputs
): Promise<WaylandTransferInventoryPreflight> {
  const inventory = await inventoryRecoveryAuthorities(inputs.inventory);
  return evaluateWaylandTransferInventoryPreflight(
    inputs.request,
    inventory,
    inputs.recoveryCapabilities,
    inputs.now
  );
}
