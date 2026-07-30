#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vendor Core's generated Desktop contract corpus into this repo, then derive
 * the small runtime artifact the decoder actually loads.
 *
 * Two outputs, one source of truth:
 *
 *   resources/wcore-contract/v1/                    verbatim byte copy of
 *                                                   crates/wcore-protocol/contracts/desktop/v1
 *   src/process/agent/wcore/contract/generated/
 *     wcoreContract.generated.json                  descriptor + event index + event schema
 *
 * The verbatim copy is what the contract tests replay and what the digests in
 * `manifest.json` are defined over; the generated file is what ships in the
 * bundle (importing 160 fixture files into the renderer/main bundle would be
 * absurd). `--check` re-derives both and fails on any drift, so the checked-in
 * copies can never silently diverge from Core.
 *
 * Usage:
 *   node scripts/vendor-wcore-contract.mjs --from /path/to/wayland-core
 *   node scripts/vendor-wcore-contract.mjs --check
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS_DIR = join(REPO_ROOT, 'resources', 'wcore-contract', 'v1');
const GENERATED_FILE = join(
  REPO_ROOT,
  'src',
  'process',
  'agent',
  'wcore',
  'contract',
  'generated',
  'wcoreContract.generated.json'
);
const CONTRACT_SUBPATH = join('crates', 'wcore-protocol', 'contracts', 'desktop', 'v1');

/** Directories whose bytes participate in `manifest.fixture_digest`. */
const FIXTURE_PREFIXES = ['commands/', 'events/', 'types/', 'compat/', 'adversarial/'];

/**
 * Fixtures whose embedded `contract.fixture_digest` is neutralised to all-zero
 * before hashing. A fixture that contains the digest of the corpus it belongs
 * to cannot otherwise be hashed without recursion. Mirrors
 * `wcore-protocol/src/contract/generate.rs::fixtures_digest`.
 */
const DIGEST_NEUTERED = new Set([
  'events/ready.json',
  'adversarial/events/version-mismatch.jsonl',
  'adversarial/events/schema-mismatch.jsonl',
  'adversarial/events/fixture-mismatch.jsonl',
]);

const ZERO_DIGEST = `sha256:${'0'.repeat(64)}`;

/** Recursively list `[posixRelativePath, bytes]` under `dir`, sorted by path. */
export function readTree(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    )) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push([relative(dir, full).split(sep).join('/'), readFileSync(full)]);
    }
  };
  walk(dir);
  return out;
}

/** Recursively key-sorted JSON with a single trailing LF (Core's `canonical_json`). */
function canonicalJson(value) {
  const sorted = (v) => {
    if (Array.isArray(v)) return v.map(sorted);
    if (v && typeof v === 'object') {
      const out = {};
      for (const key of Object.keys(v).sort()) out[key] = sorted(v[key]);
      return out;
    }
    return v;
  };
  return Buffer.from(`${JSON.stringify(sorted(value))}\n`, 'utf8');
}

/** sha256 over sorted `path + NUL + bytes` (Core's `digest_named_bytes`). */
function digestNamedBytes(entries) {
  const hash = createHash('sha256');
  for (const [path, bytes] of [...entries].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
    hash.update(Buffer.from(path, 'utf8'));
    hash.update(Buffer.from([0]));
    hash.update(bytes);
  }
  return `sha256:${hash.digest('hex')}`;
}

/**
 * Recompute `fixture_digest` and `schema_digest` from a corpus tree.
 *
 * Both are defined by Core; reproducing them here is what lets Desktop prove
 * its vendored copy is byte-identical to the corpus Core signed, rather than
 * trusting a digest string that travelled with the files it describes.
 */
export function corpusDigests(tree) {
  const fixtures = tree
    .filter(([path]) => FIXTURE_PREFIXES.some((prefix) => path.startsWith(prefix)))
    .map(([path, bytes]) => {
      if (!DIGEST_NEUTERED.has(path)) return [path, bytes];
      const value = JSON.parse(bytes.toString('utf8'));
      if (!value?.contract || !('fixture_digest' in value.contract)) return [path, bytes];
      value.contract.fixture_digest = ZERO_DIGEST;
      return [path, canonicalJson(value)];
    });
  const schemas = tree.filter(([path]) => path.startsWith('schema/'));
  return {
    fixtureDigest: digestNamedBytes(fixtures),
    schemaDigest: digestNamedBytes(schemas),
    fixtureCount: fixtures.length,
  };
}

/** Build the runtime artifact the decoder imports, from a corpus tree. */
export function buildGenerated(tree) {
  const byPath = new Map(tree);
  const read = (path) => {
    const bytes = byPath.get(path);
    if (!bytes) throw new Error(`contract corpus is missing ${path}`);
    return JSON.parse(bytes.toString('utf8'));
  };

  const manifest = read('manifest.json');
  const { fixtureDigest, schemaDigest, fixtureCount } = corpusDigests(tree);

  if (fixtureDigest !== manifest.fixture_digest) {
    throw new Error(`recomputed fixture_digest ${fixtureDigest} != manifest ${manifest.fixture_digest}`);
  }
  if (schemaDigest !== manifest.schema_digest) {
    throw new Error(`recomputed schema_digest ${schemaDigest} != manifest ${manifest.schema_digest}`);
  }
  if (fixtureCount !== manifest.counts.fixtures) {
    throw new Error(`counted ${fixtureCount} fixtures, manifest declares ${manifest.counts.fixtures}`);
  }

  return {
    _comment: 'GENERATED by scripts/vendor-wcore-contract.mjs from resources/wcore-contract/v1. Do not edit by hand.',
    descriptor: {
      name: manifest.contract.name,
      major: manifest.contract.major,
      minor: manifest.contract.minor,
      generator: manifest.generator,
      fixture_digest: manifest.fixture_digest,
      schema_digest: manifest.schema_digest,
      source_inputs_digest: manifest.source_inputs_digest,
      capabilities: manifest.capabilities,
    },
    // type -> criticality. The criticality class is the whole forward-compat
    // policy in one field: `safety` frames may not be dropped quietly.
    eventCriticality: Object.fromEntries(manifest.events.map((event) => [event.type, event.criticality])),
    commandTypes: manifest.commands.map((command) => command.type).sort(),
    eventSchema: read('schema/core-event.schema.json'),
  };
}

function copyTree(tree, destination) {
  rmSync(destination, { recursive: true, force: true });
  for (const [path, bytes] of tree) {
    const target = join(destination, ...path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const fromIndex = args.indexOf('--from');
  const from = fromIndex >= 0 ? args[fromIndex + 1] : null;

  if (check) {
    if (!existsSync(CORPUS_DIR)) {
      console.error(`missing vendored corpus at ${CORPUS_DIR}`);
      process.exit(1);
    }
    const tree = readTree(CORPUS_DIR);
    const generated = buildGenerated(tree);
    const onDisk = JSON.parse(readFileSync(GENERATED_FILE, 'utf8'));
    if (JSON.stringify(generated) !== JSON.stringify(onDisk)) {
      console.error(`${relative(REPO_ROOT, GENERATED_FILE)} is stale — re-run scripts/vendor-wcore-contract.mjs`);
      process.exit(1);
    }
    console.log(
      `contract OK: ${generated.descriptor.name} v${generated.descriptor.major}.${generated.descriptor.minor}, ` +
        `${tree.length} vendored files, digests reproduce`
    );
    return;
  }

  if (!from) {
    console.error('usage: vendor-wcore-contract.mjs --from <wayland-core checkout> | --check');
    process.exit(2);
  }

  const source = join(resolve(from), CONTRACT_SUBPATH);
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    console.error(`no contract corpus at ${source}`);
    process.exit(1);
  }

  const tree = readTree(source);
  const generated = buildGenerated(tree);
  copyTree(tree, CORPUS_DIR);
  mkdirSync(dirname(GENERATED_FILE), { recursive: true });
  writeFileSync(GENERATED_FILE, `${JSON.stringify(generated, null, 2)}\n`);
  console.log(
    `vendored ${tree.length} files from ${source}\n` +
      `  contract ${generated.descriptor.name} v${generated.descriptor.major}.${generated.descriptor.minor} ` +
      `(${generated.descriptor.generator})\n` +
      `  fixture_digest ${generated.descriptor.fixture_digest}\n` +
      `  schema_digest  ${generated.descriptor.schema_digest}`
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
