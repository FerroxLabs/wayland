/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ApprovalStore - Session-level approval cache for ACP permissions
 *
 * This implementation is inspired by Codex CLI's ApprovalStore.
 * It caches "always allow" decisions so that identical or similar operations
 * can be auto-approved without prompting the user again.
 *
 * Key design:
 * - Uses serialized keys (tool kind + title + rawInput) as cache identifiers
 * - Only caches "allow_always" decisions
 * - Kept in memory for fast lookups during a session; when constructed with a
 *   workspace path, `allow_always` decisions are also persisted to disk
 *   (ProcessConfig, keyed per workspace) so they survive an app restart (#672).
 */

import { ProcessConfig } from '@process/utils/initStorage';

/**
 * Key for ACP tool approval
 */
export interface AcpApprovalKey {
  kind: string; // 'execute', 'edit', 'read', etc.
  title: string; // Tool name/title
  rawInput?: {
    command?: string;
    description?: string;
    [key: string]: unknown;
  };
}

/**
 * Serialize an approval key to a string for use as a cache key
 *
 * Note: Only key operation identifiers (command, path, file_path) are included
 * in the hash. This means same operation with different descriptions will be
 * treated as identical and auto-approved. This is intentional for better UX -
 * users approve commands/paths, not descriptions.
 */
function serializeKey(key: AcpApprovalKey): string {
  // Normalize rawInput for consistent hashing
  // Only include operation-identifying fields (not descriptions or metadata)
  const normalizedInput: Record<string, unknown> = {};

  if (key.rawInput) {
    // Command is the primary identifier for execute operations
    if (key.rawInput.command) {
      normalizedInput.command = key.rawInput.command;
    }
    // For file operations, include path-related fields
    if (key.rawInput.path) {
      normalizedInput.path = key.rawInput.path;
    }
    if (key.rawInput.file_path) {
      normalizedInput.file_path = key.rawInput.file_path;
    }
  }

  return JSON.stringify({
    kind: key.kind || 'unknown',
    title: key.title || '',
    rawInput: normalizedInput,
  });
}

/**
 * AcpApprovalStore - Caches approval decisions for the ACP session
 */
export class AcpApprovalStore {
  private map: Map<string, string> = new Map(); // key -> optionId

  /**
   * @param workspace When provided, `allow_always` decisions are persisted to
   * disk under this key (via ProcessConfig) and rehydrated by `load()`.
   * Omit for purely session-scoped stores (e.g. tests).
   */
  constructor(private readonly workspace?: string) {}

  /**
   * Rehydrate persisted `allow_always` decisions for this workspace from disk.
   * Call once at session start, before any approval checks. No-op if this
   * store has no workspace, or nothing was ever persisted for it.
   */
  async load(): Promise<void> {
    if (!this.workspace) return;
    try {
      const persisted = await ProcessConfig.get('acp.approvals');
      const entries = persisted?.[this.workspace];
      if (entries) {
        for (const [key, optionId] of Object.entries(entries)) {
          this.map.set(key, optionId);
        }
      }
    } catch (error) {
      console.error('[Wayland] Failed to load persisted ACP approvals:', error);
    }
  }

  /**
   * Get cached decision for a key
   */
  get(key: AcpApprovalKey): string | undefined {
    const serialized = serializeKey(key);
    return this.map.get(serialized);
  }

  /**
   * Store a decision for a key
   * Only stores allow_always decisions (the only type worth caching)
   */
  put(key: AcpApprovalKey, optionId: string): void {
    if (optionId === 'allow_always') {
      const serialized = serializeKey(key);
      this.map.set(serialized, optionId);
      this.persist();
    }
  }

  /**
   * Check if key has allow_always status
   */
  isApprovedForSession(key: AcpApprovalKey): boolean {
    return this.get(key) === 'allow_always';
  }

  /**
   * Clear all cached approvals (in memory and, if scoped to a workspace, on disk)
   */
  clear(): void {
    this.map.clear();
    if (!this.workspace) return;
    const workspace = this.workspace;
    ProcessConfig.get('acp.approvals')
      .then((all) => {
        if (!all || !(workspace in all)) return undefined;
        const { [workspace]: _removed, ...rest } = all;
        return ProcessConfig.set('acp.approvals', rest);
      })
      .catch((error) => {
        console.error('[Wayland] Failed to clear persisted ACP approvals:', error);
      });
  }

  /**
   * Get the number of cached approvals
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Write the current in-memory map to disk under this store's workspace key.
   * Fire-and-forget (matches the existing cacheInitializeResult pattern) -
   * a failed write just means this decision isn't durable; the user's next
   * "allow always" click (or the in-memory cache for this session) retries it.
   *
   * ponytail: read-modify-write per store, no cross-instance write queue. Two
   * AcpApprovalStore instances persisting the SAME workspace concurrently can
   * race and drop one write. Add a serializing queue (like AcpAgent.cacheQueue)
   * if concurrent same-workspace sessions become common.
   */
  private persist(): void {
    if (!this.workspace) return;
    const workspace = this.workspace;
    const snapshot = Object.fromEntries(this.map);
    ProcessConfig.get('acp.approvals')
      .then((all) => ProcessConfig.set('acp.approvals', { ...all, [workspace]: snapshot }))
      .catch((error) => {
        console.error('[Wayland] Failed to persist ACP approval decision:', error);
      });
  }
}

/**
 * Create an AcpApprovalKey from permission request data
 */
export function createAcpApprovalKey(toolCall: {
  kind?: string;
  title?: string;
  rawInput?: Record<string, unknown>;
}): AcpApprovalKey {
  return {
    kind: toolCall.kind || 'unknown',
    title: toolCall.title || '',
    rawInput: toolCall.rawInput as AcpApprovalKey['rawInput'],
  };
}
