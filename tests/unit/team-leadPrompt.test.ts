// tests/unit/team-leadPrompt.test.ts
//
// Guards the token-budget shape of the leader's preset-assistant catalog
// (Task 1b of the team token-bomb fix): the catalog embedded in the leader's
// static prompt must list only id + name + backend. The large per-assistant
// description and skills list are re-billed to the model on every leader turn,
// so they are moved behind the on-demand team_describe_assistant tool.
import { describe, it, expect } from 'vitest';

import { buildLeaderPrompt } from '@process/team/prompts/leadPrompt';

const DESCRIPTION =
  'A very long domain-specific description that would cost thousands of tokens if inlined per assistant on every single leader turn.';

const ASSISTANTS = [
  { customAgentId: 'word-creator', name: 'Word Creator', backend: 'gemini' },
  { customAgentId: 'builtin-research', name: 'Researcher', backend: 'claude' },
];

describe('buildLeaderPrompt — preset assistant catalog (token budget)', () => {
  it('lists id, name, and backend for each preset assistant', () => {
    const prompt = buildLeaderPrompt({ teammates: [], availableAssistants: ASSISTANTS });
    expect(prompt).toContain('`word-creator` (Word Creator, backend: gemini)');
    expect(prompt).toContain('`builtin-research` (Researcher, backend: claude)');
  });

  it('does NOT inline per-assistant descriptions or skills lists', () => {
    // Even if a caller were to pass extra fields, the rendered catalog must not
    // carry description prose or a "skills:" line — those bloat every turn.
    const withExtra = ASSISTANTS.map((a) => ({ ...a, description: DESCRIPTION, skills: ['a', 'b'] }));
    const prompt = buildLeaderPrompt({
      teammates: [],
      // Cast: the public type no longer accepts description/skills; this guards
      // against accidental re-introduction of inline rendering.
      availableAssistants: withExtra as unknown as typeof ASSISTANTS,
    });
    expect(prompt).not.toContain(DESCRIPTION);
    expect(prompt).not.toMatch(/\n\s*skills:/);
  });

  it('directs the leader to team_describe_assistant for full details', () => {
    const prompt = buildLeaderPrompt({ teammates: [], availableAssistants: ASSISTANTS });
    expect(prompt).toContain('team_describe_assistant');
  });

  it('omits the catalog section entirely when there are no preset assistants', () => {
    const prompt = buildLeaderPrompt({ teammates: [], availableAssistants: [] });
    expect(prompt).not.toContain('Available Preset Assistants for Spawning');
  });
});
