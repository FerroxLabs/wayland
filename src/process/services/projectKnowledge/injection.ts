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
import {
  INJECTED_BLOCK_SEPARATOR,
  PROJECT_KNOWLEDGE_BLOCK_FOOTER,
  PROJECT_KNOWLEDGE_BLOCK_HEADER,
} from './blockFormat';
import { loadProjectKnowledgeBlock } from './knowledge';

/**
 * The `extra` keys that carry the system-rules channel. Which one a backend
 * reads is not cosmetic - gemini + wcore read `presetRules`, acp reads
 * `presetContext` - so both are always kept in step.
 */
const SYSTEM_RULES_FIELDS = ['presetRules', 'presetContext'] as const;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Index just past the end of the block that starts at `start`.
 *
 * Normally that is the matching footer. A block written before the footer
 * existed has none, and its extent cannot be found by splitting on the block
 * separator - `INJECTED_BLOCK_SEPARATOR` is a plain markdown thematic break, and
 * a `---` in the user's own CONTEXT.md produces exactly those bytes. So the
 * legacy cut runs to the end of the string, stopping only at the start of the
 * next separator-joined block: the global-memory block is the only thing ever
 * appended after project knowledge, and it always opens with `[`.
 *
 * A user whose knowledge contains a thematic break followed by a line opening
 * with `[` cuts short, leaving one stale fragment behind. That is bounded and
 * one-shot - the replacement block carries a footer, so every later refresh is
 * exact - and it is the safe direction: overshooting would silently delete the
 * conversation's global-memory snapshot.
 */
function projectKnowledgeBlockEnd(value: string, start: number): number {
  const bodyAt = start + PROJECT_KNOWLEDGE_BLOCK_HEADER.length;
  const footerAt = value.indexOf(PROJECT_KNOWLEDGE_BLOCK_FOOTER, bodyAt);
  if (footerAt >= 0) return footerAt + PROJECT_KNOWLEDGE_BLOCK_FOOTER.length;
  const nextBlockAt = value.indexOf(`${INJECTED_BLOCK_SEPARATOR}[`, bodyAt);
  return nextBlockAt >= 0 ? nextBlockAt : value.length;
}

/** Drop every previously injected project-knowledge block from one field. */
function withoutProjectKnowledge(value: unknown): string {
  let out = asString(value);
  for (;;) {
    const start = out.indexOf(PROJECT_KNOWLEDGE_BLOCK_HEADER);
    if (start < 0) return out;
    const end = projectKnowledgeBlockEnd(out, start);
    // Take the separator that joined this block to a neighbour with it, so the
    // removal never leaves a dangling `---`. Exactly one side, never both: the
    // separators further out belong to the neighbours, not to this block.
    let cutStart = start;
    let cutEnd = end;
    if (
      start >= INJECTED_BLOCK_SEPARATOR.length &&
      out.slice(start - INJECTED_BLOCK_SEPARATOR.length, start) === INJECTED_BLOCK_SEPARATOR
    ) {
      cutStart = start - INJECTED_BLOCK_SEPARATOR.length;
    } else if (out.slice(end, end + INJECTED_BLOCK_SEPARATOR.length) === INJECTED_BLOCK_SEPARATOR) {
      cutEnd = end + INJECTED_BLOCK_SEPARATOR.length;
    }
    out = out.slice(0, cutStart) + out.slice(cutEnd);
  }
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
