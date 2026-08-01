/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for the Concierge self-knowledge wiring in agentUtils:
 * - `isCapabilityIntent` intent detection (truth table)
 * - `resolveCapabilitiesManifest` gating (Concierge always; others intent-only)
 * - `buildTurnSkillContext` surfaces the live manifest on capability turns for
 *   non-Concierge assistants, and skips it for Concierge (which carries it in
 *   its system prompt) - even when the turn is too short to trip BM25.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

const { libState, manifestState, configState } = vi.hoisted(() => ({
  libState: { entries: [] as SkillIndexEntry[], bodies: {} as Record<string, string> },
  manifestState: {
    value: 'MANIFEST_BODY',
    calls: 0,
    throws: false,
    options: [] as Array<Record<string, unknown> | undefined>,
  },
  // `concierge.capabilityInjection` kill-switch: undefined => default ON.
  configState: { capabilityInjection: undefined as boolean | undefined },
}));

vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: {
    getInstance: () => ({
      list: vi.fn(async () => libState.entries),
      loadBody: vi.fn(async (name: string) => libState.bodies[name] ?? null),
    }),
  },
}));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/mock/skills',
  getBuiltinSkillsCopyDir: () => '/mock/builtin-skills',
  loadSkillsContent: vi.fn().mockResolvedValue(''),
  ProcessConfig: {
    get: vi.fn(async (key: string) =>
      key === 'concierge.capabilityInjection' ? configState.capabilityInjection : undefined
    ),
  },
}));
vi.mock('@process/team/prompts/teamGuidePrompt.ts', () => ({
  getTeamGuidePrompt: vi.fn(() => 'TEAM_GUIDE'),
}));
vi.mock('@process/team/prompts/teamGuideAssistant.ts', () => ({
  resolveLeaderAssistantLabel: vi.fn().mockResolvedValue('Leader'),
}));

// The live capabilities manifest builder - mocked so we control output + count.
vi.mock('@process/services/capabilities/CapabilitiesManifest', () => ({
  buildCapabilitiesManifest: vi.fn(async (options?: Record<string, unknown>) => {
    manifestState.calls += 1;
    manifestState.options.push(options);
    if (manifestState.throws) throw new Error('boom');
    return manifestState.value;
  }),
}));

import {
  isCapabilityIntent,
  resolveCapabilitiesManifest,
  buildTurnSkillContext,
  BUILTIN_CONCIERGE_ASSISTANT_ID,
  BUILTIN_COWORK_ASSISTANT_ID,
} from '@process/task/agentUtils';

beforeEach(() => {
  libState.entries = [];
  libState.bodies = {};
  manifestState.value = 'MANIFEST_BODY';
  manifestState.calls = 0;
  manifestState.throws = false;
  manifestState.options = [];
  configState.capabilityInjection = undefined;
});

describe('isCapabilityIntent', () => {
  it.each([
    'what can you do?',
    'what can Wayland do',
    'tell me what you can do',
    'what do you do',
    'what are your features?',
    "what's possible here",
    'show me everything',
    'list your tools',
    'list your workflows', // listing branch extended to workflows/assistants/teams
    'how do I connect a provider?',
    'how do i set up a workflow',
    'how do I set up a scheduled task',
    'how do I add an MCP server',
    'can you add an MCP server for me',
    'can wayland connect to a provider',
    'configure flux for me',
  ])('is true for capability phrasing: %s', (text) => {
    expect(isCapabilityIntent(text)).toBe(true);
  });

  it.each([
    '',
    '   ',
    'write me a poem about the sea',
    'hello there',
    'fix the null pointer in my parser',
    'how do I write a recursive fibonacci', // generic "how do I" without a Wayland noun
    'how do I create a React component', // generic verb + non-Wayland noun
    'build my project',
    'install the npm package',
    'configure eslint',
    'switch git branches',
    'can you build a function for me',
    'summarize this article',
    // Confirmed false-positive corpus from the Phase-2a audit: bare generic nouns
    // (model/team/skill/automation) and broad verbs (build/create/add) must NOT
    // trigger the manifest on unrelated chat.
    'can you build a model of the solar system for my kid',
    'build a team roster for my soccer league',
    'create a data model for my database',
    'add a skill to my resume',
    'import my financial model spreadsheet',
    'how do I build a model airplane',
    'launch the marketing campaign team',
  ])('is false for non-capability phrasing: %s', (text) => {
    expect(isCapabilityIntent(text)).toBe(false);
  });
});

describe('resolveCapabilitiesManifest', () => {
  it('always builds for the Concierge assistant regardless of intent', async () => {
    const out = await resolveCapabilitiesManifest({
      presetAssistantId: BUILTIN_CONCIERGE_ASSISTANT_ID,
      userText: 'write me a poem',
    });
    expect(out).toBe('MANIFEST_BODY');
  });

  it('builds for any assistant when the turn is a capability intent', async () => {
    const out = await resolveCapabilitiesManifest({
      presetAssistantId: 'builtin-word-creator',
      userText: 'how do I connect a provider?',
    });
    expect(out).toBe('MANIFEST_BODY');
  });

  it('always builds for Cowork and requests Office authoring readiness', async () => {
    const out = await resolveCapabilitiesManifest({
      presetAssistantId: BUILTIN_COWORK_ASSISTANT_ID,
      userText: 'write me a poem',
      agentKey: 'wcore',
    });

    expect(out).toBe('MANIFEST_BODY');
    expect(manifestState.options).toEqual([{ agentKey: 'wcore', includeOfficeAuthoring: true }]);
  });

  it('returns undefined for a non-Concierge assistant on a non-capability turn', async () => {
    const out = await resolveCapabilitiesManifest({
      presetAssistantId: 'builtin-word-creator',
      userText: 'write me a poem',
    });
    expect(out).toBeUndefined();
    expect(manifestState.calls).toBe(0); // never even built
  });

  it('returns undefined (never throws) when the builder fails', async () => {
    manifestState.throws = true;
    const out = await resolveCapabilitiesManifest({ presetAssistantId: BUILTIN_CONCIERGE_ASSISTANT_ID });
    expect(out).toBeUndefined();
  });

  it('respects the concierge.capabilityInjection kill-switch (off disables even Concierge)', async () => {
    configState.capabilityInjection = false;
    const out = await resolveCapabilitiesManifest({ presetAssistantId: BUILTIN_CONCIERGE_ASSISTANT_ID });
    expect(out).toBeUndefined();
    expect(manifestState.calls).toBe(0); // never even built
  });

  it('builds when the kill-switch is explicitly enabled', async () => {
    configState.capabilityInjection = true;
    const out = await resolveCapabilitiesManifest({ presetAssistantId: BUILTIN_CONCIERGE_ASSISTANT_ID });
    expect(out).toBe('MANIFEST_BODY');
  });
});

describe('buildTurnSkillContext capability manifest', () => {
  it('surfaces the manifest on a capability turn for a non-Concierge assistant, even with no skill hits', async () => {
    const ctx = await buildTurnSkillContext('what can you do?', {
      assistantId: 'builtin-word-creator',
      agentKey: 'wcore',
    });
    expect(ctx.advert).toContain('Wayland capabilities (live)');
    expect(ctx.advert).toContain('MANIFEST_BODY');
  });

  it('skips the manifest for the Concierge assistant (it rides the system prompt)', async () => {
    const ctx = await buildTurnSkillContext('what can you do?', {
      assistantId: BUILTIN_CONCIERGE_ASSISTANT_ID,
      agentKey: 'wcore',
    });
    expect(ctx.advert).not.toContain('MANIFEST_BODY');
    expect(manifestState.calls).toBe(0);
  });

  it('skips the turn advert for Cowork because the manifest rides its system prompt', async () => {
    const ctx = await buildTurnSkillContext('what can you do?', {
      assistantId: BUILTIN_COWORK_ASSISTANT_ID,
      agentKey: 'wcore',
    });
    expect(ctx.advert).not.toContain('MANIFEST_BODY');
    expect(manifestState.calls).toBe(0);
  });

  it('does not surface the manifest on a non-capability turn', async () => {
    const ctx = await buildTurnSkillContext('write me a poem about the sea', {
      assistantId: 'builtin-word-creator',
      agentKey: 'wcore',
    });
    expect(ctx.advert).not.toContain('MANIFEST_BODY');
  });

  it('does not surface the manifest when the kill-switch is off, even on a capability turn', async () => {
    configState.capabilityInjection = false;
    const ctx = await buildTurnSkillContext('what can you do?', {
      assistantId: 'builtin-word-creator',
      agentKey: 'wcore',
    });
    expect(ctx.advert).not.toContain('MANIFEST_BODY');
  });
});
