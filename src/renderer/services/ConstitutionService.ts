/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the Constitution + specialist-overlay routes
 * (remote-secure-config Wave 3 task G). On desktop the constitution flow goes
 * through Electron IPC (`constitution:write` / `:reset` / `:writeSpecialist` /
 * `:deleteSpecialist`); in a hosted WebUI that IPC is unreachable, so the
 * headless Constitution settings pane goes through these token-authed + CSRF'd
 * HTTP routes instead.
 *
 * The WRITE routes return only non-secret status ({ ok }), never the body. The
 * single GET is a plain read of the Constitution prose (which is not a secret)
 * so the headless editor can load the current text to edit.
 */

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

async function postConstitution(path: string, body: Record<string, unknown>): Promise<boolean> {
  const csrf = getCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ ...body, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { ok?: boolean };
  };

  return Boolean(res.ok && json.success);
}

/**
 * Read the current Constitution prose from the remote WebUI. Returns the text,
 * or `''` when the read fails. Not a secret - the editor needs it to load.
 */
export async function readConstitutionHttp(): Promise<string> {
  const res = await fetch('/api/constitution', { method: 'GET', credentials: 'include' });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { content?: string };
  };
  return res.ok && json.success ? (json.data?.content ?? '') : '';
}

/**
 * Overwrite the Constitution from the remote WebUI. Returns `true` on a
 * successful write, `false` otherwise. The body is never echoed back.
 */
export function writeConstitutionHttp(content: string): Promise<boolean> {
  return postConstitution('/api/constitution/write', { content });
}

/**
 * Restore the default Constitution from the remote WebUI. Returns `true` on a
 * successful reset, `false` otherwise. The default body is never echoed back -
 * the caller re-reads it via `readConstitutionHttp`.
 */
export function resetConstitutionHttp(): Promise<boolean> {
  return postConstitution('/api/constitution/reset', {});
}

/**
 * Overwrite a specialist overlay from the remote WebUI. Returns `true` on a
 * successful write, `false` otherwise.
 */
export function writeConstitutionSpecialistHttp(id: string, content: string): Promise<boolean> {
  return postConstitution('/api/constitution/write-specialist', { id, content });
}

/**
 * Remove a specialist overlay from the remote WebUI. Returns `true` on a
 * successful delete, `false` otherwise.
 */
export function deleteConstitutionSpecialistHttp(id: string): Promise<boolean> {
  return postConstitution('/api/constitution/delete-specialist', { id });
}
