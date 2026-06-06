/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Three-phase workflow marker stream parser.
 *
 * Strips <step> and <ask> control markers from streaming agent output,
 * preserves them inside code fences / inline code, validates them per SPEC §7.4,
 * and reconciles a final markdown-AST pass per SPEC §8.
 *
 * Phases:
 *   - Phase 1 (Streaming):    character walk with fence-state scanner; complete
 *                             + validated markers are stripped.
 *   - Phase 2 (Validation):   validateMarker - shape + range checks.
 *   - Phase 3 (AST Authority): once the message finishes, parse the FULL text
 *                             via unified + remark-parse + remark-gfm, walk the
 *                             AST, ignore markers under code / inlineCode,
 *                             decode HTML-escaped markers, and reconcile against
 *                             Phase 1 emittedMarkers (restore false strips,
 *                             catch missed markers).
 *
 * Spec: .planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md §7-§8
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, Node, Parent } from 'mdast';
import type {
  AskRecord,
  StepStatus,
  WorkflowMarker,
} from '@/common/types/workflowTypes';

// Public types

export type InvalidMarker = { raw: string; reason: string };

export type StreamParseState = {
  buffer: string;
  output: string;
  inFence: boolean;
  inInlineCode: boolean;
  pendingTagFragment: string;
  emittedMarkers: WorkflowMarker[];
  invalidMarkers: InvalidMarker[];
};

export type ProcessChunkResult = {
  state: StreamParseState;
  emittedMarkers: WorkflowMarker[];
  renderedDelta: string;
};

export type FinalizeResult = {
  state: StreamParseState;
  finalMarkers: WorkflowMarker[];
  finalOutput: string;
};

export type ValidateMarkerResult =
  | WorkflowMarker
  | { invalid: true; reason: string };

export type ComplianceResult = { ratio: number; mode: 'auto' | 'manual' };

// Regexes (SPEC §7.5)

const STEP_MARKER_RE =
  /^<step\s+n="?(\d+)"?\s+status="?(now|done|skipped|errored)"?\s*\/?>$/;
const ASK_MARKER_RE = /^<ask\s+([^>]*?)>([\s\S]+?)<\/ask>$/;
const ASK_ATTR_RE = /(\w+)\s*=\s*"([^"]*)"/g;
const VALID_ASK_TYPES = new Set(['text', 'number', 'choice', 'boolean', 'rating']);

// State factory

export function createParserState(): StreamParseState {
  return {
    buffer: '',
    output: '',
    inFence: false,
    inInlineCode: false,
    pendingTagFragment: '',
    emittedMarkers: [],
    invalidMarkers: [],
  };
}

// Phase 2: validate a candidate marker string

export function validateMarker(
  raw: string,
  totalSteps: number,
): ValidateMarkerResult {
  const trimmed = raw.trim();

  const stepMatch = trimmed.match(STEP_MARKER_RE);
  if (stepMatch) {
    const n = parseInt(stepMatch[1], 10);
    if (Number.isNaN(n) || n < 1 || n > totalSteps) {
      return { invalid: true, reason: `n=${n} out of range [1,${totalSteps}]` };
    }
    return { kind: 'step', n, status: stepMatch[2] as StepStatus };
  }

  const askMatch = trimmed.match(ASK_MARKER_RE);
  if (askMatch) {
    return parseAskMarker(askMatch[1], askMatch[2]);
  }

  return { invalid: true, reason: 'unrecognized marker shape' };
}

function parseAskMarker(attrs: string, question: string): ValidateMarkerResult {
  const attrMap: Record<string, string> = {};
  ASK_ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ASK_ATTR_RE.exec(attrs)) !== null) {
    attrMap[m[1]] = m[2];
  }
  const type = attrMap.type;
  if (!type || !VALID_ASK_TYPES.has(type)) {
    return { invalid: true, reason: `ask type "${type ?? ''}" not recognized` };
  }
  const ask: Omit<
    AskRecord,
    'id' | 'step_n' | 'asked_at' | 'answer' | 'answered_at'
  > = {
    question: question.trim(),
    type: type as AskRecord['type'],
    options: attrMap.options ? attrMap.options.split(',').map((s) => s.trim()) : null,
    max: attrMap.max ? parseInt(attrMap.max, 10) : null,
    placeholder: attrMap.placeholder ?? null,
  };
  return { kind: 'ask', ask };
}

// Phase 1: streaming chunk processor

export function processChunk(
  state: StreamParseState,
  chunk: string,
  totalSteps: number,
): ProcessChunkResult {
  const source = state.pendingTagFragment + chunk;
  state.pendingTagFragment = '';
  state.buffer += chunk;

  let delta = '';
  const newlyEmitted: WorkflowMarker[] = [];

  let i = 0;
  let inFence = state.inFence;
  let inInlineCode = state.inInlineCode;

  while (i < source.length) {
    if (!inInlineCode && source.startsWith('```', i)) {
      delta += '```';
      inFence = !inFence;
      i += 3;
      continue;
    }

    if (!inFence && source[i] === '`') {
      delta += '`';
      inInlineCode = !inInlineCode;
      i += 1;
      continue;
    }

    if (
      source[i] === '<' &&
      (source.startsWith('<step', i) || source.startsWith('<ask', i))
    ) {
      const isAsk = source.startsWith('<ask', i);
      const closer = isAsk ? '</ask>' : '>';
      const closeIdx = source.indexOf(closer, i + (isAsk ? 4 : 5));

      if (closeIdx === -1) {
        // Unterminated - hold for next chunk.
        state.pendingTagFragment = source.slice(i);
        i = source.length;
        continue;
      }

      const endIdx = closeIdx + closer.length;
      const raw = source.slice(i, endIdx);

      if (inFence || inInlineCode) {
        delta += raw;
        i = endIdx;
        continue;
      }

      const result = validateMarker(raw, totalSteps);
      if ('invalid' in result) {
        state.invalidMarkers.push({ raw, reason: result.reason });
        delta += raw;
      } else {
        state.emittedMarkers.push(result);
        newlyEmitted.push(result);
      }
      i = endIdx;
      continue;
    }

    delta += source[i];
    i += 1;
  }

  state.inFence = inFence;
  state.inInlineCode = inInlineCode;
  state.output += delta;

  return { state, emittedMarkers: newlyEmitted, renderedDelta: delta };
}

// Phase 3: AST authoritative pass

const PROCESSOR = unified().use(remarkParse).use(remarkGfm);

type AstMarkerHit = {
  raw: string; // decoded form (if originally escaped)
  rawSource: string; // exact substring as it appears in the source text
  inCode: boolean;
  htmlEscaped: boolean;
};

const MARKER_SCAN_RE =
  /<step\s+[^>]*?\/?>|<ask\s+[^>]*?>[\s\S]*?<\/ask>|&lt;step\s+[^&]*?\/?&gt;|&lt;ask\s+[^&]*?&gt;[\s\S]*?&lt;\/ask&gt;/g;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Collect [start, end] byte offsets of every code / inlineCode span in the AST. */
function collectCodeRanges(node: Node, ranges: Array<[number, number]>): void {
  const type = node.type;
  if (type === 'code' || type === 'inlineCode') {
    const pos = node.position;
    if (pos) ranges.push([pos.start.offset ?? 0, pos.end.offset ?? 0]);
    return;
  }
  const parent = node as Parent;
  if (parent.children) {
    for (const child of parent.children) {
      collectCodeRanges(child, ranges);
    }
  }
}

function offsetInCodeRange(offset: number, ranges: Array<[number, number]>): boolean {
  for (const [s, e] of ranges) {
    if (offset >= s && offset < e) return true;
  }
  return false;
}

/**
 * Scan the full source text for marker occurrences and tag each by whether the
 * AST classified its offset as inside a code / inlineCode region. This handles
 * markers that the markdown parser splits across multiple AST nodes
 * (e.g. an `<ask>` becomes html-text-html siblings).
 */
function scanFullSource(
  source: string,
  codeRanges: Array<[number, number]>,
  hits: AstMarkerHit[],
): void {
  MARKER_SCAN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MARKER_SCAN_RE.exec(source)) !== null) {
    const raw = m[0];
    const isEscaped = raw.includes('&lt;');
    const inCode = offsetInCodeRange(m.index, codeRanges);
    hits.push({
      raw: isEscaped ? decodeHtmlEntities(raw) : raw,
      rawSource: raw,
      inCode,
      htmlEscaped: isEscaped,
    });
  }
}


function markersEqual(a: WorkflowMarker, b: WorkflowMarker): boolean {
  if (a.kind === 'step' && b.kind === 'step') {
    return a.n === b.n && a.status === b.status;
  }
  if (a.kind === 'ask' && b.kind === 'ask') {
    return a.ask.question === b.ask.question && a.ask.type === b.ask.type;
  }
  return false;
}

function removeFirst(haystack: string, needle: string): string {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return haystack;
  return haystack.slice(0, idx) + haystack.slice(idx + needle.length);
}

export function finalize(
  state: StreamParseState,
  totalSteps: number,
  fullMessageMarkdown: string,
): FinalizeResult {
  if (state.pendingTagFragment) {
    state.output += state.pendingTagFragment;
    state.buffer += state.pendingTagFragment;
    state.pendingTagFragment = '';
  }

  const fullText = fullMessageMarkdown || state.buffer;
  let tree: Root;
  try {
    tree = PROCESSOR.parse(fullText) as Root;
  } catch {
    return {
      state,
      finalMarkers: [...state.emittedMarkers],
      finalOutput: state.output,
    };
  }

  const codeRanges: Array<[number, number]> = [];
  collectCodeRanges(tree, codeRanges);
  const hits: AstMarkerHit[] = [];
  scanFullSource(fullText, codeRanges, hits);

  const finalMarkers: WorkflowMarker[] = [...state.emittedMarkers];
  let finalOutput = fullText;

  // Phase 3 walks the AST and reconciles. For each hit:
  //   - if hit.inCode → marker should stay visible; if Phase 1 stripped it, undo
  //   - else if invalid → marker stays visible + recorded
  //   - else valid → strip exact source substring from finalOutput, record marker
  for (const hit of hits) {
    if (hit.inCode) {
      const validated = validateMarker(hit.raw, totalSteps);
      if (!('invalid' in validated)) {
        const idx = finalMarkers.findIndex((mm) => markersEqual(mm, validated));
        if (idx !== -1) {
          finalMarkers.splice(idx, 1);
          state.invalidMarkers.push({ raw: hit.raw, reason: 'false-strip recovered' });
        }
      }
      continue;
    }

    const validated = validateMarker(hit.raw, totalSteps);
    if ('invalid' in validated) {
      if (
        !state.invalidMarkers.some(
          (im) => im.raw === hit.raw || im.raw === hit.rawSource,
        )
      ) {
        state.invalidMarkers.push({ raw: hit.raw, reason: validated.reason });
      }
      continue;
    }

    if (!finalMarkers.some((mm) => markersEqual(mm, validated))) {
      finalMarkers.push(validated);
    }
    if (hit.htmlEscaped) {
      state.invalidMarkers.push({ raw: hit.raw, reason: 'html-escaped (Phase 3 recovered)' });
    }
    // Strip the exact source form from finalOutput.
    if (finalOutput.includes(hit.rawSource)) {
      finalOutput = removeFirst(finalOutput, hit.rawSource);
    }
  }

  state.emittedMarkers = finalMarkers;
  state.output = finalOutput;

  return { state, finalMarkers, finalOutput };
}

// Compliance counter (SPEC §8.3)

export function computeCompliance(
  state: StreamParseState,
  totalMessages: number,
): ComplianceResult {
  if (totalMessages <= 0) return { ratio: 0, mode: 'auto' };
  const valid = state.emittedMarkers.length;
  const ratio = valid / totalMessages;
  if (totalMessages >= 3 && ratio < 0.3) {
    return { ratio, mode: 'manual' };
  }
  return { ratio, mode: 'auto' };
}
