/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The one classified workspace failure the cron seam knows how to explain.
 *
 * P2-2 and P2-10 both report a workspace problem by THROWING a localized
 * sentence. Inside main that is fine. At the IPC seam it is fatal: the bridge
 * cannot transport a rejection (see `cronBridge`), so the sentence has to reach
 * the renderer as a RESOLVED payload instead - and a resolved payload needs a
 * machine-readable code, because a localized string is not something the
 * renderer can branch on.
 *
 * So the throw sites carry the code with the sentence, and `cronBridge` turns
 * the pair into `{ ok: false, errorCode, path, message }`.
 *
 * `instanceof` is not trusted on its own: electron-vite can load a module twice
 * (main chunk plus a lazily-imported one) and give two distinct classes with
 * the same name, at which point `instanceof` silently answers false and the
 * classification degrades to the catch-all. The brand field is what actually
 * decides.
 */

export type CronWorkspaceErrorCode = 'workspace_missing' | 'workspace_mismatch' | 'workspace_alloc_failed';

const BRAND = 'wayland.cronWorkspaceError' as const;

export class CronWorkspaceError extends Error {
  /** Survives a duplicated module instance, unlike the prototype chain. */
  readonly brand = BRAND;
  readonly code: CronWorkspaceErrorCode;
  /** The folder the failure is about, when the failure names one. */
  readonly path?: string;

  constructor(code: CronWorkspaceErrorCode, message: string, path?: string) {
    super(message);
    this.name = 'CronWorkspaceError';
    this.code = code;
    this.path = path;
  }
}

/** The thrown value as a classified workspace failure, or null. */
export function asCronWorkspaceError(error: unknown): CronWorkspaceError | null {
  if (error instanceof CronWorkspaceError) return error;
  const candidate = error as { brand?: unknown; code?: unknown; message?: unknown; path?: unknown } | null;
  if (!candidate || typeof candidate !== 'object' || candidate.brand !== BRAND) return null;
  if (typeof candidate.code !== 'string') return null;
  return new CronWorkspaceError(
    candidate.code as CronWorkspaceErrorCode,
    typeof candidate.message === 'string' ? candidate.message : '',
    typeof candidate.path === 'string' ? candidate.path : undefined
  );
}
