// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MicModeControl } from '@/renderer/pages/conversation/components/MicModeControl';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('MicModeControl', () => {
  it('renders and calls onToggle on click', () => {
    const onToggle = vi.fn();
    render(<MicModeControl active={false} onToggle={onToggle} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('aria-label reflects the inactive state', () => {
    render(<MicModeControl active={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Start voice call' })).toBeTruthy();
  });

  it('aria-label reflects the active state', () => {
    render(<MicModeControl active onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'End voice call' })).toBeTruthy();
  });
});
