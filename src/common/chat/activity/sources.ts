/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 / #26 - shared source-block types and parsers.
 *
 * `Source` is the renderer-facing shape for a single search result card
 * (favicon + title + domain). Two backends feed into it:
 *   - Codex: structured `SearchResult[]` from WebSearchEndData (fully typed).
 *   - wcore: opaque tool_result `output` string (defensive JSON parse).
 *
 * Both paths ultimately produce `Source[]`; downstream `SourceBlock` renders
 * them identically. Pure - no React, no IO, NEVER throws.
 */

import type { SearchResult } from '@/common/types/codex/types/eventData';

export type Source = {
  title?: string;
  url?: string;
  domain?: string;
  favicon?: string;
  snippet?: string;
};

/**
 * Build a Google favicon URL for a given page URL.
 * Strips `www.` so the chip shows the bare domain.
 * Returns undefined when the URL is not parseable.
 */
export function faviconFor(url: string): string | undefined {
  try {
    const { hostname } = new URL(url);
    const domain = hostname.replace(/^www\./, '');
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return undefined;
  }
}

/**
 * Extract the bare domain (no `www.`) from a URL string.
 * Returns undefined on parse failure.
 */
function domainFor(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * Coerce an unknown parsed JSON value into a `Source`, or return null when the
 * item lacks both title and url (not useful to display).
 */
function itemToSource(item: unknown): Source | null {
  if (typeof item !== 'object' || item === null) return null;
  const obj = item as Record<string, unknown>;
  const url = typeof obj['url'] === 'string' ? obj['url'] : undefined;
  const title = typeof obj['title'] === 'string' ? obj['title'] : undefined;
  const snippet = typeof obj['snippet'] === 'string' ? obj['snippet'] : undefined;
  if (!url && !title) return null;
  return {
    title,
    url,
    domain: url ? domainFor(url) : undefined,
    favicon: url ? faviconFor(url) : undefined,
    snippet,
  };
}

/**
 * Parse the wcore `web_search` tool_result output string into Source[].
 *
 * Accepted shapes (any extras are silently ignored):
 *   - `[{ title, url, ... }, ...]`            array at root
 *   - `{ results: [{ title, url }, ...] }`    nested under `results`
 *   - `{ sources: [{ title, url }, ...] }`    nested under `sources`
 *   - `{ data: { web: [{ title, url }, ...] } }`  native wcore `web` tool
 *
 * The wcore `web` tool (operation=search) returns the last shape: a JSON
 * envelope whose `data.web[]` entries each carry `{ title, url, snippet }`
 * (the snippet is itself markdown). Captured live against Flux 0.12.8.
 *
 * Any other string (prose, malformed JSON, empty) returns [].
 * NEVER throws.
 */
export function parseWcoreSearchOutput(output: string): Source[] {
  if (!output) return [];
  try {
    const parsed: unknown = JSON.parse(output);
    let items: unknown[] | null = null;
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj['results'])) items = obj['results'];
      else if (Array.isArray(obj['sources'])) items = obj['sources'];
      else if (typeof obj['data'] === 'object' && obj['data'] !== null) {
        const data = obj['data'] as Record<string, unknown>;
        if (Array.isArray(data['web'])) items = data['web'];
      }
    }
    if (!items) return [];
    const out: Source[] = [];
    for (const item of items) {
      const s = itemToSource(item);
      if (s) out.push(s);
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Map Codex `SearchResult[]` (fully typed) into `Source[]`.
 */
export function codexResultsToSources(results: SearchResult[]): Source[] {
  const out: Source[] = [];
  for (const r of results) {
    if (!r.url && !r.title) continue;
    out.push({
      title: r.title,
      url: r.url,
      domain: r.url ? domainFor(r.url) : undefined,
      favicon: r.url ? faviconFor(r.url) : undefined,
      snippet: r.snippet,
    });
  }
  return out;
}
