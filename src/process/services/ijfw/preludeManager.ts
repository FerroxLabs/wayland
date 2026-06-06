/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW prelude manager - mutates IJFW-managed blocks in CLAUDE.md / AGENTS.md /
 * GEMINI.md / .cursorrules based on install status. NEVER injects new markers
 * into foreign files - only manages files that already opted in by placing the
 * <!-- IJFW-PRELUDE-START --> / <!-- IJFW-PRELUDE-END --> sentinels.
 * Fixes R-P03 / Decision 2a.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import log from 'electron-log';

const MARK_START = '<!-- IJFW-PRELUDE-START -->';
const MARK_END = '<!-- IJFW-PRELUDE-END -->';
const DISABLED_NOTICE =
  '<!-- IJFW-PRELUDE-DISABLED-BY-WAYLAND: Memory layer initializing. -->';
const PRELUDE_BLOCK =
  'Project memory at .ijfw/memory/. Call `ijfw_memory_prelude` for full context.';

const MANAGED_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', '.cursorrules'] as const;

/**
 * Local mirror of the IjfwStatus union that Wave 1 will add to
 * `@/common/adapter/ipcBridge`. Replace this with the shared import once that
 * surface lands.
 */
export type IjfwStatus =
  | 'unknown'
  | 'installing'
  | 'install_failed'
  | 'uninstalled'
  | 'installed_empty'
  | 'installed_current'
  | 'installed_outdated';

export interface PreludeTarget {
  projectDir: string;
  files: string[];
}

export async function applyPreludeForStatus(
  status: IjfwStatus,
  targets: PreludeTarget[],
): Promise<void> {
  const shouldEnable = status === 'installed_current' || status === 'installed_empty';
  for (const t of targets) {
    for (const filename of t.files) {
      const filePath = path.join(t.projectDir, filename);
      try {
        await mutatePreludeBlock(filePath, shouldEnable);
      } catch (err) {
        log.warn('[ijfw-prelude] mutate failed', { filePath, err });
      }
    }
  }
}

async function mutatePreludeBlock(filePath: string, enable: boolean): Promise<void> {
  let content: string;
  try {
    content = await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    // File missing - leave it alone. Never inject markers into a non-existent
    // (or foreign) file.
    return;
  }

  const startIdx = content.indexOf(MARK_START);
  const endIdx = content.indexOf(MARK_END);

  // Only manage files that already opted in by containing the markers.
  if (startIdx < 0 || endIdx <= startIdx) return;

  const body = enable ? PRELUDE_BLOCK : DISABLED_NOTICE;
  const newBlock = `${MARK_START}\n${body}\n${MARK_END}`;
  const before = content.slice(0, startIdx);
  const after = content.slice(endIdx + MARK_END.length);
  const updated = before + newBlock + after;
  if (updated !== content) {
    await fs.promises.writeFile(filePath, updated, 'utf-8');
  }
}

export async function discoverTargets(projectDirs: string[]): Promise<PreludeTarget[]> {
  const out: PreludeTarget[] = [];
  for (const dir of projectDirs) {
    const found: string[] = [];
    for (const filename of MANAGED_FILES) {
      const fp = path.join(dir, filename);
      try {
        const content = await fs.promises.readFile(fp, 'utf-8');
        if (content.includes(MARK_START)) found.push(filename);
      } catch {
        /* missing - skip */
      }
    }
    if (found.length > 0) out.push({ projectDir: dir, files: found });
  }
  return out;
}
