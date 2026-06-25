/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillLibrary, buildResourceDirCandidates } from '@process/services/skills/SkillLibrary';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entry = (overrides: Partial<SkillIndexEntry> = {}): SkillIndexEntry => {
  const name = overrides.name ?? 'sample-skill';
  return {
    name,
    description: 'A sample skill for testing',
    type: 'skill',
    source: 'wayland-library',
    metadata: { tags: ['testing', 'helper'], category: 'dev' },
    path: `bodies/${name}.md`,
    ...overrides,
  };
};

const INDEX: SkillIndexEntry[] = [
  entry({ name: 'kube-deploy', description: 'Deploy to Kubernetes cluster', metadata: { tags: ['k8s'], category: 'devops' } }),
  entry({ name: 'react-component', description: 'Generate a React component', metadata: { tags: ['react', 'frontend'], category: 'frontend' } }),
  entry({ name: 'team-skill', description: 'A team-sourced skill', source: 'team', metadata: { tags: ['team'], category: 'collab' } }),
  entry({
    name: 'blocked-skill',
    description: 'A blocked skill',
    path: 'bodies/blocked-skill.md',
    security: { verdict: 'blocked', findings: [], scannedAt: 0, scannerVersion: 1, llmScanned: false },
  }),
  entry({
    name: 'review-skill',
    description: 'A skill under review',
    security: { verdict: 'review', findings: [], scannedAt: 0, scannerVersion: 1, llmScanned: false },
  }),
];

/** Build a fake readFile that serves index.json and per-skill bodies. */
const makeReadFile = (bodies: Record<string, string> = {}) => {
  return vi.fn(async (p: string): Promise<string> => {
    if (p.endsWith('index.json')) return JSON.stringify(INDEX);
    for (const [key, content] of Object.entries(bodies)) {
      if (p.includes(key)) return content;
    }
    throw new Error(`Not found: ${p}`);
  });
};

/** Fresh library instance with injected I/O. */
const makeLib = (readFile = makeReadFile()) =>
  SkillLibrary.getInstance({ resourceDir: '/fake/skills-library', readFile });

// ---------------------------------------------------------------------------
// Reset singleton between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  SkillLibrary.resetInstance();
  // Prevent ProcessConfig from being called in unit tests by mocking initStorage
  vi.mock('@process/utils/initStorage', () => ({
    ProcessConfig: {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
    },
    getAssistantsDir: vi.fn(),
    getSkillsDir: vi.fn(),
    getBuiltinSkillsCopyDir: vi.fn(),
    getAutoSkillsDir: vi.fn(),
    getCronSkillsDir: vi.fn(),
    loadSkillsContent: vi.fn().mockResolvedValue(''),
    clearSkillsCache: vi.fn(),
    default: vi.fn(),
  }));
  vi.mock('@process/utils/mainLogger', () => ({
    mainLog: vi.fn(),
    mainWarn: vi.fn(),
    mainError: vi.fn(),
  }));
});

// ---------------------------------------------------------------------------
// list()
// ---------------------------------------------------------------------------

describe('SkillLibrary.list()', () => {
  it('returns all entries when called with no filter', async () => {
    const lib = makeLib();
    const results = await lib.list();
    expect(results).toHaveLength(INDEX.length);
  });

  it('filters by source', async () => {
    const lib = makeLib();
    const results = await lib.list({ source: 'wayland-library' });
    expect(results.every((e) => e.source === 'wayland-library')).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((e) => e.name === 'team-skill')).toBe(false);
  });

  it('filters by source - team', async () => {
    const lib = makeLib();
    const results = await lib.list({ source: 'team' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('team-skill');
  });

  it('matches query case-insensitively against name', async () => {
    const lib = makeLib();
    const results = await lib.list({ query: 'KUBE' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('kube-deploy');
  });

  it('matches query case-insensitively against description', async () => {
    const lib = makeLib();
    const results = await lib.list({ query: 'kubernetes' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('kube-deploy');
  });

  it('returns empty array when query matches nothing', async () => {
    const lib = makeLib();
    const results = await lib.list({ query: 'zzznomatch' });
    expect(results).toHaveLength(0);
  });

  it('filters by category', async () => {
    const lib = makeLib();
    const results = await lib.list({ category: 'frontend' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('react-component');
  });

  it('filters by tag', async () => {
    const lib = makeLib();
    const results = await lib.list({ tag: 'react' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('react-component');
  });

  it('filters by verdict', async () => {
    const lib = makeLib();
    const results = await lib.list({ verdict: 'blocked' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('blocked-skill');
  });
});

// ---------------------------------------------------------------------------
// get()
// ---------------------------------------------------------------------------

describe('SkillLibrary.get()', () => {
  it('returns the entry for a known name', async () => {
    const lib = makeLib();
    const result = await lib.get('kube-deploy');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('kube-deploy');
  });

  it('returns null for an unknown name', async () => {
    const lib = makeLib();
    const result = await lib.get('does-not-exist');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// stats()
// ---------------------------------------------------------------------------

describe('SkillLibrary.stats()', () => {
  it('counts total entries', async () => {
    const lib = makeLib();
    const s = await lib.stats();
    expect(s.total).toBe(INDEX.length);
  });

  it('counts entries by source', async () => {
    const lib = makeLib();
    const s = await lib.stats();
    expect(s.bySource['wayland-library']).toBe(INDEX.filter((e) => e.source === 'wayland-library').length);
    expect(s.bySource['team']).toBe(1);
  });

  it('counts flagged entries (verdict !== clean)', async () => {
    const lib = makeLib();
    const s = await lib.stats();
    const expectedFlagged = INDEX.filter((e) => e.security && e.security.verdict !== 'clean').length;
    expect(s.flagged).toBe(expectedFlagged);
  });

  it('returns pinned=0 when storage is unavailable', async () => {
    const lib = makeLib();
    const s = await lib.stats();
    expect(s.pinned).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// loadBody()
// ---------------------------------------------------------------------------

describe('SkillLibrary.loadBody()', () => {
  it('returns body content via the injected readFile', async () => {
    const readFile = makeReadFile({ 'kube-deploy': '# Kube Deploy\n\nDeploy stuff.' });
    const lib = makeLib(readFile);
    const body = await lib.loadBody('kube-deploy');
    expect(body).toBe('# Kube Deploy\n\nDeploy stuff.');
  });

  it('returns null for an unknown skill without throwing', async () => {
    const lib = makeLib();
    const body = await lib.loadBody('no-such-skill');
    expect(body).toBeNull();
  });

  it('returns null for a blocked skill and does NOT call readFile', async () => {
    const readFile = makeReadFile();
    const lib = makeLib(readFile);

    // Load index first so we know readFile was called once for index.json
    await lib.list();
    const indexCallCount = readFile.mock.calls.length;

    const body = await lib.loadBody('blocked-skill');
    expect(body).toBeNull();
    // readFile must not have been called again (no body read for blocked skill)
    expect(readFile.mock.calls.length).toBe(indexCallCount);
  });

  it('returns null when readFile throws (missing body file)', async () => {
    const readFile = makeReadFile(); // no bodies registered → throws for body paths
    const lib = makeLib(readFile);
    const body = await lib.loadBody('kube-deploy');
    expect(body).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// registerSource()
// ---------------------------------------------------------------------------

describe('SkillLibrary.registerSource()', () => {
  it('merges a second source - new skills are listed', async () => {
    const lib = makeLib();
    await lib.list(); // trigger index load

    const extra = entry({ name: 'imported-skill', source: 'imported', description: 'From import' });
    lib.registerSource([extra]);

    const results = await lib.list({ source: 'imported' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('imported-skill');
  });

  it('later registration wins on name collision', async () => {
    const lib = makeLib();
    await lib.list();

    const replacement = entry({
      name: 'kube-deploy',
      source: 'user',
      description: 'User-overridden kube deploy',
    });
    lib.registerSource([replacement]);

    const result = await lib.get('kube-deploy');
    expect(result!.source).toBe('user');
    expect(result!.description).toBe('User-overridden kube deploy');
  });

  it('total count after collision stays the same (old removed, new added)', async () => {
    const lib = makeLib();
    await lib.list();
    const before = (await lib.list()).length;

    lib.registerSource([entry({ name: 'kube-deploy', source: 'user' })]);

    const after = (await lib.list()).length;
    expect(after).toBe(before);
  });

  it('registerSource before any lazy load initialises collections cleanly', async () => {
    // Fresh lib - no list/get/stats called yet
    const readFile = makeReadFile();
    const lib = makeLib(readFile);

    lib.registerSource([entry({ name: 'early-skill', source: 'user' })]);

    // Now trigger load - should merge both
    const results = await lib.list();
    expect(results.some((e) => e.name === 'early-skill')).toBe(true);
    expect(results.some((e) => e.name === 'kube-deploy')).toBe(true);
  });
});

describe('buildResourceDirCandidates (packaged path resolution, #126/#127)', () => {
  it('probes process.resourcesPath FIRST when it is set (the packaged Windows path)', () => {
    const candidates = buildResourceDirCandidates('/app/app.asar/out/main', '/install/resources', 'skills-library');
    expect(candidates[0]).toBe(path.join('/install/resources', 'skills-library'));
  });

  it('omits the resourcesPath candidate when undefined (stdio subprocess) but keeps disk fallbacks', () => {
    const candidates = buildResourceDirCandidates('/app/out/main', undefined, 'skills-library');
    expect(candidates.every((c) => !c.startsWith(path.join('undefined')))).toBe(true);
    // dev candidate: out/main -> src/process/resources/skills-library
    expect(candidates).toContain(path.resolve('/app/out/main', '../../src/process/resources/skills-library'));
  });

  it('resolves the packaged extraResources dir three levels above app.asar.unpacked/out/main', () => {
    const candidates = buildResourceDirCandidates(
      `/A${path.sep}app.asar${path.sep}out${path.sep}main`,
      undefined,
      'skills-library'
    );
    // app.asar -> app.asar.unpacked, then ../../../skills-library == /A/skills-library
    expect(candidates).toContain(path.resolve(`/A${path.sep}app.asar.unpacked${path.sep}out${path.sep}main`, '../../../skills-library'));
  });
});
