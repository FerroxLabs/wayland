/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Injection-presence tests for the capabilities manifest (CONTRACT §U2 / SPEC
 * §1.7 "injection presence at both points"). For the Concierge assistant the
 * manifest reaches the model ONLY through these system-instruction assemblers
 * (buildTurnSkillContext deliberately skips Concierge), so this is the
 * acceptance-critical path and must be covered against regression.
 */
import { describe, it, expect, vi } from 'vitest';

// No skills + a pass-through Constitution so we can inspect the assembled rules.
vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: { getInstance: () => ({ list: vi.fn(async () => []), loadBody: vi.fn(async () => null) }) },
}));
vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/mock/skills',
  getBuiltinSkillsCopyDir: () => '/mock/builtin-skills',
  loadSkillsContent: vi.fn().mockResolvedValue(''),
}));
vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: {
    getInstance: () => ({
      discoverSkills: vi.fn(async () => {}),
      hasAnySkills: () => false,
      getSkillsIndex: () => [],
    }),
  },
  buildSkillsIndexText: () => '',
}));
vi.mock('@process/team/prompts/teamGuidePrompt.ts', () => ({ getTeamGuidePrompt: vi.fn(() => 'TEAM_GUIDE') }));
vi.mock('@process/team/prompts/teamGuideAssistant.ts', () => ({
  resolveLeaderAssistantLabel: vi.fn().mockResolvedValue('Leader'),
}));
// Pass-through Constitution composer: return the base prompt verbatim so the
// assertion inspects exactly what the assemblers pushed.
vi.mock('@process/services/constitution/composePrompt', () => ({
  composePrompt: ({ basePrompt }: { basePrompt?: string }) => ({
    text: basePrompt ?? '',
    approxTokens: 0,
    anthropicCacheControl: { type: 'ephemeral' as const },
    hadOverlay: false,
    constitutionSupported: true,
  }),
}));
vi.mock('@process/services/capabilities/CapabilitiesManifest', () => ({
  buildCapabilitiesManifest: vi.fn(async () => 'UNUSED'),
}));

import {
  buildSystemInstructionsWithSkillsIndex,
  prepareFirstMessageWithSkillsIndex,
  CAPABILITIES_MANIFEST_HEADER,
} from '@process/task/agentUtils';

const SENTINEL = 'SENTINEL_MANIFEST_BODY_42';

describe('buildSystemInstructionsWithSkillsIndex - manifest injection', () => {
  it('injects the manifest under the header when capabilitiesManifest is set', async () => {
    const out = await buildSystemInstructionsWithSkillsIndex({ capabilitiesManifest: SENTINEL });
    expect(out).toBeDefined();
    expect(out).toContain(CAPABILITIES_MANIFEST_HEADER);
    expect(out).toContain(SENTINEL);
  });

  it('omits the manifest header when capabilitiesManifest is unset', async () => {
    const out = await buildSystemInstructionsWithSkillsIndex({});
    expect(out ?? '').not.toContain(CAPABILITIES_MANIFEST_HEADER);
  });

  it('places the manifest AFTER the team guide (before the workflow protocol)', async () => {
    const out =
      (await buildSystemInstructionsWithSkillsIndex({ enableTeamGuide: true, capabilitiesManifest: SENTINEL })) ?? '';
    expect(out).toContain('TEAM_GUIDE');
    expect(out.indexOf(CAPABILITIES_MANIFEST_HEADER)).toBeGreaterThan(out.indexOf('TEAM_GUIDE'));
  });
});

describe('prepareFirstMessageWithSkillsIndex (ACP) - manifest injection', () => {
  it('injects the manifest into the assistant rules block when set', async () => {
    const { content } = await prepareFirstMessageWithSkillsIndex('hello', { capabilitiesManifest: SENTINEL });
    expect(content).toContain(CAPABILITIES_MANIFEST_HEADER);
    expect(content).toContain(SENTINEL);
    expect(content).toContain('hello');
  });

  it('omits the manifest header when unset', async () => {
    const { content } = await prepareFirstMessageWithSkillsIndex('hello', {});
    expect(content).not.toContain(CAPABILITIES_MANIFEST_HEADER);
  });
});
