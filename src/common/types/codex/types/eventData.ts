/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CodexAgentEventType } from './eventTypes';

// Generic structure for JSON-RPC messages - uses CodexEventMsg for automatic type inference
export type CodexJsonRpcEvent<T extends CodexEventMsg['type'] = CodexEventMsg['type']> = {
  jsonrpc: '2.0';
  method: 'codex/event';
  params: {
    _meta: {
      requestId: number;
      timestamp?: number;
      source?: string;
    };
    id: string;
    msg: Extract<CodexEventMsg, { type: T }>; // Extract type directly from CodexEventMsg
  };
};

// Precise event message type, maps directly to params.msg
export type CodexEventMsg =
  | ({ type: 'session_configured' } & SessionConfiguredData) //ignored
  | ({ type: 'task_started' } & TaskStartedData) //handled
  | ({ type: 'task_complete' } & TaskCompleteData) //handled
  | ({ type: 'agent_message_delta' } & MessageDeltaData) //handled
  | ({ type: 'agent_message' } & MessageData) //ignored
  | ({ type: 'user_message' } & UserMessageData)
  | ({ type: 'agent_reasoning_delta' } & AgentReasoningDeltaData) //handled
  | ({ type: 'agent_reasoning' } & AgentReasoningData) //ignored
  | ({ type: 'agent_reasoning_raw_content' } & AgentReasoningRawContentData)
  | ({ type: 'agent_reasoning_raw_content_delta' } & AgentReasoningRawContentDeltaData)
  | ({ type: 'exec_command_begin' } & ExecCommandBeginData) //handled
  | ({ type: 'exec_command_output_delta' } & ExecCommandOutputDeltaData) //handled
  | ({ type: 'exec_command_end' } & ExecCommandEndData) //handled
  | ({ type: 'exec_approval_request' } & ExecApprovalRequestData) //handled
  | ({ type: 'apply_patch_approval_request' } & PatchApprovalData) //handled
  | ({ type: 'patch_apply_begin' } & PatchApplyBeginData) //handled
  | ({ type: 'patch_apply_end' } & PatchApplyEndData) //handled
  | ({ type: 'mcp_tool_call_begin' } & McpToolCallBeginData) //handled
  | ({ type: 'mcp_tool_call_end' } & McpToolCallEndData) //handled
  | ({ type: 'web_search_begin' } & WebSearchBeginData) //handled
  | ({ type: 'web_search_end' } & WebSearchEndData) //handled
  | ({ type: 'token_count' } & TokenCountData) //ignored
  | { type: 'agent_reasoning_section_break' } //handled
  | ({ type: 'turn_diff' } & TurnDiffData) // handled
  | ({ type: 'get_history_entry_response' } & GetHistoryEntryResponseData)
  | ({ type: 'mcp_list_tools_response' } & McpListToolsResponseData)
  | ({ type: 'list_custom_prompts_response' } & ListCustomPromptsResponseData)
  | ({ type: 'conversation_path' } & ConversationPathResponseData)
  | { type: 'background_event'; message: string }
  | ({ type: 'turn_aborted' } & TurnAbortedData);

// Session / lifecycle events
export interface SessionConfiguredData {
  session_id: string;
  model?: string;
  reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high' | null;
  history_log_id?: number;
  history_entry_count?: number;
  initial_messages?: unknown[] | null;
  rollout_path?: string | null;
}

export interface TaskStartedData {
  model_context_window: number;
}

export interface TaskCompleteData {
  last_agent_message: string;
}

// Message event data interfaces
export interface MessageDeltaData {
  delta: string;
}

// JSON-RPC event parameter interfaces
export interface CodexEventParams {
  msg?: {
    type: string;
    [key: string]: unknown;
  };
  _meta?: {
    requestId?: number;
    [key: string]: unknown;
  };
  call_id?: string;
  codex_call_id?: string;
  changes?: Record<string, unknown>;
  codex_changes?: Record<string, unknown>;
}

export interface MessageData {
  message: string;
}

export interface AgentReasoningData {
  text: string;
}

export interface AgentReasoningDeltaData {
  delta: string;
}

export type InputMessageKind = 'plain' | 'user_instructions' | 'environment_context';

export interface UserMessageData {
  message: string;
  kind?: InputMessageKind;
  images?: string[] | null;
}

export interface StreamErrorData {
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
}

// Command execution event data interfaces
export interface ExecCommandBeginData {
  call_id: string;
  command: string[];
  cwd: string;
  parsed_cmd?: ParsedCommand[];
}

export interface ExecCommandOutputDeltaData {
  call_id: string;
  stream: 'stdout' | 'stderr';
  chunk: string;
}

export interface ExecCommandEndData {
  call_id: string;
  stdout: string;
  stderr: string;
  aggregated_output: string;
  exit_code: number;
  duration?: { secs: number; nanos: number };
  formatted_output?: string;
}

// Patch/file modification event data interfaces
export interface PatchApprovalData {
  call_id: string;
  changes: Record<string, FileChange>;
  codex_call_id?: string;
  codex_changes?: Record<string, FileChange>;
  message?: string;
  summary?: string;
  requiresConfirmation?: boolean;
  reason?: string | null;
  grant_root?: string | null;
}

export interface PatchApplyBeginData {
  call_id?: string;
  auto_approved?: boolean;
  changes?: Record<string, FileChange>;
  dryRun?: boolean;
}

export interface PatchApplyEndData {
  call_id?: string;
  success?: boolean;
  error?: string;
  appliedChanges?: string[];
  failedChanges?: string[];
  stdout?: string;
  stderr?: string;
}

// MCP tool event data interfaces
export interface McpToolCallBeginData {
  invocation?: McpInvocation;
  toolName?: string;
  serverName?: string;
}

export interface McpToolCallEndData {
  invocation?: McpInvocation;
  result?: unknown;
  error?: string;
  duration?: string | number;
}

// Web search event data interfaces
export interface WebSearchBeginData {
  call_id?: string;
}

export interface WebSearchEndData {
  call_id?: string;
  query?: string;
  results?: SearchResult[];
}

// Token count event data interface
export interface TokenCountData {
  info?: {
    total_token_usage?: {
      input_tokens?: number;
      cached_input_tokens?: number;
      output_tokens?: number;
      reasoning_output_tokens?: number;
      total_tokens?: number;
    };
    last_token_usage?: {
      input_tokens?: number;
      cached_input_tokens?: number;
      output_tokens?: number;
      reasoning_output_tokens?: number;
      total_tokens?: number;
    };
    model_context_window?: number;
  };
}

// Supporting interfaces
export type FileChange =
  // Current format from actual logs
  | { add: { content: string } }
  | { delete: { content: string } }
  | { update: { unified_diff: string; move_path?: string | null } }
  // Legacy format with explicit type field
  | { type: 'add'; content: string }
  | { type: 'delete'; content: string }
  | { type: 'update'; unified_diff: string; move_path?: string | null }
  | {
      // Legacy/back‑compat
      action?: 'create' | 'modify' | 'delete' | 'rename';
      content?: string;
      oldPath?: string;
      newPath?: string;
      mode?: string;
      size?: number;
      checksum?: string;
    };

export interface McpInvocation {
  server?: string;
  tool?: string;
  arguments?: Record<string, unknown>;
  // compat
  method?: string;
  name?: string;
  toolId?: string;
  serverId?: string;
}

export interface SearchResult {
  title?: string;
  url?: string;
  snippet?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export type ParsedCommand =
  | { type: 'read'; cmd: string; name: string }
  | {
      type: 'list_files';
      cmd: string;
      path?: string | null;
    }
  | { type: 'search'; cmd: string; query?: string | null; path?: string | null }
  | { type: 'unknown'; cmd: string };

export interface AgentReasoningRawContentData {
  text: string;
}

export interface AgentReasoningRawContentDeltaData {
  delta: string;
}

export interface ExecApprovalRequestData {
  call_id: string;
  command: string[];
  cwd: string;
  reason: string | null;
}

export interface TurnDiffData {
  unified_diff: string;
}

export interface ConversationPathResponseData {
  conversation_id: string;
  path: string;
}

export interface GetHistoryEntryResponseData {
  offset: number;
  log_id: number;
  entry?: unknown;
}

export interface McpListToolsResponseData {
  tools: Record<string, unknown>;
}

export interface ListCustomPromptsResponseData {
  custom_prompts: unknown[];
}

export interface TurnAbortedData {
  reason: 'interrupted' | 'replaced';
}

// Type aliases for better naming consistency
export type ApplyPatchApprovalRequestData = PatchApprovalData;

export interface ElicitationCreateData {
  codex_elicitation: string;
  message?: string;
  codex_command?: string | string[];
  codex_cwd?: string;
  codex_call_id?: string;
  codex_changes?: Record<string, FileChange>;
}

// Event data type map for type-safe event handling
export type EventDataMap = {
  [CodexAgentEventType.EXEC_COMMAND_BEGIN]: Extract<CodexEventMsg, { type: 'exec_command_begin' }>;
  [CodexAgentEventType.EXEC_COMMAND_OUTPUT_DELTA]: Extract<CodexEventMsg, { type: 'exec_command_output_delta' }>;
  [CodexAgentEventType.EXEC_COMMAND_END]: Extract<CodexEventMsg, { type: 'exec_command_end' }>;
  [CodexAgentEventType.APPLY_PATCH_APPROVAL_REQUEST]: Extract<CodexEventMsg, { type: 'apply_patch_approval_request' }>;
  [CodexAgentEventType.PATCH_APPLY_BEGIN]: Extract<CodexEventMsg, { type: 'patch_apply_begin' }>;
  [CodexAgentEventType.PATCH_APPLY_END]: Extract<CodexEventMsg, { type: 'patch_apply_end' }>;
  [CodexAgentEventType.MCP_TOOL_CALL_BEGIN]: Extract<CodexEventMsg, { type: 'mcp_tool_call_begin' }>;
  [CodexAgentEventType.MCP_TOOL_CALL_END]: Extract<CodexEventMsg, { type: 'mcp_tool_call_end' }>;
  [CodexAgentEventType.WEB_SEARCH_BEGIN]: Extract<CodexEventMsg, { type: 'web_search_begin' }>;
  [CodexAgentEventType.WEB_SEARCH_END]: Extract<CodexEventMsg, { type: 'web_search_end' }>;
};
