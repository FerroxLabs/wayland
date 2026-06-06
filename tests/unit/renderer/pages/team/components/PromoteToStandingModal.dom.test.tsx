/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// W3b - PromoteToStandingModal DOM tests. Covers:
//   - Renders title + description + 2 checkboxes + 2 buttons
//   - Confirm is disabled until BOTH checkboxes are checked
//   - Confirm fires onConfirm callback; Cancel fires onCancel

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));
vi.mock('@/renderer/hooks/context/ThemeContext', () => ({
  useThemeContext: () => ({ fontScale: 1 }),
}));
// Arco Message tries to render a toast via ReactDOM which is not available in
// jsdom - stub it out the same way TeamRightRail.dom.test does.
vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

import PromoteToStandingModal from '@/renderer/pages/team/components/PromoteToStandingModal';

const renderModal = (overrides: Partial<React.ComponentProps<typeof PromoteToStandingModal>> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const props = {
    visible: true,
    teamName: 'Renewal Push',
    onConfirm,
    onCancel,
    ...overrides,
  } as React.ComponentProps<typeof PromoteToStandingModal>;
  render(<PromoteToStandingModal {...props} />);
  return { onConfirm, onCancel };
};

describe('PromoteToStandingModal', () => {
  it('renders title, description, both checkboxes, and confirm + cancel buttons', () => {
    renderModal();
    // Header title
    expect(screen.getByText('Promote to Standing Company')).toBeTruthy();
    // Description
    expect(
      screen.getByText(/Standing Companies persist across sessions/i)
    ).toBeTruthy();
    // Team name displayed
    expect(screen.getByTestId('promote-to-standing-team-name').textContent).toBe('Renewal Push');
    // Both opt-in checkboxes present
    expect(screen.getByTestId('promote-to-standing-opt-in-1')).toBeTruthy();
    expect(screen.getByTestId('promote-to-standing-opt-in-2')).toBeTruthy();
    // Buttons present
    expect(screen.getByTestId('promote-to-standing-confirm')).toBeTruthy();
    expect(screen.getByTestId('promote-to-standing-cancel')).toBeTruthy();
  });

  it('disables Confirm until BOTH checkboxes are checked', () => {
    renderModal();
    const confirm = screen.getByTestId('promote-to-standing-confirm') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    // Check the first checkbox - confirm should still be disabled.
    const cb1 = screen
      .getByTestId('promote-to-standing-opt-in-1')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(cb1);
    expect(confirm.disabled).toBe(true);

    // Check the second - confirm becomes enabled.
    const cb2 = screen
      .getByTestId('promote-to-standing-opt-in-2')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(cb2);
    expect(confirm.disabled).toBe(false);
  });

  it('fires onConfirm when Confirm is clicked after both boxes are checked', () => {
    const { onConfirm } = renderModal();
    const cb1 = screen
      .getByTestId('promote-to-standing-opt-in-1')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    const cb2 = screen
      .getByTestId('promote-to-standing-opt-in-2')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(cb1);
    fireEvent.click(cb2);

    fireEvent.click(screen.getByTestId('promote-to-standing-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel when Cancel is clicked', () => {
    const { onCancel } = renderModal();
    fireEvent.click(screen.getByTestId('promote-to-standing-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
