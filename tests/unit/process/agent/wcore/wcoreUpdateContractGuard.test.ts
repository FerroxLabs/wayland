/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1108 - the in-app engine updater must not hand this build an engine its own
 * contract pin rejects.
 *
 * Desktop compares `DESKTOP_CORE_V1_PIN` for EQUALITY on the `ready` frame, so an
 * engine with a different Desktop-contract descriptor cannot open a session at
 * all - and because `resolveWCoreBinary` prefers the in-app override over the
 * bundled binary, an update the app cannot talk to shadows the one it can. That
 * is the shipped v0.12.0 field report (pinned minor 14, updater installed Core
 * v0.13.5 at minor 16); `wcore/index.ts` only recovers it AFTER a broken launch.
 *
 * Every Core release publishes `wayland-core-<tag>-desktop-contract-v1.tar.gz`
 * carrying `desktop/v1/manifest.json`, and that asset is listed in the release's
 * `wayland-core-checksums.txt`. Verified against the real v0.13.6 release: the
 * asset exists, its checksum is published, and its descriptor is byte-identical
 * to the pin.
 *
 * These drive the REAL check/install paths with a stubbed `fetch` and a tar built
 * here, so the assertions are about shipped code rather than a hand-written
 * shape. The gate must FAIL CLOSED: a missing asset, an unfetchable one, a bad
 * checksum and a mismatching descriptor are all refusals.
 */

import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DESKTOP_CORE_V1_PIN } from '@/process/agent/wcore/desktopContractV1';
import {
  compareContractManifest,
  contractAssetNameFor,
  readContractManifest,
} from '@/process/agent/wcore/wcoreUpdateContract';
import { assetNameFor, checkForWCoreUpdate, installWCoreUpdate } from '@/process/agent/wcore/wcoreUpdater';

const TAG = 'v9.9.9';
const RELEASES_API = 'https://api.github.com/repos/FerroxLabs/wayland-core/releases/latest';
const ENGINE_ASSET = assetNameFor(TAG) as string;
const CONTRACT_ASSET = contractAssetNameFor(TAG);
const CHECKSUMS_ASSET = 'wayland-core-checksums.txt';

const ENGINE_BYTES = Buffer.from('engine archive bytes - never extracted in these tests');

/** The descriptor a release manifest carries, matching this build's pin. */
function matchingManifest(): Record<string, unknown> {
  return {
    contract: { name: DESKTOP_CORE_V1_PIN.name, major: DESKTOP_CORE_V1_PIN.major, minor: DESKTOP_CORE_V1_PIN.minor },
    generator: DESKTOP_CORE_V1_PIN.generator,
    fixture_digest: DESKTOP_CORE_V1_PIN.fixtureDigest,
    schema_digest: DESKTOP_CORE_V1_PIN.schemaDigest,
    source_inputs_digest: DESKTOP_CORE_V1_PIN.sourceInputsDigest,
  };
}

/** A 512-byte ustar header. Only the fields the reader uses are meaningful. */
function tarHeader(path: string, size: number, typeflag: string): Buffer {
  const header = Buffer.alloc(512, 0);
  header.write(path.slice(0, 100), 0, 'utf8');
  header.write('0000644\0', 100, 'utf8');
  header.write('0000000\0', 108, 'utf8');
  header.write('0000000\0', 116, 'utf8');
  header.write(`${size.toString(8).padStart(11, '0')}\0`, 124, 'utf8');
  header.write('00000000000\0', 136, 'utf8');
  header.write('        ', 148, 'utf8'); // checksum placeholder = 8 spaces
  header.write(typeflag, 156, 'utf8');
  header.write('ustar\0', 257, 'utf8');
  header.write('00', 263, 'utf8');
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'utf8');
  return header;
}

/** Build a gzipped tar carrying `entries`, plus a leading directory entry. */
function makeContractAsset(entries: { path: string; body: string }[]): Buffer {
  const blocks: Buffer[] = [tarHeader('desktop/v1/', 0, '5')];
  for (const entry of entries) {
    const body = Buffer.from(entry.body, 'utf8');
    blocks.push(tarHeader(entry.path, body.length, '0'));
    const padded = Buffer.alloc(Math.ceil(body.length / 512) * 512, 0);
    body.copy(padded);
    blocks.push(padded);
  }
  blocks.push(Buffer.alloc(1024, 0)); // two zero blocks terminate a tar
  return gzipSync(Buffer.concat(blocks));
}

const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

type Stub = {
  /** `null` serves a 404 for the contract asset (the "release has none" case). */
  contractAsset: Buffer | null;
  /** Omit the contract asset's line from checksums.txt. */
  omitContractChecksum?: boolean;
  /** Publish a checksum the contract asset does not have. */
  wrongContractChecksum?: boolean;
};

function stubRelease({ contractAsset, omitContractChecksum, wrongContractChecksum }: Stub): void {
  const lines = [`${sha256(ENGINE_BYTES)}  ${ENGINE_ASSET}`];
  if (contractAsset && !omitContractChecksum) {
    const digest = wrongContractChecksum ? 'b'.repeat(64) : sha256(contractAsset);
    lines.push(`${digest}  ${CONTRACT_ASSET}`);
  }
  const checksums = `${lines.join('\n')}\n`;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === RELEASES_API) {
        return new Response(JSON.stringify({ tag_name: TAG, html_url: `https://example.invalid/${TAG}` }), {
          status: 200,
        });
      }
      if (url.endsWith(CHECKSUMS_ASSET)) return new Response(checksums, { status: 200 });
      if (url.endsWith(CONTRACT_ASSET)) {
        if (!contractAsset) return new Response('not found', { status: 404 });
        return new Response(new Uint8Array(contractAsset), { status: 200 });
      }
      if (url.endsWith(ENGINE_ASSET)) {
        return new Response(new Uint8Array(ENGINE_BYTES), {
          status: 200,
          headers: { 'content-length': String(ENGINE_BYTES.length) },
        });
      }
      return new Response('not found', { status: 404 });
    })
  );
}

/** A contract asset whose descriptor differs from the pin by one field. */
function mismatchedAsset(overrides: Record<string, unknown>): Buffer {
  return makeContractAsset([
    { path: 'desktop/v1/manifest.json', body: JSON.stringify({ ...matchingManifest(), ...overrides }) },
  ]);
}

const matchingAsset = (): Buffer =>
  makeContractAsset([{ path: 'desktop/v1/manifest.json', body: JSON.stringify(matchingManifest()) }]);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('#1108 the release contract asset is readable and comparable', () => {
  it('round-trips desktop/v1/manifest.json out of a gzipped tar', () => {
    const manifest = readContractManifest(matchingAsset());
    expect(manifest).toEqual(matchingManifest());
  });

  it('returns null when the archive carries no desktop/v1/manifest.json', () => {
    const asset = makeContractAsset([{ path: 'desktop/v1/other.json', body: '{}' }]);
    expect(readContractManifest(asset)).toBeNull();
  });

  it('returns null for bytes that are not a gzip', () => {
    expect(readContractManifest(Buffer.from('definitely not gzip'))).toBeNull();
  });

  it('accepts the pinned descriptor and rejects each field in turn', () => {
    expect(compareContractManifest(matchingManifest())).toEqual({ ok: true });
    for (const override of [
      { contract: { name: DESKTOP_CORE_V1_PIN.name, major: 1, minor: DESKTOP_CORE_V1_PIN.minor + 1 } },
      { generator: 'wcore-desktop-contract-gen/99' },
      { fixture_digest: 'sha256:deadbeef' },
      { schema_digest: 'sha256:deadbeef' },
      { source_inputs_digest: 'sha256:deadbeef' },
    ]) {
      expect(compareContractManifest({ ...matchingManifest(), ...override }).ok).toBe(false);
    }
    expect(compareContractManifest(null).ok).toBe(false);
    expect(compareContractManifest({ generator: DESKTOP_CORE_V1_PIN.generator }).ok).toBe(false);
  });
});

describe('#1108 checkForWCoreUpdate refuses to OFFER an incompatible engine', () => {
  it('offers an update whose contract matches the pin', async () => {
    stubRelease({ contractAsset: matchingAsset() });

    const result = await checkForWCoreUpdate();

    expect(result.tag).toBe(TAG);
    expect(result.incompatible).toBeFalsy();
    // `current` is whatever engine this machine resolves; only assert the gate
    // did not veto when it had a matching contract in hand.
    expect(result.error).toBeUndefined();
  });

  it('withholds the offer when the release contract minor differs from the pin', async () => {
    stubRelease({
      contractAsset: mismatchedAsset({
        contract: { name: DESKTOP_CORE_V1_PIN.name, major: 1, minor: DESKTOP_CORE_V1_PIN.minor + 1 },
      }),
    });

    const result = await checkForWCoreUpdate();

    expect(result.updateAvailable).toBe(false);
    expect(result.incompatible).toBe(true);
    expect(result.error).toContain('is not compatible with this app version');
  });

  it('fails CLOSED when the release publishes no contract asset', async () => {
    stubRelease({ contractAsset: null });

    const result = await checkForWCoreUpdate();

    expect(result.updateAvailable).toBe(false);
    expect(result.incompatible).toBe(true);
    expect(result.error).toContain('is not compatible with this app version');
  });
});

describe('#1108 installWCoreUpdate refuses to STAGE an incompatible engine', () => {
  it('refuses when the contract generator differs from the pin', async () => {
    stubRelease({ contractAsset: mismatchedAsset({ generator: 'wcore-desktop-contract-gen/99' }) });

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain('is not compatible with this app version');
  });

  it('refuses when the contract asset is missing from the release', async () => {
    stubRelease({ contractAsset: null });

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain('is not compatible with this app version');
  });

  it('refuses when the contract asset has no published checksum', async () => {
    stubRelease({ contractAsset: matchingAsset(), omitContractChecksum: true });

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain('is not compatible with this app version');
  });

  it('refuses when the contract asset fails its published checksum', async () => {
    stubRelease({ contractAsset: matchingAsset(), wrongContractChecksum: true });

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain('is not compatible with this app version');
  });

  it('refuses BEFORE extracting or staging, so no engine reaches the override dir', async () => {
    stubRelease({ contractAsset: mismatchedAsset({ schema_digest: 'sha256:deadbeef' }) });

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    // The engine archive here is not a real tarball. Reaching extraction would
    // throw a tar/unzip error instead of the contract refusal, so this message
    // is itself the proof the gate ran first.
    expect(result.ok ? '' : result.error).toContain('is not compatible with this app version');
  });
});
