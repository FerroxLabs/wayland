import {
  createHostedRestorePrincipalBinding,
  ConstitutionArchiveRestoreAuthorityError,
  type ConstitutionArchiveRestoreOperationAuthority,
  type ConstitutionArchiveRestoreOperationRecord,
  type ConstitutionRestorePrincipalBinding,
} from './constitutionArchiveRestoreAuthority';
import {
  type ConstitutionFsService,
  type ConstitutionMutationResult,
  type ConstitutionPreparedArchiveRestore,
} from './constitutionFsService';
import { ConstitutionFsTransactionError } from './constitutionFsTransaction';
import { sameConstitutionFingerprintTarget } from './constitutionRequestFingerprint';
import {
  CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT,
  validateConstitutionArchiveInventory,
  type ConstitutionArchiveInventorySuccess,
  type ConstitutionArchiveRecoverySummary,
} from '@/common/types/constitutionRecovery';

export type ConstitutionArchiveRestoreRequest = Readonly<{
  operationId: string;
  archiveId: string;
  expectedArchiveRevision: string;
  password: string;
  expectedRevision: string;
}>;

export type ConstitutionArchiveDestructiveAuthorizer = (
  principalBinding: ConstitutionRestorePrincipalBinding,
  password: string
) => Promise<void>;

export class ConstitutionArchiveRecoveryServiceError extends Error {
  constructor(
    readonly code:
      | 'AUTH_REQUIRED'
      | 'AUTH_FAILED'
      | 'LOCKED_OUT'
      | 'INVALID_REQUEST'
      | 'OPERATION_NOT_FOUND'
      | 'OPERATION_ABANDONED'
      | 'OPERATION_AUTHORITY_FULL'
      | 'ROLLED_BACK'
      | 'ARCHIVE_NOT_FOUND'
      | 'ARCHIVE_RETIRED'
      | 'STALE_ARCHIVE_REVISION'
      | 'STALE_TARGET_REVISION'
      | 'ARCHIVE_TARGET_MISMATCH'
      | 'CONFLICT'
      | 'INTEGRITY_FAILURE'
      | 'UNSAFE_FILESYSTEM'
      | 'NATIVE_FAILURE',
    message: string
  ) {
    super(message);
    this.name = 'ConstitutionArchiveRecoveryServiceError';
  }
}

function mapAuthorityError(error: ConstitutionArchiveRestoreAuthorityError): ConstitutionArchiveRecoveryServiceError {
  const code = error.code === 'AUTHORITY_BUSY' ? 'CONFLICT' : error.code;
  return new ConstitutionArchiveRecoveryServiceError(code, error.message);
}

function mapNativeError(error: ConstitutionFsTransactionError): ConstitutionArchiveRecoveryServiceError {
  if (error.code === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
    return new ConstitutionArchiveRecoveryServiceError('UNSAFE_FILESYSTEM', error.message);
  }
  if (error.code === 'CONSTITUTION_FS_NOT_FOUND') {
    return new ConstitutionArchiveRecoveryServiceError('ARCHIVE_NOT_FOUND', error.message);
  }
  if (error.code === 'CONSTITUTION_FS_CONFLICT') {
    return new ConstitutionArchiveRecoveryServiceError('CONFLICT', error.message);
  }
  if (
    error.code.includes('AUTHENTICATION') ||
    error.code.includes('MALFORMED') ||
    error.code.includes('GUARANTEE') ||
    error.code.includes('IDENTITY') ||
    error.code.includes('KEY_')
  ) {
    return new ConstitutionArchiveRecoveryServiceError('INTEGRITY_FAILURE', error.message);
  }
  return new ConstitutionArchiveRecoveryServiceError('NATIVE_FAILURE', error.message);
}

function sameClientFacts(
  record: ConstitutionArchiveRestoreOperationRecord,
  request: ConstitutionArchiveRestoreRequest
) {
  return (
    record.archiveId === request.archiveId &&
    record.expectedArchiveRevision === request.expectedArchiveRevision &&
    record.expectedRevision === request.expectedRevision
  );
}

function samePreparedFacts(
  record: ConstitutionArchiveRestoreOperationRecord,
  prepared: ConstitutionPreparedArchiveRestore
) {
  return (
    record.archiveId === prepared.archiveId &&
    record.contentSha256 === prepared.contentSha256 &&
    sameConstitutionFingerprintTarget(record.target, prepared.target)
  );
}

export class ConstitutionArchiveRecoveryService {
  constructor(
    private readonly filesystem: ConstitutionFsService,
    private readonly operationAuthority: ConstitutionArchiveRestoreOperationAuthority,
    private readonly defaultAuthorizeDestructivePassword?: ConstitutionArchiveDestructiveAuthorizer
  ) {}

  desktopPrincipalBinding(): Extract<ConstitutionRestorePrincipalBinding, { kind: 'desktop-installation' }> {
    return this.operationAuthority.desktopPrincipalBinding();
  }

  hostedPrincipalBinding(subject: string): ConstitutionRestorePrincipalBinding {
    const deployment = this.operationAuthority.desktopPrincipalBinding();
    return createHostedRestorePrincipalBinding(deployment.installationId, subject);
  }

  listArchives(): ConstitutionArchiveInventorySuccess {
    const archives: ConstitutionArchiveRecoverySummary[] = this.filesystem.listArchives().map((archive) => ({
      archiveId: archive.archiveId,
      archivedAt: new Date(archive.archivedAt).toISOString(),
      targetKind: archive.targetKind,
      specialistId: archive.targetKind === 'specialist' ? (archive.specialistId ?? null) : null,
      sourceName: archive.sourceName,
      bytes: archive.bytes,
      targetRevision: archive.targetRevision,
    }));
    validateConstitutionArchiveInventory(archives);
    return {
      success: true,
      data: { contract: CONSTITUTION_ARCHIVE_RECOVERY_DTO_CONTRACT, archives },
    };
  }

  async restore(
    principalBinding: ConstitutionRestorePrincipalBinding,
    request: ConstitutionArchiveRestoreRequest,
    authorizeDestructivePassword = this.defaultAuthorizeDestructivePassword
  ): Promise<ConstitutionMutationResult> {
    try {
      const existing = this.operationAuthority.lookup(request.operationId, principalBinding);
      if (existing) {
        if (!sameClientFacts(existing, request)) {
          throw new ConstitutionArchiveRecoveryServiceError(
            'CONFLICT',
            'Restore operation is bound to different client facts.'
          );
        }
        const replay = this.filesystem.lookupArchiveRestore(
          existing.nativeRequestId,
          existing.nativeRequestFingerprint
        );
        if (replay.outcome === 'committed') {
          this.operationAuthority.reconcileNativeOutcome(request.operationId, principalBinding, 'committed');
          return replay.result;
        }
        if (replay.outcome === 'rolled_back') {
          this.operationAuthority.reconcileNativeOutcome(request.operationId, principalBinding, 'rolled-back');
          throw new ConstitutionArchiveRecoveryServiceError(
            'ROLLED_BACK',
            'Restore was definitively rolled back; a new operation ID is required.'
          );
        }
        if (existing.state === 'committed' || existing.state === 'rolled-back') {
          throw new ConstitutionArchiveRecoveryServiceError(
            'INTEGRITY_FAILURE',
            'Native restore history conflicts with the terminal process record.'
          );
        }
        const prepared = this.filesystem.prepareArchiveRestore(existing.archiveId);
        if (!samePreparedFacts(existing, prepared)) {
          throw new ConstitutionArchiveRecoveryServiceError(
            'ARCHIVE_TARGET_MISMATCH',
            'Authenticated archive facts changed after restore preparation.'
          );
        }
        if (!this.filesystem.archiveRestorePreviewMatches(prepared, existing.expectedArchiveRevision)) {
          throw new ConstitutionArchiveRecoveryServiceError(
            'STALE_ARCHIVE_REVISION',
            'Authenticated archive preview no longer matches.'
          );
        }
        if (!authorizeDestructivePassword) {
          throw new ConstitutionArchiveRecoveryServiceError(
            'AUTH_REQUIRED',
            'Fresh destructive authentication is required.'
          );
        }
        await authorizeDestructivePassword(principalBinding, request.password);
        return this.dispatch(existing, principalBinding, prepared);
      }

      const prepared = this.filesystem.prepareArchiveRestore(request.archiveId);
      if (!this.filesystem.archiveRestorePreviewMatches(prepared, request.expectedArchiveRevision)) {
        throw new ConstitutionArchiveRecoveryServiceError(
          'STALE_ARCHIVE_REVISION',
          'Authenticated archive preview no longer matches.'
        );
      }
      if (!authorizeDestructivePassword) {
        throw new ConstitutionArchiveRecoveryServiceError(
          'AUTH_REQUIRED',
          'Fresh destructive authentication is required.'
        );
      }
      await authorizeDestructivePassword(principalBinding, request.password);
      const record = this.operationAuthority.reserve({
        operationId: request.operationId,
        principalBinding,
        archiveId: request.archiveId,
        expectedArchiveRevision: request.expectedArchiveRevision,
        expectedRevision: request.expectedRevision,
        target: prepared.target,
        contentSha256: prepared.contentSha256,
      });
      return this.dispatch(record, principalBinding, prepared);
    } catch (error) {
      if (error instanceof ConstitutionArchiveRecoveryServiceError) throw error;
      if (error instanceof ConstitutionArchiveRestoreAuthorityError) throw mapAuthorityError(error);
      if (error instanceof ConstitutionFsTransactionError) throw mapNativeError(error);
      throw error;
    }
  }

  private dispatch(
    record: ConstitutionArchiveRestoreOperationRecord,
    principalBinding: ConstitutionRestorePrincipalBinding,
    prepared: ConstitutionPreparedArchiveRestore
  ): ConstitutionMutationResult {
    return this.operationAuthority.dispatch(record.operationId, principalBinding, (marked) => ({
      outcome: 'committed',
      value: this.filesystem.restorePreparedArchive(
        prepared,
        marked.expectedRevision,
        marked.nativeRequestId,
        marked.nativeRequestFingerprint
      ),
    }));
  }
}

let constitutionArchiveRecoveryService: ConstitutionArchiveRecoveryService | null = null;

export function setConstitutionArchiveRecoveryService(service: ConstitutionArchiveRecoveryService): void {
  if (constitutionArchiveRecoveryService && constitutionArchiveRecoveryService !== service) {
    throw new Error('ConstitutionArchiveRecoveryService already initialized.');
  }
  constitutionArchiveRecoveryService = service;
}

export function getConstitutionArchiveRecoveryService(): ConstitutionArchiveRecoveryService {
  if (!constitutionArchiveRecoveryService) throw new Error('ConstitutionArchiveRecoveryService is not initialized.');
  return constitutionArchiveRecoveryService;
}
