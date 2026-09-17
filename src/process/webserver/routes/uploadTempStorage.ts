/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import multer from 'multer';

/**
 * multer disk storage that creates its temp directory when a file arrives.
 *
 * `multer.diskStorage({ destination: '<string>' })` runs `mkdirSync` on that
 * directory as soon as the storage is constructed, and the routes construct it
 * at module load. On Windows `os.tmpdir()` is `%TEMP%`; a TEMP naming a drive
 * that no longer exists (measured: `F:\Temp\Codex` after F: was removed) threw
 * ENOENT there and ended app bootstrap before any window opened. Resolving the
 * directory per upload confines that failure to the upload that needs it.
 */
export function lazyTempDiskStorage(dir: string): multer.StorageEngine {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(dir, { recursive: true }, (error) => cb(error ?? null, dir));
    },
  });
}
