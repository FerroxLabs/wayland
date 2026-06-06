/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { QUICK_LAUNCH_ANCHORS, type QuickLaunchAnchorId } from '@/renderer/pages/guid/quickLaunchAnchors';

describe('QUICK_LAUNCH_ANCHORS', () => {
  it('defines exactly 6 anchors', () => {
    expect(QUICK_LAUNCH_ANCHORS).toHaveLength(6);
  });

  it('declares Cowork first (place anchor for IJFW universal button)', () => {
    expect(QUICK_LAUNCH_ANCHORS[0].id).toBe('cowork');
  });

  it('every anchor has all required fields populated', () => {
    for (const anchor of QUICK_LAUNCH_ANCHORS) {
      expect(anchor.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(anchor.label).toBeTruthy();
      expect(anchor.label.length).toBeLessThanOrEqual(20);
      expect(anchor.sub).toBeTruthy();
      expect(anchor.sub.length).toBeLessThanOrEqual(28);
      expect(anchor.prefill).toBeTruthy();
      expect(anchor.prefill.length).toBeGreaterThan(2);
      expect(anchor.assistantId).toBeTruthy();
      expect(anchor.lucideIcon).toBeTruthy();
    }
  });

  it('every anchor id is unique', () => {
    const ids = QUICK_LAUNCH_ANCHORS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exports a discriminated union of anchor ids', () => {
    const validIds: QuickLaunchAnchorId[] = ['cowork', 'write-copy', 'close-deal', 'launch-it', 'numbers', 'quiet-money'];
    expect(validIds).toHaveLength(6);
  });
});
