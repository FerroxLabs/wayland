/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for PromotionThresholdModal.
 *
 * Covers:
 *   - Initial render (modal visible, threshold value, toggle state).
 *   - Slider change updates displayed threshold value.
 *   - Toggle change updates autoPromote state.
 *   - Save button calls setPromotionThreshold + setAutoPromoteEnabled + closes modal.
 *   - Cancel button closes without saving.
 *   - Score formula disclosure toggles on click.
 *   - Candidate hint text reflects count.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

// ===== Mocks =====
// Use vi.fn() directly inside the factory to avoid hoisting reference errors.

vi.mock('@/common', () => {
  const getPromotionCandidates = vi.fn();
  const setPromotionThreshold = vi.fn();
  const setAutoPromoteEnabled = vi.fn();
  return {
    ipcBridge: {
      memory: {
        getPromotionCandidates: { invoke: getPromotionCandidates },
        setPromotionThreshold: { invoke: setPromotionThreshold },
        setAutoPromoteEnabled: { invoke: setAutoPromoteEnabled },
      },
    },
  };
});

vi.mock('@arco-design/web-react', () => ({
  Modal: ({
    visible,
    title,
    children,
    onCancel,
    footer: _footer,
    className,
    ...rest
  }: {
    visible: boolean;
    title: string;
    children: React.ReactNode;
    onCancel: () => void;
    footer: null;
    className?: string;
    [key: string]: unknown;
  }) =>
    visible ? (
      <div
        role='dialog'
        aria-label={title}
        className={className ?? ''}
        {...rest}
      >
        {children}
      </div>
    ) : null,

  Slider: ({
    value,
    min,
    max,
    onChange,
    ...rest
  }: {
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    [key: string]: unknown;
  }) => (
    <input
      type='range'
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
    />
  ),

  Switch: ({
    checked,
    onChange,
    ...rest
  }: {
    checked: boolean;
    onChange: (b: boolean) => void;
    [key: string]: unknown;
  }) => (
    <input
      type='checkbox'
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      {...rest}
    />
  ),

  Button: ({
    children,
    onClick,
    loading,
    type: _type,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    type?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      disabled={loading === true}
      {...rest}
    >
      {children}
    </button>
  ),

  Message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ===== Subject (imported AFTER mocks) =====

import PromotionThresholdModal from '@renderer/pages/memory/components/PromotionThresholdModal';
import { ipcBridge } from '@/common';

// ===== Helpers =====

function getIpcMocks() {
  const mem = (ipcBridge as { memory: Record<string, { invoke: Mock }> }).memory;
  return {
    getPromotionCandidates: mem['getPromotionCandidates']!.invoke,
    setPromotionThreshold: mem['setPromotionThreshold']!.invoke,
    setAutoPromoteEnabled: mem['setAutoPromoteEnabled']!.invoke,
  };
}

function defaultCandidates(threshold = 90, count = 3) {
  return {
    candidates: Array.from({ length: count }, (_, i) => ({
      id: `id-${i}`,
      score: 95,
      summary: `Entry ${i}`,
      project: 'proj',
    })),
    threshold,
    lastRun: Date.now(),
    nextRun: Date.now() + 30 * 60 * 1000,
    autoPromoteEnabled: true,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ===== Tests =====

describe('PromotionThresholdModal', () => {
  beforeEach(() => {
    const m = getIpcMocks();
    m.getPromotionCandidates.mockResolvedValue(defaultCandidates(90, 3));
    m.setPromotionThreshold.mockResolvedValue(undefined);
    m.setAutoPromoteEnabled.mockResolvedValue(undefined);
  });

  it('renders the modal', async () => {
    const onClose = vi.fn();
    render(<PromotionThresholdModal onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByTestId('promotion-threshold-modal')).toBeTruthy();
    });
  });

  it('shows threshold value from IPC', async () => {
    getIpcMocks().getPromotionCandidates.mockResolvedValue(defaultCandidates(75, 5));
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('threshold-value').textContent).toBe('75');
    });
  });

  it('updates threshold display when slider changes', async () => {
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => screen.getByTestId('threshold-slider'));
    const slider = screen.getByTestId('threshold-slider');
    fireEvent.change(slider, { target: { value: '60' } });
    expect(screen.getByTestId('threshold-value').textContent).toBe('60');
  });

  it('shows candidate hint text', async () => {
    getIpcMocks().getPromotionCandidates.mockResolvedValue(defaultCandidates(90, 12));
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => {
      const hint = screen.getByTestId('candidate-hint');
      expect(hint.textContent).toContain('candidates');
    });
  });

  it('toggle change updates autoPromote', async () => {
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => screen.getByTestId('auto-promote-switch'));
    const toggle = screen.getByTestId('auto-promote-switch') as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it('save button calls setPromotionThreshold and setAutoPromoteEnabled', async () => {
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => screen.getByTestId('save-btn'));
    fireEvent.click(screen.getByTestId('save-btn'));
    const m = getIpcMocks();
    await waitFor(() => {
      expect(m.setPromotionThreshold).toHaveBeenCalledTimes(1);
      expect(m.setAutoPromoteEnabled).toHaveBeenCalledTimes(1);
    });
  });

  it('save button calls onClose after saving', async () => {
    const onClose = vi.fn();
    render(<PromotionThresholdModal onClose={onClose} />);
    await waitFor(() => screen.getByTestId('save-btn'));
    fireEvent.click(screen.getByTestId('save-btn'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('cancel button calls onClose without saving', async () => {
    const onClose = vi.fn();
    render(<PromotionThresholdModal onClose={onClose} />);
    await waitFor(() => screen.getByTestId('cancel-btn'));
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(getIpcMocks().setPromotionThreshold).not.toHaveBeenCalled();
  });

  it('formula disclosure toggles on click', async () => {
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => screen.getByTestId('formula-disclosure-btn'));
    expect(screen.queryByTestId('score-formula')).toBeNull();
    fireEvent.click(screen.getByTestId('formula-disclosure-btn'));
    expect(screen.getByTestId('score-formula')).toBeTruthy();
    fireEvent.click(screen.getByTestId('formula-disclosure-btn'));
    expect(screen.queryByTestId('score-formula')).toBeNull();
  });

  it('score formula contains all scoring rules', async () => {
    render(<PromotionThresholdModal onClose={vi.fn()} />);
    await waitFor(() => screen.getByTestId('formula-disclosure-btn'));
    fireEvent.click(screen.getByTestId('formula-disclosure-btn'));
    const formula = screen.getByTestId('score-formula').textContent ?? '';
    expect(formula).toContain('+30');
    expect(formula).toContain('decision');
    expect(formula).toContain('+20');
    expect(formula).toContain('architecture');
  });
});
