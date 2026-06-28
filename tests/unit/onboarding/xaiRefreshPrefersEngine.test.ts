/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// #391: the engine (Wayland Core) is the single refresher of the single-use
// rotating xAI token. These tests assert `xaiRefreshToken` defers to the
// engine-rotated bundle instead of independently POSTing (which would burn the
// engine's token → 401). The registry/engine/store deps are mocked; the real
// network is asserted to be untouched on the happy path.
const connectMock = vi.fn();
const readEngineMock = vi.fn();
const writeEngineMock = vi.fn();
const loadStoreMock = vi.fn();
const saveStoreMock = vi.fn();

vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  connectModelRegistryProvider: (...args: unknown[]) => connectMock(...args),
}));
vi.mock('@process/onboarding/xaiEngineAuthFile', () => ({
  readXaiEngineAuthFile: (...args: unknown[]) => readEngineMock(...args),
  writeXaiEngineAuthFile: (...args: unknown[]) => writeEngineMock(...args),
}));
vi.mock('@process/onboarding/xaiTokenStore', () => ({
  loadXaiTokens: (...args: unknown[]) => loadStoreMock(...args),
  saveXaiTokens: (...args: unknown[]) => saveStoreMock(...args),
}));
vi.mock('electron', () => ({ shell: { openExternal: vi.fn() } }));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { xaiRefreshToken } from '@process/onboarding/xaiOAuth';

const NOW = 1_900_000_000_000;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  connectMock.mockReset().mockResolvedValue({ ok: true });
  readEngineMock.mockReset().mockResolvedValue(null);
  writeEngineMock.mockReset().mockResolvedValue(true);
  loadStoreMock.mockReset().mockResolvedValue(null);
  saveStoreMock.mockReset().mockResolvedValue(undefined);
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  // Any real network call on the happy path is a bug — fail loudly if it fires.
  fetchSpy = vi.fn(() => Promise.reject(new Error('network must not be called')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('xaiRefreshToken prefers the engine-rotated token (#391)', () => {
  it('re-registers the engine access token without any independent refresh when it is still valid', async () => {
    readEngineMock.mockResolvedValue({
      accessToken: 'engine-acc',
      refreshToken: 'engine-ref',
      expiresAt: NOW + 60_000, // not expired
    });

    const res = await xaiRefreshToken();

    expect(res).toEqual({ ok: true, reused: false });
    expect(connectMock).toHaveBeenCalledWith('xai', { key: 'engine-acc' });
    // The whole point: no network refresh POST → the single-use token isn't burned.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns unauthorized when no engine store and no desktop refresh token exist', async () => {
    readEngineMock.mockResolvedValue(null);
    loadStoreMock.mockResolvedValue(null);

    expect(await xaiRefreshToken()).toEqual({ ok: false, error: 'unauthorized' });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('falls through to a refresh when the engine bearer is expired (engine refresh token preferred)', async () => {
    readEngineMock.mockResolvedValue({
      accessToken: 'stale',
      refreshToken: 'engine-ref',
      expiresAt: NOW - 1, // expired
    });
    loadStoreMock.mockResolvedValue({ refreshToken: 'desktop-ref' });
    // Engine bearer expired → it must POST a refresh using the ENGINE refresh
    // token, not the desktop copy. Stub a successful token response.
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ access_token: 'fresh-acc', refresh_token: 'fresh-ref', expires_in: 3600 }),
      } as Response)
    );

    const res = await xaiRefreshToken();

    expect(res).toEqual({ ok: true, reused: false });
    // It did refresh over the network...
    expect(fetchSpy).toHaveBeenCalled();
    // ...and the token POST body carried the ENGINE refresh token, not the desktop one.
    const tokenPost = fetchSpy.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST');
    if (!tokenPost) throw new Error('expected a POST refresh call');
    const body = String((tokenPost[1] as RequestInit).body);
    expect(body).toContain('refresh_token=engine-ref');
    expect(body).not.toContain('desktop-ref');
  });
});
