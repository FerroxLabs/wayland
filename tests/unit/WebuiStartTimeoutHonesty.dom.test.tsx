/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression test for B4 bug S18: when `webui.start` did not resolve within the
 * 3s race window the start result was `null`, and the handler unconditionally
 * set `running: true`, persisted `enabled=true`, and showed a success toast -
 * even though the server was never confirmed up. After the fix the handler
 * re-checks `webui.getStatus`; only when the server is actually running does it
 * persist + show success, otherwise it shows an honest error and does NOT
 * persist enabled=true.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | { defaultValue?: string }) => {
      if (typeof opts === 'string') return opts;
      if (opts && typeof opts === 'object' && opts.defaultValue) return opts.defaultValue;
      return key;
    },
    i18n: { language: 'en-US' },
  }),
}));

// Lightweight Arco stubs - the real responsive observer + Form context add
// noise we don't need. We only care about the Switch toggle and the Message
// singleton here. Defined inside the factory because vi.mock is hoisted.
vi.mock('@arco-design/web-react', () => {
  const Form = Object.assign(
    ({ children }: { children?: React.ReactNode }) => <form>{children}</form>,
    {
      useForm: () => [{ getFieldsValue: () => ({}), resetFields: vi.fn(), validate: vi.fn() }],
      Item: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    }
  );
  return {
    Message: { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => vi.fn()) },
    Form,
    Switch: ({ checked, onChange }: { checked?: boolean; onChange?: (v: boolean) => void }) => (
      <button role='switch' aria-checked={checked} onClick={() => onChange?.(!checked)}>
        switch
      </button>
    ),
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button onClick={onClick}>{children}</button>
    ),
    Input: Object.assign(
      ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
        <input value={value} onChange={(e) => onChange?.(e.target.value)} />
      ),
      {
        Password: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
          <input type='password' value={value} onChange={(e) => onChange?.(e.target.value)} />
        ),
      }
    ),
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

const mockStart = vi.fn();
const mockGetStatus = vi.fn();
const mockStop = vi.fn().mockResolvedValue({ success: true });
const mockShellOpen = vi.fn();

vi.mock('@/common/adapter/ipcBridge', () => ({
  webui: {
    start: { invoke: (...a: unknown[]) => mockStart(...a) },
    stop: { invoke: (...a: unknown[]) => mockStop(...a) },
    getStatus: { invoke: (...a: unknown[]) => mockGetStatus(...a) },
    generateQRToken: { invoke: vi.fn().mockResolvedValue({ success: false }) },
    statusChanged: { on: vi.fn(() => () => {}) },
    resetPasswordResult: { on: vi.fn(() => () => {}) },
  },
  shell: { openExternal: { invoke: (...a: unknown[]) => mockShellOpen(...a) } },
}));

const mockConfigSet = vi.fn().mockResolvedValue(undefined);
const mockConfigGet = vi.fn().mockResolvedValue(false);
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    set: (...a: unknown[]) => mockConfigSet(...a),
    get: (...a: unknown[]) => mockConfigGet(...a),
  },
}));

// Heavy / environment-specific deps stubbed out.
vi.mock('@/renderer/components/base/WaylandModal', () => ({ default: () => null }));
vi.mock('@/renderer/components/base/WaylandScrollArea', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/renderer/components/settings/SettingsModal/settingsViewContext', () => ({
  useSettingsViewMode: () => 'modal',
}));
vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));
vi.mock('@/renderer/services/UsernameService', () => ({ changeUsernameHttp: vi.fn() }));
vi.mock('@process/webserver/middleware/csrfClient', () => ({ withCsrfToken: (h: unknown) => h }));

import { Message } from '@arco-design/web-react';
import WebuiModalContent from '@renderer/components/settings/SettingsModal/contents/WebuiModalContent';

describe('WebUI start timeout honesty (S18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigGet.mockResolvedValue(false);
    // Initial load: server not running.
    mockGetStatus.mockResolvedValue({ success: true, data: { running: false, adminUsername: 'admin' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an error and does NOT persist enabled=true when start times out and server is not up', async () => {
    // start never resolves -> the 3s race wins with null.
    mockStart.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<WebuiModalContent />);
      // Let the initial loadStatus settle.
      await Promise.resolve();
      await Promise.resolve();
    });

    // After the initial load, the re-check (post-timeout) must report not-running.
    mockGetStatus.mockResolvedValue({ success: true, data: { running: false, adminUsername: 'admin' } });

    // The first switch is the WebUI enable toggle (the allow-remote switch follows).
    const toggle = screen.getAllByRole('switch')[0];

    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(toggle);
      // Advance past the 3s start race + the 1.5s status re-check race.
      await vi.advanceTimersByTimeAsync(5000);
    });
    vi.useRealTimers();
    // Flush the trailing microtasks from the status re-check.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(Message.error).toHaveBeenCalledWith('settings.webui.operationFailed');
    expect(Message.success).not.toHaveBeenCalled();
    // The critical invariant: enabled=true was NOT persisted on a phantom start.
    expect(mockConfigSet).not.toHaveBeenCalledWith('webui.desktop.enabled', true);
  });
});
