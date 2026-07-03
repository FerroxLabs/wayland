/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 observability rework - the "humanize the raw tool stream" layer.
 *
 * Turns a backend-agnostic ActivityNode (tool name + kind + detail) into a
 * present-progressive, file-only display label ("Reading config.ts...",
 * "Searching the web...") and a semantic glyph kind for the timeline icon.
 *
 * This is the perceived-value layer: a legible "Reading config.ts" reads as
 * real work; a raw "tool: fs_read {path:...}" reads as machine noise. Ported
 * from Foundry's deriveActivityLabel. Pure - no React, no IO, unit-tested.
 */

import type { ActivityNode } from '../chatLib';

/** Semantic glyph bucket the timeline uses to pick a leading icon. */
export type GlyphKind =
  | 'reasoning'
  | 'web'
  | 'file'
  | 'command'
  | 'search'
  | 'sub_agent'
  | 'tool'
  | 'cost'
  | 'circuit'
  | 'browser'
  | 'cua';

/** Last path segment, `\` normalized, capped for brevity (no full-path leakage). */
export const truncateToFilename = (p: string): string => {
  const norm = p.replace(/\\/g, '/').replace(/\/+$/, '');
  const seg = norm.split('/').pop() || norm;
  return seg.length > 40 ? `${seg.slice(0, 39)}…` : seg;
};

/** Host of the first URL in a string, else the trimmed string capped. */
const hostOrText = (s: string): string => {
  const m = s.match(/https?:\/\/([^/\s"']+)/i);
  if (m) return m[1].replace(/^www\./, '');
  const t = s.trim();
  return t.length > 40 ? `${t.slice(0, 39)}…` : t;
};

/** First path-ish token found in a haystack (tool args / detail), else ''. */
const firstPath = (s: string): string => {
  const m = s.match(/[\w./\\-]+\.[a-z0-9]{1,6}\b/i);
  return m ? m[0] : '';
};

/**
 * #520 - a one-line, capped rendering of a raw command for the timeline label.
 * Collapses whitespace/newlines (a heredoc must not blow up the row) and caps
 * length so a long command stays a legible single line; the full text remains
 * available in the expandable detail.
 */
const CMD_LABEL_CAP = 64;
export const formatCommandLabel = (command: string): string => {
  // Drop a leading "Execute: " the wcore mapper prefixes onto the description
  // fallback, so we show the bare command either way.
  const bare = command
    .replace(/^execute:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const capped = bare.length > CMD_LABEL_CAP ? `${bare.slice(0, CMD_LABEL_CAP - 1)}…` : bare;
  return `Running ${capped}`;
};

type LabelRule = {
  /** matches against the lowercased "name + ' ' + detail" haystack. */
  test: RegExp;
  /** builds the label; `hay` is the original-case haystack for path/host extraction. */
  build: (hay: string) => string;
  glyph: GlyphKind;
};

// Ordered: first match wins. Tool names from wcore (web_search, WebFetch, Read,
// Write, Bash, Grep...), Gemini (google_search, url_context), Codex
// (exec_command, web_search) and ACP titles all funnel through here.
const RULES: LabelRule[] = [
  {
    test: /web[_-]?search|google[_-]?search|search[_-]?web|brave[_-]?search|^web\b/,
    glyph: 'web',
    build: (h) => {
      const q = hostOrText(h.replace(/.*?(query|q|search)["':\s]+/i, '')).trim();
      // Drop the suffix when the query can't be cleanly extracted (e.g. the bare
      // Flux `web` tool, where the arg shape leaves junk like "web").
      return q && q.toLowerCase() !== 'web' ? `Searching the web for "${q}"` : 'Searching the web';
    },
  },
  {
    test: /webfetch|url[_-]?context|fetch[_-]?url|http[_-]?get|browse/,
    glyph: 'web',
    build: (h) => `Reading ${hostOrText(h)}`,
  },
  {
    test: /\b(read|open|cat|view)[_-]?file|\bfs[_-]?read|\bread\b/,
    glyph: 'file',
    build: (h) => `Reading ${truncateToFilename(firstPath(h) || 'a file')}`,
  },
  {
    test: /str[_-]?replace|editor|fs[_-]?write|\b(write|edit|update|modify|patch|apply)/,
    glyph: 'file',
    build: (h) => `Editing ${truncateToFilename(firstPath(h) || 'a file')}`,
  },
  {
    test: /\bcreate[_-]?file|\bnew[_-]?file|\btouch\b/,
    glyph: 'file',
    build: (h) => `Creating ${truncateToFilename(firstPath(h) || 'a file')}`,
  },
  {
    test: /\b(delete|remove|rm|unlink)[_-]?file|\brm\b/,
    glyph: 'file',
    build: (h) => `Removing ${truncateToFilename(firstPath(h) || 'a file')}`,
  },
  {
    test: /grep|ripgrep|\bfind\b|glob|search[_-]?code|codebase/,
    glyph: 'search',
    build: () => 'Searching the codebase',
  },
  { test: /\b(run|exec)[_-]?(test|spec)|\btest\b/, glyph: 'command', build: () => 'Running tests' },
  {
    test: /exec[_-]?command|\bbash\b|\bshell\b|\bcommand\b|run[_-]?command|terminal/,
    glyph: 'command',
    build: () => 'Running a command',
  },
  {
    test: /\binstall\b|npm|pnpm|bun[_-]?install|pip[_-]?install/,
    glyph: 'command',
    build: () => 'Installing dependencies',
  },
  { test: /\bbuild\b|compile|bundle|tsc/, glyph: 'command', build: () => 'Building' },
];

/**
 * Derive the display label + glyph kind for a node. `thinking` and `sub_agent`
 * are handled by kind directly; everything else (tools, ops) runs the rule list,
 * falling back to a cleaned tool name so a label is ALWAYS produced (never blank).
 */
export const deriveStep = (
  node: Pick<ActivityNode, 'kind' | 'name' | 'detail' | 'command'>
): { label: string; glyph: GlyphKind } => {
  if (node.kind === 'thinking') return { label: 'Reasoning', glyph: 'reasoning' };
  if (node.kind === 'sub_agent') return { label: node.name || 'Sub-agent working', glyph: 'sub_agent' };
  if (node.kind === 'cost') return { label: 'Tallying cost', glyph: 'cost' };
  if (node.kind === 'circuit')
    return { label: node.name ? `Switched provider (${node.name})` : 'Switched provider', glyph: 'circuit' };
  if (node.kind === 'browser') return { label: node.name || 'Browsing', glyph: 'browser' };
  if (node.kind === 'cua') return { label: node.name || 'Operating the screen', glyph: 'cua' };

  const hay = `${node.name || ''} ${node.detail || ''}`;
  const lower = hay.toLowerCase();
  const command = node.command?.trim();
  for (const rule of RULES) {
    if (rule.test.test(lower)) {
      // #520: for a shell/command tool, show the ACTUAL command instead of the
      // generic "Running a command" - that visibility is the whole point of the
      // fix. Non-command glyphs (file/web/search) keep their richer humanized
      // labels, which already name the file/host/query.
      if (rule.glyph === 'command' && command) return { label: formatCommandLabel(command), glyph: 'command' };
      return { label: rule.build(hay), glyph: rule.glyph };
    }
  }
  // Fallback: cleaned tool name, title-ish, always non-empty.
  const clean = (node.name || 'tool').replace(/[_-]+/g, ' ').trim();
  return { label: clean.charAt(0).toUpperCase() + clean.slice(1), glyph: 'tool' };
};
