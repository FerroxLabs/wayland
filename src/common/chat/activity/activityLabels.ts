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
 * real work; a raw "tool: fs_read {path:...}" reads as machine noise. Pure - no
 * React, no IO, unit-tested.
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

/** Keeps a fallback subject to one legible line; full text stays in the detail. */
const SUBJECT_CAP = 56;

/**
 * Guards a label against serialized payloads. Tool `detail` often holds the
 * tool's OUTPUT, so a careless extraction can splice a JSON blob into the
 * timeline. A real subject is one short line of prose - no structure, no
 * newlines, and not the logger's own "[... N similar lines]" collapse marker.
 */
const isQueryLike = (text: string): boolean =>
  text.length > 0 && text.length <= 60 && !/[\n\r{}[\]]/.test(text) && !/similar lines/i.test(text);

/**
 * True when the subject only restates the tool name, so appending it would give
 * "ToolSearch: ToolSearch". Compares on letters alone, since the two sides
 * differ in case, spacing and separators ("web_search" vs "Web search").
 */
const isEchoOfName = (subject: string, cleanName: string): boolean => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const a = norm(subject);
  const b = norm(cleanName);
  return a === b || (a.length > 0 && b.length > 0 && (a.startsWith(b) || b.startsWith(a)));
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
    // ToolSearch looks up a DEFERRED tool by keyword. It ran 23 times in one
    // observed turn and every row read only "ToolSearch", so the timeline said
    // nothing about what the agent was actually hunting for. Name the subject:
    // that is the same principle as #520's raw-command labels.
    // Must precede the web-search rule, whose `search[_-]?web` alternative does
    // not match but whose intent overlaps.
    test: /^tool[_-]?search\b|\btoolsearch\b/,
    glyph: 'search',
    build: (h) => {
      // The node's detail carries the tool-search RESULT, not the query the
      // model typed - the query never reaches the renderer. Measured live, a
      // naive extraction produced `Looking for a "[ { [... 197 similar lines`,
      // which is worse than no subject at all. So only two things count as a
      // query: an explicit `query` argument if one is ever plumbed through, and
      // the term Core echoes back in its own no-match message.
      const explicit = /"?query"?\s*[:=]\s*"([^"\n]{1,60})"/i.exec(h)?.[1];
      const echoed = /no deferred tools matching\s+"?([^"\n]{1,60})"?/i.exec(h)?.[1];
      const q = (explicit ?? echoed ?? '').replace(/\s+/g, ' ').trim();
      return q && isQueryLike(q) ? `Looking for a "${q}" tool` : 'Looking for a tool';
    },
  },
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
  // Rules MATCH on name + detail; they BUILD from a haystack that puts the
  // invocation FIRST, because extraction takes the earliest hit. `detail` is
  // the tool's output, so a ReadFile whose command is "Read config.ts" but
  // whose detail is the file's contents degraded to "Reading a file" - and the
  // same tool then read differently in the chat and in the Progress rail.
  // `command` is the invocation and arrives already secret-masked; `detail`
  // stays as the fallback for nodes that carry no command.
  const buildHay = command ? `${node.name || ''} ${command} ${node.detail || ''}` : hay;
  for (const rule of RULES) {
    if (rule.test.test(lower)) {
      // #520: for a shell/command tool, show the ACTUAL command instead of the
      // generic "Running a command" - that visibility is the whole point of the
      // fix. Non-command glyphs (file/web/search) keep their richer humanized
      // labels, which already name the file/host/query.
      if (rule.glyph === 'command' && command) return { label: formatCommandLabel(command), glyph: 'command' };
      return { label: rule.build(buildHay), glyph: rule.glyph };
    }
  }
  // Fallback. A bare tool name answers "which tool" but never "on what", which
  // is the question someone watching the timeline is actually asking - twenty
  // identical rows tell you nothing. #520 solved this for shell tools only; the
  // same visibility is owed to every other tool, so when the node carries a
  // subject (the wcore mapper puts the tool's description in `command`) and it
  // adds information beyond the name, show it.
  const clean = (node.name || 'tool').replace(/[_-]+/g, ' ').trim();
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1);
  const subject = command?.replace(/\s+/g, ' ').trim();
  if (subject && !isEchoOfName(subject, clean)) {
    const capped = subject.length > SUBJECT_CAP ? `${subject.slice(0, SUBJECT_CAP - 1)}…` : subject;
    return { label: `${titled}: ${capped}`, glyph: 'tool' };
  }
  return { label: titled, glyph: 'tool' };
};
