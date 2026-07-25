import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const harness = require('../../../../scripts/recovery/verifyHistoricalTransactionCorpus.mjs') as HistoricalCorpusHarness;

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
  verifyProvenance: (manifest: any, opts: { provider: CorpusProvider; git?: boolean }) => unknown;
  verifyInventory: (manifest: any, provider: CorpusProvider) => { fileCount: number };
  verifyBaseReplay: (base: any, provider: CorpusProvider) => unknown;
  parseLedgerChain: (text: string) => Array<Record<string, unknown>>;
  classifyLedgerTransactions: (entries: Array<Record<string, unknown>>) => Array<{ transactionId: string; outcome: string }>;
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

  it('re-derives the exact producer source blob through git', () => {
    // git is available in the worktree; the source blob digest must match.
    expect(() => verifyProvenance(manifest, { provider: memoryProvider(), git: true })).not.toThrow();
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
    const candidate = clone(manifest);
    candidate.source.contentSha256 = `sha256:${'0'.repeat(64)}`;
    // git:true re-derives the real blob and detects the substitution.
    expect(() => verifyProvenance(candidate, { provider: memoryProvider(), git: true })).toThrow(/reconstruction/);
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
    expect(() => runHistoricalTransactionCorpusVerification({ provider, git: false })).toThrow(/missing declared files/);
  });
});
