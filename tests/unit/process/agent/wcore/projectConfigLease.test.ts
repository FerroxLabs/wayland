/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtemp, mkdir, realpath, rm, symlink, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withGlobalWCoreProfileLease, withWCoreProjectConfigLease } from '@process/agent/wcore/projectConfigLease';

describe('WCore project config launch lease', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'wayland-wcore-lease-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('serializes distinct chat scopes in one workspace through ready and restore', async () => {
    const project = join(root, 'project');
    await mkdir(project);
    const order: string[] = [];
    let releaseFirst!: () => void;
    const firstReady = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withWCoreProjectConfigLease(project, async () => {
      order.push('tavily-write');
      await firstReady;
      order.push('tavily-ready-restore');
    });
    await vi.waitFor(() => expect(order).toEqual(['tavily-write']));

    const second = withWCoreProjectConfigLease(project, async () => {
      order.push('firecrawl-write');
      order.push('firecrawl-ready-restore');
    });
    await vi.waitFor(() => expect(order).toEqual(['tavily-write']));

    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['tavily-write', 'tavily-ready-restore', 'firecrawl-write', 'firecrawl-ready-restore']);
  });

  it('does not serialize unrelated workspaces', async () => {
    const firstProject = join(root, 'project-a');
    const secondProject = join(root, 'project-b');
    await Promise.all([mkdir(firstProject), mkdir(secondProject)]);
    let releaseFirst!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = withWCoreProjectConfigLease(firstProject, () => hold);
    let secondEntered = false;
    await withWCoreProjectConfigLease(secondProject, async () => {
      secondEntered = true;
    });
    expect(secondEntered).toBe(true);
    releaseFirst();
    await first;
  });

  it('serializes two symlink aliases to the same physical workspace', async () => {
    const project = join(root, 'project');
    const alias = join(root, 'project-alias');
    await mkdir(project);
    await symlink(project, alias, 'dir');

    const order: string[] = [];
    let releaseFirst!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const canonicalProject = await realpath(project);
    const first = withWCoreProjectConfigLease(project, async (canonicalWorkspace) => {
      expect(canonicalWorkspace).toBe(canonicalProject);
      order.push('physical-enter');
      await hold;
      order.push('physical-leave');
    });
    await vi.waitFor(() => expect(order).toEqual(['physical-enter']));
    const second = withWCoreProjectConfigLease(alias, async (canonicalWorkspace) => {
      expect(canonicalWorkspace).toBe(canonicalProject);
      order.push('alias-enter');
    });
    await vi.waitFor(() => expect(order).toEqual(['physical-enter']));
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['physical-enter', 'physical-leave', 'alias-enter']);
  });

  it('keeps the leased physical path when a lexical alias is retargeted', async () => {
    const firstProject = join(root, 'project-a');
    const secondProject = join(root, 'project-b');
    const alias = join(root, 'project-alias');
    await Promise.all([mkdir(firstProject), mkdir(secondProject)]);
    await symlink(firstProject, alias, 'dir');
    const canonicalFirst = await realpath(firstProject);

    await withWCoreProjectConfigLease(alias, async (canonicalWorkspace) => {
      await unlink(alias);
      await symlink(secondProject, alias, 'dir');
      expect(await realpath(alias)).not.toBe(canonicalWorkspace);
      expect(canonicalWorkspace).toBe(canonicalFirst);
    });
  });
});

/**
 * K-01 Task 1 (RED): `withGlobalWCoreProfileLease` mirrors
 * `withWCoreProjectConfigLease`'s proven shape above, keyed on the global
 * config PATH instead of a workspace. Design decision 1 in K-01-PLAN.md
 * <objective>: this is a SEPARATE keyed lease (own Map,
 * `globalProfileLeaseTails`), never nested inside `withProfileAuthorityLock`.
 */
describe('WCore GLOBAL profile config lease', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'wayland-wcore-global-lease-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('(a) serializes two callers keyed on the same config dir through write -> task -> release order', async () => {
    const configDir = join(root, 'profile-a');
    await mkdir(configDir);
    const order: string[] = [];
    let releaseFirst!: () => void;
    const firstReady = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withGlobalWCoreProfileLease(configDir, async () => {
      order.push('first-write');
      await firstReady;
      order.push('first-ready-restore');
    });
    await vi.waitFor(() => expect(order).toEqual(['first-write']));

    const second = withGlobalWCoreProfileLease(configDir, async () => {
      order.push('second-write');
      order.push('second-ready-restore');
    });
    await vi.waitFor(() => expect(order).toEqual(['first-write']));

    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['first-write', 'first-ready-restore', 'second-write', 'second-ready-restore']);
  });

  it('(b) does NOT serialize two callers on different config dirs', async () => {
    const dirA = join(root, 'profile-b');
    const dirB = join(root, 'profile-c');
    await Promise.all([mkdir(dirA), mkdir(dirB)]);
    let releaseFirst!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = withGlobalWCoreProfileLease(dirA, () => hold);
    let secondEntered = false;
    await withGlobalWCoreProfileLease(dirB, async () => {
      secondEntered = true;
    });
    expect(secondEntered).toBe(true);
    releaseFirst();
    await first;
  });

  it('(c) keeps two distinct config dirs fully independent even when acquired in the same tick (concurrently)', async () => {
    const dirA = join(root, 'profile-d');
    const dirB = join(root, 'profile-e');
    await Promise.all([mkdir(dirA), mkdir(dirB)]);
    const order: string[] = [];
    let releaseA!: () => void;
    const holdA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    // Both acquisitions fire before either awaits - if the lease keyed on
    // something coarser than the full config path, one would queue behind
    // the other.
    const first = withGlobalWCoreProfileLease(dirA, async () => {
      order.push('a-enter');
      await holdA;
      order.push('a-leave');
    });
    const second = withGlobalWCoreProfileLease(dirB, async () => {
      order.push('b-enter');
      order.push('b-leave');
    });

    await second;
    expect(order).toEqual(['a-enter', 'b-enter', 'b-leave']);
    releaseA();
    await first;
    expect(order).toEqual(['a-enter', 'b-enter', 'b-leave', 'a-leave']);
  });

  it('(d) keys on the config PATH (dir + config.toml), not the bare dir string - a trailing separator resolves to the same key', async () => {
    const configDir = join(root, 'profile-f');
    await mkdir(configDir);
    const configDirWithSlash = `${configDir}${sep}`;
    const order: string[] = [];
    let releaseFirst!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withGlobalWCoreProfileLease(configDir, async () => {
      order.push('first');
      await hold;
    });
    await vi.waitFor(() => expect(order).toEqual(['first']));

    // Same physical config.toml, spelled with a trailing separator. `join`
    // normalizes this to the identical key, so the second caller must queue
    // behind the first rather than treating the bare-string difference as a
    // distinct dir - proving the exported key is the resolved config path.
    let secondEntered = false;
    const second = withGlobalWCoreProfileLease(configDirWithSlash, async () => {
      secondEntered = true;
    });
    await vi.waitFor(() => expect(order).toEqual(['first']));
    expect(secondEntered).toBe(false);

    releaseFirst();
    await Promise.all([first, second]);
    expect(secondEntered).toBe(true);
  });
});
