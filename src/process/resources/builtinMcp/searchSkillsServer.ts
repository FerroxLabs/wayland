/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Built-in MCP server factory for the skill-discovery tools.
 * Returns an object with two tool methods (`call` for search, `readSkill` for
 * paginated body reads) - not a stdio server. Wired into the builtin MCP
 * catalog by the caller.
 *
 * Two-step retrieval (issue #199): `call` returns lightweight metadata by
 * default (name, description, score, excerpt, body size) so a 25-hit search no
 * longer serialises ~40k tokens of inline bodies and blow Claude Code's 25k
 * Read cap on the persisted tool result. Full bodies are fetched on demand,
 * either inline-but-capped via `includeBody`, or page-by-page via `readSkill`.
 *
 * The BM25 index is built once per server instance on the first `call` and
 * cached thereafter.
 */

import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillRetriever } from '@process/services/skills/SkillRetriever';

// ---------------------------------------------------------------------------
// Tuning constants (kept local - this factory is bundled into the standalone
// stdio subprocess and must avoid dragging in config/storage side effects).
// These are also the robustness boundary: the zod schema in the entrypoint
// constrains inputs, but every size knob is re-clamped here so a malformed or
// adversarial call can never reproduce the oversized-output bug.
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;
/** When bodies are inlined, return at most this many hits regardless of limit. */
const INCLUDE_BODY_LIMIT_CAP = 8;
const DEFAULT_MAX_BODY_CHARS = 2000;
const MAX_INLINE_BODY_CHARS = 4000;
const EXCERPT_CHARS = 240;
/** Rough chars-per-token heuristic for body-size estimates. */
const CHARS_PER_TOKEN = 4;
const DEFAULT_READ_CHARS = 8000;
const MAX_READ_CHARS = 20000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SearchSkillHit = {
  name: string;
  description: string;
  score: number;
  /** First slice of the body (frontmatter stripped, whitespace collapsed). */
  excerpt: string;
  /** Total body length in characters - lets the caller plan pagination. */
  bodyChars: number;
  /** Approximate token cost of the FULL body (bodyChars / 4, rounded up). */
  bodyTokenEstimate: number;
  /** Present only when `includeBody` is true; capped at `maxBodyChars`. */
  body?: string;
  /** True when an inlined `body` was truncated to `maxBodyChars`. */
  bodyTruncated?: boolean;
};

export type SearchSkillsResult = {
  results: SearchSkillHit[];
  message?: string;
};

export type ReadSkillResult = {
  name: string;
  found: boolean;
  /** The slice [offset, offset + maxChars); absent when `found` is false. */
  body?: string;
  /** Start index of the returned slice within the full body. */
  offset: number;
  /** Total body length in characters. */
  totalChars: number;
  /** Offset to pass for the next page, or null when the body is exhausted. */
  nextOffset: number | null;
  /** Approximate token cost of the FULL body. */
  bodyTokenEstimate: number;
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
// Helpers
// ---------------------------------------------------------------------------

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Math.trunc(value), min), max);

const estimateTokens = (chars: number): number => Math.ceil(chars / CHARS_PER_TOKEN);

/** A short, readable preview: strip a leading YAML frontmatter block, collapse
 * whitespace, and cap at EXCERPT_CHARS so the search payload stays tiny. */
const makeExcerpt = (body: string): string => {
  const withoutFrontmatter = body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const collapsed = withoutFrontmatter.replace(/\s+/g, ' ').trim();
  return collapsed.length > EXCERPT_CHARS ? `${collapsed.slice(0, EXCERPT_CHARS)}…` : collapsed;
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

    async call({
      query,
      limit = DEFAULT_LIMIT,
      includeBody = false,
      maxBodyChars = DEFAULT_MAX_BODY_CHARS,
    }: {
      query: string;
      limit?: number;
      includeBody?: boolean;
      maxBodyChars?: number;
    }): Promise<SearchSkillsResult> {
      await ensureIndex();

      // Re-clamp every size knob here so oversized output is impossible no
      // matter what the caller sends. Inlining bodies tightens the cap further.
      const effectiveLimit = includeBody
        ? clamp(limit, 1, INCLUDE_BODY_LIMIT_CAP)
        : clamp(limit, 1, MAX_LIMIT);
      const bodyCap = clamp(maxBodyChars, 1, MAX_INLINE_BODY_CHARS);

      const hits = retrieverInstance!.retrieve(query, effectiveLimit);

      if (hits.length === 0) {
        return {
          results: [],
          message: `No skills found matching '${query}' - try different terms.`,
        };
      }

      const results: SearchSkillHit[] = [];
      for (const hit of hits) {
        // Blocked/quarantined skills load as null and are NEVER surfaced.
        const body = await library.loadBody(hit.name);
        if (body === null) continue;

        const bodyChars = body.length;
        const entry: SearchSkillHit = {
          name: hit.name,
          description: hit.description,
          score: hit.score,
          excerpt: makeExcerpt(body),
          bodyChars,
          bodyTokenEstimate: estimateTokens(bodyChars),
        };
        if (includeBody) {
          const truncated = bodyChars > bodyCap;
          entry.body = truncated ? body.slice(0, bodyCap) : body;
          entry.bodyTruncated = truncated;
        }
        results.push(entry);
      }

      if (results.length === 0) {
        return {
          results: [],
          message: `Found ${hits.length} matching skills but none could be loaded.`,
        };
      }

      return { results };
    },

    /** Read one named skill body, paginated. Use after `call` to pull the full
     * instructions for a chosen skill without the whole result set. */
    async readSkill({
      name,
      offset = 0,
      maxChars = DEFAULT_READ_CHARS,
    }: {
      name: string;
      offset?: number;
      maxChars?: number;
    }): Promise<ReadSkillResult> {
      const body = await library.loadBody(name);
      if (body === null) {
        return {
          name,
          found: false,
          offset: 0,
          totalChars: 0,
          nextOffset: null,
          bodyTokenEstimate: 0,
          message: `Skill '${name}' was not found or is unavailable (unknown or blocked).`,
        };
      }

      const totalChars = body.length;
      const start = clamp(offset, 0, totalChars);
      const pageChars = clamp(maxChars, 1, MAX_READ_CHARS);
      const slice = body.slice(start, start + pageChars);
      const end = start + slice.length;

      return {
        name,
        found: true,
        body: slice,
        offset: start,
        totalChars,
        nextOffset: end < totalChars ? end : null,
        bodyTokenEstimate: estimateTokens(totalChars),
      };
    },
  };
};
