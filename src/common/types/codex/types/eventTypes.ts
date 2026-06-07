/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Codex Agent Event Types
export enum CodexAgentEventType {
  // Session and configuration events
  /**
   * Session configured event - confirms the client's configuration message
   * prompt: 'hello codex'
   * payload: {
   *  session_id: string,
   *  model: string,
   *  reasoning_effort: string | null,
   *  history_log_id: number,
   *  history_entry_count: number,
   *  initial_messages: EventMsg[] | null,
   *  rollout_path: string
   * }
   * */
  SESSION_CONFIGURED = 'session_configured',

  /**
   * Task started event - the agent has begun working on the task
   * prompt: 'hello codex'
   * payload: { model_context_window: number | null }
   */
  TASK_STARTED = 'task_started',

  /**
   * Task complete event - the agent has finished all operations
   * prompt: 'hello codex'
   * payload: { last_agent_message: string | null }
   */
  TASK_COMPLETE = 'task_complete',

  // Text & reasoning events
  /**
   * Agent message delta event - incremental chunk of the agent's text output (streaming delta)
   * prompt: 'hello codex'
   * payload: { delta: string }
   */
  AGENT_MESSAGE_DELTA = 'agent_message_delta',

  /**
   * Agent message event - full text output message from the agent (complete output)
   * prompt: 'hello codex'
   * payload: { message: string }
   */
  AGENT_MESSAGE = 'agent_message',

  /**
   * User message event - user/system input message (content sent to the model)
   * prompt: 'hello codex'
   * payload: { message: string, kind: InputMessageKind | null, images: string[] | null }
   */
  USER_MESSAGE = 'user_message',

  /**
   * Agent reasoning event - reasoning output from the agent (complete chain-of-thought text)
   * prompt: 'Where can I find the raw message format API docs for codex?'
   * payload: { text: string }
   */
  AGENT_REASONING = 'agent_reasoning',

  /**
   * Agent reasoning delta event - incremental reasoning output from the agent (streaming delta text)
   * prompt: 'Can you give me the official OpenAI URL?'
   * payload: { delta: string }
   */
  AGENT_REASONING_DELTA = 'agent_reasoning_delta',

  /**
   * Agent reasoning raw content event - raw chain-of-thought from the agent
   * prompt: 'TypeScript compile error: "Property X does not exist" - please help me diagnose the cause'
   * payload: { text: string }
   */
  AGENT_REASONING_RAW_CONTENT = 'agent_reasoning_raw_content',

  /**
   * Agent reasoning raw content delta event - incremental reasoning content delta from the agent
   * payload: { delta: string }
   */
  AGENT_REASONING_RAW_CONTENT_DELTA = 'agent_reasoning_raw_content_delta',

  /**
   * Agent reasoning section break event - signals when the model starts a new reasoning summary section (e.g. a new heading block)
   * prompt: 'TypeScript compile error: "Property X does not exist" - please help me diagnose the cause'
   * payload: {}
   */
  AGENT_REASONING_SECTION_BREAK = 'agent_reasoning_section_break',

  // Usage / telemetry
  /**
   * Token count event - usage update for the current session, including totals and the last request
   * prompt: 'hello codex'
   * payload: { info: {
      "total_token_usage": {
        "input_tokens": 2439,
        "cached_input_tokens": 2048,
        "output_tokens": 18,
        "reasoning_output_tokens": 0,
        "total_tokens": 2457
      },
      "last_token_usage": {
        "input_tokens": 2439,
        "cached_input_tokens": 2048,
        "output_tokens": 18,
        "reasoning_output_tokens": 0,
        "total_tokens": 2457
      },
      "model_context_window": 272000
    } | null }
   */
  TOKEN_COUNT = 'token_count',

  // Command execution events
  /**
   * Exec command begin event - notifies the server that a command is about to be executed
   * prompt: 'TypeScript compile error: "Property X does not exist" - please help me diagnose the cause'
   * payload: {
      "type": "exec_command_begin",
      "call_id": "call_vufa8VWQV91WSWcc5BlFTsmQ",
      "command": [ "bash", "-lc", "ls -a" ],
      "cwd": "/Users/you/Library/Application Support/Wayland/wayland/codex-temp-1758954404275",
      "parsed_cmd": [
        {
        "type": "list_files",
        "cmd": "ls -a",
        "path": null
        }
      ]
    }
   */
  EXEC_COMMAND_BEGIN = 'exec_command_begin',

  /**
   * Exec command output delta event - incremental output chunk from a running command
   * prompt: 'TypeScript compile error: "Property X does not exist" - please help me diagnose the cause'
   * payload: { call_id: string, stream: ExecOutputStream, chunk: number[] }
   * {
      "type": "exec_command_output_delta",
      "call_id": "call_vufa8VWQV91WSWcc5BlFTsmQ",
      "stream": "stdout",
      "chunk": "LgouLgo="
    }
   */
  EXEC_COMMAND_OUTPUT_DELTA = 'exec_command_output_delta',

  /**
   * Exec command end event - indicates that command execution has completed
   * prompt: 'TypeScript compile error: "Property X does not exist" - please help me diagnose the cause'
   * payload: {
   *  "type": "exec_command_end",
   *  "call_id": "call_vufa8VWQV91WSWcc5BlFTsmQ",
   *  "stdout": ".\\n..\\n",
   *  "stderr": "",
   *  "aggregated_output": ".\\n..\\n",
   *  "exit_code": 0,
   *  "duration": {
   *    "secs": 0,
   *    "nanos": 297701750
   *  },
   *  "formatted_output": ".\\n..\\n"
   * }
   */
  EXEC_COMMAND_END = 'exec_command_end',

  /**
   * Exec approval request event - requests approval before executing a command
   * prompt: Create a file hello.txt with the content ‘hello codex’
   * payload:  {
      "type": "exec_approval_request",
      "call_id": "call_W5qxMSKOP2eHaEq16QCtrhVS",
      "command": ["bash", "-lc", "echo '1231231' > hello.txt" ],
      "cwd": "/Users/you/Library/Application Support/Wayland/wayland/codex-temp-1758954404275",
      "reason": "Need to create hello.txt with requested content per user instruction"
    }
   */
  EXEC_APPROVAL_REQUEST = 'exec_approval_request',

  // Patch/file modification events
  /**
   * Apply patch approval request event - requests approval before applying a code patch
   * prompt: Create a file hello.txt with the content ‘hello codex’
   * payload: {
      type: 'apply_patch_approval_request',
      call_id: 'patch-7',
      changes: {
        'src/app.ts': { type: 'update', unified_diff: '--- a\n+++ b\n+console.log("hi")\n', move_path: null },
        'README.md': { type: 'add', content: '# Readme\n' },
      },
      reason: null,
      grant_root: null,
    }
   */
  APPLY_PATCH_APPROVAL_REQUEST = 'apply_patch_approval_request',

  /**
   * Patch apply begin event - notifies the agent that a code patch is about to be applied. Mirrors `ExecCommandBegin` so the frontend can display a progress indicator.
   * tips: codex runs in sandbox_mode=read-only by default, which prevents direct file writes and will not trigger the patch_apply_begin → patch_apply_end flow.
   *      To enable it, update ~/.codex/config.toml: set sandbox_mode = "workspace-write" and apply_patch = true
   * prompt: Use the apply_patch <<'PATCH' … PATCH command to write a file - choose the content and filename freely
   * payload: {
      "type": "patch_apply_begin",
          "call_id": "call_3tChlyDszdHuQRQTWnuZ8Jvb",
          "auto_approved": false,
          "changes": {
            "/Users/you/Library/Application Support/Wayland/wayland/codex-temp-1759144414815/note.txt": {
            "add": {
              "content": "This file was created via apply_patch.\nValue: 100.\n"
            }
          }
        }
      }
   */
  PATCH_APPLY_BEGIN = 'patch_apply_begin',

  /**
   * Patch apply end event - notifies that the patch application has completed
   * prompt: Use the apply_patch <<'PATCH' … PATCH command to write a file - choose the content and filename freely
   * payload: {
      "type": "patch_apply_end",
      "call_id": "call_3tChlyDszdHuQRQTWnuZ8Jvb",
      "stdout": "Success. Updated the following files:\nA note.txt\n",
      "stderr": "",
      "success": true
    }
   */
  PATCH_APPLY_END = 'patch_apply_end',

  // MCP tool events
  /**
   * MCP tool call begin event - indicates that an MCP tool call has started
   * tips: Install the MCP server first via `codex mcp add 12306-mcp`. More MCP servers can be found at https://modelscope.cn/mcp?page=1. After installation, verify with `codex mcp list`.
   * prompt: Look up high-speed rail tickets from Shenzhen to Guangzhou on 2025-10-10
   * payload: {
      "type": "mcp_tool_call_begin",
      "call_id": "call_2ZBKJbPYIBgm5qo2mzRpqi1U",
        "invocation": {
        "server": "12306-mcp",
        "tool": "get-tickets",
        "arguments": {
          "date": "2025-10-10",
          "fromStation": "SZQ",
          "toStation": "GZQ"
        }
      }
    }
   */
  MCP_TOOL_CALL_BEGIN = 'mcp_tool_call_begin',

  /**
   * MCP tool call end event - indicates that an MCP tool call has completed
   *
   * prompt: Look up high-speed rail tickets from Shenzhen to Guangzhou on 2025-10-10
   * payload: {
    "type": "mcp_tool_call_end",
      "call_id": "call_VNRuLW1UoklIAK3QTL5iE47l",
      "invocation": {
        "server": "12306-mcp",
        "tool": "get-tickets",
        "arguments": {
          "date": "2025-10-10",
          "fromStation": "SZQ",
          "toStation": "GZQ"
          }
        },
        "duration": {
          "secs": 0,
          "nanos": 874102541
        },
        "result": {
          "Ok": {
          "content": [
            {
            "text": "Train|Departure -> Arrival|Departure Time -> Arrival Time|Duration\nG834 Shenzhen North(telecode:IOQ) -> Guangzhou South(telecode:IZQ) 06:10 -> 06:46 Duration: 00:36\n-……",
            "type": "text"
            }
          ]
        }
      }
    }
   */
  MCP_TOOL_CALL_END = 'mcp_tool_call_end',

  /**
   * MCP list tools response event - list of MCP tools available to the agent
   * payload: { tools: Record<string, McpTool> }
   */
  MCP_LIST_TOOLS_RESPONSE = 'mcp_list_tools_response',

  // Web search events
  /**
   * Web search begin event - indicates that a web search has started
   * tips: web_search capability must be enabled manually by adding web_search = true in ~/.codex/config.toml
   * prompt: Look up the new features in TypeScript 5.0 - do not use your existing knowledge, fetch the latest from the official site
   * payload: {
   *  "type":"web_search_begin",
   *  "call_id":"ws_010bdd5c4db8ef410168da04c74a648196b7e30cb864885b26"
   * }
   */
  WEB_SEARCH_BEGIN = 'web_search_begin',

  /**
   * Web search end event - indicates that a web search has completed
   * prompt: Look up the new features in TypeScript 5.0 - do not use your existing knowledge, fetch the latest from the official site
   * payload: {
   *  "type":"web_search_end",
   *  "call_id":"ws_010bdd5c4db8ef410168da04c74a648196b7e30cb864885b26",
   *  "query":"TypeScript 5.0 whats new site:devblogs.microsoft.com/typescript"
   * }
   */
  WEB_SEARCH_END = 'web_search_end',

  // Conversation history & context
  /**
   * Turn diff event - represents the diff between turns
   * prompt: Use the apply_patch <<'PATCH' … PATCH command to write a file - choose the content and filename freely
   * payload: {
      "type": "turn_diff",
      // eslint-disable-next-line max-len
      "unified_diff": "diff --git a//Users/you/Library/Application Support/Wayland/wayland/codex-temp-1759197123355/freestyle.txt b//Users/you/Library/Application Support/Wayland/wayland/codex-temp-1759197123355/freestyle.txt\nnew file mode 100644\nindex 0000000000000000000000000000000000000000..151e31d7a6627e3fb0df2e49b3c0c179f96e46cc\n--- /dev/null\n+++ b//Users/you/Library/Application Support/Wayland/wayland/codex-temp-1759197123355/freestyle.txt\n@@ -0,0 +1,2 @@\n+This file was created via apply_patch.\n+Line two says hello.\n"
    }
   */
  TURN_DIFF = 'turn_diff',

  /**
   * Get history entry response event - response to a GetHistoryEntryRequest
   * prompt: View the history of the current session
   * payload: { offset: number, log_id: number, entry: HistoryEntry | null }
   */
  GET_HISTORY_ENTRY_RESPONSE = 'get_history_entry_response',

  /**
   * List custom prompts response event - list of custom prompts available to the agent
   * payload: { custom_prompts: CustomPrompt[] }
   */
  LIST_CUSTOM_PROMPTS_RESPONSE = 'list_custom_prompts_response',

  /**
   * Conversation path event - conveys conversation path information
   * payload: { conversation_id: string, path: string }
   */
  CONVERSATION_PATH = 'conversation_path',

  /**
   * Background event - background processing event
   * payload: { message: string }
   */
  BACKGROUND_EVENT = 'background_event',

  /**
   * Turn aborted event - indicates that a turn was aborted
   * payload: { reason: TurnAbortReason }
   */
  TURN_ABORTED = 'turn_aborted',
}
