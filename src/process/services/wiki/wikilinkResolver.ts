/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Parse and resolve [[wikilink]] references from WikiConcept body text.
 * Obsidian-compatible: handles [[Concept Name]] and [[Concept Name|alias]] syntax.
 */

import type { WikiState } from '@/common/types/memory';

export type ParsedWikilink = {
  raw: string;
  name: string;
  position: number;
};

const WIKILINK_RE_SOURCE = String.raw`\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]`;

/**
 * Parse all [[wikilinks]] from body text.
 * Alias syntax [[Concept|alias]] resolves name to "Concept" (not the alias).
 */
export function parseWikilinks(body: string): ParsedWikilink[] {
  const results: ParsedWikilink[] = [];
  const re = new RegExp(WIKILINK_RE_SOURCE, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    results.push({
      raw: match[0],
      name: match[1].trim(),
      position: match.index,
    });
  }
  return results;
}

/**
 * Resolve a wikilink name against the WikiState concept index.
 * Case-insensitive. Checks concept name and aliases array.
 * Returns {slug, name} on match; {slug: null, name: null} for orphan.
 */
export function resolveWikilink(
  name: string,
  state: WikiState,
): { slug: string | null; name: string | null } {
  const lower = name.toLowerCase();
  for (const concept of state.concepts) {
    if (concept.name.toLowerCase() === lower) {
      return { slug: concept.slug, name: concept.name };
    }
    for (const alias of concept.aliases) {
      if (alias.toLowerCase() === lower) {
        return { slug: concept.slug, name: concept.name };
      }
    }
  }
  return { slug: null, name: null };
}
