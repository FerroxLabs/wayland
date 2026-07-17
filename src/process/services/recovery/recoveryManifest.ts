/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { constants, createReadStream, type Stats } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import path from 'node:path';

export const RECOVERY_MANIFEST_FORMAT_VERSION = 2 as const;
const LEGACY_RECOVERY_MANIFEST_FORMAT_VERSION = 1 as const;

export const REQUIRED_STATE_AUTHORITIES = [
  'desktop.database',
  'desktop.config',
  'desktop.runtime-files',
  'constitution.filesystem',
  'constitution.revision-authority',
  'core.default-profile',
  'core.named-profiles',
  'credentials.key-material',
  'credentials.os-keychain',
  'updater.state',
  'external.agent-configs',
  'external.workspaces',
] as const;

/**
 * User-visible state domains that must be explicitly accounted for even when
 * several of them share one physical authority (for example schedules and
 * Projects both live in Desktop SQLite). This prevents a technically valid DB
 * copy from overclaiming that WebUI files, connector receipts, or external
 * agent configuration were covered too.
 */
export const REQUIRED_LOGICAL_STATE = [
  'desktop.chats-projects',
  'desktop.scheduler',
  'desktop.workflows-teams',
  'desktop.artifacts-receipts',
  'desktop.webui',
  'desktop.preferences',
  'core.engine-state',
  'external.backend-handles',
  'credentials.secrets',
  'updater.release-channel',
  'external.workspaces',
] as const;

export type StateAuthorityId = (typeof REQUIRED_STATE_AUTHORITIES)[number];
export type LogicalStateId = (typeof REQUIRED_LOGICAL_STATE)[number];
export type ExternalReferenceState = 'file' | 'directory' | 'symlink' | 'absent' | 'unreadable';
export type AuthorityCoverage = 'copied' | 'encrypted-copy' | 'reference-only' | 'absent' | 'excluded' | 'missing';
export type AuthorityConsistency =
  | 'sqlite-online-backup'
  | 'quiesced-copy'
  | 'immutable-copy'
  | 'reference-snapshot'
  | 'not-applicable'
  | 'unproven';

export type RecoveryManifestFile = {
  id: string;
  authority: StateAuthorityId;
  logicalRole: string;
  sourcePath: string;
  snapshotPath: string;
  /** Canonical authority-scoped path inside an isolated restore root. */
  restorePath: string;
  size: number;
  mtimeMs: number;
  sha256: string;
  sensitive: boolean;
  copyPolicy: 'copied' | 'encrypted-copy';
  state: 'complete' | 'incomplete';
};

export type RecoveryManifestAuthority = {
  id: StateAuthorityId;
  sourceRoot: string;
  coverage: AuthorityCoverage;
  consistency: AuthorityConsistency;
  requiredForRestore: boolean;
  sensitive: boolean;
  fileIds: string[];
  /** OS-vault binding for encrypted state that can only be restored on this device. */
  credentialBinding?: {
    scope: 'same-device';
    backend: 'electron-safe-storage';
    envelope: 'constitution-revision-authority/v3';
  };
  /** The authority was present but contained no files at capture time. */
  empty?: true;
  note?: string;
};

export type RecoveryManifestLogicalState = {
  id: LogicalStateId;
  status: 'accounted' | 'reference-only' | 'excluded' | 'missing';
  authorityIds: StateAuthorityId[];
  note: string;
};

export type RecoveryManifest = {
  formatVersion: typeof RECOVERY_MANIFEST_FORMAT_VERSION;
  snapshotId: string;
  state: 'complete' | 'incomplete';
  createdAt: string;
  reason: 'pre-migration' | 'pre-update' | 'manual' | 'recovery-test';
  sourceAppVersion: string;
  sourceReleaseTrack: 'stable' | 'preview';
  targetAppVersion?: string;
  desktopSchemaVersion: number;
  platform: NodeJS.Platform;
  arch: string;
  mutationEpoch: { start: string; end: string };
  authorities: RecoveryManifestAuthority[];
  logicalState: RecoveryManifestLogicalState[];
  files: RecoveryManifestFile[];
  externalWorkspaces: Array<{
    projectId: string;
    path: string;
    state: ExternalReferenceState;
    copyPolicy: 'reference-only';
  }>;
  externalAgentConfigs: Array<{
    backendId: string;
    path: string;
    state: ExternalReferenceState;
    copyPolicy: 'reference-only';
  }>;
};

export type RecoveryManifestIssue = {
  code: string;
  path: string;
  message: string;
};

export type RecoveryManifestValidation = {
  valid: boolean;
  errors: RecoveryManifestIssue[];
  warnings: RecoveryManifestIssue[];
};

const SHA256_RE = /^[a-f0-9]{64}$/;
const REQUIRED_STATE_AUTHORITY_SET = new Set<string>(REQUIRED_STATE_AUTHORITIES);
const REQUIRED_LOGICAL_STATE_SET = new Set<string>(REQUIRED_LOGICAL_STATE);
const AUTHORITY_COVERAGE_SET = new Set<string>([
  'copied',
  'encrypted-copy',
  'reference-only',
  'absent',
  'excluded',
  'missing',
]);
const AUTHORITY_CONSISTENCY_SET = new Set<string>([
  'sqlite-online-backup',
  'quiesced-copy',
  'immutable-copy',
  'reference-snapshot',
  'not-applicable',
  'unproven',
]);
const EXTERNAL_REFERENCE_STATE_SET = new Set<string>(['file', 'directory', 'symlink', 'absent', 'unreadable']);
const RESTORE_NAMESPACE: Partial<Record<StateAuthorityId, string>> = {
  'desktop.database': 'desktop/database/',
  'desktop.config': 'desktop/config/',
  'desktop.runtime-files': 'desktop/runtime/',
  'constitution.filesystem': 'constitution/files/',
  'constitution.revision-authority': 'desktop/constitution/',
  'core.default-profile': 'core/default/',
  'core.named-profiles': 'core/profiles/',
  'credentials.key-material': 'desktop/credentials/',
  'updater.state': 'desktop/updater/',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(code: string, issuePath: string, message: string): RecoveryManifestIssue {
  return { code, path: issuePath, message };
}

function canonicalContainedRelativePath(value: string): string | null {
  if (!value || value.includes('\0') || value.includes('\\')) return null;
  if (path.posix.isAbsolute(value) || /^[a-zA-Z]:\//.test(value)) return null;
  const normalized = path.posix.normalize(value);
  if (normalized === '.' || normalized !== value || normalized.startsWith('../')) return null;
  return normalized;
}

function validateExternalReferences(
  values: unknown[],
  idKey: 'projectId' | 'backendId',
  basePath: 'externalWorkspaces' | 'externalAgentConfigs',
  errors: RecoveryManifestIssue[]
): void {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    const entryPath = `${basePath}[${index}]`;
    if (!isRecord(value)) {
      errors.push(issue('EXTERNAL_REFERENCE_INVALID', entryPath, 'External reference must be an object.'));
      return;
    }
    const id = value[idKey];
    if (typeof id !== 'string' || id.trim().length === 0 || ids.has(id)) {
      errors.push(issue('EXTERNAL_REFERENCE_ID_INVALID', `${entryPath}.${idKey}`, 'Reference id must be unique.'));
    } else {
      ids.add(id);
    }
    if (typeof value.path !== 'string' || (!path.posix.isAbsolute(value.path) && !path.win32.isAbsolute(value.path))) {
      errors.push(issue('EXTERNAL_REFERENCE_PATH_INVALID', `${entryPath}.path`, 'Reference path must be absolute.'));
    }
    if (value.copyPolicy !== 'reference-only') {
      errors.push(
        issue(
          'EXTERNAL_REFERENCE_POLICY_INVALID',
          `${entryPath}.copyPolicy`,
          'External state must remain reference-only.'
        )
      );
    }
    if (typeof value.state !== 'string' || !EXTERNAL_REFERENCE_STATE_SET.has(value.state)) {
      errors.push(
        issue('EXTERNAL_REFERENCE_STATE_INVALID', `${entryPath}.state`, 'External reference state must be explicit.')
      );
    }
  });
}

export function validateRecoveryManifest(value: unknown): RecoveryManifestValidation {
  const errors: RecoveryManifestIssue[] = [];
  const warnings: RecoveryManifestIssue[] = [];

  if (!isRecord(value)) {
    return { valid: false, errors: [issue('MANIFEST_NOT_OBJECT', '$', 'Manifest must be an object.')], warnings };
  }

  const isLegacyManifest = value.formatVersion === LEGACY_RECOVERY_MANIFEST_FORMAT_VERSION;
  if (!isLegacyManifest && value.formatVersion !== RECOVERY_MANIFEST_FORMAT_VERSION) {
    errors.push(issue('FORMAT_UNSUPPORTED', 'formatVersion', 'Unsupported recovery manifest format.'));
  }
  if (value.state !== 'complete') {
    errors.push(issue('SNAPSHOT_INCOMPLETE', 'state', 'Only complete recovery points may be restored.'));
  }
  if (typeof value.snapshotId !== 'string' || value.snapshotId.length === 0) {
    errors.push(issue('SNAPSHOT_ID_INVALID', 'snapshotId', 'snapshotId must be a non-empty string.'));
  } else if (!/^[a-zA-Z0-9._-]+$/.test(value.snapshotId) || value.snapshotId === '.' || value.snapshotId === '..') {
    errors.push(issue('SNAPSHOT_ID_UNSAFE', 'snapshotId', 'snapshotId must be a safe path segment.'));
  }
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) {
    errors.push(issue('CREATED_AT_INVALID', 'createdAt', 'createdAt must be an ISO-compatible timestamp.'));
  }
  if (typeof value.sourceAppVersion !== 'string' || value.sourceAppVersion.length === 0) {
    errors.push(issue('SOURCE_VERSION_INVALID', 'sourceAppVersion', 'sourceAppVersion is required.'));
  }
  if (
    value.reason !== 'pre-migration' &&
    value.reason !== 'pre-update' &&
    value.reason !== 'manual' &&
    value.reason !== 'recovery-test'
  ) {
    errors.push(issue('REASON_INVALID', 'reason', 'reason must identify a supported recovery-point trigger.'));
  }
  if (value.sourceReleaseTrack !== 'stable' && value.sourceReleaseTrack !== 'preview') {
    errors.push(issue('RELEASE_TRACK_INVALID', 'sourceReleaseTrack', 'sourceReleaseTrack must be stable or preview.'));
  }
  if (value.targetAppVersion !== undefined && (typeof value.targetAppVersion !== 'string' || !value.targetAppVersion)) {
    errors.push(issue('TARGET_VERSION_INVALID', 'targetAppVersion', 'targetAppVersion must be a non-empty string.'));
  }
  if (!Number.isSafeInteger(value.desktopSchemaVersion) || (value.desktopSchemaVersion as number) < 0) {
    errors.push(issue('SCHEMA_VERSION_INVALID', 'desktopSchemaVersion', 'desktopSchemaVersion must be non-negative.'));
  }
  if (typeof value.platform !== 'string' || value.platform.length === 0) {
    errors.push(issue('PLATFORM_INVALID', 'platform', 'platform is required.'));
  }
  if (typeof value.arch !== 'string' || value.arch.length === 0) {
    errors.push(issue('ARCH_INVALID', 'arch', 'arch is required.'));
  }

  const mutationEpoch = isRecord(value.mutationEpoch) ? value.mutationEpoch : null;
  if (
    !mutationEpoch ||
    typeof mutationEpoch.start !== 'string' ||
    typeof mutationEpoch.end !== 'string' ||
    mutationEpoch.start.length === 0 ||
    mutationEpoch.end.length === 0
  ) {
    errors.push(issue('MUTATION_EPOCH_INVALID', 'mutationEpoch', 'A start and end mutation epoch are required.'));
  } else if (mutationEpoch.start !== mutationEpoch.end) {
    errors.push(
      issue('MUTATION_DURING_SNAPSHOT', 'mutationEpoch', 'State changed while the recovery point was built.')
    );
  }

  const files = Array.isArray(value.files) ? value.files : [];
  if (!Array.isArray(value.files)) {
    errors.push(issue('FILES_INVALID', 'files', 'files must be an array.'));
  }
  const fileIds = new Set<string>();
  const validFileIds = new Set<string>();
  const snapshotPaths = new Set<string>();
  const restorePaths = new Set<string>();
  const fileAuthorityById = new Map<string, string>();
  const fileReferenceCount = new Map<string, number>();
  files.forEach((rawFile, index) => {
    const filePath = `files[${index}]`;
    if (!isRecord(rawFile)) {
      errors.push(issue('FILE_INVALID', filePath, 'File entry must be an object.'));
      return;
    }
    if (typeof rawFile.id !== 'string' || rawFile.id.length === 0 || fileIds.has(rawFile.id)) {
      errors.push(issue('FILE_ID_INVALID', `${filePath}.id`, 'File id must be non-empty and unique.'));
    } else {
      fileIds.add(rawFile.id);
      validFileIds.add(rawFile.id);
      if (typeof rawFile.authority === 'string') fileAuthorityById.set(rawFile.id, rawFile.authority);
    }
    if (typeof rawFile.authority !== 'string' || !REQUIRED_STATE_AUTHORITY_SET.has(rawFile.authority)) {
      errors.push(
        issue('FILE_AUTHORITY_INVALID', `${filePath}.authority`, 'File authority must be a required state authority.')
      );
    }
    if (rawFile.state !== 'complete') {
      errors.push(issue('FILE_INCOMPLETE', `${filePath}.state`, 'Incomplete files cannot be restored.'));
    }
    if (typeof rawFile.logicalRole !== 'string' || rawFile.logicalRole.trim().length === 0) {
      errors.push(issue('FILE_LOGICAL_ROLE_INVALID', `${filePath}.logicalRole`, 'File logicalRole is required.'));
    }
    if (typeof rawFile.sourcePath !== 'string' || rawFile.sourcePath.length === 0) {
      errors.push(issue('FILE_SOURCE_PATH_INVALID', `${filePath}.sourcePath`, 'File sourcePath is required.'));
    }
    const canonicalSnapshotPath =
      typeof rawFile.snapshotPath === 'string' ? canonicalContainedRelativePath(rawFile.snapshotPath) : null;
    if (!canonicalSnapshotPath) {
      errors.push(
        issue(
          'SNAPSHOT_PATH_UNSAFE',
          `${filePath}.snapshotPath`,
          'snapshotPath must be a canonical relative POSIX path inside the snapshot.'
        )
      );
    } else if (snapshotPaths.has(canonicalSnapshotPath)) {
      errors.push(
        issue('SNAPSHOT_PATH_DUPLICATE', `${filePath}.snapshotPath`, 'Snapshot artifact paths must be unique.')
      );
    } else {
      snapshotPaths.add(canonicalSnapshotPath);
    }
    const canonicalRestorePath =
      typeof rawFile.restorePath === 'string' ? canonicalContainedRelativePath(rawFile.restorePath) : null;
    if (!canonicalRestorePath) {
      errors.push(
        issue(
          'RESTORE_PATH_UNSAFE',
          `${filePath}.restorePath`,
          'restorePath must be a canonical relative POSIX path inside an isolated restore root.'
        )
      );
    } else if (restorePaths.has(canonicalRestorePath)) {
      errors.push(issue('RESTORE_PATH_DUPLICATE', `${filePath}.restorePath`, 'Restore paths must be unique.'));
    } else {
      restorePaths.add(canonicalRestorePath);
      const namespace =
        typeof rawFile.authority === 'string' ? RESTORE_NAMESPACE[rawFile.authority as StateAuthorityId] : undefined;
      if (!namespace || !canonicalRestorePath.startsWith(namespace)) {
        errors.push(
          issue(
            'RESTORE_PATH_NAMESPACE_INVALID',
            `${filePath}.restorePath`,
            'restorePath must remain inside its authority namespace.'
          )
        );
      }
    }
    if (!Number.isSafeInteger(rawFile.size) || (rawFile.size as number) < 0) {
      errors.push(issue('FILE_SIZE_INVALID', `${filePath}.size`, 'File size must be a non-negative integer.'));
    }
    if (typeof rawFile.mtimeMs !== 'number' || !Number.isFinite(rawFile.mtimeMs) || rawFile.mtimeMs < 0) {
      errors.push(issue('FILE_MTIME_INVALID', `${filePath}.mtimeMs`, 'File mtimeMs must be a non-negative number.'));
    }
    if (typeof rawFile.sha256 !== 'string' || !SHA256_RE.test(rawFile.sha256)) {
      errors.push(
        issue('FILE_DIGEST_INVALID', `${filePath}.sha256`, 'File sha256 must be a lowercase SHA-256 digest.')
      );
    }
    if (rawFile.sensitive === true && rawFile.copyPolicy !== 'encrypted-copy') {
      errors.push(issue('PLAINTEXT_SECRET', filePath, 'Sensitive recovery material must be encrypted.'));
    }
    if (typeof rawFile.sensitive !== 'boolean') {
      errors.push(issue('FILE_SENSITIVITY_INVALID', `${filePath}.sensitive`, 'File sensitivity must be explicit.'));
    }
    if (rawFile.copyPolicy !== 'copied' && rawFile.copyPolicy !== 'encrypted-copy') {
      errors.push(
        issue('FILE_COPY_POLICY_INVALID', `${filePath}.copyPolicy`, 'File copyPolicy must describe a copied artifact.')
      );
    }
  });

  const authorities = Array.isArray(value.authorities) ? value.authorities : [];
  if (!Array.isArray(value.authorities)) {
    errors.push(issue('AUTHORITIES_INVALID', 'authorities', 'authorities must be an array.'));
  }
  const authorityMap = new Map<string, Record<string, unknown>>();
  authorities.forEach((rawAuthority, index) => {
    const authorityPath = `authorities[${index}]`;
    if (!isRecord(rawAuthority) || typeof rawAuthority.id !== 'string') {
      errors.push(issue('AUTHORITY_INVALID', authorityPath, 'Authority entry must have an id.'));
      return;
    }
    if (authorityMap.has(rawAuthority.id)) {
      errors.push(issue('AUTHORITY_DUPLICATE', `${authorityPath}.id`, 'Authority ids must be unique.'));
      return;
    }
    authorityMap.set(rawAuthority.id, rawAuthority);
    if (!REQUIRED_STATE_AUTHORITY_SET.has(rawAuthority.id)) {
      errors.push(
        issue('AUTHORITY_ID_UNKNOWN', `${authorityPath}.id`, 'Authority id is not part of the recovery contract.')
      );
    }
    if (typeof rawAuthority.coverage !== 'string' || !AUTHORITY_COVERAGE_SET.has(rawAuthority.coverage)) {
      errors.push(issue('AUTHORITY_COVERAGE_INVALID', `${authorityPath}.coverage`, 'Authority coverage is invalid.'));
    }
    if (typeof rawAuthority.consistency !== 'string' || !AUTHORITY_CONSISTENCY_SET.has(rawAuthority.consistency)) {
      errors.push(
        issue('AUTHORITY_CONSISTENCY_INVALID', `${authorityPath}.consistency`, 'Authority consistency is invalid.')
      );
    }
    if (typeof rawAuthority.sourceRoot !== 'string' || rawAuthority.sourceRoot.length === 0) {
      errors.push(
        issue('AUTHORITY_SOURCE_ROOT_INVALID', `${authorityPath}.sourceRoot`, 'Authority sourceRoot is required.')
      );
    }
    if (typeof rawAuthority.requiredForRestore !== 'boolean') {
      errors.push(
        issue(
          'AUTHORITY_RESTORE_FLAG_INVALID',
          `${authorityPath}.requiredForRestore`,
          'Restore requirement must be explicit.'
        )
      );
    }
    if (typeof rawAuthority.sensitive !== 'boolean') {
      errors.push(
        issue('AUTHORITY_SENSITIVITY_INVALID', `${authorityPath}.sensitive`, 'Sensitivity must be explicit.')
      );
    }
    if (rawAuthority.sensitive === true && rawAuthority.coverage === 'copied') {
      errors.push(
        issue(
          'PLAINTEXT_SECRET_AUTHORITY',
          authorityPath,
          'Sensitive authorities must be sealed before entering a recovery point.'
        )
      );
    }
    if (rawAuthority.id === 'constitution.revision-authority') {
      const binding = rawAuthority.credentialBinding;
      if (
        !isRecord(binding) ||
        binding.scope !== 'same-device' ||
        binding.backend !== 'electron-safe-storage' ||
        binding.envelope !== 'constitution-revision-authority/v3'
      ) {
        errors.push(
          issue(
            'CONSTITUTION_REVISION_AUTHORITY_BINDING_INVALID',
            `${authorityPath}.credentialBinding`,
            'Constitution revision authority must declare its same-device OS-vault envelope binding.'
          )
        );
      }
    } else if (rawAuthority.credentialBinding !== undefined) {
      errors.push(
        issue(
          'AUTHORITY_CREDENTIAL_BINDING_UNEXPECTED',
          `${authorityPath}.credentialBinding`,
          'Only the Constitution revision authority may declare this credential binding.'
        )
      );
    }
    if (rawAuthority.coverage === 'missing') {
      errors.push(
        issue('AUTHORITY_MISSING', `${authorityPath}.coverage`, 'A required state authority is unaccounted for.')
      );
    }
    const refs = Array.isArray(rawAuthority.fileIds) ? rawAuthority.fileIds : [];
    if (!Array.isArray(rawAuthority.fileIds)) {
      errors.push(issue('AUTHORITY_FILE_IDS_INVALID', `${authorityPath}.fileIds`, 'fileIds must be an array.'));
    }
    for (const ref of refs) {
      if (typeof ref !== 'string' || !validFileIds.has(ref)) {
        errors.push(
          issue('AUTHORITY_FILE_MISSING', `${authorityPath}.fileIds`, `Unknown file reference: ${String(ref)}`)
        );
        continue;
      }
      fileReferenceCount.set(ref, (fileReferenceCount.get(ref) ?? 0) + 1);
      if (fileAuthorityById.get(ref) !== rawAuthority.id) {
        errors.push(
          issue(
            'AUTHORITY_FILE_OWNERSHIP',
            `${authorityPath}.fileIds`,
            `File ${ref} belongs to ${String(fileAuthorityById.get(ref))}, not ${rawAuthority.id}.`
          )
        );
      }
      const file = files.find((candidate) => isRecord(candidate) && candidate.id === ref) as
        | Record<string, unknown>
        | undefined;
      if (
        file &&
        ((rawAuthority.coverage === 'copied' && file.copyPolicy !== 'copied') ||
          (rawAuthority.coverage === 'encrypted-copy' && file.copyPolicy !== 'encrypted-copy'))
      ) {
        errors.push(
          issue(
            'AUTHORITY_FILE_POLICY_MISMATCH',
            `${authorityPath}.fileIds`,
            `File ${ref} copy policy does not match authority coverage.`
          )
        );
      }
    }
    if (
      (rawAuthority.coverage === 'copied' || rawAuthority.coverage === 'encrypted-copy') &&
      refs.length === 0 &&
      rawAuthority.empty !== true
    ) {
      errors.push(
        issue('AUTHORITY_COPY_EMPTY', `${authorityPath}.fileIds`, 'Copied authorities require evidence files.')
      );
    }
    if (rawAuthority.empty === true && refs.length > 0) {
      errors.push(
        issue('AUTHORITY_EMPTY_WITH_FILES', authorityPath, 'An empty authority cannot reference captured files.')
      );
    }
    if (rawAuthority.coverage !== 'copied' && rawAuthority.coverage !== 'encrypted-copy' && refs.length > 0) {
      errors.push(
        issue('AUTHORITY_NONCOPY_WITH_FILES', `${authorityPath}.fileIds`, 'Non-copied authorities cannot own files.')
      );
    }
    if (
      (rawAuthority.coverage === 'copied' || rawAuthority.coverage === 'encrypted-copy') &&
      rawAuthority.consistency !== 'sqlite-online-backup' &&
      rawAuthority.consistency !== 'quiesced-copy' &&
      rawAuthority.consistency !== 'immutable-copy'
    ) {
      errors.push(
        issue(
          'AUTHORITY_COPY_CONSISTENCY_UNPROVEN',
          `${authorityPath}.consistency`,
          'Copied authorities require a proven capture consistency.'
        )
      );
    }
  });

  for (const fileId of validFileIds) {
    const referenceCount = fileReferenceCount.get(fileId) ?? 0;
    if (referenceCount === 0) {
      errors.push(issue('FILE_UNREFERENCED', 'files', `File ${fileId} is not owned by any authority.`));
    } else if (referenceCount > 1) {
      errors.push(issue('FILE_REFERENCED_MULTIPLE', 'files', `File ${fileId} is referenced by multiple authorities.`));
    }
  }

  const requiredAuthorities = isLegacyManifest
    ? REQUIRED_STATE_AUTHORITIES.filter(
        (authorityId) => authorityId !== 'constitution.revision-authority' && authorityId !== 'constitution.filesystem'
      )
    : REQUIRED_STATE_AUTHORITIES;
  for (const authorityId of requiredAuthorities) {
    if (!authorityMap.has(authorityId)) {
      errors.push(issue('AUTHORITY_OMITTED', 'authorities', `State authority ${authorityId} is omitted.`));
    }
  }
  if (isLegacyManifest && !authorityMap.has('constitution.revision-authority')) {
    warnings.push(
      issue(
        'LEGACY_REVISION_AUTHORITY_ABSENT',
        'authorities',
        'Legacy v1 recovery point predates the external Constitution revision authority; restore requires legacy migration.'
      )
    );
  }
  if (isLegacyManifest && !authorityMap.has('constitution.filesystem')) {
    warnings.push(
      issue(
        'LEGACY_CONSTITUTION_FILESYSTEM_ABSENT',
        'authorities',
        'Legacy v1 recovery point predates explicit Constitution filesystem capture.'
      )
    );
  }

  const logicalState = Array.isArray(value.logicalState) ? value.logicalState : [];
  if (!Array.isArray(value.logicalState)) {
    errors.push(issue('LOGICAL_STATE_INVALID', 'logicalState', 'logicalState must be an array.'));
  }
  const logicalStateIds = new Set<string>();
  logicalState.forEach((rawLogicalState, index) => {
    const logicalPath = `logicalState[${index}]`;
    if (!isRecord(rawLogicalState) || typeof rawLogicalState.id !== 'string') {
      errors.push(issue('LOGICAL_STATE_ENTRY_INVALID', logicalPath, 'Logical state entry must have an id.'));
      return;
    }
    if (!REQUIRED_LOGICAL_STATE_SET.has(rawLogicalState.id)) {
      errors.push(
        issue('LOGICAL_STATE_ID_UNKNOWN', `${logicalPath}.id`, 'Logical state id is not part of the recovery contract.')
      );
    }
    if (logicalStateIds.has(rawLogicalState.id)) {
      errors.push(issue('LOGICAL_STATE_DUPLICATE', `${logicalPath}.id`, 'Logical state ids must be unique.'));
    }
    logicalStateIds.add(rawLogicalState.id);
    if (
      rawLogicalState.status !== 'accounted' &&
      rawLogicalState.status !== 'reference-only' &&
      rawLogicalState.status !== 'excluded' &&
      rawLogicalState.status !== 'missing'
    ) {
      errors.push(issue('LOGICAL_STATE_STATUS_INVALID', `${logicalPath}.status`, 'Logical state status is invalid.'));
    } else if (rawLogicalState.status === 'missing') {
      errors.push(
        issue('LOGICAL_STATE_MISSING', `${logicalPath}.status`, 'A required logical state domain is unaccounted for.')
      );
    }
    const backingAuthorities = Array.isArray(rawLogicalState.authorityIds) ? rawLogicalState.authorityIds : [];
    if (!Array.isArray(rawLogicalState.authorityIds) || backingAuthorities.length === 0) {
      errors.push(
        issue(
          'LOGICAL_STATE_AUTHORITY_EMPTY',
          `${logicalPath}.authorityIds`,
          'Logical state requires a physical authority mapping.'
        )
      );
    }
    for (const authorityId of backingAuthorities) {
      if (typeof authorityId !== 'string' || !authorityMap.has(authorityId)) {
        errors.push(
          issue(
            'LOGICAL_STATE_AUTHORITY_UNKNOWN',
            `${logicalPath}.authorityIds`,
            `Unknown physical authority: ${String(authorityId)}`
          )
        );
      }
    }
    const backingCoverage = backingAuthorities
      .map((authorityId) => authorityMap.get(String(authorityId))?.coverage)
      .filter((coverage): coverage is string => typeof coverage === 'string');
    const expectedStatus: RecoveryManifestLogicalState['status'] | null = backingCoverage.includes('missing')
      ? 'missing'
      : backingCoverage.includes('reference-only')
        ? 'reference-only'
        : backingCoverage.includes('excluded')
          ? 'excluded'
          : null;
    if (
      expectedStatus &&
      backingCoverage.length === backingAuthorities.length &&
      rawLogicalState.status !== expectedStatus
    ) {
      errors.push(
        issue(
          'LOGICAL_STATE_STATUS_MISMATCH',
          `${logicalPath}.status`,
          `Logical status must be ${expectedStatus} for its authority coverage.`
        )
      );
    }
    if (typeof rawLogicalState.note !== 'string' || rawLogicalState.note.trim().length === 0) {
      errors.push(issue('LOGICAL_STATE_NOTE_INVALID', `${logicalPath}.note`, 'Logical state mapping requires a note.'));
    }
  });
  for (const logicalStateId of REQUIRED_LOGICAL_STATE) {
    if (!logicalStateIds.has(logicalStateId)) {
      errors.push(issue('LOGICAL_STATE_OMITTED', 'logicalState', `Logical state ${logicalStateId} is omitted.`));
    }
  }

  const database = authorityMap.get('desktop.database');
  if (
    database &&
    ((database.coverage !== 'copied' && database.coverage !== 'encrypted-copy') ||
      (database.consistency !== 'sqlite-online-backup' && database.consistency !== 'quiesced-copy'))
  ) {
    errors.push(
      issue(
        'DATABASE_NOT_RECOVERABLE',
        'authorities.desktop.database',
        'Desktop database must be copied through SQLite backup or a proven quiesced copy.'
      )
    );
  }
  const databaseFiles = files.filter((candidate) => isRecord(candidate) && candidate.authority === 'desktop.database');
  if (databaseFiles.length !== 1 || databaseFiles[0]?.restorePath !== 'desktop/database/wayland.db') {
    errors.push(
      issue(
        'DATABASE_RESTORE_TARGET_INVALID',
        'files',
        'Desktop recovery requires exactly one database at desktop/database/wayland.db.'
      )
    );
  }

  const config = authorityMap.get('desktop.config');
  if (config && config.coverage !== 'copied' && config.coverage !== 'encrypted-copy') {
    errors.push(
      issue(
        'CONFIG_NOT_RECOVERABLE',
        'authorities.desktop.config',
        'Desktop config must be copied and, when sensitive, sealed.'
      )
    );
  }

  const credentials = authorityMap.get('credentials.key-material');
  if (credentials) {
    if (credentials.coverage === 'copied') {
      errors.push(
        issue(
          'PLAINTEXT_SECRET_AUTHORITY',
          'authorities.credentials.key-material',
          'Credential key material cannot be copied in plaintext.'
        )
      );
    } else if (credentials.coverage === 'excluded') {
      warnings.push(
        issue(
          'CREDENTIALS_NOT_RECOVERABLE',
          'authorities.credentials.key-material',
          'Credentials will require reconnection after restore.'
        )
      );
    }
  }

  const workspaces = authorityMap.get('external.workspaces');
  if (workspaces && workspaces.coverage !== 'reference-only' && workspaces.coverage !== 'absent') {
    errors.push(
      issue(
        'WORKSPACE_POLICY_INVALID',
        'authorities.external.workspaces',
        'External workspaces must initially be reference-only or absent.'
      )
    );
  }

  if (!Array.isArray(value.externalWorkspaces)) {
    errors.push(
      issue('EXTERNAL_WORKSPACES_INVALID', 'externalWorkspaces', 'External workspace references must be an array.')
    );
  } else {
    validateExternalReferences(value.externalWorkspaces, 'projectId', 'externalWorkspaces', errors);
  }
  if (!Array.isArray(value.externalAgentConfigs)) {
    errors.push(
      issue(
        'EXTERNAL_AGENT_CONFIGS_INVALID',
        'externalAgentConfigs',
        'External agent-config references must be an array.'
      )
    );
  } else {
    validateExternalReferences(value.externalAgentConfigs, 'backendId', 'externalAgentConfigs', errors);
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function inspectContainedArtifactType(
  root: string,
  snapshotPath: string
): Promise<{ valid: true; stat: Stats } | { valid: false; message: string }> {
  const segments = snapshotPath.split('/');
  let candidate = root;
  for (let index = -1; index < segments.length; index += 1) {
    if (index >= 0) candidate = path.join(candidate, segments[index]);
    const stat = await lstat(candidate);
    if (stat.isSymbolicLink()) {
      return { valid: false, message: `Snapshot path contains a symbolic link: ${candidate}` };
    }
    const isArtifact = index === segments.length - 1;
    if (isArtifact && !stat.isFile()) {
      return { valid: false, message: `Snapshot artifact is not a regular file: ${candidate}` };
    }
    if (!isArtifact && !stat.isDirectory()) {
      return { valid: false, message: `Snapshot path ancestor is not a directory: ${candidate}` };
    }
    if (isArtifact) return { valid: true, stat };
  }
  return { valid: false, message: 'Snapshot artifact path is empty.' };
}

export async function verifyRecoverySnapshot(
  manifest: unknown,
  snapshotRoot: string
): Promise<RecoveryManifestValidation> {
  const validation = validateRecoveryManifest(manifest);
  if (!validation.valid || !isRecord(manifest) || !Array.isArray(manifest.files)) return validation;
  const errors = [...validation.errors];
  const root = path.resolve(snapshotRoot);

  for (const [index, file] of (manifest as RecoveryManifest).files.entries()) {
    if (!canonicalContainedRelativePath(file.snapshotPath)) continue;
    const candidate = path.resolve(root, file.snapshotPath);
    if (candidate !== root && !candidate.startsWith(root + path.sep)) {
      errors.push(issue('SNAPSHOT_PATH_ESCAPE', `files[${index}].snapshotPath`, 'Snapshot file escapes its root.'));
      continue;
    }
    try {
      const artifactType = await inspectContainedArtifactType(root, file.snapshotPath);
      if ('message' in artifactType) {
        errors.push(issue('SNAPSHOT_FILE_TYPE', `files[${index}]`, artifactType.message));
        continue;
      }
      const { stat } = artifactType;
      if (stat.size !== file.size) {
        errors.push(
          issue('SNAPSHOT_SIZE_MISMATCH', `files[${index}].size`, 'Snapshot size differs from the manifest.')
        );
      }
      const digest = await sha256File(candidate);
      if (digest !== file.sha256) {
        errors.push(
          issue('SNAPSHOT_HASH_MISMATCH', `files[${index}].sha256`, 'Snapshot digest differs from the manifest.')
        );
      }
    } catch (error) {
      errors.push(
        issue(
          'SNAPSHOT_FILE_UNREADABLE',
          `files[${index}].snapshotPath`,
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings: validation.warnings };
}

/**
 * Load and verify an on-disk recovery snapshot without following a caller-
 * supplied root or manifest symlink. This is the production boundary used by
 * the external recovery verifier; callers must not read manifest.json first
 * and then pass attacker-controlled JSON into the lower-level verifier.
 */
export async function verifyRecoverySnapshotRoot(snapshotRootInput: string): Promise<RecoveryManifestValidation> {
  const warnings: RecoveryManifestIssue[] = [];
  let snapshotRoot: string;
  try {
    const requestedRoot = path.resolve(snapshotRootInput);
    const requestedStat = await lstat(requestedRoot);
    if (requestedStat.isSymbolicLink() || !requestedStat.isDirectory()) {
      return {
        valid: false,
        errors: [
          issue('SNAPSHOT_ROOT_INVALID', 'snapshotRoot', 'Recovery snapshot root must be a non-symlink directory.'),
        ],
        warnings,
      };
    }
    snapshotRoot = await realpath(requestedRoot);
  } catch (error) {
    return {
      valid: false,
      errors: [
        issue('SNAPSHOT_ROOT_UNREADABLE', 'snapshotRoot', error instanceof Error ? error.message : String(error)),
      ],
      warnings,
    };
  }

  const manifestPath = path.join(snapshotRoot, 'manifest.json');
  let manifest: unknown;
  try {
    const before = await lstat(manifestPath);
    if (before.isSymbolicLink() || !before.isFile()) {
      throw new Error('Recovery manifest must be a non-symlink regular file.');
    }
    const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
    const handle = await open(manifestPath, constants.O_RDONLY | noFollow);
    try {
      const opened = await handle.stat();
      const after = await lstat(manifestPath);
      if (
        !opened.isFile() ||
        after.isSymbolicLink() ||
        !after.isFile() ||
        opened.dev !== after.dev ||
        opened.ino !== after.ino ||
        before.dev !== after.dev ||
        before.ino !== after.ino
      ) {
        throw new Error('Recovery manifest changed during the no-follow read.');
      }
      manifest = JSON.parse(await handle.readFile({ encoding: 'utf8' })) as unknown;
    } finally {
      await handle.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = message.includes('non-symlink regular file') ? 'MANIFEST_FILE_INVALID' : 'MANIFEST_UNREADABLE';
    return {
      valid: false,
      errors: [issue(code, 'manifest.json', message)],
      warnings,
    };
  }

  return verifyRecoverySnapshot(manifest, snapshotRoot);
}
