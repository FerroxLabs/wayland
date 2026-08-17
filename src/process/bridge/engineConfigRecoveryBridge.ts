/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1024 - IPC surface for in-app recovery of an invalid engine `config.toml`.
 *
 * Thin by design: all of the ordering and safety logic (verified backup before
 * any write, line-break-only repair, confirmation-gated regenerate) lives in
 * `engineConfigRecovery.ts` where it is unit-tested against both the success and
 * the failure branches. This file only carries it across the process boundary.
 *
 * NO PATH CROSSES THE BOUNDARY INBOUND. Every handler resolves the active
 * profile's `config.toml` in MAIN, so there is nothing renderer-controlled to
 * confine. That is why `reveal` is implemented here rather than reusing
 * `ipcBridge.shell.showItemInFolder`: that channel runs `confinePath`, and the
 * engine config dir (`~/Library/Application Support/wayland-core` and its
 * platform equivalents) is NOT one of `pathConfinement`'s authorized roots, so
 * the reveal would be rejected as "path not allowed". Rather than widen that
 * root set - which would also widen every generic fs channel - this reveals the
 * ONE path main computed itself.
 *
 * Failures are RETURNED, never thrown: the platform's `invoke()` has no
 * rejection channel (a throwing provider leaves the caller's promise pending
 * forever), which is the same reason `ShellOpenResult` exists.
 */

import path from 'node:path';
import { shell } from 'electron';
import { ipcBridge } from '@/common';
import type { ShellOpenResult } from '@/common/adapter/ipcBridge';
import {
  inspectEngineConfig,
  regenerateEngineConfig,
  repairEngineConfig,
  defaultRecoveryDeps,
  type EngineConfigInspection,
  type EngineConfigRecoveryResult,
} from '@process/agent/wcore/engineConfigRecovery';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';

/** One-line, scrubbed failure text. Never file content - see the module head. */
function detailOf(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return redactCommandSecrets(raw.split('\n', 1)[0].trim());
}

export function initEngineConfigRecoveryBridge(): void {
  ipcBridge.engineConfigRecovery.inspect.provider(async (): Promise<EngineConfigInspection> => {
    try {
      return await inspectEngineConfig();
    } catch (error) {
      // `inspectEngineConfig` already reports its own failures as a status; this
      // is the last-resort guard so the failure UI always has something to render.
      return { status: 'unreadable', path: '', reason: detailOf(error) };
    }
  });

  ipcBridge.engineConfigRecovery.repair.provider(async (): Promise<EngineConfigRecoveryResult> => {
    try {
      return await repairEngineConfig();
    } catch (error) {
      return { ok: false, reason: 'write-failed', detail: detailOf(error) };
    }
  });

  ipcBridge.engineConfigRecovery.regenerate.provider(async (params): Promise<EngineConfigRecoveryResult> => {
    // Re-derived here rather than trusted: `confirmed` must be the boolean
    // `true`, so a missing/absent/truthy-ish payload can never reach the
    // destructive path. `regenerateEngineConfig` checks it again.
    const confirmed = params?.confirmed === true;
    try {
      return await regenerateEngineConfig({ confirmed });
    } catch (error) {
      return { ok: false, reason: 'write-failed', detail: detailOf(error) };
    }
  });

  ipcBridge.engineConfigRecovery.reveal.provider(async (): Promise<ShellOpenResult> => {
    try {
      const configPath = await defaultRecoveryDeps().resolveConfigPath();
      // On Linux `shell.showItemInFolder` depends on a freedesktop file manager
      // over D-Bus and silently no-ops when none is available (#616), so open the
      // containing directory there instead of reporting a false success. Mirrors
      // `shellBridge.ts`'s handling of the same call.
      if (process.platform === 'linux') {
        const error = await shell.openPath(path.dirname(configPath));
        return error ? { ok: false, error } : { ok: true };
      }
      shell.showItemInFolder(configPath);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: detailOf(error) };
    }
  });
}
