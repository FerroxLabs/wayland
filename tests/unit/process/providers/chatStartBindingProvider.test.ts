/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1124 - "Ollama-selected Code and Cowork chats request an OpenAI API key".
 *
 * The home picker resolves the model the user clicked through
 * `modelRegistry.resolveForChatStart`, then builds the `TProviderWithModel`
 * binding the chat runs on. That build used to SPREAD a fuzzy lookup into the
 * legacy `model.config` list (`p.model?.includes(modelId)`) underneath the
 * resolved handle - and the one field the handle does not overwrite is
 * `__waylandModelRegistryBridge`, the `v2:<providerId>` tag that
 * `hydrateModelForSpawn` reads FIRST when it decides whose credentials to
 * resolve.
 *
 * So a model name two providers share (every Ollama tag is shared by the local
 * daemon and Ollama Cloud) could bind a LOCAL, keyless pick to a DIFFERENT
 * provider's registry row. When that row is not connected the spawn resolution
 * fails closed, wiping `apiKey` AND `baseUrl`, and the Gemini runtime's
 * OpenAI-compatible arm then throws `OpenAI API key is required` - naming a
 * vendor the user never chose, about a daemon on loopback that needs no key.
 *
 * The binding must name the provider the user actually picked. These tests
 * assert the tag AND the credential/endpoint that reaches the spawn.
 */
import { describe, it, expect, vi } from 'vitest';

const { mockSafeStorage } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((p: string) => Buffer.from(p)),
    decryptString: vi.fn((c: Buffer) => c.toString('utf8')),
  },
}));
vi.mock('electron', () => ({ safeStorage: mockSafeStorage }));
vi.mock('@process/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(async () => ({ ok: false, json: async () => ({}) })),
}));
vi.mock('@process/onboarding/codexAuthFile', () => ({ readCodexAuthFile: vi.fn().mockResolvedValue(null) }));

import { buildChatStartBinding } from '@/renderer/pages/guid/hooks/chatStartBinding';
import { mergeResolvedRegistryBinding, resolveSpawnSecretsFromRepo } from '@process/providers/ipc/modelRegistryIpc';
import { resolveOpenAiCompatibleApiKey } from '@/common/utils/keylessLocalCredential';
import { getProviderAuthType } from '@/common/utils/platformAuthType';

const BRIDGE = '__waylandModelRegistryBridge';
const OLLAMA_LOCAL_URL = 'http://127.0.0.1:11434/v1';

/** The non-secret handle `resolveForChatStart` returns for a local Ollama pick. */
const ollamaHandle = {
  id: 'ollama-local',
  providerId: 'ollama-local',
  name: 'Ollama (Local)',
  platform: 'openai-compatible',
  modelId: 'llama3:latest',
  baseUrl: OLLAMA_LOCAL_URL,
  accountId: 'default',
};

/** A legacy `model.config` row for a DIFFERENT provider that lists the same id. */
const foreignLegacyRow = {
  id: 'b1c5cb99-not-the-picked-provider',
  name: 'Ollama Cloud',
  platform: 'openai-compatible',
  baseUrl: 'https://ollama.com/v1',
  apiKey: '',
  model: ['llama3:latest'],
  [BRIDGE]: 'v2:ollama-cloud',
};

/** A repo where ONLY the local daemon is connected - the reported setup. */
const localOnlyRepo = {
  getRegistryProvider: (id: string) => (id === 'ollama-local' ? { providerId: id, state: 'connected' } : null),
  getRegistryProviderCreds: (id: string) =>
    id === 'ollama-local'
      ? { status: 'ok' as const, creds: { key: '', baseUrl: OLLAMA_LOCAL_URL } }
      : { status: 'missing' as const },
} as never;

describe('chat-start binding names the provider the user picked (#1124)', () => {
  it('does not inherit a foreign registry bridge tag from the legacy lookup', () => {
    const binding = buildChatStartBinding(ollamaHandle as never, foreignLegacyRow as never);

    expect((binding as unknown as Record<string, unknown>)[BRIDGE]).toBe('v2:ollama-local');
  });

  it('resolves the local daemon endpoint and a keyless credential at the spawn handoff', () => {
    const binding = buildChatStartBinding(ollamaHandle as never, foreignLegacyRow as never);

    // Exactly what hydrateModelForSpawn does: the bridge tag picks the provider.
    const tag = String((binding as unknown as Record<string, unknown>)[BRIDGE]);
    const providerId = tag.slice('v2:'.length);
    const secrets = resolveSpawnSecretsFromRepo(localOnlyRepo, {
      providerId,
      modelId: binding.useModel,
    });
    const merged = mergeResolvedRegistryBinding(binding as never, secrets);

    expect(merged.baseUrl).toBe(OLLAMA_LOCAL_URL);
    // The OpenAI-compatible arm of the Gemini runtime: an empty string here is
    // the literal `OpenAI API key is required` throw.
    expect(getProviderAuthType(merged as never)).toBe('openai');
    expect(resolveOpenAiCompatibleApiKey(merged.apiKey, merged.baseUrl)).not.toBe('');
  });

  it('still carries forward the non-secret legacy fields the handle does not supply', () => {
    // `modelProtocols` (a new-api per-model protocol block) has no home on the
    // chat-start handle, so the legacy row remains its only carrier.
    const binding = buildChatStartBinding(ollamaHandle as never, {
      ...foreignLegacyRow,
      modelProtocols: { 'llama3:latest': 'openai' },
    } as never);

    expect((binding as unknown as { modelProtocols?: Record<string, string> }).modelProtocols).toEqual({
      'llama3:latest': 'openai',
    });
  });

  it('never carries a credential from the legacy row into the binding', () => {
    const binding = buildChatStartBinding(ollamaHandle as never, {
      ...foreignLegacyRow,
      apiKey: 'sk-someone-elses-key',
    } as never);

    expect(binding.apiKey).toBe('');
    expect(binding.baseUrl).toBe(OLLAMA_LOCAL_URL);
    expect(binding.id).toBe('ollama-local');
    expect(binding.useModel).toBe('llama3:latest');
  });

  it('works with no legacy row at all', () => {
    const binding = buildChatStartBinding(ollamaHandle as never, undefined);

    expect((binding as unknown as Record<string, unknown>)[BRIDGE]).toBe('v2:ollama-local');
    expect(binding.useModel).toBe('llama3:latest');
  });
});
