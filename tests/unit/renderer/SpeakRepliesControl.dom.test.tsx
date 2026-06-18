// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SpeakRepliesControl } from '@/renderer/pages/conversation/components/SpeakRepliesControl';

describe('SpeakRepliesControl', () => {
  it('shows the effective state and cycles on click', () => {
    const onCycle = vi.fn();
    const { getByRole } = render(
      <SpeakRepliesControl override='inherit' systemDefault={false} onCycle={onCycle} />,
    );
    fireEvent.click(getByRole('button'));
    expect(onCycle).toHaveBeenCalledTimes(1);
  });

  it('reflects on/off in its aria-label', () => {
    const { getByRole, rerender } = render(
      <SpeakRepliesControl override='on' systemDefault={false} onCycle={() => {}} />,
    );
    expect(getByRole('button').getAttribute('aria-label')).toMatch(/on/i);
    rerender(<SpeakRepliesControl override='off' systemDefault={true} onCycle={() => {}} />);
    expect(getByRole('button').getAttribute('aria-label')).toMatch(/off/i);
  });
});
