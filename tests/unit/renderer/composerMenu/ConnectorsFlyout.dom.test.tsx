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
import { cleanup, render, screen } from '@testing-library/react';
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
