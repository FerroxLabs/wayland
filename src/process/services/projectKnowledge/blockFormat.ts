/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shape of the blocks injected into a conversation's system-rules channel.
 *
 * Kept in its own leaf module so both the composer (`knowledge.ts`) and the
 * spawn-time refresh (`injection.ts`) can share the literals without importing
 * each other.
 */

/** Separator between the assistant's own rules and each injected block. */
export const INJECTED_BLOCK_SEPARATOR = '\n\n---\n\n';

/**
 * Sentinels delimiting an injected project-knowledge block. The spawn-time
 * refresh (#999) finds a previously injected block by these markers and removes
 * header-to-footer, so the boundary can never be confused with a `---` thematic
 * break the user happened to type into their own knowledge documents.
 *
 * The header must stay byte-identical forever: conversations created before the
 * footer existed carry this exact literal and are still refreshed by it.
 *
 * Neither literal may appear in composed body text - `loadProjectKnowledgeBlock`
 * strips both out of user content so a hand-typed sentinel cannot truncate the
 * block.
 */
export const PROJECT_KNOWLEDGE_BLOCK_HEADER = '[Project Knowledge - shared context for every chat in this project]';
export const PROJECT_KNOWLEDGE_BLOCK_FOOTER = '[/Project Knowledge]';
