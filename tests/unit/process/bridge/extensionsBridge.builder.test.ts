/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const oneShotCompleteBestMock = vi.hoisted(() => vi.fn());

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
    hotReload: vi.fn(),
  },
}));

vi.mock('@process/extensions/constants', () => ({
  getInstallTargetDir: vi.fn(() => '/tmp/extensions'),
}));

vi.mock('@process/extensions/types', () => ({
  ExtensionManifestSchema: {
    parse: vi.fn((value) => value),
  },
}));

vi.mock('@process/services/completion/oneShot', () => ({
  oneShotCompleteBest: oneShotCompleteBestMock,
}));

import { draftExtensionPlanWithModel } from '../../../../src/process/bridge/extensionsBridge';
import { oneShotCompleteBest } from '../../../../src/process/services/completion/oneShot';

describe('Extension Builder model-backed draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
