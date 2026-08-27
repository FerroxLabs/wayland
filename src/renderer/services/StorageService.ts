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
 * What a restore actually did, as reported by POST /api/storage/restore.
 *
 * `applied` is the load-bearing field, and the reason a bare `success: true` is
 * not enough: a legacy file export only ever covers `conversations`,
 * `attachments`, `config` and the optional encrypted `keys.json`, so an archive
 * taken from a modern install legitimately applies nothing. Reporting success
 * over that no-op is the bug in #1021, and it was live on this surface after the
 * desktop one was fixed.
 */
export type RestoreReport = {
  safetyBackupPath?: string;
  /** Top-level userData entries actually installed. Empty means nothing moved. */
  applied?: string[];
  /** Archive top-level names present but outside the legacy restore scope. */
  outOfScope?: string[];
  /** The archive carries encrypted keys that were skipped for want of a passphrase. */
  keysSkippedNoPassphrase?: boolean;
  fileCount?: number;
};

/**
 * A restore failure that may name where the server kept the operator's own
 * displaced files.
 *
 * When the unwind cannot put every original back, the server keeps the tree
 * holding them rather than deleting it (#1050) - and a preserved copy nobody is
 * told about is indistinguishable from a deleted one. The message stays the
 * classified code the caller already switches on, so the path rides alongside
 * it rather than replacing it.
 */
export type RestoreFailure = Error & { preservedPath?: string };

const restoreFailure = (code: string, preservedPath?: string): RestoreFailure => {
  const error: RestoreFailure = new Error(code);
  if (preservedPath) error.preservedPath = preservedPath;
  return error;
};

/**
 * Restore from an uploaded backup zip. Requires the step-up password; the
 * server also enforces operator provenance. Returns the safety-backup path the
 * server created before applying the restore, plus what the restore applied.
 */
export async function restoreBackupHttp(opts: {
  file: File;
  password: string;
  passphrase?: string;
}): Promise<RestoreReport> {
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
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    msg?: string;
    preservedPath?: string;
    data?: RestoreReport;
  };
  // Both codes mean the SAME thing here: the request was denied before it ever
  // reached the restore handler. This route emits neither itself - a genuinely
  // wrong password surfaces as a 500 with a message - so mapping 401 to
  // RESTORE_BAD_PASSWORD told a merely-unauthenticated caller their password was
  // wrong. That was latent while the middleware answered 403; it became
  // reachable the moment the middleware started (correctly) answering 401.
  if (res.status === 401 || res.status === 403) throw new Error(json.msg || 'RESTORE_NOT_OPERATOR');
  if (res.status === 413) throw new Error('FILE_TOO_LARGE');
  if (!res.ok || !json.success) throw restoreFailure(json.msg || 'RESTORE_FAILED', json.preservedPath);
  return json.data ?? {};
}
