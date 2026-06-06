/**
 * Unit tests for prepareFirstMessageWithSkillsIndex - the ACP-side
 * function that prepends the composed Constitution + overlay + skills
 * index to the first user message inside the `[Assistant Rules]` /
 * `[User Request]` wrapper.
 *
 * Bridge, AcpSkillManager, team-guide, and initStorage are mocked so
 * the test exercises ONLY the composition logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock state for AcpSkillManager so factories can reference it.
const { skillsState } = vi.hoisted(() => ({
  skillsState: {
    hasAny: false,
    index: [] as Array<{ name: string; description: string; source: string }>,
  },
}));

// Default: bridge returns empty constitution + null overlay (no rules block).
vi.mock('@process/bridge/constitutionBridge', () => ({
  readConstitutionWithOverlay: vi.fn().mockReturnValue({ constitution: '', overlay: null }),
}));

vi.mock('@process/task/AcpSkillManager', () => {
  return {
    AcpSkillManager: {
      getInstance: vi.fn(() => ({
        discoverSkills: vi.fn().mockResolvedValue(undefined),
        hasAnySkills: () => skillsState.hasAny,
        getSkillsIndex: () => skillsState.index,
      })),
    },
    buildSkillsIndexText: (skills: Array<{ name: string }>) =>
      `[Skills Index]\n${skills.map((s) => `- ${s.name}`).join('\n')}`,
  };
});

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/mock/skills',
  getBuiltinSkillsCopyDir: () => '/mock/builtin-skills',
  loadSkillsContent: vi.fn().mockResolvedValue(''),
}));

// Pin the SkillLibrary singleton to an empty list so `libraryIsNonEmpty()`
// returns false. The function reads a process-global singleton (agentUtils.ts:190)
// that a sibling test file in the same Vitest run can populate, which would inject
// the [Skills Location] block and wrap the content the "no skills" cases expect
// raw. Matches the guard already in agentUtilsWorkflow.test.ts.
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

import { readConstitutionWithOverlay } from '@process/bridge/constitutionBridge';
import { prepareFirstMessageWithSkillsIndex } from '@process/task/agentUtils';

const mockBridge = vi.mocked(readConstitutionWithOverlay);

describe('prepareFirstMessageWithSkillsIndex - Constitution wiring', () => {
  beforeEach(() => {
    mockBridge.mockReset();
    skillsState.hasAny = false;
    skillsState.index = [];
  });

  it('returns original content (no [Assistant Rules] wrapper) when no Constitution and no skills/rules', async () => {
    mockBridge.mockReturnValue({ constitution: '', overlay: null });

    const original = 'hello agent';
    const result = await prepareFirstMessageWithSkillsIndex(original, {});

    expect(result.content).toBe(original);
    expect(result.loadedSkills).toEqual([]);
  });

  it('wraps with [Assistant Rules] containing the Constitution body when present and no skills', async () => {
    const constitution = 'TEST_CONSTITUTION_BODY';
    mockBridge.mockReturnValue({ constitution, overlay: null });

    const original = 'do the thing';
    const result = await prepareFirstMessageWithSkillsIndex(original, {});

    expect(result.content).toBe(
      `[Assistant Rules - You MUST follow these instructions]\n${constitution}\n\n[User Request]\n${original}`
    );
    // Constitution-only ⇒ no skills loaded.
    expect(result.loadedSkills).toEqual([]);
  });

  it('joins Constitution + overlay with the \\n\\n---\\n\\n separator', async () => {
    mockBridge.mockReturnValue({ constitution: 'C', overlay: 'OVERLAY' });

    const original = 'go';
    const result = await prepareFirstMessageWithSkillsIndex(original, {
      presetAssistantId: 'spark',
    });

    // Composer order: Constitution + \n\n---\n\n + Overlay
    const expectedBody = 'C\n\n---\n\nOVERLAY';
    expect(result.content).toBe(
      `[Assistant Rules - You MUST follow these instructions]\n${expectedBody}\n\n[User Request]\n${original}`
    );
    expect(mockBridge).toHaveBeenCalledWith('spark');
  });

  it('preserves existing rules/skills text when no Constitution is configured', async () => {
    // No Constitution at all - but presetContext + skills are still present
    // and must appear in the wrapper.
    mockBridge.mockReturnValue({ constitution: '', overlay: null });
    skillsState.hasAny = true;
    skillsState.index = [{ name: 'unit-test-skill', description: 'd', source: 'builtin' }];

    const original = 'kick the tires';
    const result = await prepareFirstMessageWithSkillsIndex(original, {
      presetContext: 'PRESET_RULES_BODY',
      enabledSkills: ['unit-test-skill'],
    });

    expect(result.content).toContain('[Assistant Rules - You MUST follow these instructions]');
    expect(result.content).toContain('PRESET_RULES_BODY');
    expect(result.content).toContain('unit-test-skill');
    expect(result.content).toContain(`[User Request]\n${original}`);
    expect(result.loadedSkills).toEqual(skillsState.index);
  });
});
