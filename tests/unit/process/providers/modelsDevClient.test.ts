/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** A models.dev model object with sane defaults. */
function model(id: string): Record<string, unknown> {
  return {
    id,
    name: id,
    family: 'gpt',
    release_date: '2025-01-01',
    reasoning: true,
    tool_call: true,
    modalities: { input: ['text'], output: ['text'] },
    limit: { context: 200000, output: 8192 },
    cost: { input: 3, output: 15 },
  };
}

/** A minimal-but-valid models.dev registry payload. */
function validRegistry(): Record<string, unknown> {
  return {
    anthropic: {
      id: 'anthropic',
      env: ['ANTHROPIC_API_KEY'],
      name: 'Anthropic',
      models: { 'claude-sonnet': model('claude-sonnet') },
    },
    openai: {
      id: 'openai',
      env: ['OPENAI_API_KEY'],
      name: 'OpenAI',
      models: { 'gpt-5': model('gpt-5') },
    },
    groq: {
      id: 'groq',
      env: ['GROQ_API_KEY'],
      name: 'Groq',
      models: { 'llama-3': model('llama-3') },
    },
  };
}

function createSandbox(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-modelsdev-test-'));
}

function removeSandbox(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Load ModelsDevClient with `electron.app.getPath` pointing at a sandbox
 * (cache dir) and `process.resourcesPath` pointing at a sandbox (snapshot dir).
 *
 * `isPackaged` defaults to `true` (the packaged snapshot path); pass `false`
 * to exercise the dev snapshot path (`process.cwd()/resources/...`).
 */
async function loadClient(userDataDir: string, resourcesDir: string, isPackaged = true) {
  vi.resetModules();
  vi.doMock('electron', () => ({
    app: {
      getPath: (name: string) => {
        if (name === 'userData') return userDataDir;
        throw new Error('unexpected getPath: ' + name);
      },
      isPackaged,
    },
  }));
  // The client resolves the bundled snapshot relative to process.resourcesPath
  // in a packaged build. Point it at a sandbox so tests control snapshot presence.
  (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath = resourcesDir;
  const mod = await import('@process/providers/enrichment/ModelsDevClient');
  return mod;
}

const ORIGINAL_RESOURCES_PATH = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;

// ─── validateRegistry ─────────────────────────────────────────────────────────

describe('validateRegistry', () => {
  it('accepts a well-formed registry with known providers', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const result = validateRegistry(validRegistry());
    expect(result).not.toBeNull();
    expect(result?.anthropic.models['claude-sonnet'].family).toBe('gpt');
  });

  it('tolerates unknown optional fields without rejecting', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    (payload.anthropic as Record<string, unknown>).some_future_field = 'whatever';
    const anthropicModels = (payload.anthropic as { models: Record<string, Record<string, unknown>> }).models;
    anthropicModels['claude-sonnet'].brand_new_capability = true;
    expect(validateRegistry(payload)).not.toBeNull();
  });

  it('rejects a non-object payload', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    expect(validateRegistry('a string')).toBeNull();
    expect(validateRegistry(42)).toBeNull();
    expect(validateRegistry(null)).toBeNull();
    expect(validateRegistry(['array', 'not', 'object'])).toBeNull();
  });

  it('rejects an empty object', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    expect(validateRegistry({})).toBeNull();
  });

  it('rejects a payload missing the well-known providers (schema break)', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    delete (payload as Record<string, unknown>).anthropic;
    expect(validateRegistry(payload)).toBeNull();
  });

  it('rejects a payload whose models is an array (schema change)', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    (payload.anthropic as Record<string, unknown>).models = [{ id: 'x', name: 'x', family: 'x' }];
    expect(validateRegistry(payload)).toBeNull();
  });

  it('rejects a provider with an empty models object', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    (payload.anthropic as Record<string, unknown>).models = {};
    expect(validateRegistry(payload)).toBeNull();
  });

  it('rejects a model missing the required name field', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    const models = (payload.anthropic as { models: Record<string, unknown> }).models;
    models['claude-sonnet'] = { id: 'claude-sonnet', family: 'claude' }; // missing name
    expect(validateRegistry(payload)).toBeNull();
  });

  it('accepts a model with no family field (family is optional in the live registry)', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    const models = (payload.anthropic as { models: Record<string, unknown> }).models;
    models['claude-sonnet'] = { id: 'claude-sonnet', name: 'Claude Sonnet' }; // no family
    expect(validateRegistry(payload)).not.toBeNull();
  });

  it('rejects a model whose family field is the wrong type', async () => {
    const { validateRegistry } = await import('@process/providers/enrichment/modelsDevSchema');
    const payload = validRegistry();
    const models = (payload.anthropic as { models: Record<string, unknown> }).models;
    models['claude-sonnet'] = { id: 'claude-sonnet', name: 'Claude', family: 123 };
    expect(validateRegistry(payload)).toBeNull();
  });
});

// ─── ModelsDevClient.getRegistry - three-rung fallback ────────────────────────

describe('ModelsDevClient.getRegistry', () => {
  let cacheDir: string;
  let resourcesDir: string;

  beforeEach(() => {
    cacheDir = createSandbox();
    resourcesDir = createSandbox();
  });

  afterEach(() => {
    vi.doUnmock('electron');
    vi.unstubAllGlobals();
    vi.resetModules();
    removeSandbox(cacheDir);
    removeSandbox(resourcesDir);
    if (ORIGINAL_RESOURCES_PATH === undefined) {
      delete (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    } else {
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath = ORIGINAL_RESOURCES_PATH;
    }
  });

  it('rung 1: returns the live registry and persists it to the cache', async () => {
    const payload = validRegistry();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(payload),
      })
    );

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();

    expect(Object.keys(registry).toSorted()).toEqual(['anthropic', 'groq', 'openai']);
    // Live success must atomically persist the last-good cache.
    const cached = JSON.parse(fs.readFileSync(path.join(cacheDir, 'modelsdev-cache.json'), 'utf8'));
    expect(cached.anthropic.id).toBe('anthropic');
  });

  it('rung 2: keeps and returns the last-good cache when live JSON is truncated garbage', async () => {
    // Seed a valid last-good cache.
    fs.writeFileSync(path.join(cacheDir, 'modelsdev-cache.json'), JSON.stringify(validRegistry()));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '{"anthropic": {"id": "anthr', // truncated - JSON.parse will throw
      })
    );

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();

    expect(registry.anthropic.id).toBe('anthropic');
    // The corrupt live payload must NOT overwrite the good cache.
    const cached = JSON.parse(fs.readFileSync(path.join(cacheDir, 'modelsdev-cache.json'), 'utf8'));
    expect(cached.openai.id).toBe('openai');
  });

  it('rung 2: falls through to cache when the live payload is an empty object', async () => {
    fs.writeFileSync(path.join(cacheDir, 'modelsdev-cache.json'), JSON.stringify(validRegistry()));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '{}' }));

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();
    expect(registry.openai.id).toBe('openai');
  });

  it('rung 2: falls through to cache when the live payload has a changed schema', async () => {
    fs.writeFileSync(path.join(cacheDir, 'modelsdev-cache.json'), JSON.stringify(validRegistry()));
    const broken = validRegistry();
    (broken.anthropic as Record<string, unknown>).models = ['array-instead-of-object'];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify(broken) }));

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();
    expect(registry.anthropic.id).toBe('anthropic');
  });

  it('rung 3: uses the bundled snapshot when fetch throws and there is no cache', async () => {
    // No cache file. Place a valid snapshot in the resources sandbox.
    const snapshot = validRegistry();
    snapshot.openai = {
      id: 'openai',
      env: ['OPENAI_API_KEY'],
      name: 'OpenAI from snapshot',
      models: { 'gpt-5': (snapshot.openai as { models: Record<string, unknown> }).models['gpt-5'] },
    };
    fs.writeFileSync(path.join(resourcesDir, 'modelsdev-snapshot.json'), JSON.stringify(snapshot));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();
    expect(registry.openai.name).toBe('OpenAI from snapshot');
  });

  it('rung 3: ignores a corrupt cache and falls to the bundled snapshot', async () => {
    fs.writeFileSync(path.join(cacheDir, 'modelsdev-cache.json'), 'not-json-at-all');
    fs.writeFileSync(path.join(resourcesDir, 'modelsdev-snapshot.json'), JSON.stringify(validRegistry()));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();
    expect(registry.anthropic.id).toBe('anthropic');
  });

  it('floor: returns an empty registry and never throws when every rung fails', async () => {
    // No cache, no snapshot, fetch offline.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();
    expect(registry).toEqual({});
  });

  it('floor: returns an empty registry when fetch responds non-ok and there is no fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'Service Unavailable' })
    );

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    const registry = await new ModelsDevClient().getRegistry();
    expect(registry).toEqual({});
  });

  it('does not corrupt the cache if the live payload is invalid (atomic write skipped)', async () => {
    fs.writeFileSync(path.join(cacheDir, 'modelsdev-cache.json'), JSON.stringify(validRegistry()));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'garbage' }));

    const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
    await new ModelsDevClient().getRegistry();

    // No stray temp files should be left behind in the cache directory.
    const leftovers = fs.readdirSync(cacheDir).filter((f) => f.includes('.tmp-'));
    expect(leftovers).toEqual([]);
  });

  it('aborts a hung fetch on timeout and falls through to the cache without throwing', async () => {
    // Seed a valid last-good cache so there is a rung to fall through to.
    fs.writeFileSync(path.join(cacheDir, 'modelsdev-cache.json'), JSON.stringify(validRegistry()));

    // A fetch that never resolves on its own - it only rejects when the
    // client's AbortController fires, mirroring the real abort behaviour.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          })
      )
    );

    vi.useFakeTimers();
    try {
      const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
      const registryPromise = new ModelsDevClient().getRegistry();
      // Advance past FETCH_TIMEOUT_MS (10_000) so the AbortController fires.
      await vi.advanceTimersByTimeAsync(10_001);
      const registry = await registryPromise;
      // The fetch aborted; the client must have fallen through to the cache.
      expect(registry.anthropic.id).toBe('anthropic');
    } finally {
      vi.useRealTimers();
    }
  });

  it('still returns the live registry when persisting the cache fails (unwritable dir)', async () => {
    const payload = validRegistry();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: async () => JSON.stringify(payload),
      })
    );

    // Make the cache directory read-only so the atomic write fails.
    fs.chmodSync(cacheDir, 0o500);
    try {
      const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir);
      const registry = await new ModelsDevClient().getRegistry();
      // The cache write failed silently - the live result must still come back.
      expect(Object.keys(registry).toSorted()).toEqual(['anthropic', 'groq', 'openai']);
    } finally {
      // Restore write permission so afterEach can remove the sandbox.
      fs.chmodSync(cacheDir, 0o700);
    }
  });

  it('rung 3: resolves the dev snapshot path (process.cwd()/resources) when not packaged', async () => {
    // Dev mode resolves the snapshot at <cwd>/resources/modelsdev-snapshot.json.
    const devResourcesDir = path.join(resourcesDir, 'resources');
    fs.mkdirSync(devResourcesDir, { recursive: true });
    const snapshot = validRegistry();
    snapshot.openai = {
      id: 'openai',
      env: ['OPENAI_API_KEY'],
      name: 'OpenAI from dev snapshot',
      models: { 'gpt-5': (snapshot.openai as { models: Record<string, unknown> }).models['gpt-5'] },
    };
    fs.writeFileSync(path.join(devResourcesDir, 'modelsdev-snapshot.json'), JSON.stringify(snapshot));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(resourcesDir);
    try {
      const { ModelsDevClient } = await loadClient(cacheDir, resourcesDir, false);
      const registry = await new ModelsDevClient().getRegistry();
      expect(registry.openai.name).toBe('OpenAI from dev snapshot');
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
