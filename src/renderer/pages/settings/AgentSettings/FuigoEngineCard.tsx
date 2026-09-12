/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import React from 'react';
import { Avatar, Tooltip, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { resolveAgentLogo } from '@/renderer/utils/model/agentLogo';

/**
 * The bundled engine's facts: receipt version, whether the staged binary
 * verified against its bundle receipt (only a verified bundle spawns), and
 * the Desktop-managed engine home. What the Core overview pane used to show
 * (version · state · profile dir), for the Fuigo cutover. Rendered inside the
 * Fuigo hero card on Settings → Agents and the grid card in the agents modal.
 */
export const FuigoEngineFacts: React.FC<{ align?: 'left' | 'center' }> = ({ align = 'left' }) => {
  const { t } = useTranslation();
  const { data } = useSWR('acp.fuigo.engineStatus.settings', async () => {
    const result = await ipcBridge.acpConversation.getFuigoEngineStatus.invoke();
    return result.success ? result.data : undefined;
  });
  if (!data) return null;
  const badge =
    data.state === 'verified'
      ? { Icon: ShieldCheck, cls: 'text-success-6', label: t('settings.agentManagement.fuigoVerified') }
      : data.state === 'unverified'
        ? { Icon: ShieldAlert, cls: 'text-warning-6', label: t('settings.agentManagement.fuigoUnverified') }
        : { Icon: ShieldOff, cls: 'text-danger-6', label: t('settings.agentManagement.fuigoMissing') };
  const centered = align === 'center';
  return (
    <div className={`mt-6px flex flex-col gap-2px text-11px ${centered ? 'items-center text-center' : ''}`}>
      <div className='flex flex-wrap items-center gap-8px'>
        <span className='text-t-secondary'>
          {t('settings.agentManagement.fuigoBundledEngine')}
          {data.version ? ` · v${data.version}` : ''}
        </span>
        <Tooltip content={data.path ?? ''}>
          <span className={`inline-flex items-center gap-4px font-medium ${badge.cls}`}>
            <badge.Icon size={12} />
            {badge.label}
          </span>
        </Tooltip>
      </div>
      <Tooltip content={data.homeDir}>
        <Typography.Text className='block max-w-full truncate font-mono text-10px text-t-tertiary'>
          {t('settings.agentManagement.fuigoHome')}: {data.homeDir}
        </Typography.Text>
      </Tooltip>
    </div>
  );
};

/** Grid-card variant for the agents modal (`LocalAgents`). */
const FuigoEngineCard: React.FC<{ name: string }> = ({ name }) => {
  const logo = resolveAgentLogo({ backend: 'fuigo' });
  return (
    <div className='flex min-h-[154px] flex-col rounded-12px border-2 border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-12px transition-colors hover:border-[var(--color-border-3)]'>
      <div className='mb-10px flex justify-center'>
        <Avatar size={40} shape='square' style={{ flexShrink: 0, backgroundColor: 'transparent' }}>
          {logo ? <img src={logo} alt={name} className='h-full w-full object-contain' /> : '🤖'}
        </Avatar>
      </div>
      <div className='flex-1 text-center'>
        <Typography.Text className='block text-13px font-medium leading-18px'>{name}</Typography.Text>
        <FuigoEngineFacts align='center' />
      </div>
    </div>
  );
};

export default FuigoEngineCard;
