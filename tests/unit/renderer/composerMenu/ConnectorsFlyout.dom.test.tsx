// @vitest-environment jsdom

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #348 — the count-vs-cap nudge in the composer Connectors flyout. Shows when a
 * model cap is known and the live tool count is near/over it; stays silent
 * otherwise (no cap, or comfortably under).
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IMcpServer } from '@/common/config/storage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, opts?: { defaultValue?: string } & Record<string, unknown>) => {
      let s = opts?.defaultValue ?? _k;
      if (opts)
        for (const [k, v] of Object.entries(opts))
          if (k !== 'defaultValue') s = s.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      return s;
    },
  }),
}));

import ConnectorsFlyout from '@renderer/pages/conversation/components/composerMenu/ConnectorsFlyout';

const srv = (tools: number, over: Partial<IMcpServer> = {}): IMcpServer =>
  ({
    id: `s${tools}-${Math.round(tools)}`,
    name: 'svc',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'x', args: [] },
    tools: Array.from({ length: tools }, (_, i) => ({ name: `t${i}` })),
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

const noop = () => {};

function renderFlyout(props: Partial<React.ComponentProps<typeof ConnectorsFlyout>>) {
  return render(
    <ConnectorsFlyout servers={[]} onToggle={noop} onAddConnector={noop} onManageConnectors={noop} {...props} />
  );
}

afterEach(() => cleanup());

describe('ConnectorsFlyout count-vs-cap nudge (#348)', () => {
  it('shows an over-limit nudge naming the model + cap when tools exceed the cap', () => {
    renderFlyout({ servers: [srv(130)], modelCap: 128, modelLabel: 'gpt-5' });
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('130 tools enabled');
    expect(note).toHaveTextContent('gpt-5 caps at 128');
  });

  it('shows a near-limit nudge when within the top 15% of headroom', () => {
    renderFlyout({ servers: [srv(120)], modelCap: 128, modelLabel: 'gpt-5' });
    expect(screen.getByRole('status')).toHaveTextContent('120 of 128 tools');
  });

  it('stays silent when comfortably under the cap', () => {
    renderFlyout({ servers: [srv(10)], modelCap: 128, modelLabel: 'gpt-5' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays silent when no model cap is known (staged composer / uncapped model)', () => {
    renderFlyout({ servers: [srv(130)] });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('falls back to "this model" when over the cap with no model label', () => {
    renderFlyout({ servers: [srv(130)], modelCap: 128 });
    expect(screen.getByRole('status')).toHaveTextContent('this model caps at 128');
  });

  it('counts allowedTools scoping, not the raw tool list', () => {
    // 200 raw tools but scoped to 5 → under the cap → silent.
    renderFlyout({
      servers: [srv(200, { allowedTools: ['a', 'b', 'c', 'd', 'e'] })],
      modelCap: 128,
      modelLabel: 'gpt-5',
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('ConnectorsFlyout per-conversation scoping (#348)', () => {
  const a = srv(1, { id: 'a', name: 'alpha' });
  const b = srv(1, { id: 'b', name: 'beta' });

  it('in live mode (onScopeChange) all enabled servers show as active by default', () => {
    renderFlyout({ servers: [a, b], onScopeChange: noop, activeServerIds: undefined });
    expect(screen.getByText('Active in this chat')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'alpha' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('switch', { name: 'beta' }).getAttribute('aria-checked')).toBe('true');
  });

  it('toggling one off from "all" materializes the rest (writes the explicit set)', () => {
    const onScopeChange = vi.fn();
    renderFlyout({ servers: [a, b], onScopeChange, activeServerIds: undefined });
    fireEvent.click(screen.getByRole('switch', { name: 'alpha' }));
    expect(onScopeChange).toHaveBeenCalledWith(['b']);
  });

  it('reflects an explicit selection and toggles the missing one back to "all" (undefined)', () => {
    const onScopeChange = vi.fn();
    renderFlyout({ servers: [a, b], onScopeChange, activeServerIds: ['b'] });
    expect(screen.getByRole('switch', { name: 'alpha' }).getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('switch', { name: 'alpha' }));
    expect(onScopeChange).toHaveBeenCalledWith(undefined);
  });

  it('excludes globally-disabled servers from the per-chat candidate list', () => {
    renderFlyout({ servers: [a, srv(1, { id: 'c', name: 'gamma', enabled: false })], onScopeChange: noop });
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.queryByText('gamma')).not.toBeInTheDocument();
  });

  it('falls back to the global toggle in staged mode (no onScopeChange)', () => {
    const onToggle = vi.fn();
    renderFlyout({ servers: [a], onToggle });
    expect(screen.getByText('Connected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'alpha' }));
    expect(onToggle).toHaveBeenCalledWith('a', false);
  });
});
