/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  addFavorite,
  favoritesStorageKey,
  isProjectConversation,
  parseFavorites,
  removeFavorite,
  type WorkspaceFavorite,
} from '../../../src/renderer/pages/conversation/Workspace/hooks/useWorkspaceFavorites';

const fav = (relativePath: string): WorkspaceFavorite => ({
  relativePath,
  name: relativePath.split('/').pop() ?? relativePath,
  fullPath: `/ws/${relativePath}`,
});

describe('workspace favorites store (#142)', () => {
  it('scopes favorites to project conversations only', () => {
    expect(isProjectConversation('project:abc')).toBe(true);
    expect(isProjectConversation('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
  });

  it('namespaces the storage key per conversation so projects do not leak', () => {
    expect(favoritesStorageKey('project:a')).not.toBe(favoritesStorageKey('project:b'));
    expect(favoritesStorageKey('project:a')).toContain('project:a');
  });

  it('adds a favorite and is idempotent by relative path', () => {
    const one = addFavorite([], fav('docs/a.md'));
    expect(one).toHaveLength(1);
    const again = addFavorite(one, fav('docs/a.md'));
    expect(again).toBe(one); // unchanged reference - no duplicate
  });

  it('removes a favorite by relative path', () => {
    const list = [fav('a.md'), fav('b.md')];
    expect(removeFavorite(list, 'a.md')).toEqual([fav('b.md')]);
    expect(removeFavorite(list, 'missing.md')).toHaveLength(2);
  });

  it('parses persisted favorites and tolerates corrupt/legacy values', () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites('not json')).toEqual([]);
    expect(parseFavorites('{"not":"array"}')).toEqual([]);
    expect(parseFavorites(JSON.stringify([fav('a.md'), { relativePath: 'b.md' }]))).toEqual([fav('a.md')]);
  });
});
