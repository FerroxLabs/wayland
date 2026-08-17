/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Composition of the conversation's system-rules channel (#999).
 *
 * A project chat carries its project's `.wayland/` knowledge inside
 * `extra.presetRules` / `extra.presetContext`. That string used to be built once,
 * at chat creation, and then persisted forever: editing CONTEXT.md afterwards
 * never reached the conversation, so a user who fixed a mistake in their project
 * knowledge had to start a brand new chat before the agent saw the correction.
 *
 * The block is therefore delimited by a stable header and is REPLACED rather
 * than appended, so the same composition can run again at every agent spawn.
 * The header literal is unchanged from the original injection, so a conversation
 * created before this module existed is refreshed correctly too.
 *
 * Main-process only.
 */

import { SqliteProjectRepository } from '@process/services/database/SqliteProjectRepository';
import { INJECTED_BLOCK_SEPARATOR, PROJECT_KNOWLEDGE_BLOCK_HEADER } from './blockFormat';
import { loadProjectKnowledgeBlock } from './knowledge';

/**
 * The `extra` keys that carry the system-rules channel. Which one a backend
 * reads is not cosmetic - gemini + wcore read `presetRules`, acp reads
 * `presetContext` - so both are always kept in step.
 */
const SYSTEM_RULES_FIELDS = ['presetRules', 'presetContext'] as const;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Drop every previously injected project-knowledge block from one field. */
function withoutProjectKnowledge(value: unknown): string {
  const current = asString(value);
  if (!current.includes(PROJECT_KNOWLEDGE_BLOCK_HEADER)) return current;
  return current
    .split(INJECTED_BLOCK_SEPARATOR)
    .filter((segment) => !segment.trimStart().startsWith(PROJECT_KNOWLEDGE_BLOCK_HEADER))
    .join(INJECTED_BLOCK_SEPARATOR)
    .trim();
}

/**
 * Append an injected block to both system-rules fields, preserving whatever the
 * assistant preset already put there. Used for the global memory block, which is
 * injected at creation only.
 */
export function appendInjectedBlock(extra: Record<string, unknown>, block: string): void {
  if (!block) return;
  for (const field of SYSTEM_RULES_FIELDS) {
    extra[field] = [asString(extra[field]), block].filter(Boolean).join(INJECTED_BLOCK_SEPARATOR);
  }
}

/**
 * Re-compose this conversation's project-knowledge block from what is on disk
 * RIGHT NOW, replacing any block captured earlier. Mutates `extra` in place and
 * returns true when something changed, so the caller can persist the update -
 * mirroring `enforceProjectWorkspace`.
 *
 * A chat with no `projectId` is left completely untouched: it never received a
 * block, and a lookup would be pointless work on every spawn.
 *
 * Every failure returns false WITHOUT stripping. A knowledge read that fails
 * must not silently delete context the agent already had; the failure direction
 * is "keep what we have", never "drop it".
 */
export async function refreshProjectKnowledge(extra: Record<string, unknown> | undefined): Promise<boolean> {
  const projectId = extra?.projectId as string | undefined;
  if (!extra || !projectId) return false;

  let block = '';
  try {
    const project = await new SqliteProjectRepository().getProject(projectId);
    const workspace = project?.workspace;
    if (!workspace) return false;
    block = await loadProjectKnowledgeBlock(workspace);
  } catch (err) {
    console.error('[projectKnowledge] #999 refresh failed, keeping the existing block:', err);
    return false;
  }

  let changed = false;
  for (const field of SYSTEM_RULES_FIELDS) {
    const before = extra[field];
    const base = withoutProjectKnowledge(before);
    const next = [base, block].filter(Boolean).join(INJECTED_BLOCK_SEPARATOR);
    // An empty result reads as "no preset rules" for every backend, which is the
    // shape a chat with no knowledge has always had - so clear the key rather
    // than persisting an empty string.
    const resolved = next.length > 0 ? next : undefined;
    if (resolved === before) continue;
    // A field that was absent and stays absent is not a change.
    if (resolved === undefined && before === undefined) continue;
    extra[field] = resolved;
    changed = true;
  }
  return changed;
}
