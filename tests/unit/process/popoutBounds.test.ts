/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { resolvePopoutAction, resolvePopoutBounds, type PopoutBounds } from '../../../src/process/utils/popoutBounds';

const fakeWin = (destroyed: boolean) => ({ isDestroyed: () => destroyed });

describe('resolvePopoutAction (pop-out dedupe registry logic)', () => {
  it('returns "create" when no window exists for the conversation', () => {
    const registry = new Map<string, { isDestroyed: () => boolean }>();
    expect(resolvePopoutAction(registry, 'conv-1')).toBe('create');
  });

  it('returns "focus" when a live window already exists (dedupe)', () => {
    const registry = new Map([['conv-1', fakeWin(false)]]);
    expect(resolvePopoutAction(registry, 'conv-1')).toBe('focus');
  });

  it('returns "create" when the existing window is destroyed (stale entry)', () => {
    const registry = new Map([['conv-1', fakeWin(true)]]);
    expect(resolvePopoutAction(registry, 'conv-1')).toBe('create');
  });

  it('keys dedupe per conversation id', () => {
    const registry = new Map([['conv-1', fakeWin(false)]]);
    expect(resolvePopoutAction(registry, 'conv-2')).toBe('create');
    expect(resolvePopoutAction(registry, 'conv-1')).toBe('focus');
  });
});

describe('resolvePopoutBounds (multi-monitor bounds resolution)', () => {
  const primary = { x: 0, y: 0, width: 1920, height: 1080 };
  const displays = [
    { id: 1, workArea: primary },
    { id: 2, workArea: { x: 1920, y: 0, width: 2560, height: 1440 } },
  ];

  it('centers a default window on the primary display when no persisted bounds', () => {
    const b = resolvePopoutBounds(null, displays, primary);
    expect(b.width).toBeGreaterThan(0);
    expect(b.height).toBeGreaterThan(0);
    // Centered horizontally within the primary work area.
    expect(b.x).toBe(Math.round((primary.width - b.width) / 2));
    expect(b.y).toBe(Math.round((primary.height - b.height) / 2));
  });

  it('restores persisted bounds clamped into the saved display work area', () => {
    const persisted: PopoutBounds = { x: 2000, y: 100, width: 900, height: 700, displayId: 2 };
    const b = resolvePopoutBounds(persisted, displays, primary);
    expect(b.width).toBe(900);
    expect(b.height).toBe(700);
    expect(b.x).toBe(2000);
    expect(b.y).toBe(100);
  });

  it('clamps oversized persisted bounds to the display work area', () => {
    const persisted: PopoutBounds = { x: 0, y: 0, width: 99999, height: 99999, displayId: 1 };
    const b = resolvePopoutBounds(persisted, displays, primary);
    expect(b.width).toBe(primary.width);
    expect(b.height).toBe(primary.height);
  });

  it('clamps an off-screen persisted position back inside the work area', () => {
    const persisted: PopoutBounds = { x: 9999, y: 9999, width: 800, height: 600, displayId: 1 };
    const b = resolvePopoutBounds(persisted, displays, primary);
    expect(b.x).toBe(primary.width - 800);
    expect(b.y).toBe(primary.height - 600);
  });

  it('falls back to the centered default when the saved display is gone', () => {
    const persisted: PopoutBounds = { x: 2000, y: 100, width: 900, height: 700, displayId: 99 };
    const b = resolvePopoutBounds(persisted, displays, primary);
    // Default path: centered on primary, not the persisted position.
    expect(b.x).toBe(Math.round((primary.width - b.width) / 2));
    expect(b.y).toBe(Math.round((primary.height - b.height) / 2));
  });
});
