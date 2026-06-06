/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure CRUD over the Flux connector manifest: a JSON file of install receipts
 * keyed by tool id. A missing file reads as an empty manifest. All writes go
 * through writeAtomic (fdatasync + EXDEV-safe rename).
 */

import * as fs from 'node:fs';

import { writeAtomic } from '@process/services/ijfw/atomicFile';

import type { FluxManifest, InstallReceipt } from './types';

function emptyManifest(): FluxManifest {
  return { version: 1, tools: {} };
}

/** Read the manifest, returning an empty manifest when the file is absent. */
export async function readManifest(manifestPath: string): Promise<FluxManifest> {
  let raw: string;
  try {
    raw = await fs.promises.readFile(manifestPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyManifest();
    }
    throw err;
  }
  if (raw.trim().length === 0) {
    return emptyManifest();
  }
  // The manifest is an internal, rebuildable Wayland file. If it is corrupted,
  // degrade gracefully to an empty manifest rather than crashing every op.
  let parsed: Partial<FluxManifest>;
  try {
    parsed = JSON.parse(raw) as Partial<FluxManifest>;
  } catch {
    return emptyManifest();
  }
  return { version: 1, tools: parsed.tools ?? {} };
}

/** Look up the receipt for a single tool, if present. */
export async function getReceipt(
  manifestPath: string,
  tool: string,
): Promise<InstallReceipt | undefined> {
  const manifest = await readManifest(manifestPath);
  return manifest.tools[tool];
}

/** Merge a receipt into the manifest (keyed by receipt.tool) and persist. */
export async function setReceipt(manifestPath: string, receipt: InstallReceipt): Promise<void> {
  const manifest = await readManifest(manifestPath);
  manifest.tools[receipt.tool] = receipt;
  await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Remove a tool's receipt from the manifest and persist. */
export async function deleteReceipt(manifestPath: string, tool: string): Promise<void> {
  const manifest = await readManifest(manifestPath);
  if (manifest.tools[tool] === undefined) {
    return;
  }
  delete manifest.tools[tool];
  await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
