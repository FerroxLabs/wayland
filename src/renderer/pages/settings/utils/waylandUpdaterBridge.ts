/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { autoUpdate as autoUpdateIpc, update as updateIpc } from '@/common/adapter/ipcBridge';

const AUTO_UPDATE_CHECK_TIMEOUT_MS = 6000;

type UpdateCheckResponse = {
  ok: boolean;
  error?: string;
  autoUpdateAvailable?: boolean;
  autoVersion?: string;
  manual?: Awaited<ReturnType<typeof updateIpc.check.invoke>>;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export async function runWaylandUpdaterExtensionCheck(
  includePrerelease: boolean,
  logPrefix: string
): Promise<UpdateCheckResponse> {
  let autoUpdateAvailable = false;
  let autoVersion = '';

  try {
    const auto = await withTimeout(autoUpdateIpc.check.invoke({ includePrerelease }), AUTO_UPDATE_CHECK_TIMEOUT_MS);
    if (auto?.success && auto.data?.updateInfo) {
      autoUpdateAvailable = true;
      autoVersion = auto.data.updateInfo.version || '';
    }
  } catch (err) {
    console.warn(`${logPrefix} Auto-update check failed or timed out for updater extension:`, err);
  }

  const manual = await updateIpc.check.invoke({ includePrerelease });
  if (!manual?.success) {
    return { ok: false, error: manual?.msg || 'Update check failed.' };
  }

  return {
    ok: true,
    autoUpdateAvailable,
    autoVersion,
    manual,
  };
}
