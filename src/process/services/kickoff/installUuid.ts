/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'node:os';
import { uuid } from '@/common/utils';
import { ProcessConfig } from '@process/utils/initStorage';
import { hashSeed } from './seededShuffle';

/**
 * Persistent install-scoped identifier used to seed the SuggestionEngine's
 * deterministic per-day shuffle. The seed shape is
 * `hash(installUuid + assistantId + dateKey)` - without persistent entropy
 * here, every fresh install would collapse to the same shuffle on day 1
 * across the entire user base (cross-audit dealbreaker #1).
 *
 * Despite the name, the value is NOT an RFC 4122 UUID - it is a 32-char
 * random hex string from `@/common/utils.uuid(32)`. The seeded shuffle
 * only needs collision resistance across installs, not RFC compliance.
 *
 * The value is generated once and stored in ConfigStorage under
 * `app.installUuid`. Subsequent calls within the same process round-trip
 * the cached value so the storage adapter only takes the one write.
 *
 * v0.4.7.1 (IPC-1) - when `ProcessConfig.set` fails persistently (read-only
 * volume, EROFS, ENOSPC, AV quarantine on `wayland-config.txt`), the
 * previous implementation cached the fresh UUID in-process and re-minted
 * a different one on every subsequent launch. That silently defeated the
 * "fresh installs don't collapse" guarantee for the small but real cohort
 * of users on degraded hosts. The current implementation falls back to a
 * host-stable seed (`hostname + username`-derived 32-char hex string) so
 * the value stays stable across launches even when persistence fails.
 */

let cached: string | null = null;
let inFlight: Promise<string> | null = null;

const INSTALL_UUID_KEY = 'app.installUuid';
const INSTALL_UUID_LENGTH = 32;

export async function getInstallUuid(): Promise<string> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const existing = await ProcessConfig.get(INSTALL_UUID_KEY);
      if (typeof existing === 'string' && existing.length > 0) {
        cached = existing;
        inFlight = null;
        return existing;
      }
    } catch (err) {
      console.warn('[kickoff.installUuid] read failed; will mint fresh', err);
    }

    const fresh = uuid(INSTALL_UUID_LENGTH);
    let value = fresh;
    try {
      await ProcessConfig.set(INSTALL_UUID_KEY, fresh);
    } catch (err) {
      // Persistent storage failure (read-only volume, EROFS, ENOSPC, AV
      // quarantine). Fall back to a host-stable seed so the value stays
      // the same across launches on this host even though we can't
      // persist anything. The seeded shuffle's per-install determinism
      // guarantee survives the degraded host case.
      console.warn(
        '[kickoff.installUuid] persist failed; falling back to host-stable seed',
        err
      );
      value = hostStableSeed();
    }
    cached = value;
    inFlight = null;
    return value;
  })();

  return inFlight;
}

/**
 * Derive a 32-char hex string from host identity. Stable across launches on
 * the same machine, distinct across machines. Used as the last-resort seed
 * when `ProcessConfig.set` fails persistently - keeps the seeded-shuffle
 * determinism property alive for users on read-only / sandboxed hosts.
 *
 * NOT cryptographically meaningful - this only feeds the per-day rotation
 * seed, not any auth or secret derivation path.
 */
function hostStableSeed(): string {
  let host = '';
  try {
    host = os.hostname();
  } catch {
    /* fall through */
  }
  let user = '';
  try {
    user = os.userInfo().username;
  } catch {
    /* fall through */
  }
  const input = `${host}:${user}:${process.platform}`;
  // Stretch a 32-bit hash into 32 hex chars by chained re-hashing so we get
  // distinct-looking entropy across the full string, not just 8 repeated chars.
  const a = hashSeed(input).toString(16).padStart(8, '0');
  const b = hashSeed(`${input}:b`).toString(16).padStart(8, '0');
  const c = hashSeed(`${input}:c`).toString(16).padStart(8, '0');
  const d = hashSeed(`${input}:d`).toString(16).padStart(8, '0');
  return `${a}${b}${c}${d}`.slice(0, INSTALL_UUID_LENGTH);
}

/** Test-only - clear cached value so the next call re-reads from ConfigStorage. */
export function __resetInstallUuidCacheForTests(): void {
  cached = null;
  inFlight = null;
}
