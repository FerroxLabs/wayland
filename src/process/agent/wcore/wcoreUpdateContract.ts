/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1108 - the contract gate for the in-app engine updater.
 *
 * Desktop pins ONE Core Desktop-contract descriptor ({@link DESKTOP_CORE_V1_PIN})
 * and compares it for EQUALITY on the `ready` frame. So an engine whose contract
 * descriptor differs cannot talk to this build at all: every session dies on
 * frame 1. `resolveWCoreBinary` checks the in-app override BEFORE the bundled
 * binary, so an engine the updater installed shadows the bundled one that works.
 * That is the field report on Desktop v0.12.0 (pinned minor 14) after the in-app
 * update installed Core v0.13.5 (minor 16).
 *
 * `wcore/index.ts` already quarantines such an override at launch - that is the
 * LATE gate, and it costs the customer a broken launch first. This module is the
 * EARLY gate: every Core release publishes a
 * `wayland-core-<tag>-desktop-contract-v1.tar.gz` asset carrying the same
 * `desktop/v1/manifest.json` the pin was read from, and that asset is listed in
 * the release's `wayland-core-checksums.txt` - the SAME trust anchor the engine
 * archive is verified against. So the updater can read the incoming engine's
 * contract descriptor BEFORE it stages a binary, and refuse.
 *
 * Fails CLOSED. A missing asset, an unreachable one, a checksum mismatch, a
 * malformed archive, an absent manifest and a descriptor mismatch are ALL
 * refusals. "We could not prove it is compatible" is never "it is compatible".
 *
 * The tar is read in-process (gunzip + a minimal header walk) rather than shelled
 * out to `tar`: the contract asset is always a `.tar.gz` on every platform, and a
 * Windows box without `tar.exe` must not lose the ability to update its engine.
 */

import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { DESKTOP_CORE_V1_PIN } from './desktopContractV1';

/** Path of the descriptor inside the release's contract asset. */
const MANIFEST_ENTRY = 'desktop/v1/manifest.json';

/** Decompressed contract asset ceiling. The real asset is ~130 KiB. */
const MAX_CONTRACT_BYTES = 32 * 1024 * 1024;

/**
 * The Desktop-contract asset a Core release publishes for `tag`, e.g.
 * `wayland-core-v0.13.6-desktop-contract-v1.tar.gz`. Platform-independent -
 * one asset serves every Desktop build.
 */
export function contractAssetNameFor(tag: string): string {
  return `wayland-core-${tag}-desktop-contract-v1.tar.gz`;
}

/**
 * The user-facing refusal. Names the engine and says the ONE thing the customer
 * can act on: this is an app-version problem, not a broken download.
 */
export function engineIncompatibleMessage(tag: string, detail: string): string {
  return `Wayland Core ${tag} is not compatible with this app version: ${detail}. Update Wayland itself to move to this engine.`;
}

/** Read a NUL-terminated field out of a tar header. */
function headerString(field: Uint8Array): string {
  const end = field.indexOf(0);
  return Buffer.from(end === -1 ? field : field.subarray(0, end)).toString('utf8');
}

/**
 * Return the bytes of `wanted` from an uncompressed tar, or `null` when the
 * archive does not carry it. Deliberately minimal: ustar name+prefix, octal
 * size, regular-file typeflag. Anything it cannot parse ends the walk and
 * yields `null` (a refusal upstream), never a guess.
 */
export function readTarEntry(tar: Buffer, wanted: string): Buffer | null {
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    // Two zero blocks terminate a tar; one is enough to stop walking.
    if (header.every((byte) => byte === 0)) return null;
    const name = headerString(header.subarray(0, 100));
    const prefix = headerString(header.subarray(345, 500));
    const path = prefix ? `${prefix}/${name}` : name;
    const sizeField = header.subarray(124, 136).toString('utf8').replace(/\u0000/g, ' ').trim();
    const size = Number.parseInt(sizeField, 8);
    if (!Number.isSafeInteger(size) || size < 0) return null;
    const body = offset + 512;
    if (body + size > tar.length) return null;
    // '0' and NUL are both "regular file"; every other typeflag (dir, link,
    // GNU long-name) is skipped by size like any other entry.
    const typeflag = header[156];
    if ((typeflag === 0x30 || typeflag === 0x00) && path === wanted) return tar.subarray(body, body + size);
    offset = body + Math.ceil(size / 512) * 512;
  }
  return null;
}

/**
 * Parse `desktop/v1/manifest.json` out of a gzipped contract asset. Returns
 * `null` for anything that is not a readable gzip carrying that entry as JSON.
 */
export function readContractManifest(assetBytes: Buffer): unknown | null {
  let tar: Buffer;
  try {
    tar = gunzipSync(assetBytes, { maxOutputLength: MAX_CONTRACT_BYTES });
  } catch {
    return null;
  }
  const entry = readTarEntry(tar, MANIFEST_ENTRY);
  if (!entry) return null;
  try {
    return JSON.parse(entry.toString('utf8')) as unknown;
  } catch {
    return null;
  }
}

/** Lowercase SHA-256 hex of a buffer. */
export function sha256Buffer(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

type Comparison = { ok: true } | { ok: false; detail: string };

/**
 * Compare a release's contract manifest against {@link DESKTOP_CORE_V1_PIN}.
 *
 * The five descriptor fields checked here are exactly the ones `assertDescriptor`
 * enforces on the live `ready` frame (contract name/major/minor, generator,
 * fixture digest, schema digest, source-inputs digest). Capabilities are NOT
 * compared: the released manifest carries the same block, but the frame check
 * already owns that comparison and a divergence there is a session-1 failure the
 * launch quarantine catches. Keeping this gate to the descriptor keeps the two
 * gates agreeing rather than fighting - anything this REFUSES, the frame check
 * would also have refused.
 */
export function compareContractManifest(manifest: unknown): Comparison {
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    return { ok: false, detail: 'its contract manifest is not a JSON object' };
  }
  const record = manifest as Record<string, unknown>;
  const contract = record.contract;
  if (typeof contract !== 'object' || contract === null || Array.isArray(contract)) {
    return { ok: false, detail: 'its contract manifest carries no contract descriptor' };
  }
  const descriptor = contract as Record<string, unknown>;

  if (descriptor.name !== DESKTOP_CORE_V1_PIN.name) {
    return { ok: false, detail: `it declares contract ${String(descriptor.name)}, not ${DESKTOP_CORE_V1_PIN.name}` };
  }
  if (descriptor.major !== DESKTOP_CORE_V1_PIN.major || descriptor.minor !== DESKTOP_CORE_V1_PIN.minor) {
    return {
      ok: false,
      detail: `it speaks contract ${String(descriptor.major)}.${String(descriptor.minor)} and this app speaks ${
        DESKTOP_CORE_V1_PIN.major
      }.${DESKTOP_CORE_V1_PIN.minor}`,
    };
  }
  const fields: [string, unknown, string][] = [
    ['generator', record.generator, DESKTOP_CORE_V1_PIN.generator],
    ['fixture_digest', record.fixture_digest, DESKTOP_CORE_V1_PIN.fixtureDigest],
    ['schema_digest', record.schema_digest, DESKTOP_CORE_V1_PIN.schemaDigest],
    ['source_inputs_digest', record.source_inputs_digest, DESKTOP_CORE_V1_PIN.sourceInputsDigest],
  ];
  for (const [label, actual, expected] of fields) {
    if (actual !== expected) {
      return { ok: false, detail: `its ${label} is ${String(actual)}, this app pins ${expected}` };
    }
  }
  return { ok: true };
}
