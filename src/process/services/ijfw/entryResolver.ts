/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW MCP entry resolver - reads the installed mcp-server/package.json for
 * `bin` (string or object keyed by `ijfw-mcp`), then `main`, falling back to
 * `src/server.js` with a logged warning when nothing is declared.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import log from 'electron-log';

interface MaybePackageJson {
  bin?: string | Record<string, string>;
  main?: string;
}

export async function resolveEntry(mcpServerDir: string): Promise<string> {
  const pkgPath = path.join(mcpServerDir, 'package.json');
  let pkg: MaybePackageJson | null = null;
  try {
    pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8')) as MaybePackageJson;
  } catch {
    /* fall through to fallback */
  }

  if (pkg) {
    if (typeof pkg.bin === 'string') {
      return path.join(mcpServerDir, pkg.bin);
    }
    if (pkg.bin && typeof pkg.bin === 'object' && typeof pkg.bin['ijfw-mcp'] === 'string') {
      return path.join(mcpServerDir, pkg.bin['ijfw-mcp']);
    }
    if (typeof pkg.main === 'string') {
      return path.join(mcpServerDir, pkg.main);
    }
  }

  log.warn('[ijfw] using fallback entry src/server.js - package.json missing bin/main');
  const fallback = path.join(mcpServerDir, 'src', 'server.js');
  await fs.promises.stat(fallback); // throws if missing - surfaced to caller
  return fallback;
}
