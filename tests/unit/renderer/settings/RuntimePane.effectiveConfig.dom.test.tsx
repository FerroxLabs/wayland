// @vitest-environment jsdom

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSection,
  setSection,
  getEffectiveRuntime,
  setRawEngineMode,
  getOutputBudget,
  setOutputBudget,
  openEffectiveRuntimeFolder,
} = vi.hoisted(() => ({
  getSection: vi.fn(),
  setSection: vi.fn(),
  getEffectiveRuntime: vi.fn(),
  setRawEngineMode: vi.fn(),
  getOutputBudget: vi.fn(),
  setOutputBudget: vi.fn(),
  openEffectiveRuntimeFolder: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    wcoreConfig: {
      getSection: {
        invoke: async (...args: unknown[]) => {
          try {
            return { ok: true, value: await getSection(...args) };
          } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : String(error) };
          }
        },
      },
      setSection: { invoke: (...args: unknown[]) => setSection(...args) },
      getEffectiveRuntime: {
        invoke: async () => {
          try {
            return { ok: true, runtime: await getEffectiveRuntime() };
          } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : String(error) };
          }
        },
      },
      setRawEngineMode: { invoke: (...args: unknown[]) => setRawEngineMode(...args) },
      getOutputBudget: {
        invoke: async () => {
          try {
            return { ok: true, value: await getOutputBudget() };
          } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : String(error) };
          }
        },
      },
      setOutputBudget: { invoke: (...args: unknown[]) => setOutputBudget(...args) },
      openEffectiveRuntimeFolder: { invoke: (...args: unknown[]) => openEffectiveRuntimeFolder(...args) },
    },
  },
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    type: _arcoType,
    size: _arcoSize,
    ...props
  }: React.ComponentProps<'button'> & { size?: string }) => (
    <button type='button' {...props}>
      {children}
    </button>
  ),
  Slider: ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
    <button type='button' aria-label='Set concurrency to 9' data-value={value} onClick={() => onChange(9)} />
  ),
  InputNumber: ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
    <button type='button' aria-label='Set output budget to 32000' data-value={value} onClick={() => onChange(32000)} />
  ),
}));

import RuntimePane from '@/renderer/pages/settings/WCoreConfig/panes/RuntimePane';

const MANAGED = {
  mode: 'desktop-managed' as const,
  profile: 'client-work',
  profileApplied: true,
  waylandHomeInjected: true,
  desktopModelOverrideApplied: true,
  desktopPromptOverlayApplied: true,
  selectedConnectorsAuthority: 'desktop' as const,
  teamBridgePolicy: 'host-preserved' as const,
  toolCredentialPolicy: 'allowlisted-host-forwarding' as const,
  hostProtocolAuthority: 'desktop' as const,
  engineConfigDir: '/Users/mike/.wayland/profiles/client-work',
  engineConfigPath: '/Users/mike/.wayland/profiles/client-work/config.toml',
  desktopConfigDir: '/Users/mike/Library/Application Support/Wayland/config',
  desktopConfigPath: '/Users/mike/Library/Application Support/Wayland/config/wayland-config.txt',
};

const RAW = {
  ...MANAGED,
  mode: 'raw-engine' as const,
  profile: null,
  profileApplied: false,
  waylandHomeInjected: false,
  desktopModelOverrideApplied: false,
  desktopPromptOverlayApplied: false,
  selectedConnectorsAuthority: 'core' as const,
  teamBridgePolicy: 'host-preserved' as const,
  toolCredentialPolicy: 'allowlisted-host-forwarding' as const,
  hostProtocolAuthority: 'desktop' as const,
  engineConfigDir: '/Users/mike/Library/Application Support/wayland-core',
  engineConfigPath: '/Users/mike/Library/Application Support/wayland-core/config.toml',
};

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('RuntimePane effective Core config truth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSection.mockResolvedValue({ mode: 'local', concurrency: 6 });
    setSection.mockResolvedValue({ ok: true });
    getEffectiveRuntime.mockResolvedValue(MANAGED);
    setRawEngineMode.mockResolvedValue({ ok: true });
    getOutputBudget.mockResolvedValue({ mode: 'auto' });
    setOutputBudget.mockResolvedValue({ ok: true });
    openEffectiveRuntimeFolder.mockResolvedValue({ ok: true });
  });

  it('shows visible loading, then current authoritative runtime truth', async () => {
    const runtime = deferred<typeof MANAGED>();
    getEffectiveRuntime.mockReturnValueOnce(runtime.promise);
    render(<RuntimePane />);

    expect(screen.getByText('Checking effective Core configuration…')).toBeTruthy();
    await act(async () => runtime.resolve(MANAGED));
    expect(await screen.findByText(MANAGED.engineConfigPath)).toBeTruthy();
    expect(screen.getByText('Current launch configuration')).toBeTruthy();
  });

  it('uses distinct accessible actions and sends enum targets instead of renderer paths', async () => {
    render(<RuntimePane />);

    expect(await screen.findByText(MANAGED.engineConfigPath)).toBeTruthy();
    expect(screen.getByText(MANAGED.desktopConfigPath)).toBeTruthy();
    expect(screen.getByText(/Core runtime and sandbox policy come from config.toml/)).toBeTruthy();
    expect(screen.getByText('Core reads · client-work')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open Core config folder' }));
      fireEvent.click(screen.getByRole('button', { name: 'Open Desktop settings folder' }));
    });
    expect(openEffectiveRuntimeFolder).toHaveBeenNthCalledWith(1, { target: 'core-config' });
    expect(openEffectiveRuntimeFolder).toHaveBeenNthCalledWith(2, { target: 'desktop-config' });
  });

  it('does not claim a managed prompt overlay when the settings snapshot did not observe one', async () => {
    getEffectiveRuntime.mockResolvedValueOnce({ ...MANAGED, desktopPromptOverlayApplied: false });
    render(<RuntimePane />);

    await screen.findByText(MANAGED.engineConfigPath);
    expect(screen.getByText(/A prompt overlay is added only when the conversation supplies one/)).toBeTruthy();
    expect(screen.queryByText(/applies this Desktop profile, model, prompt overlay/)).toBeNull();
  });

  it('claims a managed prompt overlay only when launch truth reports it was injected', async () => {
    render(<RuntimePane />);

    await screen.findByText(MANAGED.engineConfigPath);
    expect(screen.getByText(/applies this Desktop profile, model, prompt overlay/)).toBeTruthy();
  });

  it('surfaces an OS folder-open failure instead of silently ignoring it', async () => {
    openEffectiveRuntimeFolder.mockResolvedValueOnce({ ok: false, error: 'No application can open this path' });
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.click(screen.getByRole('button', { name: 'Open Core config folder' }));
    expect(await screen.findByText(/No application can open this path/)).toBeTruthy();
  });

  it('refreshes to truthful standalone config after the dedicated raw-mode write succeeds', async () => {
    getEffectiveRuntime.mockResolvedValueOnce(MANAGED).mockResolvedValueOnce(RAW);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.click(screen.getByRole('switch', { name: 'Raw engine mode' }));

    await waitFor(() => expect(setRawEngineMode).toHaveBeenCalledWith({ enabled: true }));
    expect(await screen.findByText(RAW.engineConfigPath)).toBeTruthy();
    expect(screen.getByText('Standalone Core config')).toBeTruthy();
    expect(screen.getByText(/Wayland host integration, permissions, team bridge/)).toBeTruthy();
    expect(setOutputBudget).not.toHaveBeenCalled();
  });

  it('reverts the switch and exposes the write failure when transactional persistence fails', async () => {
    setRawEngineMode.mockResolvedValueOnce({ ok: false, error: 'write denied' });
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    const rawSwitch = screen.getByRole('switch', { name: 'Raw engine mode' });
    fireEvent.click(rawSwitch);

    await waitFor(() => expect(setRawEngineMode).toHaveBeenCalledWith({ enabled: true }));
    await waitFor(() => expect(rawSwitch).toHaveAttribute('aria-checked', 'false'));
    expect(await screen.findByText(/write denied/)).toBeTruthy();
    expect(screen.getByText(MANAGED.engineConfigPath)).toBeTruthy();
  });

  it('reverts the raw switch and exposes a rejected persistence call', async () => {
    setRawEngineMode.mockRejectedValueOnce(new Error('raw preference threw'));
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    const rawSwitch = screen.getByRole('switch', { name: 'Raw engine mode' });
    fireEvent.click(rawSwitch);

    await waitFor(() => expect(rawSwitch).toHaveAttribute('aria-checked', 'false'));
    expect(await screen.findByText(/raw preference threw/)).toBeTruthy();
  });

  it('refreshes runtime truth on window focus to avoid a stale settings snapshot', async () => {
    getEffectiveRuntime.mockResolvedValueOnce(MANAGED).mockResolvedValueOnce(RAW);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.focus(window);

    expect(await screen.findByText(RAW.engineConfigPath)).toBeTruthy();
    expect(getEffectiveRuntime).toHaveBeenCalledTimes(2);
  });

  it('ignores a slow older refresh after a newer refresh has succeeded', async () => {
    const older = deferred<typeof MANAGED>();
    getEffectiveRuntime.mockResolvedValueOnce(MANAGED).mockReturnValueOnce(older.promise).mockResolvedValueOnce(RAW);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.focus(window);
    fireEvent.focus(window);
    expect(await screen.findByText(RAW.engineConfigPath)).toBeTruthy();

    await act(async () => older.resolve(MANAGED));
    expect(screen.getByText(RAW.engineConfigPath)).toBeTruthy();
    expect(screen.queryByText(MANAGED.engineConfigPath)).toBeNull();
  });

  it('ignores an older refresh error after a newer refresh has succeeded', async () => {
    const older = deferred<typeof MANAGED>();
    getEffectiveRuntime.mockResolvedValueOnce(MANAGED).mockReturnValueOnce(older.promise).mockResolvedValueOnce(RAW);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.focus(window);
    fireEvent.focus(window);
    expect(await screen.findByText(RAW.engineConfigPath)).toBeTruthy();

    await act(async () => older.reject(new Error('stale profile failure')));
    expect(screen.getByText(RAW.engineConfigPath)).toBeTruthy();
    expect(screen.queryByText(/stale profile failure/)).toBeNull();
  });

  it('drops an effective-runtime completion after unmount', async () => {
    const pending = deferred<typeof MANAGED>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getEffectiveRuntime.mockReturnValueOnce(pending.promise);
    const view = render(<RuntimePane />);
    expect(screen.getByText('Checking effective Core configuration…')).toBeTruthy();

    view.unmount();
    await act(async () => pending.resolve(MANAGED));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('provides a manual refresh for profile/config changes while the pane remains open', async () => {
    getEffectiveRuntime.mockResolvedValueOnce(MANAGED).mockResolvedValueOnce(RAW);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh effective Core configuration' }));

    expect(await screen.findByText(RAW.engineConfigPath)).toBeTruthy();
  });

  it('surfaces initial settings read failures without an unhandled rejection', async () => {
    getOutputBudget.mockRejectedValue(new Error('preference read denied'));
    render(<RuntimePane />);

    expect(await screen.findByText(/Some runtime settings could not be read:/)).toBeTruthy();
    expect(await screen.findByText(MANAGED.engineConfigPath)).toBeTruthy();
    expect(screen.getByText(/Output budget is unknown/)).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Auto' })).toBeNull();
  });

  it('does not display Auto before the output-budget authority has answered', async () => {
    const budget = deferred<{ mode: 'auto' }>();
    getOutputBudget.mockReturnValueOnce(budget.promise);
    render(<RuntimePane />);

    expect(screen.getByText('Reading output budget…')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Auto' })).toBeNull();
    await act(async () => budget.resolve({ mode: 'auto' }));
    expect(await screen.findByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'true');
  });

  it('surfaces unproven profile truth instead of fabricating a default path', async () => {
    getEffectiveRuntime.mockRejectedValue(new Error('PROFILE_ISOLATION'));
    render(<RuntimePane />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wayland could not prove which Core config is currently selected.'
    );
    expect(screen.queryByText(MANAGED.engineConfigPath)).toBeNull();
  });

  it('keeps the raw recovery switch operable when managed profile isolation is corrupt', async () => {
    getEffectiveRuntime
      .mockRejectedValueOnce(new Error('[PROFILE_ISOLATION] active profile is corrupt'))
      .mockResolvedValueOnce(RAW);
    render(<RuntimePane />);

    const rawSwitch = await screen.findByRole('switch', { name: 'Raw engine mode' });
    expect(rawSwitch).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(rawSwitch);

    await waitFor(() => expect(setRawEngineMode).toHaveBeenCalledWith({ enabled: true }));
    expect(await screen.findByText(RAW.engineConfigPath)).toBeTruthy();
  });

  it('does not expose raw recovery for an unclassified authority read failure', async () => {
    getEffectiveRuntime.mockRejectedValueOnce(new Error('storage unavailable'));
    render(<RuntimePane />);

    expect(await screen.findByText('Unknown')).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Raw engine mode' })).toBeNull();
  });

  it('does not expose unsupported topology, concurrency, or fabricated running controls', async () => {
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    expect(screen.getByText('Embedded local')).toBeTruthy();
    expect(screen.getByText('Not observed')).toBeTruthy();
    expect(screen.getByText('Core controlled')).toBeTruthy();
    expect(screen.getByText(/Not available in Desktop yet/)).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Remote' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Headless server' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Set concurrency to 9' })).toBeNull();
    expect(screen.queryByText('Running')).toBeNull();
    expect(setSection).not.toHaveBeenCalled();
  });

  it('rolls output budget back from the main-process authority when persistence fails', async () => {
    setOutputBudget.mockResolvedValueOnce({ ok: false, error: 'budget write denied' });
    getOutputBudget.mockResolvedValue({ mode: 'auto' });
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.click(screen.getByRole('radio', { name: 'Fixed' }));

    await waitFor(() => expect(setOutputBudget).toHaveBeenCalledWith({ value: { mode: 'fixed', value: 16000 } }));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByText(/budget write denied/)).toBeTruthy();
  });

  it('rolls output budget back when persistence rejects', async () => {
    setOutputBudget.mockRejectedValueOnce(new Error('budget preference threw'));
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.click(screen.getByRole('radio', { name: 'Fixed' }));

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByText(/budget preference threw/)).toBeTruthy();
  });

  it('serializes output-budget intent by disabling the control until authority is re-read', async () => {
    const pending = deferred<{ ok: boolean; error?: string }>();
    setOutputBudget.mockReturnValueOnce(pending.promise);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);

    fireEvent.click(screen.getByRole('radio', { name: 'Fixed' }));
    expect(await screen.findByText('Saving output budget…')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Auto' })).toBeNull();
    expect(setOutputBudget).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve({ ok: true }));
    expect(await screen.findByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'true');
  });

  it('drops a pending output-budget failure after unmount', async () => {
    const pending = deferred<{ ok: boolean; error?: string }>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    setOutputBudget.mockReturnValueOnce(pending.promise);
    const view = render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);
    fireEvent.click(screen.getByRole('radio', { name: 'Fixed' }));

    view.unmount();
    await act(async () => pending.resolve({ ok: false, error: 'late budget failure' }));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('tracks Core and Desktop folder opens independently', async () => {
    const core = deferred<{ ok: boolean }>();
    const desktop = deferred<{ ok: boolean }>();
    openEffectiveRuntimeFolder.mockReturnValueOnce(core.promise).mockReturnValueOnce(desktop.promise);
    render(<RuntimePane />);
    await screen.findByText(MANAGED.engineConfigPath);
    const coreButton = screen.getByRole('button', { name: 'Open Core config folder' });
    const desktopButton = screen.getByRole('button', { name: 'Open Desktop settings folder' });

    fireEvent.click(coreButton);
    fireEvent.click(desktopButton);
    expect(coreButton).toBeDisabled();
    expect(desktopButton).toBeDisabled();

    await act(async () => core.resolve({ ok: true }));
    expect(coreButton).not.toBeDisabled();
    expect(desktopButton).toBeDisabled();
    await act(async () => desktop.resolve({ ok: true }));
    expect(desktopButton).not.toBeDisabled();
  });
});
