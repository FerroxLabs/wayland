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

const EDIT_GRANT_HEADER = 'x-wayland-constitution-edit-grant';

export type ConstitutionEditScope = 'constitution.write' | `specialist.write:${string}`;
export type ConstitutionEditGrant = { token: string; expiresAt: number };
export type ConstitutionMutationResult =
  | { ok: true }
  | { ok: false; reason: 'authorization_required' | 'request_failed'; status: number; message?: string };

async function postConstitution(
  path: string,
  body: Record<string, unknown>,
  editGrant?: string
): Promise<ConstitutionMutationResult> {
  const csrf = getCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(),
      ...(editGrant ? { [EDIT_GRANT_HEADER]: editGrant } : {}),
    },
    body: JSON.stringify({ ...body, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    code?: string;
    msg?: string;
    data?: { ok?: boolean };
  };

  if (res.ok && json.success) return { ok: true };
  if (res.status === 401 && json.code === 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED') {
    return { ok: false, reason: 'authorization_required', status: res.status, message: json.msg };
  }
  return { ok: false, reason: 'request_failed', status: res.status, message: json.msg };
}

/** Obtain a short-lived scoped autosave grant after a fresh password step-up. */
export async function requestConstitutionEditGrantHttp(
  password: string,
  scopes: readonly ConstitutionEditScope[]
): Promise<ConstitutionEditGrant | null> {
  try {
    const csrf = getCsrfToken();
    const res = await fetch('/api/constitution/edit-grant', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ password, scopes, _csrf: csrf }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: { grant?: string; expiresAt?: number };
    };
    const grant = json.data?.grant;
    const expiresAt = json.data?.expiresAt;
    if (!res.ok || !json.success || typeof grant !== 'string' || !Number.isSafeInteger(expiresAt)) return null;
    return { token: grant, expiresAt: expiresAt as number };
  } catch {
    return null;
  }
}

/** Revoke a hosted edit grant; callers should clear their in-memory copy regardless. */
export async function revokeConstitutionEditGrantHttp(grant: string): Promise<void> {
  await postConstitution('/api/constitution/edit-grant/revoke', {}, grant);
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
 * Overwrite the Constitution from the remote WebUI using a scoped edit grant.
 * The response is structured so the editor can distinguish expired authority
 * from an ordinary request failure. The body is never echoed back.
 */
export function writeConstitutionHttp(content: string, editGrant: string): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/write', { content }, editGrant);
}

/**
 * Restore the default Constitution from the remote WebUI after a fresh
 * password step-up. The default body is never echoed back; the caller re-reads
 * it via `readConstitutionHttp`.
 */
export function resetConstitutionHttp(password: string): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/reset', { password });
}

/**
 * Overwrite a specialist overlay from the remote WebUI using its exact scoped
 * edit grant.
 */
export function writeConstitutionSpecialistHttp(
  id: string,
  content: string,
  editGrant: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/write-specialist', { id, content }, editGrant);
}

/**
 * Remove a specialist overlay from the remote WebUI after a fresh password
 * step-up.
 */
export function deleteConstitutionSpecialistHttp(id: string, password: string): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/delete-specialist', { id, password });
}
