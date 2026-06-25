/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { reorderByIndex } from '../../../../src/renderer/pages/conversation/utils/tabReorder';

const ids = () => ['a', 'b', 'c', 'd'];

describe('reorderByIndex (chat tab drag-reorder core)', () => {
  it('moves an item left (drag last before first)', () => {
    expect(reorderByIndex(ids(), 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('moves an item right (drag first to last)', () => {
    expect(reorderByIndex(ids(), 0, 3)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('moves an item to an adjacent position', () => {
    expect(reorderByIndex(ids(), 1, 2)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('returns the same array reference for a no-op move (from === to)', () => {
    const input = ids();
    expect(reorderByIndex(input, 2, 2)).toBe(input);
  });

  it('ignores out-of-range source index', () => {
    const input = ids();
    expect(reorderByIndex(input, 9, 0)).toBe(input);
  });

  it('ignores out-of-range target index', () => {
    const input = ids();
    expect(reorderByIndex(input, 0, 9)).toBe(input);
  });

  it('ignores negative indices', () => {
    const input = ids();
    expect(reorderByIndex(input, -1, 0)).toBe(input);
    expect(reorderByIndex(input, 0, -1)).toBe(input);
  });

  it('preserves length and membership', () => {
    const result = reorderByIndex(ids(), 0, 2);
    expect(result).toHaveLength(4);
    expect(result.toSorted()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('models the drag-end path: indices derived from active/over ids via indexOf', () => {
    const tabIds = ids();
    const activeId = 'a';
    const overId = 'c';
    const oldIndex = tabIds.indexOf(activeId);
    const newIndex = tabIds.indexOf(overId);
    expect(reorderByIndex(tabIds, oldIndex, newIndex)).toEqual(['b', 'c', 'a', 'd']);
  });
});
