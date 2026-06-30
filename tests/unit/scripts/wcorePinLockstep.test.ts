/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards #451: the getwayland headless installer carries its OWN engine pin
 * (installer/scripts/postinstall.mjs WCORE_VERSION), separate from the Electron
 * bundle pin (scripts/prepareWaylandCore.js DEFAULT_WCORE_VERSION). The headless
 * pin silently drifted to a 2-minor-stale v0.10.0 because the bump tooling only
 * moved the Electron pin. These static-source assertions fail the build the
 * moment the two pins fall out of lockstep again - no network required.
 */

const ROOT = join(__dirname, '..', '..', '..');
const PREPARE = readFileSync(join(ROOT, 'scripts', 'prepareWaylandCore.js'), 'utf-8');
const POSTINSTALL = readFileSync(join(ROOT, 'installer', 'scripts', 'postinstall.mjs'), 'utf-8');

function bundlePin(): string {
  const m = PREPARE.match(/const DEFAULT_WCORE_VERSION = '([^']+)';/);
  expect(m, 'DEFAULT_WCORE_VERSION not found in prepareWaylandCore.js').toBeTruthy();
  return m![1];
}

function headlessPin(): string {
  const m = POSTINSTALL.match(/const WCORE_VERSION = '([^']+)';/);
  expect(m, 'WCORE_VERSION not found in postinstall.mjs').toBeTruthy();
  return m![1];
}

describe('wayland-core engine pin lockstep (#451)', () => {
  it('headless installer pin matches the Electron bundle pin', () => {
    expect(headlessPin()).toBe(bundlePin());
  });

  it('both pins are real vX.Y.Z release tags', () => {
    expect(headlessPin()).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(bundlePin()).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('headless installer builds the canonical release asset URL from the pin', () => {
    // Asset/URL must interpolate WCORE_VERSION so a pin bump actually changes
    // what gets fetched (regression guard against a stray hardcoded version).
    expect(POSTINSTALL).toContain('wayland-core-${WCORE_VERSION}-${triple}.tar.gz');
    expect(POSTINSTALL).toContain('github.com/FerroxLabs/wayland-core/releases/download/${WCORE_VERSION}/${asset}');
  });
});
