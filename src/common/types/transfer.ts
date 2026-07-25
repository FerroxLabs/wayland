/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogicalStateId, StateAuthorityId } from '@/process/services/recovery/recoveryManifest';

export const WAYLAND_TRANSFER_FORMAT_VERSION = 1 as const;
export const WAYLAND_TRANSFER_PREFLIGHT_CONTRACT = 'wayland-transfer-preflight/1.0' as const;
export const WAYLAND_TRANSFER_DESTINATION_SUITE = 'WT-D1' as const;
export const WAYLAND_TRANSFER_RECOVERY_SUITE = 'WT-R1' as const;

export type WaylandTransferMode = 'destination-bound' | 'recovery';
export type WaylandTransferSuite = typeof WAYLAND_TRANSFER_DESTINATION_SUITE | typeof WAYLAND_TRANSFER_RECOVERY_SUITE;
export type WaylandTransferScope = 'full' | 'selected';

export type WaylandTransferDestinationBinding = {
  instanceId: string;
  principalId: string;
  tenantId?: string;
  publicKeyFingerprint: string;
  expiresAt: string;
  approvedLogicalState: LogicalStateId[];
};

export type WaylandTransferPreflightRequest = {
  mode: WaylandTransferMode;
  scope: WaylandTransferScope;
  selectedLogicalState: LogicalStateId[];
  ownerConfirmed: boolean;
  stepUpAuthenticated: boolean;
  destination?: WaylandTransferDestinationBinding;
  recoveryCredentialReady?: boolean;
};

export type WaylandTransferFamilyDisposition =
  | 'included'
  | 'reference-only'
  | 'reconnect-required'
  | 'excluded'
  | 'blocked';

export type WaylandTransferFamilyPreview = {
  id: LogicalStateId;
  disposition: WaylandTransferFamilyDisposition;
  authorityIds: StateAuthorityId[];
  sensitive: boolean;
  executableCapable: boolean;
  estimatedBytes: number;
  fileCount: number;
  reason?: string;
};

export type WaylandTransferPreflightFinding = {
  code: string;
  severity: 'blocker' | 'warning';
  message: string;
  logicalStateId?: LogicalStateId;
  authorityId?: StateAuthorityId;
};

export type WaylandTransferPreflight = {
  contract: typeof WAYLAND_TRANSFER_PREFLIGHT_CONTRACT;
  formatVersion: typeof WAYLAND_TRANSFER_FORMAT_VERSION;
  dryRunOnly: true;
  mode: WaylandTransferMode;
  suite: WaylandTransferSuite;
  scope: WaylandTransferScope;
  readyToExport: boolean;
  observedAt: string;
  families: WaylandTransferFamilyPreview[];
  blockers: WaylandTransferPreflightFinding[];
  warnings: WaylandTransferPreflightFinding[];
};
