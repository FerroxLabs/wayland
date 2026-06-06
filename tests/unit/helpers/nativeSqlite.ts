/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'vitest';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';

/**
 * Shared gate for suites that need the native better-sqlite3 driver.
 *
 * better-sqlite3 is a native addon compiled for ONE ABI at a time:
 *  - LOCAL dev: postinstall runs `electron-builder install-app-deps`, building it
 *    for the ELECTRON ABI (the GUI needs it). It then fails to load under vitest's
 *    Node ABI with `NODE_MODULE_VERSION`, so these suites skip - a deliberate
 *    dev-convenience skip so a local `bun run test` stays green without a rebuild.
 *    (Run `npm rebuild better-sqlite3` to flip it to the Node ABI and run them.)
 *  - CI: postinstall SKIPS the electron rebuild (scripts/postinstall.js), so the
 *    Node-ABI prebuilt is what's installed, vitest runs under Node, the ABI
 *    matches, and these suites RUN.
 *
 * The hazard is that the skip is SILENT: if CI ever stopped shipping a loadable
 * Node-ABI binary, dozens of tests would vanish without a trace and a broken
 * build would look green. So when the module is unavailable IN CI we register a
 * hard-failing test instead of skipping - the coverage loss becomes impossible
 * to miss. Locally the skip is still allowed.
 */
function probeNativeSqlite(): boolean {
  try {
    const d = new BetterSqlite3Driver(':memory:');
    d.close();
    return true;
  } catch (e) {
    if (e instanceof Error && e.message.includes('NODE_MODULE_VERSION')) {
      // ABI mismatch - the one case we treat as a (locally-tolerable) skip.
      return false;
    }
    // Any other failure (module missing, load error) is NOT the ABI-skip case;
    // report available so the real suites run and surface it loudly in beforeEach.
    return true;
  }
}

export const nativeModuleAvailable = probeNativeSqlite();

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

/**
 * Drop-in replacement for `describe` in native-better-sqlite3 suites.
 * - module available        → runs normally
 * - unavailable & in CI      → one hard-failing test (no silent coverage loss)
 * - unavailable & local dev  → skipped (Electron-ABI build; rebuild to enable)
 */
export function describeNativeSqlite(name: string, fn: () => void): void {
  if (nativeModuleAvailable) {
    describe(name, fn);
    return;
  }
  if (isCI) {
    describe(name, () => {
      it(`requires the native better-sqlite3 module (must be loadable under the Node ABI in CI) - suite: ${name}`, () => {
        throw new Error(
          'better-sqlite3 is not loadable under the Node/vitest ABI in CI, so this native-backed ' +
            'suite would silently skip and lose coverage. Ensure the Node-ABI prebuilt is installed ' +
            '(postinstall must NOT electron-rebuild when CI=true). See tests/unit/helpers/nativeSqlite.ts.'
        );
      });
    });
    return;
  }
  describe.skip(name, fn);
}
