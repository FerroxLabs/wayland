/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BackendPill - per-row backend dropdown for the launcher roster.
 *
 * Renders an Arco Select restricted to the set returned by
 * `useAvailableBackends().available` (installed CLIs ∪ wayland-core fallback).
 * The pill is intentionally compact so the roster row stays single-line on
 * normal viewports - matches mockup §2.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { WaylandSelect } from '@renderer/components/base';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';

const { Option } = WaylandSelect;

export type BackendPillProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  testId?: string;
};

const BackendIcon: React.FC<{ backend: string }> = ({ backend }) => {
  const logo = getAgentLogo(backend);
  if (logo) {
    return <img src={logo} alt='' style={{ width: 14, height: 14, objectFit: 'contain' }} />;
  }
  return <Bot size={14} />;
};

const BackendPill: React.FC<BackendPillProps> = ({ value, options, onChange, disabled, testId }) => {
  const { t } = useTranslation();
  const handleChange = (next: unknown) => {
    if (typeof next === 'string') onChange(next);
  };

  return (
    <WaylandSelect
      data-testid={testId}
      size='small'
      style={{ width: 160 }}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={t('teams.launcher.backendPickerPlaceholder', { defaultValue: 'Backend' })}
      renderFormat={(_option, val) => {
        const backendId = typeof val === 'string' ? val : value;
        return (
          <span className='flex items-center gap-6px'>
            <BackendIcon backend={backendId} />
            <span>{backendId}</span>
          </span>
        );
      }}
    >
      {options.map((id) => (
        <Option key={id} value={id} data-testid={testId ? `${testId}-option-${id}` : undefined}>
          <span className='flex items-center gap-6px'>
            <BackendIcon backend={id} />
            <span>{id}</span>
          </span>
        </Option>
      ))}
    </WaylandSelect>
  );
};

export default BackendPill;
