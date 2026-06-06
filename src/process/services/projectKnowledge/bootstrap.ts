/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';

/** Directory name for per-project knowledge, mounted at the project workspace root. */
export const WAYLAND_KNOWLEDGE_DIR = '.wayland';

/**
 * Bootstrap a `.wayland/` knowledge folder at the project workspace root.
 *
 * Scoped per project (lives inside the project's own workspace dir) and only
 * read by conversations that carry that project's `projectId` - this is the
 * deliberate fix for the old Foundry "notebooks leaked into every chat" bug:
 * knowledge is never global, it is anchored to one workspace and surfaced only
 * through a project-scoped MCP server (see ./mcpConfig).
 *
 * Idempotent: existing files are never overwritten, so user edits survive
 * re-bootstrap (e.g. when a workspace is set on an existing project).
 */
export async function bootstrapProjectKnowledge(
  workspace: string,
  projectName: string,
  description?: string
): Promise<void> {
  if (!workspace || !workspace.trim()) return;

  const root = path.join(workspace, WAYLAND_KNOWLEDGE_DIR);
  await fs.mkdir(path.join(root, 'reference'), { recursive: true });

  await writeIfAbsent(
    path.join(root, 'CONTEXT.md'),
    `# ${projectName}\n\n${description ? description + '\n\n' : ''}> Project context for Wayland. Edit this file to give every chat in this project shared background.\n`
  );
  await writeIfAbsent(
    path.join(root, 'rules.md'),
    `# Rules & conventions\n\n> Conventions every conversation in this project should follow. (Optional - delete if unused.)\n`
  );
  await writeIfAbsent(
    path.join(root, 'decisions.md'),
    `# Decisions\n\n> A running log of decisions made in this project, so future chats don't relitigate them.\n`
  );
}

/** Write a file only if it does not already exist (preserves user edits). */
async function writeIfAbsent(filePath: string, content: string): Promise<void> {
  try {
    await fs.access(filePath);
    // Exists - leave it untouched.
  } catch {
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

/** True if a workspace has a `.wayland/` knowledge folder with at least one readable file. */
export async function hasProjectKnowledge(workspace: string): Promise<boolean> {
  if (!workspace || !workspace.trim()) return false;
  const root = path.join(workspace, WAYLAND_KNOWLEDGE_DIR);
  try {
    const entries = await fs.readdir(root);
    return entries.length > 0;
  } catch {
    return false;
  }
}
