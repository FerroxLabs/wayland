/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for buildTurnSkillContext - the per-turn skill auto-load helper
 * that proactively ranks the full skill library (BM25) against the current
 * user message, builds a top-5 advert, and inline-injects the single
 * high-confidence winner's body.
 *
 * The real SkillRetriever (BM25) is used; only SkillLibrary I/O is mocked so
 * the ranking + auto-load thresholds are exercised end-to-end.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

const { libState } = vi.hoisted(() => ({
  libState: {
    entries: [] as SkillIndexEntry[],
    bodies: {} as Record<string, string>,
  },
}));

// Mock SkillLibrary to serve our fixtures + bodies (no disk, no electron paths).
vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: {
    getInstance: () => ({
      list: vi.fn(async () => libState.entries),
      loadBody: vi.fn(async (name: string) => libState.bodies[name] ?? null),
    }),
  },
}));

// Keep heavy transitive imports cheap/inert.
vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/mock/skills',
  getBuiltinSkillsCopyDir: () => '/mock/builtin-skills',
  loadSkillsContent: vi.fn().mockResolvedValue(''),
}));
vi.mock('@process/team/prompts/teamGuidePrompt.ts', () => ({
  getTeamGuidePrompt: vi.fn(() => 'TEAM_GUIDE'),
}));
vi.mock('@process/team/prompts/teamGuideAssistant.ts', () => ({
  resolveLeaderAssistantLabel: vi.fn().mockResolvedValue('Leader'),
}));

import { buildTurnSkillContext } from '@process/task/agentUtils';

const entry = (overrides: Partial<SkillIndexEntry> & { name: string }): SkillIndexEntry => {
  const { metadata, ...rest } = overrides;
  return {
    description: '',
    type: 'skill',
    source: 'wayland-library',
    path: `bodies/${overrides.name}.md`,
    ...rest,
    metadata: { tags: [], category: 'dev', ...metadata },
  };
};

const FIXTURES: SkillIndexEntry[] = [
  entry({
    name: 'stripe-webhook-signing',
    description: 'Verify Stripe webhook signature payloads and handle signing secrets',
    metadata: { tags: ['stripe', 'webhook', 'signature', 'verification'], category: 'payments' },
  }),
  entry({
    name: 'react-component',
    description: 'Generate a React functional component',
    metadata: { tags: ['react', 'frontend'], category: 'frontend' },
  }),
  entry({
    name: 'kube-deploy',
    description: 'Deploy an application to a Kubernetes cluster',
    metadata: { tags: ['kubernetes', 'devops'], category: 'devops' },
  }),
  entry({
    name: 'sql-query',
    description: 'Write optimized SQL queries',
    metadata: { tags: ['sql', 'database'], category: 'database' },
  }),
  entry({
    name: 'git-rebase',
    description: 'Recover from a botched git rebase',
    metadata: { tags: ['git', 'version-control'], category: 'software-engineering' },
  }),
];

describe('buildTurnSkillContext', () => {
  beforeEach(() => {
    libState.entries = FIXTURES;
    libState.bodies = {
      'stripe-webhook-signing': '# Stripe Webhook Signing\nUse the signing secret to verify the signature header.',
    };
  });

  it('auto-loads the single high-confidence winner and excludes it from the advert', async () => {
    const ctx = await buildTurnSkillContext('how do I verify a stripe webhook signature');
    expect(ctx.autoLoaded.map((s) => s.name)).toEqual(['stripe-webhook-signing']);
    // Body is injected inline...
    expect(ctx.advert).toContain('[Auto-loaded skill: stripe-webhook-signing]');
    expect(ctx.advert).toContain('verify the signature header');
    // ...and the winner is NOT repeated in the "relevant skills" advert list.
    const advertListPart = ctx.advert.split('[Auto-loaded skill:')[0];
    expect(advertListPart).not.toContain('- stripe-webhook-signing:');
  });

  it('returns empty for a too-short query', async () => {
    const ctx = await buildTurnSkillContext('hi');
    expect(ctx).toEqual({ advert: '', autoLoaded: [] });
  });

  it('returns empty when nothing in the library matches', async () => {
    const ctx = await buildTurnSkillContext('zzzzz qqqqq xxxxx nonsense gibberish');
    expect(ctx.autoLoaded).toEqual([]);
    expect(ctx.advert).toBe('');
  });

  it('excludes always-on skills from the advert and from auto-load', async () => {
    const ctx = await buildTurnSkillContext('how do I verify a stripe webhook signature', {
      alwaysOnNames: ['stripe-webhook-signing'],
    });
    // The winner is already in context → not auto-loaded, not advertised.
    expect(ctx.autoLoaded).toEqual([]);
    expect(ctx.advert).not.toContain('stripe-webhook-signing');
  });

  it('caps an oversized auto-loaded body', async () => {
    libState.bodies = { 'stripe-webhook-signing': 'x'.repeat(5000) };
    const ctx = await buildTurnSkillContext('verify stripe webhook signature payload');
    expect(ctx.advert).toContain('…[truncated]');
    // Body slice (3000) + markers, well under the raw 5000.
    expect(ctx.advert.length).toBeLessThan(3600);
  });
});
