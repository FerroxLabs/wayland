/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ACP_BACKENDS_ALL } from '@/common/types/acpTypes';

/**
 * Resolve a backend id to its FRIENDLY runtime name for the chat header pill
 * (#909). Returns undefined when there is no friendly name - the badge then
 * shows a single label instead of leaking the raw lowercase id (e.g. it must
 * never render "Assistant · gemini"). The cross-audit flagged the old raw-id
 * fallthrough (D-06 finding 2).
 */
export function resolveRuntimeName(backend?: string): string | undefined {
  if (!backend) return undefined;
  return ACP_BACKENDS_ALL[backend as keyof typeof ACP_BACKENDS_ALL]?.name || undefined;
}
