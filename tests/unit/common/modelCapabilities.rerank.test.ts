/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import type { IProvider } from '@/common/config/storage';

// Pins reranker classification so the RERANK_MODEL rewrite is provably
// behaviour-preserving. Every id below is a real published model.
const provider = { platform: 'ollama' } as unknown as IProvider;

describe('hasSpecificModelCapability — reranker classification', () => {
  const rerankIds = [
    'bge-reranker-v2-m3',
    'bge-reranker-base',
    'bge-reranker-large',
    'rerank-english-v3.0',
    'rerank-multilingual-v3.0',
    'rerank-v3.5',
    'jina-reranker-v2-base-multilingual',
    'jina-reranker-v1-turbo-en',
    'mxbai-rerank-large-v1',
    'mxbai-rerank-xsmall-v1',
    'Qwen3-Reranker-8B',
    'Qwen3-Reranker-0.6B',
    'bce-reranker-base_v1',
    'gte-multilingual-reranker-base',
    'xlm-roberta-base-reranker',
    'cohere.rerank-v3-5:0',
    'retriever-base',
    'llm-retriever-v1',
  ];

  for (const id of rerankIds) {
    it(`${id} is classified as a rerank model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).toBe(true);
    });

    // The load-bearing assertion: rerank reaches production ONLY via
    // excludeFromPrimary. A reranker offered for chat 400s at the provider.
    it(`${id} IS excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).toBe(true);
    });
  }

  // Over-exclusion guards. These repeat the #108 / #740 classes: a naive
  // substring match hides real chat models from the picker.
  const chatIds = [
    'gpt-4o',
    'claude-3-5-sonnet',
    'llama3.1:8b',
    'qwen2.5-coder:7b',
    'deepseek-chat',
    'gemini-2.0-flash',
    'mistral-large-latest',
    'command-r-plus',
    'grok-4',
    'o1-preview',
  ];

  for (const id of chatIds) {
    it(`${id} is NOT classified as a rerank model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).not.toBe(true);
    });

    it(`${id} is NOT excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).not.toBe(true);
    });
  }

  // Token-boundary pins. Each of these matches TODAY via unanchored substring
  // and is a false positive; the anchored rewrite must reject them.
  for (const id of ['prerank-model', 'xrerank', 'reranked-legacy']) {
    it(`${id} does not trip the rerank stem (boundary anchoring)`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).not.toBe(true);
    });
  }

  // Normalisation: getBaseModelName maps `_` → `-`, and matching is case-insensitive.
  for (const id of ['my_rerank_model', 'Reranker', 'RERANK']) {
    it(`${id} still classifies as rerank after normalisation`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).toBe(true);
    });
  }
});
