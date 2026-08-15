import { describe, it, expect } from 'vitest';
import {
  NANO_KNOWN_PROVIDER_IDS,
  WNANO_PROVIDERS_MAX_BYTES,
  WNANO_PROVIDERS_MAX_ENTRIES,
  WNANO_PROVIDERS_MAX_ID_CHARS,
  WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER,
  buildWaylandNanoProvidersPayload,
} from '@process/task/wnano';

const parse = (json: string | undefined) => (json ? (JSON.parse(json) as unknown[]) : undefined);

const fatModels = (prefix: string) => Array.from({ length: 200 }, (_, i) => `${prefix}-${'x'.repeat(100)}${i}`);

describe('buildWaylandNanoProvidersPayload (C8 WAYLAND_NANO_PROVIDERS)', () => {
  it('serializes the exact {provider, models, hasKey} schema', () => {
    const payload = parse(
      buildWaylandNanoProvidersPayload([{ provider: 'openai', models: ['gpt-5.6-terra'], hasKey: true }])
    );
    expect(payload).toEqual([{ provider: 'openai', models: ['gpt-5.6-terra'], hasKey: true }]);
  });

  it('never emits endpoint/routing fields, even when the input carries them', () => {
    const hostile = {
      provider: 'openai',
      models: ['gpt-5.6-terra'],
      hasKey: true,
      base_url: 'https://evil.example/v1',
      wire: 'responses',
      api_path: '/chat/completions',
      env_var: 'SK_SECRET',
      apiKey: 'sk-live-secret',
    };
    const payload = parse(buildWaylandNanoProvidersPayload([hostile])) as Array<Record<string, unknown>>;
    expect(Object.keys(payload[0]).toSorted()).toEqual(['hasKey', 'models', 'provider']);
    expect(JSON.stringify(payload)).not.toContain('evil.example');
    expect(JSON.stringify(payload)).not.toContain('sk-live-secret');
  });

  it('excludes provider ids outside Nano known set', () => {
    const payload = parse(
      buildWaylandNanoProvidersPayload([
        { provider: 'not-a-nano-provider', models: ['m1'], hasKey: true },
        { provider: 'groq', models: ['llama-4'], hasKey: false },
      ])
    );
    expect(payload).toEqual([{ provider: 'groq', models: ['llama-4'], hasKey: false }]);
  });

  it('returns undefined when no entry survives (no env var is injected)', () => {
    expect(buildWaylandNanoProvidersPayload([])).toBeUndefined();
    expect(
      buildWaylandNanoProvidersPayload([{ provider: 'unknown-thing', models: ['m'], hasKey: true }])
    ).toBeUndefined();
  });

  it('orders providers deterministically by Nano known-set order, not input order', () => {
    const payload = parse(
      buildWaylandNanoProvidersPayload([
        { provider: 'xai', models: ['grok-4'], hasKey: true },
        { provider: 'openai', models: ['gpt-5.6-terra'], hasKey: true },
        { provider: 'flux-router', models: ['flux-auto'], hasKey: true },
      ])
    ) as Array<{ provider: string }>;
    expect(payload.map((entry) => entry.provider)).toEqual(['flux-router', 'openai', 'xai']);
    expect(payload.map((entry) => entry.provider)).toEqual(
      ['flux-router', 'openai', 'xai'].toSorted(
        (a, b) => NANO_KNOWN_PROVIDER_IDS.indexOf(a as never) - NANO_KNOWN_PROVIDER_IDS.indexOf(b as never)
      )
    );
  });

  it('dedupes model ids, first occurrence wins, preserving order', () => {
    const payload = parse(
      buildWaylandNanoProvidersPayload([{ provider: 'openai', models: ['a', 'b', 'a', 'c', 'b'], hasKey: true }])
    ) as Array<{ models: string[] }>;
    expect(payload[0].models).toEqual(['a', 'b', 'c']);
  });

  it('drops blank and over-128-char model ids', () => {
    const tooLong = 'm'.repeat(WNANO_PROVIDERS_MAX_ID_CHARS + 1);
    const atLimit = 'm'.repeat(WNANO_PROVIDERS_MAX_ID_CHARS);
    const payload = parse(
      buildWaylandNanoProvidersPayload([
        { provider: 'openai', models: ['', '   ', tooLong, atLimit, 'ok'], hasKey: true },
      ])
    ) as Array<{ models: string[] }>;
    expect(payload[0].models).toEqual([atLimit, 'ok']);
  });

  it('caps models per provider at 256', () => {
    const models = Array.from({ length: WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER + 50 }, (_, i) => `m${i}`);
    const payload = parse(buildWaylandNanoProvidersPayload([{ provider: 'openai', models, hasKey: true }])) as Array<{
      models: string[];
    }>;
    expect(payload[0].models).toHaveLength(WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER);
    expect(payload[0].models[0]).toBe('m0');
  });

  it('caps entries at 64 (first duplicate provider occurrence wins)', () => {
    // Only 17 known ids exist, so the entry cap is exercised via duplicates:
    // duplicates collapse to one entry and never multiply past the cap.
    const entries = Array.from({ length: 100 }, () => ({
      provider: 'openai',
      models: ['gpt-5.6-terra'],
      hasKey: true,
    }));
    const payload = parse(buildWaylandNanoProvidersPayload(entries)) as unknown[];
    expect(payload).toHaveLength(1);
    expect(payload.length).toBeLessThanOrEqual(WNANO_PROVIDERS_MAX_ENTRIES);
  });

  it('never exceeds 32 KiB serialized: trailing providers are dropped first', () => {
    const payload = buildWaylandNanoProvidersPayload([
      { provider: 'flux-router', models: ['flux-auto'], hasKey: true },
      { provider: 'openai', models: fatModels('openai'), hasKey: true },
      { provider: 'anthropic', models: fatModels('anthropic'), hasKey: true },
    ]);
    expect(payload).toBeDefined();
    expect(Buffer.byteLength(payload!, 'utf8')).toBeLessThanOrEqual(WNANO_PROVIDERS_MAX_BYTES);
    const parsed = parse(payload) as Array<{ provider: string; models: string[] }>;
    // The small leading provider survives; size pressure is absorbed from the end.
    expect(parsed[0]).toEqual({ provider: 'flux-router', models: ['flux-auto'], hasKey: true });
    expect(parsed.length).toBeLessThan(3);
  });

  it('trims a single oversize provider model list from the end rather than exceeding the cap', () => {
    // 124-char prefix + up-to-3-char index stays under the 128-char id limit
    // while 256 of them exceed 32 KiB serialized, forcing the trim path.
    const models = Array.from({ length: WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER }, (_, i) => `${'y'.repeat(124)}${i}`);
    const payload = buildWaylandNanoProvidersPayload([{ provider: 'openai', models, hasKey: true }]);
    expect(payload).toBeDefined();
    expect(Buffer.byteLength(payload!, 'utf8')).toBeLessThanOrEqual(WNANO_PROVIDERS_MAX_BYTES);
    const parsed = parse(payload) as Array<{ provider: string; models: string[] }>;
    expect(parsed[0].provider).toBe('openai');
    expect(parsed[0].models.length).toBeGreaterThan(0);
    expect(parsed[0].models.length).toBeLessThan(models.length);
  });
});
