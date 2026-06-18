// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OpenVoiceOverlay } from '@/renderer/pages/conversation/components/OpenVoiceOverlay';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; seconds?: string }) => {
      const raw = options?.defaultValue ?? _key;
      return options?.seconds !== undefined ? raw.replace('{{seconds}}', options.seconds) : raw;
    },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
}));

describe('OpenVoiceOverlay', () => {
  it('renders the silenceMs readout and noise-gate state', () => {
    render(<OpenVoiceOverlay phase='listening' level={0} silenceMs={1200} onEnd={vi.fn()} />);
    expect(screen.getByText(/Waits 1\.2s/)).toBeTruthy();
    expect(screen.getByText(/Noise gate: auto/)).toBeTruthy();
  });

  it('reflects a widened noise gate when sensitivityBias is high', () => {
    render(<OpenVoiceOverlay phase='listening' level={0} silenceMs={1200} sensitivityBias={0.1} onEnd={vi.fn()} />);
    expect(screen.getByText(/Noise gate: high/)).toBeTruthy();
  });

  it('shows the current phase', () => {
    render(<OpenVoiceOverlay phase='capturing' level={0.5} silenceMs={1000} onEnd={vi.fn()} />);
    expect(screen.getByText('Listening...')).toBeTruthy();
  });

  it('End button calls onEnd', () => {
    const onEnd = vi.fn();
    render(<OpenVoiceOverlay phase='listening' level={0} silenceMs={1000} onEnd={onEnd} />);
    fireEvent.click(screen.getByText('End call'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
