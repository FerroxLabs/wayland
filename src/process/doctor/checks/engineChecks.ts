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

import { redactSecrets } from '@process/utils/secretRedaction';
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
 * The version NUMBER inside a `--version` banner, and nothing else.
 *
 * `detectWCore` returns unvalidated, unbounded `execFileSync` stdout
 * (`binaryResolver.ts`), so anything the resolved binary chooses to print can
 * reach a report the Doctor panel offers to copy (GHSA-2g2m-r86j-jg6h).
 *
 * The first attempt at this ended the pattern with an unanchored, unbounded
 * `[\w.+-]` run and it was NOT a fix - a cross-audit broke it by execution. That
 * character class is the alphabet of most credentials, and with no anchors and no
 * bound the match happily ran straight through one:
 * `1.0.0-sk-ant-<40ch>` surfaced the whole token, `0.13.0+build.<JWT>`
 * surfaced the whole JWT, `9.9.9-<200k chars>` surfaced all 200k, and
 * `token=sk-ant-1.2.3-<58ch>` needed no version banner at all because the
 * unanchored search simply started INSIDE the credential. Every one returned
 * `pass`. Three properties fix that and all three are load-bearing:
 *
 *  - the leading `(?<![\w.+-])` forbids a match that starts mid-token, which is
 *    what killed the `token=sk-ant-1.2.3-...` case;
 *  - the trailing `(?![\w.+-])` forbids a glued suffix, so `0.13.0_<32 hex>`
 *    cannot extend the match;
 *  - the prerelease/build tail is `{0,10}` and must OPEN with an alphanumeric,
 *    which bounds it instead of letting it run to end-of-input.
 *
 * `MAX_VERSION_LENGTH` is then a belt-and-braces cap on what is surfaced: the
 * pattern is already bounded, and a second bound that does not depend on reading
 * a regex correctly is cheap. This is an allowlisted shape plus a hard length
 * limit - which is why it does not rely on `redactSecrets` and #1026 does not
 * reach it. It is NOT immunity in general: it is immunity to whatever cannot fit
 * through this shape.
 *
 * The optional `v` is part of the capture, not decoration: the engine's banner is
 * `v0.10.0`-shaped and an existing reachability test asserts that spelling
 * survives, so dropping it would have been a silent contract change.
 */
const ENGINE_VERSION_PATTERN = /(?<![\w.+-])v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z][0-9A-Za-z.]{0,10})?(?![\w.+-])/;

/** Hard cap on the surfaced version text, independent of the pattern above. */
const MAX_VERSION_LENGTH = 32;

/**
 * Engine reachability — the `wayland-core` binary resolves and answers
 * `--version` with a recognisable version number. FAIL when no binary is found;
 * WARN when a binary exists but reported no usable version (it may be the wrong
 * arch or a broken build).
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
  // Unparseable stdout is treated exactly like no stdout, and the raw text is
  // NOT echoed to say so. A binary whose `--version` carries no version number is
  // the same broken build either way, so the user loses no signal.
  const version = result.version
    ? ENGINE_VERSION_PATTERN.exec(result.version)?.[0].slice(0, MAX_VERSION_LENGTH)
    : undefined;
  if (!version) {
    return {
      status: 'warn',
      detail: `Engine binary found at ${result.path ?? 'an unknown path'} but it did not report a usable version.`,
      remediation: 'The binary may be the wrong architecture or a broken build — reinstall the app.',
    };
  }
  return { status: 'pass', detail: `Wayland Core engine ${version} is reachable.` };
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
  /**
   * The contract schema digest the binary advertises, or null when it
   * advertises none. Null is a real and supported answer, not a failure.
   */
  advertisedSchemaDigest: () => Promise<string | null>;
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
 * Instead it reads the schema digest out of the binary's own embedded contract
 * manifest and COMPARES it. The distinction between comparing and merely
 * testing for presence is the whole correctness of this check, and the first
 * version got it wrong: absence of the pinned digest is not evidence of a
 * mismatch.
 *
 * A Core that advertises NO contract at all is a supported configuration, not a
 * broken one. `DesktopCoreV1Consumer.negotiate` sets `mode = 'legacy'` when
 * `ready.contract` is undefined and carries on ("a released legacy Core that
 * does not advertise `ready.contract` keeps the existing path"). Failing those
 * would tell users of a perfectly working install to reinstall it — and if the
 * engine came from an accepted in-app update living in userData, reinstalling
 * the app would not even clear it. So: digest present and different is the
 * failure; digest absent is legacy and passes.
 *
 * That also makes the check safe on platforms where the manifest may not be
 * ASCII-recoverable from the binary. Only `darwin-arm64` has been confirmed
 * [verified: pinned digest found, the shipped-v0.12.26 digest `23fb3048...`
 * absent, with a known-positive control]. Anywhere the digest cannot be read,
 * this degrades to the legacy branch and says nothing, rather than crying wolf.
 *
 * A missing binary is not this check's business - `engine.reachable` already
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

  let advertised: string | null;
  try {
    advertised = await probe.advertisedSchemaDigest();
  } catch (error) {
    return {
      status: 'warn',
      // Scrubbed for UNIFORMITY, not because this source is known to be
      // credential-bearing: it is an fs failure reading the engine binary. The
      // Doctor surface now holds one rule - no raw error text reaches a report
      // that gets copied to support (GHSA-2g2m-r86j-jg6h) - because a per-check
      // judgement call is exactly what the next check author gets wrong.
      detail: `The engine binary could not be read to verify its contract version: ${redactSecrets(
        error instanceof Error ? error.message : String(error)
      )}`,
      remediation: 'Check that the app has permission to read its own bundled engine.',
    };
  }

  if (advertised === null) {
    return {
      status: 'pass',
      detail: 'The engine advertises no contract version, which this build supports and runs normally.',
    };
  }

  if (advertised !== expectedSchemaDigest) {
    return {
      status: 'fail',
      detail:
        'The engine and this build of Wayland were made for different contract versions, so turns will fail the moment they start.',
      remediation: `The engine in use is ${binaryPath}. If that is an engine update this app installed, remove it so the bundled engine is used again; otherwise reinstall the app.`,
    };
  }

  return { status: 'pass', detail: 'The engine matches the contract version this build expects.' };
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
