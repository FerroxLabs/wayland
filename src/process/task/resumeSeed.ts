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
/**
 * #723: per-tool-result findings cap for the prior-turn seed. A tool-centric
 * prior step (a Search/Read whose OUTPUT is the deliverable) must carry its
 * findings, but bounded so one large result can't dominate the seed.
 */
const TOOL_RESULT_CHARS = 600;

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
 * #723: a bounded findings summary for a tool-group item - the string
 * `resultDisplay` (e.g. a Search/Read whose output IS the deliverable). File
 * diffs / images are surfaced via `extractEditedFile`, not here. Whitespace is
 * collapsed so the summary stays compact.
 */
function extractToolResultText(item: ToolGroupItem): string | undefined {
  const rd = item.resultDisplay;
  if (typeof rd === 'string') {
    const trimmed = rd.replace(/\s+/g, ' ').trim();
    return trimmed || undefined;
  }
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

/**
 * Format one persisted message as a compact transcript line, or null to skip.
 * `includeToolResults` (#723 prior-turn seed only) additionally carries a
 * bounded tool findings / error summary so a tool-centric prior step is not
 * seeded contentless; it defaults false so the #457 default seed is unchanged.
 */
function formatSeedLine(message: TMessage, perEntryChars: number, includeToolResults = false): string | null {
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
      // #723: carry a bounded error so a failed tool step's cause survives.
      const err =
        includeToolResults && typeof message.content?.error === 'string' && message.content.error.trim()
          ? `: ${clip(message.content.error.replace(/\s+/g, ' ').trim(), TOOL_RESULT_CHARS)}`
          : '';
      return clip(`[tool ${name}${status}${filePart}${err}]`, perEntryChars);
    }
    case 'tool_group': {
      const items = Array.isArray(message.content) ? message.content : [];
      const parts = items
        // A null/undefined element must not throw (that would drop the whole
        // group - i.e. every file edit in it - via the outer per-message catch).
        .filter((item): item is ToolGroupItem => item != null)
        .map((item) => {
          const file = extractEditedFile(item);
          // #723: carry the tool's string findings (a Search/Read output) so a
          // tool-centric prior step's result survives the reset, bounded.
          const result = includeToolResults ? extractToolResultText(item) : undefined;
          const resultPart = result ? `: ${clip(result, TOOL_RESULT_CHARS)}` : '';
          return `${item.name}${file ? ` -> ${file}` : ''} (${item.status})${resultPart}`;
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
   * calls / tool results). The just-sent hidden advance directive (and any
   * trailing `right` rows) are stripped first, then the walk goes from that tail
   * back to, but not crossing, the PRIOR step's `right` boundary. It keeps the
   * whole prior turn's tool context (not just the last text row), never crosses
   * into an older step, and handles a tool-only prior step (carries that turn's
   * tool/file summary + findings) and a trailing-status/split deliverable
   * (carries the whole turn). NOT the 1..N-1 history and NOT a rolling summary.
   * When the prior turn is empty or a trivial fragment, falls through to the
   * default bounded tail so a resume is never seeded blank or starved.
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

/** #723: minimum assistant-text length for a prior turn to count as a real
 * deliverable. Below this, with no tool work, the turn is a trivial fragment
 * (a mid-step "looks good" -> "Thanks!") and we fall back to the default tail. */
const MIN_PRIOR_TURN_TEXT_CHARS = 40;

/**
 * Seed the immediately-prior assistant TURN: walk from the (real) tail back to
 * (but not across) the previous `right` boundary, formatting every row in that
 * turn - assistant text AND tool calls / tool results (mirrors #457's
 * retain-tool-history philosophy, bounded to this ONE turn). Rows are kept in
 * chronological order and head-clipped to `maxChars` (preserving the opening).
 * Returns null so the caller falls back to the default tail when: the turn is
 * empty, has no replayable rows, or is a trivial fragment (no substantive
 * deliverable). Never reaches into an older step.
 */
function buildPriorTurnSeed(messages: TMessage[], maxChars: number): string | null {
  // The live reset path persists the just-sent hidden advance directive
  // (position 'right') to SQLite BEFORE start() reads history, so the tail row
  // is the CURRENT directive, not the prior deliverable. Strip trailing `right`
  // rows so the boundary lands on the PRIOR step's directive - otherwise the
  // walk finds an empty turn and the deliverable is lost to the default tail.
  let end = messages.length;
  while (end > 0 && messages[end - 1]?.position === 'right') end--;
  // The boundary is the most recent `right` row before `end` (the directive /
  // user turn that started this deliverable). Everything after it is the turn.
  let boundary = -1;
  for (let i = end - 1; i >= 0; i--) {
    if (messages[i]?.position === 'right') {
      boundary = i;
      break;
    }
  }
  const turn = messages.slice(boundary + 1, end);
  if (turn.length === 0) return null;

  // Reserve a slice of the budget for the turn's tool rows so a large text
  // deliverable does not evict the turn's trailing tool context via the final
  // head-clip. The reserve guarantees ~`toolReserve` chars of tool context
  // survive (typically the last few tool rows), not necessarily every tool row.
  const toolReserve = Math.min(2000, Math.floor(maxChars / 4));
  const textBudget = Math.max(1, maxChars - toolReserve);
  const perToolChars = Math.max(1, Math.min(1000, toolReserve));

  let assistantTextChars = 0;
  let hasToolWork = false;
  const lines: string[] = [];
  for (const message of turn) {
    const isAssistantText = message.type === 'text' && message.position !== 'right';
    let line: string | null = null;
    try {
      line = formatSeedLine(message, isAssistantText ? textBudget : perToolChars, true);
    } catch {
      line = null;
    }
    if (!line) continue;
    lines.push(line);
    if (message.type === 'text' && message.position !== 'right') {
      const content = typeof message.content?.content === 'string' ? message.content.content.trim() : '';
      assistantTextChars += content.length;
    } else {
      hasToolWork = true;
    }
  }
  if (lines.length === 0) return null;
  // A trivial fragment is not a deliverable - fall back to the broader default
  // tail (which still holds the real prior output) rather than seed the fragment.
  if (assistantTextChars < MIN_PRIOR_TURN_TEXT_CHARS && !hasToolWork) return null;

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
