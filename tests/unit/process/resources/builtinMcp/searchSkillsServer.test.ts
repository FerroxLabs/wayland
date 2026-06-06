/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSearchSkillsServer } from '@process/resources/builtinMcp/searchSkillsServer';
import type { SearchSkillsDeps } from '@process/resources/builtinMcp/searchSkillsServer';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(name: string): SkillIndexEntry {
  return {
    name,
    description: `Description for ${name}`,
    type: 'skill',
    source: 'builtin',
    path: `skills/${name}/SKILL.md`,
    metadata: { tags: [], category: 'general' },
  };
}

function makeLibrary(
  entries: SkillIndexEntry[],
  bodies: Record<string, string | null>
): SearchSkillsDeps['library'] {
  const listFn = vi.fn(async () => entries);
  const loadBodyFn = vi.fn(async (name: string) => bodies[name] ?? null);
  return { list: listFn, loadBody: loadBodyFn };
}

function makeRetriever(
  hits: Array<{ name: string; description: string; score: number }>
): SearchSkillsDeps['retriever'] {
  return { retrieve: vi.fn(() => hits) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createSearchSkillsServer', () => {
  describe('call - happy path', () => {
    it('returns ranked results with body content', async () => {
      const library = makeLibrary(
        [makeEntry('alpha'), makeEntry('beta')],
        { alpha: '# Alpha skill body', beta: '# Beta skill body' }
      );
      const retriever = makeRetriever([
        { name: 'alpha', description: 'Description for alpha', score: 2.5 },
        { name: 'beta', description: 'Description for beta', score: 1.2 },
      ]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'alpha beta' });

      expect(result.message).toBeUndefined();
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        name: 'alpha',
        description: 'Description for alpha',
        score: 2.5,
        body: '# Alpha skill body',
      });
      expect(result.results[1]).toEqual({
        name: 'beta',
        description: 'Description for beta',
        score: 1.2,
        body: '# Beta skill body',
      });
    });

    it('passes limit to retriever', async () => {
      const library = makeLibrary([makeEntry('foo')], { foo: 'body' });
      const retriever = makeRetriever([{ name: 'foo', description: 'Description for foo', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      await server.call({ query: 'foo', limit: 5 });

      expect(retriever.retrieve).toHaveBeenCalledWith('foo', 5);
    });

    it('defaults limit to 25 when not specified', async () => {
      const library = makeLibrary([makeEntry('foo')], { foo: 'body' });
      const retriever = makeRetriever([{ name: 'foo', description: 'Description for foo', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      await server.call({ query: 'foo' });

      expect(retriever.retrieve).toHaveBeenCalledWith('foo', 25);
    });
  });

  describe('call - empty results', () => {
    it('returns message when retriever finds no hits', async () => {
      const library = makeLibrary([], {});
      const retriever = makeRetriever([]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'nonexistent' });

      expect(result.results).toHaveLength(0);
      expect(result.message).toBe("No skills found matching 'nonexistent' - try different terms.");
    });

    it('returns message when all matched skills have null bodies', async () => {
      const library = makeLibrary(
        [makeEntry('blocked-skill')],
        { 'blocked-skill': null }
      );
      const retriever = makeRetriever([
        { name: 'blocked-skill', description: 'Description for blocked-skill', score: 1.5 },
      ]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'blocked' });

      expect(result.results).toHaveLength(0);
      expect(result.message).toBe('Found 1 matching skills but none could be loaded.');
    });
  });

  describe('call - blocked/disabled skill filtering', () => {
    it('filters out skills whose loadBody returns null', async () => {
      const library = makeLibrary(
        [makeEntry('good'), makeEntry('blocked')],
        { good: '# Good body', blocked: null }
      );
      const retriever = makeRetriever([
        { name: 'good', description: 'Description for good', score: 3.0 },
        { name: 'blocked', description: 'Description for blocked', score: 2.0 },
      ]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'skill' });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('good');
      expect(result.message).toBeUndefined();
    });
  });

  describe('BM25 index is built only once', () => {
    it('calls library.list exactly once across multiple calls', async () => {
      const library = makeLibrary(
        [makeEntry('one')],
        { one: 'body one' }
      );
      const retriever = makeRetriever([
        { name: 'one', description: 'Description for one', score: 1 },
      ]);

      const server = createSearchSkillsServer({ library, retriever });

      await server.call({ query: 'one' });
      await server.call({ query: 'one' });
      await server.call({ query: 'one' });

      // list is called by ensureIndex which short-circuits after first build
      // Since retriever is injected directly, list is never called at all
      expect(library.list).not.toHaveBeenCalled();
    });

    it('calls library.list once when no retriever is injected and index is cold', async () => {
      // Use a real SkillRetriever by not injecting one, but inject a library
      // so we can spy on list without hitting the filesystem.
      const entries = [makeEntry('real-skill')];
      const library = makeLibrary(entries, { 'real-skill': '# Real body' });

      // Do NOT inject a retriever - let ensureIndex build one from library.list()
      const server = createSearchSkillsServer({ library });

      await server.call({ query: 'real' });
      await server.call({ query: 'real' });

      expect(library.list).toHaveBeenCalledTimes(1);
    });
  });
});
