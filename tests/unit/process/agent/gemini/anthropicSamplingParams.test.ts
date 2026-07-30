import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// Deep import: the package publishes no `exports` map, only `main`.
// This is the file patched by patches/@office-ai%2Faioncli-core@0.30.6.patch.
import { AnthropicContentGenerator } from '@office-ai/aioncli-core/dist/src/core/anthropicContentGenerator.js';

/**
 * Regression guard for the `top_p is deprecated for this model` 400 that broke
 * every Claude 5 request through the gemini agent.
 *
 * gemini-cli's defaultModelConfigs.js applies Gemini-oriented sampling defaults
 * to every model (`chat-base`: temperature 1 / topP 0.95 / topK 64; `base`:
 * temperature 0 / topP 1). Those land in `request.config`, and the Anthropic
 * adapter's buildSamplingParameters() falls back to them, so they reached the
 * wire even though nothing in Wayland's own src/ sets topP.
 *
 * Claude Opus 4.7 and newer reject a non-default temperature, top_p or top_k.
 *
 * This drives the real Anthropic SDK against a local stub rather than mocking
 * it: the vendored package resolves its OWN nested copy of @anthropic-ai/sdk,
 * so vi.mock('@anthropic-ai/sdk') would mock the hoisted copy and miss the one
 * actually imported. Asserting on the real wire body also catches anything the
 * SDK itself would add.
 */

let server: Server;
let baseURL: string;
let lastBody: Record<string, unknown> | undefined;

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      lastBody = JSON.parse(raw) as Record<string, unknown>;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          id: 'msg_test',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-5',
          content: [{ type: 'text', text: 'ok' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** Only getContentGeneratorConfig() is read off the Config object. */
const fakeConfig = (samplingParams?: Record<string, unknown>) =>
  ({ getContentGeneratorConfig: () => ({ samplingParams }) }) as never;

async function send(requestConfig: Record<string, unknown>, samplingParams?: Record<string, unknown>) {
  process.env['ANTHROPIC_BASE_URL'] = baseURL;
  lastBody = undefined;
  const generator = new AnthropicContentGenerator('sk-ant-test', 'claude-sonnet-5', fakeConfig(samplingParams));
  await generator.generateContent(
    { contents: [{ role: 'user', parts: [{ text: 'hi' }] }], config: requestConfig },
    'prompt-id'
  );
  expect(lastBody, 'stub server captured no request body').toBeDefined();
  return lastBody!;
}

describe('AnthropicContentGenerator sampling parameters', () => {
  it('does not forward gemini-cli chat-base defaults (temperature 1 / topP 0.95 / topK 64)', async () => {
    const body = await send({ temperature: 1, topP: 0.95, topK: 64 });
    expect(body).not.toHaveProperty('top_p');
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_k');
  });

  it('does not forward gemini-cli base defaults (temperature 0 / topP 1)', async () => {
    // Dropping only top_p would leave temperature 0 here, which Claude 5 also rejects.
    const body = await send({ temperature: 0, topP: 1 });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
  });

  it('does not forward explicit samplingParams either', async () => {
    // buildSamplingParameters() prefers samplingParams over request.config, so
    // both sides of that resolution have to be suppressed.
    const body = await send({}, { temperature: 0.3, top_p: 0.5 });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
  });

  it('still sends the fields the adapter is responsible for', async () => {
    const body = await send({ maxOutputTokens: 1234, topP: 0.95, systemInstruction: 'be brief' });
    expect(body.model).toBe('claude-sonnet-5');
    expect(body.max_tokens).toBe(1234);
    expect(Array.isArray(body.messages)).toBe(true);
  });

  it('defaults max_tokens when the request supplies none', async () => {
    const body = await send({ topP: 0.95 });
    expect(body.max_tokens).toBe(4096);
  });
});
