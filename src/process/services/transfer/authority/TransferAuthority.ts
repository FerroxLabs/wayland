/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type {
  IssuedDestinationKey,
  TransferAuthorityContext,
  TransferAuthorizationAction,
  TransferAuthorizationReceipt,
  TransferBinding,
  TransferDirection,
  TransferScope,
  VerifiedOsStepUp,
} from './types';
import { TRANSFER_AUTHORIZATION_RECEIPT_CONTRACT } from './types';

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const MAX_KEY_LIFETIME_MS = 15 * 60 * 1000;
const MAX_STEP_UP_AGE_MS = 5 * 60 * 1000;
const MAX_ID_LENGTH = 256;
const ALL_SCOPES = new Set<string>([
  'profile',
  'settings',
  'chats',
  'projects',
  'files',
  'archives',
  'memory',
  'skills',
  'workflows',
  'full',
  'sensitive',
  'executable',
  'agents',
  'schedules',
  'channels',
  'teams',
  'connectors',
]);
const PRIVILEGED_SCOPES = new Set<TransferScope>(['full', 'sensitive', 'executable']);
const FORBIDDEN_SCOPES = new Set<TransferScope>(['agents', 'schedules', 'channels', 'teams', 'connectors']);

export type TransferAuthorityErrorCode =
  | 'INVALID_REQUEST'
  | 'DENIED_IDENTITY'
  | 'DENIED_SCOPE'
  | 'STEP_UP_REQUIRED'
  | 'STALE_STEP_UP'
  | 'BINDING_MISMATCH'
  | 'SCOPE_WIDENING'
  | 'POLICY_DRIFT'
  | 'APPROVAL_DRIFT'
  | 'DRY_RUN_DRIFT'
  | 'EXPIRED'
  | 'REVOKED'
  | 'CONSUMED'
  | 'NOT_FOUND';

export class TransferAuthorityError extends Error {
  constructor(
    readonly code: TransferAuthorityErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'TransferAuthorityError';
  }
}

export type TransferKeyRequest = Readonly<{
  direction: TransferDirection;
  scopes: readonly TransferScope[];
  requestFingerprint: `sha256:${string}`;
  approvalPolicyFingerprint: `sha256:${string}`;
  lifetimeMs: number;
  stepUpEvidence?: unknown;
}>;

export type TransferDryRunApproval = Readonly<{
  transferId: string;
  destinationKey: string;
  scopes: readonly TransferScope[];
  requestFingerprint: `sha256:${string}`;
  approvalPolicyFingerprint: `sha256:${string}`;
  dryRunDigest: `sha256:${string}`;
  approvalFingerprint: `sha256:${string}`;
  stepUpEvidence?: unknown;
}>;

export type TransferPublicationApproval = Readonly<{
  transferId: string;
  scopes: readonly TransferScope[];
  requestFingerprint: `sha256:${string}`;
  approvalPolicyFingerprint: `sha256:${string}`;
  dryRunDigest: `sha256:${string}`;
  dryRunApprovalFingerprint: `sha256:${string}`;
  publicationApprovalFingerprint: `sha256:${string}`;
  stepUpEvidence?: unknown;
}>;

type TransferRecord = {
  binding: TransferBinding;
  bindingFingerprint: `sha256:${string}`;
  scopeFingerprint: `sha256:${string}`;
  destinationKeySha256: `sha256:${string}`;
  issuedAt: Date;
  expiresAt: Date;
  state: 'key-issued' | 'dry-run-approved' | 'publication-approved' | 'revoked';
  dryRunDigest: `sha256:${string}` | null;
  dryRunApprovalFingerprint: `sha256:${string}` | null;
};

export type TransferAuthorityDependencies = Readonly<{
  now?: () => Date;
  createId?: () => string;
  createSecret?: () => string;
  verifyOsStepUp?: (evidence: unknown, binding: TransferBinding) => VerifiedOsStepUp;
}>;

function sha256(value: string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

function canonicalBinding(binding: TransferBinding): string {
  return JSON.stringify({
    direction: binding.direction,
    instanceId: binding.instanceId,
    principalId: binding.principalId,
    tenantId: binding.tenantId,
    scopes: binding.scopes,
    policyVersion: binding.policyVersion,
    requestFingerprint: binding.requestFingerprint,
    approvalPolicyFingerprint: binding.approvalPolicyFingerprint,
  });
}

function assertId(value: string, label: string): void {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_ID_LENGTH ||
    value !== value.normalize('NFC') ||
    /\p{Cc}/u.test(value)
  ) {
    throw new TransferAuthorityError('INVALID_REQUEST', `${label} is invalid.`);
  }
}

function assertFingerprint(value: string, label: string): asserts value is `sha256:${string}` {
  if (!SHA256_PATTERN.test(value)) {
    throw new TransferAuthorityError('INVALID_REQUEST', `${label} is invalid.`);
  }
}

function canonicalScopes(scopes: readonly TransferScope[]): readonly TransferScope[] {
  if (!Array.isArray(scopes) || scopes.length === 0 || new Set(scopes).size !== scopes.length) {
    throw new TransferAuthorityError('INVALID_REQUEST', 'Transfer scopes must be non-empty and unique.');
  }
  if (scopes.some((scope) => typeof scope !== 'string' || !ALL_SCOPES.has(scope))) {
    throw new TransferAuthorityError('INVALID_REQUEST', 'Transfer scope is unknown.');
  }
  const canonical = [...scopes].toSorted();
  if (canonical.some((scope, index) => scope !== scopes[index])) {
    throw new TransferAuthorityError('INVALID_REQUEST', 'Transfer scopes must be canonical.');
  }
  if (canonical.some((scope) => FORBIDDEN_SCOPES.has(scope))) {
    throw new TransferAuthorityError('DENIED_SCOPE', 'The requested transfer scope is permanently denied.');
  }
  return canonical;
}

function requiresStepUp(scopes: readonly TransferScope[]): boolean {
  return scopes.some((scope) => PRIVILEGED_SCOPES.has(scope));
}

export class TransferAuthority {
  private readonly records = new Map<string, TransferRecord>();
  private readonly consumedDestinationKeys = new Set<string>();
  private readonly consumedStepUps = new Set<string>();
  private readonly now: () => Date;
  private readonly createId: () => string;
  private readonly createSecret: () => string;
  private readonly verifyOsStepUp?: TransferAuthorityDependencies['verifyOsStepUp'];

  constructor(dependencies: TransferAuthorityDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? randomUUID;
    this.createSecret = dependencies.createSecret ?? (() => randomBytes(32).toString('base64url'));
    this.verifyOsStepUp = dependencies.verifyOsStepUp;
  }

  issueDestinationKey(request: TransferKeyRequest, context: TransferAuthorityContext): IssuedDestinationKey {
    this.assertInteractiveOwner(context);
    if (request.direction !== 'export' && request.direction !== 'import') {
      throw new TransferAuthorityError('INVALID_REQUEST', 'Transfer direction is invalid.');
    }
    const scopes = canonicalScopes(request.scopes);
    assertFingerprint(request.requestFingerprint, 'Transfer request fingerprint');
    assertFingerprint(request.approvalPolicyFingerprint, 'Transfer approval policy fingerprint');
    if (
      !Number.isSafeInteger(request.lifetimeMs) ||
      request.lifetimeMs <= 0 ||
      request.lifetimeMs > MAX_KEY_LIFETIME_MS
    ) {
      throw new TransferAuthorityError('INVALID_REQUEST', 'Destination key lifetime exceeds the fifteen minute limit.');
    }
    const binding = this.createBinding(request.direction, scopes, request, context);
    const stepUpFingerprint = this.claimFreshStepUp(binding, request.stepUpEvidence);
    const now = this.now();
    const transferId = this.createId();
    const destinationKey = this.createSecret();
    assertId(transferId, 'Transfer ID');
    if (this.records.has(transferId)) {
      throw new TransferAuthorityError('INVALID_REQUEST', 'Transfer ID source returned a duplicate identity.');
    }
    if (destinationKey.length < 32) {
      throw new TransferAuthorityError('INVALID_REQUEST', 'Destination key source returned insufficient entropy.');
    }
    const destinationKeySha256 = sha256(destinationKey);
    if (this.consumedDestinationKeys.has(destinationKeySha256)) {
      throw new TransferAuthorityError('INVALID_REQUEST', 'Destination key source returned a duplicate key.');
    }
    this.consumedDestinationKeys.add(destinationKeySha256);
    const scopeFingerprint = sha256(JSON.stringify(scopes));
    const bindingFingerprint = sha256(canonicalBinding(binding));
    const record: TransferRecord = {
      binding,
      bindingFingerprint,
      scopeFingerprint,
      destinationKeySha256,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + request.lifetimeMs),
      state: 'key-issued',
      dryRunDigest: null,
      dryRunApprovalFingerprint: null,
    };
    this.records.set(transferId, record);
    return {
      transferId,
      destinationKey,
      receipt: this.receipt(
        transferId,
        record,
        'destination-key-issued',
        record.expiresAt,
        sha256(
          JSON.stringify({
            action: 'destination-key-issued',
            bindingFingerprint,
            destinationKeySha256,
            expiresAt: record.expiresAt.toISOString(),
            stepUpFingerprint,
          })
        )
      ),
    };
  }

  approveDryRun(request: TransferDryRunApproval, context: TransferAuthorityContext): TransferAuthorizationReceipt {
    this.assertInteractiveOwner(context);
    const record = this.requireUsableRecord(request.transferId);
    this.assertBinding(record, request.scopes, request.requestFingerprint, request.approvalPolicyFingerprint, context);
    if (record.state !== 'key-issued') {
      throw new TransferAuthorityError('CONSUMED', 'Destination key has already been consumed.');
    }
    if (sha256(request.destinationKey) !== record.destinationKeySha256) {
      throw new TransferAuthorityError('BINDING_MISMATCH', 'Destination key is not bound to this transfer.');
    }
    assertFingerprint(request.dryRunDigest, 'Dry-run digest');
    assertFingerprint(request.approvalFingerprint, 'Dry-run approval fingerprint');
    this.claimFreshStepUp(record.binding, request.stepUpEvidence);
    record.state = 'dry-run-approved';
    record.dryRunDigest = request.dryRunDigest;
    record.dryRunApprovalFingerprint = request.approvalFingerprint;
    return this.receipt(
      request.transferId,
      record,
      'dry-run-approved',
      null,
      sha256(
        JSON.stringify({
          action: 'dry-run-approved',
          bindingFingerprint: record.bindingFingerprint,
          dryRunDigest: request.dryRunDigest,
          approvalFingerprint: request.approvalFingerprint,
        })
      )
    );
  }

  approvePublication(
    request: TransferPublicationApproval,
    context: TransferAuthorityContext
  ): TransferAuthorizationReceipt {
    this.assertInteractiveOwner(context);
    const record = this.requireUsableRecord(request.transferId);
    this.assertBinding(record, request.scopes, request.requestFingerprint, request.approvalPolicyFingerprint, context);
    if (record.state !== 'dry-run-approved') {
      throw new TransferAuthorityError('CONSUMED', 'Transfer is not awaiting publication approval.');
    }
    assertFingerprint(request.dryRunDigest, 'Dry-run digest');
    assertFingerprint(request.dryRunApprovalFingerprint, 'Dry-run approval fingerprint');
    assertFingerprint(request.publicationApprovalFingerprint, 'Publication approval fingerprint');
    if (request.dryRunDigest !== record.dryRunDigest) {
      throw new TransferAuthorityError('DRY_RUN_DRIFT', 'Dry-run evidence changed after approval.');
    }
    if (
      request.dryRunApprovalFingerprint !== record.dryRunApprovalFingerprint ||
      request.publicationApprovalFingerprint === record.dryRunApprovalFingerprint
    ) {
      throw new TransferAuthorityError('APPROVAL_DRIFT', 'Publication approval is not separate and bound.');
    }
    this.claimFreshStepUp(record.binding, request.stepUpEvidence);
    record.state = 'publication-approved';
    return this.receipt(
      request.transferId,
      record,
      'publication-approved',
      null,
      sha256(
        JSON.stringify({
          action: 'publication-approved',
          bindingFingerprint: record.bindingFingerprint,
          dryRunDigest: request.dryRunDigest,
          dryRunApprovalFingerprint: request.dryRunApprovalFingerprint,
          publicationApprovalFingerprint: request.publicationApprovalFingerprint,
        })
      )
    );
  }

  revoke(transferId: string, context: TransferAuthorityContext): void {
    this.assertInteractiveOwner(context);
    const record = this.records.get(transferId);
    if (!record) throw new TransferAuthorityError('NOT_FOUND', 'Transfer authorization was not found.');
    this.assertContextBinding(record, context);
    record.state = 'revoked';
  }

  private createBinding(
    direction: TransferDirection,
    scopes: readonly TransferScope[],
    request: Pick<TransferKeyRequest, 'requestFingerprint' | 'approvalPolicyFingerprint'>,
    context: TransferAuthorityContext
  ): TransferBinding {
    assertId(context.instanceId, 'Instance ID');
    assertId(context.principalId, 'Principal ID');
    assertId(context.tenantId, 'Tenant ID');
    assertId(context.policyVersion, 'Policy version');
    return {
      direction,
      instanceId: context.instanceId,
      principalId: context.principalId,
      tenantId: context.tenantId,
      scopes,
      policyVersion: context.policyVersion,
      requestFingerprint: request.requestFingerprint,
      approvalPolicyFingerprint: request.approvalPolicyFingerprint,
    };
  }

  private assertInteractiveOwner(context: TransferAuthorityContext): void {
    if (context.requesterKind !== 'interactive-profile-owner' || context.isActiveProfileOwner !== true) {
      throw new TransferAuthorityError('DENIED_IDENTITY', 'Only the interactive active profile owner is authorized.');
    }
  }

  private requireUsableRecord(transferId: string): TransferRecord {
    const record = this.records.get(transferId);
    if (!record) throw new TransferAuthorityError('NOT_FOUND', 'Transfer authorization was not found.');
    if (record.state === 'revoked') throw new TransferAuthorityError('REVOKED', 'Transfer authorization was revoked.');
    if (this.now().getTime() >= record.expiresAt.getTime()) {
      throw new TransferAuthorityError('EXPIRED', 'Transfer authorization expired.');
    }
    return record;
  }

  private assertBinding(
    record: TransferRecord,
    scopes: readonly TransferScope[],
    requestFingerprint: string,
    approvalPolicyFingerprint: string,
    context: TransferAuthorityContext
  ): void {
    this.assertContextBinding(record, context);
    const requestedScopes = canonicalScopes(scopes);
    const granted = new Set(record.binding.scopes);
    if (requestedScopes.some((scope) => !granted.has(scope))) {
      throw new TransferAuthorityError('SCOPE_WIDENING', 'Transfer scope cannot be widened after key issuance.');
    }
    if (requestedScopes.length !== record.binding.scopes.length) {
      throw new TransferAuthorityError('BINDING_MISMATCH', 'Transfer scope changed after key issuance.');
    }
    if (requestFingerprint !== record.binding.requestFingerprint) {
      throw new TransferAuthorityError('BINDING_MISMATCH', 'Transfer request fingerprint changed.');
    }
    if (approvalPolicyFingerprint !== record.binding.approvalPolicyFingerprint) {
      throw new TransferAuthorityError('APPROVAL_DRIFT', 'Transfer approval policy changed.');
    }
  }

  private assertContextBinding(record: TransferRecord, context: TransferAuthorityContext): void {
    if (
      context.instanceId !== record.binding.instanceId ||
      context.principalId !== record.binding.principalId ||
      context.tenantId !== record.binding.tenantId
    ) {
      throw new TransferAuthorityError('BINDING_MISMATCH', 'Transfer identity binding changed.');
    }
    if (context.policyVersion !== record.binding.policyVersion) {
      throw new TransferAuthorityError('POLICY_DRIFT', 'Transfer policy version changed.');
    }
  }

  private claimFreshStepUp(binding: TransferBinding, evidence: unknown): string | null {
    const fingerprint = this.requireFreshStepUp(binding, evidence);
    if (fingerprint && this.consumedStepUps.has(fingerprint)) {
      throw new TransferAuthorityError('STALE_STEP_UP', 'OS step-up evidence has already been used.');
    }
    if (fingerprint) this.consumedStepUps.add(fingerprint);
    return fingerprint;
  }

  private requireFreshStepUp(binding: TransferBinding, evidence: unknown): string | null {
    if (!requiresStepUp(binding.scopes)) return null;
    if (!this.verifyOsStepUp || evidence === undefined) {
      throw new TransferAuthorityError('STEP_UP_REQUIRED', 'Fresh OS-backed step-up is required.');
    }
    let verified: VerifiedOsStepUp;
    try {
      verified = this.verifyOsStepUp(evidence, binding);
    } catch {
      throw new TransferAuthorityError('STEP_UP_REQUIRED', 'OS-backed step-up verification failed.');
    }
    if (
      verified.provider !== 'darwin-local-authentication' &&
      verified.provider !== 'windows-hello' &&
      verified.provider !== 'linux-polkit'
    ) {
      throw new TransferAuthorityError('STEP_UP_REQUIRED', 'OS-backed step-up provider is invalid.');
    }
    assertFingerprint(verified.evidenceFingerprint, 'OS step-up evidence fingerprint');
    if (
      verified.instanceId !== binding.instanceId ||
      verified.principalId !== binding.principalId ||
      verified.tenantId !== binding.tenantId
    ) {
      throw new TransferAuthorityError('BINDING_MISMATCH', 'OS step-up identity is not bound to the transfer.');
    }
    if (!(verified.verifiedAt instanceof Date)) {
      throw new TransferAuthorityError('STEP_UP_REQUIRED', 'OS-backed step-up timestamp is invalid.');
    }
    const age = this.now().getTime() - verified.verifiedAt.getTime();
    if (!Number.isFinite(age) || age < 0 || age > MAX_STEP_UP_AGE_MS) {
      throw new TransferAuthorityError('STALE_STEP_UP', 'OS step-up is not fresh.');
    }
    return verified.evidenceFingerprint;
  }

  private receipt(
    transferId: string,
    record: TransferRecord,
    action: TransferAuthorizationAction,
    expiresAt: Date | null,
    authorizationFingerprint: `sha256:${string}`
  ): TransferAuthorizationReceipt {
    return {
      contract: TRANSFER_AUTHORIZATION_RECEIPT_CONTRACT,
      receiptId: this.createId(),
      transferId,
      action,
      direction: record.binding.direction,
      bindingFingerprint: record.bindingFingerprint,
      scopeFingerprint: record.scopeFingerprint,
      authorizationFingerprint,
      policyVersion: record.binding.policyVersion,
      authorizedAt: this.now().toISOString(),
      expiresAt: expiresAt?.toISOString() ?? null,
    };
  }
}
