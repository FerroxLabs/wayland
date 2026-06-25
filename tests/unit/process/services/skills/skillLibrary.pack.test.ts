/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { PACK_BLOB_NAME, PACK_OFFSETS_NAME } from '@process/services/skills/SkillPack';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

// #309: when a packed body store (skill-bodies.bin + offsets) is present in the
// resource dir, SkillLibrary.loadBody must read bodies from the PACK and never
// touch the loose bodies/ tree (which won't ship in packaged builds). Bodies not
// in the pack still fall back to loose files (dev tree). These tests hand-craft
// a pack whose content DIFFERS from the loose file so pack-priority is provable.

let tmp: string;
let resourceDir: string;
let workflowsDir: string;

const entry = (over: Partial<SkillIndexEntry> & { name: string; path: string }): SkillIndexEntry =>
  ({
    description: over.name,
    type: 'skill',
    source: 'wayland-library',
    metadata: { tags: [], category: 'general' },
    security: { verdict: 'unscanned', findings: [], scannerVersion: 0, llmScanned: false },
    ...over,
  }) as unknown as SkillIndexEntry;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'skilllib-pack-'));
  resourceDir = path.join(tmp, 'skills-library');
  workflowsDir = path.join(tmp, 'bundled-workflows');
  await fs.mkdir(resourceDir, { recursive: true });
  await fs.mkdir(workflowsDir, { recursive: true });
  SkillLibrary.resetInstance();
});
afterEach(async () => {
  SkillLibrary.resetInstance();
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writeLooseBody(rel: string, content: string): Promise<void> {
  const full = path.join(resourceDir, 'bodies', rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf-8');
}

describe('SkillLibrary loadBody with a packed body store (#309)', () => {
  it('reads the body from the pack, not the loose file, when both exist', async () => {
    await fs.writeFile(
      path.join(resourceDir, 'index.json'),
      JSON.stringify([entry({ name: 'alpha', path: 'skills/alpha/SKILL.md' })])
    );
    // Loose file says LOOSE; the pack says PACKED. Pack must win.
    await writeLooseBody('skills/alpha/SKILL.md', 'LOOSE-ALPHA');
    const blob = Buffer.from('PACKED-ALPHA', 'utf-8');
    await fs.writeFile(path.join(resourceDir, PACK_BLOB_NAME), blob);
    await fs.writeFile(
      path.join(resourceDir, PACK_OFFSETS_NAME),
      JSON.stringify({ version: 1, entries: { 'skills/alpha/SKILL.md': [0, blob.length] } })
    );

    const lib = SkillLibrary.getInstance({ resourceDir, bundledWorkflowsDir: workflowsDir });
    expect(await lib.loadBody('alpha')).toBe('PACKED-ALPHA');
  });

  it('falls back to the loose file for a body not present in the pack', async () => {
    await fs.writeFile(
      path.join(resourceDir, 'index.json'),
      JSON.stringify([
        entry({ name: 'alpha', path: 'skills/alpha/SKILL.md' }),
        entry({ name: 'beta', path: 'skills/beta/SKILL.md' }),
      ])
    );
    await writeLooseBody('skills/beta/SKILL.md', 'LOOSE-BETA');
    // Pack contains only alpha.
    const blob = Buffer.from('PACKED-ALPHA', 'utf-8');
    await fs.writeFile(path.join(resourceDir, PACK_BLOB_NAME), blob);
    await fs.writeFile(
      path.join(resourceDir, PACK_OFFSETS_NAME),
      JSON.stringify({ version: 1, entries: { 'skills/alpha/SKILL.md': [0, blob.length] } })
    );

    const lib = SkillLibrary.getInstance({ resourceDir, bundledWorkflowsDir: workflowsDir });
    expect(await lib.loadBody('beta')).toBe('LOOSE-BETA');
  });

  it('still refuses to load a blocked skill even when its body is in the pack', async () => {
    await fs.writeFile(
      path.join(resourceDir, 'index.json'),
      JSON.stringify([
        entry({
          name: 'danger',
          path: 'skills/danger/SKILL.md',
          security: {
            verdict: 'blocked',
            findings: [],
            scannerVersion: 1,
            llmScanned: false,
          } as SkillIndexEntry['security'],
        }),
      ])
    );
    const blob = Buffer.from('PACKED-DANGER', 'utf-8');
    await fs.writeFile(path.join(resourceDir, PACK_BLOB_NAME), blob);
    await fs.writeFile(
      path.join(resourceDir, PACK_OFFSETS_NAME),
      JSON.stringify({ version: 1, entries: { 'skills/danger/SKILL.md': [0, blob.length] } })
    );

    const lib = SkillLibrary.getInstance({ resourceDir, bundledWorkflowsDir: workflowsDir });
    expect(await lib.loadBody('danger')).toBeNull();
  });

  it('reads loose bodies normally when no pack is present (dev tree unchanged)', async () => {
    await fs.writeFile(
      path.join(resourceDir, 'index.json'),
      JSON.stringify([entry({ name: 'alpha', path: 'skills/alpha/SKILL.md' })])
    );
    await writeLooseBody('skills/alpha/SKILL.md', 'LOOSE-ALPHA');

    const lib = SkillLibrary.getInstance({ resourceDir, bundledWorkflowsDir: workflowsDir });
    expect(await lib.loadBody('alpha')).toBe('LOOSE-ALPHA');
  });
});
