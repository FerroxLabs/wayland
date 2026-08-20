/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS,
  EMPTY_ABANDONED_SWEEP_WINDOW_MS,
  WORKSPACE_RETENTION_WINDOW_CHOICES,
  loadRetentionWindowMs,
  parseWorkspaceRetentionSettings,
  retentionWindowMsFor,
} from '@/common/types/workspaceRetentionSettings';
import { classifyManagedWorkspaceRetention } from '@/common/types/managedWorkspaceRetention';
import { describe, expect, it } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;

describe('workspace retention settings', () => {
  it('offers exactly the four locked choices and defaults to 60 days', () => {
    expect(WORKSPACE_RETENTION_WINDOW_CHOICES).toEqual([30, 60, 90, 'never']);
    expect(DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS).toBe(60);
    expect(parseWorkspaceRetentionSettings(undefined).windowDays).toBe(60);
  });

  it('sweeps provably empty scratch on a fixed 7-day window that no setting can move', () => {
    expect(EMPTY_ABANDONED_SWEEP_WINDOW_MS).toBe(7 * DAY);
  });

  it('falls back to the default rather than trusting a malformed stored value', () => {
    for (const stored of [null, 'never-ever', { windowDays: 45 }, { windowDays: '60' }, [], 60]) {
      expect(parseWorkspaceRetentionSettings(stored).windowDays).toBe(60);
    }
  });

  it('round-trips each valid stored choice', () => {
    for (const windowDays of [30, 60, 90, 'never'] as const) {
      expect(parseWorkspaceRetentionSettings({ windowDays }).windowDays).toBe(windowDays);
    }
  });

  it('maps day choices onto the classifier field that already exists', () => {
    expect(retentionWindowMsFor(30)).toBe(30 * DAY);
    expect(retentionWindowMsFor(60)).toBe(60 * DAY);
    expect(retentionWindowMsFor(90)).toBe(90 * DAY);
  });

  it('represents "never" as an unreachable window the classifier already validates', () => {
    const never = retentionWindowMsFor('never');
    expect(Number.isSafeInteger(never)).toBe(true);
    expect(never).toBe(Number.MAX_SAFE_INTEGER);

    // The oldest workspace this process can observe is still younger than the
    // window, so tier 2 produces nothing at all.
    const decision = classifyManagedWorkspaceRetention({
      managedProvenance: true,
      inventoryComplete: true,
      referenceCount: 0,
      scheduleCount: 0,
      activeProcessCount: 0,
      artifactCount: 0,
      userPromoted: false,
      userContent: 'absent',
      modified: false,
      abandonedForMs: 8_640_000_000_000_000,
      retentionWindowMs: never,
    });
    expect(decision.disposition).toBe('preserve');
    expect(decision.reasons).toContain('retention-window-pending');
  });

  it('leaves the fixed tier-1 window reachable while tier 2 is set to never', () => {
    const decision = classifyManagedWorkspaceRetention({
      managedProvenance: true,
      inventoryComplete: true,
      referenceCount: 0,
      scheduleCount: 0,
      activeProcessCount: 0,
      artifactCount: 0,
      userPromoted: false,
      userContent: 'absent',
      modified: false,
      abandonedForMs: 8 * DAY,
      retentionWindowMs: EMPTY_ABANDONED_SWEEP_WINDOW_MS,
    });
    expect(decision.disposition).toBe('review-candidate');
    expect(decision.classifications).toEqual(['empty-abandoned']);
  });

  it('loads the stored window and falls back to the default when the store throws', async () => {
    await expect(loadRetentionWindowMs(async () => ({ windowDays: 90 }))).resolves.toBe(90 * DAY);
    await expect(loadRetentionWindowMs(async () => ({ windowDays: 'never' }))).resolves.toBe(Number.MAX_SAFE_INTEGER);
    await expect(loadRetentionWindowMs(async () => undefined)).resolves.toBe(60 * DAY);
    await expect(
      loadRetentionWindowMs(async () => {
        throw new Error('config store unavailable');
      })
    ).resolves.toBe(60 * DAY);
  });
});
