/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import authority from '../../../scripts/whatsapp-bridge-source.json';

/**
 * Binds the COMMITTED WhatsApp bridge source authority to the COMMITTED source
 * tree.
 *
 * `verifyPackagedResources.test.ts` already covers the verifier's logic
 * thoroughly, but every one of those cases builds a synthetic tree in a tmpdir
 * and hands the verifier a fabricated authority object. Nothing asserted that
 * the real manifest still describes the real files, and that gap is not
 * theoretical: an oxfmt pass over the branch delta reformatted
 * `backends/baileys.js` from 15,582 to 15,420 bytes, which invalidated the
 * authority and therefore EVERY packaged build - while tsc, all 15,760 unit
 * tests, and every pre-commit hook stayed green.
 *
 * The packaged verifier cannot fill this gap in a unit run: it needs
 * `--target-platform`, `--target-arch` and an assembled app. This test needs
 * none of that, so drift is caught in seconds instead of at build time.
 */
describe('WhatsApp bridge source authority', () => {
  const sourceRoot = path.resolve(__dirname, '../../../src/process/channels/whatsapp-bridge');
  const files = Object.entries(authority.files as Record<string, { size: number; sha256: string }>);

  it('declares the expected contract and a non-empty file set', () => {
    expect(authority.contract).toBe('wayland-whatsapp-bridge-source/1.0');
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('pins %s at its exact committed size and digest', (relative, expected) => {
    const absolute = path.join(sourceRoot, relative);
    const bytes = readFileSync(absolute);
    // Size is asserted separately from the digest so a drift report names the
    // dimension that moved, which is what makes a formatter change obvious.
    expect(statSync(absolute).size).toBe(expected.size);
    expect(bytes.byteLength).toBe(expected.size);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected.sha256);
  });
});
