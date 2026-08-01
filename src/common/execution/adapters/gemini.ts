/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import type { ExecutionEvent } from '../types';
import type { ExecutionAdapterContext } from './types';
import { adaptWCoreMessages } from './wcore';

/**
 * Gemini is normalized into the same persisted activity, plan, and tool-group
 * message shapes as WCore. Keeping a named adapter makes the backend boundary
 * explicit without creating a second projection model.
 */
export function adaptGeminiMessages(
  messages: readonly TMessage[],
  context: ExecutionAdapterContext
): readonly ExecutionEvent[] {
  return adaptWCoreMessages(messages, context);
}
