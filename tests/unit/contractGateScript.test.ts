/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REQUIRED_CONTRACT_TESTS = [
  'tests/unit/process/agent/wcore/desktopContractV1.test.ts',
  'tests/unit/fluxRoutingEvidence.test.ts',
  'tests/unit/process/flux/FluxRoutingEvidenceAdapter.test.ts',
  'tests/unit/wcoreStderrSurfacing.test.ts',
] as const;

describe('test:contract aggregate gate', () => {
  it('names every authoritative Desktop producer-consumer suite and cannot pass with no tests', () => {
    const root = process.cwd();
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      scripts?: Record<string, unknown>;
    };
    const command = packageJson.scripts?.['test:contract'];

    expect(typeof command).toBe('string');
    if (typeof command !== 'string') throw new Error('test:contract must be a string');
    const tokens = command.trim().split(/\s+/u);
    expect(tokens).toEqual(['vitest', 'run', ...REQUIRED_CONTRACT_TESTS]);
    for (const relative of REQUIRED_CONTRACT_TESTS) {
      expect(fs.statSync(path.join(root, relative)).isFile()).toBe(true);
    }
  });
});
