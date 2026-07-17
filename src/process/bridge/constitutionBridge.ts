/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IPC bridge for the Wayland Constitution - the agent's behavioral spec,
 * loaded fresh on every turn. Canonical file is `~/.wayland/CONSTITUTION.md`.
 * Legacy `~/.wayland/SOUL.md` is read as a fallback and migrated on first
 * write, so users who installed before the rename keep their content.
 *
 * Ported from wayland-hermes/desktop/src/main/soul.ts - the new app uses
 * the same on-disk location so existing Constitutions are picked up
 * transparently.
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { enforceRateLimit } from './webuiDirectAuth';
import type {
  ConstitutionFsService,
  ConstitutionMutationResult as ServiceMutationResult,
  ConstitutionReadResult as ServiceReadResult,
} from '@process/services/constitution/constitutionFsService';
import type {
  ConstitutionAuthorityEnvelope,
  ConstitutionMutationResult,
  ConstitutionReadResult,
} from '@/common/types/constitution';
import { DEFAULT_CONSTITUTION } from '@/common/constitutionDefault';
import type { ConstitutionArchiveRecoveryService } from '@process/services/constitution/constitutionArchiveRecoveryService';
import { ConstitutionArchiveRecoveryServiceError } from '@process/services/constitution/constitutionArchiveRecoveryService';
import {
  constitutionArchiveRestoreFailure,
  constitutionClassicRecoveryFailure,
  parseConstitutionClassicRecoveryDecisionRequest,
  parseConstitutionClassicRecoveryResumeRequest,
  parseConstitutionArchiveRestoreRequest,
  syntacticallyValidConstitutionRestoreOperationId,
} from '@/common/types/constitutionRecovery';
import { constitutionMutationQuiescence } from '@process/services/constitution/constitutionMutationQuiescence';
import {
  ConstitutionClassicRecoveryServiceError,
  getConstitutionClassicRecoveryServiceReady,
  type ConstitutionClassicRecoveryService,
} from '@process/services/constitution/constitutionClassicRecoveryService';

type ResolveClassicRecoveryService = () => Promise<ConstitutionClassicRecoveryService | null>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireMutationRequestId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw Object.assign(new Error('A valid Constitution mutation request id is required.'), {
      code: 'CONSTITUTION_FS_INVALID_REQUEST',
    });
  }
  return value;
}

function wireRead(result: ServiceReadResult): ConstitutionReadResult {
  return result.status === 'present'
    ? { state: 'present', content: result.content, revision: result.revision }
    : { state: 'absent', revision: result.revision };
}

function wireMutation(result: ServiceMutationResult): ConstitutionMutationResult {
  return {
    ok: true,
    revision: result.revision,
    receiptId: result.receiptId,
    requestId: result.transactionId,
    requestFingerprint: result.requestFingerprint,
  };
}

function withAuthority<T>(service: ConstitutionFsService, operation: () => T): ConstitutionAuthorityEnvelope<T> {
  const capability = service.capability();
  if (capability.supported === false) {
    return { availability: 'unavailable', code: capability.code, reason: capability.reason };
  }
  try {
    return { availability: 'available', value: operation() };
  } catch (error) {
    const code =
      error && typeof error === 'object' && (error as { code?: unknown }).code === 'CONSTITUTION_FS_CONFLICT'
        ? 'CONSTITUTION_FS_CONFLICT'
        : 'CONSTITUTION_FS_AUTHORITY_FAILURE';
    const reason =
      error instanceof Error && error.message.length > 0 ? error.message : 'Constitution authority failed.';
    // Return an exact structured-clone-safe failure. Electron does not promise
    // to retain custom Error properties across ipcRenderer.invoke rejection.
    return { availability: 'failed', code, reason };
  }
}

/**
 * Register the Constitution IPC handlers. Called once from initAllBridges.
 */
export function initConstitutionBridge(
  service: ConstitutionFsService,
  recovery?: ConstitutionArchiveRecoveryService,
  validateRecoverySender: (event: IpcMainInvokeEvent) => boolean = () => false,
  resolveClassicRecovery: ResolveClassicRecoveryService = getConstitutionClassicRecoveryServiceReady
): void {
  ipcMain.handle('constitution:read', () => withAuthority(service, () => wireRead(service.readConstitution())));
  ipcMain.handle('constitution:write', (_event, content: string, expectedRevision: string, requestId: unknown) => {
    // Rate-limit guard: these write handlers are raw ipcMain (outside the
    // bridge allowlist) and overwrite the agent's behavioral spec, so a
    // renderer-XSS attacker could otherwise rewrite the Constitution at will.
    // Confinement is enforced by the fixed CONSTITUTION.md path; content is
    // validated (string + size cap) inside writeConstitution.
    if (!enforceRateLimit('constitution:write')) throw new Error('CONSTITUTION_RATE_LIMITED');
    const authenticatedRequestId = requireMutationRequestId(requestId);
    return withAuthority(service, () =>
      constitutionMutationQuiescence.runInteractiveMutation(() =>
        wireMutation(service.writeConstitution(content, expectedRevision, authenticatedRequestId))
      )
    );
  });
  ipcMain.handle('constitution:reset', (_event, expectedRevision: string, requestId: unknown) => {
    if (!enforceRateLimit('constitution:reset')) throw new Error('CONSTITUTION_RATE_LIMITED');
    const authenticatedRequestId = requireMutationRequestId(requestId);
    return withAuthority(service, () =>
      constitutionMutationQuiescence.runInteractiveMutation(() =>
        wireMutation(service.writeConstitution(DEFAULT_CONSTITUTION, expectedRevision, authenticatedRequestId))
      )
    );
  });
  ipcMain.handle('constitution:readWithOverlay', (_event, assistantId?: string) => {
    return withAuthority(service, () => {
      const result = service.readWithOverlay(assistantId);
      return { constitution: wireRead(result.constitution), overlay: result.overlay ? wireRead(result.overlay) : null };
    });
  });
  ipcMain.handle('constitution:listSpecialists', () => withAuthority(service, () => service.listSpecialists()));
  ipcMain.handle('constitution:readSpecialist', (_event, id: string) =>
    withAuthority(service, () => wireRead(service.readSpecialist(id)))
  );
  ipcMain.handle(
    'constitution:writeSpecialist',
    (_event, id: string, content: string, expectedRevision: string, requestId: unknown) => {
      // Same guard as constitution:write. Target is confined to the
      // specialists/ directory via resolveSpecialistPath inside the writer.
      if (!enforceRateLimit('constitution:writeSpecialist')) throw new Error('CONSTITUTION_RATE_LIMITED');
      const authenticatedRequestId = requireMutationRequestId(requestId);
      return withAuthority(service, () =>
        constitutionMutationQuiescence.runInteractiveMutation(() =>
          wireMutation(service.writeSpecialist(id, content, expectedRevision, authenticatedRequestId))
        )
      );
    }
  );
  ipcMain.handle(
    'constitution:deleteSpecialist',
    (_event, id: string, expectedRevision: string, requestId: unknown) => {
      if (!enforceRateLimit('constitution:deleteSpecialist')) throw new Error('CONSTITUTION_RATE_LIMITED');
      const authenticatedRequestId = requireMutationRequestId(requestId);
      return withAuthority(service, () =>
        constitutionMutationQuiescence.runInteractiveMutation(() =>
          wireMutation(service.deleteSpecialist(id, expectedRevision, authenticatedRequestId))
        )
      );
    }
  );
  if (recovery) {
    ipcMain.handle('constitution:archives:list', (event) => {
      if (!validateRecoverySender(event)) {
        return constitutionArchiveRestoreFailure('OPERATION_NOT_FOUND', 'Archive recovery is unavailable.', null);
      }
      try {
        return recovery.listArchives();
      } catch {
        return constitutionArchiveRestoreFailure(
          'INTEGRITY_FAILURE',
          'Archive inventory could not be authenticated.',
          null
        );
      }
    });
    ipcMain.handle('constitution:archives:restore', async (event, input: unknown) => {
      const operationId = syntacticallyValidConstitutionRestoreOperationId(
        input && typeof input === 'object' && !Array.isArray(input)
          ? (input as { operationId?: unknown }).operationId
          : null
      );
      if (!validateRecoverySender(event)) {
        return constitutionArchiveRestoreFailure(
          'OPERATION_NOT_FOUND',
          'Archive restore operation was not found.',
          operationId
        );
      }
      if (!enforceRateLimit('constitution:archives:restore')) {
        return constitutionArchiveRestoreFailure('LOCKED_OUT', 'Archive restore is temporarily locked.', operationId);
      }
      const request = parseConstitutionArchiveRestoreRequest(input);
      if (!request) {
        return constitutionArchiveRestoreFailure('INVALID_REQUEST', 'Archive restore request is invalid.', operationId);
      }
      const principal = recovery.desktopPrincipalBinding();
      try {
        const committed = await constitutionMutationQuiescence.runInteractiveMutationAsync(() =>
          recovery.restore(principal, request)
        );
        return {
          success: true,
          data: {
            status: 'committed',
            operationId: request.operationId,
            revision: committed.revision,
            receiptId: committed.receiptId,
          },
        } as const;
      } catch (error) {
        const code = error instanceof ConstitutionArchiveRecoveryServiceError ? error.code : 'NATIVE_FAILURE';
        return constitutionArchiveRestoreFailure(code, 'Archive restore did not complete.', request.operationId);
      }
    });

    ipcMain.handle('constitution:classic-recovery:get', async (event) => {
      if (!validateRecoverySender(event)) {
        return constitutionClassicRecoveryFailure('OPERATION_NOT_FOUND', 'Classic recovery is unavailable.', null);
      }
      try {
        const classicRecovery = await resolveClassicRecovery();
        if (!classicRecovery) {
          return constitutionClassicRecoveryFailure('OPERATION_NOT_FOUND', 'Classic recovery is unavailable.', null);
        }
        return await classicRecovery.metadata(recovery.desktopPrincipalBinding());
      } catch (error) {
        const code = error instanceof ConstitutionClassicRecoveryServiceError ? error.code : 'INTEGRITY_FAILURE';
        return constitutionClassicRecoveryFailure(code, 'Classic recovery metadata is unavailable.', null);
      }
    });

    ipcMain.handle('constitution:classic-recovery:decision', async (event, input: unknown) => {
      const operationId = syntacticallyValidConstitutionRestoreOperationId(
        input && typeof input === 'object' && !Array.isArray(input)
          ? (input as { operationId?: unknown }).operationId
          : null
      );
      if (!validateRecoverySender(event)) {
        return constitutionClassicRecoveryFailure(
          'OPERATION_NOT_FOUND',
          'Classic recovery operation was not found.',
          operationId
        );
      }
      if (!enforceRateLimit('constitution:classic-recovery:decision')) {
        return constitutionClassicRecoveryFailure('LOCKED_OUT', 'Classic recovery is temporarily locked.', operationId);
      }
      const request = parseConstitutionClassicRecoveryDecisionRequest(input);
      if (!request) {
        return constitutionClassicRecoveryFailure(
          'INVALID_REQUEST',
          'Classic recovery request is invalid.',
          operationId
        );
      }
      try {
        const classicRecovery = await resolveClassicRecovery();
        if (!classicRecovery) {
          return constitutionClassicRecoveryFailure(
            'OPERATION_NOT_FOUND',
            'Classic recovery operation was not found.',
            request.operationId
          );
        }
        return await classicRecovery.decide(recovery.desktopPrincipalBinding(), request);
      } catch (error) {
        const code = error instanceof ConstitutionClassicRecoveryServiceError ? error.code : 'INTEGRITY_FAILURE';
        return constitutionClassicRecoveryFailure(code, 'Classic recovery did not complete.', request.operationId);
      }
    });

    ipcMain.handle('constitution:classic-recovery:resume', async (event, input: unknown) => {
      const operationId = syntacticallyValidConstitutionRestoreOperationId(
        input && typeof input === 'object' && !Array.isArray(input)
          ? (input as { operationId?: unknown }).operationId
          : null
      );
      if (!validateRecoverySender(event)) {
        return constitutionClassicRecoveryFailure(
          'OPERATION_NOT_FOUND',
          'Classic recovery operation was not found.',
          operationId
        );
      }
      if (!enforceRateLimit('constitution:classic-recovery:resume')) {
        return constitutionClassicRecoveryFailure('LOCKED_OUT', 'Classic recovery is temporarily locked.', operationId);
      }
      const request = parseConstitutionClassicRecoveryResumeRequest(input);
      if (!request) {
        return constitutionClassicRecoveryFailure(
          'INVALID_REQUEST',
          'Classic recovery request is invalid.',
          operationId
        );
      }
      try {
        const classicRecovery = await resolveClassicRecovery();
        if (!classicRecovery) {
          return constitutionClassicRecoveryFailure(
            'OPERATION_NOT_FOUND',
            'Classic recovery operation was not found.',
            request.operationId
          );
        }
        return await classicRecovery.resume(recovery.desktopPrincipalBinding(), request);
      } catch (error) {
        const code = error instanceof ConstitutionClassicRecoveryServiceError ? error.code : 'INTEGRITY_FAILURE';
        return constitutionClassicRecoveryFailure(code, 'Classic recovery did not complete.', request.operationId);
      }
    });
  }
}
