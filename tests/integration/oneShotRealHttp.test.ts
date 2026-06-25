/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * REAL-NETWORK integration test for the #244 / #248 fix.
 *
 * Unlike the unit test (which mocks `fetch`), this stands up an ACTUAL local
 * http.createServer and lets the REAL global `fetch` hit it over the loopback
 * interface. It reproduces the exact failure mode that broke the Instructions
 * Wizard: an upstream proxy (Cloudflare / nginx) returning a non-2xx response
 * whose body is an HTML error page with Content-Type text/html.
 *
 * Only the electron-backed module imports are stubbed (same as the unit test);
 * the network is genuinely exercised.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

// The module pulls in the model bridge + Gemini OAuth helper at load time, both
// of which need Electron. Passing opts.model bypasses the provider scan, so stub
// these to no-ops. NOTHING about the network is mocked.
vi.mock('@process/bridge/modelBridge', () => ({
  getMergedModelProviders: vi.fn(async () => []),
}));
vi.mock('@process/services/completion/geminiOAuth', () => ({
  googleAuthGeminiComplete: vi.fn(),
  isGoogleAuthGeminiAvailable: vi.fn(() => false),
}));

import { oneShotComplete, type PickedModel } from '../../src/process/services/completion/oneShot';
import type { IProvider } from '../../src/common/config/storage';

const HTML_502_BODY = '<html><head><title>502 Bad Gateway</title></head><body>Bad Gateway</body></html>';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
let server: http.Server;
let baseUrl: string;
let handler: Handler;

beforeAll(async () => {
  server = http.createServer((req, res) => handler(req, res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
});

const realFetch = globalThis.fetch;
beforeEach(() => {
  // Ensure the REAL fetch is in place (defend against cross-file leakage).
  globalThis.fetch = realFetch;
});
afterEach(() => {
  vi.restoreAllMocks();
});

// An openai-compatible provider whose baseUrl points at our local server. This
// is the same routing the Instructions Wizard uses for an OpenAI-style proxy.
const localOpenaiModel = (): PickedModel => ({
  provider: { platform: 'openai', apiKey: 'sk-test', baseUrl } as unknown as IProvider,
  modelId: 'gpt-4o-mini',
});

const localAnthropicModel = (): PickedModel => ({
  provider: { platform: 'anthropic', apiKey: 'sk-ant-test', baseUrl } as unknown as IProvider,
  modelId: 'claude-haiku',
});

describe('oneShotComplete - REAL local HTTP server (#244 / #248)', () => {
  it('openai-compatible: a real 502 HTML response yields a clean HTTP error, not "Unexpected token"', async () => {
    handler = (_req, res) => {
      res.writeHead(502, { 'Content-Type': 'text/html' });
      res.end(HTML_502_BODY);
    };

    const err = await oneShotComplete('hi', { model: localOpenaiModel() }).then(
      () => null,
      (e: Error) => e
    );
    expect(err).toBeInstanceOf(Error);
    expect(err!.message).toMatch(/HTTP 502/);
    expect(err!.message).not.toMatch(/Unexpected token/);
    expect(err!.message).not.toMatch(/is not valid JSON/);
  });

  it('anthropic: a real 502 HTML response yields a clean HTTP error', async () => {
    handler = (_req, res) => {
      res.writeHead(502, { 'Content-Type': 'text/html' });
      res.end(HTML_502_BODY);
    };

    const err = await oneShotComplete('hi', { model: localAnthropicModel() }).then(
      () => null,
      (e: Error) => e
    );
    expect(err).toBeInstanceOf(Error);
    expect(err!.message).toMatch(/HTTP 502/);
    expect(err!.message).not.toMatch(/Unexpected token/);
  });

  it('openai-compatible: a real 200 JSON response still parses correctly', async () => {
    handler = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: 'real network hello' } }] }));
    };

    await expect(oneShotComplete('hi', { model: localOpenaiModel() })).resolves.toBe('real network hello');
  });

  it('openai-compatible: a real 401 JSON error body surfaces "<status>: <message>"', async () => {
    handler = (_req, res) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'invalid key' } }));
    };

    await expect(oneShotComplete('hi', { model: localOpenaiModel() })).rejects.toThrow('401: invalid key');
  });
});
