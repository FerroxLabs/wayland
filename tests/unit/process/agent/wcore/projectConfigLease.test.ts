/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtemp, mkdir, realpath, rm, symlink, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withWCoreProjectConfigLease } from '@process/agent/wcore/projectConfigLease';

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
