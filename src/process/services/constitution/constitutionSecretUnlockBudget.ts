/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ConstitutionArchiveSecretBackend } from './constitutionFsTransaction';

/**
 * Raised when the OS secret store has already proven it cannot unlock this
 * profile's Constitution state inside the budget, so no further unlock is
 * attempted. Callers treat it exactly like any other decrypt failure: the
 * revision authority classifies it as unauthenticated and the service degrades.
 */
export const CONSTITUTION_SECRET_UNLOCK_TIMEOUT = 'CONSTITUTION_FS_SECRET_UNLOCK_TIMEOUT';

/**
 * Wall-clock budget for a single Constitution unlock.
 *
 * The reported failure was a ~120s block on a foreign-identity keychain item,
 * attributed to an invisible macOS authorization prompt. That block has NOT
 * been reproduced here: against a real keychain in a scratch profile, an
 * unopenable ring was refused in tens of milliseconds with no prompt. The
 * budget is sized for the reported case rather than a measured one, and it is
 * generous on purpose - a healthy unlock is three orders of magnitude inside
 * it, so it can only ever fire on something genuinely pathological.
 */
export const CONSTITUTION_SECRET_UNLOCK_BUDGET_MS = 10_000;

export function isConstitutionSecretUnlockTimeout(error: unknown): boolean {
  return error instanceof Error && error.message === CONSTITUTION_SECRET_UNLOCK_TIMEOUT;
}

export type ConstitutionSecretUnlockBudgetOptions = Readonly<{
  budgetMs?: number;
  now?: () => number;
  onBudgetExceeded?: (elapsedMs: number) => void;
}>;

/**
 * Bound how long the Constitution path can spend inside the OS secret store.
 *
 * HONEST LIMIT, stated because the alternative is a false claim:
 * `safeStorage.decryptString` is a synchronous native call on the Electron main
 * process. Nothing running in that process can interrupt it - a timer cannot
 * fire while it blocks, so a `Promise.race` against it would resolve only after
 * it returned. The FIRST unlock therefore cannot be cut short from here; that
 * needs the call moved off the main process, which is not this seam.
 *
 * What is bounded is every REPEAT of it. The Constitution reads the authority
 * on the start of every turn and re-reads it on every `assertPersisted()`, so
 * one expensive blob would otherwise be paid again on each of those, forever.
 * When a completed unlock of a given ciphertext is measured over budget, that
 * exact ciphertext is quarantined: any later attempt on it fails immediately
 * with {@link CONSTITUTION_SECRET_UNLOCK_TIMEOUT}, which the revision authority
 * classifies as unauthenticated and the service turns into the degrade path.
 *
 * The quarantine is keyed on the ciphertext rather than tripping a global
 * breaker on purpose. The degrade path's whole job is to seal and then read a
 * REPLACEMENT ring; a global breaker would make the replacement unreadable too
 * and convert one recoverable failure into a permanent one.
 *
 * `encryptString` is not gated for the same reason: the degrade path has to
 * mint a fresh ring for the turn to proceed.
 */
export function withConstitutionSecretUnlockBudget(
  backend: ConstitutionArchiveSecretBackend,
  options: ConstitutionSecretUnlockBudgetOptions = {}
): ConstitutionArchiveSecretBackend {
  const budgetMs = options.budgetMs ?? CONSTITUTION_SECRET_UNLOCK_BUDGET_MS;
  const now = options.now ?? (() => Date.now());
  // Bounded: this is a quarantine list for pathological blobs, not a cache.
  const quarantined = new Set<string>();

  return {
    encryptString: (plaintext: string) => backend.encryptString(plaintext),
    decryptString: (ciphertext: string) => {
      if (quarantined.has(ciphertext)) throw new Error(CONSTITUTION_SECRET_UNLOCK_TIMEOUT);
      const startedAt = now();
      try {
        return backend.decryptString(ciphertext);
      } finally {
        const elapsed = now() - startedAt;
        if (elapsed >= budgetMs) {
          if (quarantined.size >= 8) quarantined.clear();
          quarantined.add(ciphertext);
          options.onBudgetExceeded?.(elapsed);
        }
      }
    },
  };
}
