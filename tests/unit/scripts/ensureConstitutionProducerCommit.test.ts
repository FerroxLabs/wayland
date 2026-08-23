/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ensure = require('../../../scripts/ensureConstitutionProducerCommit.js') as {
  readProducerCommit: (manifestPath?: string) => string;
  hasProducerCommit: (commit: string, cwd?: string) => boolean;
  MANIFEST_PATH: string;
};

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

describe('Constitution producer commit probe', () => {
  it('reads the producer commit the provenance assertion demands, as a full 40-hex sha', () => {
    const commit = ensure.readProducerCommit();
    expect(commit).toMatch(/^[0-9a-f]{40}$/);
    // The fixture directory name and the vendored provenance record must agree
    // with the manifest; a probe that fetched some other commit would authenticate
    // nothing.
    expect(ensure.MANIFEST_PATH).toContain(`base-${commit.slice(0, 7)}-committed`);
  });

  it('KNOWN POSITIVE: the probe reports true for a commit this clone certainly has', () => {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    expect(ensure.hasProducerCommit(head, REPO_ROOT)).toBe(true);
  });

  it('reports false in a clone that does not carry the object, instead of throwing', () => {
    // An empty repository, not a bare directory: git searches parent directories,
    // so only an explicit repo boundary makes this deterministic on every platform.
    const elsewhere = mkdtempSync(path.join(os.tmpdir(), 'producer-probe-empty-'));
    try {
      execFileSync('git', ['init', '--quiet'], { cwd: elsewhere, stdio: 'pipe' });
      const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      // Same sha, same probe, opposite answer: the difference is the clone, which
      // is exactly the condition postinstall and the provenance test react to.
      expect(ensure.hasProducerCommit(head, REPO_ROOT)).toBe(true);
      expect(ensure.hasProducerCommit(head, elsewhere)).toBe(false);
    } finally {
      rmSync(elsewhere, { recursive: true, force: true });
    }
  });

  it('reports false for a well-formed sha that exists nowhere', () => {
    expect(ensure.hasProducerCommit('0'.repeat(40), REPO_ROOT)).toBe(false);
  });
});
