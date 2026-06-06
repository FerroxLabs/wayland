/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Live smoke for the waylandteams specialist-bundle integration.
 *
 * Exercises the real ExtensionLoader + resolveAssistants + resolveSkills
 * against the bundle mounted at $HOME/.wayland-dev/extensions/. This is the
 * empirical verification of INTEGRATION.md §2 findings #4 and #5 - does the
 * extension actually load and resolve under the live schema, and do the
 * enabledSkills references reach the runtime config in the expected shape?
 *
 * Skips automatically if the bundle isn't mounted, so CI without the dev mount
 * keeps passing. To run locally:
 *
 *   ln -snf ~/dev/waylandteams ~/.wayland-dev/extensions/waylandteams-specialist-bundle
 *   bun run vitest run tests/unit/extensions/teamsBundleSmoke.test.ts
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: vi.fn(() => '/tmp/wayland-teams-smoke') },
}));

const BUNDLE_DIR_NAME = 'waylandteams-specialist-bundle';
const DEFAULT_EXT_DIR = path.join(os.homedir(), '.wayland-dev', 'extensions');
const BUNDLE_DIR = path.join(DEFAULT_EXT_DIR, BUNDLE_DIR_NAME);
const MANIFEST = path.join(BUNDLE_DIR, 'aion-extension.json');

const bundleMounted = fs.existsSync(MANIFEST);

const describeIfMounted = bundleMounted ? describe : describe.skip;

const originalEnv = { ...process.env };

describeIfMounted('waylandteams bundle - live load + resolve', () => {
  beforeAll(() => {
    // Point ExtensionLoader at the dev-mount dir so the loader scans it
    // regardless of what getDataPath() resolves to under vitest.
    process.env.WAYLAND_EXTENSIONS_PATH = DEFAULT_EXT_DIR;
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  it('loads the manifest and validates against ExtensionManifestSchema', async () => {
    const { ExtensionLoader } = await import('@process/extensions/ExtensionLoader');
    const loader = new ExtensionLoader();
    const extensions = await loader.loadAll();

    const bundle = extensions.find((e) => e.manifest.name === 'waylandteams-specialist-bundle');
    expect(bundle, 'bundle manifest must load and pass schema validation').toBeDefined();
    expect(bundle!.manifest.contributes.assistants).toBeDefined();
    expect(bundle!.manifest.contributes.skills).toBeDefined();
    expect(bundle!.manifest.contributes.assistants!.length).toBeGreaterThanOrEqual(34);
    expect(bundle!.manifest.contributes.skills!.length).toBeGreaterThanOrEqual(70);
  });

  it('resolves every assistant with ext- prefixed id and inlined context', async () => {
    const { ExtensionLoader } = await import('@process/extensions/ExtensionLoader');
    const { resolveAssistants } = await import('@process/extensions/resolvers/AssistantResolver');

    const loader = new ExtensionLoader();
    const extensions = await loader.loadAll();
    const bundle = extensions.find((e) => e.manifest.name === 'waylandteams-specialist-bundle')!;

    const resolved = await resolveAssistants([bundle]);
    expect(resolved.length).toBe(bundle.manifest.contributes.assistants!.length);

    for (const a of resolved) {
      expect(String(a.id).startsWith('ext-')).toBe(true);
      expect(a.isPreset).toBe(true);
      expect(a.isBuiltin).toBe(false);
      expect(a._source).toBe('extension');
      // Every assistant points at a contextFile - the resolver inlines the
      // file content as `context`. If a context file is missing, this catches
      // the broken pointer.
      expect(typeof a.context === 'string').toBe(true);
      expect((a.context as string).length).toBeGreaterThan(0);
    }
  });

  it('resolves every contributed skill with a readable file path', async () => {
    const { ExtensionLoader } = await import('@process/extensions/ExtensionLoader');
    const { resolveSkills } = await import('@process/extensions/resolvers/SkillResolver');

    const loader = new ExtensionLoader();
    const extensions = await loader.loadAll();
    const bundle = extensions.find((e) => e.manifest.name === 'waylandteams-specialist-bundle')!;

    const resolved = resolveSkills([bundle]);
    const declared = bundle.manifest.contributes.skills!;
    // The resolver silently drops skills whose file pointer doesn't exist.
    // A drop count > 0 means a broken pointer - surface it in the assertion
    // message so Wave G can capture which one.
    const droppedCount = declared.length - resolved.length;
    expect(droppedCount, `${droppedCount} contributed skills failed to resolve (broken file pointer)`).toBe(0);
  });

  it('cross-checks every enabledSkill on every assistant against the resolved skills index', async () => {
    const { ExtensionLoader } = await import('@process/extensions/ExtensionLoader');
    const { resolveSkills } = await import('@process/extensions/resolvers/SkillResolver');

    const loader = new ExtensionLoader();
    const extensions = await loader.loadAll();
    const bundle = extensions.find((e) => e.manifest.name === 'waylandteams-specialist-bundle')!;

    const resolvedSkills = resolveSkills([bundle]);
    const skillNames = new Set(resolvedSkills.map((s) => s.name));

    const missing: string[] = [];
    for (const a of bundle.manifest.contributes.assistants!) {
      for (const sk of a.enabledSkills ?? []) {
        if (!skillNames.has(sk)) missing.push(`${a.id} -> ${sk}`);
      }
    }

    // Known content drift (Wave G item, recorded 2026-05-18 during T4 +
    // extended 2026-05-18 evening when dev-shop joined the Standing
    // Companies group per COMPANIES-HANDOFF.md):
    // All seven Standing Companies reference a `cron` mode skill that
    // hasn't been authored into contributes/skills.json yet (quiet-money-standing
    // joined the group in 899570a3e; book-publishing-house joined as the 7th
    // Standing Company in a later upstream sync). Wayland gracefully warns at
    // runtime on missing skill references - these launchers still load, they just
    // load with one fewer declared skill. Tracked separately for the next
    // waylandteams authoring session. Document the known set here so any NEW miss
    // surfaces immediately but the existing seven don't gate.
    const allowedMisses = new Set([
      'marketing-agency -> cron',
      'sales-org -> cron',
      'customer-success-org -> cron',
      'editorial-newsroom -> cron',
      'dev-shop -> cron',
      'quiet-money-standing -> cron',
      'book-publishing-house -> cron',
    ]);
    const unexpected = missing.filter((m) => !allowedMisses.has(m));
    expect(unexpected, `Unexpected enabledSkills misses: ${unexpected.join(', ')}`).toEqual([]);
  });
});
