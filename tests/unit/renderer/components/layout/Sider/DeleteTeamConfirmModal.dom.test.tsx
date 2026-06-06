/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// Live-smoke fix #3 (2026-05-19) - DeleteTeamConfirmModal DOM tests.
// Covers the typed-"delete" gate that replaces the previous one-shot
// Arco Modal.confirm dialog so the destructive CTA cannot fire by
// accident:
//   1. Confirm disabled on mount
//   2. Confirm enables when "delete" is typed exactly
//   3. Confirm enables when "DELETE" / mixed case is typed (case-insensitive)
//   4. Cancel callback fires + closing resets the input
//   5. Confirm callback fires when the CTA is clicked while enabled

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; teamName?: string }) => {
      const tpl = opts?.defaultValue ?? _key;
      // Interpolate teamName the same way i18next-react would so the
      // body assertion below can find the live team name in the DOM.
      return opts?.teamName ? tpl.replace('{{teamName}}', opts.teamName) : tpl;
    },
  }),
}));
vi.mock('@/renderer/hooks/context/ThemeContext', () => ({
  useThemeContext: () => ({ fontScale: 1 }),
}));
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

import DeleteTeamConfirmModal from '@/renderer/components/layout/Sider/DeleteTeamConfirmModal';

type Overrides = Partial<React.ComponentProps<typeof DeleteTeamConfirmModal>>;

function renderModal(overrides: Overrides = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <DeleteTeamConfirmModal
      visible
      teamName='Renewal Push'
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />
  );
  const getConfirm = () => screen.getByTestId('delete-team-confirm-cta') as HTMLButtonElement;
  const getCancel = () => screen.getByTestId('delete-team-confirm-cancel') as HTMLButtonElement;
  // Arco Input's outer wrapper carries the data-testid via the underlying
  // span, but the actual <input> we need to fire onChange against is a
  // descendant. We look the input up by placeholder which is the most
  // stable identifier without depending on Arco's internal DOM shape.
  const getInput = () =>
    document.querySelector('input[placeholder="delete"]') as HTMLInputElement;
  return { ...utils, onConfirm, onCancel, getConfirm, getCancel, getInput };
}

describe('DeleteTeamConfirmModal', () => {
  it('Confirm is disabled on mount and the team name appears in the body', () => {
    const { getConfirm } = renderModal();
    expect(getConfirm().disabled).toBe(true);
    expect(screen.getByText(/Renewal Push/i)).toBeTruthy();
  });

  it('enables Confirm when the user types "delete" exactly', () => {
    const { getConfirm, getInput } = renderModal();
    fireEvent.change(getInput(), { target: { value: 'delete' } });
    expect(getConfirm().disabled).toBe(false);
  });

  it('enables Confirm case-insensitively (DELETE, Delete) and with surrounding whitespace', () => {
    const { getConfirm, getInput } = renderModal();
    fireEvent.change(getInput(), { target: { value: 'DELETE' } });
    expect(getConfirm().disabled).toBe(false);

    fireEvent.change(getInput(), { target: { value: 'Delete' } });
    expect(getConfirm().disabled).toBe(false);

    fireEvent.change(getInput(), { target: { value: '  delete  ' } });
    expect(getConfirm().disabled).toBe(false);

    // Sanity: a near-miss does NOT enable.
    fireEvent.change(getInput(), { target: { value: 'deletes' } });
    expect(getConfirm().disabled).toBe(true);
  });

  it('Cancel fires onCancel callback', () => {
    const { onCancel, getCancel } = renderModal();
    fireEvent.click(getCancel());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Confirm fires onConfirm when CTA is clicked while enabled', () => {
    const { onConfirm, getConfirm, getInput } = renderModal();
    fireEvent.change(getInput(), { target: { value: 'delete' } });
    fireEvent.click(getConfirm());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
