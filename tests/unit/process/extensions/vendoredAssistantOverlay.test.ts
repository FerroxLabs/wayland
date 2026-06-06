/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Live-smoke fix #1 (2026-05-19) - unit tests for the vendored-bundle
// runtime overlay. Confirms the overlay (a) injects missing schema
// fields, (b) is idempotent / non-destructive against already-populated
// fields, (c) handles both `ext-`-prefixed and unprefixed ids, and
// (d) leaves unknown assistants untouched.

import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyVendoredOverlay,
  __resetVendoredOverlayCacheForTests,
} from '@process/extensions/data/bundle-vendored/vendoredAssistantOverlay';

describe('applyVendoredOverlay', () => {
  beforeEach(() => {
    __resetVendoredOverlayCacheForTests();
  });

  it('injects standing + teammates + rituals onto a known standing-company entry whose live record lacks them', async () => {
    const assistants: Record<string, unknown>[] = [
      // The vendored manifest declares `marketing-agency` with standing:true,
      // a 5-element teammates roster, and a weekly-checkin ritual. The live
      // record here intentionally omits all three so we can see the overlay
      // hydrate them.
      {
        id: 'ext-marketing-agency',
        name: 'Marketing Agency',
        kind: 'team',
      },
    ];
    await applyVendoredOverlay(assistants);
    const patched = assistants[0];
    expect(patched.standing).toBe(true);
    expect(Array.isArray(patched.teammates)).toBe(true);
    expect((patched.teammates as string[]).length).toBeGreaterThan(0);
    expect(Array.isArray(patched.rituals)).toBe(true);
    expect((patched.rituals as Array<{ name: string }>)[0]?.name).toBe('weekly-checkin');
  });

  it('leaves already-populated fields untouched (overlay is non-destructive)', async () => {
    const assistants: Record<string, unknown>[] = [
      {
        id: 'ext-marketing-agency',
        standing: false, // explicit live override - must NOT be flipped by the overlay
        teammates: ['only-one'],
      },
    ];
    await applyVendoredOverlay(assistants);
    expect(assistants[0].standing).toBe(false);
    expect(assistants[0].teammates).toEqual(['only-one']);
    // rituals was missing on the input, so the overlay should still hydrate it.
    expect(Array.isArray(assistants[0].rituals)).toBe(true);
  });

  it('matches unprefixed ids as well as ext- prefixed ids', async () => {
    const assistants: Record<string, unknown>[] = [
      { id: 'dev-shop', name: 'Dev Shop' },
    ];
    await applyVendoredOverlay(assistants);
    expect(assistants[0].standing).toBe(true);
  });

  it('leaves assistants with no matching vendored entry unchanged', async () => {
    const assistants: Record<string, unknown>[] = [
      { id: 'ext-this-id-does-not-exist-anywhere', name: 'Phantom' },
    ];
    const before = JSON.stringify(assistants[0]);
    await applyVendoredOverlay(assistants);
    expect(JSON.stringify(assistants[0])).toBe(before);
  });

  it('preserves the non-standing flag on launchers the vendored bundle marks standing:false', async () => {
    const assistants: Record<string, unknown>[] = [
      // `cold-outbound` is a kind:team launcher with standing:false in the
      // vendored manifest. The overlay must propagate that explicit false
      // rather than leaving it unset (which the renderer reads as undefined).
      { id: 'ext-cold-outbound', name: 'Cold Outbound', kind: 'team' },
    ];
    await applyVendoredOverlay(assistants);
    expect(assistants[0].standing).toBe(false);
  });

  it('injects the kickoffs array onto a known assistant whose live record lacks it', async () => {
    // v0.4.7 - every vendored assistant ships with 7 kickoffs. Confirms the
    // overlay carries the new schema field across the dual-write boundary.
    const assistants: Record<string, unknown>[] = [{ id: 'ext-helm', name: 'Coach' }];
    await applyVendoredOverlay(assistants);
    const kickoffs = assistants[0].kickoffs as Array<{ id: string; scenario: string }> | undefined;
    expect(Array.isArray(kickoffs)).toBe(true);
    expect(kickoffs!.length).toBe(7);
    const ids = kickoffs!.map((k) => k.id);
    expect(ids).toContain('what-am-i-avoiding');
    expect(kickoffs!.every((k) => typeof k.id === 'string' && typeof k.scenario === 'string')).toBe(true);
  });

  it('preserves a live-record kickoffs override rather than clobbering with the bundle', async () => {
    // Overlay is non-destructive: if the running bundle already shipped its
    // own kickoffs (e.g. assistant-author update), the vendored snapshot must
    // not silently shadow them.
    const assistants: Record<string, unknown>[] = [
      {
        id: 'ext-helm',
        kickoffs: [{ id: 'live-override', text: 't', prefill: 'p', scenario: 'cold-start' }],
      },
    ];
    await applyVendoredOverlay(assistants);
    const kickoffs = assistants[0].kickoffs as Array<{ id: string }>;
    expect(kickoffs).toHaveLength(1);
    expect(kickoffs[0].id).toBe('live-override');
  });

  // -- E-M-4 - all-or-nothing validator behavior for malformed entries.
  //
  // The overlay parses its OWN vendored manifest before applying it. The
  // validator's `every` predicate gates the WHOLE kickoffs array - if any
  // entry is malformed, the entire array is rejected (skipped) and the
  // overlay sets nothing for that assistant. We can't easily inject a
  // tampered vendored JSON, but we CAN assert the apply step's behavior
  // around what the overlay holds vs what the assistant carries.
  //
  // (a) live record with [valid, malformed] in `kickoffs` → overlay does
  //     not touch the field (it's "present").
  // (b) live record with `kickoffs: []` → overlay treats as missing and
  //     injects from the bundle (G-M-4 fix).
  // (c) live record with `kickoffs: null` → overlay does NOT inject
  //     (null is "present" - distinguishes "explicitly cleared" from
  //     "never set" by the live record author).
  it('does NOT overwrite a live kickoffs array containing a mix of valid+malformed entries (overlay is non-destructive)', async () => {
    // The bundle's all-or-nothing validator runs on the BUNDLE side, not
    // the live side. Live-side data is treated as authoritative regardless
    // of shape. This test pins that contract.
    const assistants: Record<string, unknown>[] = [
      {
        id: 'ext-helm',
        kickoffs: [
          { id: 'live-good', text: 't', prefill: 'p', scenario: 'cold-start' },
          // Malformed - no id. Overlay should still leave the array alone.
          { text: 'orphan' },
        ],
      },
    ];
    await applyVendoredOverlay(assistants);
    const kickoffs = assistants[0].kickoffs as Array<{ id?: string }>;
    expect(kickoffs).toHaveLength(2);
    expect(kickoffs[0].id).toBe('live-good');
  });

  it('treats kickoffs:[] as missing → overlay injects the vendored array (G-M-4 fix)', async () => {
    const assistants: Record<string, unknown>[] = [{ id: 'ext-helm', kickoffs: [] }];
    await applyVendoredOverlay(assistants);
    const kickoffs = assistants[0].kickoffs as Array<unknown>;
    expect(kickoffs.length).toBeGreaterThan(0);
  });

  it('treats kickoffs:null as present → overlay does NOT inject', async () => {
    // `null` is a deliberate value (distinct from `undefined`). The overlay's
    // "missing" check is `undefined || empty-array`, so null falls through
    // the gate and the live record stays untouched.
    const assistants: Record<string, unknown>[] = [{ id: 'ext-helm', kickoffs: null }];
    await applyVendoredOverlay(assistants);
    expect(assistants[0].kickoffs).toBeNull();
  });

  // -- TEST-5 - Mock-vs-production drift guard: the engine reads bare
  // `kickoffs` from the registry record. This test pins that the overlay
  // carries the bare field with the expected shape across the dual-write
  // boundary. A future refactor that renames or projects this field on the
  // way out (e.g. to `_kickoffs` for renderer consumption) would silently
  // disable the SuggestionEngine; this test catches that regression.
  it('engine-shape contract: real assistants.json puts a bare `kickoffs` field with id/text/prefill/scenario on helm', async () => {
    const assistants: Record<string, unknown>[] = [{ id: 'ext-helm', name: 'Coach' }];
    await applyVendoredOverlay(assistants);
    const kickoffs = (assistants[0] as { kickoffs?: unknown }).kickoffs;
    expect(Array.isArray(kickoffs)).toBe(true);
    const arr = kickoffs as Array<Record<string, unknown>>;
    expect(arr.length).toBeGreaterThan(0);
    for (const k of arr) {
      expect(typeof k.id).toBe('string');
      expect(typeof k.text).toBe('string');
      expect(typeof k.prefill).toBe('string');
      expect(typeof k.scenario).toBe('string');
    }
    // No `_kickoffs` renaming - the field must be bare.
    expect((assistants[0] as { _kickoffs?: unknown })._kickoffs).toBeUndefined();
  });
});
