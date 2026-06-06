/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'crypto';
import type { IUsageEventRepository, UsageEvent } from './types';

// Cross-audit MED-2 fix: cap the serialized metadata blob so a bad caller
// (or a future logger that accidentally serializes a huge object) cannot
// bloat usage_events with MB-sized rows. 2KB is generous for legitimate
// telemetry (modelId, anchorId, small flags) but blocks pathological cases.
const MAX_METADATA_BYTES = 2048;

/**
 * Thin orchestrator that turns a partial record() input into a fully-formed
 * UsageEvent and writes it through the repository. Defaults `id` to a UUID
 * and `timestampMs` to now. Errors are swallowed (warn-only) - telemetry
 * must never break a user-facing flow.
 */
export class UsageEventLogger {
  constructor(private readonly repo: IUsageEventRepository) {}

  async record(
    input: Omit<UsageEvent, 'id' | 'timestampMs'> & Partial<Pick<UsageEvent, 'id' | 'timestampMs'>>
  ): Promise<void> {
    let safeMetadata = input.metadata;
    if (safeMetadata) {
      const serialized = JSON.stringify(safeMetadata);
      if (serialized.length > MAX_METADATA_BYTES) {
        console.warn(
          `[UsageEventLogger] metadata size ${serialized.length}B > ${MAX_METADATA_BYTES}B cap, truncating`
        );
        safeMetadata = { _truncated: true, _originalSize: serialized.length };
      }
    }
    const event: UsageEvent = {
      id: input.id ?? randomUUID(),
      timestampMs: input.timestampMs ?? Date.now(),
      eventType: input.eventType,
      anchorId: input.anchorId,
      assistantId: input.assistantId,
      cliBackend: input.cliBackend,
      metadata: safeMetadata,
    };
    try {
      await this.repo.append(event);
    } catch (err) {
      console.warn('[UsageEventLogger] append failed:', err instanceof Error ? err.message : err);
    }
  }
}
