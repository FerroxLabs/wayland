/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSkillsDir, getBuiltinSkillsCopyDir, loadSkillsContent } from '@process/utils/initStorage';
import { AcpSkillManager, buildSkillsIndexText, type SkillIndex } from './AcpSkillManager';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillRetriever } from '@process/services/skills/SkillRetriever';
import { getDatabase } from '@process/services/database';
import { mainWarn } from '@process/utils/mainLogger';
import { getTeamGuidePrompt } from '@process/team/prompts/teamGuidePrompt.ts';
import { resolveLeaderAssistantLabel } from '@process/team/prompts/teamGuideAssistant.ts';
import { composePrompt } from '@process/services/constitution/composePrompt';
import { composeWorkflowSystemPrompt } from '@process/services/workflow/composeWorkflowSystemPrompt';
import { getWorkflowSessionService } from '@process/services/workflow/workflowSessionServiceSingleton';

/**
 * One-line advertisement for the wayland_search_skills MCP tool.
 * Injected into every backend's system prompt when the skill library is non-empty.
 * Single source of truth - do not copy-paste into individual managers.
 */
export function searchSkillsAdvertText(): string {
  return 'Use the `wayland_search_skills` tool to discover skills from the full library on demand.';
}

/**
 * Returns true when the SkillLibrary singleton has at least one entry loaded.
 * Checks the in-memory state only (no I/O) - safe to call on every message.
 */
async function libraryIsNonEmpty(): Promise<boolean> {
  try {
    const lib = SkillLibrary.getInstance();
    const entries = await lib.list();
    return entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * Per-turn skill auto-load context.
 *
 * `advert` - a compact ranked list (top-5) of skills relevant to THIS turn,
 * prepended to the outgoing user message so the model knows what's available
 * even when the relevant skill is not in the always-on set.
 * `autoLoaded` - the single high-confidence skill whose full body was injected
 * inline (a clear BM25 winner); surfaced to the renderer via the loaded-skills chip.
 */
export type TurnSkillContext = {
  advert: string;
  autoLoaded: SkillIndex[];
};

const TURN_ADVERT_LIMIT = 5;
/** Absolute BM25 floor a top hit must clear before we auto-load its body. */
const AUTOLOAD_MIN_SCORE = 4.0;
/** Top-1 must beat top-2 by this factor to count as a clear winner (no blind auto-load on ties). */
const AUTOLOAD_MARGIN = 1.4;
/** Body char cap for an auto-loaded skill - honors the ~3k-token/turn budget. */
const AUTOLOAD_BODY_CHAR_CAP = 3000;

// Module-level BM25 index cache, rebuilt only when the library size changes.
let turnRetriever: SkillRetriever | null = null;
let turnRetrieverEntryCount = -1;

/**
 * Build the per-turn skill context for a user message.
 *
 * Proactive retrieval over the FULL skill library (BM25) - surfaces the most
 * relevant skills every turn (not just at session start) and auto-loads the
 * single clear winner's body inline. Unified across all backends.
 *
 * Cheap: the library index is an in-memory JSON; the retriever is cached and
 * only rebuilt when the library size changes; auto-load reads one file.
 *
 * @param userText - the raw user message for this turn
 * @param opts.alwaysOnNames - skills already injected at session start (excluded from the advert)
 */
export async function buildTurnSkillContext(
  userText: string,
  opts?: { alwaysOnNames?: string[] }
): Promise<TurnSkillContext> {
  const empty: TurnSkillContext = { advert: '', autoLoaded: [] };
  const query = (userText ?? '').trim();
  if (query.length < 3) return empty;

  let entries;
  try {
    entries = await SkillLibrary.getInstance().list();
  } catch {
    return empty;
  }
  if (!entries || entries.length === 0) return empty;

  // (Re)build the BM25 index when the library size changes.
  if (!turnRetriever || turnRetrieverEntryCount !== entries.length) {
    turnRetriever = new SkillRetriever({ entries });
    turnRetriever.buildIndex(entries);
    turnRetrieverEntryCount = entries.length;
  }

  const hits = turnRetriever.retrieve(query, TURN_ADVERT_LIMIT + 3);
  if (hits.length === 0) return empty;

  const alwaysOn = new Set(opts?.alwaysOnNames ?? []);

  // High-confidence top-1 auto-load: a clear winner not already in context.
  const top = hits[0];
  const second = hits[1];
  const isClearWinner = top.score >= AUTOLOAD_MIN_SCORE && (!second || top.score >= AUTOLOAD_MARGIN * second.score);

  let autoLoaded: SkillIndex[] = [];
  let autoBody = '';
  if (isClearWinner && !alwaysOn.has(top.name)) {
    try {
      const body = await SkillLibrary.getInstance().loadBody(top.name);
      if (body) {
        const capped =
          body.length > AUTOLOAD_BODY_CHAR_CAP ? `${body.slice(0, AUTOLOAD_BODY_CHAR_CAP)}\n…[truncated]` : body;
        autoBody = `[Auto-loaded skill: ${top.name}]\n${capped}`;
        autoLoaded = [{ name: top.name, description: top.description }];
      }
    } catch {
      // Best-effort - a failed body load just skips the inline injection.
    }
  }

  // Advert excludes always-on skills and the just-auto-loaded one (no redundancy).
  const advertHits = hits
    .filter((h) => !alwaysOn.has(h.name) && !autoLoaded.some((a) => a.name === h.name))
    .slice(0, TURN_ADVERT_LIMIT);

  if (advertHits.length === 0 && !autoBody) return empty;

  const advertBlock =
    advertHits.length > 0
      ? `[Relevant skills for this request]\nThese skills may help. Load full instructions with the wayland_search_skills tool (or read the skill's SKILL.md) when useful:\n${advertHits
          .map((h) => `- ${h.name}: ${h.description}`)
          .join('\n')}`
      : '';

  return { advert: [advertBlock, autoBody].filter(Boolean).join('\n\n'), autoLoaded };
}

/**
 * Inject the bodies of any skills the user added to this conversation from the
 * chat composer (conversation.extra.sessionSkills) that haven't been injected
 * yet. One-time per skill (tracked via extra.injectedSessionSkills), persisted
 * across restart, backend-agnostic. Returns the injection text ('' when none).
 */
export async function consumePendingSessionSkills(conversationId: string): Promise<string> {
  try {
    const db = await getDatabase();
    const res = db.getConversation(conversationId);
    if (!res.success || !res.data) return '';
    const conversation = res.data;
    const extra = (conversation.extra ?? {}) as { sessionSkills?: string[]; injectedSessionSkills?: string[] };
    const wanted = extra.sessionSkills ?? [];
    if (wanted.length === 0) return '';
    const injected = new Set(extra.injectedSessionSkills ?? []);
    const pending = wanted.filter((n) => !injected.has(n));
    if (pending.length === 0) return '';

    const lib = SkillLibrary.getInstance();
    const blocks: string[] = [];
    const nowInjected = [...injected];
    for (const name of pending) {
      nowInjected.push(name); // mark attempted regardless, so we never re-try a bad name
      const entry = await lib.get(name);
      if (!entry || entry.security?.verdict === 'blocked') continue;
      const body = await lib.loadBody(name);
      if (!body) continue;
      const capped =
        body.length > AUTOLOAD_BODY_CHAR_CAP ? `${body.slice(0, AUTOLOAD_BODY_CHAR_CAP)}\n…[truncated]` : body;
      blocks.push(`[Skill added to this chat: ${name}]\n${capped}`);
    }

    const updatedExtra = { ...conversation.extra, injectedSessionSkills: nowInjected };
    db.updateConversation(conversationId, { extra: updatedExtra } as Partial<typeof conversation>);
    return blocks.join('\n\n');
  } catch (error) {
    mainWarn('[agentUtils]', 'consumePendingSessionSkills failed', error);
    return '';
  }
}

/**
 * Merge skills into conversation.extra.loadedSkills so the loaded-skills chip
 * surfaces them. Backend-agnostic; deduped by name; a no-op when nothing new.
 */
export async function mergeLoadedSkillsExtra(conversationId: string, skills: SkillIndex[]): Promise<void> {
  if (skills.length === 0) return;
  try {
    const db = await getDatabase();
    const result = db.getConversation(conversationId);
    if (!result.success || !result.data) return;
    const conversation = result.data;
    const existing = (conversation.extra as { loadedSkills?: SkillIndex[] })?.loadedSkills ?? [];
    const byName = new Map(existing.map((s) => [s.name, s]));
    const before = byName.size;
    for (const s of skills) {
      if (!byName.has(s.name)) byName.set(s.name, s);
    }
    if (byName.size === before) return; // nothing new
    const updatedExtra = { ...conversation.extra, loadedSkills: Array.from(byName.values()) };
    db.updateConversation(conversationId, { extra: updatedExtra } as Partial<typeof conversation>);
  } catch (error) {
    mainWarn('[agentUtils]', 'Failed to merge loaded skills', error);
  }
}

/**
 * First message processing configuration
 */
export interface FirstMessageConfig {
  /** Preset context/rules */
  presetContext?: string;
  /** Enabled skills list */
  enabledSkills?: string[];
  /** Builtin auto-injected skills to exclude */
  excludeBuiltinSkills?: string[];
  /** Inject Team mode guidance prompt when agent has aion_create_team capability */
  enableTeamGuide?: boolean;
  /** Agent backend type (e.g. 'claude', 'codex') - used to populate team guide prompt */
  backend?: string;
  /**
   * Preset assistant id backing this conversation (e.g. 'builtin-word-creator').
   * When set, the team guide prompt shows the assistant's display name on the
   * Leader row instead of the raw backend key.
   */
  presetAssistantId?: string;
  /**
   * Workflow Launch Surface (v0.6.0) - id of the live `WorkflowSession` this
   * conversation is bound to. When set, the static `WORKFLOW_PROTOCOL` block
   * (SPEC §7.1) is appended to the END of system instructions per the
   * "primacy at the end" rule (SPEC §7.3). Soft-fails if the live service is
   * unavailable or the session id no longer resolves.
   */
  workflowSessionId?: string;
}

/**
 * Resolves the workflow session for `workflowSessionId` and returns the static
 * `WORKFLOW_PROTOCOL` system block (SPEC §7.1). Returns `null` when:
 *   - no id was provided,
 *   - the singleton service is not yet wired (cold start race),
 *   - no session exists for the id,
 *   - any error is thrown during lookup (soft-fail - the first-message build
 *     must never break because of workflow plumbing).
 *
 * Callers append the returned string to the END of the assembled instructions
 * so it cannot be diluted by earlier preset/skill content.
 */
async function tryComposeWorkflowProtocol(workflowSessionId: string | undefined): Promise<string | null> {
  if (!workflowSessionId) return null;
  try {
    const service = getWorkflowSessionService();
    if (service === null) return null;
    const session = await service.findById(workflowSessionId);
    if (session === null) return null;
    return composeWorkflowSystemPrompt(session);
  } catch (err) {
    console.warn('[agentUtils] failed to inject WORKFLOW_PROTOCOL:', err);
    return null;
  }
}

/**
 * Build system instructions content (full skills content injection - for Gemini)
 *
 * @param config - First message configuration
 * @returns System instructions string or undefined
 */
export async function buildSystemInstructions(config: FirstMessageConfig): Promise<string | undefined> {
  const instructions: string[] = [];

  // Add preset context
  if (config.presetContext) {
    instructions.push(config.presetContext);
  }

  // Load and add skills content
  if (config.enabledSkills && config.enabledSkills.length > 0) {
    const skillsContent = await loadSkillsContent(config.enabledSkills);
    if (skillsContent) {
      instructions.push(skillsContent);
    }
  }

  // Inject Team Guide prompt when agent has team guide capability
  if (config.enableTeamGuide) {
    const leaderLabel = await resolveLeaderAssistantLabel(config.presetAssistantId);
    instructions.push(getTeamGuidePrompt({ backend: config.backend, leaderLabel }));
  }

  // Workflow Launch Surface - append WORKFLOW_PROTOCOL LAST so it sits at the
  // end of the assembled system content (SPEC §7.3 "primacy at the end").
  const workflowProtocol = await tryComposeWorkflowProtocol(config.workflowSessionId);
  if (workflowProtocol !== null) {
    instructions.push(workflowProtocol);
  }

  const basePrompt = instructions.length === 0 ? '' : instructions.join('\n\n');
  // Prepend Wayland Constitution + optional specialist overlay (stable across
  // turns so Anthropic/OpenAI prompt caches hit). composePrompt returns ''
  // when no Constitution file exists, so this is a no-op for fresh installs
  // and we preserve the previous "return undefined" behaviour.
  const composed = composePrompt({ assistantId: config.presetAssistantId, basePrompt }).text;
  return composed.length === 0 ? undefined : composed;
}

/**
 * Inject system instructions for first message (full skills content - for Gemini)
 *
 * Note: Use direct prefix instead of XML tags to ensure external agents like Claude Code CLI can recognize it
 *
 * @param content - Original message content
 * @param config - First message configuration
 * @returns Message content with system instructions injected
 */
export async function prepareFirstMessage(content: string, config: FirstMessageConfig): Promise<string> {
  const systemInstructions = await buildSystemInstructions(config);

  if (!systemInstructions) {
    return content;
  }

  // Use direct prefix format similar to Gemini Agent to ensure Claude/Codex can recognize it
  return `[Assistant Rules - You MUST follow these instructions]\n${systemInstructions}\n\n[User Request]\n${content}`;
}

/**
 * Prepare first message: inject rules + skills INDEX (not full content)
 *
 * Used for ACP agents (Claude/OpenCode) and Codex; Agent reads skill files on-demand using Read tool.
 *
 * Note: Builtin skills (in _builtin/ directory) are auto-injected, no need to specify in enabledSkills
 *
 * @param content - Original message content
 * @param config - First message configuration
 * @returns Message content with injected instructions and loaded skills list
 */
export async function prepareFirstMessageWithSkillsIndex(
  content: string,
  config: FirstMessageConfig
): Promise<{ content: string; loadedSkills: SkillIndex[] }> {
  const instructions: string[] = [];
  let loadedSkills: SkillIndex[] = [];

  // 1. Add preset rules
  if (config.presetContext) {
    instructions.push(config.presetContext);
  }

  // 2. Load skills INDEX (always-on set only: builtin + pinned + assistant enabledSkills)
  // Use singleton to avoid repeated filesystem scans
  const skillManager = AcpSkillManager.getInstance(config.enabledSkills);
  // discoverSkills auto-loads builtin skills first
  await skillManager.discoverSkills(config.enabledSkills, config.excludeBuiltinSkills);

  const hasLib = await libraryIsNonEmpty();

  // Only inject if there are any skills or a library advert is needed
  if (skillManager.hasAnySkills() || hasLib) {
    const excludeSet = new Set(config.excludeBuiltinSkills ?? []);
    // Filter out excluded builtin skills - the singleton cache may not reflect excludeBuiltinSkills
    const skillsIndex = skillManager.getSkillsIndex().filter((s) => !excludeSet.has(s.name));
    loadedSkills = skillsIndex;
    // getSkillsDir() already returns CLI-safe path (symlink on macOS)
    const skillsDir = getSkillsDir();
    const builtinSkillsCopyDir = getBuiltinSkillsCopyDir();
    const builtinSkillsDir = builtinSkillsCopyDir + '/_builtin';
    // Pass hasLib so the index text includes the wayland_search_skills discovery note
    const indexText = buildSkillsIndexText(skillsIndex, hasLib);

    // Tell Agent where skills files are located for on-demand reading
    const skillsInstruction = `${indexText}

[Skills Location]
Skills are stored in three locations:
- Builtin skills (auto-enabled): ${builtinSkillsDir}/{skill-name}/SKILL.md
- Bundled skills: ${builtinSkillsCopyDir}/{skill-name}/SKILL.md
- User custom skills: ${skillsDir}/{skill-name}/SKILL.md

Each skill has a SKILL.md file containing detailed instructions.
To use a skill, read its SKILL.md file when needed.

For example:
- Builtin "cron" skill: ${builtinSkillsDir}/cron/SKILL.md
- Bundled "pptx" skill: ${builtinSkillsCopyDir}/pptx/SKILL.md

[Scheduling (CRITICAL - v0.6.2.6.1)]
When the user asks to schedule any recurring or one-time task ("schedule this every day at 9am", "run this Monday at 5pm", "remind me daily", etc.), you MUST:

1. Read the Wayland builtin "cron" skill at ${builtinSkillsDir}/cron/SKILL.md
2. Emit a [CRON_PROPOSE] block per that skill's format. The user will see an inline confirmation card with Yes / Edit / Cancel buttons.

Do NOT use any built-in or external "schedule" capability, cloud routine, or scheduling tool. The Wayland cron skill is the ONLY scheduling path that integrates with this app's task list, runtime, and conversation context. Other scheduling mechanisms (e.g., Anthropic Cloud Routines, cron daemons, external schedulers) will create disconnected schedules the user can't see or manage from the Wayland UI.

If you find yourself about to escalate scheduling outside of Wayland or use a non-Wayland schedule skill, STOP and read ${builtinSkillsDir}/cron/SKILL.md first.`;

    instructions.push(skillsInstruction);
  }

  // 3. Inject Team Guide prompt when agent has team guide capability
  if (config.enableTeamGuide) {
    const leaderLabel = await resolveLeaderAssistantLabel(config.presetAssistantId);
    instructions.push(getTeamGuidePrompt({ backend: config.backend, leaderLabel }));
  }

  // 4. Workflow Launch Surface - append WORKFLOW_PROTOCOL LAST so it sits at
  // the end of the rules content (SPEC §7.3 "primacy at the end").
  const workflowProtocol = await tryComposeWorkflowProtocol(config.workflowSessionId);
  if (workflowProtocol !== null) {
    instructions.push(workflowProtocol);
  }

  const basePrompt = instructions.length === 0 ? '' : instructions.join('\n\n');
  // Prepend Wayland Constitution + optional specialist overlay above the
  // existing rules content. Composer returns '' when no Constitution exists,
  // preserving the previous "skip rules block entirely" behaviour.
  const systemInstructions = composePrompt({ assistantId: config.presetAssistantId, basePrompt }).text;
  if (systemInstructions.length === 0) {
    return { content, loadedSkills };
  }
  return {
    content: `[Assistant Rules - You MUST follow these instructions]\n${systemInstructions}\n\n[User Request]\n${content}`,
    loadedSkills,
  };
}

/**
 * Build system instructions with skills INDEX only (no full content - for Gemini)
 *
 * Gemini has no file read tool and cannot read SKILL.md files on its own.
 * When Gemini needs detailed instructions for a skill, it outputs [LOAD_SKILL: skill-name],
 * and the system intercepts it and sends back the full skill content as [System Response].
 *
 * @param config - First message configuration
 * @returns System instructions string or undefined
 */
export async function buildSystemInstructionsWithSkillsIndex(config: FirstMessageConfig): Promise<string | undefined> {
  const instructions: string[] = [];

  // Add preset context
  if (config.presetContext) {
    instructions.push(config.presetContext);
  }

  // Load skills INDEX (always-on set only: builtin + pinned + assistant enabledSkills)
  const skillManager = AcpSkillManager.getInstance(config.enabledSkills);
  await skillManager.discoverSkills(config.enabledSkills, config.excludeBuiltinSkills);

  const hasLib = await libraryIsNonEmpty();

  if (skillManager.hasAnySkills() || hasLib) {
    const excludeSet = new Set(config.excludeBuiltinSkills ?? []);
    const skillsIndex = skillManager.getSkillsIndex().filter((s) => !excludeSet.has(s.name));
    // Pass hasLib so the index text includes the wayland_search_skills discovery note
    const indexText = buildSkillsIndexText(skillsIndex, hasLib);
    if (indexText.length > 0) {
      instructions.push(indexText);
    }
  }

  // Inject Team Guide prompt when agent has team guide capability
  if (config.enableTeamGuide) {
    const leaderLabel = await resolveLeaderAssistantLabel(config.presetAssistantId);
    instructions.push(getTeamGuidePrompt({ backend: config.backend, leaderLabel }));
  }

  // Workflow Launch Surface - append WORKFLOW_PROTOCOL LAST so it sits at the
  // end of the assembled system content (SPEC §7.3 "primacy at the end").
  const workflowProtocol = await tryComposeWorkflowProtocol(config.workflowSessionId);
  if (workflowProtocol !== null) {
    instructions.push(workflowProtocol);
  }

  const basePrompt = instructions.length === 0 ? '' : instructions.join('\n\n');
  // Prepend Wayland Constitution + optional specialist overlay (stable
  // turn-to-turn for prompt-cache reuse). Returns '' when no Constitution
  // is configured, preserving the previous "return undefined" behaviour.
  const composed = composePrompt({ assistantId: config.presetAssistantId, basePrompt }).text;
  return composed.length === 0 ? undefined : composed;
}
