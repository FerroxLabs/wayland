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
export async function fileContainsMarker(
  filePath: string,
  marker: string,
  chunkSize?: number
): Promise<boolean> {
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
