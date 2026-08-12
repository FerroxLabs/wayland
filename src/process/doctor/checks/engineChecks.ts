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
 * Reader for "is the engine binary the build this Desktop is pinned to".
 *
 * Split out rather than reading the file here so the check stays pure and the
 * 77 MB scan lives at the composition root with the other live bindings.
 */
export type EngineContractPinProbe = {
  /** Absolute path of the engine binary in use, or undefined when none resolved. */
  binaryPath: () => string | undefined;
  /** True when `marker` appears anywhere in the binary's bytes. */
  binaryContains: (marker: string) => Promise<boolean>;
};

/**
 * Engine contract pin — the bundled binary is the build Desktop negotiates
 * against.
 *
 * This is the check that would have named a real shipping blocker in one line:
 * a `build-mac` bundling released Core v0.12.26 against a pin that demands an
 * unreleased Core commit. `DESKTOP_CORE_V1_PIN` is compared for EQUALITY by the
 * observer, so a mismatch does not degrade - every turn dies on frame 1.
 *
 * It deliberately does NOT compare `--version`, and that is the whole point.
 * The pin's own note says it outright: the pinned build "still self-reports
 * 0.12.26, so identify it by sha, never by --version". A version comparison
 * would pass on exactly the binary that cannot start a turn.
 *
 * Instead it looks for the pinned schema digest in the binary's own embedded
 * contract manifest - the same method used to diagnose the drift originally,
 * and verified discriminating here: the pinned digest is present in a correct
 * binary while the shipped-v0.12.26 digest (`23fb3048…`, a THIRD digest set
 * Core's handoff table does not list) is absent.
 *
 * Absent binary is not this check's business - `engine.reachable` already
 * fails on that, and two checks failing for one cause reads as two problems.
 */
export async function checkEngineContractPin(
  probe: EngineContractPinProbe,
  expectedSchemaDigest: string
): Promise<DoctorCheckOutcome> {
  const binaryPath = probe.binaryPath();
  if (!binaryPath) {
    return {
      status: 'warn',
      detail: 'No engine binary resolved, so its contract version could not be checked.',
      remediation: 'Resolve the missing engine first — see the engine reachability check above.',
    };
  }

  let matches: boolean;
  try {
    matches = await probe.binaryContains(expectedSchemaDigest);
  } catch (error) {
    return {
      status: 'warn',
      detail: `The engine binary could not be read to verify its contract version: ${
        error instanceof Error ? error.message : String(error)
      }`,
      remediation: 'Check that the app has permission to read its own bundled engine.',
    };
  }

  if (!matches) {
    return {
      status: 'fail',
      detail:
        'The engine binary does not carry the contract this build of Wayland is pinned to, so every turn will fail as soon as it starts.',
      remediation:
        'The bundled engine and this app are from different builds. Reinstall the app, or restore the engine version it shipped with.',
    };
  }

  return { status: 'pass', detail: 'The engine binary matches the contract this build is pinned to.' };
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
