/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const oneShotCompleteBestMock = vi.hoisted(() => vi.fn());
const getInstallTargetDirMock = vi.hoisted(() => vi.fn(() => '/tmp/extensions'));
const hotReloadMock = vi.hoisted(() => vi.fn());

vi.mock('@/common', () => ({
  ipcBridge: {
    extensions: {},
  },
}));

vi.mock('@process/extensions', () => ({
  ExtensionRegistry: {
    getInstance: vi.fn(() => ({
      getThemes: vi.fn(() => []),
    })),
    hotReload: hotReloadMock,
  },
}));

vi.mock('@process/extensions/constants', () => ({
  getInstallTargetDir: getInstallTargetDirMock,
}));

vi.mock('@process/extensions/types', () => ({
  ExtensionManifestSchema: {
    safeParse: vi.fn((value) => ({ success: true, data: value })),
  },
}));

vi.mock('@process/services/completion/oneShot', () => ({
  oneShotCompleteBest: oneShotCompleteBestMock,
}));

import {
  createExtensionFromBuilderPlan,
  draftExtensionPlanWithModel,
} from '../../../../src/process/bridge/extensionsBridge';
import { oneShotCompleteBest } from '../../../../src/process/services/completion/oneShot';

describe('Extension Builder model-backed draft', () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = '';
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('uses the resilient one-shot completion path instead of directly binding providers', async () => {
    oneShotCompleteBestMock.mockResolvedValue(
      JSON.stringify({
        name: 'Project Archive',
        slug: 'project-archive',
        summary: 'Archive projects without deleting them.',
        riskLevel: 'safe',
        permissions: ['storage: extension-scoped'],
        contributions: ['settings tab'],
        files: ['aion-extension.json', 'settings/project-archive.html'],
        reviewItems: ['Confirm archived projects belong at the bottom of Projects.'],
        reply: 'I drafted a reviewable archive-project plan.',
      })
    );

    const result = await draftExtensionPlanWithModel(
      [
        {
          role: 'user',
          content: 'Build an extension that archives a project instead of deleting it.',
        },
      ],
      'Build an extension that archives a project instead of deleting it.'
    );

    expect(oneShotCompleteBest).toHaveBeenCalledWith(expect.stringContaining('Wayland Extension Builder'), {
      maxTokens: 1600,
      timeoutMs: 45_000,
    });
    expect(result.source).toBe('ai');
    expect(result.plan.slug).toBe('project-archive');
    expect(result.reply).toBe('I drafted a reviewable archive-project plan.');
  });

  it('scrubs first-party-only settings tabs from model-generated local plans', async () => {
    oneShotCompleteBestMock.mockResolvedValue(
      JSON.stringify({
        name: 'Project Dashboard',
        slug: 'project-dashboard',
        summary: 'Show project status in a dashboard.',
        riskLevel: 'safe',
        permissions: ['storage: extension-scoped'],
        contributions: ['settings tab'],
        files: ['aion-extension.json', 'settings/project-dashboard.html'],
        reviewItems: ['Confirm where the settings tab should appear.'],
        reply: 'I drafted a dashboard plan.',
      })
    );

    const result = await draftExtensionPlanWithModel(
      [
        {
          role: 'user',
          content: 'Build a settings dashboard extension for project status.',
        },
      ],
      'Build a settings dashboard extension for project status.'
    );

    expect(result.plan.contributions).not.toContain('settings tab');
    expect(result.plan.contributions).toContain('MCP server');
    expect(result.plan.files).not.toContain('settings/project-dashboard.html');
    expect(result.plan.files).toContain('mcp/project-dashboard.js');
    expect(result.plan.files).toContain('README.md');
    expect(result.plan.reviewItems[0]).toContain('first-party bundled only');
  });

  it('creates local builder scaffolds without settings tab contributions', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-extension-builder-'));
    getInstallTargetDirMock.mockReturnValue(tempDir);

    const created = await createExtensionFromBuilderPlan({
      name: 'Project Dashboard',
      slug: 'project-dashboard',
      summary: 'Show project status in a dashboard.',
      riskLevel: 'safe',
      permissions: ['storage: extension-scoped'],
      contributions: ['settings tab'],
      files: ['aion-extension.json', 'settings/project-dashboard.html'],
      reviewItems: ['Confirm where the settings tab should appear.'],
      creationPath: 'user-data/extensions/project-dashboard',
    });

    const manifest = JSON.parse(await fs.readFile(path.join(created.directory, 'aion-extension.json'), 'utf-8'));

    expect(created.files).toContain('README.md');
    expect(created.files).toContain('mcp/project-dashboard.js');
    expect(created.files).not.toContain('settings/project-dashboard.html');
    expect(manifest.contributes.settingsTabs).toBeUndefined();
    expect(manifest.contributes.mcpServers).toHaveLength(1);
    await expect(fs.access(path.join(created.directory, 'settings', 'project-dashboard.html'))).rejects.toThrow();
    expect(hotReloadMock).toHaveBeenCalledOnce();
  });
});
