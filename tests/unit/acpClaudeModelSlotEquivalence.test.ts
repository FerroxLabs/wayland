/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #184 / model version skew - the in-chat model picker offers Wayland registry
 * catalog ids (claude-opus-4-8, live-fetched from the subscription) while the ACP
 * bridge's own catalog may advertise bare slots (opus/sonnet/haiku) OR an older
 * generation (claude-agent-acp@0.59.0 advertises claude-opus-4-6 /
 * claude-opus-4-6-1m, not 4-8). Claude Code selects models only at slot
 * granularity via ANTHROPIC_MODEL, so a same-slot confirmation must count as
 * exact — otherwise a valid pick fails as `unsupported_model`. But when the
 * provider advertises the requested id verbatim, confirmation must be exact so a
 * different same-slot generation is not silently accepted.
 */

import { describe, expect, it } from 'vitest';
import {
  canonicalClaudeSlot,
  claudeCatalogSupportsSlot,
  claudeModelIdsSelectSameModel,
} from '../../src/process/agent/acp/utils';

// Slot regime: SDK returns no model list, so Wayland advertises bare slots.
const SLOT_CATALOG = ['sonnet', 'opus', 'haiku'];
// cc-switch / settings.json spell the Sonnet slot as `default`.
const CC_SWITCH_CATALOG = ['default', 'opus', 'haiku'];
// The real claude-agent-acp@0.59.0 catalog: full ids, opus tops out at 4-6.
const BRIDGE_CATALOG = ['claude-sonnet-5', 'claude-opus-4-6', 'claude-opus-4-6-1m', 'claude-haiku-4-5-20251001'];
// A provider that DOES advertise the requested opus-4-8 alongside opus-4-1.
const EXACT_OFFERED_CATALOG = ['claude-opus-4-8', 'claude-opus-4-1', 'claude-sonnet-5'];

describe('canonicalClaudeSlot', () => {
  it('maps registry ids, slot aliases, and the default alias to a canonical slot', () => {
    expect(canonicalClaudeSlot('claude-opus-4-8')).toBe('opus');
    expect(canonicalClaudeSlot('claude-opus-4-6-1m')).toBe('opus');
    expect(canonicalClaudeSlot('opus')).toBe('opus');
    expect(canonicalClaudeSlot('claude-sonnet-5')).toBe('sonnet');
    expect(canonicalClaudeSlot('sonnet')).toBe('sonnet');
    expect(canonicalClaudeSlot('default')).toBe('sonnet'); // cc-switch Sonnet spelling
    expect(canonicalClaudeSlot('claude-haiku-4-5-20251001')).toBe('haiku');
  });

  it('returns undefined for non-Claude and empty ids', () => {
    expect(canonicalClaudeSlot('gpt-4o')).toBeUndefined();
    expect(canonicalClaudeSlot('')).toBeUndefined();
    expect(canonicalClaudeSlot(null)).toBeUndefined();
    expect(canonicalClaudeSlot(undefined)).toBeUndefined();
  });
});

describe('claudeCatalogSupportsSlot', () => {
  it('supports a registry id when its slot family is advertised (bare slots)', () => {
    expect(claudeCatalogSupportsSlot('claude-opus-4-8', SLOT_CATALOG)).toBe(true);
    expect(claudeCatalogSupportsSlot('claude-opus-4-8', CC_SWITCH_CATALOG)).toBe(true);
    expect(claudeCatalogSupportsSlot('claude-sonnet-5', CC_SWITCH_CATALOG)).toBe(true); // sonnet ≡ default
  });

  it('supports opus-4-8 against a bridge catalog whose opus is 4-6 (version skew)', () => {
    expect(claudeCatalogSupportsSlot('claude-opus-4-8', BRIDGE_CATALOG)).toBe(true);
  });

  it('is false when the slot family is absent, for non-Claude ids, and empty catalogs', () => {
    expect(claudeCatalogSupportsSlot('claude-opus-4-8', ['claude-sonnet-5', 'claude-haiku-4-5-20251001'])).toBe(false);
    expect(claudeCatalogSupportsSlot('gpt-4o', SLOT_CATALOG)).toBe(false);
    expect(claudeCatalogSupportsSlot('claude-opus-4-8', [])).toBe(false);
  });
});

describe('claudeModelIdsSelectSameModel', () => {
  it('confirms a registry pick against its advertised slot (#184 bare-slot regime)', () => {
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'opus', SLOT_CATALOG)).toBe(true);
    expect(claudeModelIdsSelectSameModel('claude-sonnet-5', 'default', CC_SWITCH_CATALOG)).toBe(true);
  });

  it('confirms opus-4-8 when the bridge confirms its opus-4-6 (real reported bug)', () => {
    // Persisted claude-opus-4-8; bridge advertises 4-6 and reports it as current.
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'claude-opus-4-6', BRIDGE_CATALOG)).toBe(true);
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'claude-opus-4-6-1m', BRIDGE_CATALOG)).toBe(true);
  });

  it('confirms a literal exact match regardless of catalog', () => {
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'claude-opus-4-8', EXACT_OFFERED_CATALOG)).toBe(true);
  });

  it('rejects a different slot (genuine model_mismatch)', () => {
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'sonnet', SLOT_CATALOG)).toBe(false);
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'claude-sonnet-5', BRIDGE_CATALOG)).toBe(false);
  });

  it('never conflates generations when the provider advertises the requested id verbatim', () => {
    // opus-4-8 IS offered, but the provider returned opus-4-1 → genuine mismatch,
    // must NOT be accepted as the same model.
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', 'claude-opus-4-1', EXACT_OFFERED_CATALOG)).toBe(false);
  });

  it('is false when the provider has not reported a model yet', () => {
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', null, SLOT_CATALOG)).toBe(false);
    expect(claudeModelIdsSelectSameModel('claude-opus-4-8', undefined, SLOT_CATALOG)).toBe(false);
  });
});
