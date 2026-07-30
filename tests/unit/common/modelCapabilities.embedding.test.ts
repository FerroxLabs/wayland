/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import type { IProvider } from '@/common/config/storage';

// Regression for #740: embedding/retrieval models whose ids are NOT named with
// the literal "embed" (bge-m3, gte-large, e5-mistral, voyage-3, …) were not
// excluded from the primary/workflow model picker. They then got selected for a
// chat turn and failed with a provider 400 ("<model> does not support chat"),
// while the Workflow view still showed a green "Complete". The excludeFromPrimary
// pattern must be a superset of the embedding + rerank families.
const provider = { platform: 'ollama' } as unknown as IProvider;

describe('hasSpecificModelCapability - embedding/retrieval exclusion (#740)', () => {
  const embeddingIds = [
    'bge-m3:latest', // the reported model
    'bge-large-en-v1.5',
    'gte-large',
    'e5-mistral-7b-instruct',
    'voyage-3',
    'jina-embeddings-v3',
    'nomic-embed-text', // already matched via "embed" - kept as a guard
  ];

  for (const id of embeddingIds) {
    it(`${id} IS excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).toBe(true);
    });

    it(`${id} is classified as an embedding model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'embedding')).toBe(true);
    });
  }

  it('a reranker (cross-encoder) is excluded from the primary picker', () => {
    expect(hasSpecificModelCapability(provider, 'bge-reranker-v2-m3', 'excludeFromPrimary')).toBe(true);
  });

  // Guard against over-exclusion: real chat models must NOT be filtered out.
  // excludeFromPrimary returns `undefined` (no rule) for a normal chat model,
  // which the picker treats as "not excluded" - so assert it is never `true`.
  // The `kuae-*` + `text-davinci-*` ids specifically pin the token-boundary
  // anchoring: a naive substring `uae`/`text-` would nuke the vendored "KUAE
  // Cloud Coding Plan" chat models (repeat of #108) and legacy completion
  // models. They must stay selectable AND not be misclassified as embeddings.
  const chatIds = [
    'gpt-4o',
    'claude-3-5-sonnet',
    'llama3.1:8b',
    'qwen2.5-coder:7b',
    'deepseek-chat',
    'gemini-2.0-flash',
    'mistral-large-latest',
    'kuae-coder', // vendored "KUAE Cloud Coding Plan" - must NOT trip the `uae` stem
    'kuae-cloud-coding',
    'text-davinci-003', // legacy completion model - `^text-` must not blanket-exclude
  ];

  for (const id of chatIds) {
    it(`${id} is NOT excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).not.toBe(true);
    });

    it(`${id} is NOT misclassified as an embedding model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'embedding')).not.toBe(true);
    });
  }
});
