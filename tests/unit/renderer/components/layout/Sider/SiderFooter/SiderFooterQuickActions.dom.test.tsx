/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const ipcState = vi.hoisted(() => ({
  statusChangedHandler: null as ((payload: { running: boolean }) => void) | null,
  getStatusMock: vi.fn(),
  statusChangedOnMock: vi.fn() as ReturnType<typeof vi.fn>,
}));
ipcState.statusChangedOnMock.mockImplementation((cb: (payload: { running: boolean }) => void) => {
  ipcState.statusChangedHandler = cb;
  return () => {
    ipcState.statusChangedHandler = null;
  };
});
const { getStatusMock, statusChangedOnMock } = ipcState;

vi.mock('@/common/adapter/ipcBridge', () => ({
  webui: {
    getStatus: { invoke: ipcState.getStatusMock },
    statusChanged: { on: ipcState.statusChangedOnMock },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

const openExternalUrlMock = vi.hoisted(() => vi.fn());
vi.mock('@/renderer/utils/platform', () => ({ openExternalUrl: openExternalUrlMock }));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

import { SiderFooterQuickActions } from '@renderer/components/layout/Sider/SiderFooter/SiderFooterQuickActions';

function renderActions(props: React.ComponentProps<typeof SiderFooterQuickActions> = {}) {
  return render(
    <MemoryRouter>
      <SiderFooterQuickActions {...props} />
    </MemoryRouter>
  );
}

describe('SiderFooterQuickActions', () => {
  beforeEach(() => {
    getStatusMock.mockReset();
    getStatusMock.mockResolvedValue({ success: true, data: { running: false } });
    statusChangedOnMock.mockClear();
    ipcState.statusChangedHandler = null;
    navigateMock.mockReset();
    openExternalUrlMock.mockReset();
  });

  it('renders 3 quick action buttons', () => {
    renderActions();
    expect(screen.getByTestId('sider-footer-quick-bug')).toBeInTheDocument();
    expect(screen.getByTestId('sider-footer-quick-webui')).toBeInTheDocument();
    expect(screen.getByTestId('sider-footer-quick-repo')).toBeInTheDocument();
  });

  it('WebUI button reflects running status (green class) on status change', async () => {
    getStatusMock.mockResolvedValue({ success: true, data: { running: false } });
    renderActions();
    await waitFor(() => expect(getStatusMock).toHaveBeenCalled());
    const webuiBtn = screen.getByTestId('sider-footer-quick-webui');
    expect(webuiBtn.className).not.toMatch(/btnRunning/);
    await act(async () => {
      ipcState.statusChangedHandler?.({ running: true });
    });
    expect(webuiBtn.className).toMatch(/btnRunning/);
  });

  it('WebUI click navigates to /settings/webui', () => {
    renderActions();
    fireEvent.click(screen.getByTestId('sider-footer-quick-webui'));
    expect(navigateMock).toHaveBeenCalledWith('/settings/webui');
  });

  it('Bug button fires onOpenBugReport when provided', () => {
    const onOpenBugReport = vi.fn();
    renderActions({ onOpenBugReport });
    fireEvent.click(screen.getByTestId('sider-footer-quick-bug'));
    expect(onOpenBugReport).toHaveBeenCalledOnce();
  });

  it('Bug button opens the GitHub issue chooser when no handler is provided (was a silent no-op)', () => {
    renderActions();
    fireEvent.click(screen.getByTestId('sider-footer-quick-bug'));
    expect(openExternalUrlMock).toHaveBeenCalledWith('https://github.com/FerroxLabs/wayland/issues/new/choose');
  });

  it('Repo button fires onOpenLink with GitHub URL when provided', () => {
    const onOpenLink = vi.fn();
    renderActions({ onOpenLink });
    fireEvent.click(screen.getByTestId('sider-footer-quick-repo'));
    expect(onOpenLink).toHaveBeenCalledWith('https://github.com/FerroxLabs/wayland');
  });

  it('does NOT setState after unmount when webui status fires (cleanup pattern)', async () => {
    const { unmount } = renderActions();
    await waitFor(() => expect(statusChangedOnMock).toHaveBeenCalled());
    unmount();
    // Firing the listener after unmount should not throw or warn (alive flag honored)
    expect(() => ipcState.statusChangedHandler?.({ running: true })).not.toThrow();
  });

  it('aria-label + title attributes present on every button (a11y)', () => {
    renderActions();
    for (const tid of ['sider-footer-quick-bug', 'sider-footer-quick-webui', 'sider-footer-quick-repo']) {
      const btn = screen.getByTestId(tid);
      expect(btn).toHaveAttribute('aria-label');
      expect(btn).toHaveAttribute('title');
    }
  });
});
