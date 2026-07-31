/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The scheduling directive is gated on the cron skill actually being present.
 * If the user excluded it there is no scheduling path to point at, and an
 * unconditional push would also stop this builder ever returning `undefined` -
 * the signal WCoreManager uses to preserve "no presetRules" on a fresh install.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@process/services/constitution/composePrompt', () => ({
  composePrompt: ({ basePrompt }: { basePrompt: string }) => ({ text: basePrompt }),
}));

vi.mock('@process/task/AcpSkillManager', async (orig) => {
  const actual = await orig<typeof import('@process/task/AcpSkillManager')>();
  return {
    ...actual,
    AcpSkillManager: {
      getInstance: () => ({
        discoverSkills: async () => undefined,
        hasAnySkills: () => true,
        // cron deliberately absent
        getSkillsIndex: () => [{ name: 'office-cli', description: 'Documents' }],
      }),
    },
  };
});

import { buildSystemInstructionsWithSkillsIndex } from '@process/task/agentUtils';

describe('scheduling directive is gated on cron being available', () => {
  it('is omitted when the cron skill is not in the always-on set', async () => {
    const out = (await buildSystemInstructionsWithSkillsIndex({ backend: 'wcore' } as never)) ?? '';
    expect(out).toContain('office-cli');
    expect(out).not.toContain('[CRON_PROPOSE]');
    expect(out).not.toContain('[Scheduling (CRITICAL)]');
  });
});
