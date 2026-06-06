import { describe, it, expect } from 'vitest';
import { parseWikilinks, resolveWikilink } from '@process/services/wiki/wikilinkResolver';
import type { WikiState } from '@/common/types/memory';

// ===== Fixtures =====

const emptyState: WikiState = {
  version: 1,
  concepts: [],
  backlinkGraph: {},
  orphanCandidates: [],
  lastUpdatedAt: 0,
};

const stateWithConcepts: WikiState = {
  version: 1,
  concepts: [
    {
      id: 'c1',
      name: 'Wayland TUI Architecture',
      slug: 'wayland-tui-architecture',
      topicTag: 'Architecture',
      tldr: 'The TUI rendering pipeline for Wayland.',
      body: 'Built with crossterm and pulldown-cmark.',
      aliases: ['tui-arch', 'TUI Architecture'],
      sourceMemoryIds: [],
      linkedFromConcepts: [],
      relatedConcepts: [],
      tags: ['tui', 'architecture'],
      lastSynthesizedAt: 1000,
      freshness: 'fresh',
    },
    {
      id: 'c2',
      name: 'Design System',
      slug: 'design-system',
      topicTag: 'Design',
      tldr: 'Component library and tokens.',
      body: '',
      aliases: [],
      sourceMemoryIds: [],
      linkedFromConcepts: [],
      relatedConcepts: [],
      tags: ['design'],
      lastSynthesizedAt: 2000,
      freshness: 'stale',
    },
  ],
  backlinkGraph: {},
  orphanCandidates: [],
  lastUpdatedAt: 3000,
};

// ===== parseWikilinks =====

describe('parseWikilinks', () => {
  it('parses a single [[X]] wikilink', () => {
    const result = parseWikilinks('See [[Alpha]] for details.');
    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('[[Alpha]]');
    expect(result[0].name).toBe('Alpha');
    expect(result[0].position).toBe(4);
  });

  it('parses [[X|alias]] and resolves name to X (not the alias)', () => {
    const result = parseWikilinks('See [[Wayland TUI Architecture|the architecture]] page.');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wayland TUI Architecture');
    expect(result[0].raw).toBe('[[Wayland TUI Architecture|the architecture]]');
  });

  it('parses multiple wikilinks with correct positions', () => {
    const body = '[[Alpha]] and [[Beta]] are here.';
    const result = parseWikilinks(body);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alpha');
    expect(result[0].position).toBe(0);
    expect(result[1].name).toBe('Beta');
    expect(result[1].position).toBe(14);
  });

  it('returns empty array when no wikilinks present', () => {
    const result = parseWikilinks('No links here at all.');
    expect(result).toHaveLength(0);
  });

  it('handles empty body', () => {
    expect(parseWikilinks('')).toHaveLength(0);
  });
});

// ===== resolveWikilink =====

describe('resolveWikilink', () => {
  it('resolves an exact-match name', () => {
    const result = resolveWikilink('Wayland TUI Architecture', stateWithConcepts);
    expect(result.slug).toBe('wayland-tui-architecture');
    expect(result.name).toBe('Wayland TUI Architecture');
  });

  it('resolves case-insensitively', () => {
    const result = resolveWikilink('wayland tui architecture', stateWithConcepts);
    expect(result.slug).toBe('wayland-tui-architecture');
  });

  it('resolves via alias', () => {
    const result = resolveWikilink('TUI Architecture', stateWithConcepts);
    expect(result.slug).toBe('wayland-tui-architecture');
    expect(result.name).toBe('Wayland TUI Architecture');
  });

  it('resolves alias case-insensitively', () => {
    const result = resolveWikilink('tui-arch', stateWithConcepts);
    expect(result.slug).toBe('wayland-tui-architecture');
  });

  it('returns null slug and name for an orphan (no match)', () => {
    const result = resolveWikilink('Nonexistent Concept', stateWithConcepts);
    expect(result.slug).toBeNull();
    expect(result.name).toBeNull();
  });

  it('returns null on empty state', () => {
    const result = resolveWikilink('Anything', emptyState);
    expect(result.slug).toBeNull();
    expect(result.name).toBeNull();
  });
});
