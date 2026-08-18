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
/** windows-11-arm cannot authenticate actions/checkout's ssh-key mode, so that
 *  one image clones explicitly instead. The pair below must stay a TOTAL and
 *  MUTUALLY EXCLUSIVE split - see the skip-is-a-pass test at the bottom. */
const ARM64_CHECKOUT_STEP = 'Checkout @wayland MCP connector sources (windows-arm64)';
const ARM64_ONLY = "runner.os == 'Windows' && runner.arch == 'ARM64'";
const NOT_ARM64 = `!(${ARM64_ONLY})`;

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
    arm64Checkout: steps.find((step) => step.name === ARM64_CHECKOUT_STEP),
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

  it.each(withCheckout.map((entry) => [entry.file, entry] as const))(
    '%s retries the connector bun install and still fails after 3 attempts',
    (_file, entry) => {
      const run = entry.relocate?.run ?? '';
      // House retry idiom (pr-checks.yml): bounded attempts, and a trailing
      // non-zero exit so a retry cannot mask a genuine failure.
      expect(run).toContain('for attempt in 1 2 3; do');
      expect(run).toContain('if bun install --frozen-lockfile; then exit 0; fi');
      expect(run.trimEnd().endsWith('exit 1')).toBe(true);
    }
  );

  // SKIP-IS-A-PASS: on GitHub a skipped required check counts as a PASS, and a
  // continue-on-error step reports success. No connector step may acquire
  // either - a #940 gate that can be skipped is not a gate.
  //
  // The checkout is allowed to exist as a PAIR, because windows-11-arm cannot
  // authenticate actions/checkout's ssh-key mode and clones explicitly instead.
  // That is only safe while the pair is TOTAL and MUTUALLY EXCLUSIVE: the two
  // conditions must be exact complements, so every platform runs exactly one of
  // them and none can fall through the gap into a connector-less build. Pinning
  // the literal strings is deliberate - a third condition, a widened guard or a
  // typo in either one all break the complement and fail here.
  it.each(withCheckout.map((entry) => [entry.file, entry] as const))(
    '%s runs exactly one connector checkout on every platform, fail-closed',
    (_file, entry) => {
      if (entry.arm64Checkout) {
        expect(entry.checkout?.if).toBe(NOT_ARM64);
        expect(entry.arm64Checkout.if).toBe(ARM64_ONLY);
      } else {
        // No split in this workflow, so the single checkout must be unguarded.
        expect(entry.checkout?.if).toBeUndefined();
      }
      // The relocate step consumes whichever checkout ran and is never guarded.
      expect(entry.relocate?.if).toBeUndefined();
      for (const step of [entry.checkout, entry.arm64Checkout, entry.relocate]) {
        if (step) expect(step['continue-on-error']).toBeUndefined();
      }
    }
  );

  // The arm64 clone is the one checkout that cannot express its pin through
  // `with.ref`, so it has to assert the same thing in shell. Without this it
  // could silently drift onto the default branch - the exact #940 failure.
  it.each(
    parsed.filter((entry) => entry.arm64Checkout).map((entry) => [entry.file, entry] as const)
  )('%s pins the windows-arm64 clone to the same WAYLANDMCP_REF', (_file, entry) => {
    const run = entry.arm64Checkout?.run ?? '';
    expect(entry.arm64Checkout?.shell).toBe('bash');
    expect(run).toContain('git fetch --depth 1 origin "$WAYLANDMCP_REF"');
    expect(run).toContain('git checkout --detach FETCH_HEAD');
    expect(run).toContain('FerroxLabs/waylandmcp.git');
  });

  it('keeps the windows-arm64 clone bodies byte-identical', () => {
    const bodies = parsed.filter((entry) => entry.arm64Checkout).map((entry) => entry.arm64Checkout?.run);
    expect(bodies.length).toBeGreaterThan(0);
    expect(new Set(bodies).size).toBe(1);
  });
});
