/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW IPC bridge - exposes brain.invoke + lifecycle control surfaces to the
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
    // Envelope shape first - reject extra keys / missing verb.
    const envelope = brainInvokeArgsSchema.safeParse(params);
    if (!envelope.success) {
      return { ok: false, error: envelope.error.message, errorReason: 'validation_failed' };
    }
    const validation = validateInvocation(envelope.data.verb, envelope.data.args ?? {});
    if (validation.ok === false) {
      return { ok: false, error: validation.reason, errorReason: 'validation_failed' };
    }
    // Wave 7 H1: do NOT short-circuit on `getMode() === 'degraded'` here.
    // The prior gate trapped the client permanently after one crash because
    // it ran BEFORE `invoke()` had a chance to call `ensureSpawned()` and
    // attempt a respawn. `ijfwMcpClient.invoke()` now owns its own lifecycle:
    // ensureSpawned() respawns when child is null, returns a structured
    // {ok:false, errorReason:'spawn_error'} when respawn fails, and flips
    // mode back to 'full' on success. The bridge stays a thin pass-through.
    return ijfwMcpClient.invoke(validation.verb, validation.args);
  });

  ipcBridge.ijfw.getStatus.provider(async () => {
    // Prefer the cached lifecycle status emitted by bootstrap/applyPendingUpgrade.
    const cached = getLastStatus();
    if (cached) return cached;

    // Bootstrap is deferred 5s on app boot, so for the first window the cache
    // is empty. Returning a static `not_installed` here was wrong - the
    // MemoryPage renders the install pitch when IJFW is in fact already
    // present at `~/.ijfw/mcp-server`. Do an active detection so the renderer
    // sees the truth without waiting for bootstrap to emit.
    try {
      const local = await ijfwSystemService.detectLocalInstall();
      if (local.installed) {
        return local.version
          ? { status: 'installed_current' as const, version: local.version }
          : { status: 'installed_current' as const };
      }
    } catch (err) {
      log.warn('[ijfw-bridge] getStatus detect failed; falling back', { err });
    }
    return { status: 'not_installed' as const };
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
