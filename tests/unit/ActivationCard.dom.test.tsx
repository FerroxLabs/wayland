/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

import ActivationCard from '@renderer/components/activation/ActivationCard';

function setup(over: Partial<React.ComponentProps<typeof ActivationCard>> = {}) {
  const props = {
    onConnectFlux: vi.fn(),
    onUseOwnKey: vi.fn(),
    onUseClaudeCode: vi.fn(),
    onPathSelected: vi.fn(),
    ...over,
  };
  render(<ActivationCard {...props} />);
  return props;
}

describe('ActivationCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all three activation paths', () => {
    setup();
    expect(screen.getByTestId('activation-path-flux')).toBeInTheDocument();
    expect(screen.getByTestId('activation-path-own-key')).toBeInTheDocument();
    expect(screen.getByTestId('activation-path-claude-code')).toBeInTheDocument();
  });

  it('renders the Flux path first (visually primary)', () => {
    setup();
    const paths = screen.getAllByRole('listitem');
    expect(paths[0]).toHaveAttribute('data-testid', 'activation-path-flux');
  });

  it('exposes an accessible region with a label', () => {
    setup();
    const region = screen.getByRole('region', { name: /conversation.activation.title/i });
    expect(region).toBeInTheDocument();
  });

  it('fires onConnectFlux and onPathSelected("flux") when the Flux path is clicked', () => {
    const props = setup();
    const row = screen.getByTestId('activation-path-flux');
    fireEvent.click(within(row).getByRole('button'));
    expect(props.onConnectFlux).toHaveBeenCalledTimes(1);
    expect(props.onPathSelected).toHaveBeenCalledWith('flux');
  });

  it('fires onUseOwnKey and onPathSelected("own-key") when the own-key path is clicked', () => {
    const props = setup();
    const row = screen.getByTestId('activation-path-own-key');
    fireEvent.click(within(row).getByRole('button'));
    expect(props.onUseOwnKey).toHaveBeenCalledTimes(1);
    expect(props.onPathSelected).toHaveBeenCalledWith('own-key');
  });

  it('fires onUseClaudeCode and onPathSelected("claude-code") when the Claude Code path is clicked', () => {
    const props = setup();
    const row = screen.getByTestId('activation-path-claude-code');
    fireEvent.click(within(row).getByRole('button'));
    expect(props.onUseClaudeCode).toHaveBeenCalledTimes(1);
    expect(props.onPathSelected).toHaveBeenCalledWith('claude-code');
  });

  it('defaults to the connect headline, the only copy allowed to claim no provider', () => {
    setup();
    const card = screen.getByTestId('activation-card');
    expect(card).toHaveAttribute('data-variant', 'connect');
    expect(card.textContent).toContain('conversation.activation.title');
    expect(card.textContent).toContain('conversation.activation.subtitle');
  });

  it('never tells a provisioned user to connect a provider in the repair variant', () => {
    setup({ variant: 'repair' });
    const card = screen.getByTestId('activation-card');
    expect(card).toHaveAttribute('data-variant', 'repair');
    expect(card.textContent).toContain('conversation.activation.unusableTitle');
    expect(card.textContent).toContain('conversation.activation.unusableSubtitle');
    expect(card.textContent).not.toContain('conversation.activation.title');
    expect(card.textContent).not.toContain('conversation.activation.subtitle');
  });

  it('keeps all three remedy paths in the repair variant', () => {
    setup({ variant: 'repair' });
    expect(screen.getByTestId('activation-path-flux')).toBeInTheDocument();
    expect(screen.getByTestId('activation-path-own-key')).toBeInTheDocument();
    expect(screen.getByTestId('activation-path-claude-code')).toBeInTheDocument();
  });

  it('does not require onPathSelected (optional telemetry hook)', () => {
    const onConnectFlux = vi.fn();
    render(<ActivationCard onConnectFlux={onConnectFlux} onUseOwnKey={vi.fn()} onUseClaudeCode={vi.fn()} />);
    const row = screen.getByTestId('activation-path-flux');
    expect(() => fireEvent.click(within(row).getByRole('button'))).not.toThrow();
    expect(onConnectFlux).toHaveBeenCalledTimes(1);
  });
});
