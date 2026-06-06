/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W3c - Pure-function tests for the deterministic roster suggester.
 *
 * No mocks, no I/O. Asserts:
 *   - Keyword-overlap scoring picks the right leader + teammates
 *   - Determinism: equal scores fall back to input order
 *   - Zero-match fallback sorts by name length ascending
 *   - targetSize clamps to [2, min(6, pool)] with default 5
 *   - Empty pool returns an empty result
 *   - Backend resolution uses recommendBackend
 */

import { describe, expect, it } from 'vitest';
import { suggestRoster, type SuggestSpecialist } from '@process/team/suggestRoster';

const specs: SuggestSpecialist[] = [
  { id: 'ext-launch', name: 'Launch Strategist', description: 'Plans book launches and funnels.', agentType: 'gemini' },
  { id: 'ext-copy', name: 'Copy', description: 'Writes ad copy and emails.', agentType: 'claude' },
  { id: 'ext-analyst', name: 'Funnel Analyst', description: 'Analyzes paid funnel performance.', agentType: 'codex' },
  { id: 'ext-design', name: 'Designer', description: 'Visual design and book cover work.', agentType: 'unknown-backend' },
  { id: 'ext-pm', name: 'Project Manager', description: 'Tracks deadlines and sprints.', agentType: 'claude' },
  { id: 'ext-research', name: 'Researcher', description: 'Audience and market research.', agentType: 'gemini' },
  { id: 'ext-coach', name: 'Coach', description: 'Stays generic and helps with whatever.' },
];

describe('suggestRoster', () => {
  it('returns leader + teammates when goalText has matching tokens', () => {
    const result = suggestRoster({
      goalText: "We're launching a paid book funnel and need a small team to ship it in two weeks.",
      specialists: specs,
      detectedBackends: ['claude', 'gemini', 'codex'],
      targetSize: 5,
    });

    expect(result.fellBackToDefaults).toBe(false);
    expect(result.leader).not.toBeNull();
    expect(result.teammates).toHaveLength(4);
    // Launch Strategist scores at least on "launching" → "launch" via substring,
    // plus "book", "funnel" - should beat Coach (zero matches).
    expect(result.leader!.score).toBeGreaterThan(0);
    // Coach has zero matches so should be displaced.
    const ids = [result.leader!.specialistId, ...result.teammates.map((t) => t.specialistId)];
    expect(ids).not.toContain('ext-coach');
  });

  it('preserves input order when scores tie (stable sort)', () => {
    const tied: SuggestSpecialist[] = [
      { id: 'first', name: 'First', description: 'alpha' },
      { id: 'second', name: 'Second', description: 'alpha' },
      { id: 'third', name: 'Third', description: 'alpha' },
    ];
    const result = suggestRoster({
      goalText: 'alpha',
      specialists: tied,
      detectedBackends: [],
      targetSize: 3,
    });
    expect(result.leader!.specialistId).toBe('first');
    expect(result.teammates.map((t) => t.specialistId)).toEqual(['second', 'third']);
    expect(result.fellBackToDefaults).toBe(false);
  });

  it('falls back to name-length sort when zero keyword matches', () => {
    const result = suggestRoster({
      goalText: 'xyzzyplugh nonexistentword',
      specialists: specs,
      detectedBackends: ['claude'],
      targetSize: 5,
    });
    expect(result.fellBackToDefaults).toBe(true);
    // Coach (5 chars) and Copy (4 chars) are shortest - leader should be Copy.
    expect(result.leader!.specialistId).toBe('ext-copy');
    // Score 0 for everyone in fallback mode.
    expect(result.leader!.score).toBe(0);
  });

  it('clamps targetSize to [2, min(6, specialists.length)]', () => {
    const small = specs.slice(0, 3);
    const tooLarge = suggestRoster({
      goalText: 'paid book',
      specialists: small,
      detectedBackends: [],
      targetSize: 100,
    });
    // 1 leader + 2 teammates = 3 total (full pool)
    expect(1 + tooLarge.teammates.length).toBe(3);

    const tooSmall = suggestRoster({
      goalText: 'paid book',
      specialists: small,
      detectedBackends: [],
      targetSize: 0,
    });
    // Min 2 → 1 leader + 1 teammate
    expect(1 + tooSmall.teammates.length).toBe(2);
  });

  it('caps total at 6 even when targetSize requests more', () => {
    const ten: SuggestSpecialist[] = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      name: `Spec${i}`,
      description: 'work',
    }));
    const result = suggestRoster({
      goalText: 'work',
      specialists: ten,
      detectedBackends: [],
      targetSize: 9,
    });
    expect(1 + result.teammates.length).toBe(6);
  });

  it('uses default targetSize of 5 when omitted', () => {
    const result = suggestRoster({
      goalText: 'paid book funnel launch',
      specialists: specs,
      detectedBackends: [],
    });
    expect(1 + result.teammates.length).toBe(5);
  });

  it('returns an empty result when specialists list is empty', () => {
    const result = suggestRoster({
      goalText: 'anything',
      specialists: [],
      detectedBackends: ['claude'],
    });
    expect(result.leader).toBeNull();
    expect(result.teammates).toEqual([]);
  });

  it('uses recommendBackend; falls back to wayland-core when agentType not detected', () => {
    const result = suggestRoster({
      goalText: 'design book cover visual',
      specialists: specs,
      detectedBackends: ['claude'], // gemini/codex/unknown-backend NOT detected
      targetSize: 5,
    });
    // Designer's agentType is 'unknown-backend' - should fall back to wayland-core
    const designer = [result.leader, ...result.teammates].find((e) => e?.specialistId === 'ext-design');
    expect(designer).toBeDefined();
    expect(designer!.backend).toBe('wayland-core');
  });

  it('uses detected backend when agentType matches available pool', () => {
    const result = suggestRoster({
      goalText: 'copy ad email',
      specialists: specs,
      detectedBackends: ['claude'],
      targetSize: 5,
    });
    const copy = [result.leader, ...result.teammates].find((e) => e?.specialistId === 'ext-copy');
    expect(copy).toBeDefined();
    expect(copy!.backend).toBe('claude');
  });

  it('handles specialists with undefined agentType (defaults to wayland-core)', () => {
    const result = suggestRoster({
      goalText: 'whatever generic',
      specialists: [{ id: 'solo', name: 'Solo', description: 'whatever generic' }],
      detectedBackends: ['claude', 'gemini'],
      targetSize: 2,
    });
    expect(result.leader!.specialistId).toBe('solo');
    expect(result.leader!.backend).toBe('wayland-core');
  });

  it('filters stopwords from the goal so common words do not dominate', () => {
    // "I want to build a team" - every word is a stopword. Should fall back.
    const result = suggestRoster({
      goalText: 'I want to build a team',
      specialists: specs,
      detectedBackends: [],
      targetSize: 5,
    });
    expect(result.fellBackToDefaults).toBe(true);
  });
});
