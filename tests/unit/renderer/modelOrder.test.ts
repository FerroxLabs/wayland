/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { compareModelsNewestFirst, parseModelVersion, sortModelsNewestFirst } from '@/renderer/utils/model/modelOrder';

describe('parseModelVersion', () => {
  it('extracts the leading version number from labels and ids', () => {
    expect(parseModelVersion('GPT-5.6-Sol')).toBe(5.6);
    expect(parseModelVersion('gpt-5.6-sol')).toBe(5.6);
    expect(parseModelVersion('GPT-5.4-Mini')).toBe(5.4);
    expect(parseModelVersion('GPT-5.5')).toBe(5.5);
    expect(parseModelVersion('Claude Sonnet 4.5')).toBe(4.5);
  });

  it('returns null when there is no version number', () => {
    expect(parseModelVersion('sonnet')).toBeNull();
    expect(parseModelVersion('Default')).toBeNull();
  });
});

describe('sortModelsNewestFirst', () => {
  it('orders the ChatGPT-subscription GPT set newest-version-first (Sean bug: was ascending)', () => {
    // The catalog store hands these over alphabetically ascending (5.4 first)
    // because they carry no releaseDate. The picker must show 5.6 on top.
    const input = [
      { id: 'gpt-5.4', label: 'GPT-5.4' },
      { id: 'gpt-5.4-mini', label: 'GPT-5.4-Mini' },
      { id: 'gpt-5.5', label: 'GPT-5.5' },
      { id: 'gpt-5.6-luna', label: 'GPT-5.6-Luna' },
      { id: 'gpt-5.6-sol', label: 'GPT-5.6-Sol' },
      { id: 'gpt-5.6-terra', label: 'GPT-5.6-Terra' },
    ];
    expect(sortModelsNewestFirst(input).map((m) => m.label)).toEqual([
      'GPT-5.6-Luna',
      'GPT-5.6-Sol',
      'GPT-5.6-Terra',
      'GPT-5.5',
      'GPT-5.4',
      'GPT-5.4-Mini',
    ]);
  });

  it('keeps alphabetical grouping stable within the same version tier', () => {
    const input = [
      { id: 'gpt-5.6-terra', label: 'GPT-5.6-Terra' },
      { id: 'gpt-5.6-luna', label: 'GPT-5.6-Luna' },
      { id: 'gpt-5.6-sol', label: 'GPT-5.6-Sol' },
    ];
    // Stable: input order preserved within the 5.6 tier (caller pre-sorts A→Z).
    expect(sortModelsNewestFirst(input).map((m) => m.label)).toEqual(['GPT-5.6-Terra', 'GPT-5.6-Luna', 'GPT-5.6-Sol']);
  });

  it('prefers an explicit releaseDate over the parsed version', () => {
    const input = [
      { id: 'old-9', label: 'Old 9.9', releaseDate: '2024-01-01' },
      { id: 'new-1', label: 'New 1.0', releaseDate: '2026-06-01' },
    ];
    expect(sortModelsNewestFirst(input).map((m) => m.id)).toEqual(['new-1', 'old-9']);
  });

  it('leaves unversioned CLI ids (sonnet/haiku) in their original order', () => {
    const input = [
      { id: 'sonnet', label: 'Sonnet' },
      { id: 'haiku', label: 'Haiku' },
      { id: 'opus', label: 'Opus' },
    ];
    expect(sortModelsNewestFirst(input).map((m) => m.id)).toEqual(['sonnet', 'haiku', 'opus']);
  });

  it('does not mutate the input array', () => {
    const input = [
      { id: 'gpt-5.4', label: 'GPT-5.4' },
      { id: 'gpt-5.6', label: 'GPT-5.6' },
    ];
    const copy = [...input];
    sortModelsNewestFirst(input);
    expect(input).toEqual(copy);
  });

  it('is a stable no-op comparator for equal-rank pairs', () => {
    expect(compareModelsNewestFirst({ id: 'a', label: 'x' }, { id: 'b', label: 'y' })).toBe(0);
  });
});
