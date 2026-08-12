/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fileContainsMarker } from '@process/doctor/fileMarker';

/**
 * These run against real files on disk rather than a fake reader.
 *
 * The check that uses this is only as good as the search underneath it: a
 * marker missed because it straddled two reads would surface as "the engine
 * does not match its contract pin", which is a alarming and wrong. So the
 * boundary case is exercised explicitly, and every positive assertion is paired
 * with a negative one on the same file — a search that always returned true
 * would satisfy the positives alone.
 */
describe('fileContainsMarker', () => {
  const MARKER = 'sha256:4971f456655a6ee7c063a3417ebf82a27a8550420d3e6ed744bdd4be696956e9';
  const ABSENT = 'sha256:23fb3048000000000000000000000000000000000000000000000000deadbeef';
  let dir: string;

  const write = (name: string, contents: string): string => {
    const file = path.join(dir, name);
    writeFileSync(file, contents, 'latin1');
    return file;
  };

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'wl-filemarker-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('finds a marker in a small file, and does not find one that is absent', async () => {
    const file = write('small.bin', `leading bytes ${MARKER} trailing bytes`);
    expect(await fileContainsMarker(file, MARKER)).toBe(true);
    expect(await fileContainsMarker(file, ABSENT)).toBe(false);
  });

  /**
   * The case the carry exists for. With a 16-byte chunk and a 71-character
   * marker, the marker cannot fall inside any single read — so a naive
   * per-chunk `includes` returns false here and this test is what catches it.
   */
  it('finds a marker split across chunk boundaries', async () => {
    const file = write('straddle.bin', `${'x'.repeat(1000)}${MARKER}${'y'.repeat(1000)}`);
    expect(await fileContainsMarker(file, MARKER, 16)).toBe(true);
    expect(await fileContainsMarker(file, ABSENT, 16)).toBe(false);
  });

  it('finds a marker that ends exactly on the final byte of the file', async () => {
    const file = write('tail.bin', `${'x'.repeat(500)}${MARKER}`);
    expect(await fileContainsMarker(file, MARKER, 16)).toBe(true);
  });

  it('finds a marker that begins on the very first byte', async () => {
    const file = write('head.bin', `${MARKER}${'y'.repeat(500)}`);
    expect(await fileContainsMarker(file, MARKER, 16)).toBe(true);
  });

  /** Larger than the 64 KiB stream default, so the real chunking path runs. */
  it('finds a marker past the default chunk size with no chunkSize override', async () => {
    const file = write('big.bin', `${'x'.repeat(200_000)}${MARKER}${'y'.repeat(200_000)}`);
    expect(await fileContainsMarker(file, MARKER)).toBe(true);
    expect(await fileContainsMarker(file, ABSENT)).toBe(false);
  });

  it('returns false for an empty file and for an empty marker', async () => {
    const file = write('empty.bin', '');
    expect(await fileContainsMarker(file, MARKER)).toBe(false);
    expect(await fileContainsMarker(write('any.bin', 'content'), '')).toBe(false);
  });

  it('rejects rather than resolving false when the file cannot be read', async () => {
    await expect(fileContainsMarker(path.join(dir, 'does-not-exist.bin'), MARKER)).rejects.toThrow();
  });
});
