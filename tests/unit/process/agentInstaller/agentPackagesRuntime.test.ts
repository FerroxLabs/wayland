/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE CATALOGUE MAY NOT OFFER AN AGENT THE PACKAGED BUILD CANNOT RUN.
 *
 * `openclaw` was offered for install and could never have worked on a clean
 * machine. Three facts compose into that, and each is checked here:
 *
 *  1. A pure-JS agent launches through `resolveJsRuntime()`, which in a PACKAGED
 *     build returns the bundled Bun whenever one is present. Asserted by driving
 *     the resolver, not by reading it.
 *  2. `launchSpecResolver` has no runtime-compatibility gate: it emits
 *     `{ command: <runtime>, args: [<entry>] }` for any `.js`/`.mjs`/`.cjs` bin.
 *     Nothing downstream re-checks either.
 *  3. `openclaw` REFUSES to run on Bun. Measured, not assumed:
 *
 *       $ bun openclaw.mjs --version
 *       openclaw: the Bun runtime is unsupported because OpenClaw requires
 *       node:sqlite.
 *       Use Node.js >=22.22.3 <23, >=24.15.0 <25, or >=25.9.0; Bun remains
 *       supported for installs and package scripts.
 *       exit 1
 *
 *       $ node openclaw.mjs --version      # node v22.23.1
 *       OpenClaw 2026.7.1-2 (0790d9f)
 *       exit 0
 *
 * So a Wayland-installed openclaw on a machine with no Node was GUARANTEED to
 * fail. It is out of the band. Detection of a SYSTEM openclaw is a different
 * code path (`AgentRegistry`) and is untouched: a user who already has it, and
 * therefore already has a Node that satisfies its engines, keeps it.
 *
 * The record of WHY lives in `BUN_INCOMPATIBLE_PACKAGES` below rather than only
 * in this comment, so re-adding the entry turns this suite red instead of
 * shipping the same dead card again.
 *
 * IT LIVES HERE, NOT IN src. It used to be exported from `agentPackages.ts`
 * with zero production consumers: nothing in install or launch ever consulted
 * it, so shipping it did not stop a Bun-incompatible agent reaching a user, it
 * only made re-adding openclaw turn this suite red. Wiring it into
 * `installAgent` instead would be a refusal that can never fire in a shipped
 * build — `AGENT_PACKAGES` is a frozen compile-time constant and no runtime
 * path can add to it, so only a developer editing that file can create the
 * condition, and a developer editing that file is exactly who this suite is
 * for. The catalogue-authoring guard is kept; the dead runtime code is not.
 */

import { describe, expect, it } from 'vitest';

import { AGENT_PACKAGES, type AgentPackage } from '@process/services/agentInstaller/agentPackages';
import { resolveJsRuntimeWith } from '@process/utils/jsRuntime';

/**
 * Packages whose launch target REFUSES to run on Bun, keyed by npm package name
 * and valued with the `engines.node` the package declares.
 *
 * A pure-JS agent launches through `resolveJsRuntime()`, which in a PACKAGED
 * build answers `bundled-bun` whenever a bundled bun exists — which is every
 * build that has one, and the install band is disabled entirely on the builds
 * that do not. Nothing between the catalogue and the spawn re-checks
 * compatibility: `launchSpecResolver` emits `{ command: <runtime>, args:
 * [<entry>] }` for any `.js`/`.mjs`/`.cjs` bin and asks no further questions. So
 * an entry listed here, installed by Wayland on a machine with no Node, is
 * guaranteed to fail at launch.
 *
 * `openclaw` is here because it was MEASURED, not inferred — see the header.
 *
 * Detection of a SYSTEM openclaw is a different code path and is deliberately
 * untouched: a user who already has it also already has a Node that satisfies
 * the range below.
 */
const BUN_INCOMPATIBLE_PACKAGES: Readonly<Record<string, string>> = Object.freeze({
  openclaw: '>=22.22.3 <23 || >=24.15.0 <25 || >=25.9.0',
});

/**
 * Catalogue ids whose package is recorded as refusing Bun. Must be empty: a
 * non-empty answer means the band is offering an install that cannot launch on
 * a packaged build.
 *
 * Takes the catalogue as a parameter, defaulting to the real one, so the suite
 * can prove the matcher finds a known positive rather than trusting an empty
 * list.
 */
function bunIncompatibleCatalogueEntries(catalogue: Readonly<Record<string, AgentPackage>> = AGENT_PACKAGES): string[] {
  return Object.entries(catalogue)
    .filter(([, pkg]) => Object.prototype.hasOwnProperty.call(BUN_INCOMPATIBLE_PACKAGES, pkg.npmPackage))
    .map(([agentId]) => agentId);
}

describe('the install band', () => {
  it('offers exactly the agents a packaged build can run', () => {
    expect(Object.keys(AGENT_PACKAGES)).toEqual(['codex', 'kimi']);
  });
});

describe('a packaged build launches JS agents on the bundled Bun', () => {
  it('resolves to bundled-bun whenever a bundled bun exists', () => {
    // Fact 1, by execution. This is the runtime every catalogued JS agent gets.
    const resolved = resolveJsRuntimeWith({
      isPackaged: true,
      bundledBunPath: '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun',
      execPath: '/Applications/Wayland.app/Contents/MacOS/Wayland',
      platform: 'darwin',
    });
    expect(resolved.kind).toBe('bundled-bun');
    expect(resolved.command).toContain('bun');
  });

  it('falls back to system node only when there is no bundled bun', () => {
    // The control for the assertion above: the same call CAN answer something
    // other than bundled-bun, so the first result is a real result.
    const resolved = resolveJsRuntimeWith({
      isPackaged: true,
      bundledBunPath: null,
      execPath: '/Applications/Wayland.app/Contents/MacOS/Wayland',
      platform: 'darwin',
    });
    expect(resolved.kind).toBe('system-node');
  });
});

describe('THE GUARD: no catalogued agent may be Bun-incompatible', () => {
  it('the catalogue contains no package recorded as refusing Bun', () => {
    // Goes RED the moment openclaw (or any other measured Bun refuser) is put
    // back into AGENT_PACKAGES.
    expect(bunIncompatibleCatalogueEntries()).toEqual([]);
  });

  it('the record of what refuses Bun is not empty, so the guard is not vacuous', () => {
    // A guard that scans an empty denylist always passes. This is the control:
    // the denylist has a real entry, measured by running the binary.
    expect(Object.keys(BUN_INCOMPATIBLE_PACKAGES).length).toBeGreaterThan(0);
    expect(BUN_INCOMPATIBLE_PACKAGES.openclaw).toBeDefined();
  });

  it('the guard detects a Bun-incompatible entry when one is present', () => {
    // Proves the matcher finds a KNOWN POSITIVE, so the empty result above is
    // an absence rather than a broken lookup.
    const withOpenclaw = {
      ...AGENT_PACKAGES,
      openclaw: { npmPackage: 'openclaw', version: '2026.7.1-2', cliCommand: 'openclaw' },
    };
    expect(bunIncompatibleCatalogueEntries(withOpenclaw)).toEqual(['openclaw']);
  });
});
