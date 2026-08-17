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
 * Stable first line of every injected project-knowledge block. It is the handle
 * the spawn-time refresh (#999) uses to find and replace a block captured
 * earlier, so it must stay byte-identical: conversations created before that
 * refresh existed carry this exact literal.
 */
export const PROJECT_KNOWLEDGE_BLOCK_HEADER = '[Project Knowledge - shared context for every chat in this project]';
