/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE WINDOWS PUBLISHER GATE MUST MATCH THE CERTIFICATE WE ACTUALLY SIGN WITH.
 *
 * produceNativeUpdaterObservation.mjs asserts that every Windows runtime in the
 * updater journey carries a valid Authenticode signature issued to Ferrox Labs.
 * The assertion was written as
 *
 *     /(?:^|,\s*)CN\s*=\s*Ferrox Labs(?:,|$)/
 *
 * and it could never match, because the real subject quotes a CN that itself
 * contains a comma. Read off the shipped v0.11.18 installer on a real Windows
 * machine:
 *
 *     Status  : Valid   (signature verified, Microsoft RSA timestamp present)
 *     Subject : CN="Ferrox Labs, LLC", O="Ferrox Labs, LLC", STREET=..., C=US
 *
 * After `CN=` comes a double quote, not `F`. So a perfectly valid Ferrox Labs
 * signature was rejected as an unverified publisher, and the release stopped on
 * an artifact that was correctly signed all along.
 *
 * It survived because no Windows leg had ever reached the check - the script's
 * own comment says as much - so it shipped, sat there, and fired the first time
 * the pipeline got that far. A pattern asserted against a string nobody ever fed
 * it is not a gate, it is a guess. This test feeds it the real one.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE = join(__dirname, '../../../scripts/release-acceptance/produceNativeUpdaterObservation.mjs');

/** The exact subject string Get-AuthenticodeSignature returns for our releases. */
const REAL_SUBJECT =
  'CN="Ferrox Labs, LLC", O="Ferrox Labs, LLC", STREET=100 Congress Ave - Suite 2000, ' +
  'L=Austin, S=Texas, C=US, PostalCode=78701';

function shippedPattern(): RegExp {
  const source = readFileSync(SOURCE, 'utf8');
  const match = source.match(/^const FERROX_LABS_CN = (\/.*\/);$/m);
  expect(match, 'FERROX_LABS_CN must be declared as a single-line regex literal').not.toBeNull();
  // Rebuild from the literal so the test binds to the shipped pattern itself
  // rather than to a copy that can drift away from it.
  const literal = match![1];
  const body = literal.slice(1, literal.lastIndexOf('/'));
  const flags = literal.slice(literal.lastIndexOf('/') + 1);
  return new RegExp(body, flags);
}

describe('windows publisher subject gate', () => {
  it('accepts the certificate subject our releases are actually signed with', () => {
    expect(shippedPattern().test(REAL_SUBJECT)).toBe(true);
  });

  it('still accepts an unquoted or re-issued subject', () => {
    expect(shippedPattern().test('CN=Ferrox Labs, O=Ferrox Labs, C=US')).toBe(true);
    expect(shippedPattern().test('CN="Ferrox Labs", O=Ferrox Labs, C=US')).toBe(true);
  });

  it('rejects a lookalike publisher', () => {
    const pattern = shippedPattern();
    // The failure this gate exists to catch: a CN that merely starts the same.
    expect(pattern.test('CN="Ferrox Labs Evil, LLC", O=x, C=US')).toBe(false);
    expect(pattern.test('CN=Ferrox Labsy, O=x, C=US')).toBe(false);
    expect(pattern.test('CN=Someone Else, O=x, C=US')).toBe(false);
    expect(pattern.test('O="Ferrox Labs, LLC", CN=Impostor')).toBe(false);
  });

  it('holds the candidate to the strict exit budget and only widens it for already-shipped runtimes', () => {
    const source = readFileSync(SOURCE, 'utf8');
    expect(source).toContain('const CANDIDATE_EXIT_TIMEOUT_MS = 10_000;');
    // initial (v0.11.18) and rollback (v0.11.8) predate the shutdown fix and
    // cannot be re-released to satisfy this gate; the candidate can and must.
    expect(source.match(/exitTimeoutMs: SHIPPED_RUNTIME_EXIT_TIMEOUT_MS/g)?.length).toBe(2);
    const reupgrade = source.slice(source.indexOf("label: 'reupgrade boot'"));
    expect(reupgrade.slice(0, 200)).not.toContain('exitTimeoutMs');
  });
});
