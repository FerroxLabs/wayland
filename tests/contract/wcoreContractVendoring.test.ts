/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The vendored corpus must be byte-identical to what Core generated.
 *
 * We do not take `manifest.json`'s word for it: the digests travel inside the
 * file they describe, so a corrupted or hand-edited corpus with a matching
 * manifest would pass any check that only compares strings. Instead we
 * recompute Core's `fixture_digest` / `schema_digest` from the bytes on disk
 * using a port of `wcore-protocol/src/contract/canonical.rs`, and require the
 * recomputation to land on the digest Core published.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildGenerated, corpusDigests, readTree } from '../../scripts/vendor-wcore-contract.mjs';
import generated from '../../src/process/agent/wcore/contract/generated/wcoreContract.generated.json';

const CORPUS = join(__dirname, '../../resources/wcore-contract/v1');
const manifest = JSON.parse(readFileSync(join(CORPUS, 'manifest.json'), 'utf8'));

describe('vendored wcore contract corpus', () => {
  const tree = readTree(CORPUS);

  it('recomputes the fixture and schema digests Core published', () => {
    const { fixtureDigest, schemaDigest, fixtureCount } = corpusDigests(tree);
    expect(fixtureDigest).toBe(manifest.fixture_digest);
    expect(schemaDigest).toBe(manifest.schema_digest);
    expect(fixtureCount).toBe(manifest.counts.fixtures);
  });

  it('detects a single mutated fixture byte', () => {
    // Control for the test above: prove the digest is actually load-bearing
    // rather than a tautology that would pass over any tree.
    const tampered = tree.map(([path, bytes]) =>
      path === 'events/execution_policy.json'
        ? ([path, Buffer.from(bytes.toString('utf8').replace('"required"', '"disabled"'))] as const)
        : ([path, bytes] as const)
    );
    expect(corpusDigests(tampered).fixtureDigest).not.toBe(manifest.fixture_digest);
  });

  it('keeps the generated runtime artifact in sync with the corpus', () => {
    expect(buildGenerated(tree)).toEqual(generated);
  });

  it('carries the whole declared inventory', () => {
    expect(manifest.events).toHaveLength(manifest.counts.events);
    expect(manifest.commands).toHaveLength(manifest.counts.commands);
    expect(Object.keys(generated.eventCriticality)).toHaveLength(manifest.counts.events);
  });
});
