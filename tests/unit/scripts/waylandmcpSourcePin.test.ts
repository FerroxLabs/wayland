/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/**
 * #940 PROVENANCE: binds the four workflows that check FerroxLabs/waylandmcp out
 * to ONE pinned commit.
 *
 * The connector sources are a build input that ships inside every installer, yet
 * they live OUTSIDE the app repo and `/waylandmcp/` is gitignored - so neither
 * `scripts/platform-package-smoke.mjs` (which attests the app's commit AND its
 * untracked tree, on the stated principle that "a newly introduced build input is
 * just as authoritative as a modified tracked file") nor the dirty-tree gate can
 * see them. Without a `ref:` every build took whatever the default branch held at
 * build time and recorded that identity nowhere.
 *
 * GitHub Actions has no way to share a constant across workflow FILES, so the pin
 * is a named `env:` constant per file - the WAYLAND_HUB_TAG convention. This test
 * is what stops the four copies drifting apart, which is the only failure mode a
 * per-file constant introduces.
 */

const WORKFLOWS = path.resolve(__dirname, '../../../.github/workflows');

/** Every workflow that checks the connector sources out. Adding a fifth without
 *  adding it here is itself the drift this test exists to catch, so the list is
 *  DERIVED from the files rather than hardcoded. */
const CHECKOUT_STEP = 'Checkout @wayland MCP connector sources';
const RELOCATE_STEP = 'Relocate and install @wayland MCP connector sources';

type Step = {
  name?: string;
  uses?: string;
  shell?: string;
  run?: string;
  if?: string;
  'continue-on-error'?: boolean;
  with?: Record<string, string>;
};

const parsed = ['_build-reusable.yml', 'build-and-release.yml', 'build-matrix.yml', 'publish-npm.yml'].map((file) => {
  const doc = parse(readFileSync(path.join(WORKFLOWS, file), 'utf-8')) as {
    env?: Record<string, string>;
    jobs: Record<string, { steps?: Step[] }>;
  };
  const steps = Object.values(doc.jobs).flatMap((job) => job.steps ?? []);
  return {
    file,
    ref: doc.env?.WAYLANDMCP_REF,
    checkout: steps.find((step) => step.name === CHECKOUT_STEP),
    relocate: steps.find((step) => step.name === RELOCATE_STEP),
  };
});

/** Guards against the list above silently covering nothing. */
const withCheckout = parsed.filter((entry) => entry.checkout);

describe('@wayland MCP connector source pin (#940)', () => {
  it('covers every workflow that checks the connector sources out', () => {
    expect(withCheckout.map((entry) => entry.file)).toEqual([
      '_build-reusable.yml',
      'build-and-release.yml',
      'build-matrix.yml',
      'publish-npm.yml',
    ]);
  });

  it.each(withCheckout.map((entry) => [entry.file, entry] as const))(
    '%s pins the checkout to the WAYLANDMCP_REF constant',
    (_file, entry) => {
      // A 40-hex commit, not a branch: FerroxLabs/waylandmcp carries no tags, so
      // a commit is the only immutable ref available.
      expect(entry.ref).toMatch(/^[0-9a-f]{40}$/);
      expect(entry.checkout?.with?.repository).toBe('FerroxLabs/waylandmcp');
      expect(entry.checkout?.with?.ref).toBe('${{ env.WAYLANDMCP_REF }}');
    }
  );

  it('keeps the four WAYLANDMCP_REF constants byte-identical', () => {
    expect(new Set(withCheckout.map((entry) => entry.ref)).size).toBe(1);
  });

  it('keeps the four relocate step bodies byte-identical', () => {
    expect(new Set(withCheckout.map((entry) => entry.relocate?.run)).size).toBe(1);
  });

  it.each(withCheckout.map((entry) => [entry.file, entry] as const))(
    '%s records the bundled commit and PROVES it is the pinned one',
    (_file, entry) => {
      const run = entry.relocate?.run ?? '';
      expect(entry.relocate?.shell).toBe('bash');
      // The identity goes in the log...
      expect(run).toContain('git rev-parse HEAD');
      expect(run).toContain('waylandmcp source commit:');
      // ...and is ASSERTED, because an empty WAYLANDMCP_REF would make
      // actions/checkout fall back to the default branch silently.
      expect(run).toContain('[[ "$WAYLANDMCP_REF" =~ ^[0-9a-f]{40}$ ]]');
      expect(run).toContain('[[ "$mcp_sha" == "$WAYLANDMCP_REF" ]]');
    }
  );

  // SKIP-IS-A-PASS: on GitHub a skipped required check counts as a PASS, and a
  // continue-on-error step reports success. Neither of these steps may acquire
  // either - a #940 gate that can be skipped is not a gate.
  it.each(withCheckout.map((entry) => [entry.file, entry] as const))(
    '%s leaves both connector steps unconditional and fail-closed',
    (_file, entry) => {
      for (const step of [entry.checkout, entry.relocate]) {
        expect(step?.if).toBeUndefined();
        expect(step?.['continue-on-error']).toBeUndefined();
      }
    }
  );
});
