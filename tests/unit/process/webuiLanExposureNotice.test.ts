/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #722: "Allow Remote Access" binds the WebUI to 0.0.0.0 — reachable by every device on
 * the LAN, with the login travelling over plaintext HTTP — and `restoreDesktopWebUIFromPreferences`
 * re-arms it on EVERY app start from the persisted preference. The only notice was a
 * `console.log`, which no user sees. A listener the user enabled once could therefore be
 * running, exposed, indefinitely, with nothing on screen ever saying so.
 *
 * These pin that a restored LAN exposure is surfaced, that a localhost-only restore stays
 * quiet, and that a notification platform failure can never take startup down.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const showSpy = vi.fn();
const notificationCtor = vi.fn();
let notificationSupported = true;

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/wayland-test' },
  Notification: Object.assign(
    class {
      constructor(opts: unknown) {
        notificationCtor(opts);
      }
      show() {
        showSpy();
      }
    },
    { isSupported: () => notificationSupported }
  ),
}));

const startWebServerWithInstance = vi.fn();
vi.mock('@process/webserver', () => ({
  startWebServerWithInstance: (port: number, allowRemote: boolean) => startWebServerWithInstance(port, allowRemote),
}));

vi.mock('@process/bridge/webuiBridge', () => ({ setWebServerInstance: vi.fn() }));

const getLanIP = vi.fn();
vi.mock('@process/bridge/lanAddress', () => ({ getLanIP: () => getLanIP() }));

const configGet = vi.fn();
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: (k: string) => configGet(k) },
}));

import { restoreDesktopWebUIFromPreferences } from '@process/utils/webuiConfig';

/** Persisted desktop prefs: WebUI enabled, and `allowRemote` as given. */
function persistPrefs(allowRemote: boolean, port = 25808) {
  configGet.mockImplementation((key: string) => {
    if (key === 'webui.desktop.enabled') return Promise.resolve(true);
    if (key === 'webui.desktop.allowRemote') return Promise.resolve(allowRemote);
    if (key === 'webui.desktop.port') return Promise.resolve(port);
    return Promise.resolve(undefined);
  });
  startWebServerWithInstance.mockResolvedValue({ port, allowRemote, server: {}, wss: {} });
}

describe('#722: a silently re-armed LAN exposure must be surfaced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationSupported = true;
    getLanIP.mockReturnValue('192.168.1.42');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('notifies the user, naming the actual LAN URL, when allowRemote is restored', async () => {
    persistPrefs(true);

    await restoreDesktopWebUIFromPreferences();

    expect(startWebServerWithInstance).toHaveBeenCalledWith(25808, true);
    expect(showSpy).toHaveBeenCalledTimes(1);

    const opts = notificationCtor.mock.calls[0][0] as { title: string; body: string };
    // The user must be able to tell WHAT is exposed and WHERE, not just that "something" happened.
    expect(opts.body).toContain('http://192.168.1.42:25808');
    expect(`${opts.title} ${opts.body}`.toLowerCase()).toContain('network');
    // ...and that the transport is not private.
    expect(opts.body.toLowerCase()).toContain('unencrypted');
  });

  it('stays quiet for a localhost-only restore — that exposes nothing', async () => {
    persistPrefs(false);

    await restoreDesktopWebUIFromPreferences();

    expect(startWebServerWithInstance).toHaveBeenCalledWith(25808, false);
    expect(showSpy).not.toHaveBeenCalled();
  });

  it('still names the port when the LAN IP cannot be resolved', async () => {
    persistPrefs(true, 31000);
    getLanIP.mockReturnValue(null);

    await restoreDesktopWebUIFromPreferences();

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect((notificationCtor.mock.calls[0][0] as { body: string }).body).toContain('31000');
  });

  it('does not notify when the platform has no notifications', async () => {
    persistPrefs(true);
    notificationSupported = false;

    await restoreDesktopWebUIFromPreferences();

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('a notification failure must NOT take the WebUI restore down with it', async () => {
    persistPrefs(true);
    getLanIP.mockImplementation(() => {
      throw new Error('os.networkInterfaces exploded');
    });

    // The server is already up by this point; a failed *notice* must not look like a
    // failed start, or we would trade a missing warning for a broken WebUI.
    await expect(restoreDesktopWebUIFromPreferences()).resolves.toBeUndefined();
    expect(startWebServerWithInstance).toHaveBeenCalledWith(25808, true);
  });

  it('does not start anything at all when the WebUI is disabled', async () => {
    configGet.mockResolvedValue(false);

    await restoreDesktopWebUIFromPreferences();

    expect(startWebServerWithInstance).not.toHaveBeenCalled();
    expect(showSpy).not.toHaveBeenCalled();
  });
});
