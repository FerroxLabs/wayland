import { describe, it, expect } from 'vitest';
import {
  resolveSpawnSecretsFromRepo,
  mergeSpawnSecrets,
  mergeResolvedRegistryBinding,
  registryProviderIdForModel,
  vertexSpawnCredentialsForModel,
  type SpawnSecrets,
} from '@process/providers/ipc/modelRegistryIpc';
import type { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type { TProviderWithModel } from '@/common/config/storage';
import { AWS_AUTHORITY_ENV_KEYS, buildEngineSpawnEnv, buildSpawnConfig } from '@process/agent/wcore/envBuilder';
import { GeminiAgent } from '@process/agent/gemini';

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
    const b = resolveSpawnSecretsFromRepo(repo, {
      providerId: 'anthropic',
      accountId: 'b',
      modelId: 'claude-opus-4-8',
    });
    expect(a?.apiKey).toBe('sk-acct-a');
    expect(b?.apiKey).toBe('sk-acct-b');
  });

  it('carries Vertex cloud credentials into the main-only spawn hydration channel', () => {
    const repo = makeRepo({
      vertex: {
        connected: true,
        creds: {
          fields: {
            projectId: 'project-a',
            region: 'us-central1',
            serviceAccountJson: '{"client_email":"agent@example.test"}',
          },
        },
      },
    });
    const secrets = resolveSpawnSecretsFromRepo(repo, { providerId: 'vertex', modelId: 'gemini-2.5-pro' });
    const hydrated = mergeSpawnSecrets(handleOnlyVertex(), secrets);
    expect(vertexSpawnCredentialsForModel(hydrated)).toEqual({
      projectId: 'project-a',
      region: 'us-central1',
      serviceAccountJson: '{"client_email":"agent@example.test"}',
    });
    expect(JSON.stringify(hydrated)).not.toContain('agent@example.test');
  });
});

function handleOnlyVertex(): TProviderWithModel {
  return {
    id: 'legacy-vertex-row',
    platform: 'gemini-vertex-ai',
    name: 'Vertex',
    baseUrl: '',
    apiKey: 'stale-key',
    useModel: 'gemini-2.5-pro',
    accountId: 'default',
    __waylandModelRegistryBridge: 'v2:vertex',
  } as TProviderWithModel;
}

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

  it('fails closed when a v2 registry binding is disconnected or undecryptable', () => {
    const bridged = {
      ...handleOnly,
      id: 'random-legacy-uuid',
      apiKey: 'sk-stale-mirror',
      baseUrl: 'https://stale.example/v1',
      __waylandModelRegistryBridge: 'v2:openrouter',
    } as TProviderWithModel;
    const merged = mergeResolvedRegistryBinding(bridged, null);
    expect(merged.apiKey).toBe('');
    expect(merged.baseUrl).toBe('');
    expect(registryProviderIdForModel(bridged)).toBe('openrouter');
  });

  it('scrubs stale Bedrock credentials on v2 miss, disconnect, and undecryptable lookup before spawn', () => {
    const staleBedrock = {
      ...handleOnly,
      id: 'random-legacy-bedrock-row',
      platform: 'bedrock',
      useModel: 'anthropic.claude-sonnet-4-20250514-v1:0',
      apiKey: 'stale-non-bedrock-key',
      baseUrl: 'https://stale-bedrock.example',
      bedrockConfig: {
        authMethod: 'accessKey',
        region: 'stale-region-1',
        accessKeyId: 'STALE_ACCESS_KEY',
        secretAccessKey: 'STALE_SECRET_KEY',
      },
      __waylandModelRegistryBridge: 'v2:aws-bedrock',
    } as TProviderWithModel;

    const awsKeys = AWS_AUTHORITY_ENV_KEYS;
    const failureRepos = [
      ['lookup-miss', makeRepo({})],
      ['disconnected', makeRepo({ 'aws-bedrock': { connected: false, creds: { key: 'must-not-be-read' } } })],
      ['undecryptable', makeRepo({ 'aws-bedrock': { connected: true, creds: 'undecryptable' } })],
    ] as const;
    const original = Object.fromEntries(awsKeys.map((key) => [key, process.env[key]]));
    try {
      const scrubbedModels = failureRepos.map(([failure, repo]) => {
        const secrets = resolveSpawnSecretsFromRepo(repo, {
          providerId: 'aws-bedrock',
          modelId: staleBedrock.useModel,
        });
        expect(secrets, failure).toBeNull();

        // This is the real canonical-binding merge used by both managers.
        const scrubbed = mergeResolvedRegistryBinding(staleBedrock, secrets);
        expect(scrubbed.apiKey, failure).toBe('');
        expect(scrubbed.baseUrl, failure).toBe('');
        expect(scrubbed.bedrockConfig, failure).toBeUndefined();

        // Contaminate the real parent environment before building the FINAL
        // child environment. Checking buildSpawnConfig().env alone misses
        // ambient variables re-imported by getEnhancedEnv at the spawn seam.
        for (const key of awsKeys) process.env[key] = `ambient-${failure}-${key}`;
        const wcore = buildSpawnConfig(scrubbed, { workspace: '/tmp/wayland-capability-hostile' });
        expect(wcore.ambientEnvDenylist, failure).toEqual(awsKeys);
        expect(wcore.spawnEnvDenylist, failure).toEqual(awsKeys);
        const finalChildEnv = buildEngineSpawnEnv({
          providerEnv: wcore.env,
          toolKeys: { AWS_SESSION_TOKEN: `tool-${failure}-session`, AWS_CONFIG_FILE: `/tool/${failure}/config` },
          ambientEnvDenylist: wcore.ambientEnvDenylist,
          spawnEnvDenylist: wcore.spawnEnvDenylist,
        });
        for (const key of awsKeys) expect(finalChildEnv[key], `${failure}:${key}`).toBeUndefined();
        return scrubbed;
      });

      for (const scrubbed of scrubbedModels) {
        expect(scrubbed).not.toHaveProperty('bedrockConfig');
      }

      // A successfully resolved Bedrock binding remains explicit and is not
      // marked for ambient denial. Its final child environment gets the
      // authoritative registry credentials over conflicting shell values.
      const valid = mergeResolvedRegistryBinding(staleBedrock, {
        apiKey: '',
        baseUrl: '',
        bedrockConfig: {
          authMethod: 'accessKey',
          region: 'resolved-region-1',
          accessKeyId: 'RESOLVED_ACCESS_KEY',
          secretAccessKey: 'RESOLVED_SECRET_KEY',
        },
      });
      const validWcore = buildSpawnConfig(valid, { workspace: '/tmp/wayland-capability-hostile' });
      expect(validWcore.ambientEnvDenylist).toEqual(awsKeys);
      expect(validWcore.spawnEnvDenylist).toBeUndefined();
      const validFinalEnv = buildEngineSpawnEnv({
        providerEnv: validWcore.env,
        toolKeys: { AWS_PROFILE: 'tool-profile', AWS_SESSION_TOKEN: 'tool-session' },
        ambientEnvDenylist: validWcore.ambientEnvDenylist,
        spawnEnvDenylist: validWcore.spawnEnvDenylist,
      });
      expect(validFinalEnv.AWS_REGION).toBe('resolved-region-1');
      expect(validFinalEnv.AWS_ACCESS_KEY_ID).toBe('RESOLVED_ACCESS_KEY');
      expect(validFinalEnv.AWS_SECRET_ACCESS_KEY).toBe('RESOLVED_SECRET_KEY');
      for (const key of awsKeys) {
        if (!['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].includes(key)) {
          expect(validFinalEnv[key], key).toBeUndefined();
        }
      }

      // Profile auth is particularly sensitive to ambient precedence: access
      // keys and session tokens override AWS_PROFILE in the SDK chain. Strip
      // all ambient AWS authority, then reapply only the resolved profile and
      // region from the canonical registry binding.
      const validProfile = mergeResolvedRegistryBinding(staleBedrock, {
        apiKey: '',
        baseUrl: '',
        bedrockConfig: {
          authMethod: 'profile',
          region: 'profile-region-1',
          profile: 'resolved-profile',
        },
      });
      const validProfileWcore = buildSpawnConfig(validProfile, { workspace: '/tmp/wayland-capability-hostile' });
      expect(validProfileWcore.ambientEnvDenylist).toEqual(awsKeys);
      expect(validProfileWcore.spawnEnvDenylist).toBeUndefined();
      const validProfileFinalEnv = buildEngineSpawnEnv({
        providerEnv: validProfileWcore.env,
        toolKeys: {
          AWS_ACCESS_KEY_ID: 'TOOL_ACCESS_KEY',
          AWS_SECRET_ACCESS_KEY: 'TOOL_SECRET_KEY',
          AWS_SESSION_TOKEN: 'TOOL_SESSION_TOKEN',
          AWS_CONFIG_FILE: '/tool/config',
        },
        ambientEnvDenylist: validProfileWcore.ambientEnvDenylist,
      });
      expect(validProfileFinalEnv.AWS_PROFILE).toBe('resolved-profile');
      expect(validProfileFinalEnv.AWS_REGION).toBe('profile-region-1');
      for (const key of awsKeys) {
        if (key !== 'AWS_PROFILE' && key !== 'AWS_REGION') expect(validProfileFinalEnv[key], key).toBeUndefined();
      }

      // Gemini's real constructor clears inherited AWS auth before selecting
      // its provider arm. The scrubbed binding therefore fails closed on the
      // missing authoritative Bedrock config instead of inheriting either the
      // stale mirror or ambient AWS authority.
      for (const key of awsKeys) process.env[key] = `ambient-gemini-${key}`;
      expect(
        () =>
          new GeminiAgent({
            workspace: '/tmp/wayland-capability-hostile',
            model: scrubbedModels[0],
            onStreamEvent: () => {},
          })
      ).toThrow('Bedrock configuration missing');
      for (const key of awsKeys) expect(process.env[key]).toBeUndefined();
    } finally {
      for (const key of awsKeys) {
        const value = original[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
