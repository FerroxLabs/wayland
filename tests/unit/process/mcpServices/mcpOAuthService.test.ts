/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Bug #242: a BYO OAuth login whose loopback callback never arrives must NOT
// hang the renderer for the upstream 5-minute timer. login() races
// authenticate() against a 120s timeout and an explicit cancel; cancel() aborts
// an in-flight login and closes the callback server (freeing port 57000). These
// tests drive both paths with fake timers and a never-resolving authenticate().

// Hoisted handles so the mocked MCPOAuthProvider is controllable per-test.
// FakeProvider lives in the hoisted block too, since vi.mock factories are
// lifted above ordinary top-level declarations.
const { authenticateImpl, closeCallbackServer, FakeProvider } = vi.hoisted(() => {
  const impl = { fn: undefined as undefined | (() => Promise<unknown>) };
  const close = vi.fn();
  class Provider {
    // Mirrors the upstream field McpOAuthService.cancel/login reach into.
    _activeCallbackServer: { close: () => void } | null = { close };
    authenticate(): Promise<unknown> {
      return impl.fn!();
    }
    getValidToken(): Promise<string | null> {
      return Promise.resolve(null);
    }
  }
  return { authenticateImpl: impl, closeCallbackServer: close, FakeProvider: Provider };
});

vi.mock('@office-ai/aioncli-core/dist/src/mcp/oauth-provider.js', () => ({
  MCPOAuthProvider: FakeProvider,
  OAUTH_DISPLAY_MESSAGE_EVENT: 'oauth-display-message',
}));
vi.mock('@office-ai/aioncli-core/dist/src/mcp/oauth-token-storage.js', () => ({
  MCPOAuthTokenStorage: class {
    getCredentials = vi.fn(async () => null);
    isTokenExpired = vi.fn(() => false);
    deleteCredentials = vi.fn(async () => undefined);
    listServers = vi.fn(async () => []);
  },
}));
// McpOAuthService patches these at module-load; provide stable stubs so the
// require side effects don't explode under the test runtime.
vi.mock('@office-ai/aioncli-core/dist/src/mcp/oauth-utils.js', () => ({
  OAuthUtils: {
    buildResourceParameter: (u: string) => u,
    fetchProtectedResourceMetadata: async () => null,
    discoverOAuthConfig: async () => ({ registrationUrl: 'https://example.com/register' }),
    discoverOAuthFromWWWAuthenticate: async () => null,
  },
}));
vi.mock('@office-ai/aioncli-core/dist/src/utils/events.js', () => ({
  CoreEvent: { ConsentRequest: 'consent-request' },
  coreEvents: { on: vi.fn(), off: vi.fn() },
}));

import { McpOAuthService } from '@process/services/mcpServices/McpOAuthService';
import type { IMcpServer } from '@/common/config/storage';

const byoServer = (): IMcpServer =>
  ({
    id: 'gh-1',
    name: 'github',
    description: 'GitHub',
    enabled: false,
    transport: { type: 'streamable_http', url: 'https://api.githubcopilot.com/mcp' },
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
    // BYO creds present -> login skips the DCR pre-probe and goes straight to
    // authenticate(), which is the path that hangs in bug #242.
    byoOAuth: { clientId: 'cid', clientSecret: 'sec' },
  }) as unknown as IMcpServer;

describe('McpOAuthService login() timeout + cancel (bug #242)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authenticateImpl.fn = undefined;
    closeCallbackServer.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a structured timeout result instead of hanging when authenticate never resolves', async () => {
    const svc = new McpOAuthService();
    // Never resolves - simulates a loopback callback that never arrives.
    authenticateImpl.fn = () => new Promise<unknown>(() => {});

    const pending = svc.login(byoServer());

    // Advance past the 120s login timeout.
    await vi.advanceTimersByTimeAsync(120_000);
    const result = await pending;

    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('timeout');
    // The upstream callback server is closed to free port 57000.
    expect(closeCallbackServer).toHaveBeenCalledTimes(1);
  });

  it('cancel() aborts an in-flight login with a cancelled result and closes the callback server', async () => {
    const svc = new McpOAuthService();
    authenticateImpl.fn = () => new Promise<unknown>(() => {});

    const pending = svc.login(byoServer());
    // Let login() register itself in the in-flight map before cancelling.
    await vi.advanceTimersByTimeAsync(0);

    svc.cancel('github');
    const result = await pending;

    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('cancelled');
    expect(closeCallbackServer).toHaveBeenCalledTimes(1);
  });

  it('returns success and does not fire the timeout when authenticate resolves first', async () => {
    const svc = new McpOAuthService();
    authenticateImpl.fn = () => Promise.resolve(undefined);

    const result = await svc.login(byoServer());

    expect(result.success).toBe(true);
    expect(closeCallbackServer).not.toHaveBeenCalled();
  });
});
