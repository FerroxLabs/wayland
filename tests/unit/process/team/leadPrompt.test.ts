import { describe, expect, it } from 'vitest';
import { buildLeaderPrompt } from '@process/team/prompts/leadPrompt';

describe('buildLeaderPrompt', () => {
  it('asks the leader to propose teammates and recommended agent types before spawning', () => {
    const prompt = buildLeaderPrompt({
      teammates: [],
      tasks: [],
      unreadMessages: [],
      availableAgentTypes: [
        { type: 'claude', name: 'Claude Code' },
        { type: 'gemini', name: 'Gemini CLI' },
      ],
    });

    expect(prompt).toContain('reply in text with a staffing proposal');
    expect(prompt).toContain('one short sentence explaining why more teammates would help');
    expect(prompt).toContain('Present the proposed lineup as a table');
    expect(prompt).toContain('recommended agent type/backend');
    expect(prompt).toContain('Ask whether the user wants to create those teammates as proposed');
    expect(prompt).toContain(
      'they can also come back later during the project and ask you to replace or adjust any teammate'
    );
    expect(prompt).toContain('Do NOT call team_spawn_agent in that same turn');
    expect(prompt).toContain('Wait for explicit confirmation before using team_spawn_agent');
  });

  it('prevents immediate spawning when the teammate lineup is not finalized yet', () => {
    const prompt = buildLeaderPrompt({
      teammates: [],
      tasks: [],
      unreadMessages: [],
    });

    expect(prompt).not.toContain('call team_spawn_agent immediately, do NOT just reply in text');
    expect(prompt).toContain('respond with the proposal first instead of spawning immediately');
    expect(prompt).toContain('If the user asks to change a proposed teammate');
    expect(prompt).toContain("End your turn after the proposal and wait for the user's reply");
    expect(prompt).toContain('If the user later says they are unhappy with an existing teammate');
  });

  it('lists preset assistants (id + name + backend) and tells the leader how to spawn them', () => {
    const prompt = buildLeaderPrompt({
      teammates: [],
      availableAssistants: [
        { customAgentId: 'builtin-word-creator', name: 'Word Creator', backend: 'gemini' },
        { customAgentId: 'builtin-cowork', name: 'Cowork', backend: 'gemini' },
      ],
    });

    expect(prompt).toContain('## Available Preset Assistants for Spawning');
    expect(prompt).toContain('`builtin-word-creator` (Word Creator, backend: gemini)');
    expect(prompt).toContain('`builtin-cowork` (Cowork, backend: gemini)');
    expect(prompt).toContain('`custom_agent_id`');
  });

  it('keeps the catalog compact: does NOT inline per-preset descriptions or skills (#557 - moved behind team_describe_assistant)', () => {
    // The per-assistant description + skills were the largest slice of the leader's
    // static prompt and are re-billed every turn; they now live behind the on-demand
    // team_describe_assistant tool. Even if a caller passes extra fields, the catalog
    // must not render prose or a "skills:" line.
    const prompt = buildLeaderPrompt({
      teammates: [],
      availableAssistants: [
        { customAgentId: 'builtin-word-creator', name: 'Word Creator', backend: 'gemini' },
      ] as unknown as { customAgentId: string; name: string; backend: string }[],
    });

    expect(prompt).toContain('`builtin-word-creator` (Word Creator, backend: gemini)');
    expect(prompt).not.toMatch(/\n\s*skills:/);
    expect(prompt).toContain('`team_describe_assistant`'); // where the leader loads full detail
  });

  it('points the leader at team_describe_assistant for ambiguous preset matches', () => {
    const prompt = buildLeaderPrompt({
      teammates: [],
      availableAssistants: [
        { customAgentId: 'builtin-word-creator', name: 'Word Creator', backend: 'gemini' },
        { customAgentId: 'builtin-cowork', name: 'Cowork', backend: 'gemini' },
      ],
    });

    expect(prompt).toContain('### How to pick a preset');
    expect(prompt).toContain('`team_describe_assistant`');
    expect(prompt).toContain('example tasks');
  });

  it('omits the preset assistants section when no presets are enabled', () => {
    const prompt = buildLeaderPrompt({ teammates: [] });
    expect(prompt).not.toContain('Available Preset Assistants for Spawning');
  });

  it('keeps greeting replies friendly and avoids staffing details before a real task appears', () => {
    const prompt = buildLeaderPrompt({
      teammates: [],
      tasks: [],
      unreadMessages: [],
    });

    expect(prompt).toContain('If the user greets you, starts a new chat, or asks what you can do');
    expect(prompt).toContain('briefly introduce yourself as the team leader');
    expect(prompt).toContain('invite the user to share their goal');
    expect(prompt).toContain('Do NOT mention teammate proposals, recommended agent types, or confirmation workflow');
  });
});
