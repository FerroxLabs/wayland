/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for the Workflow Launch Surface (SPEC §7.3) injection of the
 * static `WORKFLOW_PROTOCOL` block into the system instructions assembled by
 * `buildSystemInstructions`, `buildSystemInstructionsWithSkillsIndex`, and
 * `prepareFirstMessageWithSkillsIndex` inside `src/process/task/agentUtils.ts`.
 *
 * Verifies three contracts:
 *   1. `workflowSessionId` omitted ⇒ no protocol block is appended.
 *   2. `workflowSessionId` set + service returns a session ⇒ the composed
 *      protocol string is appended AT THE END of the assembled rules.
 *   3. The service throwing ⇒ instructions still build (soft-fail per §7.3).
 *
 * The workflow singleton, skill manager, team-guide prompt, constitution
 * bridge, and storage helpers are all mocked so we exercise ONLY the
 * injection wiring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mock state so vi.mock factories can capture references.
const { workflowState, skillsState } = vi.hoisted(() => ({
  workflowState: {
    service: null as null | {
      findById: (sessionId: string) => Promise<unknown>;
    },
  },
  skillsState: {
    hasAny: false,
    index: [] as Array<{ name: string; description: string; source: string }>,
  },
}));

vi.mock('@process/services/workflow/workflowSessionServiceSingleton', () => ({
  getWorkflowSessionService: () => workflowState.service,
}));

// Stub the protocol composer to a deterministic sentinel so we can assert on
// the EXACT placement of the appended block.
vi.mock('@process/services/workflow/composeWorkflowSystemPrompt', () => ({
  composeWorkflowSystemPrompt: vi.fn(() => 'WORKFLOW_PROTOCOL_SENTINEL_BODY'),
}));

vi.mock('@process/bridge/constitutionBridge', () => ({
  readConstitutionWithOverlay: vi.fn().mockReturnValue({ constitution: '', overlay: null }),
}));

vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: {
    getInstance: vi.fn(() => ({
      discoverSkills: vi.fn().mockResolvedValue(undefined),
      hasAnySkills: () => skillsState.hasAny,
      getSkillsIndex: () => skillsState.index,
    })),
  },
  buildSkillsIndexText: (skills: Array<{ name: string }>) =>
    `[Skills Index]\n${skills.map((s) => `- ${s.name}`).join('\n')}`,
}));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/mock/skills',
  getBuiltinSkillsCopyDir: () => '/mock/builtin-skills',
  loadSkillsContent: vi.fn().mockResolvedValue(''),
}));

// Pin the SkillLibrary singleton to an empty list so `libraryIsNonEmpty()`
// returns false. Otherwise, when another test file in the same Vitest run has
// populated the real singleton, the `prepareFirstMessageWithSkillsIndex`
// path injects the [Skills Location] block and the "does not append" assertion
// becomes brittle. We are testing WORKFLOW_PROTOCOL placement, not skill
// content - so we hold the skill surface flat here.
vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: {
    getInstance: () => ({
      list: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock('@process/team/prompts/teamGuidePrompt.ts', () => ({
  getTeamGuidePrompt: vi.fn(() => 'TEAM_GUIDE_PROMPT_BODY'),
}));

vi.mock('@process/team/prompts/teamGuideAssistant.ts', () => ({
  resolveLeaderAssistantLabel: vi.fn().mockResolvedValue('Leader'),
}));

import {
  buildSystemInstructions,
  buildSystemInstructionsWithSkillsIndex,
  prepareFirstMessageWithSkillsIndex,
} from '@process/task/agentUtils';

const SENTINEL = 'WORKFLOW_PROTOCOL_SENTINEL_BODY';

describe('agentUtils - WORKFLOW_PROTOCOL injection (SPEC §7.3)', () => {
  beforeEach(() => {
    workflowState.service = null;
    skillsState.hasAny = false;
    skillsState.index = [];
  });

  // -------------------------------------------------------------------------
  // 1. No workflowSessionId - existing behaviour unchanged
  // -------------------------------------------------------------------------

  it('buildSystemInstructions: returns undefined when nothing is configured and no workflowSessionId', async () => {
    const result = await buildSystemInstructions({});
    expect(result).toBeUndefined();
  });

  it('buildSystemInstructions: does NOT append the protocol when workflowSessionId is undefined', async () => {
    const result = await buildSystemInstructions({ presetContext: 'PRESET_BODY' });
    expect(result).toBe('PRESET_BODY');
    expect(result).not.toContain(SENTINEL);
  });

  it('buildSystemInstructionsWithSkillsIndex: does NOT append the protocol when workflowSessionId is undefined', async () => {
    const result = await buildSystemInstructionsWithSkillsIndex({ presetContext: 'PRESET_BODY' });
    expect(result).toBe('PRESET_BODY');
    expect(result).not.toContain(SENTINEL);
  });

  it('prepareFirstMessageWithSkillsIndex: does NOT append the protocol when workflowSessionId is undefined', async () => {
    const result = await prepareFirstMessageWithSkillsIndex('hello agent', {});
    expect(result.content).toBe('hello agent');
    expect(result.content).not.toContain(SENTINEL);
  });

  // -------------------------------------------------------------------------
  // 2. workflowSessionId set + session resolves - protocol appended LAST
  // -------------------------------------------------------------------------

  it('buildSystemInstructions: appends protocol at the END when workflowSessionId resolves', async () => {
    workflowState.service = {
      findById: vi.fn().mockResolvedValue({ id: 'wf-1' }),
    };

    const result = await buildSystemInstructions({
      presetContext: 'PRESET_BODY',
      workflowSessionId: 'wf-1',
    });

    expect(result).toBeDefined();
    expect(result).toContain('PRESET_BODY');
    expect(result).toContain(SENTINEL);
    // Primacy at the end: protocol comes AFTER preset content.
    const presetIdx = result!.indexOf('PRESET_BODY');
    const protocolIdx = result!.indexOf(SENTINEL);
    expect(protocolIdx).toBeGreaterThan(presetIdx);
    // No trailing content after the protocol block.
    expect(result!.endsWith(SENTINEL)).toBe(true);
  });

  it('buildSystemInstructionsWithSkillsIndex: appends protocol at the END when workflowSessionId resolves', async () => {
    workflowState.service = {
      findById: vi.fn().mockResolvedValue({ id: 'wf-2' }),
    };

    const result = await buildSystemInstructionsWithSkillsIndex({
      presetContext: 'PRESET_BODY',
      workflowSessionId: 'wf-2',
    });

    expect(result).toBeDefined();
    expect(result).toContain('PRESET_BODY');
    expect(result).toContain(SENTINEL);
    expect(result!.endsWith(SENTINEL)).toBe(true);
  });

  it('prepareFirstMessageWithSkillsIndex: appends protocol at the END of the rules block', async () => {
    workflowState.service = {
      findById: vi.fn().mockResolvedValue({ id: 'wf-3' }),
    };

    const result = await prepareFirstMessageWithSkillsIndex('do the thing', {
      presetContext: 'PRESET_BODY',
      workflowSessionId: 'wf-3',
    });

    expect(result.content).toContain('[Assistant Rules - You MUST follow these instructions]');
    expect(result.content).toContain('PRESET_BODY');
    expect(result.content).toContain(SENTINEL);
    expect(result.content).toContain('[User Request]\ndo the thing');
    // Protocol must sit AFTER the preset body inside the rules block.
    const presetIdx = result.content.indexOf('PRESET_BODY');
    const protocolIdx = result.content.indexOf(SENTINEL);
    expect(protocolIdx).toBeGreaterThan(presetIdx);
  });

  // -------------------------------------------------------------------------
  // 3. Soft-fail behaviour
  // -------------------------------------------------------------------------

  it('soft-fails when the singleton is unwired (cold start): builds without the protocol', async () => {
    workflowState.service = null;

    const result = await buildSystemInstructions({
      presetContext: 'PRESET_BODY',
      workflowSessionId: 'wf-cold',
    });

    expect(result).toBe('PRESET_BODY');
    expect(result).not.toContain(SENTINEL);
  });

  it('soft-fails when findById returns null: builds without the protocol', async () => {
    workflowState.service = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const result = await buildSystemInstructions({
      presetContext: 'PRESET_BODY',
      workflowSessionId: 'wf-missing',
    });

    expect(result).toBe('PRESET_BODY');
    expect(result).not.toContain(SENTINEL);
  });

  it('soft-fails when findById throws: instructions still build (no exception)', async () => {
    workflowState.service = {
      findById: vi.fn().mockRejectedValue(new Error('db gone')),
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await buildSystemInstructions({
      presetContext: 'PRESET_BODY',
      workflowSessionId: 'wf-boom',
    });

    expect(result).toBe('PRESET_BODY');
    expect(result).not.toContain(SENTINEL);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
