/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && entry.name.endsWith('.bun.test.ts') ? [target] : [];
  });
}

const files = ['src', 'tests'].flatMap(collect).sort();
if (files.length === 0) {
  console.error('No Bun-native test files found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['test', ...files], {
  env: process.env,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
