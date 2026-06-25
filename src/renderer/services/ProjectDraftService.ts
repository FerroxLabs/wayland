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

export type KnowledgeDraftResult = { draft: string; error?: 'no-model' | 'failed'; detail?: string };

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

/**
 * Generate a knowledge draft via the headless HTTP route. Mirrors the IPC
 * handler return shape so the wizard consumes it unchanged: `{ draft }` on
 * success or `{ draft: '', error }` on failure.
 */
export async function generateKnowledgeDraftHttp(params: GenerateKnowledgeDraftParams): Promise<KnowledgeDraftResult> {
  try {
    const csrf = getCsrfToken();
    const res = await fetch('/api/projects/generate-knowledge-draft', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ ...params, _csrf: csrf }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: KnowledgeDraftResult;
      msg?: string;
    };

    if (!res.ok || !json.success) {
      return { draft: '', error: 'failed' };
    }

    return json.data ?? { draft: '', error: 'failed' };
  } catch {
    return { draft: '', error: 'failed' };
  }
}
