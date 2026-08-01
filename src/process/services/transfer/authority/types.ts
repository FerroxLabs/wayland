/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRANSFER_AUTHORITY_CONTRACT = 'wayland-transfer-authority/1.0' as const;
export const TRANSFER_AUTHORIZATION_RECEIPT_CONTRACT = 'wayland-transfer-authorization-receipt/1.0' as const;

export type TransferDirection = 'export' | 'import';

/** `full` is the complete portable user-data set, excluding permanently denied scopes. */
export type TransferScope =
  | 'profile'
  | 'settings'
  | 'chats'
  | 'projects'
  | 'files'
  | 'archives'
  | 'memory'
  | 'skills'
  | 'workflows'
  | 'full'
  | 'sensitive'
  | 'executable'
  | 'agents'
  | 'schedules'
  | 'channels'
  | 'teams'
  | 'connectors';

export type TransferRequesterKind =
  | 'interactive-profile-owner'
  | 'agent'
  | 'schedule'
  | 'channel'
  | 'team'
  | 'connector'
  | 'background';

export type TransferAuthorityContext = Readonly<{
  requesterKind: TransferRequesterKind;
  isActiveProfileOwner: boolean;
  instanceId: string;
  principalId: string;
  tenantId: string;
  policyVersion: string;
}>;

export type TransferBinding = Readonly<{
  direction: TransferDirection;
  instanceId: string;
  principalId: string;
  tenantId: string;
  scopes: readonly TransferScope[];
  policyVersion: string;
  requestFingerprint: `sha256:${string}`;
  approvalPolicyFingerprint: `sha256:${string}`;
}>;

export type VerifiedOsStepUp = Readonly<{
  provider: 'darwin-local-authentication' | 'windows-hello' | 'linux-polkit';
  verifiedAt: Date;
  instanceId: string;
  principalId: string;
  tenantId: string;
  evidenceFingerprint: `sha256:${string}`;
}>;

export type TransferAuthorizationAction = 'destination-key-issued' | 'dry-run-approved' | 'publication-approved';

/** Deliberately excludes payload names, paths, content, and secrets. */
export type TransferAuthorizationReceipt = Readonly<{
  contract: typeof TRANSFER_AUTHORIZATION_RECEIPT_CONTRACT;
  receiptId: string;
  transferId: string;
  action: TransferAuthorizationAction;
  direction: TransferDirection;
  bindingFingerprint: `sha256:${string}`;
  scopeFingerprint: `sha256:${string}`;
  authorizationFingerprint: `sha256:${string}`;
  policyVersion: string;
  authorizedAt: string;
  expiresAt: string | null;
}>;

export type IssuedDestinationKey = Readonly<{
  transferId: string;
  destinationKey: string;
  receipt: TransferAuthorizationReceipt;
}>;
