/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared retrieval of a connected provider's stored API key from the model
 * registry (the same store the Models/Providers page shows as "Connected").
 * Returns the key only when the provider is in the `connected` state with a
 * non-empty stored key, and swallows errors so callers can treat a missing key
 * as "not connected" rather than crashing. Mirrors {@link readConnectedFluxKey}
 * but is provider-agnostic.
 */

import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type { ProviderId } from '@process/providers/types';

/** The connected provider's API key, or undefined when not connected. */
export async function readConnectedProviderKey(providerId: ProviderId): Promise<string | undefined> {
  try {
    const db = await getDatabase();
    const repo = new ProviderRepository(db.getDriver());
    const provider = repo.listRegistryProviders().find((p) => p.providerId === providerId);
    if (!provider || provider.state !== 'connected') return undefined;
    const stored = repo.getRegistryProviderCreds(providerId);
    if (stored.status !== 'ok') return undefined;
    const key = stored.creds.key;
    return typeof key === 'string' && key.length > 0 ? key : undefined;
  } catch {
    return undefined;
  }
}
