/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { resolveImageVisionBlock } from '@/renderer/utils/model/imageVisionGate';
import type { TProviderWithModel } from '@/common/config/storage';

const model = (useModel: string, extra: Partial<TProviderWithModel> = {}): TProviderWithModel =>
  ({
    id: 'p1',
    name: extra.name ?? useModel,
    platform: extra.platform ?? 'openai-compatible',
    baseUrl: '',
    apiKey: '',
    useModel,
    ...extra,
  }) as TProviderWithModel;

const IMG = ['/tmp/shot.png'];
const DOC = ['/tmp/notes.txt'];

describe('IMG-01 resolveImageVisionBlock', () => {
  it('allows a send with no image regardless of model', () => {
    expect(resolveImageVisionBlock(model('gpt-4-turbo'), DOC)).toBeNull();
    expect(resolveImageVisionBlock(model('gpt-4-turbo'), [])).toBeNull();
  });

  it('blocks an image on a concrete non-vision model (fail closed on unknown)', () => {
    // deepseek-chat is not vision-pattern-matched -> capability undefined -> blocked.
    const block = resolveImageVisionBlock(model('deepseek-chat', { name: 'DeepSeek Chat' }), IMG);
    expect(block).not.toBeNull();
    expect(block?.model).toBe('deepseek-chat');
    expect(block?.reasonParams.model).toBe('DeepSeek Chat');
  });

  it('blocks an image on a model proven non-vision (excluded)', () => {
    expect(resolveImageVisionBlock(model('text-embedding-3-large'), IMG)).not.toBeNull();
  });

  it('allows an image on a proven vision model', () => {
    expect(resolveImageVisionBlock(model('gpt-4o'), IMG)).toBeNull();
    expect(resolveImageVisionBlock(model('claude-3-5-sonnet'), IMG)).toBeNull();
    expect(resolveImageVisionBlock(model('gemini-2.0-flash'), IMG)).toBeNull();
  });

  it('trusts Flux router aliases to route to a vision target', () => {
    expect(resolveImageVisionBlock(model('flux-auto'), IMG)).toBeNull();
    expect(resolveImageVisionBlock(model('flux-reasoning'), IMG)).toBeNull();
  });

  it('does not double-report when no model is resolved yet', () => {
    expect(resolveImageVisionBlock(undefined, IMG)).toBeNull();
    expect(resolveImageVisionBlock(model(''), IMG)).toBeNull();
  });

  it('honors a user-marked vision capability the pattern would miss', () => {
    const custom = model('my-local-vlm', {
      capabilities: [{ type: 'vision', isUserSelected: true }],
    } as Partial<TProviderWithModel>);
    expect(resolveImageVisionBlock(custom, IMG)).toBeNull();
  });
});
