import { describe, it, expect, vi } from 'vitest';
import {
  WNANO_OAUTH_REFRESH_THRESHOLD_SECS,
  buildWnanoOAuthBearerEnv,
  normalizeWnanoBearerEnvSuffix,
  type WnanoOAuthBearerSource,
} from '@process/task/wnano';

const NOW_MS = 1_800_000_000_000;

const source = (over: Partial<WnanoOAuthBearerSource> & { nanoProviderId?: string } = {}) => ({
  nanoProviderId: 'xai',
  load: vi.fn(async () => ({ accessToken: 'xai-access-synthetic', expiresAtMs: NOW_MS + 3_600_000 })),
  refresh: vi.fn(async () => true),
  ...over,
});

describe('normalizeWnanoBearerEnvSuffix', () => {
  it('uppercases and replaces every char outside [A-Z0-9] with underscore', () => {
    expect(normalizeWnanoBearerEnvSuffix('google-gemini')).toBe('GOOGLE_GEMINI');
    expect(normalizeWnanoBearerEnvSuffix('xai')).toBe('XAI');
    expect(normalizeWnanoBearerEnvSuffix('flux-router')).toBe('FLUX_ROUTER');
  });
});

describe('buildWnanoOAuthBearerEnv (C8 Q1b bearer injection)', () => {
  it('injects the access token + expiry metadata for an advertised OAuth provider', async () => {
    const env = await buildWnanoOAuthBearerEnv(['xai'], [source()], NOW_MS);
    expect(env.WAYLAND_NANO_OAUTH_BEARER_XAI).toBe('xai-access-synthetic');
    expect(env.WAYLAND_NANO_OAUTH_BEARER_XAI_EXPIRES_AT_UNIX_SECS).toBe(
      String(Math.floor((NOW_MS + 3_600_000) / 1000))
    );
  });

  it('does NOT refresh when the token is fresh (>= 600s remaining)', async () => {
    const src = source();
    await buildWnanoOAuthBearerEnv(['xai'], [src], NOW_MS);
    expect(src.refresh).not.toHaveBeenCalled();
  });

  it('refreshes at spawn when fewer than 600s remain, then injects the fresh token', async () => {
    const src = source({
      load: vi
        .fn()
        .mockResolvedValueOnce({ accessToken: 'stale-token', expiresAtMs: NOW_MS + 300_000 })
        .mockResolvedValueOnce({ accessToken: 'fresh-token', expiresAtMs: NOW_MS + 3_600_000 }),
    });
    const env = await buildWnanoOAuthBearerEnv(['xai'], [src], NOW_MS);
    expect(src.refresh).toHaveBeenCalledTimes(1);
    expect(env.WAYLAND_NANO_OAUTH_BEARER_XAI).toBe('fresh-token');
    expect(env.WAYLAND_NANO_OAUTH_BEARER_XAI_EXPIRES_AT_UNIX_SECS).toBe(
      String(Math.floor((NOW_MS + 3_600_000) / 1000))
    );
  });

  it('treats exactly-600s-remaining as fresh enough (threshold is strictly-below)', async () => {
    const src = source({
      load: vi.fn(async () => ({
        accessToken: 'borderline-token',
        expiresAtMs: NOW_MS + WNANO_OAUTH_REFRESH_THRESHOLD_SECS * 1000,
      })),
    });
    const env = await buildWnanoOAuthBearerEnv(['xai'], [src], NOW_MS);
    expect(src.refresh).not.toHaveBeenCalled();
    expect(env.WAYLAND_NANO_OAUTH_BEARER_XAI).toBe('borderline-token');
  });

  it('never emits a refresh token - only the access token and expiry metadata', async () => {
    const src = source({
      load: vi.fn(async () => ({
        accessToken: 'xai-access-synthetic',
        expiresAtMs: NOW_MS + 3_600_000,
        refreshToken: 'xai-refresh-SHOULD-NEVER-LEAK',
      })),
    });
    const env = await buildWnanoOAuthBearerEnv(['xai'], [src], NOW_MS);
    expect(JSON.stringify(env)).not.toContain('xai-refresh-SHOULD-NEVER-LEAK');
    expect(Object.keys(env).toSorted()).toEqual([
      'WAYLAND_NANO_OAUTH_BEARER_XAI',
      'WAYLAND_NANO_OAUTH_BEARER_XAI_EXPIRES_AT_UNIX_SECS',
    ]);
  });

  it('emits nothing for a provider that is not advertised in the payload', async () => {
    const src = source();
    const env = await buildWnanoOAuthBearerEnv(['openai'], [src], NOW_MS);
    expect(env).toEqual({});
    expect(src.load).not.toHaveBeenCalled();
  });

  it('emits nothing when the source has no access token', async () => {
    const env = await buildWnanoOAuthBearerEnv(['xai'], [source({ load: vi.fn(async () => null) })], NOW_MS);
    expect(env).toEqual({});
  });

  it('emits nothing when the expiry is unknown (expiry metadata is contractual)', async () => {
    const src = source({ load: vi.fn(async () => ({ accessToken: 'xai-access-synthetic' })) });
    const env = await buildWnanoOAuthBearerEnv(['xai'], [src], NOW_MS);
    expect(env).toEqual({});
    expect(src.refresh).not.toHaveBeenCalled();
  });

  it('emits nothing when a required refresh fails (spawn proceeds; Nano fails closed at dispatch)', async () => {
    const src = source({
      load: vi.fn(async () => ({ accessToken: 'stale-token', expiresAtMs: NOW_MS + 60_000 })),
      refresh: vi.fn(async () => false),
    });
    const env = await buildWnanoOAuthBearerEnv(['xai'], [src], NOW_MS);
    expect(env).toEqual({});
  });

  it('survives a throwing source without aborting the spawn env build', async () => {
    const broken = source({ load: vi.fn(async () => Promise.reject(new Error('store corrupt'))) });
    const env = await buildWnanoOAuthBearerEnv(['xai'], [broken], NOW_MS);
    expect(env).toEqual({});
  });

  it('skips a second source whose normalized env suffix collides with the first', async () => {
    const first = source({ nanoProviderId: 'google-gemini' });
    const colliding = source({
      nanoProviderId: 'google_gemini',
      load: vi.fn(async () => ({ accessToken: 'colliding-token', expiresAtMs: NOW_MS + 3_600_000 })),
    });
    const env = await buildWnanoOAuthBearerEnv(['google-gemini', 'google_gemini'], [first, colliding], NOW_MS);
    expect(env.WAYLAND_NANO_OAUTH_BEARER_GOOGLE_GEMINI).toBe('xai-access-synthetic');
    expect(colliding.load).not.toHaveBeenCalled();
  });
});
