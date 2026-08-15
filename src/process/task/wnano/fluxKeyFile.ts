/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `FLUX_API_KEY_FILE` handoff for wnano (Wayland Nano) spawns (C8 provider
 * parity, design §6.1 / Q4 ruling).
 *
 * Nano resolves its Flux credential as `FLUX_API_KEY` -> `FLUX_TEST_KEY` ->
 * the file named by `FLUX_API_KEY_FILE`. Desktop NEVER emits `FLUX_API_KEY`
 * (it stays a documented manual/dev-only fallback for non-Desktop launches);
 * instead it writes the connected Flux key to a per-conversation file under
 * userData and hands Nano the PATH - never the secret - via the env var.
 *
 * Guarantees (mirroring `codexAuthFile.ts`):
 *  - ATOMIC write: write to a temp sibling, then rename over the target.
 *  - Mode 0600 on POSIX. On Windows POSIX mode bits are fiction, so the
 *    guarantee there is the userData directory ACL (which is already
 *    user-scoped); no POSIX-style bit check is attempted on Windows.
 *  - Lifecycle cleanup: the file is deleted when the spawn/agent is torn down
 *    (AcpAgentManager.kill).
 *  - The key value is NEVER logged - these functions return paths/booleans
 *    only and swallow write errors so a failed handoff degrades to Nano's
 *    ambient-env fallback instead of crashing the spawn.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/** Subdirectory under userData holding the per-conversation Flux key files. */
const WNANO_KEY_DIR = 'wnano';

/**
 * Absolute path of the Flux key file for one wnano conversation. The
 * conversation id is filename-sanitized so each concurrent wnano spawn gets
 * its own file and one teardown can never delete another spawn's credential.
 */
export function wnanoFluxKeyFilePath(userDataDir: string, conversationId: string): string {
  const safeId = conversationId.replace(/[^A-Za-z0-9_-]/g, '_') || 'default';
  return path.join(userDataDir, WNANO_KEY_DIR, `flux-api-key-${safeId}`);
}

/**
 * Atomically write the connected Flux key to its handoff file (dir 0o700,
 * file 0o600 on POSIX; userData directory ACL on Windows) and return the
 * absolute path to inject as `FLUX_API_KEY_FILE`. Returns `undefined` on any
 * failure. Never throws, never logs the key.
 */
export async function writeWnanoFluxKeyFile(
  userDataDir: string,
  conversationId: string,
  fluxKey: string
): Promise<string | undefined> {
  if (fluxKey.length === 0) return undefined;
  try {
    const file = wnanoFluxKeyFilePath(userDataDir, conversationId);
    await fs.promises.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const tmp = `${file}.tmp-${process.pid}`;
    await fs.promises.writeFile(tmp, fluxKey, { mode: 0o600 });
    await fs.promises.rename(tmp, file);
    // rename preserves the temp file's mode, but chmod again defensively in
    // case an existing target's perms lingered on some platforms.
    await fs.promises.chmod(file, 0o600);
    return file;
  } catch {
    return undefined;
  }
}

/**
 * Best-effort deletion of a handoff file at spawn/agent teardown. Never
 * throws - a leftover file is inert (userData-scoped, 0600) and is overwritten
 * atomically on the next spawn of the same conversation.
 */
export async function cleanupWnanoFluxKeyFile(filePath: string): Promise<void> {
  try {
    await fs.promises.rm(filePath, { force: true });
  } catch {
    // Already gone / unlink failed - nothing to do.
  }
}
