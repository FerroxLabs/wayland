/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';
import {
  parseConstitutionArchiveInventoryResult,
  parseConstitutionArchiveRestoreRequest,
  parseConstitutionArchiveRestoreResult,
  parseConstitutionClassicRecoveryDecisionRequest,
  parseConstitutionClassicRecoveryMetadataResult,
  parseConstitutionClassicRecoveryMutationResult,
  parseConstitutionClassicRecoveryResumeRequest,
  type ConstitutionArchiveInventoryResult,
  type ConstitutionArchiveRestoreRequest,
  type ConstitutionArchiveRestoreResult,
  type ConstitutionClassicRecoveryDecisionRequest,
  type ConstitutionClassicRecoveryMetadataResult,
  type ConstitutionClassicRecoveryMutationResult,
  type ConstitutionClassicRecoveryResumeRequest,
} from '@/common/types/constitutionRecovery';

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
  | { state: 'present'; content: string; revision: string }
  | { state: 'absent'; revision: string };
export type ConstitutionSpecialistEntry = { id: string; bytes: number; revision: string };
export type ConstitutionMutationResult =
  | {
      ok: true;
      revision: string;
      receiptId: string;
      requestId: string;
      requestFingerprint: `sha256:${string}`;
    }
  | {
      ok: false;
      reason: 'authorization_required' | 'conflict' | 'request_failed' | 'unavailable';
      status: number;
      message?: string;
    };

/** Convert the Electron bridge's rejected conflict into the same result used by the hosted client. */
export async function runDesktopConstitutionMutation(
  mutation: () => Promise<unknown>
): Promise<ConstitutionMutationResult> {
  try {
    const result = unwrapDesktopAuthorityEnvelope(await mutation());
    if (
      !result ||
      typeof result !== 'object' ||
      Array.isArray(result) ||
      !hasExactKeys(result, ['ok', 'revision', 'receiptId', 'requestId', 'requestFingerprint']) ||
      (result as { ok?: unknown }).ok !== true ||
      !isOpaqueId((result as { revision?: unknown }).revision) ||
      !isOpaqueId((result as { receiptId?: unknown }).receiptId) ||
      typeof (result as { requestId?: unknown }).requestId !== 'string' ||
      !MUTATION_REQUEST_ID_PATTERN.test((result as { requestId: string }).requestId) ||
      typeof (result as { requestFingerprint?: unknown }).requestFingerprint !== 'string' ||
      !CONTENT_DIGEST_PATTERN.test((result as { requestFingerprint: string }).requestFingerprint)
    ) {
      return { ok: false, reason: 'request_failed', status: 0, message: 'Desktop returned an invalid receipt.' };
    }
    return result as Extract<ConstitutionMutationResult, { ok: true }>;
  } catch (error) {
    const code =
      error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : '';
    const message = error instanceof Error ? error.message : undefined;
    if (code === 'CONSTITUTION_FS_CONFLICT' || message?.includes('CONSTITUTION_FS_CONFLICT')) {
      return { ok: false, reason: 'conflict', status: 409, message };
    }
    if (code === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
      return { ok: false, reason: 'unavailable', status: 0, message };
    }
    return { ok: false, reason: 'request_failed', status: 0, message };
  }
}

/** Validate Electron read envelopes with the same exact runtime contract as hosted reads. */
export async function runDesktopConstitutionRead(read: () => Promise<unknown>): Promise<ConstitutionReadResult> {
  try {
    return parseReadResult(unwrapDesktopAuthorityEnvelope(await read()), 0);
  } catch (error) {
    if ((error as { code?: unknown })?.code === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
      throw new ConstitutionReadError('unavailable', 0);
    }
    throw error;
  }
}

/** Validate Electron inventory envelopes before UI state can treat them as authoritative. */
export async function runDesktopConstitutionSpecialistList(
  read: () => Promise<unknown>
): Promise<ConstitutionSpecialistEntry[]> {
  try {
    return parseSpecialistItems(unwrapDesktopAuthorityEnvelope(await read()), 0);
  } catch (error) {
    if ((error as { code?: unknown })?.code === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
      throw new ConstitutionReadError('unavailable', 0);
    }
    throw error;
  }
}

const SPECIALIST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,256}$/;
const MUTATION_REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTENT_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;

function hasExactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).toSorted();
  const expected = [...keys].toSorted();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function unwrapDesktopAuthorityEnvelope(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Object.assign(new Error('Desktop returned an invalid Constitution authority envelope.'), {
      code: 'CONSTITUTION_FS_INVALID_ENVELOPE',
    });
  }
  const envelope = value as Record<string, unknown>;
  if (envelope.availability === 'available' && hasExactKeys(envelope, ['availability', 'value'])) {
    return envelope.value;
  }
  if (
    envelope.availability === 'unavailable' &&
    envelope.code === 'CONSTITUTION_FS_UNSAFE_PLATFORM' &&
    typeof envelope.reason === 'string' &&
    envelope.reason.length > 0 &&
    hasExactKeys(envelope, ['availability', 'code', 'reason'])
  ) {
    throw Object.assign(new Error(envelope.reason), { code: envelope.code });
  }
  if (
    envelope.availability === 'failed' &&
    (envelope.code === 'CONSTITUTION_FS_CONFLICT' || envelope.code === 'CONSTITUTION_FS_AUTHORITY_FAILURE') &&
    typeof envelope.reason === 'string' &&
    envelope.reason.length > 0 &&
    hasExactKeys(envelope, ['availability', 'code', 'reason'])
  ) {
    throw Object.assign(new Error(envelope.reason), { code: envelope.code });
  }
  throw Object.assign(new Error('Desktop returned an invalid Constitution authority envelope.'), {
    code: 'CONSTITUTION_FS_INVALID_ENVELOPE',
  });
}

export class ConstitutionReadError extends Error {
  constructor(
    readonly code: 'network_error' | 'http_error' | 'malformed_response' | 'unavailable',
    readonly status: number
  ) {
    super(
      code === 'network_error'
        ? 'The Constitution service could not be reached.'
        : code === 'unavailable'
          ? 'The Constitution authority is unavailable on this platform.'
          : code === 'malformed_response'
            ? 'The Constitution service returned an invalid response.'
            : `The Constitution service rejected the read (${status}).`
    );
    this.name = 'ConstitutionReadError';
  }
}

export class ConstitutionArchiveRecoveryClientError extends Error {
  constructor(
    readonly code: 'network_error' | 'malformed_response',
    readonly status: number
  ) {
    super(
      code === 'network_error'
        ? 'Archive recovery could not be reached.'
        : 'Archive recovery returned an invalid response.'
    );
    this.name = 'ConstitutionArchiveRecoveryClientError';
  }
}

export class ConstitutionClassicRecoveryClientError extends Error {
  constructor(
    readonly code: 'network_error' | 'malformed_response',
    readonly status: number
  ) {
    super(
      code === 'network_error'
        ? 'Classic recovery could not be reached.'
        : 'Classic recovery returned an invalid response.'
    );
    this.name = 'ConstitutionClassicRecoveryClientError';
  }
}

function requireArchiveInventoryResult(value: unknown, status: number): ConstitutionArchiveInventoryResult {
  const parsed = parseConstitutionArchiveInventoryResult(value);
  if (!parsed) throw new ConstitutionArchiveRecoveryClientError('malformed_response', status);
  return parsed;
}

function requireArchiveRestoreResult(value: unknown, status: number): ConstitutionArchiveRestoreResult {
  const parsed = parseConstitutionArchiveRestoreResult(value);
  if (!parsed) throw new ConstitutionArchiveRecoveryClientError('malformed_response', status);
  return parsed;
}

/** Validate the direct Electron archive inventory DTO before rendering it. */
export async function runDesktopConstitutionArchiveInventory(
  read: () => Promise<unknown>
): Promise<ConstitutionArchiveInventoryResult> {
  return requireArchiveInventoryResult(await read(), 0);
}

/** Validate the direct Electron archive restore DTO before updating recovery state. */
export async function runDesktopConstitutionArchiveRestore(
  mutation: () => Promise<unknown>
): Promise<ConstitutionArchiveRestoreResult> {
  return requireArchiveRestoreResult(await mutation(), 0);
}

/** Read authenticated hosted archive metadata through the shared DTO. */
export async function listConstitutionArchivesHttp(): Promise<ConstitutionArchiveInventoryResult> {
  let response: Response;
  try {
    response = await fetch('/api/constitution/archives', { method: 'GET', credentials: 'include' });
  } catch {
    throw new ConstitutionArchiveRecoveryClientError('network_error', 0);
  }
  const value = await response.json().catch(() => {
    throw new ConstitutionArchiveRecoveryClientError('malformed_response', response.status);
  });
  return requireArchiveInventoryResult(value, response.status);
}

/** Restore an archive over hosted HTTP without adding transport-only request fields. */
export async function restoreConstitutionArchiveHttp(
  request: ConstitutionArchiveRestoreRequest
): Promise<ConstitutionArchiveRestoreResult> {
  const parsedRequest = parseConstitutionArchiveRestoreRequest(request);
  if (!parsedRequest) throw new ConstitutionArchiveRecoveryClientError('malformed_response', 0);
  let response: Response;
  try {
    response = await fetch('/api/constitution/archives/restore', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify(parsedRequest),
    });
  } catch {
    throw new ConstitutionArchiveRecoveryClientError('network_error', 0);
  }
  const value = await response.json().catch(() => {
    throw new ConstitutionArchiveRecoveryClientError('malformed_response', response.status);
  });
  return requireArchiveRestoreResult(value, response.status);
}

function requireClassicMetadataResult(value: unknown, status: number): ConstitutionClassicRecoveryMetadataResult {
  const parsed = parseConstitutionClassicRecoveryMetadataResult(value);
  if (!parsed) throw new ConstitutionClassicRecoveryClientError('malformed_response', status);
  return parsed;
}

function requireClassicMutationResult(value: unknown, status: number): ConstitutionClassicRecoveryMutationResult {
  const parsed = parseConstitutionClassicRecoveryMutationResult(value);
  if (!parsed) throw new ConstitutionClassicRecoveryClientError('malformed_response', status);
  return parsed;
}

export async function runDesktopConstitutionClassicRecoveryMetadata(
  read: () => Promise<unknown>
): Promise<ConstitutionClassicRecoveryMetadataResult> {
  return requireClassicMetadataResult(await read(), 0);
}

export async function runDesktopConstitutionClassicRecoveryMutation(
  mutation: () => Promise<unknown>
): Promise<ConstitutionClassicRecoveryMutationResult> {
  return requireClassicMutationResult(await mutation(), 0);
}

export async function getConstitutionClassicRecoveryHttp(): Promise<ConstitutionClassicRecoveryMetadataResult> {
  let response: Response;
  try {
    response = await fetch('/api/constitution/classic-recovery', { method: 'GET', credentials: 'include' });
  } catch {
    throw new ConstitutionClassicRecoveryClientError('network_error', 0);
  }
  const value = await response.json().catch(() => {
    throw new ConstitutionClassicRecoveryClientError('malformed_response', response.status);
  });
  return requireClassicMetadataResult(value, response.status);
}

export async function decideConstitutionClassicRecoveryHttp(
  request: ConstitutionClassicRecoveryDecisionRequest
): Promise<ConstitutionClassicRecoveryMutationResult> {
  const parsedRequest = parseConstitutionClassicRecoveryDecisionRequest(request);
  if (!parsedRequest) throw new ConstitutionClassicRecoveryClientError('malformed_response', 0);
  return postClassicRecovery('/api/constitution/classic-recovery/decision', parsedRequest);
}

export async function resumeConstitutionClassicRecoveryHttp(
  request: ConstitutionClassicRecoveryResumeRequest
): Promise<ConstitutionClassicRecoveryMutationResult> {
  const parsedRequest = parseConstitutionClassicRecoveryResumeRequest(request);
  if (!parsedRequest) throw new ConstitutionClassicRecoveryClientError('malformed_response', 0);
  return postClassicRecovery('/api/constitution/classic-recovery/resume', parsedRequest);
}

async function postClassicRecovery(
  endpoint: string,
  request: ConstitutionClassicRecoveryDecisionRequest | ConstitutionClassicRecoveryResumeRequest
): Promise<ConstitutionClassicRecoveryMutationResult> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify(request),
    });
  } catch {
    throw new ConstitutionClassicRecoveryClientError('network_error', 0);
  }
  const value = await response.json().catch(() => {
    throw new ConstitutionClassicRecoveryClientError('malformed_response', response.status);
  });
  return requireClassicMutationResult(value, response.status);
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
  if (!res.ok) {
    if (
      res.status === 503 &&
      json &&
      typeof json === 'object' &&
      !Array.isArray(json) &&
      hasExactKeys(json, ['success', 'code', 'msg']) &&
      (json as { success?: unknown }).success === false &&
      (json as { code?: unknown }).code === 'CONSTITUTION_UNAVAILABLE' &&
      typeof (json as { msg?: unknown }).msg === 'string'
    ) {
      throw new ConstitutionReadError('unavailable', res.status);
    }
    throw new ConstitutionReadError('http_error', res.status);
  }
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
  if (typeof body.requestId !== 'string' || !MUTATION_REQUEST_ID_PATTERN.test(body.requestId)) {
    return { ok: false, reason: 'request_failed', status: 0, message: 'Mutation request identity is invalid.' };
  }
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
    data?: {
      ok?: boolean;
      revision?: unknown;
      receiptId?: unknown;
      requestId?: unknown;
      requestFingerprint?: unknown;
    };
  };

  if (res.ok && json.success === true) {
    if (
      !hasExactKeys(json, ['success', 'data']) ||
      !json.data ||
      !hasExactKeys(json.data, ['ok', 'revision', 'receiptId', 'requestId', 'requestFingerprint'])
    ) {
      return { ok: false, reason: 'request_failed', status: res.status };
    }
    const revision = json.data?.revision;
    const receiptId = json.data?.receiptId;
    const requestId = json.data?.requestId;
    const requestFingerprint = json.data?.requestFingerprint;
    if (
      json.data.ok !== true ||
      !isOpaqueId(revision) ||
      !isOpaqueId(receiptId) ||
      requestId !== body.requestId ||
      typeof requestFingerprint !== 'string' ||
      !CONTENT_DIGEST_PATTERN.test(requestFingerprint)
    ) {
      return { ok: false, reason: 'request_failed', status: res.status };
    }
    return {
      ok: true,
      revision,
      receiptId,
      requestId,
      requestFingerprint: requestFingerprint as `sha256:${string}`,
    };
  }
  const exactCodedFailure =
    json.success === false &&
    typeof json.code === 'string' &&
    typeof json.msg === 'string' &&
    hasExactKeys(json, ['success', 'code', 'msg']);
  if (res.status === 401 && exactCodedFailure && json.code === 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED') {
    return { ok: false, reason: 'authorization_required', status: res.status, message: json.msg };
  }
  if (res.status === 409 && exactCodedFailure && json.code === 'CONSTITUTION_REVISION_CONFLICT') {
    return { ok: false, reason: 'conflict', status: res.status, message: json.msg };
  }
  if (res.status === 503 && exactCodedFailure && json.code === 'CONSTITUTION_UNAVAILABLE') {
    return { ok: false, reason: 'unavailable', status: res.status, message: json.msg };
  }
  const exactPlainFailure =
    json.success === false && typeof json.msg === 'string' && hasExactKeys(json, ['success', 'msg']);
  return {
    ok: false,
    reason: 'request_failed',
    status: res.status,
    ...((exactCodedFailure || exactPlainFailure) && typeof json.msg === 'string' ? { message: json.msg } : {}),
  };
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
  return parseSpecialistList(await getConstitutionData('/api/constitution/specialists'), 200);
}

function parseSpecialistList(data: unknown, status: number): ConstitutionSpecialistEntry[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ConstitutionReadError('malformed_response', status);
  }
  if (!hasExactKeys(data, ['items'])) throw new ConstitutionReadError('malformed_response', status);
  const items = (data as { items?: unknown }).items;
  return parseSpecialistItems(items, status);
}

function parseSpecialistItems(items: unknown, status: number): ConstitutionSpecialistEntry[] {
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
    throw new ConstitutionReadError('malformed_response', status);
  }
  const duplicateIds = new Set<string>();
  for (const item of items as ConstitutionSpecialistEntry[]) {
    if (duplicateIds.has(item.id)) throw new ConstitutionReadError('malformed_response', status);
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
  editGrant: string,
  requestId: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/write', { content, expectedRevision, requestId }, editGrant);
}

/**
 * Restore the default Constitution from the remote WebUI after a fresh
 * password step-up. The default body is never echoed back; the caller re-reads
 * it via `readConstitutionHttp`.
 */
export function resetConstitutionHttp(
  password: string,
  expectedRevision: string,
  requestId: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/reset', { password, expectedRevision, requestId });
}

/**
 * Overwrite a specialist overlay from the remote WebUI using its exact scoped
 * edit grant.
 */
export function writeConstitutionSpecialistHttp(
  id: string,
  content: string,
  expectedRevision: string,
  editGrant: string,
  requestId: string
): Promise<ConstitutionMutationResult> {
  return postConstitution(
    '/api/constitution/write-specialist',
    { id, content, expectedRevision, requestId },
    editGrant
  );
}

/**
 * Remove a specialist overlay from the remote WebUI after a fresh password
 * step-up.
 */
export function deleteConstitutionSpecialistHttp(
  id: string,
  password: string,
  expectedRevision: string,
  requestId: string
): Promise<ConstitutionMutationResult> {
  return postConstitution('/api/constitution/delete-specialist', { id, password, expectedRevision, requestId });
}
