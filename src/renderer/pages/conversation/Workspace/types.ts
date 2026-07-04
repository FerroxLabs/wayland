/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import type { NodeInstance } from '@arco-design/web-react/es/Tree/interface';
import type { Message } from '@arco-design/web-react';

export type MessageApi = ReturnType<typeof Message.useMessage>[0];

/**
 * Props definition for Workspace component
 */
export interface WorkspaceProps {
  workspace: string;
  conversation_id: string;
  eventPrefix?: 'gemini' | 'acp' | 'codex' | 'wcore';
  messageApi?: MessageApi;
  teamId?: string;
}

/**
 * Context menu state
 */
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: IDirOrFile | null;
}

/**
 * Rename modal state
 */
export interface RenameModalState {
  visible: boolean;
  value: string;
  target: IDirOrFile | null;
}

/**
 * Delete confirmation modal state
 */
export interface DeleteModalState {
  visible: boolean;
  target: IDirOrFile | null;
  loading: boolean;
}

/**
 * Paste confirmation modal state
 */
export interface PasteConfirmState {
  visible: boolean;
  fileName: string;
  filesToPaste: Array<{ path: string; name: string }>;
  doNotAsk: boolean;
  targetFolder: string | null;
}

/**
 * Workspace tree state
 */
export interface WorkspaceTreeState {
  files: IDirOrFile[];
  loading: boolean;
  treeKey: number;
  expandedKeys: string[];
  selected: string[];
  showSearch: boolean;
}

/**
 * Node selection reference for tracking the last selected folder node
 */
export interface SelectedNodeRef {
  relativePath: string;
  fullPath: string;
}

/**
 * Target folder path information
 */
export interface TargetFolderPath {
  fullPath: string;
  relativePath: string | null;
}

/**
 * Helper function types for extracting data from Tree nodes
 */
export type ExtractNodeDataFn = (node: NodeInstance | null | undefined) => IDirOrFile | null;
export type ExtractNodeKeyFn = (node: NodeInstance | null | undefined) => string | null;
export type GetPathSeparatorFn = (targetPath: string) => string;
export type FindNodeByKeyFn = (list: IDirOrFile[], key: string) => IDirOrFile | null;

export type WorkspaceTab = 'files' | 'changes' | 'terminal';
