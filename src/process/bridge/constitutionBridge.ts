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

import { ipcMain } from 'electron';
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
import { constitutionMutationQuiescence } from '@process/services/constitution/constitutionMutationQuiescence';

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
export function initConstitutionBridge(service: ConstitutionFsService): void {
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
}
