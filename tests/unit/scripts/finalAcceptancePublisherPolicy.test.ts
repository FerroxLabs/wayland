import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

type PublisherPolicy = {
  id: string;
  status: string;
  releaseTag: string;
  repository: string;
};

const { CORE_PUBLISHER_REPOSITORY, DEFAULT_VERIFIERS, TARGETS, selectActiveCorePolicy } =
  require('../../../scripts/release-acceptance/verifyFinalAcceptance') as {
    CORE_PUBLISHER_REPOSITORY: string;
    DEFAULT_VERIFIERS: { expectedPublisherAssets: () => Array<{ asset: string; sha256: string }> };
    TARGETS: string[];
    selectActiveCorePolicy: (document: unknown) => PublisherPolicy;
  };

// The real, shipping policy document - not a fixture. The regression this file
// guards is a change to THIS file (Nano's v0.1.1 policy became active alongside
// wayland-core's), so a hand-written copy would not have caught it.
const SHIPPING_POLICY = require('../../../scripts/supply-chain/publisher-attestations.json') as {
  contract: string;
  policies: PublisherPolicy[];
};

const SHIPPING_SHASUMS = require('../../../scripts/bundled-wcore-shasums.json') as Record<
  string,
  Record<string, unknown>
>;

function policy(...policies: Array<Partial<PublisherPolicy>>): { contract: string; policies: PublisherPolicy[] } {
  return {
    contract: 'wayland-publisher-attestations/1.0',
    policies: policies.map((entry, index) => ({
      id: `policy-${index}`,
      status: 'active',
      releaseTag: `v9.9.${index}`,
      repository: CORE_PUBLISHER_REPOSITORY,
      ...entry,
    })),
  };
}

const roots: string[] = [];
const original = process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;

function git(root: string, ...args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

// Mirrors tests/unit/scripts/acceptanceCandidateRoot.test.ts: the candidate root
// must be spelled the way Git spells it, because productionCandidateRoot compares
// it against `rev-parse --show-toplevel`.
function candidateRepository(shasums: unknown): string {
  const allocated = mkdtempSync(join(tmpdir(), 'wayland-publisher-policy-'));
  roots.push(allocated);
  git(allocated, 'init', '--quiet');
  const root = resolve(git(allocated, 'rev-parse', '--show-toplevel'));
  git(root, 'config', 'user.email', 'publisher-policy@example.test');
  git(root, 'config', 'user.name', 'Publisher Policy Test');
  mkdirSync(join(root, 'scripts'), { recursive: true });
  writeFileSync(join(root, 'scripts', 'bundled-wcore-shasums.json'), `${JSON.stringify(shasums, null, 2)}\n`);
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'candidate');
  return root;
}

afterEach(() => {
  if (original === undefined) delete process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;
  else process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = original;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('active core publisher policy selection', () => {
  it('picks the one active wayland-core release out of the real shipping policy', () => {
    // Bundling Nano put a second legitimately-active policy in this document.
    // A status-only filter with a length-1 check fails here, which is exactly
    // how the release gate broke; this assertion is the guard against it.
    const active = SHIPPING_POLICY.policies.filter((entry) => entry.status === 'active');
    expect(active.length).toBeGreaterThan(1);
    expect(active.map((entry) => entry.repository)).toContain('FerroxLabs/wayland-nano');

    const selected = selectActiveCorePolicy(SHIPPING_POLICY);
    expect(selected.repository).toBe(CORE_PUBLISHER_REPOSITORY);
    expect(selected.status).toBe('active');
    // The tag the desktop actually bundles must be the one selected.
    expect(selected.releaseTag).toBe(require('../../../scripts/prepareWaylandCore.js').DEFAULT_WCORE_VERSION);
  });

  it('refuses to treat Nano as the core release when no core release is active', () => {
    expect(() =>
      selectActiveCorePolicy(policy({ repository: 'FerroxLabs/wayland-nano' }, { status: 'superseded' }))
    ).toThrow(/M8A_PUBLISHER_ATTESTATION_INVALID:no-unique-active-core-release/);
  });

  it('still rejects two active core releases', () => {
    expect(() => selectActiveCorePolicy(policy({}, {}))).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:no-unique-active-core-release/
    );
  });

  it('still rejects a document with no active core release at all', () => {
    expect(() => selectActiveCorePolicy(policy({ status: 'superseded' }))).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:no-unique-active-core-release/
    );
  });

  it('fails closed on an active publisher from an unexpected repository', () => {
    // The dangerous shape: exactly one active policy, so a naive count check
    // passes it, but the publisher is not one this release knows about.
    expect(() => selectActiveCorePolicy(policy({ repository: 'attacker/wayland-core' }))).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:unexpected-active-publisher/
    );
    // And it is rejected even when a legitimate core release is present, so an
    // unknown publisher can never ride along beside a valid one.
    expect(() => selectActiveCorePolicy(policy({}, { repository: 'attacker/wayland-nano' }))).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:unexpected-active-publisher/
    );
    expect(() => selectActiveCorePolicy(policy({}, { repository: undefined as unknown as string }))).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:unexpected-active-publisher/
    );
  });

  it('fails closed on an unreadable policy document', () => {
    expect(() => selectActiveCorePolicy({ contract: 'wayland-publisher-attestations/1.0' })).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:publisher-policy-unreadable/
    );
  });
});

describe('expected publisher assets against the shipping policy', () => {
  it('resolves the full core target coverage from the selected release tag', () => {
    const tag = selectActiveCorePolicy(SHIPPING_POLICY).releaseTag;
    process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = candidateRepository({ [tag]: SHIPPING_SHASUMS[tag] });

    const assets = DEFAULT_VERIFIERS.expectedPublisherAssets();
    expect(assets).toHaveLength(TARGETS.length);
    for (const asset of assets) expect(asset.sha256).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('fails closed when the candidate carries no assets for the selected release tag', () => {
    process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = candidateRepository({ 'v0.0.0-absent': {} });

    expect(() => DEFAULT_VERIFIERS.expectedPublisherAssets()).toThrow(
      /M8A_PUBLISHER_ATTESTATION_INVALID:core-release-target-coverage-mismatch/
    );
  });
});
