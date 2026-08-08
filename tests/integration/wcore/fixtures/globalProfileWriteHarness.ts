/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-01 Task 3: a standalone harness (NOT a test file - no test-framework
 * import) that publishes a Desktop MCP-narrowing profile into a global
 * `config.toml` using the REAL production splice/transaction primitives,
 * signals durability via a marker file, then blocks forever so the parent
 * test controls exactly when it dies (a real `SIGKILL`).
 *
 * CLI args: <targetDir> <markerPath>
 *
 * Run via `bun`, not `node` - it imports TS with the project's path aliases
 * (`@process/...`), which bun resolves from `tsconfig.json` the same way the
 * rest of this repo's `bun run` scripts do.
 */
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { appendDesktopMcpProfile } from '@process/agent/wcore/envBuilder';
import { spliceDesktopMcpProfile } from '@process/agent/wcore/desktopProfileSplice';
import { ProjectConfigTransaction, readProjectConfigNoFollow } from '@process/agent/wcore/projectConfigTransaction';

const [targetDir, markerPath] = process.argv.slice(2);
if (!targetDir || !markerPath) {
  console.error('usage: globalProfileWriteHarness.ts <targetDir> <markerPath>');
  process.exit(1);
}

const configPath = join(targetDir, 'config.toml');
const existingBytes = readProjectConfigNoFollow(configPath);
const existing = existingBytes?.toString('utf-8') ?? null;

// Same production sequence writeGlobalMcpProfile follows: build the
// Desktop-owned fragment, splice it into the existing content, then journal
// the transaction via the SAME ProjectConfigTransaction the recovery pass
// (recoverProjectConfigTransaction) heals.
const fragment = appendDesktopMcpProfile(null, ['tavily', 'firecrawl']);
const spliced = spliceDesktopMcpProfile(existing, fragment);
ProjectConfigTransaction.begin(configPath, spliced);

// The write (marker + backup + target) is durably on disk (fsynced by
// atomicWriteProjectConfig) by the time this line runs - signal the parent
// test so it can proceed to kill this process at a known-safe point.
writeFileSync(markerPath, 'ready\n');

// Block forever. The parent test decides exactly when this process dies
// (SIGKILL), so recovery is proven against a genuinely interrupted process,
// not a simulated crash.
await new Promise(() => {});
