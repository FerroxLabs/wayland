/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { CronJob } from './CronStore';

export interface ICronEventEmitter {
  emitJobCreated(job: CronJob): void;
  emitJobUpdated(job: CronJob): void;
  emitJobExecuted(jobId: string, status: 'ok' | 'error' | 'skipped' | 'missed', error?: string): void;
  emitJobRemoved(jobId: string): void;
  showNotification(params: {
    title: string;
    body: string;
    conversationId: string;
    /** The deliverable the banner announces. Clicking the banner opens it. */
    artifactId?: string;
  }): Promise<void>;
}
