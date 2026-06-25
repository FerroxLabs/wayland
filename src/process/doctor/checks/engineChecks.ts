/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland Core engine Doctor checks.
 *
 * Two things break the engine in the field:
 *  1. The engine binary is missing / unreachable (no `wayland-core` bundled and
 *     none on PATH) — every WCore chat fails to spawn.
 *  2. The engine is reachable but there is no real model for it to route to.
 *     WCore owns NO model catalog — it proxies the user's connected providers
 *     (`WaylandCoreSource.listModels() === []` by design). So "default routing
 *     is intact" means a connected provider exposes at least one model; an
 *     engine that resolves a model id no provider serves is the "WCore model
 *     404" class (memory: C1/C2). We verify the precondition — that a routable
 *     model exists — rather than spawning a real turn.
 */

import type { DoctorCheckOutcome } from '../types';

/** Engine binary detection result — shape of `detectWCore()`. */
export type WCoreDetection = { available: boolean; version?: string; path?: string };

/** Reader for "is there a model the engine can route to". */
export type RoutableModelReader = {
  /** Total persisted catalog models across every connected provider. */
  totalModelCount: () => number;
  /** Number of connected providers. */
  providerCount: () => number;
};

/**
 * Engine reachability — the `wayland-core` binary resolves and answers
 * `--version`. FAIL when no binary is found; WARN when a binary exists but did
 * not report a version (it may be the wrong arch or a broken build).
 */
export async function checkEngineReachable(detect: () => WCoreDetection): Promise<DoctorCheckOutcome> {
  const result = detect();
  if (!result.available) {
    return {
      status: 'fail',
      detail: 'The Wayland Core engine binary was not found (not bundled and not on PATH).',
      remediation: 'Reinstall the app, or install the wayland-core engine on your PATH.',
    };
  }
  if (!result.version) {
    return {
      status: 'warn',
      detail: `Engine binary found at ${result.path ?? 'an unknown path'} but it did not report a version.`,
      remediation: 'The binary may be the wrong architecture or a broken build — reinstall the app.',
    };
  }
  return { status: 'pass', detail: `Wayland Core engine ${result.version} is reachable.` };
}

/**
 * Engine default routing — the engine has at least one real model to route to.
 * WCore proxies connected providers, so an empty catalog means every WCore chat
 * would resolve a model that no provider serves (the 404 class). FAIL when no
 * routable model exists.
 */
export async function checkEngineRouting(reader: RoutableModelReader): Promise<DoctorCheckOutcome> {
  if (reader.providerCount() === 0) {
    return {
      status: 'warn',
      detail: 'No providers connected, so the engine has nothing to route to.',
      remediation: 'Connect a provider in Settings → Models — the engine runs whatever model you connect.',
    };
  }
  const total = reader.totalModelCount();
  if (total === 0) {
    return {
      status: 'fail',
      detail: 'The engine has no routable model — every connected provider has an empty catalog.',
      remediation: 'Refresh or reconnect a provider in Settings → Models so the engine has a model to run.',
    };
  }
  return { status: 'pass', detail: `Engine can route to ${total} model(s) from connected providers.` };
}
