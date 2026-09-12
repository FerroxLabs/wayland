// src/process/acp/session/MessageTranslator.ts
import type {
  IMessageAcpToolCall,
  IMessageAvailableCommands,
  IMessagePlan,
  IMessageText,
  IMessageThinking,
  TMessage,
} from '@/common/chat/chatLib';
import type { ToolCallContentItem, ToolCallLocationItem } from '@/common/types/acpTypes';
import type {
  AvailableCommandsUpdate,
  ContentChunk,
  Plan,
  SessionNotification,
  SessionUpdate,
  ToolCall,
  ToolCallContent,
  ToolCallLocation,
  ToolCallUpdate,
  ToolKind,
} from '@agentclientprotocol/sdk';

const CONFIG_UPDATES = new Set<SessionUpdate['sessionUpdate']>([
  'current_mode_update',
  'config_option_update',
  'session_info_update',
  'usage_update',
]);

// ─── SDK → Old type mappers ─────────────────────────────────────

const TOOL_KIND_MAP: Record<string, 'read' | 'edit' | 'execute'> = {
  read: 'read',
  search: 'read',
  edit: 'edit',
  delete: 'edit',
  move: 'edit',
  execute: 'execute',
  think: 'execute',
  fetch: 'execute',
  switch_mode: 'execute',
  other: 'execute',
};

export function mapToolKind(kind: ToolKind | null | undefined): 'read' | 'edit' | 'execute' {
  if (!kind) return 'execute';
  return TOOL_KIND_MAP[kind] ?? 'execute';
}

export function mapToolContent(content: ToolCallContent[] | null | undefined): ToolCallContentItem[] | undefined {
  if (!content || content.length === 0) return undefined;
  return content.map((item): ToolCallContentItem => {
    if (item.type === 'diff') {
      const diff = item as { type: 'diff'; path?: string; oldText?: string; newText?: string };
      return { type: 'diff', path: diff.path, oldText: diff.oldText, newText: diff.newText };
    }
    // 'content' and 'terminal' both map to 'content' type
    const contentItem = item as { type: string; content?: { type: string; text?: string } };
    return { type: 'content', content: contentItem.content as { type: 'text'; text: string } | undefined };
  });
}

export function mapToolLocations(locations: ToolCallLocation[] | null | undefined): ToolCallLocationItem[] | undefined {
  if (!locations || locations.length === 0) return undefined;
  return locations.map((loc): ToolCallLocationItem => ({ path: loc.path ?? '' }));
}

// ─── MessageTranslator ─────────────────────────────────────────

/**
 * Stateless translator: SDK SessionNotification → TMessage.
 * Only maintains messageMap to assign stable per-turn msg_ids
 * (so chunks within a turn merge, but different turns don't).
 * No merge logic - compat layer (AcpAgentV2) handles tool call merging.
 */
export class MessageTranslator {
  /** SDK messageId → generated UUID (scoped to current turn, cleared on onTurnEnd) */
  private messageMap = new Map<string, string>();
  /** resolved msg_id → text accumulated so far (to emit only net-new deltas) */
  private accumulated = new Map<string, string>();
  /** last SDK messageId seen this turn, so undefined-id chunks join the right message */
  private lastMessageId: string | null = null;
  /**
   * Full visible agent text emitted so far in the CURRENT logical response.
   * Spans the onTurnEnd wipe and mid-turn tool/plan clears (so a late real-id
   * full-text restate is recognized as a duplicate), but is reset at the START
   * of each new user prompt via onTurnStart() — so two separate identical
   * prompts both emit (#184 doubling).
   */
  private lastEmittedText = '';
  /** Same dedup window, tracked separately for thought chunks. */
  private lastEmittedThought = '';
  /**
   * Stable per-turn msg_id for the plan/todo block, kept OUTSIDE messageMap so
   * the mid-turn `messageMap.clear()` calls (the tool_call handler, and the one
   * in handlePlan that isolates surrounding text) cannot orphan it. Without this
   * every TodoWrite update minted a fresh id via resolveMsgId('plan') and the
   * renderer APPENDED instead of merging, stacking N "To do list" cards. Reset
   * per turn in onTurnEnd()/reset() so each new turn gets its own plan card.
   */
  private planMsgId: string | null = null;

  constructor(private readonly conversationId: string) {}

  get activeEntryCount(): number {
    return this.messageMap.size;
  }

  translate(notification: SessionNotification): TMessage[] {
    const update = notification.update;
    const updateType = update.sessionUpdate;

    if (CONFIG_UPDATES.has(updateType)) return [];

    switch (updateType) {
      case 'agent_message_chunk':
        return this.handleAgentMessageChunk(update);
      case 'agent_thought_chunk':
        return this.handleThoughtChunk(update);
      case 'tool_call':
        return this.handleToolCall(update);
      case 'tool_call_update':
        return this.handleToolCallUpdate(update);
      case 'plan':
        return this.handlePlan(update);
      case 'available_commands_update':
        return []; // Handled by AcpSession.handleMessage → ConfigTracker
      case 'user_message_chunk':
        return [];
      default:
        return [];
    }
  }

  onTurnEnd(): void {
    this.messageMap.clear();
    this.accumulated.clear();
    this.lastMessageId = null;
    this.planMsgId = null;
  }

  /**
   * Called at the START of each new user prompt (PromptExecutor.execute).
   * Opens a fresh dedup window so a genuinely new turn whose text is
   * byte-identical to the previous turn still emits. Does NOT touch
   * messageMap/accumulated — onTurnEnd already cleared those.
   */
  onTurnStart(): void {
    this.lastEmittedText = '';
    this.lastEmittedThought = '';
  }

  reset(): void {
    this.messageMap.clear();
    this.accumulated.clear();
    this.lastMessageId = null;
    this.lastEmittedText = '';
    this.lastEmittedThought = '';
    this.planMsgId = null;
  }

  /** Get or create a stable UUID for a SDK messageId within the current turn. */
  private resolveMsgId(sdkMessageId: string): string {
    let msgId = this.messageMap.get(sdkMessageId);
    if (!msgId) {
      msgId = crypto.randomUUID();
      this.messageMap.set(sdkMessageId, msgId);
    }
    return msgId;
  }

  /**
   * Return only the NET-NEW text for a message, normalizing two streaming
   * shapes into appended deltas:
   * - incremental deltas (each chunk is a new fragment) -> appended as-is
   * - cumulative / repeated full-text chunks (chunk restates everything so far,
   *   e.g. claude-code-acp re-emits the full message under a real messageId
   *   after streaming it under messageId=undefined) -> only the unseen tail is
   *   emitted, so a repeat adds nothing instead of doubling the text.
   */
  private netNewDelta(msgId: string, text: string): string {
    const prev = this.accumulated.get(msgId) ?? '';
    if (text.startsWith(prev)) {
      this.accumulated.set(msgId, text);
      return text.slice(prev.length);
    }
    this.accumulated.set(msgId, prev + text);
    return text;
  }

  /**
   * Safe cross-message dedup for the doubling bug (#184). `fullMsgText` is this
   * message's full accumulated text; `delta` is what the handler would emit.
   * Compares against the running visible text of the whole logical response
   * (`window`) so a late full-text restate under a fresh msg_id (after the
   * onTurnEnd wipe, a Flux non-prefix restate, or a plan/tool clear) emits
   * nothing. Returns the delta to actually emit ('' = suppress) + the new window.
   *
   * It does NOT dedup across user prompts: onTurnStart() resets `window` to ''
   * at the start of every turn, so an identical NEW prompt sees window='',
   * fails the restate check, and emits normally.
   */
  private dedupAgainstWindow(window: string, fullMsgText: string, delta: string): { emit: string; window: string } {
    if (fullMsgText && (window === fullMsgText || window.endsWith(fullMsgText))) {
      return { emit: '', window };
    }
    return { emit: delta, window: window + delta };
  }

  /**
   * Resolve the bucket key for a text/thought chunk, coalescing the two shapes
   * claude-code-acp uses for ONE logical message: streamed deltas under
   * messageId=undefined, then the full text repeated under a real messageId.
   * - undefined id -> the current message (last real id, else a 'default' bucket)
   * - real id whose text continues an in-flight 'default' bucket -> adopt that
   *   bucket so the repeat merges instead of forming a second message.
   */
  private resolveRunKey(rawMessageId: string | undefined, text: string, prefix: string): string {
    if (!rawMessageId) {
      return prefix + (this.lastMessageId ?? 'default');
    }
    const realKey = prefix + rawMessageId;
    const defaultKey = prefix + 'default';
    const pending = this.messageMap.get(defaultKey);
    if (pending && !this.messageMap.has(realKey)) {
      const acc = this.accumulated.get(pending) ?? '';
      if (acc && text.startsWith(acc)) {
        this.messageMap.set(realKey, pending);
        this.messageMap.delete(defaultKey);
      }
    }
    return realKey;
  }

  private handleAgentMessageChunk(update: ContentChunk): IMessageText[] {
    if (update.messageId) this.lastMessageId = update.messageId;
    const text = update.content.type === 'text' ? update.content.text : '';
    if (!text) return [];

    const msgId = this.resolveMsgId(this.resolveRunKey(update.messageId, text, ''));
    const delta = this.netNewDelta(msgId, text);
    if (!delta) return [];

    const fullMsgText = this.accumulated.get(msgId) ?? '';
    const { emit, window } = this.dedupAgainstWindow(this.lastEmittedText, fullMsgText, delta);
    this.lastEmittedText = window;
    if (!emit) return [];

    return [
      {
        id: msgId,
        msg_id: msgId,
        conversation_id: this.conversationId,
        type: 'text',
        content: { content: emit },
        position: 'left',
        status: 'work',
      },
    ];
  }

  private handleThoughtChunk(update: ContentChunk): IMessageThinking[] {
    if (update.messageId) this.lastMessageId = update.messageId;
    const text = update.content.type === 'text' ? update.content.text : '';
    if (!text) return [];

    const msgId = this.resolveMsgId(this.resolveRunKey(update.messageId, text, 'thought-'));
    const delta = this.netNewDelta(msgId, text);
    if (!delta) return [];

    const fullMsgText = this.accumulated.get(msgId) ?? '';
    const { emit, window } = this.dedupAgainstWindow(this.lastEmittedThought, fullMsgText, delta);
    this.lastEmittedThought = window;
    if (!emit) return [];

    return [
      {
        id: msgId,
        msg_id: msgId,
        conversation_id: this.conversationId,
        type: 'thinking',
        content: { content: emit, status: 'thinking' },
        position: 'left',
        status: 'work',
      },
    ];
  }

  private handleToolCall(update: ToolCall): IMessageAcpToolCall[] {
    // Tool call interrupts the current text stream - clear text msg_id mappings
    // so subsequent text chunks start a new message (matching old AcpAdapter behavior).
    this.messageMap.clear();
    this.accumulated.clear();
    this.lastMessageId = null;

    const toolCallId = update.toolCallId ?? crypto.randomUUID();

    return [
      {
        id: toolCallId,
        msg_id: toolCallId,
        conversation_id: this.conversationId,
        type: 'acp_tool_call',
        content: {
          sessionId: '',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId,
            status: update.status ?? 'pending',
            title: update.title ?? 'unknown',
            kind: mapToolKind(update.kind),
            rawInput: update.rawInput as Record<string, unknown> | undefined,
            content: mapToolContent(update.content),
            locations: mapToolLocations(update.locations),
          },
        },
        position: 'left',
        status: 'work',
      },
    ];
  }

  private handleToolCallUpdate(update: ToolCallUpdate): IMessageAcpToolCall[] {
    const toolCallId = update.toolCallId ?? '';

    // NOTE: This outputs the raw translated update WITHOUT merging with the original tool_call.
    // Missing fields (title, kind) get fallback values ("unknown", "execute").
    //
    // Currently AcpAgentV2 (compat layer) merges updates before emitting to the renderer.
    // When AcpAgentV2 is removed, the renderer's composeMessageWithIndex should be updated
    // to do field-level merge for acp_tool_call (deep merge on content.update) instead of
    // the current shallow content spread. See hooks.ts acp_tool_call section.

    return [
      {
        id: toolCallId,
        msg_id: toolCallId,
        conversation_id: this.conversationId,
        type: 'acp_tool_call',
        content: {
          sessionId: '',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId,
            status: update.status ?? 'completed',
            title: update.title ?? 'unknown',
            kind: mapToolKind(update.kind),
            rawInput: update.rawInput as Record<string, unknown> | undefined,
            content: mapToolContent(update.content),
          },
        },
        position: 'left',
        status: update.status === 'completed' || update.status === 'failed' ? 'finish' : 'work',
      },
    ];
  }

  private handlePlan(plan: Plan): IMessagePlan[] {
    // Plan is a standalone UI block - clear text msg_id mappings
    // so surrounding text chunks don't merge across the plan.
    this.messageMap.clear();

    // SDK Plan type has entries at top level: { entries: PlanEntry[] }
    if (!plan.entries || plan.entries.length === 0) return [];

    // Stable per-turn id from a dedicated field — NOT resolveMsgId('plan'), whose
    // entry the clear() above (and the tool_call clear) would wipe, minting a
    // fresh id per update and stacking duplicate "To do list" cards. Reusing one
    // id lets the renderer merge every TodoWrite update into a single card.
    this.planMsgId ??= crypto.randomUUID();
    const planMsgId = this.planMsgId;

    return [
      {
        id: planMsgId,
        msg_id: planMsgId,
        conversation_id: this.conversationId,
        type: 'plan',
        content: {
          sessionId: '',
          entries: plan.entries.map((e) => ({
            content: e.content,
            status: e.status as 'pending' | 'in_progress' | 'completed',
            priority: e.priority as 'low' | 'medium' | 'high' | undefined,
          })),
        },
        position: 'left',
        status: 'finish',
      },
    ];
  }

  private handleAvailableCommands(update: AvailableCommandsUpdate): IMessageAvailableCommands[] {
    // SDK AvailableCommandsUpdate: { availableCommands: Array<{ name, description, input? }> }
    const data = update as unknown as {
      availableCommands?: Array<{ name: string; description: string; input?: { hint?: string } | null }>;
    };
    const commands = (data.availableCommands ?? []).map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      hint: cmd.input?.hint,
    }));

    return [
      {
        id: crypto.randomUUID(),
        msg_id: crypto.randomUUID(),
        conversation_id: this.conversationId,
        type: 'available_commands',
        content: { commands },
        position: 'left',
        status: 'finish',
      },
    ];
  }
}
