/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CodexPermissionRequest } from '@/common/types/codex/types';
import type { IConciergeConfigContent } from '@/common/chat/conciergeConfig';
import type {
  ExecCommandBeginData,
  ExecCommandEndData,
  ExecCommandOutputDeltaData,
  McpToolCallBeginData,
  McpToolCallEndData,
  PatchApplyBeginData,
  PatchApplyEndData,
  TurnDiffData,
  WebSearchBeginData,
  WebSearchEndData,
} from '@/common/types/codex/types/eventData';
import type {
  AcpBackend,
  AgentBackend,
  AcpPermissionRequest,
  PlanUpdate,
  ToolCallUpdate,
} from '@/common/types/acpTypes';
import type { IResponseMessage } from '../adapter/ipcBridge';
import { uuid } from '../utils';
import { addOrUpdateNode, emptyActivityContent, mergeActivityContent, mergeNodeList } from './activityTree';
import { parseInnerEvent } from './innerEvent';
import type { TurnCost } from '@/process/agent/wcore/protocol';

/**
 * Safe path join function, compatible with Windows and Mac.
 * @param basePath Base path
 * @param relativePath Relative path
 * @returns Joined absolute path
 */
export const joinPath = (basePath: string, relativePath: string): string => {
  // Normalize path separators to /
  const normalizePath = (path: string) => path.replace(/\\/g, '/');

  const base = normalizePath(basePath);
  const relative = normalizePath(relativePath);

  // Strip trailing slashes from base path
  const cleanBase = base.replace(/\/+$/, '');

  // Handle ./ and ../ in the relative path
  const parts = relative.split('/');
  const resultParts = [];

  for (const part of parts) {
    if (part === '.' || part === '') {
      continue; // Skip . and empty strings
    } else if (part === '..') {
      // Go up one directory level
      if (resultParts.length > 0) {
        resultParts.pop(); // Remove the last segment
      }
    } else {
      resultParts.push(part);
    }
  }

  // Join the path segments
  const result = cleanBase + '/' + resultParts.join('/');

  // Ensure the path is well-formed
  return result.replace(/\/+/g, '/'); // Collapse multiple consecutive slashes into one
};

/**
 * @description Message type declarations related to conversations, and associated helpers.
 */

type TMessageType =
  | 'text'
  | 'tips'
  | 'tool_call'
  | 'tool_group'
  | 'agent_status'
  | 'acp_permission'
  | 'acp_tool_call'
  | 'codex_permission'
  | 'codex_tool_call'
  | 'plan'
  | 'thinking'
  | 'available_commands'
  | 'skill_suggest'
  | 'cron_trigger'
  | 'cron_propose'
  | 'concierge_propose'
  | 'sub_agent'
  | 'activity';

interface IMessage<T extends TMessageType, Content extends Record<string, any>> {
  /**
   * Unique ID
   */
  id: string;
  /**
   * Source message ID
   */
  msg_id?: string;

  // Conversation session ID
  conversation_id: string;
  /**
   * Message type
   */
  type: T;
  /**
   * Message content
   */
  content: Content;
  /**
   * Message creation timestamp
   */
  createdAt?: number;
  /**
   * Message position
   */
  position?: 'left' | 'right' | 'center' | 'pop';
  /**
   * Message status
   */
  status?: 'finish' | 'pending' | 'error' | 'work';
  /**
   * Hidden from UI display but persisted to DB and sent to agent.
   */
  hidden?: boolean;
}

export type CronMessageMeta = {
  source: 'cron';
  cronJobId: string;
  cronJobName: string;
  triggeredAt: number;
};

export type IMessageText = IMessage<
  'text',
  {
    content: string;
    cronMeta?: CronMessageMeta;
    teammateMessage?: boolean;
    senderName?: string;
    senderAgentType?: string;
    /** Sender teammate's conversation id - lets the renderer resolve preset avatars via their conversation extras. */
    senderConversationId?: string;
    /**
     * Set by WCoreManager when the response stopped with `finish_reason: 'length'`
     * (or matched the equivalent heuristic). Surfaces a "response truncated"
     * warning in the renderer; primarily fixes the Gemini Pro thinking-token
     * bug where reasoning models would return an empty bubble.
     */
    truncatedDueToBudget?: boolean;
  }
>;

export type IMessageTips = IMessage<'tips', { content: string; type: 'error' | 'success' | 'warning' }>;

export type IMessageToolCall = IMessage<
  'tool_call',
  {
    callId: string;
    name: string;
    args: Record<string, any>;
    error?: string;
    status?: 'success' | 'error';
  }
>;

type IMessageToolGroupConfirmationDetailsBase<Type, Extra extends Record<string, any>> = {
  type: Type;
  title: string;
} & Extra;

export type IMessageToolGroup = IMessage<
  'tool_group',
  Array<{
    callId: string;
    description: string;
    name: string;
    renderOutputAsMarkdown: boolean;
    resultDisplay?:
      | string
      | {
          fileDiff: string;
          fileName: string;
        }
      | {
          img_url: string;
          relative_path: string;
        };
    status: 'Executing' | 'Success' | 'Error' | 'Canceled' | 'Pending' | 'Confirming';
    confirmationDetails?:
      | IMessageToolGroupConfirmationDetailsBase<
          'edit',
          {
            fileName: string;
            fileDiff: string;
            isModifying?: boolean;
          }
        >
      | IMessageToolGroupConfirmationDetailsBase<
          'exec',
          {
            rootCommand: string;
            command: string;
          }
        >
      | IMessageToolGroupConfirmationDetailsBase<
          'info',
          {
            urls?: string[];
            prompt: string;
          }
        >
      | IMessageToolGroupConfirmationDetailsBase<
          'mcp',
          {
            toolName: string;
            toolDisplayName: string;
            serverName: string;
          }
        >
      // #504: AskUserQuestion-class prompt. The engine sends these as an `info`
      // category tool named `AskUserQuestion` (there is no `question` engine
      // ToolCategory), with the prompt buried in args - so wcore/index.ts
      // detects them by name and lifts `question`/`header`/`choices` out of the
      // args here, and the renderer shows the choices as selectable answers.
      | IMessageToolGroupConfirmationDetailsBase<
          'question',
          {
            question: string;
            header?: string;
            choices: Array<{ label: string; description?: string }>;
          }
        >;
  }>
>;

// Unified agent status message type for all ACP-based agents (Claude, Qwen, Codex, etc.)
export type IMessageAgentStatus = IMessage<
  'agent_status',
  {
    backend: AgentBackend; // Agent identifier: 'claude', 'qwen', 'codex', 'remote', etc.
    status: 'connecting' | 'connected' | 'authenticated' | 'session_active' | 'error';
    /** Display name for the agent (e.g. extension-contributed adapter name) */
    agentName?: string;
    // Optional legacy fields for backward compatibility
    sessionId?: string;
    isConnected?: boolean;
    hasActiveSession?: boolean;
  }
>;

export type IMessageAcpPermission = IMessage<'acp_permission', AcpPermissionRequest>;

export type IMessageAcpToolCall = IMessage<'acp_tool_call', ToolCallUpdate>;

export type IMessageCodexPermission = IMessage<'codex_permission', CodexPermissionRequest>;

// Base interface for all tool call updates
interface BaseCodexToolCallUpdate {
  toolCallId: string;
  status: 'pending' | 'executing' | 'success' | 'error' | 'canceled';
  title?: string; // Optional - can be derived from data or kind
  kind: 'execute' | 'patch' | 'mcp' | 'web_search';

  // UI display data
  description?: string;
  content?: Array<{
    type: 'text' | 'diff' | 'output';
    text?: string;
    output?: string;
    filePath?: string;
    oldText?: string;
    newText?: string;
  }>;

  // Timing
  startTime?: number;
  endTime?: number;
}

// Specific subtypes using the original event data structures
export type CodexToolCallUpdate =
  | (BaseCodexToolCallUpdate & {
      subtype: 'exec_command_begin';
      data: ExecCommandBeginData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'exec_command_output_delta';
      data: ExecCommandOutputDeltaData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'exec_command_end';
      data: ExecCommandEndData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'patch_apply_begin';
      data: PatchApplyBeginData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'patch_apply_end';
      data: PatchApplyEndData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'mcp_tool_call_begin';
      data: McpToolCallBeginData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'mcp_tool_call_end';
      data: McpToolCallEndData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'web_search_begin';
      data: WebSearchBeginData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'web_search_end';
      data: WebSearchEndData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'turn_diff';
      data: TurnDiffData;
    })
  | (BaseCodexToolCallUpdate & {
      subtype: 'generic';
      data?: any; // For generic updates that don't map to specific events
    });

export type IMessageCodexToolCall = IMessage<'codex_tool_call', CodexToolCallUpdate>;

export type IMessagePlan = IMessage<
  'plan',
  {
    sessionId: string;
    entries: PlanUpdate['update']['entries'];
  }
>;

export type IMessageThinking = IMessage<
  'thinking',
  {
    content: string;
    subject?: string;
    duration?: number;
    status: 'thinking' | 'done';
  }
>;

// Available commands from ACP agents (Claude, etc.)
export type AvailableCommand = {
  name: string;
  description: string;
  hint?: string;
};

export type IMessageAvailableCommands = IMessage<
  'available_commands',
  {
    commands: AvailableCommand[];
  }
>;

export type IMessageSkillSuggest = IMessage<
  'skill_suggest',
  {
    cronJobId: string;
    name: string;
    description: string;
    /** Full SKILL.md content (including frontmatter) */
    skillContent: string;
  }
>;

export type IMessageCronTrigger = IMessage<
  'cron_trigger',
  {
    cronJobId: string;
    cronJobName: string;
    triggeredAt: number;
  }
>;

/**
 * v0.6.2.6 - inline confirmation card rendered when the agent emits a
 * [CRON_PROPOSE] block in chat. User picks Yes/Edit/Cancel; the action
 * routes through ipcBridge.cron.confirmProposal which either creates the
 * job (Yes), opens CreateTaskDialog pre-filled (Edit), or marks the
 * proposal dismissed (Cancel). Status transitions are guarded
 * server-side to prevent double-fire from rapid clicks.
 */
export type IMessageCronPropose = IMessage<
  'cron_propose',
  {
    name: string;
    schedule: string;
    scheduleDescription: string;
    prompt: string;
    /** True if the cron expression failed croner validation; Yes button disabled in this state. */
    parseError: boolean;
    /**
     * Lifecycle of the proposal - drives which card variant renders.
     * v0.6.2.6.1 (race fix per Gemini G-R-01): `processing` is a transient
     * status the bridge sets BEFORE calling cronService.addJob, so a parallel
     * accept call sees non-pending and short-circuits. Reverted to `pending`
     * if addJob throws; transitions to `accepted` on success.
     */
    status: 'pending' | 'processing' | 'accepted' | 'cancelled';
    /** Set after accept - created cron job id so the card can link to its detail page. */
    cronJobId?: string;
    /** Conversation type as known when the proposal was created (for the post-accept addJob payload). */
    agentType?: string;
  }
>;

/**
 * Concierge Phase 2b - inline confirmation card for a conversational config
 * change (connect a provider, set a default model, add an MCP server, edit an
 * assistant's rules). The agent emits a [CONCIERGE_PROPOSE] block; the user
 * picks Accept/Edit/Cancel; the action routes through
 * ipcBridge.conciergeConfig.confirmProposal which applies the change in MAIN
 * (where secrets live) only on Accept. Content carries NO secret - the API key
 * for provider_connect is entered in the card and sent over the confirm IPC.
 */
export type IMessageConciergeConfig = IMessage<'concierge_propose', IConciergeConfigContent>;

/**
 * v0.9.4 - inline activity card for a spawned sub-agent.
 * Keyed by parentCallId (e.g. "spawn:{idx}:{name}"). Multiple sub-agents
 * produce distinct cards, one per unique parentCallId. Status tracks the
 * lifecycle: running → done | failed. The body accumulates streamed text_delta
 * output from the inner WCoreEvent stream.
 */
export type IMessageSubAgent = IMessage<
  'sub_agent',
  {
    /** Opaque call-id used as the stable key to merge streaming updates. */
    parentCallId: string;
    /** Display name for the sub-agent (e.g. "compute-2plus2"). */
    agentName: string;
    /** Lifecycle status. */
    status: 'running' | 'done' | 'failed';
    /** Accumulated streamed output text from the sub-agent (legacy flat body / fallback). */
    body: string;
    /**
     * #252 Phase 2 - the sub-agent's real activity subtree, parsed from the
     * inner serialized WCoreEvent stream (its own tool calls, thinking spans and
     * nested sub-agents). Optional + additive: when absent (malformed/opaque
     * inner) the card falls back to the flat `body`. Child nodes merge by their
     * own callId; nested sub-agents recurse via `ActivityNode.children`.
     */
    nodes?: ActivityNode[];
  }
>;

/**
 * #252 - one per-turn cost row, mirrors `TurnCost` in
 * src/process/agent/wcore/protocol.ts. Duplicated here (rather than imported)
 * because chatLib.ts is common-layer and must not pull in process-only
 * protocol modules; the shape is small and engine-stable.
 */
export type ActivityTurnCost = {
  turn: number;
  model: string;
  provider: string;
  costUsd: number;
};

/**
 * #252 - one node in the live activity tree. Tools, thinking spans and
 * sub-agents are all nodes; `children` lets a sub-agent carry its own nested
 * tools/thinking (Phase 2). `detail` accumulates streamed tool stdout
 * (tool_chunk) or thinking text so a node can be drilled into.
 */
export type ActivityNode = {
  /** Stable merge key. For tools this is the callId; otherwise a synthetic id. */
  id: string;
  kind: 'tool' | 'thinking' | 'sub_agent' | 'cost' | 'circuit' | 'browser' | 'cua';
  /** Tool/sub-agent call id when applicable (same as `id` for tools). */
  callId?: string;
  /** Display name (tool name, agent name, etc.). */
  name: string;
  status: 'running' | 'done' | 'failed';
  startTime?: number;
  endTime?: number;
  /** Accumulated streamed detail (tool_chunk stdout / thinking text / op trail). */
  detail?: string;
  /**
   * #520 - the raw tool invocation (a shell command's text, e.g.
   * `echo hello`). Carried so the timeline can show WHAT ran, not just a
   * humanized "Running a command". Populated for exec-style tools; the label
   * layer falls back to the humanized verb when absent.
   */
  command?: string;
  children?: ActivityNode[];
  /** Parsed search result sources (web_search tool only). */
  sources?: import('./activity/sources').Source[];
};

/**
 * #252 - composite "activity tree" card for one turn. Streaming node updates
 * merge into one card by msg_id, exactly like the sub_agent card merges by
 * parentCallId. The merge key is `activity:${turnId}` (NOT the bare turnId):
 * the activity events are stamped by wcore with the turn's stream msg_id, the
 * SAME id the assistant text message carries. Sharing it would make the
 * activity card collide with the text bubble in the shared msgIdIndex and
 * fragment the streamed prose into duplicate bubbles. The real turnId lives in
 * `content.turnId`. Additive: never replaces the existing tool_group /
 * thinking / plan rendering, it surfaces the currently-dropped observability
 * stream (tool_chunk, session_cost, etc.).
 */
export type IMessageActivity = IMessage<
  'activity',
  {
    /** Turn id - the real wcore stream id this card belongs to. */
    turnId: string;
    nodes: ActivityNode[];
    perTurnCost?: ActivityTurnCost[];
    status: 'running' | 'done' | 'failed';
  }
>;

/**
 * #252 - the activity card's merge key. Namespaced off the turn's stream
 * msg_id so it never collides with the assistant text message that shares that
 * same id (which would fragment streamed text into duplicate bubbles).
 */
export const activityMsgId = (turnId: string): string => `activity:${turnId}`;

// eslint-disable-next-line max-len
export type TMessage =
  | IMessageText
  | IMessageTips
  | IMessageToolCall
  | IMessageToolGroup
  | IMessageAgentStatus
  | IMessageAcpPermission
  | IMessageAcpToolCall
  | IMessageCodexPermission
  | IMessageCodexToolCall
  | IMessagePlan
  | IMessageThinking
  | IMessageAvailableCommands
  | IMessageSkillSuggest
  | IMessageCronTrigger
  | IMessageCronPropose
  | IMessageConciergeConfig
  | IMessageSubAgent
  | IMessageActivity;

// Unified type for all user-interaction confirmation prompts
export interface IConfirmation<Option extends any = any> {
  title?: string;
  id: string;
  action?: string;
  description: string;
  callId: string;
  options: Array<{
    label: string;
    value: Option;
    params?: Record<string, string>; // Translation interpolation parameters
    /**
     * #504: for an AskUserQuestion prompt, the chosen option's answer text sent
     * back to the engine via the approval channel (tool_approve.answer). Absent
     * for ordinary approve/deny options.
     */
    answer?: string;
    /** #504: optional secondary line shown under a choice (its description). */
    description?: string;
  }>;
  /**
   * Command type for exec confirmations (e.g., 'curl', 'npm', 'git')
   * Used for "always allow" permission memory
   */
  commandType?: string;
}

/**
 * @description Transform a backend response message into a frontend TMessage.
 */
export const transformMessage = (message: IResponseMessage): TMessage => {
  switch (message.type) {
    case 'error': {
      return {
        id: uuid(),
        type: 'tips',
        msg_id: message.msg_id,
        position: 'center',
        conversation_id: message.conversation_id,
        content: {
          content: message.data as string,
          type: 'error',
        },
      };
    }
    case 'content':
    case 'user_content': {
      const data = message.data;
      const isRichData = typeof data === 'object' && data !== null && 'content' in data;
      return {
        id: uuid(),
        type: 'text',
        msg_id: message.msg_id,
        position: message.type === 'content' ? 'left' : 'right',
        conversation_id: message.conversation_id,
        content: isRichData
          ? {
              content: (data as { content: string; cronMeta?: CronMessageMeta }).content,
              cronMeta: (data as { cronMeta?: CronMessageMeta }).cronMeta,
              ...((data as { truncatedDueToBudget?: boolean }).truncatedDueToBudget && {
                truncatedDueToBudget: true,
              }),
            }
          : { content: data as string },
        ...(message.hidden && { hidden: true }),
      };
    }
    case 'tool_call': {
      return {
        id: uuid(),
        type: 'tool_call',
        msg_id: message.msg_id,
        conversation_id: message.conversation_id,
        position: 'left',
        content: message.data as any,
      };
    }
    case 'tool_group': {
      return {
        type: 'tool_group',
        id: uuid(),
        msg_id: message.msg_id,
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'agent_status': {
      return {
        id: uuid(),
        type: 'agent_status',
        msg_id: message.msg_id,
        position: 'center',
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'acp_permission': {
      return {
        id: uuid(),
        type: 'acp_permission',
        msg_id: message.msg_id,
        position: 'left',
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'acp_tool_call': {
      return {
        id: uuid(),
        type: 'acp_tool_call',
        msg_id: message.msg_id,
        position: 'left',
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'codex_permission': {
      return {
        id: uuid(),
        type: 'codex_permission',
        msg_id: message.msg_id,
        position: 'left',
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'codex_tool_call': {
      return {
        id: uuid(),
        type: 'codex_tool_call',
        msg_id: message.msg_id,
        position: 'left',
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'plan': {
      return {
        id: uuid(),
        type: 'plan',
        msg_id: message.msg_id,
        position: 'left',
        conversation_id: message.conversation_id,
        content: message.data as any,
      };
    }
    case 'thinking': {
      const data = message.data as {
        content: string;
        subject?: string;
        duration?: number;
        status: 'thinking' | 'done';
      };
      return {
        id: uuid(),
        type: 'thinking',
        msg_id: message.msg_id,
        position: 'left',
        conversation_id: message.conversation_id,
        content: {
          content: data.content,
          subject: data.subject,
          duration: data.duration,
          status: data.status,
        },
      };
    }
    // Disabled: available_commands messages are too noisy and distracting in the chat UI
    case 'available_commands':
      break;
    case 'skill_suggest': {
      const suggestData = message.data as {
        cronJobId: string;
        name: string;
        description: string;
        skillContent: string;
      };
      return {
        id: uuid(),
        type: 'skill_suggest',
        msg_id: message.msg_id,
        conversation_id: message.conversation_id,
        position: 'center',
        content: suggestData,
      };
    }
    case 'cron_trigger': {
      const triggerData = message.data as {
        cronJobId: string;
        cronJobName: string;
        triggeredAt: number;
      };
      return {
        id: uuid(),
        type: 'cron_trigger',
        msg_id: message.msg_id,
        conversation_id: message.conversation_id,
        position: 'center',
        content: triggerData,
      };
    }
    case 'cron_propose': {
      // v0.6.2.6 - inline confirmation card for natural-language scheduling.
      // Data is broadcast from MessageMiddleware after the agent emits a
      // [CRON_PROPOSE] block; renderer maps to IMessageCronPropose for
      // CronProposeCard to render Yes/Edit/Cancel UI.
      const proposeData = message.data as IMessageCronPropose['content'];
      return {
        id: uuid(),
        type: 'cron_propose',
        msg_id: message.msg_id,
        conversation_id: message.conversation_id,
        position: 'left',
        content: proposeData,
      };
    }
    case 'concierge_propose': {
      // Concierge Phase 2b - inline config-change confirmation card. Data is
      // broadcast from MessageMiddleware after the agent emits a
      // [CONCIERGE_PROPOSE] block (and re-broadcast by conciergeConfigBridge on
      // accept/cancel); renderer maps to IMessageConciergeConfig for
      // ConciergeConfigCard to render Accept/Edit/Cancel UI.
      const configData = message.data as IMessageConciergeConfig['content'];
      return {
        id: uuid(),
        type: 'concierge_propose',
        msg_id: message.msg_id,
        conversation_id: message.conversation_id,
        position: 'left',
        content: configData,
      };
    }
    case 'sub_agent_event': {
      // v0.9.4 sub-agent activity card. The `data` field carries:
      //   { parentCallId: string; agentName: string; inner: unknown }
      // #252 Phase 2: `inner` is a serialized child WCoreEvent. We recursively
      // parse it (parseInnerEvent) to surface the sub-agent's REAL tool calls,
      // thinking spans and nested sub-agents as an activity subtree - instead of
      // the old lossy flatten that read only inner.type + inner.text. The legacy
      // `body` text is still accumulated so a malformed/opaque inner falls back
      // to the flat render with no regression.
      const saData = message.data as {
        parentCallId: string;
        agentName: string;
        inner: unknown;
      };
      const parsed = parseInnerEvent(saData.inner);

      let status: IMessageSubAgent['content']['status'] = 'running';
      if (parsed.lifecycle === 'done') {
        status = 'done';
      } else if (parsed.lifecycle === 'failed') {
        status = 'failed';
      }

      return {
        id: uuid(),
        type: 'sub_agent',
        // Use parentCallId as msg_id so composeMessage can merge streaming
        // updates for the same sub-agent into one card (same key lookup).
        msg_id: saData.parentCallId,
        conversation_id: message.conversation_id,
        position: 'left',
        content: {
          parentCallId: saData.parentCallId,
          agentName: saData.agentName,
          status,
          body: parsed.text,
          ...(parsed.nodes.length ? { nodes: parsed.nodes } : {}),
        },
      };
    }
    // ── #252 observability → live activity tree ──────────────────────
    // These raw events are already forwarded by wcore/index.ts +
    // WCoreManager but previously hit the default warn arm (tool_chunk was
    // silently dropped). Each builds a single-delta activity card keyed by
    // activityMsgId(turnId) (NOT the bare turnId, which the assistant text
    // message also uses); composeMessage merges deltas into one card.
    case 'tool_chunk': {
      const d = message.data as { callId: string; toolName?: string; chunk: string };
      const turnId = message.msg_id ?? '';
      const content = addOrUpdateNode(emptyActivityContent(turnId), {
        kind: 'tool_chunk',
        callId: d.callId,
        name: d.toolName,
        chunk: d.chunk,
        ts: Date.now(),
      });
      return {
        id: uuid(),
        type: 'activity',
        msg_id: activityMsgId(turnId),
        position: 'left',
        conversation_id: message.conversation_id,
        content,
      };
    }
    case 'session_cost': {
      const d = message.data as { perTurn?: TurnCost[] };
      const turnId = message.msg_id ?? '';
      const content = addOrUpdateNode(emptyActivityContent(turnId), {
        kind: 'cost',
        perTurn: (d.perTurn ?? []).map((p) => ({
          turn: p.turn,
          model: p.model,
          provider: p.provider,
          costUsd: p.cost_usd,
        })),
      });
      return {
        id: uuid(),
        type: 'activity',
        msg_id: activityMsgId(turnId),
        position: 'left',
        conversation_id: message.conversation_id,
        content,
      };
    }
    case 'provider_circuit_event': {
      const d = message.data as { primary: string; fallback?: string; state: string; error?: string };
      const turnId = message.msg_id ?? '';
      const detail = `${d.state}${d.fallback ? ` → ${d.fallback}` : ''}${d.error ? `: ${d.error}` : ''}`;
      const content = addOrUpdateNode(emptyActivityContent(turnId), {
        kind: 'circuit',
        id: d.primary,
        name: d.primary,
        detail,
        ts: Date.now(),
      });
      return {
        id: uuid(),
        type: 'activity',
        msg_id: activityMsgId(turnId),
        position: 'left',
        conversation_id: message.conversation_id,
        content,
      };
    }
    case 'browser_event':
    case 'cua_event': {
      const d = message.data as { callId: string; op: string; url?: string; summary: string };
      const turnId = message.msg_id ?? '';
      const content = addOrUpdateNode(emptyActivityContent(turnId), {
        kind: message.type === 'browser_event' ? 'browser' : 'cua',
        callId: d.callId,
        name: d.op,
        detail: d.summary + (d.url ? ` (${d.url})` : ''),
        ts: Date.now(),
      });
      return {
        id: uuid(),
        type: 'activity',
        msg_id: activityMsgId(turnId),
        position: 'left',
        conversation_id: message.conversation_id,
        content,
      };
    }
    case 'start':
    case 'finish':
    case 'thought':
    case 'info': // Stream retry notifications and similar transient agent updates
    case 'system': // Cron system responses, ignored
    case 'acp_model_info': // Model info updates, handled by AcpModelSelector
    case 'codex_model_info': // Codex model info updates, handled by AcpModelSelector
    case 'acp_context_usage': // Context usage updates, handled by AcpSendBox
    case 'request_trace': // Request trace events, logged to F12 console (not persisted)
      break;
    default: {
      console.warn(
        `[transformMessage] Unsupported message type '${message.type}'. All non-standard message types should be pre-processed by respective AgentManagers.`
      );
      break;
    }
  }
};

/**
 * @description Merge a message into the existing message list.
 */
export const composeMessage = (
  message: TMessage | undefined,
  list: TMessage[] | undefined,
  messageHandler: (type: 'update' | 'insert', message: TMessage) => void = () => {}
): TMessage[] => {
  if (!message) return list || [];
  if (!list?.length) {
    messageHandler('insert', message);
    return [message];
  }
  const last = list[list.length - 1];

  const updateMessage = (index: number, message: TMessage, change = true) => {
    message.id = list[index].id;
    list[index] = message;
    if (change) messageHandler('update', message);
    return list.slice();
  };
  const pushMessage = (message: TMessage) => {
    list.push(message);
    messageHandler('insert', message);
    return list.slice();
  };

  if (message.type === 'tool_group') {
    const remainingToolsMap = new Map(message.content.map((t) => [t.callId, t] as const));
    if (remainingToolsMap.size === 0) return list;

    const updatesToReport: TMessage[] = [];

    const updatedList = list.map((existingMessage) => {
      if (existingMessage.type !== 'tool_group') return existingMessage;
      if (!existingMessage.content.length) return existingMessage;

      let didMergeIntoThisMessage = false;
      const newContent = existingMessage.content.map((tool) => {
        const newToolData = remainingToolsMap.get(tool.callId);
        if (!newToolData) return tool;
        didMergeIntoThisMessage = true;
        remainingToolsMap.delete(tool.callId);
        // Create new object instead of mutating original
        return { ...tool, ...newToolData };
      });

      if (!didMergeIntoThisMessage) return existingMessage;
      const updatedMessage = { ...existingMessage, content: newContent } as TMessage;
      updatesToReport.push(updatedMessage);
      return updatedMessage;
    });

    const didUpdateExisting = updatesToReport.length > 0;
    for (const updatedMessage of updatesToReport) {
      messageHandler('update', updatedMessage);
    }

    const baseList = didUpdateExisting ? updatedList : list;

    // If there are new tool calls, append them as a new tool_group message (without mutating inputs)
    if (remainingToolsMap.size > 0) {
      const newTools = Array.from(remainingToolsMap.values());
      const insertMessage = { ...message, content: newTools } as TMessage;
      messageHandler('insert', insertMessage);
      return baseList.concat(insertMessage);
    }
    // No new tools appended; return a new list only if something was updated
    return didUpdateExisting ? baseList : list;
  }

  // Handle Gemini tool_call message merging
  if (message.type === 'tool_call') {
    for (let i = 0, len = list.length; i < len; i++) {
      const msg = list[i];
      if (msg.type === 'tool_call' && msg.content.callId === message.content.callId) {
        // Create new object instead of mutating original
        return updateMessage(i, { ...msg, content: { ...msg.content, ...message.content } });
      }
    }
    // If no existing tool call found, add new one
    return pushMessage(message);
  }

  // Handle codex_tool_call message merging
  if (message.type === 'codex_tool_call') {
    for (let i = 0, len = list.length; i < len; i++) {
      const msg = list[i];
      if (msg.type === 'codex_tool_call' && msg.content.toolCallId === message.content.toolCallId) {
        // Create new object instead of mutating original
        const merged = { ...msg.content, ...message.content };
        return updateMessage(i, { ...msg, content: merged });
      }
    }
    // If no existing tool call found, add new one
    return pushMessage(message);
  }

  // Handle acp_tool_call message merging (same logic as codex_tool_call)
  if (message.type === 'acp_tool_call') {
    for (let i = 0, len = list.length; i < len; i++) {
      const msg = list[i];
      if (msg.type === 'acp_tool_call' && msg.content.update?.toolCallId === message.content.update?.toolCallId) {
        // Create new object instead of mutating original
        const merged = { ...msg.content, ...message.content };
        return updateMessage(i, { ...msg, content: merged });
      }
    }
    // If no existing tool call found, add new one
    return pushMessage(message);
  }

  if (message.type === 'plan') {
    for (let i = 0, len = list.length; i < len; i++) {
      const msg = list[i];
      if (msg.type === 'plan' && msg.content.sessionId === message.content.sessionId) {
        // Create new object instead of mutating original
        const merged = { ...msg.content, ...message.content };
        return updateMessage(i, { ...msg, content: merged });
      }
    }
    return pushMessage(message);
    // If no existing plan found, add new one
  }

  // Handle thinking message merging - append streaming content by msg_id
  if (message.type === 'thinking') {
    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i];
      if (msg.type === 'thinking' && msg.msg_id === message.msg_id) {
        // If incoming is 'done', update status and duration but keep accumulated content
        if (message.content.status === 'done') {
          const merged = {
            ...msg.content,
            status: message.content.status as 'done',
            duration: message.content.duration,
          };
          return updateMessage(i, { ...msg, content: merged });
        }
        // Otherwise append content
        const merged = {
          ...msg.content,
          content: msg.content.content + message.content.content,
          subject: message.content.subject || msg.content.subject,
        };
        return updateMessage(i, { ...msg, content: merged });
      }
    }
    return pushMessage(message);
  }

  // sub_agent message: merge by parentCallId (stored as msg_id).
  // Append body text and advance status toward terminal (done/failed wins over running).
  if (message.type === 'sub_agent' && message.msg_id) {
    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i];
      if (msg.type === 'sub_agent' && msg.msg_id === message.msg_id) {
        const prevContent = msg.content;
        const nextContent = message.content;
        const mergedStatus =
          nextContent.status === 'done' || nextContent.status === 'failed' ? nextContent.status : prevContent.status;
        const mergedBody = prevContent.body + nextContent.body;
        // #252 Phase 2: fold the sub-agent's streamed child subtree (its tools /
        // thinking / nested sub-agents) by node id; recurses for nested agents.
        const mergedNodes = mergeNodeList(prevContent.nodes, nextContent.nodes);
        const merged = {
          ...prevContent,
          status: mergedStatus,
          body: mergedBody,
          ...(mergedNodes.length ? { nodes: mergedNodes } : {}),
        } as typeof prevContent;
        return updateMessage(i, { ...msg, content: merged });
      }
    }
    return pushMessage(message);
  }

  // #252 activity card: merge by msg_id (= activity:${turnId}). Each incoming
  // message is a single-event delta; fold its nodes/cost into the existing
  // card. Mirrors the sub_agent branch above.
  if (message.type === 'activity' && message.msg_id) {
    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i];
      if (msg.type === 'activity' && msg.msg_id === message.msg_id) {
        const merged = mergeActivityContent(msg.content, message.content);
        return updateMessage(i, { ...msg, content: merged });
      }
    }
    return pushMessage(message);
  }

  // text deltas: append to the existing text bubble for this msg_id even when
  // it is not `last` — an activity card / tool_group / sub_agent card emitted
  // mid-turn can sit between two text deltas of the SAME turn (model emits
  // prose, runs a streaming tool, emits more prose). Searching back (instead of
  // only checking `last`) keeps the turn's prose in ONE bubble instead of
  // fragmenting it. Mirrors composeMessageWithIndex's msgIdIndex text lookup.
  if (message.type === 'text' && message.msg_id) {
    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i];
      if (msg.msg_id === message.msg_id && msg.type === 'text') {
        const merged = Object.assign({}, msg, message);
        merged.content = { ...message.content, content: msg.content.content + message.content.content };
        return updateMessage(i, merged);
      }
    }
    return pushMessage(message);
  }

  if (last.msg_id !== message.msg_id || last.type !== message.type) {
    return pushMessage(message);
  }
  return updateMessage(list.length - 1, Object.assign({}, last, message));
};

export const handleImageGenerationWithWorkspace = (message: TMessage, workspace: string): TMessage => {
  // Only process text-type messages
  if (message.type !== 'text') {
    return message;
  }

  // Deep-copy the message to avoid mutating the original object
  const processedMessage = {
    ...message,
    content: {
      ...message.content,
      content: message.content.content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imagePath) => {
        // If the path is absolute, an http link, or a data URL, leave it unchanged
        if (
          imagePath.startsWith('http') ||
          imagePath.startsWith('data:') ||
          imagePath.startsWith('/') ||
          imagePath.startsWith('file:') ||
          imagePath.startsWith('\\') ||
          /^[A-Za-z]:/.test(imagePath)
        ) {
          return match;
        }
        // If the path is relative, join it with the workspace root
        const absolutePath = joinPath(workspace, imagePath);
        return `![${alt}](${encodeURI(absolutePath)})`;
      }),
    },
  };

  return processedMessage;
};
