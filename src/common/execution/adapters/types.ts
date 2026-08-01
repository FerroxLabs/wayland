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
}>;
