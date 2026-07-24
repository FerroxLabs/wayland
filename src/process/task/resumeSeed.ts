/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #457 True Continue - resume-seed transcript builder.
 *
 * When the engine process is rebuilt (`--resume`), its own history restore is
 * unreliable, so we replay recent persisted history over the `init_history`
 * channel. The previous implementation replayed ONLY the last 20 text messages
 * (4000-char cap), silently dropping every tool call and file edit - so a
 * resumed session lost the in-progress work and the model restarted from
 * scratch. This builder includes `tool_call`, `tool_group` (file-edit), and
 * `codex_tool_call` (patch) entries so the rebuilt session retains what was
 * already done - including which files were touched.
 *
 * Trajectory-preservation extras (codex file-patch paths + the per-entry
 * snippet budget) are adapted from @vibe-cy's resume-replay work in #467; they
 * live INSIDE `formatSeedLine`, which is wrapped in a per-message try/catch, so
 * a pathological row is skipped rather than aborting the whole seed.
 */

import type { IMessageToolGroup, TMessage } from '@/common/chat/chatLib';

const DEFAULT_MAX_CHARS = 8000;
const DEFAULT_MAX_MESSAGES = 60;
/** Per-entry cap so one giant message can't eat the whole char budget tail. */
const DEFAULT_PER_ENTRY_CHARS = 1000;
/** Bound the recursion + fan-out when harvesting file paths from tool args. */
const FILE_REF_MAX_DEPTH = 8;
const FILE_REF_MAX_COUNT = 20;

const FILE_REF_KEYS = new Set(['file', 'fileName', 'filename', 'filePath', 'path', 'relative_path']);

type ToolGroupItem = IMessageToolGroup['content'][number];

/** Clip a formatted entry to the per-entry budget with an ellipsis marker. */
function clip(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

/** Pull an edited file path off a tool-group item (result diff or edit confirmation). */
function extractEditedFile(item: ToolGroupItem): string | undefined {
  const rd = item.resultDisplay;
  if (rd && typeof rd === 'object' && 'fileName' in rd) return rd.fileName;
  const cd = item.confirmationDetails;
  if (cd && cd.type === 'edit') return cd.fileName;
  return undefined;
}

/**
 * Recursively harvest file paths from an arbitrary tool payload (args, codex
 * patch content, ...). Depth- and count-bounded so a pathologically deep or
 * wide blob can't blow the stack or the output budget. JSON from the DB has no
 * cycles, so no visited-set is needed - the depth cap is the safety net.
 */
function collectFileRefsInto(value: unknown, refs: Set<string>, depth: number): void {
  if (depth > FILE_REF_MAX_DEPTH || refs.size >= FILE_REF_MAX_COUNT) return;
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (refs.size >= FILE_REF_MAX_COUNT) return;
      collectFileRefsInto(item, refs, depth + 1);
    }
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if (refs.size >= FILE_REF_MAX_COUNT) return;
    if (typeof item === 'string' && item && FILE_REF_KEYS.has(key)) {
      refs.add(item);
      continue;
    }
    collectFileRefsInto(item, refs, depth + 1);
  }
}

function collectFileRefs(value: unknown): string[] {
  const refs = new Set<string>();
  collectFileRefsInto(value, refs, 0);
  return [...refs];
}

/** Format one persisted message as a compact transcript line, or null to skip. */
function formatSeedLine(message: TMessage, perEntryChars: number): string | null {
  switch (message.type) {
    case 'text': {
      const content = typeof message.content?.content === 'string' ? message.content.content.trim() : '';
      if (!content) return null;
      return clip(`${message.position === 'right' ? 'User' : 'Assistant'}: ${content}`, perEntryChars);
    }
    case 'tool_call': {
      const name = message.content?.name ?? 'tool';
      const status = message.content?.status ? ` (${message.content.status})` : '';
      const files = collectFileRefs(message.content?.args);
      const filePart = files.length ? ` -> ${files.join(', ')}` : '';
      return clip(`[tool ${name}${status}${filePart}]`, perEntryChars);
    }
    case 'tool_group': {
      const items = Array.isArray(message.content) ? message.content : [];
      const parts = items
        // A null/undefined element must not throw (that would drop the whole
        // group - i.e. every file edit in it - via the outer per-message catch).
        .filter((item): item is ToolGroupItem => item != null)
        .map((item) => {
          const file = extractEditedFile(item);
          return `${item.name}${file ? ` -> ${file}` : ''} (${item.status})`;
        });
      return parts.length ? clip(`[tools ${parts.join('; ')}]`, perEntryChars) : null;
    }
    case 'codex_tool_call': {
      const c = message.content;
      const title = (typeof c?.title === 'string' && c.title) || c?.kind || 'tool';
      const status = c?.status ? ` (${c.status})` : '';
      // #467: preserve codex file-patch paths (they live in content[].filePath /
      // data), so a resumed session knows which files were already touched.
      const files = collectFileRefs(c);
      const filePart = files.length ? ` -> ${files.join(', ')}` : '';
      return clip(`[codex ${title}${status}${filePart}]`, perEntryChars);
    }
    default:
      return null;
  }
}

export interface ResumeSeedOptions {
  maxChars?: number;
  maxMessages?: number;
  perEntryChars?: number;
  /**
   * #723 in-place per-step context reset: when true, seed ONLY the
   * immediately-prior assistant TURN - every row (assistant text AND its tool
   * calls / tool results) from the tail back to, but not crossing, the previous
   * `right` boundary (the user/hidden-directive that started this step). This is
   * the minimal carry-forward a dependent step needs ("review the file you just
   * wrote", "refine the draft you just wrote") done correctly: it keeps the
   * whole prior turn's tool context (not just the last text row), never crosses
   * into an older step, and handles a tool-only prior step (carries that turn's
   * tool/file summary) and a trailing-status/split deliverable (carries the
   * whole turn). NOT the 1..N-1 history and NOT a rolling summary. When the
   * prior turn is empty (the tail IS a `right` row), falls through to the
   * default bounded tail so a resume is never seeded blank.
   */
  priorTurnOnly?: boolean;
  /**
   * #723 char budget for the prior-turn head-clip. Isolated from `maxChars` so
   * the no-prior-turn FALLBACK path uses the standard default budget, not this
   * (larger) per-step value. A deliverable longer than this loses its TAIL
   * (head-clip preserves the opening title/thesis a dependent step anchors on);
   * for a deliverable ending in a structurally-required closer (e.g. a closing
   * code fence) widen this bound. Tunable in the live sweep.
   */
  priorTurnMaxChars?: number;
}

/**
 * Seed the immediately-prior assistant TURN: walk from the newest row back to
 * (but not across) the previous `right` boundary, formatting every row in that
 * turn - assistant text AND tool calls / tool results (mirrors #457's
 * retain-tool-history philosophy, bounded to this ONE turn). Returns the rows
 * in chronological order, head-clipped to `maxChars` (preserving the opening).
 * Returns null when the turn is empty (tail is a `right` row) or has no
 * replayable rows, so the caller can fall back to the default tail. Never
 * reaches into an older step.
 */
function buildPriorTurnSeed(messages: TMessage[], maxChars: number): string | null {
  // The boundary is the most recent `right` row (the user / hidden advance
  // directive that started this turn). Everything AFTER it is the prior turn.
  let boundary = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.position === 'right') {
      boundary = i;
      break;
    }
  }
  const turn = messages.slice(boundary + 1);
  if (turn.length === 0) return null;

  const lines: string[] = [];
  for (const message of turn) {
    // Per-entry cap = the turn budget: tool lines are structurally short
    // (name/status/file refs only, results are never inlined), so this only
    // lets the assistant text deliverable use the full budget.
    let line: string | null = null;
    try {
      line = formatSeedLine(message, maxChars);
    } catch {
      line = null;
    }
    if (line) lines.push(line);
  }
  if (lines.length === 0) return null;
  return clip(lines.join('\n'), maxChars);
}

/**
 * Build the transcript text replayed over `init_history` on resume. Includes
 * tool/file-edit history so a rebuilt engine session retains in-progress work.
 * Each entry is capped (per-entry budget) and the most recent tail is kept
 * within the total char budget.
 */
export function buildResumeSeedTranscript(messages: TMessage[], opts: ResumeSeedOptions = {}): string {
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;
  const maxMessages = opts.maxMessages ?? DEFAULT_MAX_MESSAGES;
  const perEntryChars = opts.perEntryChars ?? DEFAULT_PER_ENTRY_CHARS;

  // #723 per-step reset: carry only the immediately-prior turn. Falls through to
  // the default bounded tail (standard `maxChars` budget) when the turn is empty.
  if (opts.priorTurnOnly) {
    const turnSeed = buildPriorTurnSeed(messages, opts.priorTurnMaxChars ?? DEFAULT_MAX_CHARS);
    if (turnSeed) return turnSeed;
  }

  const recent = messages.slice(-maxMessages);
  const lines: string[] = [];
  for (const message of recent) {
    // Per-message guard: the DB stores types beyond text/tool_call/tool_group
    // (thinking, sub_agent_event, cron, ...). A single unknown/malformed row
    // must be skipped, never throw - otherwise WCoreManager.start()'s try/catch
    // would swallow it and resume with ZERO history (worse than the old seed).
    let line: string | null = null;
    try {
      line = formatSeedLine(message, perEntryChars);
    } catch {
      line = null;
    }
    if (line) lines.push(line);
  }
  return lines.join('\n').slice(-maxChars);
}

/**
 * #723 wiring seam: select the resume seed for a (re)spawn. When a per-step
 * reset bound is threaded (`workflowResetSeed`), seed only the immediately-prior
 * turn; otherwise the default #457 seed. Extracted so the selection conditional
 * is unit-tested directly - the field-name plumbing
 * `WCoreManagerData.workflowResetSeed` -> here is a bare object spread, and this
 * function is the one branch a typo would break (closes the W2 wiring gap).
 */
export function composeResetSeed(messages: TMessage[], workflowResetSeed?: ResumeSeedOptions): string {
  return workflowResetSeed
    ? buildResumeSeedTranscript(messages, workflowResetSeed)
    : buildResumeSeedTranscript(messages);
}
