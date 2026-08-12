/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractFromFile, fileContainsMarker } from '@process/doctor/fileMarker';

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

/**
 * The extracting cousin. Its whole reason to exist is telling a MISMATCH apart
 * from an ABSENCE, so the null case is as load-bearing as the match case.
 *
 * The literal shape here is the one the real engine binary carries, confirmed
 * by reading it: compact JSON, no whitespace, preceded by the generator field.
 * The `schema_digest` key also appears twice more in the binary as an interned
 * Rust string-table run with no JSON around it, which is why the pattern
 * demands the full "key":"value" form — and why that decoy is reproduced below.
 */
describe('extractFromFile', () => {
  const PATTERN = /"schema_digest"\s*:\s*"(sha256:[0-9a-f]{64})"/;
  const LOOKBACK = 256;
  const DIGEST = 'sha256:4971f456655a6ee7c063a3417ebf82a27a8550420d3e6ed744bdd4be696956e9';
  const REAL_SHAPE = `tion.json"],"generator":"wcore-desktop-contract-gen/14","schema_digest":"${DIGEST}","source_inputs":["`;
  const DECOY = 'schema_digestsource_inputs_digestavailablepublication_boundshape_only';
  let dir: string;

  const write = (name: string, contents: string): string => {
    const file = path.join(dir, name);
    writeFileSync(file, contents, 'latin1');
    return file;
  };

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'wl-extract-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('extracts the digest from the real embedded manifest shape', async () => {
    const file = write('manifest.bin', `${'x'.repeat(300)}${REAL_SHAPE}${'y'.repeat(300)}`);
    expect(await extractFromFile(file, PATTERN, LOOKBACK)).toBe(DIGEST);
  });

  it('returns null when the file advertises no digest — a legacy engine', async () => {
    const file = write('legacy.bin', `${'x'.repeat(5000)}no contract here${'y'.repeat(5000)}`);
    expect(await extractFromFile(file, PATTERN, LOOKBACK)).toBeNull();
  });

  /** The interned string-table runs must not be mistaken for a value. */
  it('ignores the bare key where it appears outside JSON', async () => {
    const file = write('decoy.bin', `${DECOY}${'z'.repeat(200)}${DECOY}`);
    expect(await extractFromFile(file, PATTERN, LOOKBACK)).toBeNull();
  });

  it('finds the real value even when decoys precede it', async () => {
    const file = write('both.bin', `${DECOY}${'z'.repeat(400)}${DECOY}${'q'.repeat(400)}${REAL_SHAPE}`);
    expect(await extractFromFile(file, PATTERN, LOOKBACK)).toBe(DIGEST);
  });

  it('extracts a digest split across chunk boundaries', async () => {
    const file = write('split.bin', `${'x'.repeat(1000)}${REAL_SHAPE}${'y'.repeat(1000)}`);
    expect(await extractFromFile(file, PATTERN, LOOKBACK, 16)).toBe(DIGEST);
  });

  it('returns a DIFFERENT digest verbatim rather than reporting absence', async () => {
    const other = 'sha256:23fb3048000000000000000000000000000000000000000000000000deadbeef';
    const file = write('other.bin', `"schema_digest":"${other}"`);
    expect(await extractFromFile(file, PATTERN, LOOKBACK)).toBe(other);
  });

  it('refuses a global pattern, whose lastIndex would skip matches', async () => {
    const file = write('g.bin', REAL_SHAPE);
    await expect(extractFromFile(file, /"schema_digest":"(sha256:[0-9a-f]{64})"/g, LOOKBACK)).rejects.toThrow(
      /must not be global/
    );
  });
});
