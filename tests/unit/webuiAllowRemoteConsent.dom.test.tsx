/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #722: "Allow Remote Access" was a bare switch. Flipping it binds the WebUI to
 * 0.0.0.0 — reachable by every device on the LAN, login over plaintext HTTP — and
 * it stays armed across restarts. There was no confirmation and no warning; the
 * description even claimed the mode was "secure".
 *
 * Enabling it now requires an explicit confirmation naming what it actually does.
 * Disabling does not: turning the listener off only ever shrinks the exposure, and
 * putting a dialog in front of "make me safer" trains people to click through.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// STABLE identities. A fresh `t` per render changes the identity of the component's
// generateQRCode useCallback, whose effect (running && allowRemote && !qrUrl) then
// re-fires every render — an infinite loop that only shows up when allowRemote is on.
// That is a mock artefact, not a component bug, but it hangs the test for 10s.
const stableT = (key: string) => key;
const stableI18n = { language: 'en-US' };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: stableT, i18n: stableI18n }),
}));

/** Captures the Modal.confirm config so the test can accept or dismiss it. */
const confirmSpy = vi.fn();

vi.mock('@arco-design/web-react', () => {
  const Form = Object.assign(({ children }: { children?: React.ReactNode }) => <form>{children}</form>, {
    useForm: () => [{ getFieldsValue: () => ({}), resetFields: vi.fn(), validate: vi.fn() }],
    Item: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  });
  return {
    Message: { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => vi.fn()) },
    Form,
    Modal: { confirm: (cfg: unknown) => confirmSpy(cfg) },
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

const mockStart = vi.fn().mockResolvedValue({ success: true, data: { running: true, port: 25808 } });
const mockStop = vi.fn().mockResolvedValue({ success: true });
const mockGetStatus = vi.fn();

vi.mock('@/common/adapter/ipcBridge', () => ({
  webui: {
    start: { invoke: (...a: unknown[]) => mockStart(...a) },
    stop: { invoke: (...a: unknown[]) => mockStop(...a) },
    getStatus: { invoke: (...a: unknown[]) => mockGetStatus(...a) },
    generateQRToken: { invoke: vi.fn().mockResolvedValue({ success: false }) },
    statusChanged: { on: vi.fn(() => () => {}) },
    resetPasswordResult: { on: vi.fn(() => () => {}) },
  },
  shell: { openExternal: { invoke: vi.fn() } },
}));

const mockConfigSet = vi.fn().mockResolvedValue(undefined);
const mockConfigGet = vi.fn().mockResolvedValue(false);
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    set: (...a: unknown[]) => mockConfigSet(...a),
    get: (...a: unknown[]) => mockConfigGet(...a),
  },
}));

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

import WebuiModalContent from '@renderer/components/settings/SettingsModal/contents/WebuiModalContent';

const ALLOW_REMOTE_KEY = 'webui.desktop.allowRemote';

/** The LAN toggle is the last switch in the panel (after "Enable WebUI"). */
function lanSwitch(): HTMLElement {
  const switches = screen.getAllByRole('switch');
  return switches[switches.length - 1];
}

async function mount(allowRemoteSaved: boolean, running = true) {
  mockConfigGet.mockImplementation((key: string) =>
    Promise.resolve(key === ALLOW_REMOTE_KEY ? allowRemoteSaved : true)
  );
  mockGetStatus.mockResolvedValue({
    success: true,
    data: {
      running,
      port: 25808,
      allowRemote: allowRemoteSaved,
      localUrl: 'http://localhost:25808',
      networkUrl: allowRemoteSaved ? 'http://192.168.1.42:25808' : undefined,
      adminUsername: 'admin',
    },
  });
  await act(async () => {
    render(<WebuiModalContent />);
  });
}

describe('#722: exposing the WebUI to the LAN requires explicit consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT expose the listener until the user confirms', async () => {
    await mount(false);

    await act(async () => {
      fireEvent.click(lanSwitch());
    });

    // The dialog is up, and nothing has been exposed or persisted yet.
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockConfigSet).not.toHaveBeenCalledWith(ALLOW_REMOTE_KEY, true);
  });

  it('the confirmation says what it actually does — LAN reach and plaintext login', async () => {
    await mount(false);
    await act(async () => {
      fireEvent.click(lanSwitch());
    });

    const cfg = confirmSpy.mock.calls[0][0] as { title: string; content: string; okText: string };
    expect(cfg.title).toBe('settings.webui.allowRemoteConfirmTitle');
    expect(cfg.content).toBe('settings.webui.allowRemoteConfirmBody');
    expect(cfg.okText).toBe('settings.webui.allowRemoteConfirmOk');
  });

  it('cancelling leaves the listener bound to localhost and the switch OFF', async () => {
    await mount(false);
    await act(async () => {
      fireEvent.click(lanSwitch());
    });

    // User backs out.
    const cfg = confirmSpy.mock.calls[0][0] as { onCancel: () => void };
    await act(async () => {
      cfg.onCancel();
    });

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockConfigSet).not.toHaveBeenCalledWith(ALLOW_REMOTE_KEY, true);
    // Critically: the switch must not be left painted ON for a listener that never
    // moved, or the user believes they are exposed (or protected) when they are not.
    expect(lanSwitch().getAttribute('aria-checked')).toBe('false');
  });

  it('confirming restarts the server bound to the LAN and persists the choice', async () => {
    await mount(false);
    await act(async () => {
      fireEvent.click(lanSwitch());
    });

    const cfg = confirmSpy.mock.calls[0][0] as { onOk: () => void };
    await act(async () => {
      cfg.onOk();
    });

    expect(mockStart).toHaveBeenCalledWith(expect.objectContaining({ allowRemote: true }));
    expect(mockConfigSet).toHaveBeenCalledWith(ALLOW_REMOTE_KEY, true);
  });

  it('turning it OFF needs no confirmation — that only shrinks the exposure', async () => {
    await mount(true);

    await act(async () => {
      fireEvent.click(lanSwitch());
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledWith(expect.objectContaining({ allowRemote: false }));
  });

  it('an already-exposed listener is stated in the panel, so a silent re-arm is visible', async () => {
    // The re-arm happens at startup from the persisted pref; whenever anyone opens this
    // panel the live exposure must be on screen, not merely implied by a toggle position.
    await mount(true);

    const warning = screen.getByTestId('webui-lan-exposure-warning');
    expect(warning.textContent).toContain('settings.webui.allowRemoteActive');
    expect(warning.textContent).toContain('http://192.168.1.42:25808');
  });

  it('a localhost-only listener shows no exposure warning', async () => {
    await mount(false);
    expect(screen.queryByTestId('webui-lan-exposure-warning')).toBeNull();
  });

  it('does NOT claim the WebUI is reachable while the server is stopped', async () => {
    // The pref outlives the server: disabling the WebUI without touching this toggle is
    // common. Saying "reachable by every device on your local network" present-tense
    // while nothing is listening is a false alarm — and false alarms are exactly how you
    // train someone to ignore the real one.
    await mount(true, /* running */ false);

    const warning = screen.getByTestId('webui-lan-exposure-warning');
    expect(warning.textContent).toContain('settings.webui.allowRemoteArmed');
    expect(warning.textContent).not.toContain('settings.webui.allowRemoteActive');
  });
});
