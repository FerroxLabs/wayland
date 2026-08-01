/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionBackend, ExecutionHandoff, ExecutionIdentity } from './types';

export type ExecutionHandoffInput = Readonly<{
  id: string;
  identity: ExecutionIdentity;
  from: ExecutionBackend;
  to: ExecutionBackend;
  checkpoint: string;
  preserved: readonly string[];
  lost: readonly string[];
  capabilityAdded: readonly string[];
  capabilityRemoved: readonly string[];
  unresolvedSideEffects: readonly string[];
  receiptId: string;
}>;

export function createExecutionHandoff(input: ExecutionHandoffInput): ExecutionHandoff {
  const unresolvedSideEffects = [...new Set(input.unresolvedSideEffects)].toSorted();
  return {
    ...input,
    preserved: [...new Set(input.preserved)].toSorted(),
    lost: [...new Set(input.lost)].toSorted(),
    capabilityAdded: [...new Set(input.capabilityAdded)].toSorted(),
    capabilityRemoved: [...new Set(input.capabilityRemoved)].toSorted(),
    unresolvedSideEffects,
    requiresFreshRun: input.from !== input.to || input.lost.length > 0 || unresolvedSideEffects.length > 0,
  };
}
