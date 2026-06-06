/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import type { AcpBackend } from '@/common/types/acpTypes';

type SideQuestionConversationType = TChatConversation['type'];

export type SideQuestionEligibilityTarget = {
  backend?: AcpBackend;
  type: SideQuestionConversationType;
};

export function isSideQuestionSupported(target: SideQuestionEligibilityTarget): boolean {
  return target.type === 'acp' && target.backend === 'claude';
}
