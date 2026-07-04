/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildSpawnConfig, engineInheritsShellKey, MissingApiKeyError } from '../../src/process/agent/wcore/envBuilder';
import { looksLikeAuthFailure } from '../../src/renderer/pages/conversation/platforms/acp/acpAuthFailure';
import type { TProviderWithModel } from '../../src/common/config/storage';

// #629 - the desktop must not spawn a doomed keyless engine. When the chosen
// provider needs an API key but `model.apiKey` is empty (the post-top-up
// dead-end, where a Flux/BYO key that was only ever a per-spawn env var came back
// blank), buildSpawnConfig reports `missingRequiredApiKey: true` so the caller
// refuses the spawn and routes the user to the credential-recovery card.

const workspace = '/tmp/ws';

function makeModel(over: Partial<TProviderWithModel> & { platform: string; useModel: string }): TProviderWithModel {
  return {
    id: 'test-provider',
    name: 'Test Provider',
    baseUrl: '',
    apiKey: '',
    ...over,
  } as TProviderWithModel;
}

describe('buildSpawnConfig - missingRequiredApiKey (#629)', () => {
  describe('flags a key-requiring provider with an EMPTY key', () => {
    it('anthropic with no key', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'anthropic', useModel: 'claude-opus-4-8', apiKey: '' }), {
        workspace,
      });
      expect(r.missingRequiredApiKey).toBe(true);
      expect(r.env.ANTHROPIC_API_KEY).toBeUndefined();
    });

    it('cloud openai with no key', () => {
      const r = buildSpawnConfig(
        makeModel({ platform: 'openai', useModel: 'gpt-5.1', baseUrl: 'https://api.openai.com/v1', apiKey: '' }),
        { workspace }
      );
      expect(r.missingRequiredApiKey).toBe(true);
      expect(r.env.OPENAI_API_KEY).toBeUndefined();
    });

    it('flux-router with no key (the reported post-top-up scenario)', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'flux-router', useModel: 'flux-auto', apiKey: '' }), {
        workspace,
      });
      expect(r.missingRequiredApiKey).toBe(true);
    });

    it('treats a whitespace-only key as empty', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'anthropic', useModel: 'claude-opus-4-8', apiKey: '   ' }), {
        workspace,
      });
      expect(r.missingRequiredApiKey).toBe(true);
    });
  });

  describe('does NOT flag when a key is present', () => {
    it('anthropic with a key', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'anthropic', useModel: 'claude-opus-4-8', apiKey: 'sk-x' }), {
        workspace,
      });
      expect(r.missingRequiredApiKey).toBe(false);
      expect(r.env.ANTHROPIC_API_KEY).toBe('sk-x');
    });

    it('cloud openai with a key', () => {
      const r = buildSpawnConfig(
        makeModel({ platform: 'openai', useModel: 'gpt-5.1', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-x' }),
        { workspace }
      );
      expect(r.missingRequiredApiKey).toBe(false);
      expect(r.env.OPENAI_API_KEY).toBe('sk-x');
    });
  });

  describe('reports the scoped key env var the engine reads (for the shell-key guard)', () => {
    it('anthropic -> ANTHROPIC_API_KEY when empty', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'anthropic', useModel: 'claude-opus-4-8', apiKey: '' }), {
        workspace,
      });
      expect(r.requiredKeyEnvVar).toBe('ANTHROPIC_API_KEY');
    });
    it('cloud openai -> OPENAI_API_KEY when empty', () => {
      const r = buildSpawnConfig(
        makeModel({ platform: 'openai', useModel: 'gpt-5.1', baseUrl: 'https://api.openai.com/v1', apiKey: '' }),
        { workspace }
      );
      expect(r.requiredKeyEnvVar).toBe('OPENAI_API_KEY');
    });
  });

  describe('does NOT flag providers that use non-key credentials', () => {
    it('bedrock (AWS creds via bedrockConfig, not model.apiKey)', () => {
      const r = buildSpawnConfig(
        makeModel({
          platform: 'bedrock',
          useModel: 'claude',
          apiKey: '',
          bedrockConfig: { region: 'us-east-1', authMethod: 'profile', profile: 'default' },
        } as never),
        { workspace }
      );
      expect(r.missingRequiredApiKey).toBe(false);
    });
    it('gemini-vertex-ai (ADC / service account, not model.apiKey)', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'gemini-vertex-ai', useModel: 'gemini-2.5-pro', apiKey: '' }), {
        workspace,
      });
      expect(r.missingRequiredApiKey).toBe(false);
    });
  });

  describe('does NOT flag legitimately keyless spawns', () => {
    it('local openai (localhost) - engine gets the keyless placeholder', () => {
      const r = buildSpawnConfig(
        makeModel({ platform: 'openai', useModel: 'llama3', baseUrl: 'http://localhost:11434/v1', apiKey: '' }),
        { workspace }
      );
      expect(r.missingRequiredApiKey).toBe(false);
      expect(r.env.OPENAI_API_KEY).toBeTruthy(); // LOCAL_KEYLESS_PLACEHOLDER
    });

    it('ChatGPT subscription (OAuth, token from ~/.codex/auth.json)', () => {
      const r = buildSpawnConfig(
        makeModel({
          platform: 'openai-compatible',
          useModel: 'gpt-5.1',
          apiKey: '',
          __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
        } as never),
        { workspace }
      );
      expect(r.missingRequiredApiKey).toBe(false);
    });

    it('raw-engine mode (engine owns its own config.toml)', () => {
      const r = buildSpawnConfig(makeModel({ platform: 'anthropic', useModel: 'claude-opus-4-8', apiKey: '' }), {
        workspace,
        rawEngine: true,
      });
      expect(r.missingRequiredApiKey).toBe(false);
    });
  });
});

describe('engineInheritsShellKey (#629 audit - shell-exported key must not trip the guard)', () => {
  it('is true when the engine would inherit a non-empty allowlisted key from the shell', () => {
    expect(engineInheritsShellKey('OPENAI_API_KEY', { OPENAI_API_KEY: 'sk-shell' })).toBe(true);
    expect(engineInheritsShellKey('ANTHROPIC_API_KEY', { ANTHROPIC_API_KEY: 'sk-ant' })).toBe(true);
  });

  it('is case-insensitive on the env var name (mirrors buildEngineSpawnEnv)', () => {
    expect(engineInheritsShellKey('OPENAI_API_KEY', { openai_api_key: 'sk-x' } as never)).toBe(true);
  });

  it('is false when the var is unset or blank', () => {
    expect(engineInheritsShellKey('OPENAI_API_KEY', {})).toBe(false);
    expect(engineInheritsShellKey('OPENAI_API_KEY', { OPENAI_API_KEY: '   ' })).toBe(false);
  });

  it('is false for a non-allowlisted scoped var even if exported (it never reaches the engine)', () => {
    // A catalog/native scoped var is NOT in ENGINE_ENV_ALLOWLIST, so a shell export
    // of it does not authenticate the engine - the spawn stays "missing".
    expect(engineInheritsShellKey('PERPLEXITY_API_KEY', { PERPLEXITY_API_KEY: 'pk-x' })).toBe(false);
  });

  it('is false for an undefined var', () => {
    expect(engineInheritsShellKey(undefined, { OPENAI_API_KEY: 'sk-x' })).toBe(false);
  });
});

describe('MissingApiKeyError (#629)', () => {
  it('carries the classifiable "No API key found" phrasing so the recovery card fires', () => {
    const err = new MissingApiKeyError('gpt-5.1');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('MissingApiKeyError');
    expect(err.code).toBe('MISSING_API_KEY');
    expect(err.message.toLowerCase()).toContain('no api key found');
    expect(err.message).toContain('gpt-5.1');
    // The renderer classifier matches this phrasing (see acpAuthFailure.test.ts).
  });

  it('is usable without a model label', () => {
    expect(new MissingApiKeyError().message.toLowerCase()).toContain('no api key found');
  });

  // End-to-end contract (#629): the spawn guard throws MissingApiKeyError ->
  // WCoreManager.emitStartFailure wraps it as `Agent failed to start: <message>`
  // -> the renderer's auth classifier must recognize it and show the recovery
  // card. This ties the main-process failure to the renderer remedy so neither
  // side can drift the "No API key found" phrasing without breaking a test.
  it('the emitStartFailure-wrapped MissingApiKeyError is classified as an auth failure', () => {
    const wrapped = `Agent failed to start: ${new MissingApiKeyError('gpt-5.1').message}`;
    expect(looksLikeAuthFailure(wrapped)).toBe(true);
  });
});
