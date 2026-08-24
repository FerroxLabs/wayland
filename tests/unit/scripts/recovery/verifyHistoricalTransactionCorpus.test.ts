import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const harness =
  require('../../../../scripts/recovery/verifyHistoricalTransactionCorpus.mjs') as HistoricalCorpusHarness;

const {
  REPO_ROOT,
  PRODUCER_COMMIT,
  loadManifest,
  verifyManifestIntegrity,
  verifyProvenance,
  verifyInventory,
  verifyBaseReplay,
  parseLedgerChain,
  classifyLedgerTransactions,
  runHistoricalTransactionCorpusVerification,
  sha256Prefixed,
  SOURCE_PATH,
} = harness;

type CorpusProvider = {
  list: () => string[];
  read: (rel: string) => Buffer;
  exists: (rel: string) => boolean;
};

interface HistoricalCorpusHarness {
  REPO_ROOT: string;
  PRODUCER_COMMIT: string;
  loadManifest: () => any;
  verifyManifestIntegrity: (manifest: any) => string;
  verifyProvenance: (
    manifest: any,
    opts: { provider: CorpusProvider; git?: boolean; gitSource?: { repoRoot: string; commit: string } }
  ) => {
    sourceBlobReDerived: boolean;
    sourceBlobReDerivationSkipped: string | null;
  };
  SOURCE_PATH: string;
  verifyInventory: (manifest: any, provider: CorpusProvider) => { fileCount: number };
  verifyBaseReplay: (base: any, provider: CorpusProvider) => unknown;
  parseLedgerChain: (text: string) => Array<Record<string, unknown>>;
  classifyLedgerTransactions: (
    entries: Array<Record<string, unknown>>
  ) => Array<{ transactionId: string; outcome: string }>;
  runHistoricalTransactionCorpusVerification: (opts?: {
    manifest?: any;
    provider?: CorpusProvider;
    git?: boolean;
  }) => any;
  sha256Prefixed: (bytes: Buffer | string) => string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** A mutable in-memory provider seeded from the real corpus on disk. */
function memoryProvider(): CorpusProvider & { store: Map<string, Buffer> } {
  const manifest = loadManifest();
  const corpusAbs = path.resolve(REPO_ROOT, manifest.corpusRoot);
  const store = new Map<string, Buffer>();
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else store.set(path.relative(corpusAbs, full).split(path.sep).join('/'), fs.readFileSync(full));
    }
  };
  walk(corpusAbs);
  return {
    store,
    list: () => [...store.keys()],
    read: (rel: string) => {
      const bytes = store.get(rel);
      if (!bytes) throw new Error(`missing ${rel}`);
      return bytes;
    },
    exists: (rel: string) => store.has(rel),
  };
}

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A REAL one-commit git repository carrying `SOURCE_PATH`, built here so the
 * blob re-derivation can be exercised on a machine whose clone does not carry
 * `PRODUCER_COMMIT`.
 *
 * It has to be built rather than borrowed. `PRODUCER_COMMIT` is on no remote
 * branch at all (`git branch -r --contains 991c502e...` names nothing), so it
 * is absent from every fresh clone and present only where a local branch or an
 * incidental pack happens to carry it. The Windows checkout answers
 * `fatal: could not get object info`; the author's Mac answers `commit`; the
 * Linux box answered BOTH, forty minutes apart, because another lane's fetch
 * dropped the dangling object into the shared pack. The verifier swallowed the
 * unreachable case and passed, so this guard was off wherever the object was
 * missing - and flipped state on its own where it was not.
 *
 * Content is written LF-only and the repo pins `core.autocrlf=false`, so the
 * committed blob bytes are identical on all three platforms and the expected
 * sha256 can be computed from the bytes we wrote rather than read back from the
 * thing under test.
 */
function producerRepo(contents: string): { repoRoot: string; commit: string; contentSha256: string } {
  const repoRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wl-producer-')));
  tempDirs.push(repoRoot);
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '--quiet');
  git('config', 'core.autocrlf', 'false');
  git('config', 'user.email', 'corpus-test@ferroxlabs.invalid');
  git('config', 'user.name', 'Corpus Test');
  const file = path.join(repoRoot, ...SOURCE_PATH.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents, 'utf8');
  git('add', '--', SOURCE_PATH);
  // --no-verify: a global core.hooksPath or init.templateDir would otherwise
  // run this repo's real pre-commit hooks inside a throwaway fixture.
  git('commit', '--quiet', '--no-gpg-sign', '--no-verify', '-m', 'producer');
  const commit = git('rev-parse', 'HEAD').trim();
  return { repoRoot, commit, contentSha256: sha256Prefixed(Buffer.from(contents, 'utf8')) };
}

const PENDING_TX = '55555555-5555-4555-8555-555555555555';
const COMMITTED_LEDGER = 'base-991c502-committed/archives/constitution-history/transaction-ledger.jsonl';
const PENDING_LEDGER = 'base-991c502-pending-ledger-only/archives/constitution-history/transaction-ledger.jsonl';

describe('historical transaction corpus verifier', () => {
  let manifest: any;

  beforeAll(() => {
    manifest = loadManifest();
  });

  it('accepts the real captured corpus and reports both crash points', () => {
    const report = runHistoricalTransactionCorpusVerification();
    expect(report).toMatchObject({
      contract: 'wayland-historical-transaction-corpus/1.0',
      ok: true,
      producerCommit: PRODUCER_COMMIT,
      fileCount: 36,
      capturedBases: 2,
      syntheticFiles: 0,
      committedTransactions: 6,
      pendingTransactions: 1,
      crashPoints: ['after-ledger-before-journal', 'committed'],
    });
  });

  it('re-derives the exact producer source blob through git, or SAYS it could not', () => {
    // This used to be a bare `.not.toThrow()`, which a verifier that silently
    // skipped the whole leg satisfied trivially. Assert on the reported outcome
    // instead: where the producer object is in the object database the digest
    // must match, and where it is not the report must SAY the leg did not run.
    const provenance = verifyProvenance(manifest, { provider: memoryProvider(), git: true });
    if (provenance.sourceBlobReDerived) {
      expect(provenance.sourceBlobReDerivationSkipped).toBeNull();
    } else {
      expect(provenance.sourceBlobReDerivationSkipped).toMatch(/producer blob unreachable in git/);
    }
  });

  // ── Provenance / reconstruction / cross-release ────────────────────────────

  it('rejects a corpus reconstructed under a different producer commit', () => {
    const candidate = clone(manifest);
    candidate.producer.commit = '0000000000000000000000000000000000000000';
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: false })).toThrow(/reconstruction/);
  });

  it('rejects a base pinned to a foreign producer commit (cross-release)', () => {
    const candidate = clone(manifest);
    candidate.bases[0].producerCommit = '1111111111111111111111111111111111111111';
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: false })).toThrow(
      /cross-release substitution/
    );
  });

  it('rejects a base built under a different protocol version (cross-release)', () => {
    const candidate = clone(manifest);
    candidate.bases[1].protocolVersion = 2;
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: false })).toThrow(
      /cross-release substitution/
    );
  });

  it('rejects synthetic evidence dressed as captured provenance', () => {
    const asBase = clone(manifest);
    asBase.bases[0].classification = 'synthetic';
    expect(() => verifyProvenance(asBase, { provider: memoryProvider(), git: false })).toThrow(/synthetic-as-captured/);

    const asCount = clone(manifest);
    asCount.classificationCounts.syntheticFiles = 1;
    expect(() => verifyProvenance(asCount, { provider: memoryProvider(), git: false })).toThrow(/synthetic/);
  });

  it('rejects a bound transaction source path other than the producer file', () => {
    const candidate = clone(manifest);
    candidate.source.path = 'src/process/services/constitution/other.ts';
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: false })).toThrow(
      /unexpected transaction source path/
    );
  });

  it('rejects a source blob digest that does not match the producer commit', () => {
    const producer = producerRepo('export const TRANSACTION_PROTOCOL = 1;\n');
    const candidate = clone(manifest);
    candidate.source.contentSha256 = `sha256:${'0'.repeat(64)}`;
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: true, gitSource: producer })).toThrow(
      /reconstruction/
    );
  });

  it('KNOWN-POSITIVE CONTROL: the same re-derivation ACCEPTS the matching digest', () => {
    // Without this the test above cannot tell "the digest was rejected" from
    // "git blew up and everything is rejected". Same repo, same code path, only
    // the declared digest differs.
    const producer = producerRepo('export const TRANSACTION_PROTOCOL = 1;\n');
    const candidate = clone(manifest);
    candidate.source.contentSha256 = producer.contentSha256;
    const provenance = verifyProvenance(candidate, {
      provider: memoryProvider(),
      git: true,
      gitSource: producer,
    });
    expect(provenance.sourceBlobReDerived).toBe(true);
    expect(provenance.sourceBlobReDerivationSkipped).toBeNull();
  });

  it('reports - rather than swallows - a producer blob git cannot reach', () => {
    // The fail-open that made this whole leg dead off macOS: an unreachable
    // object must not read as a passed check.
    const unreachable = { repoRoot: producerRepo('x\n').repoRoot, commit: '0'.repeat(40) };
    const candidate = clone(manifest);
    candidate.source.contentSha256 = `sha256:${'0'.repeat(64)}`;
    const provenance = verifyProvenance(candidate, {
      provider: memoryProvider(),
      git: true,
      gitSource: unreachable,
    });
    expect(provenance.sourceBlobReDerived).toBe(false);
    expect(provenance.sourceBlobReDerivationSkipped).toMatch(/producer blob unreachable in git/);
  });

  it('rejects a harness patch that mutates the transaction region', () => {
    const candidate = clone(manifest);
    candidate.harnessPatch.transactionRegionAfterSha256 = `sha256:${'a'.repeat(64)}`;
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: false })).toThrow(
      /not transaction-neutral/
    );
  });

  it('rejects harness patch bytes that drift from the sealed digest', () => {
    const provider = memoryProvider();
    provider.store.set('provenance/991c502-fixture-failpoint.patch', Buffer.from('tampered patch\n'));
    expect(() => verifyProvenance(manifest, { provider, git: false })).toThrow(/patch bytes drifted/);
  });

  // ── Manifest integrity ─────────────────────────────────────────────────────

  it('rejects an unknown critical manifest field', () => {
    const candidate = clone(manifest);
    candidate.injected = true;
    expect(() => verifyManifestIntegrity(candidate)).toThrow(/missing or unknown critical fields/);
  });

  it('rejects any manifest byte drift via the sealed digest', () => {
    const candidate = clone(manifest);
    candidate.classificationCounts.committedTransactions = 99;
    expect(() => verifyManifestIntegrity(candidate)).toThrow(/manifest digest drifted/);
  });

  // ── Whole-directory inventory ──────────────────────────────────────────────

  it('rejects a corpus missing a declared file', () => {
    const provider = memoryProvider();
    provider.store.delete('base-991c502-committed/CONSTITUTION.md');
    expect(() => verifyInventory(manifest, provider)).toThrow(/missing declared files/);
  });

  it('rejects a corpus with an undeclared extra file', () => {
    const provider = memoryProvider();
    provider.store.set('base-991c502-committed/injected.txt', Buffer.from('x'));
    expect(() => verifyInventory(manifest, provider)).toThrow(/undeclared extra files/);
  });

  it('rejects state drift in a retained transaction byte', () => {
    const provider = memoryProvider();
    const rel = 'base-991c502-committed/archives/constitution-history/transaction-ledger.jsonl';
    provider.store.set(rel, Buffer.concat([provider.read(rel), Buffer.from(' ')]));
    expect(() => verifyInventory(manifest, provider)).toThrow(/State drift/);
  });

  it('rejects a present forbidden file', () => {
    const provider = memoryProvider();
    provider.store.set('base-991c502-committed/revision-authority.enc', Buffer.from('legacy'));
    // extra-file inventory catches it first; both are fail-closed.
    expect(() => verifyInventory(manifest, provider)).toThrow(/extra files|Forbidden file/);
  });

  // ── Transaction-chain replay ───────────────────────────────────────────────

  it('parses and MAC-verifies the real committed ledger chain', () => {
    const provider = memoryProvider();
    const entries = parseLedgerChain(provider.read(COMMITTED_LEDGER).toString('utf8'));
    const chain = classifyLedgerTransactions(entries);
    expect(chain.map((t) => t.outcome)).toEqual(['committed', 'committed', 'committed']);
  });

  it('classifies the pending ledger as one trailing pending transaction', () => {
    const provider = memoryProvider();
    const chain = classifyLedgerTransactions(parseLedgerChain(provider.read(PENDING_LEDGER).toString('utf8')));
    expect(chain[chain.length - 1]).toMatchObject({ transactionId: PENDING_TX, outcome: 'pending' });
  });

  it('rejects a ledger gap (dropped chain link)', () => {
    const provider = memoryProvider();
    const lines = provider.read(COMMITTED_LEDGER).toString('utf8').split('\n').filter(Boolean);
    lines.splice(3, 1); // drop a chain link
    expect(() => parseLedgerChain(lines.join('\n'))).toThrow(/chain break/);
  });

  it('rejects a reordered ledger chain', () => {
    const provider = memoryProvider();
    const lines = provider.read(COMMITTED_LEDGER).toString('utf8').split('\n').filter(Boolean);
    [lines[1], lines[2]] = [lines[2], lines[1]]; // swap two entries
    expect(() => parseLedgerChain(lines.join('\n'))).toThrow(/chain break|gap or reordering/);
  });

  it('rejects a conflicting re-index of an already indexed transaction', () => {
    // Craft a self-consistent MAC chain (previousMac chained) with a duplicate
    // indexed state for the same transaction — a conflict, not a chain break.
    const entries = [
      { state: 'ledger', version: 1, mac: 'm0', previousMac: null },
      { state: 'indexed', transactionId: 'tx-a', mac: 'm1', previousMac: 'm0' },
      { state: 'indexed', transactionId: 'tx-a', mac: 'm2', previousMac: 'm1' },
    ];
    expect(() => classifyLedgerTransactions(entries)).toThrow(/conflict|out-of-order/);
  });

  it('rejects a post-terminal ledger event after a crashed transaction', () => {
    const entries = [
      { state: 'ledger', version: 1, mac: 'm0', previousMac: null },
      { state: 'indexed', transactionId: 'tx-a', mac: 'm1', previousMac: 'm0' },
      { state: 'indexed', transactionId: 'tx-b', mac: 'm2', previousMac: 'm1' },
    ];
    // tx-a is pending (indexed only) but tx-b appended after it.
    expect(() => classifyLedgerTransactions(entries)).toThrow(/Post-terminal|gap/);
  });

  it('rejects a pending transaction that grew a post-terminal receipt', () => {
    const provider = memoryProvider();
    const base = manifest.bases.find((b: any) => b.id === 'base-991c502-pending-ledger-only');
    provider.store.set(
      `base-991c502-pending-ledger-only/archives/constitution-history/receipts/${PENDING_TX}.json`,
      Buffer.from('{}')
    );
    expect(() => verifyBaseReplay(base, provider)).toThrow(/post-terminal receipt or journal/);
  });

  it('rejects a committed transaction whose receipt was removed', () => {
    const provider = memoryProvider();
    const base = manifest.bases.find((b: any) => b.id === 'base-991c502-committed');
    provider.store.delete(
      'base-991c502-committed/archives/constitution-history/receipts/33333333-3333-4333-8333-333333333333.json'
    );
    expect(() => verifyBaseReplay(base, provider)).toThrow(/missing its receipt or journal/);
  });

  it('rejects a manifest whose declared outcome drifts from the ledger', () => {
    const candidate = clone(manifest);
    const base = candidate.bases.find((b: any) => b.id === 'base-991c502-pending-ledger-only');
    base.transactions[base.transactions.length - 1].outcome = 'committed';
    expect(() => verifyBaseReplay(base, memoryProvider())).toThrow(/State drift/);
  });

  // ── End-to-end fail-closed through the full pipeline ────────────────────────

  it('fails closed end-to-end when the corpus is incomplete', () => {
    const provider = memoryProvider();
    provider.store.delete('base-991c502-committed/CONSTITUTION.md');
    expect(() => runHistoricalTransactionCorpusVerification({ provider, git: false })).toThrow(
      /missing declared files/
    );
  });
});
