/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionIdentity } from '../types';

export type ExecutionAdapterContext = Readonly<{
  identity: ExecutionIdentity;
  observedAt: number;
  startSequence?: number;
  /**
   * Whether the conversation's turn is still in flight, when the caller knows.
   * `true` means no terminal lifecycle may be claimed from the messages seen so
   * far; `false` means the turn is over and the run may settle.
   */
  turnActive?: boolean;
}>;
