/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getAvailableModels } from '@renderer/pages/guid/utils/modelUtils';
import type { IProvider } from '@/common/config/storage';

// End-to-end regression for #740: the primary model picker (getAvailableModels)
// must drop embedding/retrieval models so they can never be selected for a chat
// or workflow turn. Before the fix, `bge-m3:latest` passed the filter (its
// excludeFromPrimary capability was `undefined`, not `true`) and was offered
// alongside real chat models.
describe('getAvailableModels - embedding models excluded (#740)', () => {
  it('drops bge-m3 while keeping the chat model', () => {
    const provider = {
      id: 'ollama-740-a',
      platform: 'ollama',
      model: ['bge-m3:latest', 'llama3.1:8b'],
    } as unknown as IProvider;

    expect(getAvailableModels(provider)).toEqual(['llama3.1:8b']);
  });

  it('drops a range of family-named embedding models', () => {
    const provider = {
      id: 'ollama-740-b',
      platform: 'ollama',
      model: ['gte-large', 'e5-mistral-7b-instruct', 'voyage-3', 'qwen2.5-coder:7b'],
    } as unknown as IProvider;

    expect(getAvailableModels(provider)).toEqual(['qwen2.5-coder:7b']);
  });
});
