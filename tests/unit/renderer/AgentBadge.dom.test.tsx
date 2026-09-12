/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

/**
 * Regression test for #909: the chat header pill (AgentBadge) shows the
 * assistant name but hides the runtime ("Fuigo"), even though the
 * runtime is already threaded to the badge. The pill must surface BOTH the
 * assistant and the runtime when they differ, and exactly ONE label when they
 * are the same (a raw engine chat), never "Fuigo" twice.
 *
 * a11y note (plan warning W1): the badge's clickable element is a role-less
 * <div>; adding aria-label to it would trip axe's aria-prohibited-attr rule.
 * The runtime is conveyed via the VISIBLE secondary span, whose text content
 * already reaches a screen reader as part of the badge's accessible text.
 */

import AgentBadge from '../../../src/renderer/components/agent/AgentBadge';
import { resolveRuntimeName } from '../../../src/renderer/pages/conversation/components/ChatLayout/runtimeName';

const renderBadge = (props: React.ComponentProps<typeof AgentBadge>) =>
  render(
    <MemoryRouter>
      <AgentBadge {...props} />
    </MemoryRouter>
  );

describe('AgentBadge runtime label (#909)', () => {
  it('renders both the assistant and the runtime when they differ', () => {
    renderBadge({ backend: 'fuigo', agentName: 'Concierge', runtimeName: 'Fuigo' });

    const badge = screen.getByTestId('agent-badge');
    expect(within(badge).getByText('Concierge')).toBeInTheDocument();

    const runtime = within(badge).getByTestId('agent-badge-runtime');
    expect(runtime).toBeInTheDocument();
    expect(runtime).toHaveTextContent('Fuigo');
  });

  it('renders exactly one label when the assistant equals the runtime (case-insensitive)', () => {
    renderBadge({ backend: 'fuigo', agentName: 'Fuigo', runtimeName: 'fuigo' });

    const badge = screen.getByTestId('agent-badge');
    // No secondary runtime span - it must never read the runtime twice.
    expect(within(badge).queryByTestId('agent-badge-runtime')).not.toBeInTheDocument();
    // "Fuigo" appears exactly once across the badge's accessible text.
    expect(within(badge).getAllByText(/Fuigo/i)).toHaveLength(1);
  });

  it('accessible text conveys both the assistant and the runtime when they differ', () => {
    renderBadge({ backend: 'fuigo', agentName: 'Concierge', runtimeName: 'Fuigo' });

    // A screen reader reads the role-less div by its text content; both names
    // must be present in that accessible text.
    const badge = screen.getByTestId('agent-badge');
    expect(badge).toHaveTextContent('Concierge');
    expect(badge).toHaveTextContent('Fuigo');
  });

  it('accessible text names just the assistant when no runtime is provided', () => {
    renderBadge({ backend: 'fuigo', agentName: 'Concierge' });

    const badge = screen.getByTestId('agent-badge');
    expect(badge).toHaveTextContent('Concierge');
    expect(within(badge).queryByTestId('agent-badge-runtime')).not.toBeInTheDocument();
  });

  it('does not render a runtime label for a raw/unknown backend id', () => {
    // A backend not in the friendly maps yields no runtimeName (ChatLayout passes
    // undefined), so the badge must not leak "Assistant · gemini".
    renderBadge({ backend: 'gemini', agentName: 'Assistant', runtimeName: resolveRuntimeName('gemini') });

    const badge = screen.getByTestId('agent-badge');
    expect(within(badge).queryByTestId('agent-badge-runtime')).not.toBeInTheDocument();
    expect(badge).not.toHaveTextContent('gemini');
  });
});

describe('resolveRuntimeName (#909 xaudit finding 2)', () => {
  it('resolves known backends to their friendly name', () => {
    expect(resolveRuntimeName('fuigo')).toBe('Fuigo');
    expect(resolveRuntimeName('claude')).toBe('Claude Code');
  });

  it('returns undefined for raw/unknown backends instead of leaking the id', () => {
    expect(resolveRuntimeName('gemini')).toBeUndefined();
    expect(resolveRuntimeName('totally-unknown-backend')).toBeUndefined();
    expect(resolveRuntimeName(undefined)).toBeUndefined();
    expect(resolveRuntimeName('')).toBeUndefined();
  });
});
