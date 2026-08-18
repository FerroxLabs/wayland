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
 * The block is therefore delimited by a stable header AND a footer, and is
 * REPLACED rather than appended, so the same composition can run again at every
 * agent spawn. The header literal is unchanged from the original injection, so a
 * conversation created before this module existed is refreshed too - but a
 * pre-footer block has no exact end marker, so its extent is inferred; see
 * `projectKnowledgeBlockEnd` for what that costs and why it errs the way it does.
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
 * Opening shape of the global-memory block - the only block ever appended after
 * project knowledge: a bracketed label alone on its line, a blank line, then its
 * first `## ` section heading. The label itself CANNOT be matched as a literal,
 * because it is translated (`memory.injectedLabel`) and a conversation may have
 * been created under any locale; the shape is what is stable.
 *
 * Sticky, so it can be tested at an offset without slicing a copy of a tail that
 * may be very large.
 */
const MEMORY_BLOCK_OPENING = /\[[^\n]*\]\n\n## /y;

/**
 * Start of the global-memory block appended after `from`, or -1 if there is
 * none. Candidates are separator-joined lines opening with `[`; each is then
 * checked against the memory block's opening shape, so an ordinary bracketed
 * line in the user's own knowledge (`[2026-02-11] rotated the staging key`) is
 * not mistaken for a block boundary.
 *
 * The LAST match wins, because the memory block is always the final block in the
 * string - so any earlier match is inside the knowledge body.
 */
function memoryBlockStartAfter(value: string, from: number): number {
  const candidate = `${INJECTED_BLOCK_SEPARATOR}[`;
  let found = -1;
  for (let at = value.indexOf(candidate, from); at >= 0; at = value.indexOf(candidate, at + 1)) {
    MEMORY_BLOCK_OPENING.lastIndex = at + INJECTED_BLOCK_SEPARATOR.length;
    if (MEMORY_BLOCK_OPENING.test(value)) found = at;
  }
  return found;
}

/**
 * Index just past the end of the block that starts at `start`.
 *
 * Normally that is the matching footer. A block written before the footer
 * existed has none, so its extent must be inferred: the legacy cut runs to the
 * end of the string, stopping only where the global-memory block begins.
 *
 * `INJECTED_BLOCK_SEPARATOR` alone cannot mark that boundary - it is a plain
 * markdown thematic break, and a `---` in the user's own CONTEXT.md produces
 * exactly those bytes - so the boundary is found by the memory block's opening
 * SHAPE instead (`memoryBlockStartAfter`), scanning to the LAST match.
 *
 * This is a heuristic, and the reason it errs towards overshooting is that the
 * two failure directions are NOT equally bad. Cutting short leaves a fragment of
 * knowledge the user has since DELETED, and that fragment carries no header, so
 * `withoutProjectKnowledge` can never find it again: a rotated credential or a
 * retracted decision would stay in the system prompt for the entire life of the
 * conversation, unreachable by every later refresh. Overshooting loses a
 * creation-time snapshot of global memory whose source files are still on disk.
 *
 * Residual, deliberately accepted and covered by tests: a body that itself opens
 * like a memory block (a bracketed line alone, blank line, `## ` heading) is
 * still ambiguous. Inside a MEMORY entry it costs part of that snapshot; inside
 * a legacy knowledge body with no memory block at all it still cuts short. Both
 * need the user to have pasted block-shaped markdown into their own documents,
 * and neither can arise for a block that carries a footer.
 */
function projectKnowledgeBlockEnd(value: string, start: number): number {
  const bodyAt = start + PROJECT_KNOWLEDGE_BLOCK_HEADER.length;
  // Accept a footer ONLY where it TERMINATES the block: end of string, or the
  // separator that joins it to the next block. A bare indexOf takes the first
  // footer literal anywhere in the remainder, and a LEGACY block has no footer
  // of its own - that is the whole premise of this path. Legacy bodies predate
  // `withoutSentinels`, so they were never stripped, and once this feature
  // ships the literal appears in every project chat's system prompt: a user who
  // saves that text into Wayland Memory acquires it without typing anything.
  // Trusting a mid-body match then cuts past the memory block's opening and
  // destroys it, or stops short and orphans a deleted credential with no header
  // for any later refresh to find.
  for (
    let footerAt = value.indexOf(PROJECT_KNOWLEDGE_BLOCK_FOOTER, bodyAt);
    footerAt >= 0;
    footerAt = value.indexOf(PROJECT_KNOWLEDGE_BLOCK_FOOTER, footerAt + 1)
  ) {
    const after = footerAt + PROJECT_KNOWLEDGE_BLOCK_FOOTER.length;
    if (after === value.length || value.startsWith(INJECTED_BLOCK_SEPARATOR, after)) return after;
  }
  const memoryAt = memoryBlockStartAfter(value, bodyAt);
  return memoryAt >= 0 ? memoryAt : value.length;
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
