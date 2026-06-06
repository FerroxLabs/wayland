/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 - shared brain types for Memory tabs.
 *
 * `IjfwVerb` is the allowlist union of MCP verbs that any Memory-tab UI may
 * invoke via `ipcBridge.ijfw.brainInvoke`. Keep this list in sync with the
 * verbs the main-side IJFW MCP client exposes; the union is the single
 * source of truth on the renderer side so Wave 5 tabs get compile-time
 * safety against typos.
 */

export type IjfwVerb =
  | 'think'
  | 'links'
  | 'memory_recall'
  | 'memory_search'
  | 'memory_store'
  | 'memory_facts'
  | 'memory_prelude'
  | 'wiki.get'
  | 'wiki.compile'
  | 'wiki.promote'
  | 'wiki.export'
  | 'wiki.shareReadme'
  | 'conflict.resolve'
  | 'state'
  | 'metrics'
  | 'prompt_check'
  | 'update_check'
  | 'update_apply'
  | 'cross_audit_converge'
  | 'cross_project_search';

// VerbState re-export removed - useIjfwBrain deleted in v0.6.4 (tabs replaced by 3-pane archive).
