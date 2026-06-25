import { describe, it, expect } from 'vitest';
import { normalizeCatalogEntry, type RawCatalogEntry } from '@process/providers/catalog/catalogProvider';
import { isCatalogEligible, NATIVE_COLLISION_IDS } from '@process/providers/catalog/catalogCuration';

/** A clean, selectable OpenAI-compatible row (the common case). */
const novita: RawCatalogEntry = {
  id: 'novita-ai',
  display_name: 'Novita AI',
  base_url: 'https://api.novita.ai/openai',
  env_var: 'NOVITA_API_KEY',
  openai_compatible: true,
  api_path: '/chat/completions',
};

describe('isCatalogEligible', () => {
  it('accepts a clean OpenAI-compatible cloud entry', () => {
    expect(isCatalogEligible(novita)).toEqual({ eligible: true });
  });

  it('accepts a cloud entry whose host merely contains a local-sounding name (ollama.com)', () => {
    const ollamaCloud: RawCatalogEntry = {
      id: 'ollama-cloud',
      display_name: 'Ollama Cloud',
      base_url: 'https://ollama.com/v1',
      env_var: 'OLLAMA_API_KEY',
      openai_compatible: true,
    };
    expect(isCatalogEligible(ollamaCloud)).toEqual({ eligible: true });
  });

  it('rejects a localhost base_url as local-only', () => {
    expect(isCatalogEligible({ ...novita, id: 'lmstudio', base_url: 'http://localhost:1234/v1' })).toEqual({
      eligible: false,
      reason: 'local-only',
    });
  });

  it('rejects 127.0.0.1 / 0.0.0.0 / *.local hosts as local-only', () => {
    expect(isCatalogEligible({ ...novita, id: 'a', base_url: 'http://127.0.0.1:11434/v1' }).reason).toBe('local-only');
    expect(isCatalogEligible({ ...novita, id: 'b', base_url: 'http://0.0.0.0:8080/v1' }).reason).toBe('local-only');
    expect(isCatalogEligible({ ...novita, id: 'c', base_url: 'http://my-box.local/v1' }).reason).toBe('local-only');
  });

  it('rejects an ollama-style default local endpoint as local-only', () => {
    expect(isCatalogEligible({ ...novita, id: 'ollama', base_url: 'http://localhost:11434' }).reason).toBe(
      'local-only'
    );
  });

  it('rejects a templated base_url (${...} placeholder)', () => {
    expect(
      isCatalogEligible({ ...novita, id: 'databricks', base_url: 'https://${ACCOUNT}.databricks.com/v1' })
    ).toEqual({ eligible: false, reason: 'templated' });
    expect(isCatalogEligible({ ...novita, id: 'cf', base_url: 'https://api.cloudflare.com/${REGION}/v1' }).reason).toBe(
      'templated'
    );
  });

  it('rejects a non-OpenAI-compatible (anthropic-wire) entry', () => {
    expect(isCatalogEligible({ ...novita, id: 'kimi-for-coding', openai_compatible: false })).toEqual({
      eligible: false,
      reason: 'anthropic-wire',
    });
  });

  it('rejects entries missing required fields', () => {
    expect(isCatalogEligible({ ...novita, env_var: '' }).reason).toBe('missing-fields');
    expect(isCatalogEligible({ ...novita, id: '' }).reason).toBe('missing-fields');
    expect(isCatalogEligible({ ...novita, base_url: '' }).reason).toBe('missing-fields');
    expect(isCatalogEligible({ ...novita, env_var: '   ' }).reason).toBe('missing-fields');
  });

  it('rejects an id that collides with a native provider', () => {
    expect(isCatalogEligible({ ...novita, id: 'openai' })).toEqual({ eligible: false, reason: 'native-collision' });
    expect(isCatalogEligible({ ...novita, id: 'deepseek' }).reason).toBe('native-collision');
  });

  it('checks missing-fields before native-collision (empty id wins)', () => {
    expect(isCatalogEligible({ ...novita, id: '' }).reason).toBe('missing-fields');
  });
});

describe('NATIVE_COLLISION_IDS', () => {
  it('contains the native provider ids', () => {
    expect(NATIVE_COLLISION_IDS.has('openai')).toBe(true);
    expect(NATIVE_COLLISION_IDS.has('anthropic')).toBe(true);
    expect(NATIVE_COLLISION_IDS.has('flux-router')).toBe(true);
    expect(NATIVE_COLLISION_IDS.has('chatgpt-subscription')).toBe(true);
    expect(NATIVE_COLLISION_IDS.has('novita-ai')).toBe(false);
  });

  it('has the full 35-member native set', () => {
    expect(NATIVE_COLLISION_IDS.size).toBe(35);
  });

  it('includes the native ollama-local id (so a bundled local catalog row is dropped as a collision)', () => {
    expect(NATIVE_COLLISION_IDS.has('ollama-local')).toBe(true);
  });
});

describe('normalizeCatalogEntry', () => {
  it('maps the snake_case engine shape to the camelCase desktop shape', () => {
    expect(normalizeCatalogEntry(novita)).toEqual({
      id: 'novita-ai',
      displayName: 'Novita AI',
      baseUrl: 'https://api.novita.ai/openai',
      envVar: 'NOVITA_API_KEY',
      apiPath: '/chat/completions',
    });
  });

  it('omits apiPath when the engine entry has none', () => {
    const { api_path: _omit, ...noPath } = novita;
    const normalized = normalizeCatalogEntry(noPath);
    expect(normalized.apiPath).toBeUndefined();
    expect('apiPath' in normalized).toBe(false);
  });

  it('preserves an explicit empty-string api_path (base_url IS the full endpoint)', () => {
    expect(normalizeCatalogEntry({ ...novita, api_path: '' }).apiPath).toBe('');
  });
});
