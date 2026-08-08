/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-01 Task 3: bun `--preload` shim so `globalProfileWriteHarness.ts` can
 * import the REAL, unmodified `envBuilder.ts` (for `appendDesktopMcpProfile`)
 * outside the Electron process.
 *
 * `envBuilder.ts` transitively imports `@process/secrets`, which imports
 * `safeStorage` from the real `electron` npm package. That package's
 * `index.js` (`node_modules/electron/index.js`) is `module.exports =
 * <path-to-the-electron-binary-string>` - a plain string, never an object
 * with a `safeStorage` property, until the code is actually loaded BY the
 * Electron binary. Running the harness with plain `bun <file>.ts` therefore
 * fails before a single line of the harness runs, with a Bun-side static
 * "Export named 'safeStorage' not found" error.
 *
 * The rest of this repo's test suite already carries an equivalent shim for
 * the SAME reason - every Vitest file that transitively imports Electron
 * stubs it via `vi.mock('electron', () => ({...}))` (see e.g.
 * `tests/integration/hub-install-flow.test.ts`). This is the identical shim,
 * expressed as a Bun module-mock plugin (`Bun.plugin` + `build.module`)
 * instead of a Vitest mock, since the harness runs as a real standalone `bun`
 * process, not under Vitest.
 *
 * `isEncryptionAvailable()` in `safeStorage.ts` already treats
 * `safeStorage?.isEncryptionAvailable` being missing as "unavailable" via
 * optional chaining - the harness never calls into encryption at all, so an
 * empty stub is sufficient; this file exists purely to satisfy module
 * resolution, not to exercise any Electron behavior.
 */
import { plugin } from 'bun';

plugin({
  name: 'electron-stub-for-standalone-harness',
  setup(build) {
    build.module('electron', () => ({
      // Bun statically validates named ESM imports even against a
      // plugin-provided module, so every named export any transitively
      // imported production file destructures from `electron` must be
      // present as a KEY here (its value is never used - see file header).
      exports: { safeStorage: undefined, app: undefined },
      loader: 'object',
    }));
  },
});
