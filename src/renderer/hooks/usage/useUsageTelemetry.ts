/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { ipcBridge } from '@/common';

export type UsageTelemetryInput = {
  eventType:
    | 'launchpad.card_clicked'
    | 'launchpad.view_all_clicked'
    | 'launchpad.intent_pill_clicked'
    | 'launchpad.intent_prompt_clicked'
    | 'guid.assistant_selected'
    | 'guid.cli_selected'
    | 'guid.model_selected'
    | 'guid.message_sent'
    | 'guid.foreground'
    | 'dashboard.opened'
    | 'dashboard.widget_clicked'
    | 'dashboard.summary_requested';
  anchorId?: string;
  assistantId?: string;
  cliBackend?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget telemetry recorder. The returned callback never throws -
 * IPC failures are logged via console.warn and otherwise swallowed so that
 * telemetry can never break a user-facing flow.
 */
export function useUsageTelemetry(): (input: UsageTelemetryInput) => void {
  return useCallback((input) => {
    ipcBridge.usage.recordEvent.invoke(input).catch((err) => {
      console.warn('[useUsageTelemetry] record failed:', err);
    });
  }, []);
}
