/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #455 scope 4 - managed `.gitignore` for persistent project workspaces.
 *
 * Native skill discovery requires the engine/CLIs to find their skill dirs at
 * the workspace ROOT (the wayland-core engine scans `<cwd>/.wayland-core/skills`,
 * each ACP CLI scans its own `.<tool>/skills`; this is hard-coded relative to the
 * spawn cwd, with no env/arg override). For a persistent, user-visible project
 * workspace those managed dot-dirs (plus the `.wayland/` knowledge folder) would
 * otherwise clutter the user's folder and git status, so we add them to a managed
 * `.gitignore` block. The block is marked and idempotent so it never duplicates,
 * and it is appended (never overwrites) so a user's own .gitignore is preserved.
 */
import fs from 'fs/promises';
import path from 'path';
import { ACP_BACKENDS_ALL } from '@/common/types/acpTypes';

export const MANAGED_GITIGNORE_START = '# --- Wayland (managed): skill symlinks & knowledge, safe to keep ---';
const MANAGED_GITIGNORE_END = '# --- end Wayland ---';

/**
 * The top-level dot-dirs Wayland creates inside a project workspace: every ACP
 * backend's skill dir, the wcore + gemini engine skill dirs, and the `.wayland/`
 * knowledge folder. Derived from ACP_BACKENDS_ALL so new backends stay covered.
 */
function managedEntries(): string[] {
  const dirs = new Set<string>(['.wayland/', '.wayland-core/', '.gemini/']);
  for (const cfg of Object.values(ACP_BACKENDS_ALL)) {
    for (const dir of cfg.skillsDirs ?? []) {
      const top = dir.split('/')[0];
      if (top) dirs.add(top.endsWith('/') ? top : `${top}/`);
    }
  }
  return [...dirs].toSorted();
}

/**
 * Given the current `.gitignore` contents (empty string when absent), return the
 * contents to write so the managed block is present, or `null` when no change is
 * needed (the block is already there - idempotent). User content is preserved.
 */
export function buildManagedGitignore(existing: string): string | null {
  if (existing.includes(MANAGED_GITIGNORE_START)) return null;
  const block = [MANAGED_GITIGNORE_START, ...managedEntries(), MANAGED_GITIGNORE_END].join('\n');
  if (!existing.trim()) return `${block}\n`;
  return `${existing.replace(/\s*$/, '')}\n\n${block}\n`;
}

/**
 * Ensure the managed block is present in `<workspace>/.gitignore`. Best-effort
 * and idempotent: reads the current file (treating absent as empty), and writes
 * only when the block is missing. Never throws - failing to write a .gitignore
 * must not block chat creation.
 */
export async function writeWorkspaceGitignore(workspace: string): Promise<void> {
  const file = path.join(workspace, '.gitignore');
  let existing = '';
  try {
    existing = await fs.readFile(file, 'utf8');
  } catch {
    // No .gitignore yet - treat as empty.
  }
  const next = buildManagedGitignore(existing);
  if (next === null) return;
  try {
    await fs.writeFile(file, next, 'utf8');
  } catch (err) {
    // Best-effort: a read-only / full workspace must not block chat creation.
    console.error('[workspaceGitignore] Failed to write .gitignore:', err);
  }
}
