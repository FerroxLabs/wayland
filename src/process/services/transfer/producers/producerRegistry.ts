/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogicalStateId } from '@process/services/recovery/recoveryManifest';
import {
  captureDesktopSettingsSnapshot,
  DESKTOP_SETTINGS_SNAPSHOT_CONTRACT,
  DESKTOP_SETTINGS_SNAPSHOT_SCHEMA_VERSION,
} from '@process/services/transfer/producers/settings';

import type { TransferProducerCaptureResult } from './captureEvidence';

export type TransferProducerRegistration = Readonly<{
  id: string;
  logicalStateId: LogicalStateId;
  outputContract: string;
  outputSchemaVersion: number;
  produce: () => Promise<TransferProducerCaptureResult>;
}>;

export type TransferProducerRegistryIssue = Readonly<{
  code: string;
  producerId?: string;
  logicalStateId?: LogicalStateId;
  message: string;
}>;

const SAFE_ID = /^[a-z0-9][a-z0-9._/-]{2,127}$/;

/**
 * Output contracts accepted by the format-v1 importer. A callable producer is
 * not export authority unless its exact output contract is accepted here.
 */
const ACCEPTED_OUTPUTS: ReadonlyMap<
  LogicalStateId,
  Readonly<{ id: string; contract: string; schemaVersion: number }>
> = new Map([
  [
    'desktop.preferences',
    {
      id: 'transfer.desktop-preferences-producer/v1',
      contract: DESKTOP_SETTINGS_SNAPSHOT_CONTRACT,
      schemaVersion: DESKTOP_SETTINGS_SNAPSHOT_SCHEMA_VERSION,
    },
  ],
]);

export const WAYLAND_TRANSFER_PRODUCER_REGISTRY: readonly TransferProducerRegistration[] = Object.freeze([
  Object.freeze({
    id: 'transfer.desktop-preferences-producer/v1',
    logicalStateId: 'desktop.preferences',
    outputContract: DESKTOP_SETTINGS_SNAPSHOT_CONTRACT,
    outputSchemaVersion: DESKTOP_SETTINGS_SNAPSHOT_SCHEMA_VERSION,
    produce: captureDesktopSettingsSnapshot,
  }),
]);

export function validateTransferProducerRegistry(
  registrations: readonly TransferProducerRegistration[]
): readonly TransferProducerRegistryIssue[] {
  const issues: TransferProducerRegistryIssue[] = [];
  const ids = new Set<string>();
  const logicalState = new Set<LogicalStateId>();

  for (const registration of registrations) {
    if (!SAFE_ID.test(registration.id)) {
      issues.push({
        code: 'PRODUCER_ID_INVALID',
        producerId: registration.id,
        logicalStateId: registration.logicalStateId,
        message: 'Transfer producer id is invalid.',
      });
    }
    if (ids.has(registration.id)) {
      issues.push({
        code: 'PRODUCER_ID_DUPLICATE',
        producerId: registration.id,
        logicalStateId: registration.logicalStateId,
        message: 'Transfer producer id is registered more than once.',
      });
    }
    if (logicalState.has(registration.logicalStateId)) {
      issues.push({
        code: 'PRODUCER_LOGICAL_STATE_DUPLICATE',
        producerId: registration.id,
        logicalStateId: registration.logicalStateId,
        message: 'Logical state has more than one accepted transfer producer.',
      });
    }
    ids.add(registration.id);
    logicalState.add(registration.logicalStateId);

    const accepted = ACCEPTED_OUTPUTS.get(registration.logicalStateId);
    if (
      !accepted ||
      accepted.id !== registration.id ||
      accepted.contract !== registration.outputContract ||
      accepted.schemaVersion !== registration.outputSchemaVersion
    ) {
      issues.push({
        code: 'PRODUCER_CONTRACT_UNACCEPTED',
        producerId: registration.id,
        logicalStateId: registration.logicalStateId,
        message: 'Transfer producer output contract is not accepted.',
      });
    }
    if (typeof registration.produce !== 'function') {
      issues.push({
        code: 'PRODUCER_NOT_EXECUTABLE',
        producerId: registration.id,
        logicalStateId: registration.logicalStateId,
        message: 'Transfer producer is not executable.',
      });
    }
  }
  return Object.freeze(issues);
}

export const WAYLAND_TRANSFER_PRODUCER_REGISTRY_ISSUES = validateTransferProducerRegistry(
  WAYLAND_TRANSFER_PRODUCER_REGISTRY
);

export function resolveAcceptedTransferProducer(
  logicalStateId: LogicalStateId,
  producerId: string,
  registrations: readonly TransferProducerRegistration[] = WAYLAND_TRANSFER_PRODUCER_REGISTRY
): TransferProducerRegistration | undefined {
  if (validateTransferProducerRegistry(registrations).length > 0) return undefined;
  return registrations.find(
    (registration) => registration.logicalStateId === logicalStateId && registration.id === producerId
  );
}
