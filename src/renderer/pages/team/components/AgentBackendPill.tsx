/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AgentBackendPill - per-agent backend swap control for the team
 * page header (live-smoke fix #4b, 2026-05-19).
 *
 * Wraps the same compact `WaylandSelect` used by the launcher's
 * BackendPill (`pages/teams/components/BackendPill.tsx`), but the
 * onChange handler fires `ipcBridge.team.changeAgentBackend` against
 * a running team agent and surfaces success/error as an Arco toast.
 *
 * Hides itself entirely when fewer than two backends are installed -
 * a one-option dropdown is just clutter.
 *
 * Cross-conversationType swaps (e.g. gemini → claude) get rejected
 * by the service layer with a descriptive error which we surface
 * to the user verbatim so they can choose to remove + re-add the
 * agent instead of attempting the in-place swap.
 */

import { Bot } from 'lucide-react';
import { Message } from '@arco-design/web-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { WaylandSelect } from '@renderer/components/base';
import { useAvailableBackends } from '@renderer/hooks/assistant/useAvailableBackends';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';

const { Option } = WaylandSelect;

type Props = {
  teamId: string;
  slotId: string;
  agentType: string;
  disabled?: boolean;
};

const BackendIcon: React.FC<{ backend: string }> = ({ backend }) => {
  const logo = getAgentLogo(backend);
  if (logo) {
    return <img src={logo} alt='' style={{ width: 12, height: 12, objectFit: 'contain' }} />;
  }
  return <Bot size={12} />;
};

const AgentBackendPill: React.FC<Props> = ({ teamId, slotId, agentType, disabled = false }) => {
  const { t } = useTranslation();
  const { available } = useAvailableBackends();

  // If the agent's current backend isn't in the installed set (rare -
  // happens when the user uninstalls the CLI mid-session) keep it in
  // the option list so the current selection still renders correctly.
  const options = useMemo(() => {
    if (available.includes(agentType as (typeof available)[number])) return available;
    return [agentType as (typeof available)[number], ...available];
  }, [available, agentType]);

  const handleChange = useCallback(
    async (next: unknown) => {
      if (typeof next !== 'string' || next === agentType) return;
      try {
        const result = (await ipcBridge.team.changeAgentBackend.invoke({
          teamId,
          slotId,
          newBackend: next,
        })) as void | { __bridgeError: true; message?: string };
        if (result && typeof result === 'object' && '__bridgeError' in result) {
          Message.error(
            result.message ??
              t('team.agentBackendSwap.error', { defaultValue: 'Failed to change agent backend' })
          );
          return;
        }
        Message.success(
          t('team.agentBackendSwap.success', { defaultValue: 'Agent backend changed' })
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        Message.error(
          msg || t('team.agentBackendSwap.error', { defaultValue: 'Failed to change agent backend' })
        );
      }
    },
    [agentType, slotId, t, teamId]
  );

  // No swap is meaningful with fewer than two installed backends.
  if (options.length < 2) return null;

  return (
    <WaylandSelect
      size='mini'
      style={{ width: 120 }}
      value={agentType}
      onChange={handleChange}
      disabled={disabled}
      data-testid={`agent-backend-pill-${slotId}`}
      renderFormat={(_option, val) => {
        const id = typeof val === 'string' ? val : agentType;
        return (
          <span className='flex items-center gap-4px'>
            <BackendIcon backend={id} />
            <span>{id}</span>
          </span>
        );
      }}
    >
      {options.map((id) => (
        <Option
          key={id}
          value={id}
          data-testid={`agent-backend-pill-${slotId}-option-${id}`}
        >
          <span className='flex items-center gap-6px'>
            <BackendIcon backend={id} />
            <span>{id}</span>
          </span>
        </Option>
      ))}
    </WaylandSelect>
  );
};

export default AgentBackendPill;
