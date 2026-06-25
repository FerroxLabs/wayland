/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { HomeHintBar } from '@renderer/pages/guid/components/HomeHintBar';
import { formatModifierShortcut } from '@/renderer/utils/platform';

describe('HomeHintBar', () => {
  it('renders 3 kbd hints when chatStartedCount < 5', () => {
    render(<HomeHintBar chatStartedCount={2} />);
    // Assert against the platform helper the component uses (⌘K on macOS,
    // Ctrl+K elsewhere) so the test holds on any CI runner, not just macOS.
    expect(screen.getByText(formatModifierShortcut('K'))).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
    expect(screen.getByText(formatModifierShortcut('N'))).toBeInTheDocument();
  });

  it('renders nothing when chatStartedCount >= 5', () => {
    const { container } = render(<HomeHintBar chatStartedCount={5} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for arbitrary counts >= 5', () => {
    const { container } = render(<HomeHintBar chatStartedCount={42} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders for chatStartedCount = 0 (brand new user)', () => {
    render(<HomeHintBar chatStartedCount={0} />);
    expect(screen.getByTestId('home-hint-bar')).toBeInTheDocument();
  });
});
