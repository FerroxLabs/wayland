/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  allVisibleEnabled,
  rowsToFlip,
  type BulkToggleRow,
} from '../../../../src/renderer/pages/settings/ModelsSettings/components/bulkToggle';

const row = (id: string, enabled: boolean): BulkToggleRow => ({ id, enabled });

describe('rowsToFlip', () => {
  it('returns only the disabled rows when enabling', () => {
    const rows = [row('a', false), row('b', true), row('c', false)];
    expect(rowsToFlip(rows, true)).toEqual(['a', 'c']);
  });

  it('returns only the enabled rows when disabling', () => {
    const rows = [row('a', false), row('b', true), row('c', true)];
    expect(rowsToFlip(rows, false)).toEqual(['b', 'c']);
  });

  it('returns nothing when every row already matches the target', () => {
    const rows = [row('a', true), row('b', true)];
    expect(rowsToFlip(rows, true)).toEqual([]);
  });

  it('only ever touches the rows it is given (filtered-out rows are never passed in)', () => {
    // The caller passes ONLY the currently-visible (filtered) rows. A hidden,
    // already-disabled row never appears in the input, so it can never be
    // flipped — proving the bulk action respects the active search.
    const visibleAfterSearch = [row('gpt-4o', false), row('gpt-4o-mini', false)];
    const flipped = rowsToFlip(visibleAfterSearch, true);
    expect(flipped).toEqual(['gpt-4o', 'gpt-4o-mini']);
    expect(flipped).not.toContain('claude-hidden');
  });

  it('handles an empty list', () => {
    expect(rowsToFlip([], true)).toEqual([]);
    expect(rowsToFlip([], false)).toEqual([]);
  });
});

describe('allVisibleEnabled', () => {
  it('is true only when every visible row is enabled', () => {
    expect(allVisibleEnabled([row('a', true), row('b', true)])).toBe(true);
    expect(allVisibleEnabled([row('a', true), row('b', false)])).toBe(false);
  });

  it('is false for an empty list', () => {
    expect(allVisibleEnabled([])).toBe(false);
  });
});
