/**
 * Backend-availability filter.
 *
 * Pure functions that turn a detected-CLI list into the set of backends the UI
 * (or a process-side spawner) is allowed to offer. Always includes
 * `wayland-core` as a fallback so spawn flows can never produce an empty
 * candidate list.
 *
 * No React, no IPC, no filesystem - safe to import from `src/process/**` and
 * from renderer hooks alike.
 */

export type BackendId = 'claude' | 'gemini' | 'codex' | 'copilot' | 'wayland-core' | string;

/** Returns CLIs detected to be installed, ∪ wayland-core fallback. */
export function resolveAvailableBackends(detected: BackendId[]): BackendId[] {
  const set = new Set<BackendId>([...detected, 'wayland-core']);
  return Array.from(set);
}

/** Picks the recommended backend; falls back to wayland-core if the preset's backend is not detected. */
export function recommendBackend(detected: BackendId[], presetAgentType?: string): BackendId {
  const available = resolveAvailableBackends(detected);
  if (presetAgentType && available.includes(presetAgentType)) return presetAgentType;
  return 'wayland-core';
}
