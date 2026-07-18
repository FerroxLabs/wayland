/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import type { TMessage } from '@/common/chat/chatLib';
import {
  adaptAcpMessages,
  adaptWCoreMessages,
  projectExecution,
  type ExecutionBackend,
  type ExecutionEvent,
  type ExecutionProjectionOptions,
  type ExecutionSeed,
  type ExecutionSnapshot,
} from '@/common/execution';

export function useExecutionSnapshot(
  seed: ExecutionSeed,
  events: readonly ExecutionEvent[],
  options: ExecutionProjectionOptions
): ExecutionSnapshot {
  return useMemo(() => projectExecution(seed, events, options), [events, options, seed]);
}

export function useBackendExecutionSnapshot(
  backend: ExecutionBackend,
  seed: ExecutionSeed,
  messages: readonly TMessage[],
  options: ExecutionProjectionOptions
): ExecutionSnapshot {
  return useMemo(() => {
    const context = { identity: seed.identity, observedAt: options.now };
    const events = backend === 'wcore' ? adaptWCoreMessages(messages, context) : adaptAcpMessages(messages, context);
    return projectExecution(seed, events, options);
  }, [backend, messages, options, seed]);
}
