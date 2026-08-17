/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #853 - a failed engine update must say WHY.
 *
 * `installWCoreUpdate` returned the bare string 'checksum mismatch'. That is a
 * dead end: a user could not tell a truncated download from a wrong asset from
 * a tampered mirror, and had nothing to compare against the release's
 * checksums.txt. The digests are the whole diagnostic, and the function had
 * both of them in hand at the point it threw them away.
 *
 * Drives the real install path with a stubbed `fetch`, so the assertion is
 * about the shipped code rather than a hand-written shape.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assetNameFor, installWCoreUpdate } from '@/process/agent/wcore/wcoreUpdater';

const TAG = 'v9.9.9';
const ARCHIVE_BYTES = Buffer.from('not really a tarball, but it hashes just fine');
const ACTUAL_SHA256 = createHash('sha256').update(ARCHIVE_BYTES).digest('hex');
/** A well-formed but wrong digest, i.e. what a corrupted or swapped asset looks like. */
const PUBLISHED_SHA256 = 'a'.repeat(64);

const assetName = assetNameFor(TAG) as string;

let overrideRoot = '';

/**
 * Serve the release archive and its `checksums.txt`, with the checksum file
 * naming a digest the archive does not have.
 */
function stubReleaseFetch(checksumsBody: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('wayland-core-checksums.txt')) {
        return new Response(checksumsBody, { status: 200 });
      }
      if (url.endsWith(assetName)) {
        return new Response(new Uint8Array(ARCHIVE_BYTES), {
          status: 200,
          headers: { 'content-length': String(ARCHIVE_BYTES.length) },
        });
      }
      return new Response('not found', { status: 404 });
    })
  );
}

describe('#853 installWCoreUpdate surfaces both checksums on a mismatch', () => {
  beforeEach(() => {
    // The updater installs under this root; the mismatch path must never reach it.
    overrideRoot = mkdtempSync(join(tmpdir(), 'wcore-update-test-'));
    process.env.WAYLAND_USER_DATA_DIR = overrideRoot;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.WAYLAND_USER_DATA_DIR;
    if (overrideRoot && existsSync(overrideRoot)) rmSync(overrideRoot, { recursive: true, force: true });
  });

  it('names the asset, the published digest and the computed one', async () => {
    expect(assetName).toBeTruthy();
    stubReleaseFetch(`${PUBLISHED_SHA256}  ${assetName}\n`);

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    const error = result.ok ? '' : (result.error ?? '');
    expect(error).toContain(assetName);
    expect(error).toContain(PUBLISHED_SHA256);
    expect(error).toContain(ACTUAL_SHA256);
    // The two digests must be distinguishable, not just both present.
    expect(error).toMatch(new RegExp(`expected sha256 ${PUBLISHED_SHA256}`));
    expect(error).toMatch(new RegExp(`got ${ACTUAL_SHA256}`));
  });

  it('no longer collapses the failure to the bare legacy string', async () => {
    stubReleaseFetch(`${PUBLISHED_SHA256}  ${assetName}\n`);

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).not.toBe('checksum mismatch');
  });

  it('still fails closed when the release lists no checksum for the asset', async () => {
    stubReleaseFetch(`${PUBLISHED_SHA256}  some-other-asset.tar.gz\n`);

    const result = await installWCoreUpdate(TAG);

    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain('no checksum for');
  });
});
