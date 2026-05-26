/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW IPC bridge — exposes brain.invoke + lifecycle control surfaces to the
 * renderer. All input args are validated via zod (per-verb schema + envelope
 * schema). Every failure path returns a structured `errorReason` enum code so
 * the renderer can map to a localized i18n key.
 */

import log from 'electron-log';
import { ipcBridge } from '@/common';
import type { IjfwInvokeResult } from '@/common/types/ijfw';
import {
  brainInvokeArgsSchema,
  validateInvocation,
} from '@process/services/ijfw/ipcSchemas';
import { ijfwMcpClient } from '@process/services/ijfw/ijfwMcpClient';
import { ijfwSystemService, getLastStatus } from '@process/services/ijfwSystemService';
import { ProcessConfig } from '@process/utils/initStorage';

export function initIjfwBridge(): void {
  ipcBridge.ijfw.brainInvoke.provider(async (params): Promise<IjfwInvokeResult> => {
    // Envelope shape first — reject extra keys / missing verb.
    const envelope = brainInvokeArgsSchema.safeParse(params);
    if (!envelope.success) {
      return { ok: false, error: envelope.error.message, errorReason: 'validation_failed' };
    }
    const validation = validateInvocation(envelope.data.verb, envelope.data.args ?? {});
    if (validation.ok === false) {
      return { ok: false, error: validation.reason, errorReason: 'validation_failed' };
    }
    if (ijfwMcpClient.getMode() === 'degraded') {
      return { ok: false, error: 'IJFW MCP client unavailable', errorReason: 'unavailable' };
    }
    return ijfwMcpClient.invoke(validation.verb, validation.args);
  });

  ipcBridge.ijfw.getStatus.provider(async () => {
    return getLastStatus() ?? { status: 'not_installed' as const };
  });

  ipcBridge.ijfw.checkNow.provider(async () => {
    try {
      const version = await ijfwSystemService.getLatestPublished();
      return { ok: true, version };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcBridge.ijfw.triggerInstall.provider(async () => {
    try {
      await ijfwSystemService.bootstrap();
      return { ok: true };
    } catch (err) {
      log.error('[ijfw-bridge] bootstrap failed', { err });
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcBridge.ijfw.skipSetup.provider(async ({ enabled }) => {
    await ProcessConfig.set('ijfw.skipSetup', enabled);
    return { ok: true };
  });

  ipcBridge.ijfw.getRuntimeMode.provider(async () => ijfwMcpClient.getMode());
}
