import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildWikiState, getWikiState } from '@process/services/wiki/wikiIndex';
import type { WikiState } from '@/common/types/memory';

// ===== Temp dir helpers =====

const created: string[] = [];

function mkTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-wiki-test-'));
  created.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of created.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
});

function writeWikiFile(projectPath: string, name: string, fm: Record<string, unknown>, body: string): void {
  const wikiDir = path.join(projectPath, '.ijfw', 'wiki');
  fs.mkdirSync(wikiDir, { recursive: true });
  const fmLines = Object.entries(fm).map(([k, v]) => {
    if (Array.isArray(v)) return `${k}: [${v.map((x) => `"${x}"`).join(', ')}]`;
    return `${k}: ${v}`;
  });
  const content = `---\n${fmLines.join('\n')}\n---\n\n${body}`;
  fs.writeFileSync(path.join(wikiDir, `${name}.md`), content, 'utf8');
}

function writeMemoryFile(projectPath: string, filename: string, content: string): void {
  const memDir = path.join(projectPath, '.ijfw', 'memory');
  fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(path.join(memDir, filename), content, 'utf8');
}

// ===== Tests =====

describe('buildWikiState', () => {
  it('returns empty state when wiki dir does not exist', async () => {
    const projectPath = mkTmpProject();
    const state = await buildWikiState(projectPath);
    expect(state.version).toBe(1);
    expect(state.concepts).toHaveLength(0);
    expect(state.backlinkGraph).toEqual({});
    expect(state.orphanCandidates).toHaveLength(0);
  });

  it('builds a backlink graph from 2 concepts where A links to B', async () => {
    const projectPath = mkTmpProject();

    writeWikiFile(
      projectPath,
      'Concept A',
      {
        name: 'Concept A',
        slug: 'concept-a',
        topic_tag: 'Architecture',
        freshness: 'fresh',
        created: 1000,
      },
      'This page links to [[Concept B]] for reference.',
    );

    writeWikiFile(
      projectPath,
      'Concept B',
      {
        name: 'Concept B',
        slug: 'concept-b',
        topic_tag: 'Design',
        freshness: 'fresh',
        created: 2000,
      },
      'Concept B body text with no wikilinks.',
    );

    const state = await buildWikiState(projectPath);

    expect(state.concepts).toHaveLength(2);
    // concept-b should have concept-a listed as a backlink
    expect(state.backlinkGraph['concept-b']).toContain('concept-a');
    // concept-a should NOT be in backlinkGraph (nothing links to it)
    expect(state.backlinkGraph['concept-a'] ?? []).toHaveLength(0);
  });

  it('detects orphan candidates: 3 memories mentioning same proper noun without a wiki page', async () => {
    const projectPath = mkTmpProject();

    // 3 distinct memory files, each mentioning "Ferrox Engine"
    const memContent = (id: string, body: string) => `---\nid: ${id}\ntype: decision\nsummary: test\n---\n${body}`;

    writeMemoryFile(
      projectPath,
      'mem-1.md',
      memContent('m1', 'We use Ferrox Engine for the build pipeline.'),
    );
    writeMemoryFile(
      projectPath,
      'mem-2.md',
      memContent('m2', 'Ferrox Engine handles all the tool dispatch.'),
    );
    writeMemoryFile(
      projectPath,
      'mem-3.md',
      memContent('m3', 'Ferrox Engine performance was measured last week.'),
    );

    const state = await buildWikiState(projectPath);

    // Should have at least one orphan candidate mentioning "Ferrox Engine"
    const ferroxOrphan = state.orphanCandidates.find(
      (o) => o.suggestedName.toLowerCase().includes('ferrox'),
    );
    expect(ferroxOrphan).toBeDefined();
    expect(ferroxOrphan!.citationCount).toBeGreaterThanOrEqual(3);
    expect(ferroxOrphan!.memoryIds).toHaveLength(3);
  });

  it('writes wiki-state/index.json outside the wiki dir', async () => {
    const projectPath = mkTmpProject();
    writeWikiFile(
      projectPath,
      'Test Concept',
      { name: 'Test Concept', slug: 'test-concept', topic_tag: 'Process', freshness: 'fresh', created: 1000 },
      'Some body text.',
    );

    await buildWikiState(projectPath);

    const indexPath = path.join(projectPath, '.ijfw', 'wiki-state', 'index.json');
    expect(fs.existsSync(indexPath)).toBe(true);

    const raw = fs.readFileSync(indexPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
    expect(parsed.concepts).toHaveLength(1);
  });
});

describe('getWikiState', () => {
  it('reads cached index.json if present, without re-scanning', async () => {
    const projectPath = mkTmpProject();
    // Write a fake pre-built index
    const stateDir = path.join(projectPath, '.ijfw', 'wiki-state');
    fs.mkdirSync(stateDir, { recursive: true });
    const cached: WikiState = {
      version: 1,
      concepts: [
        {
          id: 'cached-c1',
          name: 'Cached Concept',
          slug: 'cached-concept',
          topicTag: 'Process',
          tldr: 'Cached TL;DR.',
          body: '',
          aliases: [] as string[],
          sourceMemoryIds: [] as string[],
          linkedFromConcepts: [] as string[],
          relatedConcepts: [] as string[],
          tags: [] as string[],
          lastSynthesizedAt: 9999,
          freshness: 'fresh',
        },
      ],
      backlinkGraph: {},
      orphanCandidates: [] as WikiState['orphanCandidates'],
      lastUpdatedAt: 9999,
    };
    fs.writeFileSync(path.join(stateDir, 'index.json'), JSON.stringify(cached), 'utf8');

    const state = await getWikiState(projectPath);
    expect(state.concepts).toHaveLength(1);
    expect(state.concepts[0].id).toBe('cached-c1');
  });

  it('falls back to buildWikiState when index.json is absent', async () => {
    const projectPath = mkTmpProject();
    const state = await getWikiState(projectPath);
    expect(state.concepts).toHaveLength(0);
  });
});
