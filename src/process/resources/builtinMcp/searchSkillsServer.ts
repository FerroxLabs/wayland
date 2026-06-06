/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Built-in MCP server factory for wayland_search_skills.
 * Returns an object with a single tool `call` method - not a stdio server.
 * Intended to be wired into the builtin MCP catalog by the caller.
 *
 * The BM25 index is built once per server instance on the first call and
 * cached thereafter.
 */

import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillRetriever } from '@process/services/skills/SkillRetriever';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SearchSkillsResult = {
  results: Array<{ name: string; description: string; score: number; body: string }>;
  message?: string;
};

export type SearchSkillsDeps = {
  library?: {
    list(): Promise<SkillIndexEntry[]>;
    loadBody(name: string): Promise<string | null>;
  };
  retriever?: {
    retrieve(query: string, limit: number): Array<{ name: string; description: string; score: number }>;
  };
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createSearchSkillsServer = (deps: SearchSkillsDeps = {}) => {
  const library = deps.library ?? SkillLibrary.getInstance();
  let retrieverInstance = deps.retriever;
  let indexed = false;

  const ensureIndex = async () => {
    if (indexed) return;
    if (!retrieverInstance) {
      const entries = await library.list();
      SkillRetriever.resetInstance();
      retrieverInstance = SkillRetriever.getInstance({ entries });
    }
    indexed = true;
  };

  return {
    name: 'wayland_search_skills',

    async call({ query, limit = 25 }: { query: string; limit?: number }): Promise<SearchSkillsResult> {
      await ensureIndex();

      const hits = retrieverInstance!.retrieve(query, limit);

      if (hits.length === 0) {
        return {
          results: [],
          message: `No skills found matching '${query}' - try different terms.`,
        };
      }

      const results: SearchSkillsResult['results'] = [];
      for (const hit of hits) {
        const body = await library.loadBody(hit.name);
        if (body !== null) {
          results.push({ ...hit, body });
        }
      }

      if (results.length === 0) {
        return {
          results: [],
          message: `Found ${hits.length} matching skills but none could be loaded.`,
        };
      }

      return { results };
    },
  };
};
