/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared retrieval of the connected Flux key. A connector (or AcpAgentManager)
 * may only route through Flux when the flux-router registry provider is in the
 * `connected` state and has a non-empty stored key (R13 safety gate). Returns
 * undefined in every other case, swallowing errors so callers can treat a
 * missing key as "not connected" rather than crashing.
 */

import { FLUX_PROVIDER_ID } from '@/common/config/flux';
import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';

/** The connected flux-router key, or undefined when not connected. */
export async function readConnectedFluxKey(): Promise<string | undefined> {
  try {
    const db = await getDatabase();
    const repo = new ProviderRepository(db.getDriver());
    const provider = repo.listRegistryProviders().find((p) => p.providerId === FLUX_PROVIDER_ID);
    if (!provider || provider.state !== 'connected') return undefined;
    const stored = repo.getRegistryProviderCreds(FLUX_PROVIDER_ID);
    if (stored.status !== 'ok') return undefined;
    const key = stored.creds.key;
    return typeof key === 'string' && key.length > 0 ? key : undefined;
  } catch {
    return undefined;
  }
}
