/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression guard for GitHub #134: updateBridge threw i18n keys
 * (update.errors.githubApiFailed and 10 siblings) that were never defined in
 * en-US/update.json, so i18next returned the raw key string and users saw
 * literal "update.errors.githubApiFailed" in the update modal.
 *
 * This test extracts every `update.errors.*` key the bridge actually throws and
 * asserts each one is defined in the en-US locale (the source the main-process
 * i18n loads, and the fallback every other locale inherits via mergeWithFallback).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import updateLocale from '@renderer/services/i18n/locales/en-US/update.json';

describe('updateBridge i18n error keys (#134)', () => {
  it('defines every update.errors.* key the bridge throws', () => {
    const bridgeSource = fs.readFileSync(
      path.join(process.cwd(), 'src/process/bridge/updateBridge.ts'),
      'utf8'
    );

    const thrownKeys = new Set<string>();
    const re = /update\.errors\.([a-zA-Z0-9]+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(bridgeSource)) !== null) {
      thrownKeys.add(match[1]);
    }

    expect(thrownKeys.size).toBeGreaterThan(0);

    const defined = (updateLocale as { errors: Record<string, string> }).errors ?? {};
    const missing = [...thrownKeys].filter((k) => typeof defined[k] !== 'string');

    expect(missing, `Missing update.errors keys in en-US/update.json: ${missing.join(', ')}`).toEqual([]);
  });

  it('interpolates the status placeholder for the GitHub rate-limit error', () => {
    const defined = (updateLocale as { errors: Record<string, string> }).errors;
    // The bridge throws githubApiFailed with { status }; the message must surface it.
    expect(defined.githubApiFailed).toContain('{{status}}');
    expect(defined.hostNotAllowed).toContain('{{host}}');
  });
});
