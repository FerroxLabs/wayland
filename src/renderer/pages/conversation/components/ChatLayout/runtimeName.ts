/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ACP_BACKENDS_ALL } from '@/common/types/acpTypes';

/**
 * Friendly display names for non-ACP backends (the ACP_BACKENDS_ALL registry
 * only covers ACP-protocol agents; native-spawn backends like wcore need their
 * own lookup so the UI doesn't show the raw id).
 */
export const NON_ACP_BACKEND_DISPLAY_NAMES: Record<string, string> = {
  wcore: 'Wayland Core',
};

/**
 * Resolve a backend id to its FRIENDLY runtime name for the chat header pill
 * (#909). Returns undefined when there is no friendly name - the badge then
 * shows a single label instead of leaking the raw lowercase id (e.g. it must
 * never render "Assistant · gemini"). The cross-audit flagged the old raw-id
 * fallthrough (D-06 finding 2).
 */
export function resolveRuntimeName(backend?: string): string | undefined {
  if (!backend) return undefined;
  return (
    NON_ACP_BACKEND_DISPLAY_NAMES[backend] ||
    ACP_BACKENDS_ALL[backend as keyof typeof ACP_BACKENDS_ALL]?.name ||
    undefined
  );
}
