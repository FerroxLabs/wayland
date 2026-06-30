/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 CuaPermissionCard - gating + interactions.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockUseCuaPermissions = vi.fn();
vi.mock('@/renderer/hooks/useCuaPermissions', () => ({
  useCuaPermissions: (enabled: boolean) => mockUseCuaPermissions(enabled),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? _k }),
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick, icon, ...rest }: any) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));
vi.mock('@icon-park/react', () => ({
  Check: () => <span />,
  Click: () => <span />,
  Close: () => <span />,
  Monitor: () => <span />,
  Refresh: () => <span />,
  Right: () => <span />,
}));

import CuaPermissionCard from '@/renderer/components/activation/CuaPermissionCard';

const baseHook = (over: Record<string, unknown> = {}) => ({
  status: null,
  checking: false,
  recheck: vi.fn(() => Promise.resolve()),
  openSettings: vi.fn(),
  relaunch: vi.fn(),
  ...over,
});

const status = (over: Record<string, unknown> = {}) => ({
  platform: 'darwin',
  supported: true,
  screenRecording: 'denied',
  accessibility: 'denied',
  allGranted: false,
  ...over,
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CuaPermissionCard (#466)', () => {
  it('renders nothing when the agent has no CUA capability', () => {
    mockUseCuaPermissions.mockReturnValue(baseHook());
    const { container } = render(<CuaPermissionCard active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all grants are present', () => {
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status({ allGranted: true }) }));
    const { container } = render(<CuaPermissionCard active />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on an unsupported OS (non-macOS)', () => {
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status({ supported: false, allGranted: true }) }));
    const { container } = render(<CuaPermissionCard active />);
    expect(container.firstChild).toBeNull();
  });

  it('shows both permission rows when grants are missing', () => {
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status() }));
    render(<CuaPermissionCard active />);
    expect(screen.getByTestId('cua-permission-card')).toBeTruthy();
    expect(screen.getByTestId('cua-open-screen')).toBeTruthy();
    expect(screen.getByTestId('cua-open-accessibility')).toBeTruthy();
  });

  it('deep-links the correct pane on click', () => {
    const openSettings = vi.fn();
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status(), openSettings }));
    render(<CuaPermissionCard active />);
    fireEvent.click(screen.getByTestId('cua-open-screen'));
    expect(openSettings).toHaveBeenCalledWith('screen');
    fireEvent.click(screen.getByTestId('cua-open-accessibility'));
    expect(openSettings).toHaveBeenCalledWith('accessibility');
  });

  it('shows a granted badge (not a button) for an already-granted pane', () => {
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status({ screenRecording: 'granted' }) }));
    render(<CuaPermissionCard active />);
    expect(screen.getByTestId('cua-granted-screen')).toBeTruthy();
    expect(screen.queryByTestId('cua-open-screen')).toBeNull();
    // Accessibility still missing → its button shows.
    expect(screen.getByTestId('cua-open-accessibility')).toBeTruthy();
  });

  it('offers Relaunch + a relaunch note while Screen Recording is not granted (macOS applies it only after relaunch)', () => {
    const relaunch = vi.fn();
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status({ screenRecording: 'denied' }), relaunch }));
    render(<CuaPermissionCard active />);
    expect(screen.getByTestId('cua-relaunch-note')).toBeTruthy();
    fireEvent.click(screen.getByTestId('cua-relaunch'));
    expect(relaunch).toHaveBeenCalledTimes(1);
  });

  it('hides Relaunch once Screen Recording is granted (only Accessibility left)', () => {
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status({ screenRecording: 'granted' }) }));
    render(<CuaPermissionCard active />);
    expect(screen.queryByTestId('cua-relaunch')).toBeNull();
    expect(screen.queryByTestId('cua-relaunch-note')).toBeNull();
  });

  it('re-check triggers a fresh status read', () => {
    const recheck = vi.fn(() => Promise.resolve());
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status(), recheck }));
    render(<CuaPermissionCard active />);
    fireEvent.click(screen.getByTestId('cua-recheck'));
    expect(recheck).toHaveBeenCalledTimes(1);
  });

  it('dismiss fires the onDismiss callback', () => {
    const onDismiss = vi.fn();
    mockUseCuaPermissions.mockReturnValue(baseHook({ status: status() }));
    render(<CuaPermissionCard active onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
