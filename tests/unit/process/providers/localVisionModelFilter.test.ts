/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { isUnsupportedLocalVisionModel } from '@process/providers/catalog/localVisionModelFilter';

describe('isUnsupportedLocalVisionModel', () => {
  it('flags known local VLM families on ollama-local', () => {
    for (const id of ['llava:13b', 'bakllava:latest', 'moondream', 'qwen2.5-vl:7b', 'minicpm-v:8b', 'pixtral:12b']) {
      expect(isUnsupportedLocalVisionModel('ollama-local', id)).toBe(true);
    }
  });

  it('flags generic vision/vlm tokens only at word boundaries', () => {
    expect(isUnsupportedLocalVisionModel('ollama-local', 'some-vision-model')).toBe(true);
    expect(isUnsupportedLocalVisionModel('ollama-local', 'model-vlm')).toBe(true);
    // not a vision model just because the substring appears mid-token
    expect(isUnsupportedLocalVisionModel('ollama-local', 'envisionary')).toBe(false);
  });

  it('does NOT filter plain local chat models', () => {
    for (const id of ['llama3:latest', 'mistral:7b', 'qwen2.5:7b', 'phi3:mini']) {
      expect(isUnsupportedLocalVisionModel('ollama-local', id)).toBe(false);
    }
  });

  it('never filters a NON-local provider, even a vision-named model', () => {
    // A remote provider may legitimately offer a vision chat model.
    expect(isUnsupportedLocalVisionModel('openai', 'gpt-5-vision')).toBe(false);
    expect(isUnsupportedLocalVisionModel('anthropic', 'claude-vision')).toBe(false);
    // openai-compatible only filters when explicitly a local endpoint.
    expect(isUnsupportedLocalVisionModel('openai-compatible', 'llava:13b')).toBe(false);
    expect(isUnsupportedLocalVisionModel('openai-compatible', 'llava:13b', true)).toBe(true);
  });
});
