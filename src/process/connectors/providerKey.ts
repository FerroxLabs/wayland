/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared retrieval of a connected provider's stored API key from the model
 * registry (the same store the Models/Providers page shows as "Connected").
 * Returns the key only when the provider is in the `connected` state with a
 * non-empty stored key. Mirrors {@link readConnectedFluxKey} but is
 * provider-agnostic.
 */

import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type { ProviderId } from '@process/providers/types';

/**
 * Why a credential read produced no key.
 *
 * `undecryptable` is the reason this type exists. The repository already
 * distinguishes it - `getRegistryProviderCreds` returns a literal
 * `{ status: 'undecryptable' }` when `safeStorage` cannot open the stored
 * ciphertext, which is what happens to every credential written under a
 * different app identity (a rename, a re-sign, a restored backup). Collapsing
 * that into the same `undefined` as "no provider connected" is what turns a
 * recoverable, nameable condition into "OpenAI is not configured - connect it
 * in Models and Providers", advice that cannot work: the provider IS connected,
 * and connecting it again is the only thing the message asks for.
 *
 * `error` covers a database that could not be opened or read at all. It is kept
 * separate from `not-connected` for the same reason - a caller must never tell
 * the user to go configure something when the truth is that nothing was read.
 */
export type ConnectedProviderKeyResult =
  | { status: 'ok'; key: string }
  /** No such provider in the registry, or it is not in the `connected` state. */
  | { status: 'not-connected' }
  /** Connected, but the stored ciphertext could not be decrypted on this machine. */
  | { status: 'undecryptable' }
  /** The registry itself could not be read. `message` is for logs, never for the wire. */
  | { status: 'error'; message: string };

/**
 * The full outcome of reading a connected provider's key.
 *
 * Prefer this over {@link readConnectedProviderKey} anywhere the result is
 * surfaced to a user: it is the only form that can tell them the true reason.
 */
export async function readConnectedProviderKeyResult(providerId: ProviderId): Promise<ConnectedProviderKeyResult> {
  try {
    const db = await getDatabase();
    const repo = new ProviderRepository(db.getDriver());
    const provider = repo.listRegistryProviders().find((p) => p.providerId === providerId);
    if (!provider || provider.state !== 'connected') return { status: 'not-connected' };
    const stored = repo.getRegistryProviderCreds(providerId);
    if (stored.status === 'undecryptable') return { status: 'undecryptable' };
    if (stored.status !== 'ok') return { status: 'not-connected' };
    const key = stored.creds.key;
    // A connected provider with an empty stored key is a corrupt row, not a
    // decryption failure - "not connected" is the honest bucket and the
    // reconnect advice it produces is the correct fix.
    return typeof key === 'string' && key.length > 0 ? { status: 'ok', key } : { status: 'not-connected' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The connected provider's API key, or undefined when it could not be read.
 *
 * Lossy by construction - every non-`ok` reason collapses to `undefined`. Kept
 * for callers that genuinely only need "can I route through this provider or
 * not"; anything that reports to a user wants
 * {@link readConnectedProviderKeyResult} instead.
 */
export async function readConnectedProviderKey(providerId: ProviderId): Promise<string | undefined> {
  const result = await readConnectedProviderKeyResult(providerId);
  return result.status === 'ok' ? result.key : undefined;
}
