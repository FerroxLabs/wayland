/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the headless knowledge-draft route (W1.C, #234).
 * On desktop the wizard goes through Electron IPC
 * (`ipcBridge.project.generateKnowledgeDraft`); in a hosted WebUI that IPC is
 * in the remote-deny list, so headless renderers call this token-authed +
 * CSRF'd HTTP route instead.
 *
 * Never throws — returns a structured result so the wizard never hangs.
 */

export type DraftKind = 'context' | 'rules';

export interface GenerateKnowledgeDraftParams {
  name?: string;
  description?: string;
  kind: DraftKind;
  sourceText?: string;
  filePaths?: string[];
  relatedKnowledge?: string;
  audience?: string;
  constraints?: string;
}

/**
 * Failure classes for a draft attempt (#682). Distinct classes let the wizard
 * tell the user WHICH layer failed instead of one generic message:
 *  - 'no-model' — no configured model can draft (connect a provider)
 *  - 'auth'     — the route rejected the session (token auth or CSRF, 401/403)
 *  - 'bridge'   — the backend was unreachable (network/IPC transport failure)
 *  - 'timeout'  — the request hit the client-side deadline (no infinite spinner)
 *  - 'failed'   — the backend/provider errored; `detail` carries the real cause
 */
export type KnowledgeDraftError = 'no-model' | 'auth' | 'bridge' | 'timeout' | 'failed';

export type KnowledgeDraftResult = { draft: string; error?: KnowledgeDraftError; detail?: string };

/**
 * Client-side ceiling for the whole draft request. The route's own LLM call
 * times out at 90s, so tripping this means the transport hung — without it a
 * dead connection left the wizard in an infinite "Drafting…" state (#682).
 */
const DRAFT_REQUEST_TIMEOUT_MS = 120_000;

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

/**
 * Generate a knowledge draft via the headless HTTP route. Mirrors the IPC
 * handler return shape so the wizard consumes it unchanged: `{ draft }` on
 * success or `{ draft: '', error, detail? }` on failure, with the error class
 * identifying which layer failed (#682).
 */
export async function generateKnowledgeDraftHttp(params: GenerateKnowledgeDraftParams): Promise<KnowledgeDraftResult> {
  try {
    const csrf = getCsrfToken();
    const res = await fetch('/api/projects/generate-knowledge-draft', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ ...params, _csrf: csrf }),
      signal: AbortSignal.timeout(DRAFT_REQUEST_TIMEOUT_MS),
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: KnowledgeDraftResult;
      msg?: string;
      error?: string;
    };
    // Route-level failures carry the cause as `msg` (route validation) or
    // `error` (global errorHandler, e.g. "Invalid or missing CSRF token").
    const serverMsg = json.msg || json.error || '';

    if (res.status === 401 || res.status === 403) {
      // Token auth or CSRF rejection — surface it as an auth failure, not a
      // generic draft failure (#682).
      return { draft: '', error: 'auth', detail: serverMsg || `HTTP ${res.status}` };
    }
    if (!res.ok || !json.success) {
      return { draft: '', error: 'failed', detail: serverMsg || `HTTP ${res.status}` };
    }

    return json.data ?? { draft: '', error: 'failed' };
  } catch (err) {
    // Distinguish "took too long" from "could not reach the backend at all".
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      return { draft: '', error: 'timeout' };
    }
    const detail = err instanceof Error ? err.message : '';
    return { draft: '', error: 'bridge', detail: detail || undefined };
  }
}
