/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { CronJob } from './CronStore';
import type { ArtifactRecord } from '@process/services/artifacts/artifactLedger';

export interface ICronJobExecutor {
  /** Returns true if the conversation already has an active run in progress. */
  isConversationBusy(conversationId: string): boolean;
  /** Execute the job's payload against the target conversation.
   * @param onAcquired - Called after task acquisition succeeds, before sendMessage.
   *   Use this hook to register completion notifications while guaranteeing that
   *   busy-state has already been set (avoiding premature onceIdle fires). */
  executeJob(
    job: CronJob,
    onAcquired?: () => void,
    preparedConversationId?: string,
    triggeredAt?: number
  ): Promise<string | void>;
  /** Create/resolve the conversation for a job without sending a message.
   *  Returns the conversationId that will be used for execution. */
  prepareConversation(job: CronJob): Promise<string>;
  /** Register a callback to fire once the conversation becomes idle. */
  onceIdle(conversationId: string, callback: () => Promise<void>): void;
  /** What the conversation's current run published, once publication has
   *  finished. The idle callbacks fire synchronously and cannot await the
   *  publication, so a completion notification has to await this instead of
   *  reading the ledger the moment the conversation goes idle. Resolves empty
   *  for a run that published nothing; never rejects. */
  whenRunPublished(conversationId: string): Promise<ArtifactRecord[]>;
  /** Mark the conversation as busy/not-busy. */
  setProcessing(conversationId: string, busy: boolean): void;
}
