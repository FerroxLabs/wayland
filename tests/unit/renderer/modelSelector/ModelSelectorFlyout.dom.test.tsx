/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ModelSelectorFlyout from '@renderer/components/model/modelSelector/ModelSelectorFlyout';
import type { ModelRow, ModelSelectorViewModel } from '@renderer/components/model/modelSelector/modelSelectorTypes';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string } & Record<string, unknown>) => {
      let s = opts?.defaultValue ?? _key;
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          s = s.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return s;
    },
  }),
}));

const row = (over: Partial<ModelRow>): ModelRow => ({
  key: 'anthropic:m',
  id: 'm',
  providerId: 'anthropic',
  label: 'Model',
  descriptor: '200K context · Anthropic',
  pinned: false,
  available: true,
  ...over,
});

const fluxHero = row({
  key: 'flux-router:flux-auto',
  id: 'flux-auto',
  providerId: 'flux-router',
  label: 'Flux Auto',
  descriptor: 'Routes each turn to the best model automatically',
  isFlux: true,
});

const pinnedRow = row({ key: 'anthropic:opus', id: 'opus', label: 'Opus 4.8', pinned: true, price: '$$$' });
const recRow = row({ key: 'openai:gpt', id: 'gpt', providerId: 'openai', label: 'GPT-5.2', price: '$$$' });

const baseVm: ModelSelectorViewModel = {
  fluxHero,
  zones: [
    { id: 'pinned', label: 'Pinned', rows: [pinnedRow] },
    { id: 'recommended:openai', label: 'Recommended for OpenAI', rows: [recRow] },
  ],
  moreZones: [
    {
      id: 'more:openai',
      label: 'OpenAI',
      rows: [row({ key: 'openai:mini', id: 'mini', providerId: 'openai', label: 'GPT-5.2 mini', price: '$' })],
    },
  ],
  activeKey: 'flux-router:flux-auto',
  effortSupported: false,
  empty: false,
};

const noop = () => {};

describe('ModelSelectorFlyout', () => {
  it('renders the flux hero, pinned + recommended rows', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    expect(screen.getByText('Flux Auto')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Opus 4.8')).toBeInTheDocument();
    expect(screen.getByText('GPT-5.2')).toBeInTheDocument();
  });

  it('does not leak the raw providerId as a label pill (triple-label fix)', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    // The human labels/headers still show; the raw internal ids must not.
    expect(screen.getByText('GPT-5.2')).toBeInTheDocument();
    expect(screen.getByText('Recommended for OpenAI')).toBeInTheDocument();
    expect(screen.queryByText('openai')).not.toBeInTheDocument();
    expect(screen.queryByText('anthropic')).not.toBeInTheDocument();
    expect(screen.queryByText('flux-router')).not.toBeInTheDocument();
  });

  it('fires onSelect with (id, providerId) when a row is clicked', () => {
    const onSelect = vi.fn();
    render(<ModelSelectorFlyout vm={baseVm} onSelect={onSelect} onTogglePin={noop} onManage={noop} />);
    fireEvent.click(screen.getByText('Opus 4.8'));
    expect(onSelect).toHaveBeenCalledWith('opus', 'anthropic');
  });

  it('fires onTogglePin with the row key when the pin affordance is clicked', () => {
    const onTogglePin = vi.fn();
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={onTogglePin} onManage={noop} />);
    fireEvent.click(screen.getByLabelText('Unpin Opus 4.8'));
    expect(onTogglePin).toHaveBeenCalledWith('anthropic:opus');
  });

  it('replaces zones with grouped search results when typing', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    // "opus" matches only the pinned Opus row (one hit across the flat catalog).
    fireEvent.change(screen.getByPlaceholderText('Search models…'), { target: { value: 'opus' } });
    expect(screen.getByText('1 result')).toBeInTheDocument();
    // pinned/recommended section labels are gone in search view
    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
    expect(screen.getByText('Opus 4.8')).toBeInTheDocument();
  });

  it('finds the Flux hero in search (it lives outside the zone list)', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    fireEvent.change(screen.getByPlaceholderText('Search models…'), { target: { value: 'flux' } });
    // Previously the hero was excluded from the searchable set → "0 results".
    expect(screen.getByText('1 result')).toBeInTheDocument();
    // "Flux Auto" now appears as the always-visible hero AND the search hit.
    expect(screen.getAllByText('Flux Auto').length).toBeGreaterThanOrEqual(2);
  });

  it('shows a no-match empty state when search yields nothing', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    fireEvent.change(screen.getByPlaceholderText('Search models…'), { target: { value: 'zzzzz' } });
    expect(screen.getByText('No models match “zzzzz”.')).toBeInTheDocument();
  });

  it('reveals moreZones when "More models" is expanded', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    expect(screen.queryByText('GPT-5.2 mini')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('More models'));
    expect(screen.getByText('GPT-5.2 mini')).toBeInTheDocument();
  });

  it('greys unavailable rows and does not fire onSelect', () => {
    const onSelect = vi.fn();
    const vm: ModelSelectorViewModel = {
      ...baseVm,
      zones: [
        {
          id: 'pinned',
          label: 'Pinned',
          rows: [row({ key: 'd:x', id: 'x', providerId: 'deepseek', label: 'DeepSeek', available: false })],
        },
      ],
    };
    render(<ModelSelectorFlyout vm={vm} onSelect={onSelect} onTogglePin={noop} onManage={noop} />);
    expect(screen.getByText('Currently unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByText('DeepSeek'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the effort sub-row only when effortSupported and onSetEffort given', () => {
    const onSetEffort = vi.fn();
    const { rerender } = render(
      <ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} onSetEffort={onSetEffort} />
    );
    // effortSupported is false in baseVm -> no effort row
    expect(screen.queryByText('Effort')).not.toBeInTheDocument();
    rerender(
      <ModelSelectorFlyout
        vm={{ ...baseVm, effortSupported: true }}
        effort='high'
        onSelect={noop}
        onTogglePin={noop}
        onManage={noop}
        onSetEffort={onSetEffort}
      />
    );
    expect(screen.getByText('Effort')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders the empty card + Connect a provider button when vm.empty', () => {
    const onManage = vi.fn();
    render(
      <ModelSelectorFlyout
        vm={{ fluxHero: undefined, zones: [], moreZones: [], activeKey: null, effortSupported: false, empty: true }}
        onSelect={noop}
        onTogglePin={noop}
        onManage={onManage}
      />
    );
    const btn = screen.getByText('Connect a provider');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onManage).toHaveBeenCalled();
  });

  it('fires onManage from the footer', () => {
    const onManage = vi.fn();
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={onManage} />);
    fireEvent.click(screen.getByText('Manage models'));
    expect(onManage).toHaveBeenCalled();
  });

  // #335 interim: the optional notice banner (Claude-Code subscription explainer).
  const NOTICE = 'Claude Code already runs on your Claude subscription';

  it('renders the notice banner above the model list when notice is provided', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} notice={NOTICE} />);
    expect(screen.getByRole('note')).toHaveTextContent(NOTICE);
  });

  it('renders the notice in the empty state too', () => {
    render(
      <ModelSelectorFlyout
        vm={{ fluxHero: undefined, zones: [], moreZones: [], activeKey: null, effortSupported: false, empty: true }}
        onSelect={noop}
        onTogglePin={noop}
        onManage={noop}
        notice={NOTICE}
      />
    );
    expect(screen.getByRole('note')).toHaveTextContent(NOTICE);
    // Still shows the empty-state CTA alongside the notice.
    expect(screen.getByText('Connect a provider')).toBeInTheDocument();
  });

  it('renders no notice banner when notice is absent', () => {
    render(<ModelSelectorFlyout vm={baseVm} onSelect={noop} onTogglePin={noop} onManage={noop} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
