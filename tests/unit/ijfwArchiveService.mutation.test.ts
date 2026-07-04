/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #414 - filesystem integration tests for IjfwArchiveService.deleteEntry /
 * editEntry. The pure block transforms live in memoryEntryMutation (tested
 * separately); here we exercise the SERVICE glue: entry discovery, id
 * derivation, atomic write / unlink, and the awaited reindex.
 *
 * Hermetic isolation: the service discovers stores exclusively via os.homedir()
 * (registry at ~/.ijfw/registry.md, the ~/dev fallback scan, and the "home
 * brain" candidate). We spy os.homedir() to point at a fresh temp dir seeded
 * with a `.ijfw/memory/*.md` store, so no real user memory is ever touched.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// ESM namespace exports can't be spied, so mock node:os wholesale and override
// only homedir() to point at our per-test temp store. Everything else (tmpdir,
// etc.) passes through to the real implementation.
const homeHolder = vi.hoisted(() => ({ path: '' }));
vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return { ...actual, homedir: () => homeHolder.path };
});

import { IjfwArchiveService } from '../../src/process/services/memory/ijfwArchiveService';
import type { MemoryEntry } from '../../src/common/types/memory';

// ===== Seed fixtures =====

const KNOWLEDGE_MD = `<!-- ijfw-schema: v1 -->
# Project Knowledge

---
type: decision
summary: Alpha decision about caching
stored: 2026-05-01T10:00:00.000Z
project: demo
tags: [cache, perf]
source_path: /orig/alpha.md
---
Body of alpha entry.
**Why:** caching saves time.

---
type: pattern
summary: Beta pattern for retries
stored: 2026-05-02T11:00:00.000Z
project: demo
tags: [retry]
source_path: /orig/beta.md
---
Body of beta pattern.

---
type: observation
summary: Gamma observation on latency
stored: 2026-05-03T12:00:00.000Z
project: demo
tags: [latency]
source_path: /orig/gamma.md
---
Body of gamma observation.
`;

const SOLO_MD = `<!-- ijfw-schema: v1 -->
---
type: preference
summary: Solo entry stands alone
stored: 2026-05-04T09:00:00.000Z
project: demo
tags: [solo]
source_path: /orig/solo.md
---
Body of the only entry.
`;

// Verbatim blocks the non-target entries must retain byte-for-byte.
const ALPHA_BLOCK = `---
type: decision
summary: Alpha decision about caching
stored: 2026-05-01T10:00:00.000Z
project: demo
tags: [cache, perf]
source_path: /orig/alpha.md
---
Body of alpha entry.
**Why:** caching saves time.`;

const GAMMA_BLOCK = `---
type: observation
summary: Gamma observation on latency
stored: 2026-05-03T12:00:00.000Z
project: demo
tags: [latency]
source_path: /orig/gamma.md
---
Body of gamma observation.`;

// ===== Test harness =====

// The service skips any store path containing '/tmp/' or 'Temp/' (buildIndex),
// so the fake HOME must live OUTSIDE the OS temp dir — os.tmpdir() is /tmp on
// Linux CI (mac resolves to /var/folders/... which slipped past the filter and
// hid this on local-mac only). node_modules is a gitignored, cross-platform,
// non-temp location that the filter accepts.
const TEST_TMP_BASE = path.join(process.cwd(), 'node_modules', '.ijfw-mut-test');

let tempHome: string;
let memoryDir: string;
let knowledgePath: string;
let soloPath: string;
let svc: IjfwArchiveService;

/** Fresh service that never opens real fs watchers on the temp files. */
function makeService(): IjfwArchiveService {
  return new IjfwArchiveService(() => ({ close: () => void 0 }));
}

async function idBySummary(summary: string): Promise<string> {
  const { entries } = await svc.listEntries({ limit: 1000 });
  const match = entries.find((e: MemoryEntry) => e.summary === summary);
  if (!match) throw new Error(`seed entry not found for summary: ${summary}`);
  return match.id;
}

async function summaries(): Promise<string[]> {
  const { entries } = await svc.listEntries({ limit: 1000 });
  return entries.map((e: MemoryEntry) => e.summary);
}

beforeEach(() => {
  fs.mkdirSync(TEST_TMP_BASE, { recursive: true });
  tempHome = fs.mkdtempSync(path.join(TEST_TMP_BASE, 'home-'));
  // Defensive: the chosen base must never sit under a filtered temp path, or the
  // service would index an empty store and the test would be vacuous.
  if (tempHome.includes('/tmp/') || tempHome.includes('Temp/')) {
    throw new Error(`temp dir ${tempHome} would be skipped by the service store filter`);
  }
  memoryDir = path.join(tempHome, '.ijfw', 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });
  knowledgePath = path.join(memoryDir, 'knowledge.md');
  soloPath = path.join(memoryDir, 'solo.md');
  fs.writeFileSync(knowledgePath, KNOWLEDGE_MD, 'utf8');
  fs.writeFileSync(soloPath, SOLO_MD, 'utf8');

  homeHolder.path = tempHome;
  svc = makeService();
});

afterEach(() => {
  svc.dispose();
  homeHolder.path = '';
  if (tempHome) fs.rmSync(tempHome, { recursive: true, force: true });
});

describe('IjfwArchiveService.deleteEntry (#414)', () => {
  it('removes only the target block, preserves the other entries verbatim', async () => {
    const betaId = await idBySummary('Beta pattern for retries');

    const result = await svc.deleteEntry(betaId);
    expect(result).toEqual({ ok: true });

    const after = fs.readFileSync(knowledgePath, 'utf8');
    // Other entries survive byte-for-byte.
    expect(after).toContain(ALPHA_BLOCK);
    expect(after).toContain(GAMMA_BLOCK);
    // Target is gone (frontmatter and body).
    expect(after).not.toContain('Beta pattern for retries');
    expect(after).not.toContain('Body of beta pattern.');

    // Index no longer returns the deleted entry.
    const remaining = await summaries();
    expect(remaining).toContain('Alpha decision about caching');
    expect(remaining).toContain('Gamma observation on latency');
    expect(remaining).not.toContain('Beta pattern for retries');
    await expect(svc.getEntry(betaId)).resolves.toBeNull();
  });

  it('unlinks the source file when deleting its last entry', async () => {
    const soloId = await idBySummary('Solo entry stands alone');
    expect(fs.existsSync(soloPath)).toBe(true);

    const result = await svc.deleteEntry(soloId);
    expect(result).toEqual({ ok: true });

    expect(fs.existsSync(soloPath)).toBe(false);
    // The multi-entry file is untouched.
    expect(fs.existsSync(knowledgePath)).toBe(true);
    const remaining = await summaries();
    expect(remaining).not.toContain('Solo entry stands alone');
  });

  it('returns not_found for a bogus id', async () => {
    const result = await svc.deleteEntry('deadbeefcafe');
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });
});

describe('IjfwArchiveService.editEntry (#414)', () => {
  it('changing the summary rewrites only that block and returns a new id', async () => {
    const oldId = await idBySummary('Alpha decision about caching');

    const result = await svc.editEntry(oldId, { summary: 'Alpha decision about memoization' });
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.newId).toBeDefined();
    expect(result.newId).not.toBe(oldId);

    // The new id resolves to the edited entry with new summary + intact body.
    const edited = await svc.getEntry(result.newId as string);
    expect(edited).not.toBeNull();
    expect(edited?.summary).toBe('Alpha decision about memoization');
    expect(edited?.body).toContain('Body of alpha entry.');

    // Sibling entries are untouched.
    const after = fs.readFileSync(knowledgePath, 'utf8');
    expect(after).toContain('Body of beta pattern.');
    expect(after).toContain(GAMMA_BLOCK);
    const list = await summaries();
    expect(list).toContain('Beta pattern for retries');
    expect(list).toContain('Gamma observation on latency');
    expect(list).not.toContain('Alpha decision about caching');
  });

  it('changing only the body preserves frontmatter and keeps the id stable', async () => {
    const betaId = await idBySummary('Beta pattern for retries');

    const result = await svc.editEntry(betaId, { body: 'Rewritten body for the beta pattern.' });
    expect(result.ok).toBe(true);
    // Summary unchanged => id (sha1 of sourcePath:stored:summary) is unchanged.
    expect(result.newId).toBe(betaId);

    const after = fs.readFileSync(knowledgePath, 'utf8');
    // Body replaced.
    expect(after).toContain('Rewritten body for the beta pattern.');
    expect(after).not.toContain('Body of beta pattern.');
    // Untouched frontmatter of the same block is preserved.
    expect(after).toContain('type: pattern');
    expect(after).toContain('source_path: /orig/beta.md');
    expect(after).toContain('tags: [retry]');
    expect(after).toContain('stored: 2026-05-02T11:00:00.000Z');

    const reread = await svc.getEntry(betaId);
    expect(reread?.body).toContain('Rewritten body for the beta pattern.');
  });

  it('returns not_found when editing a bogus id', async () => {
    const result = await svc.editEntry('deadbeefcafe', { summary: 'nope' });
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('refuses a rename that would collide with a sibling summary and leaves both entries intact (audit #1)', async () => {
    // Renaming one entry to match another's summary would make the two mutually
    // ambiguous for id/getEntry/edit/delete, so the edit must fail closed.
    const collidePath = path.join(memoryDir, 'collide.md');
    fs.writeFileSync(
      collidePath,
      [
        '---',
        'type: decision',
        'summary: Shared colliding title',
        'stored: 2026-07-02T00:00:00.000Z',
        'tags: []',
        '---',
        'SIBLING body sentinel.',
        '',
        '---',
        'type: observation',
        'summary: Distinct older title',
        'stored: 2026-07-01T00:00:00.000Z',
        'tags: []',
        '---',
        'EDITED body sentinel.',
        '',
      ].join('\n'),
      'utf8'
    );
    svc.dispose();
    svc = makeService(); // rescan to pick up collide.md

    const olderId = await idBySummary('Distinct older title');
    const res = await svc.editEntry(olderId, { summary: 'Shared colliding title' });
    expect(res).toEqual({ ok: false, error: 'summary_collision' });

    // Nothing was written: both entries survive byte-for-byte.
    const onDisk = fs.readFileSync(collidePath, 'utf8');
    expect(onDisk).toContain('summary: Distinct older title');
    expect(onDisk).toContain('EDITED body sentinel.');
    expect(onDisk).toContain('SIBLING body sentinel.');
  });
});

// NOTE on the 'unmanaged_path' guard: isManagedMemoryPath requires the entry's
// sourcePath to contain '/.ijfw/memory/'. Every entry the service indexes is
// discovered by scanning `<store>/.ijfw/memory`, so its sourcePath ALWAYS
// satisfies the guard. There is no public seam to insert an entry with an
// out-of-store sourcePath (the index is private and populated only by the
// disk scan), so that branch is unreachable without contorting the fixture.
// It is deliberately left to a future unit test of isManagedMemoryPath itself.
