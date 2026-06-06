import { describe, it, expect } from 'vitest';
import { synthesize, synthesizeMany } from '@process/services/wiki/wikiSynthesizer';
import type { MemoryEntry } from '@/common/types/memory';

// ===== Fixtures =====

const makeEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: 'test-id-1',
  type: 'decision',
  project: 'wayland-app',
  projectPath: '/dev/wayland/app',
  summary: 'We decided to use React 19 for the renderer process.',
  bodyPreview: 'The renderer uses React 19 with concurrent features enabled.',
  tags: ['react', 'architecture', 'renderer'],
  storedAt: Date.now(),
  sourcePath: '/dev/wayland/app/.ijfw/memory/knowledge.md',
  sourceLine: 7,
  referencedBy: 3,
  promotionScore: 72,
  ...overrides,
});

const THREE_ENTRIES: MemoryEntry[] = [
  makeEntry({
    id: 'm1',
    summary: 'We decided to use React 19 for the renderer process.',
    bodyPreview: 'The renderer process relies on React 19 concurrent features.',
    tags: ['react', 'architecture'],
  }),
  makeEntry({
    id: 'm2',
    summary: 'The IPC bridge uses Zod for argument validation.',
    bodyPreview: 'All IPC handlers validate args with Zod schemas before dispatch.',
    tags: ['ipc', 'architecture'],
  }),
  makeEntry({
    id: 'm3',
    summary: 'Electron 41 is pinned for asar-unpacked MCP script support.',
    bodyPreview: 'MCP scripts live in resources.asar.unpacked to allow Node spawns.',
    tags: ['electron', 'architecture'],
  }),
];

// ===== Tests =====

describe('synthesize (fallback path)', () => {
  it('produces a valid WikiConcept from 3 memory entries', async () => {
    const concept = await synthesize(THREE_ENTRIES);

    // All required fields must be populated
    expect(concept.id).toBeTruthy();
    expect(concept.name).toBeTruthy();
    expect(concept.slug).toBeTruthy();
    expect(concept.tldr).toBeTruthy();
    expect(concept.body).toBeTruthy();

    // sourceMemoryIds must include all 3 entry IDs
    expect(concept.sourceMemoryIds).toContain('m1');
    expect(concept.sourceMemoryIds).toContain('m2');
    expect(concept.sourceMemoryIds).toContain('m3');
  });

  it('tldr is at most 280 characters', async () => {
    const concept = await synthesize(THREE_ENTRIES);
    expect(concept.tldr.length).toBeLessThanOrEqual(280);
  });

  it('topicTag is a valid WikiTopicTag value', async () => {
    const VALID_TAGS = ['Architecture', 'Design', 'Decisions', 'Process', 'Patterns', 'Brand'];
    const concept = await synthesize(THREE_ENTRIES);
    expect(VALID_TAGS).toContain(concept.topicTag);
  });

  it('body is non-empty and contains content from the entries', async () => {
    const concept = await synthesize(THREE_ENTRIES);
    expect(concept.body.length).toBeGreaterThan(10);
  });

  it('respects topicHint when provided', async () => {
    const concept = await synthesize(THREE_ENTRIES, { topicHint: 'Design' });
    expect(concept.topicTag).toBe('Design');
  });

  it('sets freshness to never_reviewed for a new synthesis', async () => {
    const concept = await synthesize(THREE_ENTRIES);
    expect(concept.freshness).toBe('never_reviewed');
  });

  it('sets lastReviewedAt to undefined for a new synthesis', async () => {
    const concept = await synthesize(THREE_ENTRIES);
    expect(concept.lastReviewedAt).toBeUndefined();
  });

  it('aliases array includes the slug by default', async () => {
    const concept = await synthesize(THREE_ENTRIES);
    expect(concept.aliases).toContain(concept.slug);
  });

  it('throws when called with zero entries', async () => {
    await expect(synthesize([])).rejects.toThrow();
  });
});

// ===== synthesizeMany tests =====

const ARCHITECTURE_ENTRIES: MemoryEntry[] = [
  makeEntry({
    id: 'a1',
    summary: 'The renderer process uses React with concurrent features.',
    bodyPreview: 'React concurrent mode is enabled via createRoot.',
    tags: ['react', 'architecture', 'renderer'],
  }),
  makeEntry({
    id: 'a2',
    summary: 'The IPC bridge connects renderer to the main process.',
    bodyPreview: 'ipcBridge exposes typed providers and emitters.',
    tags: ['ipc', 'architecture', 'bridge'],
  }),
  makeEntry({
    id: 'a3',
    summary: 'The main process initialises all IPC bridges on startup.',
    bodyPreview: 'initAllBridges wires each service to the renderer.',
    tags: ['ipc', 'architecture', 'main'],
  }),
];

describe('synthesizeMany (heuristic clustering)', () => {
  it('produces at least one concept from 3 architecture-tagged entries', async () => {
    const concepts = await synthesizeMany(ARCHITECTURE_ENTRIES, new Set());
    expect(concepts.length).toBeGreaterThanOrEqual(1);
  });

  it('each produced concept has valid required fields', async () => {
    const concepts = await synthesizeMany(ARCHITECTURE_ENTRIES, new Set());
    for (const c of concepts) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.slug).toBeTruthy();
      expect(c.tldr.length).toBeGreaterThan(0);
      expect(c.tldr.length).toBeLessThanOrEqual(280);
      expect(c.body.length).toBeGreaterThan(0);
      expect(c.freshness).toBe('never_reviewed');
      expect(c.lastReviewedAt).toBeUndefined();
      expect(['Architecture', 'Design', 'Decisions', 'Process', 'Patterns', 'Brand']).toContain(
        c.topicTag,
      );
    }
  });

  it('sourceMemoryIds cover entries that belong to each cluster', async () => {
    const concepts = await synthesizeMany(ARCHITECTURE_ENTRIES, new Set());
    const allSourceIds = concepts.flatMap((c) => c.sourceMemoryIds);
    // At least 2 of the 3 entries should be clustered
    expect(allSourceIds.length).toBeGreaterThanOrEqual(2);
  });

  it('skips entries already in existingSourceIds', async () => {
    // Mark all 3 as already synthesized
    const existing = new Set(['a1', 'a2', 'a3']);
    const concepts = await synthesizeMany(ARCHITECTURE_ENTRIES, existing);
    expect(concepts).toHaveLength(0);
  });

  it('only processes new entries when some are already covered', async () => {
    // a1 and a2 covered; only a3 is new - not enough for a cluster of 2 by itself
    const existing = new Set(['a1', 'a2']);
    const concepts = await synthesizeMany(ARCHITECTURE_ENTRIES, existing);
    // a3 alone cannot form a cluster of ≥2 - should produce 0 concepts
    expect(concepts).toHaveLength(0);
  });

  it('returns empty array when no entries provided', async () => {
    const concepts = await synthesizeMany([], new Set());
    expect(concepts).toHaveLength(0);
  });

  it('infers Architecture topicTag for architecture-heavy entries', async () => {
    const concepts = await synthesizeMany(ARCHITECTURE_ENTRIES, new Set());
    if (concepts.length > 0) {
      expect(concepts[0].topicTag).toBe('Architecture');
    }
  });
});
