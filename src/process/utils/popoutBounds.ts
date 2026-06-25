/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure pop-out window geometry + registry helpers (#27 phase 2). Kept free of
 * Electron / IPC imports so the dedupe and bounds-resolution logic is
 * unit-testable in a plain node environment. The Electron-backed window manager
 * (`popoutWindowManager.ts`) composes these.
 */

export type PopoutBounds = { x: number; y: number; width: number; height: number; displayId: number };

/**
 * Decide what `openPopoutWindow` should do given the current registry state.
 * Returns 'focus' when a live (non-destroyed) window already exists for the
 * conversation (dedupe), otherwise 'create'. A destroyed entry is treated as
 * absent (stale) so a new window is created.
 */
export function resolvePopoutAction(
  registry: Map<string, { isDestroyed: () => boolean }>,
  conversationId: string
): 'focus' | 'create' {
  const existing = registry.get(conversationId);
  if (existing && !existing.isDestroyed()) {
    return 'focus';
  }
  return 'create';
}

/**
 * Clamp persisted bounds into a currently-attached display's work area, falling
 * back to a centered default on the primary display when no usable persisted
 * bounds exist or the saved display is gone. Pure: all display data is passed in.
 */
export function resolvePopoutBounds(
  persisted: PopoutBounds | null,
  displays: Array<{ id: number; workArea: { x: number; y: number; width: number; height: number } }>,
  primaryWorkArea: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const DEFAULT_W = Math.min(960, Math.floor(primaryWorkArea.width * 0.6));
  const DEFAULT_H = Math.min(800, Math.floor(primaryWorkArea.height * 0.85));

  if (persisted) {
    const display = displays.find((d) => d.id === persisted.displayId);
    if (display) {
      const { workArea } = display;
      const width = Math.min(persisted.width, workArea.width);
      const height = Math.min(persisted.height, workArea.height);
      const x = clamp(persisted.x, workArea.x, workArea.x + workArea.width - width);
      const y = clamp(persisted.y, workArea.y, workArea.y + workArea.height - height);
      return { x, y, width, height };
    }
  }

  // Centered default on the primary display.
  const width = DEFAULT_W;
  const height = DEFAULT_H;
  const x = Math.round(primaryWorkArea.x + (primaryWorkArea.width - width) / 2);
  const y = Math.round(primaryWorkArea.y + (primaryWorkArea.height - height) / 2);
  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
