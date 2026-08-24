/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Historical constitution transaction corpus verifier.
 *
 * The corpus under `tests/fixtures/constitution-fs` was produced ONLY by the
 * native constitution-fs helper compiled from the exact producer tree
 * `991c502e74506ec3702f92e429a8b31b655412ba` plus a transaction-neutral,
 * main-only fixture failpoint patch. Its transaction protocol, receipt schema,
 * and ledger/journal contract are defined by
 * `src/process/services/constitution/constitutionFsTransaction.ts` at that same
 * commit. This harness re-derives every provenance and state digest from disk,
 * inventories the whole corpus directory, and replays the MAC-chained
 * transaction ledger for each captured crash point.
 *
 * It fails closed on current-code reconstruction, synthetic-as-captured claims,
 * missing/extra files, ledger gaps, transaction conflicts, reordering,
 * cross-release substitution, unknown critical fields, state drift, and
 * post-terminal events. The corpus can only be consumed if every check passes.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '..', '..');
export const CONTRACT_DIR = path.resolve(REPO_ROOT, 'contracts', 'recovery', 'historical-transactions');
export const MANIFEST_PATH = path.join(CONTRACT_DIR, 'manifest.json');
export const HARNESS_PATCH_PATH = path.join(CONTRACT_DIR, 'harness-only.patch');

/** The exact producer whose bytes are the only legitimate corpus source. */
export const PRODUCER_COMMIT = '991c502e74506ec3702f92e429a8b31b655412ba';
export const PRODUCER_PROTOCOL_VERSION = 1;
export const SOURCE_PATH = 'src/process/services/constitution/constitutionFsTransaction.ts';

/** Canonical seal of the manifest; drift from these bytes fails closed. */
export const EXPECTED_MANIFEST_DIGEST = '3e496ec671ecb3755403039438162fe4526530cd443b6f7cc771523379aad3f0';

const MANIFEST_CRITICAL_KEYS = [
  'bases',
  'classificationCounts',
  'contract',
  'corpusRoot',
  'finalizer',
  'generator',
  'harnessPatch',
  'helper',
  'producer',
  'provenanceArtifact',
  'provenanceFiles',
  'schemaVersion',
  'source',
  'toolchain',
];

const LEDGER_STATE_SEQUENCE = { indexed: 0, journal_bound: 1 };

export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function sha256Prefixed(bytes) {
  return `sha256:${sha256Hex(bytes)}`;
}

/** Stable canonical serialization: sort object keys by codepoint, recurse. */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

export function canonicalDigest(value) {
  return sha256Hex(JSON.stringify(canonicalize(value)));
}

// ── Filesystem provider ──────────────────────────────────────────────────────
// The default provider reads the real corpus. Tests inject a memory provider
// seeded from disk so hostile mutations exercise the whole pipeline.

export function createDiskCorpusProvider(corpusAbs) {
  const walk = (dir) => {
    const out = [];
    for (const name of readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else out.push(path.relative(corpusAbs, full).split(path.sep).join('/'));
    }
    return out;
  };
  return {
    list: () => walk(corpusAbs),
    read: (rel) => readFileSync(path.join(corpusAbs, rel)),
    exists: (rel) => existsSync(path.join(corpusAbs, rel)),
  };
}

// ── Manifest ─────────────────────────────────────────────────────────────────

export function loadManifest(manifestPath = MANIFEST_PATH) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function verifyManifestIntegrity(manifest) {
  const keys = Object.keys(manifest).sort();
  const expected = [...MANIFEST_CRITICAL_KEYS].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error('Historical corpus manifest has missing or unknown critical fields.');
  }
  if (manifest.contract !== 'wayland-historical-transaction-corpus/1.0') {
    throw new Error('Historical corpus manifest declares an unexpected contract.');
  }
  const digest = canonicalDigest(manifest);
  if (digest !== EXPECTED_MANIFEST_DIGEST) {
    throw new Error(`Historical corpus manifest digest drifted: ${digest} != ${EXPECTED_MANIFEST_DIGEST}`);
  }
  return digest;
}

// ── Provenance ───────────────────────────────────────────────────────────────

/**
 * Git-backed re-derivation of the exact source blob.
 *
 * IT RETURNS WHETHER IT COULD LOOK, SEPARATELY FROM WHAT IT SAW. It used to
 * collapse both into `null`, and the caller's `if (derived && ...)` then turned
 * "git could not reach the producer object" into "the digest is fine" - a
 * security check that fails OPEN and says nothing about it.
 *
 * It is reachable far less often than it looks. `PRODUCER_COMMIT` is on NO
 * REMOTE BRANCH - `git ls-remote ferrox refs/heads/codex/desktop-constitution-production`
 * is empty and `git branch -r --contains 991c502e...` names nothing - so it
 * survives only as a local branch in the author's own clone. Executed:
 *   Windows D:\wl-desktop  git cat-file -t 991c502e... -> could not get object info
 *   author's Mac           git cat-file -t 991c502e... -> commit
 * The Linux box answered `could not get object info` at 01:19 and `commit` at
 * 01:26, because an unrelated fetch by another lane happened to drop the
 * dangling object into the shared pack in between. So whether this leg runs is
 * a property of what a clone incidentally holds, and it CHANGES UNDER YOU.
 *
 * That, not line endings and not path normalisation, is why the leg was dead
 * off macOS: `.gitattributes` pins `* text=auto eol=lf`, and wherever the
 * object is present the blob is byte-identical (48907 bytes, matching
 * `source.size`) on all three platforms. Suspicion refuted by execution.
 */
function gitBlobSha256(commit, sourcePath, repoRoot = REPO_ROOT) {
  try {
    const bytes = execFileSync('git', ['-C', repoRoot, 'cat-file', 'blob', `${commit}:${sourcePath}`], {
      maxBuffer: 8 * 1024 * 1024,
      // stderr is CAPTURED, not inherited: git's `fatal:` line is the reason
      // this leg could not run and belongs in the report, not sprayed over the
      // CLI's output where a reader takes it for a verification failure.
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { available: true, digest: sha256Prefixed(bytes) };
  } catch (error) {
    const detail = String(error?.stderr ?? '').trim() || String(error?.message ?? error).trim();
    return { available: false, reason: detail.split('\n')[0] };
  }
}

/**
 * `gitSource` is a test seam, defaulted to the real producer. It exists so the
 * mismatch branch below can be exercised against a git repository the test
 * BUILDS, on a platform whose clone does not carry `PRODUCER_COMMIT` - which is
 * every platform but the author's.
 */
export function verifyProvenance(
  manifest,
  { provider, git = true, gitSource = { repoRoot: REPO_ROOT, commit: PRODUCER_COMMIT } } = {}
) {
  const { producer, source, harnessPatch, classificationCounts, bases } = manifest;

  if (producer.commit !== PRODUCER_COMMIT) {
    throw new Error('Historical corpus is not sourced from the nominated producer commit (reconstruction).');
  }

  // Cross-release substitution: every base must pin the exact producer commit and
  // its protocol version. A base built by different/current code is rejected.
  for (const base of bases) {
    if (base.producerCommit !== PRODUCER_COMMIT) {
      throw new Error(`Base ${base.id} declares a foreign producer commit (cross-release substitution).`);
    }
    if (base.protocolVersion !== PRODUCER_PROTOCOL_VERSION) {
      throw new Error(`Base ${base.id} declares protocol v${base.protocolVersion} (cross-release substitution).`);
    }
    if (base.classification !== 'captured') {
      throw new Error(`Base ${base.id} is not captured provenance (synthetic-as-captured).`);
    }
  }

  // Synthetic evidence can never be counted as captured provenance.
  if (classificationCounts.syntheticFiles !== 0 || classificationCounts.syntheticBases !== 0) {
    throw new Error('Historical corpus mixes synthetic evidence into the captured claim.');
  }

  // Bind the exact named source path. When git is present, re-derive the blob.
  if (source.path !== SOURCE_PATH) {
    throw new Error('Historical corpus manifest binds an unexpected transaction source path.');
  }
  let sourceBlobReDerived = false;
  let sourceBlobReDerivationSkipped = git ? null : 'git re-derivation not requested';
  if (git) {
    const derived = gitBlobSha256(gitSource.commit, SOURCE_PATH, gitSource.repoRoot);
    if (derived.available) {
      sourceBlobReDerived = true;
      if (derived.digest !== source.contentSha256) {
        throw new Error('Bound transaction source blob does not match the producer commit (reconstruction).');
      }
    } else {
      // NOT fatal - a clone that never fetched the producer branch is normal,
      // and refusing every such clone would make the CLI unusable. But it is
      // no longer SILENT: the report states that this leg did not run, so a
      // reader cannot mistake an unperformed check for a passed one.
      sourceBlobReDerivationSkipped = `producer blob unreachable in git: ${derived.reason}`;
    }
  }

  // The harness patch must be transaction-neutral: the byte-producing transaction
  // region is identical before and after the additive main-only failpoint.
  if (harnessPatch.transactionRegionBeforeSha256 !== harnessPatch.transactionRegionAfterSha256) {
    throw new Error('Harness patch mutates the transaction region; it is not transaction-neutral.');
  }
  const patchBytes = provider.exists('provenance/991c502-fixture-failpoint.patch')
    ? provider.read('provenance/991c502-fixture-failpoint.patch')
    : readFileSync(HARNESS_PATCH_PATH);
  const patchDigest = sha256Prefixed(patchBytes);
  if (patchDigest !== harnessPatch.sha256) {
    throw new Error('Harness patch bytes drifted from the sealed digest.');
  }
  // The contract-owned verbatim copy must match the origin patch.
  const ownedDigest = sha256Prefixed(readFileSync(HARNESS_PATCH_PATH));
  if (ownedDigest !== harnessPatch.sha256) {
    throw new Error('Contract harness-only.patch drifted from the sealed digest.');
  }

  return {
    producerCommit: producer.commit,
    sourceContentSha256: source.contentSha256,
    patchDigest,
    sourceBlobReDerived,
    sourceBlobReDerivationSkipped,
  };
}

// ── Whole-directory inventory ────────────────────────────────────────────────

export function verifyInventory(manifest, provider) {
  const declared = new Map();
  for (const base of manifest.bases) {
    for (const file of base.files) declared.set(file.path, file);
  }
  for (const file of manifest.provenanceFiles) declared.set(file.path, file);

  const actual = new Set(provider.list());

  const missing = [...declared.keys()].filter((p) => !actual.has(p)).sort();
  if (missing.length > 0) {
    throw new Error(`Historical corpus is missing declared files: ${missing.join(', ')}`);
  }
  const extra = [...actual].filter((p) => !declared.has(p)).sort();
  if (extra.length > 0) {
    throw new Error(`Historical corpus has undeclared extra files: ${extra.join(', ')}`);
  }

  for (const [rel, file] of declared) {
    const bytes = provider.read(rel);
    if (bytes.byteLength !== file.size) {
      throw new Error(`State drift: size mismatch for ${rel}.`);
    }
    if (sha256Prefixed(bytes) !== file.sha256) {
      throw new Error(`State drift: digest mismatch for ${rel}.`);
    }
  }

  // Forbidden (e.g. redacted legacy revision-authority) files must be absent.
  for (const base of manifest.bases) {
    for (const forbidden of base.forbiddenFiles) {
      if (actual.has(`${base.id}/${forbidden}`)) {
        throw new Error(`Forbidden file present in ${base.id}: ${forbidden}`);
      }
    }
  }

  return { fileCount: declared.size };
}

// ── Transaction-chain replay ─────────────────────────────────────────────────

/** Parse the MAC-chained ledger; reject malformed lines, gaps, and reordering. */
export function parseLedgerChain(text) {
  const lines = text.split('\n').filter((line) => line.length > 0);
  if (lines.length === 0) throw new Error('Transaction ledger is empty.');
  const entries = lines.map((line, index) => {
    let value;
    try {
      value = JSON.parse(line);
    } catch {
      throw new Error(`Transaction ledger line ${index} is not JSON.`);
    }
    if (!value || typeof value !== 'object' || typeof value.mac !== 'string') {
      throw new Error(`Transaction ledger line ${index} is malformed.`);
    }
    return value;
  });

  if (entries[0].state !== 'ledger' || entries[0].previousMac !== null) {
    throw new Error('Transaction ledger is missing its genesis anchor.');
  }
  for (let i = 1; i < entries.length; i += 1) {
    // A broken or reordered chain shows up as a previousMac that does not equal
    // the immediately preceding entry's mac.
    if (entries[i].previousMac !== entries[i - 1].mac) {
      throw new Error(`Transaction ledger chain break at line ${i} (gap or reordering).`);
    }
  }
  return entries;
}

/**
 * Fold ledger entries into ordered per-transaction state. Rejects conflicts,
 * out-of-order states, and post-terminal events (a finalized or superseded
 * transaction cannot be the base for later ledger growth once one crashed).
 */
export function classifyLedgerTransactions(entries) {
  const order = [];
  const byTx = new Map();
  for (const entry of entries) {
    if (entry.state === 'ledger') continue;
    const tx = entry.transactionId;
    if (typeof tx !== 'string') throw new Error('Ledger entry is missing a transaction id.');
    if (!(entry.state in LEDGER_STATE_SEQUENCE)) {
      throw new Error(`Ledger entry has an unknown state: ${entry.state}`);
    }
    let record = byTx.get(tx);
    if (!record) {
      record = { transactionId: tx, ledgerStates: [] };
      byTx.set(tx, record);
      order.push(tx);
    }
    // States for a transaction must strictly advance indexed -> journal_bound;
    // a repeated or receding state is a conflicting rewrite.
    const last = record.ledgerStates[record.ledgerStates.length - 1];
    if (last !== undefined && LEDGER_STATE_SEQUENCE[entry.state] <= LEDGER_STATE_SEQUENCE[last]) {
      throw new Error(`Transaction ${tx} has a repeated or out-of-order ledger state (conflict).`);
    }
    record.ledgerStates.push(entry.state);
  }
  // A transaction that reached only `indexed` is pending; the producer crashed
  // after ledger publication. It must be the final transaction — any transaction
  // after it is a post-terminal event, not a real continuation.
  const result = [];
  for (let i = 0; i < order.length; i += 1) {
    const record = byTx.get(order[i]);
    const committed = record.ledgerStates.includes('journal_bound');
    if (!committed && i !== order.length - 1) {
      throw new Error(`Post-terminal ledger event after non-finalized transaction ${record.transactionId} (gap).`);
    }
    result.push({
      transactionId: record.transactionId,
      ledgerStates: record.ledgerStates,
      outcome: committed ? 'committed' : 'pending',
    });
  }
  return result;
}

/**
 * Cross-check the ledger-derived transaction chain against the retained
 * receipts/journals and the manifest's declared transactions.
 */
export function verifyBaseReplay(base, provider) {
  const ledgerRel = `${base.id}/archives/constitution-history/transaction-ledger.jsonl`;
  const chain = classifyLedgerTransactions(parseLedgerChain(provider.read(ledgerRel).toString('utf8')));

  const declared = base.transactions;
  if (declared.length !== chain.length) {
    throw new Error(`State drift in ${base.id}: declared ${declared.length} transactions, ledger has ${chain.length}.`);
  }

  for (let i = 0; i < chain.length; i += 1) {
    const derived = chain[i];
    const decl = declared[i];
    if (decl.transactionId !== derived.transactionId) {
      throw new Error(`State drift in ${base.id}: transaction order mismatch at index ${i}.`);
    }
    if (decl.outcome !== derived.outcome) {
      throw new Error(
        `State drift in ${base.id}: transaction ${derived.transactionId} declared ${decl.outcome}, ledger says ${derived.outcome}.`
      );
    }
    const receiptRel = `${base.id}/archives/constitution-history/receipts/${derived.transactionId}.json`;
    const journalRel = `${base.id}/archives/constitution-history/transactions/${derived.transactionId}.jsonl`;
    const hasReceipt = provider.exists(receiptRel);
    const hasJournal = provider.exists(journalRel);

    if (derived.outcome === 'committed') {
      if (!hasReceipt || !hasJournal) {
        throw new Error(
          `Committed transaction ${derived.transactionId} in ${base.id} is missing its receipt or journal.`
        );
      }
    } else {
      // A crash after ledger publication but before journal/receipt completion:
      // a receipt or journal here is a post-terminal fabrication.
      if (hasReceipt || hasJournal) {
        throw new Error(
          `Pending transaction ${derived.transactionId} in ${base.id} has a post-terminal receipt or journal.`
        );
      }
    }
  }

  return {
    base: base.id,
    crashPoint: base.crashPoint,
    committed: chain.filter((tx) => tx.outcome === 'committed').length,
    pending: chain.filter((tx) => tx.outcome === 'pending').length,
  };
}

// ── Orchestration ────────────────────────────────────────────────────────────

export function runHistoricalTransactionCorpusVerification({ manifest = loadManifest(), provider, git = true } = {}) {
  const manifestDigest = verifyManifestIntegrity(manifest);
  const corpusAbs = path.resolve(REPO_ROOT, manifest.corpusRoot);
  const activeProvider = provider ?? createDiskCorpusProvider(corpusAbs);

  const provenance = verifyProvenance(manifest, { provider: activeProvider, git });
  const inventory = verifyInventory(manifest, activeProvider);
  const replays = manifest.bases.map((base) => verifyBaseReplay(base, activeProvider));

  const committed = replays.reduce((n, r) => n + r.committed, 0);
  const pending = replays.reduce((n, r) => n + r.pending, 0);
  if (committed !== manifest.classificationCounts.committedTransactions) {
    throw new Error('State drift: committed transaction count disagrees with the manifest.');
  }
  if (pending !== manifest.classificationCounts.pendingTransactions) {
    throw new Error('State drift: pending transaction count disagrees with the manifest.');
  }

  return {
    contract: manifest.contract,
    ok: true,
    manifestDigest,
    producerCommit: provenance.producerCommit,
    sourceBlobReDerived: provenance.sourceBlobReDerived,
    sourceBlobReDerivationSkipped: provenance.sourceBlobReDerivationSkipped,
    fileCount: inventory.fileCount,
    capturedBases: manifest.classificationCounts.capturedBases,
    syntheticFiles: manifest.classificationCounts.syntheticFiles,
    committedTransactions: committed,
    pendingTransactions: pending,
    crashPoints: replays.map((r) => r.crashPoint).sort(),
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const report = runHistoricalTransactionCorpusVerification();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Historical transaction corpus verification failed: ${error.message}\n`);
    process.exit(1);
  }
}
