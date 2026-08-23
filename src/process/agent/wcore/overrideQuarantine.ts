/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, renameSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { WCORE_OVERRIDE_SUBDIR } from './binaryResolver';

/**
 * Undo an in-app engine update that this build cannot talk to.
 *
 * THE FIELD REPORT. A user on Desktop v0.12.0 accepted the in-app engine update
 * to Core v0.13.5 and every chat died with
 *
 *     Agent failed to start: wcore Desktop contract rejected ready:
 *     Core contract minor differs from the pin
 *
 * v0.12.0 pins contract minor 14 and bundles Core v0.13.0; v0.13.5 is minor 16,
 * and `assertDescriptor` compares minors with strict equality and fails closed.
 *
 * The app did this to itself. `resolveWCoreBinary` checks the user-installed
 * override FIRST - deliberately, so an accepted update supersedes the bundled
 * binary without a full app update - so the moment the updater wrote v0.13.5
 * into that directory it shadowed the bundled, contract-matched v0.13.0. The
 * updater offered it, installed it, and bricked the app, and the resulting
 * error named no way out.
 *
 * A newer engine must never be able to permanently break an older Desktop. The
 * bundled binary is always present and always matches the pin, so an override
 * that fails the contract is strictly worse than no override at all: moving it
 * aside can only restore a working app.
 *
 * This is deliberately keyed on the FAILURE, not on a version comparison. A
 * pre-flight version check only stops the engines we can predict; quarantining
 * whatever actually fails the handshake also catches a hand-installed binary, a
 * sideways downgrade, a corrupted download, and every future contract bump
 * nobody has thought of yet.
 */

/**
 * Contract failures that mean THIS ENGINE IS WRONG FOR THIS BUILD.
 *
 * Deliberately narrow. A parse error, a stall or a malformed frame can equally
 * be a bad session or a transient, and quarantining on those would throw away a
 * legitimate engine over a blip. Every code here is a descriptor mismatch -
 * a stable, structural statement that the two sides cannot talk at all, and one
 * that will fail identically on every retry.
 */
const INCOMPATIBLE_ENGINE_CODES: ReadonlySet<string> = new Set([
  'contract_name_mismatch',
  'contract_major_mismatch',
  'contract_minor_mismatch',
  'generator_mismatch',
  'fixture_digest_mismatch',
  'schema_digest_mismatch',
  'source_inputs_digest_mismatch',
]);

/** True iff this failure means the engine binary itself is incompatible. */
export function isIncompatibleEngineCode(code: unknown): boolean {
  return typeof code === 'string' && INCOMPATIBLE_ENGINE_CODES.has(code);
}

/**
 * True iff `binaryPath` was resolved from the user-installed override tree.
 *
 * Matched on the path SEGMENT, not with `includes()`, so an unrelated workspace
 * that merely contains the words cannot be mistaken for the override directory.
 */
export function isOverrideBinary(binaryPath: string | null | undefined, overrideDir: string | null): boolean {
  if (!binaryPath || !overrideDir) return false;
  const normalized = binaryPath.split(sep);
  const marker = overrideDir.split(sep).filter(Boolean).pop();
  if (!marker) return false;
  return normalized.includes(marker);
}

/** What happened, so the caller can tell the user something true. */
export type QuarantineOutcome =
  | { kind: 'quarantined'; movedTo: string }
  | { kind: 'skipped'; reason: 'not-an-override' | 'nothing-to-move' }
  | { kind: 'move-failed'; error: string };

/**
 * Move the override tree aside so the next launch falls through to the bundled
 * engine. RENAMED, never deleted - the binary is evidence, it may be wanted for
 * a bug report, and destroying a user's download to fix our own bug would be
 * its own defect.
 *
 * @param overrideDir the resolved override directory, or null when unavailable
 * @param stamp       caller-supplied suffix; injected so this is deterministic under test
 */
export function quarantineOverride(overrideDir: string | null, stamp: string): QuarantineOutcome {
  if (!overrideDir) return { kind: 'skipped', reason: 'not-an-override' };
  if (!existsSync(overrideDir)) return { kind: 'skipped', reason: 'nothing-to-move' };
  const target = join(dirname(overrideDir), `${WCORE_OVERRIDE_SUBDIR}.rejected-${stamp}`);
  try {
    renameSync(overrideDir, target);
    return { kind: 'quarantined', movedTo: target };
  } catch (error) {
    return { kind: 'move-failed', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The sentence the user reads.
 *
 * The shipped one was "Core contract minor differs from the pin", which names
 * no product, no version and no action. This one says what was installed, what
 * happened to it, and what to do next.
 */
export function describeQuarantine(outcome: QuarantineOutcome, engineDetail: string): string {
  if (outcome.kind === 'quarantined') {
    return (
      'This version of Wayland cannot run the Wayland Core engine that was installed by the in-app update, ' +
      'so Wayland has switched back to the engine it shipped with. Restart Wayland to continue. ' +
      `The engine that could not be used was moved to ${outcome.movedTo} and nothing was deleted. ` +
      `Engine detail: ${engineDetail}`
    );
  }
  if (outcome.kind === 'move-failed') {
    return (
      'This version of Wayland cannot run the installed Wayland Core engine, and Wayland could not move it ' +
      `aside automatically (${outcome.error}). Quit Wayland and delete the ` +
      `wayland-core-overrides folder in the Wayland application-support directory, then reopen. ` +
      `Engine detail: ${engineDetail}`
    );
  }
  return engineDetail;
}
