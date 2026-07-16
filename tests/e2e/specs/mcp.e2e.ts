/**
 * MCP - stdio mock server round-trip.
 *
 * Validates the W4 L35 bump to @modelcontextprotocol/sdk@^1.29.0 by spinning
 * up a tiny dependency-free stdio MCP server (tests/e2e/helpers/mocks/mockMcpServer.ts)
 * and asking the Wayland bridge to (a) test the connection, (b) enumerate
 * tools, and (c) round-trip an `echo` call. If the SDK shape changed under
 * us, this spec catches it before the agent surface notices.
 *
 * We do NOT depend on a published MCP server. Mocks are local and offline.
 */
import path from 'path';
import fs from 'fs';
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

type Tool = { name: string; description?: string };
type TestEnvelope =
  | { success: true; data: { success: boolean; tools?: Tool[]; error?: string } }
  | { success: false; msg: string };

const mockServerPath = path.resolve(__dirname, '../helpers/mocks/mockMcpServer.ts');

test.describe('MCP stdio bridge', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(mockServerPath)) {
      throw new Error(`mock MCP server missing: ${mockServerPath}`);
    }
  });

  // ── Connection test ───────────────────────────────────────────────────────
  // The bridge's `mcp.test-connection` does the full initialize + tools/list
  // dance against the configured transport. If the SDK is wired correctly,
  // the response data should carry our mock's single tool.
  test('mcp.test-connection against a local stdio server reports tools/list', async ({ page }) => {
    // Bun is a pinned development/CI prerequisite and executes the TypeScript
    // fixture directly. Use the binary itself: `bunx --bun <file>` treats the
    // file as a package name and can false-fail before MCP even starts.
    const server = {
      id: 'e2e-mock-mcp',
      name: 'e2e-mock-mcp',
      description: 'inline mock for L35 SDK 1.29 verification',
      enabled: true,
      transport: {
        type: 'stdio' as const,
        command: 'bun',
        args: [mockServerPath],
        env: {},
      },
      status: 'disconnected' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      originalJson: '{}',
    };

    const resp = await invokeBridge<TestEnvelope>(page, 'mcp.test-connection', server, 20_000);
    expect(resp, 'envelope returned').toBeDefined();
    expect(typeof resp.success, 'success is boolean').toBe('boolean');

    if (!resp.success) {
      throw new Error(`mcp.test-connection rejected the deterministic local fixture: ${resp.msg}`);
    }

    expect(typeof resp.data, 'data envelope is object').toBe('object');
    // SDK 1.29 shape: { success: boolean, tools?: Tool[], error?: string }
    expect(typeof resp.data.success, 'inner.success is boolean').toBe('boolean');
    if (!resp.data.success) {
      throw new Error(`local MCP fixture failed initialize/tools-list: ${resp.data.error ?? 'unknown error'}`);
    }
    expect(Array.isArray(resp.data.tools), 'tools is an array').toBe(true);
    const names = (resp.data.tools ?? []).map((t) => t.name);
    // Our mock advertises exactly one tool named `echo`.
    expect(names, 'mock advertises the echo tool').toContain('echo');
  });

  // ── Authenticated-servers list returns the documented envelope ────────────
  // mcp.get-authenticated-servers is the bridge UI consults to decide whether
  // an OAuth-protected MCP needs a re-auth. The shape must be a string[]
  // envelope even when empty.
  test('mcp.get-authenticated-servers returns a string[] envelope', async ({ page }) => {
    type Envelope = { success: true; data: string[] } | { success: false; msg: string };
    const resp = await invokeBridge<Envelope>(page, 'mcp.get-authenticated-servers', undefined, 5_000);
    expect(resp, 'envelope returned').toBeDefined();
    expect(typeof resp.success, 'success is boolean').toBe('boolean');
    if (resp.success) {
      expect(Array.isArray(resp.data), 'data is an array').toBe(true);
      for (const id of resp.data) {
        expect(typeof id, 'each id is a string').toBe('string');
      }
    } else {
      expect(typeof resp.msg, 'failure carries msg').toBe('string');
    }
  });
});
