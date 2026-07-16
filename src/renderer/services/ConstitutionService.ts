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
export type ConstitutionReadResult =
  { state: 'present'; content: string; revision: string } | { state: 'absent'; revision: string };
export type ConstitutionSpecialistEntry = { id: string; bytes: number; revision: string };
export type ConstitutionMutationResult =
  | { ok: true; revision: string; receiptId: string }
  | {
      ok: false;
      reason: 'authorization_required' | 'conflict' | 'request_failed';
      status: number;
      message?: string;
    };

const SPECIALIST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,256}$/;

function hasExactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).toSorted();
  const expected = [...keys].toSorted();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export class ConstitutionReadError extends Error {
  constructor(
    readonly code: 'network_error' | 'http_error' | 'malformed_response',
    readonly status: number
  ) {
    super(
      code === 'network_error'
        ? 'The Constitution service could not be reached.'
        : code === 'malformed_response'
          ? 'The Constitution service returned an invalid response.'
          : `The Constitution service rejected the read (${status}).`
    );
    this.name = 'ConstitutionReadError';
  }
}

async function getConstitutionData(path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'GET', credentials: 'include' });
  } catch {
    throw new ConstitutionReadError('network_error', 0);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ConstitutionReadError(res.ok ? 'malformed_response' : 'http_error', res.status);
  }
  if (!res.ok) throw new ConstitutionReadError('http_error', res.status);
  if (!json || typeof json !== 'object' || Array.isArray(json) || !hasExactKeys(json, ['success', 'data'])) {
    throw new ConstitutionReadError('malformed_response', res.status);
  }
  const envelope = json as { success?: unknown; data?: unknown };
  if (envelope.success !== true) throw new ConstitutionReadError('malformed_response', res.status);
  return envelope.data;
}

function parseReadResult(data: unknown, status = 200): ConstitutionReadResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ConstitutionReadError('malformed_response', status);
  }
  const result = data as { state?: unknown; content?: unknown };
  const revision = (data as { revision?: unknown }).revision;
  if (result.state === 'absent' && hasExactKeys(data, ['state', 'revision']) && isOpaqueId(revision)) {
    return { state: 'absent', revision };
  }
  if (
    result.state === 'present' &&
    hasExactKeys(data, ['state', 'content', 'revision']) &&
    typeof result.content === 'string' &&
    isOpaqueId(revision)
  ) {
    return { state: 'present', content: result.content, revision };
  }
  throw new ConstitutionReadError('malformed_response', status);
}

function isOpaqueId(value: unknown): value is string {
  return typeof value === 'string' && OPAQUE_ID_PATTERN.test(value);
}

async function postConstitution(
  path: string,
  body: Record<string, unknown>,
  editGrant?: string
): Promise<ConstitutionMutationResult> {
  const csrf = getCsrfToken();
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(),
        ...(editGrant ? { [EDIT_GRANT_HEADER]: editGrant } : {}),
      },
      body: JSON.stringify({ ...body, _csrf: csrf }),
    });
  } catch {
    return { ok: false, reason: 'request_failed', status: 0 };
  }

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    code?: string;
    msg?: string;
    data?: { ok?: boolean; revision?: unknown; receiptId?: unknown };
  };

  if (res.ok && json.success === true) {
    if (
      !hasExactKeys(json, ['success', 'data']) ||
      !json.data ||
      !hasExactKeys(json.data, ['ok', 'revision', 'receiptId'])
    ) {
      return { ok: false, reason: 'request_failed', status: res.status };
    }
    const revision = json.data?.revision;
    const receiptId = json.data?.receiptId;
    if (json.data.ok !== true || !isOpaqueId(revision) || !isOpaqueId(receiptId)) {
      return { ok: false, reason: 'request_failed', status: res.status };
    }
    return { ok: true, revision, receiptId };
  }
  if (res.status === 401 && json.code === 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED') {
    return { ok: false, reason: 'authorization_required', status: res.status, message: json.msg };
  }
  if (res.status === 409 && json.code === 'CONSTITUTION_REVISION_CONFLICT') {
    return { ok: false, reason: 'conflict', status: res.status, message: json.msg };
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
    if (
      !res.ok ||
      json.success !== true ||
      !hasExactKeys(json, ['success', 'data']) ||
      !json.data ||
      !hasExactKeys(json.data, ['grant', 'expiresAt']) ||
      !isOpaqueId(grant) ||
      !Number.isSafeInteger(expiresAt) ||
      (expiresAt as number) <= Date.now()
    )
      return null;
    return { token: grant, expiresAt: expiresAt as number };
  } catch {
    return null;
  }
}

/** Revoke a hosted edit grant; callers should clear their in-memory copy regardless. */
export async function revokeConstitutionEditGrantHttp(grant: string): Promise<void> {
  const csrf = getCsrfToken();
  await fetch('/api/constitution/edit-grant/revoke', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(),
      [EDIT_GRANT_HEADER]: grant,
    },
    body: JSON.stringify({ _csrf: csrf }),
  }).catch((): undefined => undefined);
}

/**
 * Read the current Constitution prose from the remote WebUI without collapsing
 * an absent file, an intentionally empty file, or a failed read into one value.
 */
export async function readConstitutionHttp(): Promise<ConstitutionReadResult> {
  return parseReadResult(await getConstitutionData('/api/constitution'));
}

/** List hosted specialist overlays through the same authenticated read boundary. */
export async function listConstitutionSpecialistsHttp(): Promise<ConstitutionSpecialistEntry[]> {
  const data = await getConstitutionData('/api/constitution/specialists');
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ConstitutionReadError('malformed_response', 200);
  }
  if (!hasExactKeys(data, ['items'])) throw new ConstitutionReadError('malformed_response', 200);
  const items = (data as { items?: unknown }).items;
  if (
    !Array.isArray(items) ||
    items.some(
      (item) =>
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        typeof (item as { id?: unknown }).id !== 'string' ||
        !SPECIALIST_ID_PATTERN.test((item as { id: string }).id) ||
        !Number.isSafeInteger((item as { bytes?: unknown }).bytes) ||
        ((item as { bytes: number }).bytes ?? -1) < 0 ||
        !hasExactKeys(item as object, ['id', 'bytes', 'revision']) ||
        !isOpaqueId((item as { revision?: unknown }).revision)
    )
  ) {
    throw new ConstitutionReadError('malformed_response', 200);
  }
  const duplicateIds = new Set<string>();
  for (const item of items as ConstitutionSpecialistEntry[]) {
    if (duplicateIds.has(item.id)) throw new ConstitutionReadError('malformed_response', 200);
    duplicateIds.add(item.id);
  }
  return (items as ConstitutionSpecialistEntry[])
    .map((item) => ({ id: item.id, bytes: item.bytes, revision: item.revision }))
    .toSorted((left, right) => left.id.localeCompare(right.id));
}

/** Read one hosted specialist overlay with explicit present/absent truth. */
export async function readConstitutionSpecialistHttp(id: string): Promise<ConstitutionReadResult> {
  if (!SPECIALIST_ID_PATTERN.test(id)) throw new ConstitutionReadError('malformed_response', 0);
  return parseReadResult(await getConstitutionData(`/api/constitution/specialist?id=${encodeURIComponent(id)}`));
}

/**
 * Overwrite the Constitution from the remote WebUI using a scoped edit grant.
 * The response is structured so the editor can distinguish expired authority
 * from an ordinary request failure. The body is never echoed back.
 */
export function writeConstitutionHttp(
  content: string,
  expectedRevision: string,
  editGrant: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/write', { content, expectedRevision }, editGrant);
}

/**
 * Restore the default Constitution from the remote WebUI after a fresh
 * password step-up. The default body is never echoed back; the caller re-reads
 * it via `readConstitutionHttp`.
 */
export function resetConstitutionHttp(password: string, expectedRevision: string): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/reset', { password, expectedRevision });
}

/**
 * Overwrite a specialist overlay from the remote WebUI using its exact scoped
 * edit grant.
 */
export function writeConstitutionSpecialistHttp(
  id: string,
  content: string,
  expectedRevision: string,
  editGrant: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/write-specialist', { id, content, expectedRevision }, editGrant);
}

/**
 * Remove a specialist overlay from the remote WebUI after a fresh password
 * step-up.
 */
export function deleteConstitutionSpecialistHttp(
  id: string,
  password: string,
  expectedRevision: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/delete-specialist', { id, password, expectedRevision });
}
