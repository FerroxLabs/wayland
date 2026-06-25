import { describe, it, expect } from 'vitest';
import {
  resolveSpawnSecretsFromRepo,
  mergeSpawnSecrets,
  type SpawnSecrets,
} from '@process/providers/ipc/modelRegistryIpc';
import type { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type { TProviderWithModel } from '@/common/config/storage';

/**
 * Audit C4/C5/C6: the decrypted provider key is resolved in MAIN at dispatch
 * from a non-secret `(provider, account, model)` handle - never handed to the
 * renderer. Resolution is per-call, so concurrent chats on different accounts
 * each get their own key with no shared state.
 */

type Row = { connected: boolean; creds: Record<string, unknown> | 'undecryptable' };

/** Minimal fake of the two `ProviderRepository` methods the resolver reads. */
function makeRepo(rows: Record<string, Row>): ProviderRepository {
  return {
    getRegistryProvider: (id: string) => (rows[id]?.connected ? ({ providerId: id } as unknown) : null),
    getRegistryProviderCreds: (id: string) => {
      const row = rows[id];
      if (!row || row.creds === 'undecryptable') return { status: 'undecryptable' as const };
      return { status: 'ok' as const, creds: row.creds };
    },
  } as unknown as ProviderRepository;
}

describe('resolveSpawnSecretsFromRepo', () => {
  it('resolves the decrypted key for a connected api-key provider', () => {
    const repo = makeRepo({ openai: { connected: true, creds: { key: 'sk-alpha' } } });
    const secrets = resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', modelId: 'gpt-5.5' });
    expect(secrets?.apiKey).toBe('sk-alpha');
  });

  it('returns null when the provider is not connected', () => {
    const repo = makeRepo({});
    expect(resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', modelId: 'gpt-5.5' })).toBeNull();
  });

  it('returns null when creds are undecryptable', () => {
    const repo = makeRepo({ openai: { connected: true, creds: 'undecryptable' } });
    expect(resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', modelId: 'gpt-5.5' })).toBeNull();
  });

  it('returns null when a connected row carries no usable key', () => {
    const repo = makeRepo({ openai: { connected: true, creds: { key: '' } } });
    expect(resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', modelId: 'gpt-5.5' })).toBeNull();
  });

  // Finding 2: a keyless local provider (empty key + loopback base URL) resolves
  // to apiKey === undefined - the explicit "no credential" signal - NOT '' and
  // NOT null. null would block the spawn; '' would be indistinguishable from a
  // resolved-but-empty cloud key and could be inherited downstream.
  it('resolves a keyless local provider to apiKey undefined (intentionally no credential)', () => {
    const repo = makeRepo({
      'ollama-local': { connected: true, creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' } },
    });
    const secrets = resolveSpawnSecretsFromRepo(repo, { providerId: 'ollama-local', modelId: 'llama3:latest' });
    expect(secrets).not.toBeNull();
    expect(secrets?.apiKey).toBeUndefined();
    expect(secrets?.baseUrl).toBe('http://127.0.0.1:11434/v1');
  });

  // Flux: a connected flux-router provider resolves to Flux's OpenAI-compatible
  // base URL even though the stored creds carry no baseUrl. hydrateModelForSpawn
  // routes flux bindings here by FLUX_PROVIDER_ID (their legacy mirror id is a
  // uuid), so the engine gets api.fluxrouter.ai instead of falling back to
  // api.openai.com (which made flux-auto turns hang with no response).
  it('resolves the Flux base URL for a connected flux-router provider', () => {
    const repo = makeRepo({ 'flux-router': { connected: true, creds: { key: 'sk-flux' } } });
    const secrets = resolveSpawnSecretsFromRepo(repo, { providerId: 'flux-router', modelId: 'flux-auto' });
    expect(secrets?.apiKey).toBe('sk-flux');
    expect(secrets?.baseUrl).toBe('https://api.fluxrouter.ai/v1');
  });

  it('picks up a re-keyed provider on the next call (late resolution)', () => {
    const rows: Record<string, Row> = { openai: { connected: true, creds: { key: 'sk-old' } } };
    const repo = makeRepo(rows);
    expect(resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', modelId: 'gpt-5.5' })?.apiKey).toBe('sk-old');
    rows.openai.creds = { key: 'sk-new' };
    expect(resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', modelId: 'gpt-5.5' })?.apiKey).toBe('sk-new');
  });

  // C6 gate: two concurrent dispatches on different accounts/providers each
  // resolve their OWN key against the same repo - no cross-talk, no global slot.
  it('resolves independent keys for two concurrent bindings (no clobber)', () => {
    const repo = makeRepo({
      openai: { connected: true, creds: { key: 'sk-acct-a' } },
      anthropic: { connected: true, creds: { key: 'sk-acct-b' } },
    });
    const a = resolveSpawnSecretsFromRepo(repo, { providerId: 'openai', accountId: 'a', modelId: 'gpt-5.5' });
    const b = resolveSpawnSecretsFromRepo(repo, { providerId: 'anthropic', accountId: 'b', modelId: 'claude-opus-4-8' });
    expect(a?.apiKey).toBe('sk-acct-a');
    expect(b?.apiKey).toBe('sk-acct-b');
  });
});

describe('mergeSpawnSecrets', () => {
  const handleOnly: TProviderWithModel = {
    id: 'openrouter',
    platform: 'openai',
    name: 'OpenRouter',
    baseUrl: '',
    apiKey: '',
    useModel: 'qwen3-coder:free',
    accountId: 'default',
  };

  it('injects the resolved key onto a handle-only binding', () => {
    const secrets: SpawnSecrets = { apiKey: 'sk-resolved', baseUrl: 'https://openrouter.ai/api/v1' };
    const merged = mergeSpawnSecrets(handleOnly, secrets);
    expect(merged.apiKey).toBe('sk-resolved');
    expect(merged.baseUrl).toBe('https://openrouter.ai/api/v1');
    // The original handle is not mutated.
    expect(handleOnly.apiKey).toBe('');
  });

  it('leaves a legacy key-bearing model unchanged when resolution finds nothing', () => {
    const legacy: TProviderWithModel = { ...handleOnly, id: 'legacy-uuid-1234', apiKey: 'sk-legacy' };
    expect(mergeSpawnSecrets(legacy, null).apiKey).toBe('sk-legacy');
  });

  // Finding 2: a keyless local resolution (apiKey === undefined) must CLEAR a
  // stale legacy key, not inherit it. The pre-fix `secrets.apiKey || model.apiKey`
  // fell back to the stale key for an empty/undefined resolved key.
  it('clears a stale model key when the resolved secrets are keyless (apiKey undefined)', () => {
    const stale: TProviderWithModel = { ...handleOnly, id: 'ollama-local', apiKey: 'sk-stale-legacy' };
    const keyless: SpawnSecrets = { apiKey: undefined, baseUrl: 'http://127.0.0.1:11434/v1' };
    const merged = mergeSpawnSecrets(stale, keyless);
    expect(merged.apiKey).toBe('');
    expect(merged.baseUrl).toBe('http://127.0.0.1:11434/v1');
  });
});
