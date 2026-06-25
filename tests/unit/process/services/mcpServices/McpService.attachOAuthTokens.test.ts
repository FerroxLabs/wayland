/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the OAuth service singleton so we control getValidToken.
const getValidToken = vi.fn();
vi.mock('@process/services/mcpServices/McpOAuthService', () => ({
  mcpOAuthService: { getValidToken: (...a: unknown[]) => getValidToken(...a) },
}));

import { McpService } from '@process/services/mcpServices/McpService';

// Reach the private chokepoint directly.
const attach = (svc: McpService, servers: unknown[]): Promise<unknown[]> =>
  (svc as unknown as { attachOAuthTokens: (s: unknown[]) => Promise<unknown[]> }).attachOAuthTokens(servers);

const httpServer = (name: string, headers?: Record<string, string>) => ({
  id: name,
  name,
  enabled: true,
  transport: { type: 'streamable_http', url: 'https://mcp.example.com', ...(headers ? { headers } : {}) },
});

describe('McpService.attachOAuthTokens (#MCP-oauth: reuse Wayland token, no engine re-OAuth)', () => {
  let svc: McpService;
  beforeEach(() => {
    getValidToken.mockReset();
    svc = new McpService();
  });

  it('attaches the stored bearer token to an authorized OAuth server', async () => {
    getValidToken.mockResolvedValue('tok-123');
    const [out] = (await attach(svc, [httpServer('canva')])) as Array<{ transport: { headers: Record<string, string> } }>;
    expect(out.transport.headers.Authorization).toBe('Bearer tok-123');
  });

  it('leaves a server unchanged when there is no stored token (non-OAuth)', async () => {
    getValidToken.mockResolvedValue(null);
    const input = httpServer('plain');
    const [out] = (await attach(svc, [input])) as Array<{ transport: { headers?: Record<string, string> } }>;
    expect(out.transport.headers).toBeUndefined();
  });

  it('refreshes a stale baked Authorization header with the current OAuth token', async () => {
    // A connector bakes its bearer into the record at connect time; once it
    // expires, the fresh token must win or the session keeps sending the dead
    // one (401 / endless re-authorize loop).
    getValidToken.mockResolvedValue('fresh-tok');
    const [out] = (await attach(svc, [
      httpServer('notion', { Authorization: 'Bearer stale-tok', 'X-Keep': 'yes' }),
    ])) as Array<{ transport: { headers: Record<string, string> } }>;
    expect(out.transport.headers.Authorization).toBe('Bearer fresh-tok');
    // Non-auth headers are preserved.
    expect(out.transport.headers['X-Keep']).toBe('yes');
  });

  it('preserves a user-provided Authorization header when no OAuth token is stored (BYO)', async () => {
    getValidToken.mockResolvedValue(null);
    const [out] = (await attach(svc, [httpServer('byo', { Authorization: 'Bearer byo-key' })])) as Array<{
      transport: { headers: Record<string, string> };
    }>;
    expect(out.transport.headers.Authorization).toBe('Bearer byo-key');
  });

  it('does not mutate the original server object', async () => {
    getValidToken.mockResolvedValue('tok-xyz');
    const input = httpServer('immut');
    await attach(svc, [input]);
    expect((input.transport as { headers?: unknown }).headers).toBeUndefined();
  });
});
