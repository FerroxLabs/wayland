/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { watch, type FSWatcher } from 'node:fs';

export type AnvilMutationReason = 'workspace_mutated' | 'watcher_failed';

type WatchFactory = typeof watch;

/**
 * Conservative lifetime guard for publication-bound Anvil receipts.
 *
 * Core v1 proves the artifact state only when it publishes the receipt. Once
 * armed, any later workspace filesystem notification revokes Desktop's live
 * trust. Desktop does not attempt to manufacture a replacement digest; fresh
 * Core validation is required.
 */
export class AnvilPersistentMutationWatcher {
  private watcher: FSWatcher | null = null;

  constructor(
    private readonly workspace: string,
    private readonly onMutation: (reason: AnvilMutationReason) => void,
    private readonly watchFactory: WatchFactory = watch
  ) {}

  start(): void {
    if (this.watcher) return;

    const notifyMutation = () => this.onMutation('workspace_mutated');
    try {
      this.watcher = this.watchFactory(this.workspace, { recursive: true }, notifyMutation);
    } catch {
      // A top-level fallback can miss nested artifact mutations. Treat an
      // unavailable recursive watcher as loss of continuing authority.
      this.onMutation('watcher_failed');
      return;
    }

    this.watcher.on('error', () => {
      this.onMutation('watcher_failed');
      this.stop();
    });
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = null;
  }

  get active(): boolean {
    return this.watcher !== null;
  }
}
