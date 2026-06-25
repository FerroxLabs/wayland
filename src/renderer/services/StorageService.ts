/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';
import type { UsageResult } from '@process/storage/computeUsage';

/**
 * Browser/WebUI client for the storage HTTP routes (#83). On desktop these
 * actions go through Electron IPC + native dialogs; in a hosted WebUI they go
 * through these token-authed server routes instead. Restore additionally
 * requires operator provenance (a private-network request) and a step-up
 * password, both enforced server-side.
 */

export type StorageDirs = { workspace: string; cache: string; logs: string };

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

/** Resolve the storage directory paths (for show/copy in browser). */
export async function fetchStorageDirs(): Promise<StorageDirs> {
  const res = await fetch('/api/storage/paths', { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load storage paths: ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: StorageDirs };
  if (!json.success || !json.data) throw new Error('Failed to load storage paths');
  return json.data;
}

/** Clear the cache or logs directory; returns refreshed usage. */
export async function clearStorageDirHttp(kind: 'cache' | 'logs'): Promise<UsageResult | undefined> {
  const csrf = getCsrfToken();
  const res = await fetch('/api/storage/clear', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ kind, _csrf: csrf }),
  });
  if (!res.ok) throw new Error(`Failed to clear ${kind}: ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: { usage?: UsageResult } };
  if (!json.success) throw new Error(`Failed to clear ${kind}`);
  return json.data?.usage;
}

/** Generate a backup zip on the server and trigger a browser download. */
export async function exportBackupHttp(opts: { includeKeys: boolean; passphrase?: string }): Promise<void> {
  const csrf = getCsrfToken();
  const res = await fetch('/api/storage/export', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ includeKeys: opts.includeKeys, passphrase: opts.passphrase, _csrf: csrf }),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `wayland-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Restore from an uploaded backup zip. Requires the step-up password; the
 * server also enforces operator provenance. Returns the safety-backup path the
 * server created before applying the restore.
 */
export async function restoreBackupHttp(opts: {
  file: File;
  password: string;
  passphrase?: string;
}): Promise<{ safetyBackupPath?: string }> {
  const csrf = getCsrfToken();
  const formData = new FormData();
  if (csrf) formData.append('_csrf', csrf);
  formData.append('file', opts.file);
  formData.append('password', opts.password);
  if (opts.passphrase) formData.append('passphrase', opts.passphrase);

  const res = await fetch('/api/storage/restore', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; msg?: string; data?: { safetyBackupPath?: string } };
  if (res.status === 403) throw new Error(json.msg || 'RESTORE_NOT_OPERATOR');
  if (res.status === 401) throw new Error('RESTORE_BAD_PASSWORD');
  if (res.status === 413) throw new Error('FILE_TOO_LARGE');
  if (!res.ok || !json.success) throw new Error(json.msg || 'RESTORE_FAILED');
  return json.data ?? {};
}
