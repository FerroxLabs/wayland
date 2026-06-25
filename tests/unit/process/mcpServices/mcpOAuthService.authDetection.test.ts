/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// #283 / #306: GitHub and Google Workspace remote MCP servers reject an
// unauthenticated probe with HTTP 400 "missing required Authorization header"
// (NOT the RFC 6750 `401 + WWW-Authenticate` challenge the old detection keyed
// on). checkOAuthStatus must still surface these as "needs sign-in" by gating on
// OAuth discovery, and must NOT report a non-2xx probe with no discoverable
// OAuth as authenticated (the original fall-through bug).

const { discoverMock, getCredentialsMock, isTokenExpiredMock } = vi.hoisted(() => ({
  discoverMock: vi.fn(),
  getCredentialsMock: vi.fn(),
  isTokenExpiredMock: vi.fn(),
}));

vi.mock('@office-ai/aioncli-core/dist/src/mcp/oauth-provider.js', () => ({
  MCPOAuthProvider: class {
    _activeCallbackServer: { close: () => void } | null = { close: vi.fn() };
    authenticate = vi.fn(async () => undefined);
    getValidToken = vi.fn(async () => null);
  },
  OAUTH_DISPLAY_MESSAGE_EVENT: 'oauth-display-message',
}));
vi.mock('@office-ai/aioncli-core/dist/src/mcp/oauth-token-storage.js', () => ({
  MCPOAuthTokenStorage: class {
    getCredentials = getCredentialsMock;
    isTokenExpired = isTokenExpiredMock;
    deleteCredentials = vi.fn(async () => undefined);
    listServers = vi.fn(async () => []);
  },
}));
// McpOAuthService re-wraps these at module load; discoverOAuthConfig is the
// controllable seam these tests drive (the patched wrapper delegates to it).
vi.mock('@office-ai/aioncli-core/dist/src/mcp/oauth-utils.js', () => ({
  OAuthUtils: {
    buildResourceParameter: (u: string) => u,
    fetchProtectedResourceMetadata: async () => null,
    discoverOAuthConfig: discoverMock,
    discoverOAuthFromWWWAuthenticate: async () => null,
  },
}));
vi.mock('@office-ai/aioncli-core/dist/src/utils/events.js', () => ({
  CoreEvent: { ConsentRequest: 'consent-request' },
  coreEvents: { on: vi.fn(), off: vi.fn() },
}));

import { McpOAuthService } from '@process/services/mcpServices/McpOAuthService';
import type { IMcpServer } from '@/common/config/storage';

const httpServer = (url: string, name = 'github'): IMcpServer =>
  ({
    id: `${name}-1`,
    name,
    description: name,
    enabled: false,
    transport: { type: 'streamable_http', url },
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
  }) as unknown as IMcpServer;

const stubFetch = (resp: { status: number; statusText?: string; ok?: boolean; headers?: Headers }) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      status: resp.status,
      statusText: resp.statusText ?? '',
      ok: resp.ok ?? (resp.status >= 200 && resp.status < 300),
      headers: resp.headers ?? new Headers(),
    }))
  );

describe('McpOAuthService.checkOAuthStatus auth detection (#283/#306)', () => {
  beforeEach(() => {
    discoverMock.mockReset();
    getCredentialsMock.mockReset().mockResolvedValue(null);
    isTokenExpiredMock.mockReset().mockReturnValue(false);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('flags a GitHub 400 "missing Authorization header" probe as needsLogin when OAuth is discoverable', async () => {
    stubFetch({ status: 400, statusText: 'Bad Request' });
    discoverMock.mockResolvedValue({ authorizationUrl: 'https://github.com/login/oauth/authorize' });

    const result = await new McpOAuthService().checkOAuthStatus(httpServer('https://api.githubcopilot.com/mcp'));

    expect(result.needsLogin).toBe(true);
    expect(result.isAuthenticated).toBe(false);
  });

  it('flags a Google Workspace non-2xx probe as needsLogin when OAuth is discoverable', async () => {
    stubFetch({ status: 403, statusText: 'Forbidden' });
    discoverMock.mockResolvedValue({ registrationUrl: 'https://accounts.google.com/o/oauth2/register' });

    const result = await new McpOAuthService().checkOAuthStatus(
      httpServer('https://workspace-mcp.example.com/mcp', 'google-workspace')
    );

    expect(result.needsLogin).toBe(true);
    expect(result.isAuthenticated).toBe(false);
  });

  it('does NOT report a non-2xx probe as authenticated when no OAuth is discoverable (fall-through fix)', async () => {
    stubFetch({ status: 503, statusText: 'Service Unavailable' });
    discoverMock.mockResolvedValue(null);

    const result = await new McpOAuthService().checkOAuthStatus(httpServer('https://down.example.com/mcp'));

    expect(result.isAuthenticated).toBe(false);
    expect(result.needsLogin).toBe(false);
    expect(result.error).toContain('503');
  });

  it('treats a transient 5xx as a connection error when discovery throws (not a spurious sign-in)', async () => {
    stubFetch({ status: 502, statusText: 'Bad Gateway' });
    discoverMock.mockRejectedValue(new Error('network unreachable'));

    const result = await new McpOAuthService().checkOAuthStatus(httpServer('https://flaky.example.com/mcp'));

    expect(result.needsLogin).toBe(false);
    expect(result.isAuthenticated).toBe(false);
    expect(result.error).toContain('502');
  });

  it('reports authenticated without running discovery when the probe succeeds (2xx)', async () => {
    stubFetch({ status: 200, statusText: 'OK', ok: true });

    const result = await new McpOAuthService().checkOAuthStatus(httpServer('https://ok.example.com/mcp'));

    expect(result.isAuthenticated).toBe(true);
    expect(result.needsLogin).toBe(false);
    expect(discoverMock).not.toHaveBeenCalled();
  });

  it('keeps the 401 + WWW-Authenticate fast path (valid stored token => authenticated, no discovery)', async () => {
    stubFetch({
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'WWW-Authenticate': 'Bearer realm="mcp"' }),
    });
    getCredentialsMock.mockResolvedValue({ token: { accessToken: 'valid' } });
    isTokenExpiredMock.mockReturnValue(false);

    const result = await new McpOAuthService().checkOAuthStatus(httpServer('https://api.githubcopilot.com/mcp'));

    expect(result.isAuthenticated).toBe(true);
    expect(result.needsLogin).toBe(false);
    expect(discoverMock).not.toHaveBeenCalled();
  });

  it('reports needsLogin via the 401 fast path when no token is stored', async () => {
    stubFetch({
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'WWW-Authenticate': 'Bearer realm="mcp"' }),
    });
    getCredentialsMock.mockResolvedValue(null);

    const result = await new McpOAuthService().checkOAuthStatus(httpServer('https://api.githubcopilot.com/mcp'));

    expect(result.needsLogin).toBe(true);
    expect(result.isAuthenticated).toBe(false);
  });
});
