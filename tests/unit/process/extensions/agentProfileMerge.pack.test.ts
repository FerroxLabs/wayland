/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #502 - vendored agent-profiles loaded with EMPTY bodies in packaged builds.
//
// Since #309 the packaged app ships skill bodies as a single packed blob
// (`skill-bodies.bin` + `skill-bodies.offsets.json`) with NO loose
// `bodies/<path>/SKILL.md` files, but agentProfileMerge kept resolving bodies
// with a raw readFileSync on `bodies/` only. Every read hit ENOENT, so all 25
// vendored agent-profiles merged with empty `context` / `prompts.system`.
//
// These tests exercise the merge against real temp-dir layouts for both
// worlds: packaged (pack only, no loose files) and dev (loose files, no
// pack), pinning the SkillLibrary.loadBody-style pack -> literal -> bodies/
// resolution order.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { buildSkillPack } from '@process/services/skills/SkillPack';
import {
  mergeVendoredAgentProfiles,
  __resetAgentProfileMergeCacheForTests,
} from '@process/extensions/data/bundle-vendored/agentProfileMerge';

type MutableProcess = NodeJS.Process & { resourcesPath?: string };
const proc = process as MutableProcess;
const ORIGINAL_RESOURCES_PATH = proc.resourcesPath;

let tmp: string;
let libDir: string;

// The merge resolves the skills-library dir via buildResourceDirCandidates,
// which probes `<process.resourcesPath>/skills-library` FIRST. Pointing
// resourcesPath at a temp dir makes the test's fixture library win over the
// real dev source tree.
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-profile-merge-'));
  libDir = path.join(tmp, 'skills-library');
  await fs.mkdir(libDir, { recursive: true });
  proc.resourcesPath = tmp;
  __resetAgentProfileMergeCacheForTests();
});

afterEach(async () => {
  if (ORIGINAL_RESOURCES_PATH === undefined) {
    delete proc.resourcesPath;
  } else {
    proc.resourcesPath = ORIGINAL_RESOURCES_PATH;
  }
  __resetAgentProfileMergeCacheForTests();
  await fs.rm(tmp, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** Minimal agent-profile index entry mirroring the real vendored index.json shape. */
function profileEntry(name: string, relPath: string, category = 'business'): Record<string, unknown> {
  return {
    name,
    description: `${name} description`,
    category,
    metadata: { category },
    path: relPath,
    source: 'wayland-library',
    type: 'agent-profile',
  };
}

async function writeIndex(entries: Record<string, unknown>[]): Promise<void> {
  await fs.writeFile(path.join(libDir, 'index.json'), JSON.stringify(entries));
}

async function writeLooseBody(relPath: string, content: string): Promise<void> {
  const full = path.join(libDir, 'bodies', relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf-8');
}

/**
 * Build a real pack (blob + offsets) into libDir from a throwaway staging
 * tree, then remove the staging so libDir mimics the packaged layout: an
 * index.json + skill-bodies.bin + skill-bodies.offsets.json and NO loose
 * bodies/.
 */
async function packBodies(bodies: Record<string, string>): Promise<void> {
  const staging = path.join(tmp, 'staging');
  await fs.mkdir(staging, { recursive: true });
  const stagingIndex = Object.keys(bodies).map((relPath, i) => ({ name: `entry-${i}`, path: relPath }));
  await fs.writeFile(path.join(staging, 'index.json'), JSON.stringify(stagingIndex));
  for (const [relPath, content] of Object.entries(bodies)) {
    const full = path.join(staging, 'bodies', relPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, 'utf-8');
  }
  await buildSkillPack(staging, libDir);
  await fs.rm(staging, { recursive: true, force: true });
}

function mergedProfile(id: string): Record<string, unknown> {
  const merged = mergeVendoredAgentProfiles([]);
  const found = merged.find((a) => a.id === id);
  expect(found, `merged assistant ${id}`).toBeDefined();
  return found!;
}

describe('agentProfileMerge body resolution (#502)', () => {
  it('packaged layout: resolves bodies from the packed blob when no loose bodies/ exist', async () => {
    const relA = 'agents/business/finance-analyst/SKILL.md';
    const relB = 'agents/engineering/code-reviewer/SKILL.md';
    const bodyA = '# Finance Analyst\nPacked body with unicode — ✓';
    const bodyB = '# Code Reviewer\nSecond packed body at a nonzero offset';
    await packBodies({ [relA]: bodyA, [relB]: bodyB });
    await writeIndex([profileEntry('finance-analyst', relA), profileEntry('code-reviewer', relB, 'engineering')]);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const a = mergedProfile('finance-analyst');
    expect(a.context).toBe(bodyA);
    expect((a.prompts as { system: string }).system).toBe(bodyA);

    const b = mergedProfile('code-reviewer');
    expect(b.context).toBe(bodyB);
    expect((b.prompts as { system: string }).system).toBe(bodyB);

    // The packaged-build symptom was a "body read failed ... ENOENT" warning
    // per profile; the pack path must be silent.
    expect(warn.mock.calls.filter(([msg]) => String(msg).includes('body read failed'))).toHaveLength(0);
  });

  it('dev layout: falls back to loose bodies/<path> files when no pack exists', async () => {
    const rel = 'agents/business/finance-analyst/SKILL.md';
    await writeLooseBody(rel, 'dev-tree body');
    await writeIndex([profileEntry('finance-analyst', rel)]);

    const a = mergedProfile('finance-analyst');
    expect(a.context).toBe('dev-tree body');
    expect((a.prompts as { system: string }).system).toBe('dev-tree body');
  });

  it('resolves a literal <dir>/<path> body (no bodies/ prefix), mirroring SkillLibrary.loadBody', async () => {
    const rel = 'agents/business/finance-analyst/SKILL.md';
    const full = path.join(libDir, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, 'literal-path body', 'utf-8');
    await writeIndex([profileEntry('finance-analyst', rel)]);

    const a = mergedProfile('finance-analyst');
    expect(a.context).toBe('literal-path body');
  });

  it('pack present but entry missing from it: falls back to the loose file', async () => {
    const packedRel = 'agents/business/other/SKILL.md';
    const looseRel = 'agents/business/finance-analyst/SKILL.md';
    await packBodies({ [packedRel]: 'unrelated packed body' });
    await writeLooseBody(looseRel, 'loose fallback body');
    await writeIndex([profileEntry('finance-analyst', looseRel)]);

    const a = mergedProfile('finance-analyst');
    expect(a.context).toBe('loose fallback body');
  });

  it('unresolvable body degrades to empty string with a single warning (no throw)', async () => {
    const rel = 'agents/business/gone/SKILL.md';
    await writeIndex([profileEntry('gone', rel)]);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const a = mergedProfile('gone');
    expect(a.context).toBe('');
    expect(warn.mock.calls.filter(([msg]) => String(msg).includes('body read failed for gone'))).toHaveLength(1);
  });

  it('corrupt offsets index degrades to the loose fallback instead of crashing', async () => {
    const rel = 'agents/business/finance-analyst/SKILL.md';
    await fs.writeFile(path.join(libDir, 'skill-bodies.bin'), 'data');
    await fs.writeFile(path.join(libDir, 'skill-bodies.offsets.json'), '{ not json');
    await writeLooseBody(rel, 'loose body survives corrupt pack');
    await writeIndex([profileEntry('finance-analyst', rel)]);

    const a = mergedProfile('finance-analyst');
    expect(a.context).toBe('loose body survives corrupt pack');
  });
});
