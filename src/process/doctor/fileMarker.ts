/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Byte-level marker search over a file, streamed.
 *
 * Its own module, deliberately: the registry imports Electron at module scope,
 * so anything living there cannot be unit-tested without mocking the app. This
 * has no dependencies beyond `node:fs` and is the part that actually needs
 * proving — the chunk-boundary carry is where a quiet bug would hide, and a
 * digest missed because it straddled two reads would present as contract drift
 * rather than as a bug in the search.
 */

import { createReadStream } from 'node:fs';

/**
 * True when `marker` appears anywhere in the bytes of `filePath`.
 *
 * Streamed rather than read whole — the engine binary is ~77 MB and pulling it
 * into a single string on every Doctor run is a needless memory spike.
 *
 * `latin1` maps each byte onto one code unit, so an ASCII marker matches
 * exactly and no multi-byte decode can mangle a chunk boundary. `carry` retains
 * the trailing `marker.length - 1` characters between chunks so a marker split
 * across two reads still matches.
 *
 * `chunkSize` exists so the boundary case can be exercised cheaply in tests;
 * production callers should omit it and take the stream default.
 */
export async function fileContainsMarker(filePath: string, marker: string, chunkSize?: number): Promise<boolean> {
  if (!marker) return false;

  const overlap = marker.length - 1;
  const stream = createReadStream(filePath, {
    encoding: 'latin1',
    ...(chunkSize ? { highWaterMark: chunkSize } : {}),
  });

  let carry = '';
  try {
    for await (const chunk of stream) {
      const window = carry + (chunk as string);
      if (window.includes(marker)) return true;
      carry = overlap > 0 ? window.slice(-overlap) : '';
    }
  } finally {
    stream.destroy();
  }
  return false;
}

/**
 * First capture group of `pattern` found in the bytes of `filePath`, or null.
 *
 * The extracting cousin of {@link fileContainsMarker}, and the distinction
 * matters more than it looks. Asking "is this exact string present?" cannot
 * tell a MISMATCH apart from an ABSENCE, and for the engine contract those two
 * mean opposite things: a different digest is a broken pairing, while no digest
 * at all is a legacy Core that the consumer explicitly supports and runs
 * normally. Extracting whatever digest is actually there lets the caller answer
 * the real question.
 *
 * `lookbackChars` sizes the cross-chunk carry, so it must be at least as long
 * as the longest match `pattern` can produce; a match longer than the lookback
 * can be missed at a chunk boundary. `pattern` must be non-global — this
 * returns the first match and stops.
 */
export async function extractFromFile(
  filePath: string,
  pattern: RegExp,
  lookbackChars: number,
  chunkSize?: number
): Promise<string | null> {
  if (pattern.global) throw new Error('extractFromFile: pattern must not be global');

  const stream = createReadStream(filePath, {
    encoding: 'latin1',
    ...(chunkSize ? { highWaterMark: chunkSize } : {}),
  });

  let carry = '';
  try {
    for await (const chunk of stream) {
      const window = carry + (chunk as string);
      const match = pattern.exec(window);
      if (match) return match[1] ?? match[0];
      carry = lookbackChars > 0 ? window.slice(-lookbackChars) : '';
    }
  } finally {
    stream.destroy();
  }
  return null;
}
