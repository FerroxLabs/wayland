/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { checkProviderConnectivity } from '@process/doctor/checks/providerChecks';
import type { ProviderRegistryReader, ConnectProbe } from '@process/doctor/checks/providerChecks';
import type { RegistryProvider, RegistryCredsResult } from '@process/providers/storage/ProviderRepository';
import type { ProviderId } from '@process/providers/types';

const provider = (id: ProviderId): RegistryProvider => ({
  providerId: id,
  connectedVia: 'api-key',
  state: 'connected',
  credsEncrypted: 'enc',
});

/**
 * Reader with per-provider catalog count, effectively-enabled count, and whether
 * the user wrote any explicit override (the deliberate-disable signal).
 */
const makeReader = (
  providers: RegistryProvider[],
  catalog: Record<string, number>,
  enabled: Record<string, number>,
  overridden: Record<string, boolean> = {}
): ProviderRegistryReader => ({
  listRegistryProviders: () => providers,
  getRegistryProviderCreds: (): RegistryCredsResult => ({ status: 'ok', creds: { key: 'sk-test' } }),
  countRegistryCatalog: (id) => catalog[id] ?? 0,
  countEnabledModels: (id) => enabled[id] ?? 0,
  hasModelOverrides: (id) => overridden[id] ?? false,
});

describe('checkProviderConnectivity — skip user-disabled providers (#271)', () => {
  it('does not probe, warn, or report a user-disabled provider', async () => {
    let probedDisabled = false;
    const reader = makeReader(
      [provider('openai'), provider('deepseek')],
      { openai: 10, deepseek: 8 }, // both have catalogs
      { openai: 5, deepseek: 0 }, // deepseek has 0 enabled
      { deepseek: true } // ...because the user explicitly toggled it OFF (overrides written)
    );
    const probe: ConnectProbe = {
      test: async (id) => {
        if (id === 'deepseek') probedDisabled = true;
        return id === 'deepseek' ? { ok: false, error: 'no-credit' } : { ok: true };
      },
    };
    const result = await checkProviderConnectivity(reader, probe);
    expect(probedDisabled).toBe(false); // never probed
    expect(result.status).toBe('pass'); // disabled provider does not fail/warn
    expect(result.detail).not.toContain('deepseek'); // not reported
    expect(result.detail).toContain('skipped'); // surfaced as skipped
  });

  it('still reports an ENABLED-but-misconfigured provider (not treated as disabled)', async () => {
    const reader = makeReader([provider('openai')], { openai: 8 }, { openai: 3 });
    const probe: ConnectProbe = { test: async () => ({ ok: false, error: 'unauthorized' }) };
    const result = await checkProviderConnectivity(reader, probe);
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('openai');
  });

  // Regression: a provider with 0 enabled models BY DEFAULT (no user override —
  // the curator just didn't flag any model on) must NOT be mistaken for
  // user-disabled. It must still be probed, so a real auth/credit break on it
  // surfaces instead of being silently skipped (the failure this check exists to
  // catch). 0-enabled WITHOUT an explicit override ≠ user intent.
  it('PROBES a provider with 0 enabled-by-default models and no override, and reports its failure', async () => {
    let probed = false;
    const reader = makeReader(
      [provider('openai')],
      { openai: 12 }, // has a catalog
      { openai: 0 }, // but nothing enabled by default (curator flagged none)
      { openai: false } // and the user wrote NO override → not a deliberate disable
    );
    const probe: ConnectProbe = {
      test: async () => {
        probed = true;
        return { ok: false, error: 'unauthorized' };
      },
    };
    const result = await checkProviderConnectivity(reader, probe);
    expect(probed).toBe(true); // must be probed, not skipped
    expect(result.status).toBe('fail'); // the real failure is surfaced
    expect(result.detail).toContain('openai');
  });

  it('does NOT treat an empty-catalog provider as disabled (still probes it)', async () => {
    let probed = false;
    const reader = makeReader([provider('mistral')], { mistral: 0 }, { mistral: 0 });
    const probe: ConnectProbe = {
      test: async () => {
        probed = true;
        return { ok: true };
      },
    };
    const result = await checkProviderConnectivity(reader, probe);
    expect(probed).toBe(true); // empty catalog ≠ user-disabled
    expect(result.status).toBe('pass');
  });

  it('warns when every provider is user-disabled', async () => {
    const reader = makeReader([provider('openai')], { openai: 5 }, { openai: 0 }, { openai: true });
    const probe: ConnectProbe = { test: async () => ({ ok: true }) };
    const result = await checkProviderConnectivity(reader, probe);
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('disabled');
  });
});
