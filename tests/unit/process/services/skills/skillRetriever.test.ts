/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillRetriever } from '@process/services/skills/SkillRetriever';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const entry = (overrides: Partial<SkillIndexEntry> = {}): SkillIndexEntry => ({
  name: overrides.name ?? 'sample-skill',
  description: overrides.description ?? 'A sample skill for testing',
  type: 'skill',
  source: 'wayland-library',
  metadata: {
    tags: overrides.metadata?.tags ?? ['testing'],
    category: overrides.metadata?.category ?? 'dev',
  },
  path: `bodies/${overrides.name ?? 'sample-skill'}.md`,
  security: overrides.security,
});

const FIXTURES: SkillIndexEntry[] = [
  entry({ name: 'python-project-setup', description: 'Set up a new Python project with virtual environments and dependencies', metadata: { tags: ['python', 'virtualenv', 'pip'], category: 'software-engineering' } }),
  entry({ name: 'react-component', description: 'Generate a React functional component with hooks', metadata: { tags: ['react', 'frontend', 'hooks'], category: 'frontend' } }),
  entry({ name: 'kube-deploy', description: 'Deploy an application to Kubernetes cluster', metadata: { tags: ['kubernetes', 'devops', 'docker'], category: 'devops' } }),
  entry({ name: 'blocked-skill', description: 'This skill is blocked and should not appear', metadata: { tags: ['blocked'], category: 'security' }, security: { verdict: 'blocked', findings: [], scannedAt: 0, scannerVersion: 1, llmScanned: false } }),
  entry({ name: 'sql-query', description: 'Write optimized SQL queries for relational databases', metadata: { tags: ['sql', 'database', 'postgres'], category: 'database' } }),
  entry({ name: 'git-workflow', description: 'Manage Git branching and merge workflows', metadata: { tags: ['git', 'version-control'], category: 'software-engineering' } }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SkillRetriever', () => {
  beforeEach(() => {
    SkillRetriever.resetInstance();
  });

  describe('tokenization', () => {
    it('lowercases query terms when retrieving', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const upper = r.retrieve('PYTHON');
      const lower = r.retrieve('python');
      // Both should return the same results
      expect(upper.map((x) => x.name)).toEqual(lower.map((x) => x.name));
    });

    it('splits on word boundaries', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const results = r.retrieve('python project');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('python-project-setup');
    });
  });

  describe('retrieve', () => {
    it('returns the matching skill in top results for an exact name query', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const results = r.retrieve('python project setup');
      const names = results.map((x) => x.name);
      expect(names).toContain('python-project-setup');
      expect(names[0]).toBe('python-project-setup');
    });

    it('returns results sorted by score descending', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const results = r.retrieve('kubernetes deploy');
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('respects the limit parameter', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      // A broad query that would match many skills
      const results = r.retrieve('skill', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('returns at most limit results even when more match', () => {
      // Build a larger fixture set
      const many: SkillIndexEntry[] = Array.from({ length: 50 }, (_, i) =>
        entry({ name: `skill-${i}`, description: `test skill number ${i}` })
      );
      const r = new SkillRetriever({ entries: many });
      const results = r.retrieve('skill test', 10);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('returns empty array for a query with no matching terms', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const results = r.retrieve('zzznonexistentterm999');
      expect(results).toEqual([]);
    });

    it('each result has name, description, and score fields', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const results = r.retrieve('react component');
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(typeof result.name).toBe('string');
        expect(typeof result.description).toBe('string');
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThan(0);
      }
    });
  });

  describe('blocked skill exclusion', () => {
    it('excludes blocked skills from results', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const results = r.retrieve('blocked skill security');
      const names = results.map((x) => x.name);
      expect(names).not.toContain('blocked-skill');
    });

    it('does not index blocked skills at all', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      // Force index build
      r.buildIndex(FIXTURES);
      // Any query should not surface blocked-skill
      const results = r.retrieve('blocked');
      expect(results.map((x) => x.name)).not.toContain('blocked-skill');
    });
  });

  describe('buildIndex', () => {
    it('can be called explicitly before retrieve', () => {
      const r = new SkillRetriever();
      r.buildIndex(FIXTURES);
      const results = r.retrieve('sql database query');
      expect(results.map((x) => x.name)).toContain('sql-query');
    });

    it('rebuilding index replaces the previous one', () => {
      const r = new SkillRetriever({ entries: FIXTURES });
      const fresh: SkillIndexEntry[] = [
        entry({ name: 'only-skill', description: 'the one and only skill here', metadata: { tags: ['unique'], category: 'test' } }),
      ];
      r.buildIndex(fresh);
      const results = r.retrieve('only skill here');
      expect(results.map((x) => x.name)).toContain('only-skill');
      expect(results.map((x) => x.name)).not.toContain('python-project-setup');
    });
  });

  describe('singleton', () => {
    it('getInstance returns the same instance', () => {
      const a = SkillRetriever.getInstance({ entries: FIXTURES });
      const b = SkillRetriever.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance causes getInstance to return a new instance', () => {
      const a = SkillRetriever.getInstance({ entries: FIXTURES });
      SkillRetriever.resetInstance();
      const b = SkillRetriever.getInstance({ entries: FIXTURES });
      expect(a).not.toBe(b);
    });
  });
});
