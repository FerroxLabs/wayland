/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { SuggestionEngine } from '@process/services/kickoff/SuggestionEngine';
import type { KickoffSignals } from '@process/services/kickoff/types';
import { dateKey, hashSeed, seededShuffle } from '@process/services/kickoff/seededShuffle';

// ----------------------------------------------------------------------------
// Fixtures: a representative assistant record matching the bundle shape
// (after Phase 1 wiring). Mirrors how ExtensionRegistry.getAssistants()
// would return it. Authoring it inline keeps the engine test pure-unit -
// no DB, no extension loader, no IPC.
// ----------------------------------------------------------------------------

const FIXTURE_ASSISTANT = {
  id: 'helm',
  name: 'Coach',
  kickoffs: [
    {
      id: 'standing-recap',
      text: 'Your team wrapped this morning. Want the recap?',
      prefill: 'Walk me through what shipped + the one decision waiting.',
      scenario: 'post-fire-ritual' as const,
      requiresRitualOutput: true,
    },
    {
      id: 'morning-cold',
      text: 'Want me to surface the decision you have been carrying?',
      prefill: 'Surface the decision.',
      scenario: 'cold-start' as const,
      timeBucket: 'morning' as const,
    },
    {
      id: 'morning-cold-2',
      text: 'Want me to prep your 1:1 agendas?',
      prefill: 'Prep 1:1 agendas.',
      scenario: 'cold-start' as const,
      timeBucket: 'morning' as const,
    },
    {
      id: 'afternoon-cold',
      text: 'Want me to put both sides of the tradeoff on the table?',
      prefill: 'Put both sides on the table.',
      scenario: 'cold-start' as const,
      timeBucket: 'afternoon' as const,
    },
    {
      id: 'continuation',
      text: 'Picking up from your last session?',
      prefill: 'Continue where we left off.',
      scenario: 'continuation-friendly' as const,
    },
    {
      id: 'beginner',
      text: 'First time? I will show you 3 decisions in 10 minutes.',
      prefill: 'Show me 3 starter decisions.',
      scenario: 'cold-start' as const,
      timeBucket: 'morning' as const,
      beginnerSafe: true,
    },
  ],
};

const finderFor = (record: Record<string, unknown> | null) => () => record;

function signalsBase(now: number = new Date('2026-05-23T09:00:00').getTime()): KickoffSignals {
  return {
    now,
    timeBucket: 'morning',
    installUuid: 'install-A-FFFF',
    assistantRecentConversations: [],
    hasStandingRitualFiredRecently: false,
  };
}

function makeEngine(signals: KickoffSignals, record: Record<string, unknown> | null = FIXTURE_ASSISTANT) {
  const collector = { collect: vi.fn().mockResolvedValue(signals) } as unknown as ConstructorParameters<
    typeof SuggestionEngine
  >[0];
  return new SuggestionEngine(collector, finderFor(record));
}

describe('SuggestionEngine - cascade', () => {
  it('returns notRendered=unknown-assistant when the registry has no match', async () => {
    const engine = makeEngine(signalsBase(), null);
    const result = await engine.suggest('ghost-assistant');
    expect(result).toEqual({ notRendered: 'unknown-assistant' });
  });

  it('returns notRendered=no-kickoffs-defined when the assistant ships an empty kickoffs array', async () => {
    const engine = makeEngine(signalsBase(), { id: 'helm', kickoffs: [] });
    const result = await engine.suggest('helm');
    expect(result).toEqual({ notRendered: 'no-kickoffs-defined' });
  });

  it('cold install with no signals falls through to level 3 cold-start in the matching time bucket', async () => {
    const engine = makeEngine(signalsBase());
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error(`expected suggestion, got ${result.notRendered}`);
    expect(result.cascadeLevel).toBe(3);
    expect(result.cascadeReason).toBe('cold-start-library');
    // Primary must be one of the two morning cold-start (non-beginner) entries.
    expect(['morning-cold', 'morning-cold-2']).toContain(result.kickoffId);
  });

  it('thread quality gate: 5 messages over 3 minutes with non-auto subject → level 2', async () => {
    const signals = signalsBase();
    signals.assistantRecentConversations = [
      {
        id: 'c1',
        modifyTime: signals.now,
        messageCount: 5,
        durationMs: 3 * 60 * 1000,
        subject: 'Decision: shut down Q3 pilot or extend?',
        isAutoTitled: false,
      },
    ];
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(2);
    expect(result.kickoffId).toBe('continuation');
  });

  it('thread quality gate fails on short thread → falls through to level 3', async () => {
    const signals = signalsBase();
    signals.assistantRecentConversations = [
      {
        id: 'c1',
        modifyTime: signals.now,
        messageCount: 2,
        durationMs: 30 * 1000,
        subject: 'Quick hello',
        isAutoTitled: false,
      },
    ];
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(3);
  });

  it('thread quality gate fails on auto-titled subject → falls through to level 3', async () => {
    const signals = signalsBase();
    signals.assistantRecentConversations = [
      {
        id: 'c1',
        modifyTime: signals.now,
        messageCount: 10,
        durationMs: 10 * 60 * 1000,
        subject: 'New Conversation',
        isAutoTitled: true,
      },
    ];
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(3);
  });

  it('Standing ritual fired recently → level 1 with the post-fire-ritual gated card', async () => {
    const signals = signalsBase();
    signals.hasStandingRitualFiredRecently = true;
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(1);
    expect(result.cascadeReason).toBe('standing-ritual-fired');
    expect(result.kickoffId).toBe('standing-recap');
  });

  it('Standing ritual fired but no requiresRitualOutput card defined → falls through to level 3', async () => {
    const signals = signalsBase();
    signals.hasStandingRitualFiredRecently = true;
    const record = {
      ...FIXTURE_ASSISTANT,
      // Drop the standing-recap so level 1 has no candidate.
      kickoffs: FIXTURE_ASSISTANT.kickoffs.filter((k) => k.scenario !== 'post-fire-ritual'),
    };
    const engine = makeEngine(signals, record);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(3);
  });

  it('time bucket filtering: afternoon signal returns the afternoon cold-start, not morning ones', async () => {
    const signals = signalsBase(new Date('2026-05-23T15:00:00').getTime());
    signals.timeBucket = 'afternoon';
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.kickoffId).toBe('afternoon-cold');
  });

  it('only beginner-safe entries available → level 4 beginner-touch fallback', async () => {
    const signals = signalsBase();
    signals.timeBucket = 'evening'; // no evening cold-starts in fixture
    // Strip all non-beginner cards so level 3 has nothing.
    const record = {
      ...FIXTURE_ASSISTANT,
      kickoffs: FIXTURE_ASSISTANT.kickoffs.filter((k) => k.beginnerSafe === true),
    };
    const engine = makeEngine(signals, record);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(4);
    expect(result.cascadeReason).toBe('beginner-touch-fallback');
    expect(result.kickoffId).toBe('beginner');
  });

  it('all levels miss → notRendered=all-levels-missed', async () => {
    const signals = signalsBase();
    signals.timeBucket = 'evening';
    const record = { id: 'helm', kickoffs: [FIXTURE_ASSISTANT.kickoffs[3]] }; // afternoon-cold only
    const engine = makeEngine(signals, record);
    const result = await engine.suggest('helm');
    expect(result).toEqual({ notRendered: 'all-levels-missed' });
  });

  it('alternates list excludes the primary and is capped at 2 entries from the same scenario', async () => {
    const engine = makeEngine(signalsBase());
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.alternates.length).toBeLessThanOrEqual(2);
    expect(result.alternates.find((a) => a.kickoffId === result.kickoffId)).toBeUndefined();
  });
});

describe('SuggestionEngine - deterministic shuffle', () => {
  // v0.4.7.1 (TEST-4) - explicit seed assertion. Computes the expected
  // seeded-shuffle primary and verifies the engine's chosen primary matches.
  // Proves the seed expression `hash(installUuid:assistantId:dateKey)` is
  // actually being used, not just that two in-process calls return the
  // same value (the previous shape would pass even if hashSeed returned
  // Math.random() cached in a closure).
  it('engine primary matches the explicit seeded-shuffle of the morning cold-start pool', async () => {
    const now = new Date('2026-05-23T09:00:00').getTime();
    const signals = signalsBase(now);
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    const morningColdStarts = FIXTURE_ASSISTANT.kickoffs.filter(
      (k) => k.scenario === 'cold-start' && k.beginnerSafe !== true && (!k.timeBucket || k.timeBucket === 'morning')
    );
    const expectedSeed = hashSeed(`${signals.installUuid}:helm:${dateKey(now)}`);
    const expectedPrimary = seededShuffle(morningColdStarts, expectedSeed)[0]!;
    expect(result.kickoffId).toBe(expectedPrimary.id);
  });

  it('storage round-trip: two engines on the same installUuid + dateKey pick the same primary', async () => {
    // Proves the seed is reconstructed from the same inputs across engine
    // instantiations (i.e. the seed expression is actually re-evaluated, not
    // memoized in a way that hides a regression).
    const sigA = signalsBase();
    const sigB = signalsBase();
    const engineA = makeEngine(sigA);
    const engineB = makeEngine(sigB);
    const a = await engineA.suggest('helm');
    const b = await engineB.suggest('helm');
    if ('notRendered' in a || 'notRendered' in b) throw new Error('expected suggestions');
    expect(a.kickoffId).toBe(b.kickoffId);
  });

  it('different installUuid → can produce a different primary (entropy verified)', async () => {
    const seen = new Set<string>();
    for (const uuid of ['install-A-FFFF', 'install-B-1111', 'install-C-9999', 'install-D-4242']) {
      const sig = signalsBase();
      sig.installUuid = uuid;
      const engine = makeEngine(sig);
      const result = await engine.suggest('helm');
      if ('notRendered' in result) throw new Error('expected suggestion');
      seen.add(result.kickoffId);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('same installUuid on different days → primaries can differ', async () => {
    const day1 = signalsBase(new Date('2026-05-23T09:00:00').getTime());
    const day2 = signalsBase(new Date('2026-06-15T09:00:00').getTime());
    const a = await makeEngine(day1).suggest('helm');
    const b = await makeEngine(day2).suggest('helm');
    if ('notRendered' in a || 'notRendered' in b) throw new Error('expected suggestions');
    // We don't require them to differ on every pair, but at minimum the
    // dateKey participates in the hash - assert by computing the shuffle
    // a third day from the same install and proving span > 1 across days.
    const day3 = signalsBase(new Date('2026-07-04T09:00:00').getTime());
    const c = await makeEngine(day3).suggest('helm');
    if ('notRendered' in c) throw new Error('expected suggestion');
    const ids = new Set([a.kickoffId, b.kickoffId, c.kickoffId]);
    expect(ids.size).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// E-M-6 - readKickoffArray malformed-entry filtering
// ============================================================================

describe('SuggestionEngine - readKickoffArray malformed-entry filter', () => {
  it('drops entries with empty id, invalid scenario, and missing fields; keeps the valid ones', async () => {
    const valid = {
      id: 'good-1',
      text: 'good text',
      prefill: 'good prefill',
      scenario: 'cold-start' as const,
      timeBucket: 'morning' as const,
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const record = {
      id: 'helm',
      kickoffs: [
        valid,
        // empty id → dropped
        { id: '', text: 't', prefill: 'p', scenario: 'cold-start' },
        // invalid scenario → dropped (with warn)
        { id: 'bad-scenario', text: 't', prefill: 'p', scenario: 'oops' },
        // missing prefill → dropped
        { id: 'no-prefill', text: 't', scenario: 'cold-start' },
        // null entry → dropped
        null,
        // non-object → dropped
        42,
      ],
    };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    // Only the valid one survives → it must be the chosen primary.
    expect(result.kickoffId).toBe('good-1');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid scenario "oops"'));
    warnSpy.mockRestore();
  });

  it('drops entries with invalid timeBucket but keeps the entry (warns)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const record = {
      id: 'helm',
      kickoffs: [
        {
          id: 'good-1',
          text: 'good text',
          prefill: 'good prefill',
          scenario: 'cold-start',
          timeBucket: 'gibberish',
        },
      ],
    };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggest('helm');
    // Bad timeBucket is dropped (treated as no bucket) so the entry stays
    // eligible for any bucket → present at Level 3.
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.kickoffId).toBe('good-1');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid timeBucket "gibberish"'));
    warnSpy.mockRestore();
  });
});

// ============================================================================
// E-L-2 - thread-quality boundary cases (exact-3 messages, exact-2-min duration)
// ============================================================================

describe('SuggestionEngine - thread quality boundaries', () => {
  it('exact boundary: messageCount=3 + durationMs=2*60*1000 → level 2 (inclusive)', async () => {
    const signals = signalsBase();
    signals.assistantRecentConversations = [
      {
        id: 'c1',
        modifyTime: signals.now,
        messageCount: 3,
        durationMs: 2 * 60 * 1000,
        subject: 'Decision: extend pilot?',
        isAutoTitled: false,
      },
    ];
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(2);
  });

  it('just-below boundary: messageCount=2 + durationMs=2*60*1000 → falls through to level 3', async () => {
    const signals = signalsBase();
    signals.assistantRecentConversations = [
      {
        id: 'c1',
        modifyTime: signals.now,
        messageCount: 2,
        durationMs: 2 * 60 * 1000,
        subject: 'Decision: extend pilot?',
        isAutoTitled: false,
      },
    ];
    const engine = makeEngine(signals);
    const result = await engine.suggest('helm');
    if ('notRendered' in result) throw new Error('expected suggestion');
    expect(result.cascadeLevel).toBe(3);
  });
});

// ============================================================================
// kickoffs-excluded sentinel
// ============================================================================

describe('SuggestionEngine - kickoffs-excluded opt-out sentinel', () => {
  it('returns notRendered=kickoffs-excluded when the assistant carries _kickoffsExcluded=true', async () => {
    const record = { id: 'helm', _kickoffsExcluded: true, kickoffs: FIXTURE_ASSISTANT.kickoffs };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggest('helm');
    expect(result).toEqual({ notRendered: 'kickoffs-excluded' });
  });
});

// ============================================================================
// #375 - suggestN: per-assistant suggested-prompts grid
// ============================================================================

describe('SuggestionEngine.suggestN - grid', () => {
  it('returns notRendered=unknown-assistant when the registry has no match', async () => {
    const engine = makeEngine(signalsBase(), null);
    const result = await engine.suggestN('ghost');
    expect(result).toEqual({ notRendered: 'unknown-assistant' });
  });

  it('returns notRendered=kickoffs-excluded for an opted-out assistant', async () => {
    const record = { id: 'helm', _kickoffsExcluded: true, kickoffs: FIXTURE_ASSISTANT.kickoffs };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggestN('helm');
    expect(result).toEqual({ notRendered: 'kickoffs-excluded' });
  });

  it('returns up to `max` kickoff-sourced items, never more than the data holds', async () => {
    const engine = makeEngine(signalsBase());
    const result = await engine.suggestN('helm', 4);
    if ('notRendered' in result) throw new Error(`expected items, got ${result.notRendered}`);
    expect(result.items).toHaveLength(4);
    expect(result.items.every((i) => i.source === 'kickoff')).toBe(true);
    expect(result.items.every((i) => i.kickoffId && i.text && i.prefill)).toBe(true);
  });

  it('clamps an over-large `max` to the data size (6 entries → 6 items)', async () => {
    const engine = makeEngine(signalsBase());
    const result = await engine.suggestN('helm', 99);
    if ('notRendered' in result) throw new Error('expected items');
    expect(result.items).toHaveLength(6);
  });

  it('ranks beginner-safe first, then current time-bucket matches', async () => {
    const engine = makeEngine(signalsBase()); // timeBucket: 'morning'
    const result = await engine.suggestN('helm', 6);
    if ('notRendered' in result) throw new Error('expected items');
    // The single beginnerSafe entry must lead.
    expect(result.items[0]!.kickoffId).toBe('beginner');
    // The two morning (non-beginner) entries must outrank the lone afternoon one.
    const ids = result.items.map((i) => i.kickoffId);
    expect(ids.indexOf('morning-cold')).toBeLessThan(ids.indexOf('afternoon-cold'));
    expect(ids.indexOf('morning-cold-2')).toBeLessThan(ids.indexOf('afternoon-cold'));
  });

  it('is deterministic for the same install + assistant + day', async () => {
    const engineA = makeEngine(signalsBase());
    const engineB = makeEngine(signalsBase());
    const a = await engineA.suggestN('helm', 6);
    const b = await engineB.suggestN('helm', 6);
    if ('notRendered' in a || 'notRendered' in b) throw new Error('expected items');
    expect(a.items.map((i) => i.kickoffId)).toEqual(b.items.map((i) => i.kickoffId));
  });

  it('falls back to the flat legacy prompts array when no kickoffs are defined', async () => {
    const record = { id: 'doc', kickoffs: [], prompts: ['Make a deck', 'Draft a memo', 'Make a deck'] };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggestN('doc', 6);
    if ('notRendered' in result) throw new Error('expected items');
    // De-duped, prompt-sourced, prefill mirrors text.
    expect(result.items).toEqual([
      { text: 'Make a deck', prefill: 'Make a deck', source: 'prompts' },
      { text: 'Draft a memo', prefill: 'Draft a memo', source: 'prompts' },
    ]);
  });

  it('falls back to promptsI18n for the requested locale (cowork-style preset)', async () => {
    const record = {
      id: 'cowork',
      promptsI18n: { 'en-US': ['Organize my files'], 'zh-CN': ['整理我的文件'] },
    };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggestN('cowork', 6, 'zh-CN');
    if ('notRendered' in result) throw new Error('expected items');
    expect(result.items).toEqual([{ text: '整理我的文件', prefill: '整理我的文件', source: 'prompts' }]);
  });

  it('falls back to en-US promptsI18n when the requested locale is absent', async () => {
    const record = { id: 'cowork', promptsI18n: { 'en-US': ['Organize my files'] } };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggestN('cowork', 6, 'fr-FR');
    if ('notRendered' in result) throw new Error('expected items');
    expect(result.items[0]!.text).toBe('Organize my files');
  });

  it('returns notRendered=no-kickoffs-defined when neither kickoffs nor prompts exist', async () => {
    const record = { id: 'empty', kickoffs: [] };
    const engine = makeEngine(signalsBase(), record);
    const result = await engine.suggestN('empty', 6);
    expect(result).toEqual({ notRendered: 'no-kickoffs-defined' });
  });
});
