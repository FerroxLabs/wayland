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
  describe('call - happy path (metadata-only default)', () => {
    it('returns ranked metadata WITHOUT inline bodies by default (issue #199)', async () => {
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
      // No full body inline - the bug was returning every body at once.
      expect(result.results[0].body).toBeUndefined();
      expect(result.results[0]).toMatchObject({
        name: 'alpha',
        description: 'Description for alpha',
        score: 2.5,
        excerpt: '# Alpha skill body',
        bodyChars: '# Alpha skill body'.length,
        bodyTokenEstimate: Math.ceil('# Alpha skill body'.length / 4),
      });
      expect(result.results[1].name).toBe('beta');
      expect(result.results[1].body).toBeUndefined();
    });

    it('strips leading YAML frontmatter from the excerpt', async () => {
      const body = '---\nname: x\ndescription: y\n---\nReal content starts here.';
      const library = makeLibrary([makeEntry('x')], { x: body });
      const retriever = makeRetriever([{ name: 'x', description: 'Description for x', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'x' });

      expect(result.results[0].excerpt).toBe('Real content starts here.');
    });

    it('passes limit through to the retriever', async () => {
      const library = makeLibrary([makeEntry('foo')], { foo: 'body' });
      const retriever = makeRetriever([{ name: 'foo', description: 'Description for foo', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      await server.call({ query: 'foo', limit: 10 });

      expect(retriever.retrieve).toHaveBeenCalledWith('foo', 10);
    });

    it('defaults limit to 5 when not specified', async () => {
      const library = makeLibrary([makeEntry('foo')], { foo: 'body' });
      const retriever = makeRetriever([{ name: 'foo', description: 'Description for foo', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      await server.call({ query: 'foo' });

      expect(retriever.retrieve).toHaveBeenCalledWith('foo', 5);
    });

    it('clamps an oversized limit to the metadata max (50)', async () => {
      const library = makeLibrary([makeEntry('foo')], { foo: 'body' });
      const retriever = makeRetriever([{ name: 'foo', description: 'Description for foo', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      await server.call({ query: 'foo', limit: 999 });

      expect(retriever.retrieve).toHaveBeenCalledWith('foo', 50);
    });
  });

  describe('call - includeBody mode', () => {
    it('inlines bodies capped at maxBodyChars and flags truncation', async () => {
      const longBody = 'x'.repeat(5000);
      const library = makeLibrary([makeEntry('big')], { big: longBody });
      const retriever = makeRetriever([{ name: 'big', description: 'Description for big', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'big', includeBody: true, maxBodyChars: 100 });

      expect(result.results[0].body).toHaveLength(100);
      expect(result.results[0].bodyTruncated).toBe(true);
      expect(result.results[0].bodyChars).toBe(5000);
    });

    it('returns the full body when shorter than the cap', async () => {
      const library = makeLibrary([makeEntry('small')], { small: '# Short' });
      const retriever = makeRetriever([{ name: 'small', description: 'Description for small', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      const result = await server.call({ query: 'small', includeBody: true });

      expect(result.results[0].body).toBe('# Short');
      expect(result.results[0].bodyTruncated).toBe(false);
    });

    it('caps the result count tighter when bodies are inlined (limit cap 8)', async () => {
      const library = makeLibrary([makeEntry('foo')], { foo: 'body' });
      const retriever = makeRetriever([{ name: 'foo', description: 'Description for foo', score: 1 }]);

      const server = createSearchSkillsServer({ library, retriever });
      await server.call({ query: 'foo', limit: 50, includeBody: true });

      expect(retriever.retrieve).toHaveBeenCalledWith('foo', 8);
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

  describe('readSkill - paginated body reader (issue #199)', () => {
    it('returns the first page with totalChars and a nextOffset', async () => {
      const body = 'a'.repeat(10000);
      const library = makeLibrary([makeEntry('doc')], { doc: body });

      const server = createSearchSkillsServer({ library });
      const result = await server.readSkill({ name: 'doc', maxChars: 4000 });

      expect(result.found).toBe(true);
      expect(result.body).toHaveLength(4000);
      expect(result.offset).toBe(0);
      expect(result.totalChars).toBe(10000);
      expect(result.nextOffset).toBe(4000);
      expect(result.bodyTokenEstimate).toBe(2500);
    });

    it('reads the next page from nextOffset and reports the end with null', async () => {
      const body = 'a'.repeat(6000);
      const library = makeLibrary([makeEntry('doc')], { doc: body });

      const server = createSearchSkillsServer({ library });
      const page2 = await server.readSkill({ name: 'doc', offset: 4000, maxChars: 4000 });

      expect(page2.body).toHaveLength(2000);
      expect(page2.offset).toBe(4000);
      expect(page2.nextOffset).toBeNull();
    });

    it('returns found:false for an unknown or blocked skill', async () => {
      const library = makeLibrary([], { gone: null });

      const server = createSearchSkillsServer({ library });
      const result = await server.readSkill({ name: 'gone' });

      expect(result.found).toBe(false);
      expect(result.body).toBeUndefined();
      expect(result.message).toContain('gone');
    });

    it('clamps an out-of-range offset to the body length', async () => {
      const library = makeLibrary([makeEntry('doc')], { doc: 'short' });

      const server = createSearchSkillsServer({ library });
      const result = await server.readSkill({ name: 'doc', offset: 9999 });

      expect(result.found).toBe(true);
      expect(result.offset).toBe(5);
      expect(result.body).toBe('');
      expect(result.nextOffset).toBeNull();
    });
  });
});
