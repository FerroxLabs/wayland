/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CronJob } from './CronStore';

export interface ICronEventEmitter {
  emitJobCreated(job: CronJob): void;
  emitJobUpdated(job: CronJob): void;
  emitJobExecuted(jobId: string, status: 'ok' | 'error' | 'skipped' | 'missed', error?: string): void;
  emitJobRemoved(jobId: string): void;
  showNotification(params: { title: string; body: string; conversationId: string }): Promise<void>;
}
