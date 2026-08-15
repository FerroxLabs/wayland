/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Scheduling by chat was unreachable on the Wayland Core backend - the default
 * one Concierge runs on.
 *
 * The `[Scheduling (CRITICAL)]` directive lived only in the ACP prompt builder.
 * The WCore/Gemini builder never carried it, `[LOAD_SKILL:]` was advertised but
 * intercepted only by GeminiAgentManager, and `wayland_search_skills` reads the
 * skill LIBRARY rather than the `_builtin` store - whose nearest cron entry is
 * `cron-scheduler`, generic crontab/systemd advice and precisely the behaviour
 * the directive forbids. So the model could neither be told the rule nor fetch
 * it.
 */

import { describe, expect, it, vi } from 'vitest';

// The Constitution composer needs a live service; this suite is about prompt
// assembly, so pass the assembled text straight through.
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
        getSkillsIndex: () => [{ name: 'cron', description: 'Scheduled task management' }],
      }),
    },
  };
});

import { buildSystemInstructionsWithSkillsIndex } from '@process/task/agentUtils';
import { buildSkillsIndexText } from '@process/task/AcpSkillManager';

describe('scheduling directive', () => {
  it('reaches the WCore backend with the parseable block inlined', async () => {
    const out = (await buildSystemInstructionsWithSkillsIndex({ backend: 'wcore' } as never)) ?? '';

    expect(out).toContain('[Scheduling (CRITICAL)]');
    // The exact markers CronCommandDetector matches - a directive that named a
    // different tag would be worse than none.
    expect(out).toContain('[CRON_PROPOSE]');
    expect(out).toContain('[/CRON_PROPOSE]');
    // Every field parseCronCreateBody needs.
    for (const field of ['name:', 'schedule:', 'schedule_description:', 'message:']) {
      expect(out).toContain(field);
    }
    // And the exclusivity rule that stops it reaching for OS cron.
    expect(out).toMatch(/cron daemon|systemd|external scheduler/i);
  });

  it('reaches Gemini too', async () => {
    const out = (await buildSystemInstructionsWithSkillsIndex({ backend: 'gemini' } as never)) ?? '';
    expect(out).toContain('[CRON_PROPOSE]');
  });

  it('does not point at a SKILL.md path these backends cannot read', async () => {
    const out = (await buildSystemInstructionsWithSkillsIndex({ backend: 'wcore' } as never)) ?? '';
    expect(out).not.toMatch(/cron\/SKILL\.md/);
  });
});

describe('[LOAD_SKILL:] is advertised only where a handler exists', () => {
  const skills = [{ name: 'cron', description: 'Scheduled task management' }];

  it('is advertised for Gemini, which intercepts the marker', async () => {
    const out = (await buildSystemInstructionsWithSkillsIndex({ backend: 'gemini' } as never)) ?? '';
    expect(out).toContain('[LOAD_SKILL:');
  });

  it('is NOT advertised for WCore, where nothing consumes it', async () => {
    const out = (await buildSystemInstructionsWithSkillsIndex({ backend: 'wcore' } as never)) ?? '';
    expect(out).not.toContain('[LOAD_SKILL:');
  });

  it('defaults off, so a new backend must opt in by wiring the handler', () => {
    expect(buildSkillsIndexText(skills, false)).not.toContain('[LOAD_SKILL:');
    expect(buildSkillsIndexText(skills, false, true)).toContain('[LOAD_SKILL:');
  });

  it('still lists the skills and the library note regardless', () => {
    const text = buildSkillsIndexText(skills, true);
    expect(text).toContain('- cron:');
    expect(text).toContain('wayland_search_skills');
  });
});
