/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SSRF guard regression tests for fetchModelList (finding RT-F2-02).
 *
 * A renderer-supplied `base_url` must not be allowed to reach cloud-metadata /
 * link-local endpoints or use non-http schemes. Crucially, local / self-hosted
 * model backends (Ollama, LM Studio, LAN boxes) MUST keep working - loopback and
 * RFC1918 ranges are explicitly allowed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type Handler = (...args: unknown[]) => unknown | Promise<unknown>;

type FetchModelListArgs = {
  base_url?: string;
  api_key: string;
  try_fix?: boolean;
  platform?: string;
};

type FetchModelListResponse = {
  success: boolean;
  msg?: string;
  data?: { mode: Array<string | { id: string; name: string }>; fix_base_url?: string };
};

const { handlers, mockModelsList, mockFetch, mockDnsLookup } = vi.hoisted(() => {
  return {
    handlers: {} as Record<string, Handler>,
    mockModelsList: vi.fn(),
    mockFetch: vi.fn(),
    mockDnsLookup: vi.fn(),
  };
});

function makeChannel(name: string) {
  return {
    provider: vi.fn((fn: Handler) => {
      handlers[name] = fn;
    }),
    emit: vi.fn(),
    invoke: vi.fn(),
  };
}

vi.mock('@/common', () => ({
  ipcBridge: {
    mode: {
      fetchModelList: makeChannel('fetchModelList'),
      saveModelConfig: makeChannel('saveModelConfig'),
      getModelConfig: makeChannel('getModelConfig'),
      detectProtocol: makeChannel('detectProtocol'),
    },
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor(config: { apiKey?: string }) {
      const key = config.apiKey;
      if (key === undefined || key.trim() === '') {
        throw new Error('Missing credentials.');
      }
    }

    models = {
      list: mockModelsList,
    };
  },
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    set: vi.fn(async () => undefined),
    get: vi.fn(async () => []),
  },
}));

vi.mock('@process/extensions', () => ({
  ExtensionRegistry: {
    getInstance: vi.fn(() => ({
      getModelProviders: vi.fn(() => []),
    })),
  },
}));

vi.mock('@aws-sdk/client-bedrock', () => ({
  BedrockClient: function MockBedrockClient() {},
  ListInferenceProfilesCommand: function MockListInferenceProfilesCommand() {},
}));

vi.mock('node:dns', () => ({
  promises: {
    lookup: mockDnsLookup,
  },
}));

import { initModelBridge } from '../../../src/process/bridge/modelBridge';

function getFetchModelListHandler() {
  const handler = handlers.fetchModelList;
  expect(handler).toBeTypeOf('function');
  return handler as (args: FetchModelListArgs) => Promise<FetchModelListResponse>;
}

describe('modelBridge fetchModelList - SSRF guard (RT-F2-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModelsList.mockReset();
    mockFetch.mockReset();
    // Spy on global fetch so we can assert it is NEVER called on a blocked URL.
    vi.stubGlobal('fetch', mockFetch);
    // Default: hostnames resolve to a benign public address. Individual tests
    // override this to simulate DNS rebinding.
    mockDnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    initModelBridge();
  });

  it('REJECTS the AWS metadata IP 169.254.169.254 without fetching (OpenAI path)', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://169.254.169.254/latest/meta-data/',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(result.msg).toMatch(/blocked|link-local|metadata/i);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('REJECTS a file:// scheme without fetching', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'file:///etc/passwd',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(result.msg).toMatch(/scheme|http/i);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('REJECTS the GCP metadata hostname (anthropic path, custom base_url)', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://metadata.google.internal',
      api_key: 'sk-test',
      platform: 'anthropic',
    });

    expect(result.success).toBe(false);
    expect(result.msg).toMatch(/blocked|metadata/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('REJECTS the bare "metadata" hostname', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://metadata/computeMetadata/v1/',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(result.msg).toMatch(/blocked|metadata/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('REJECTS a malformed URL', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://[not a url',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('ALLOWS localhost (Ollama) - local models must keep working', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'llama3' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://localhost:11434/v1',
      api_key: 'ollama',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(result.data?.mode).toEqual(['llama3']);
    expect(mockModelsList).toHaveBeenCalledOnce();
  });

  it('ALLOWS 127.0.0.1 (LM Studio) - loopback must keep working', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'local-model' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://127.0.0.1:1234/v1',
      api_key: 'lm-studio',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockModelsList).toHaveBeenCalledOnce();
  });

  it('ALLOWS a RFC1918 LAN address (192.168.x.x) - self-hosted must keep working', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'lan-model' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://192.168.1.50:8080/v1',
      api_key: 'lan-key',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockModelsList).toHaveBeenCalledOnce();
  });

  it('ALLOWS https://api.openai.com', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'gpt-4o-mini' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'https://api.openai.com/v1',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockModelsList).toHaveBeenCalledOnce();
  });

  // GAP 1 - IPv4-mapped / NAT64-translated IPv6 that reaches the metadata IP.
  // Node's URL parser normalizes the dotted-quad tail to hex, so all three of
  // these collapse onto the metadata address 169.254.169.254 and must be
  // rejected WITHOUT any DNS lookup or fetch (they are IP literals).
  for (const host of ['[::ffff:169.254.169.254]', '[::ffff:a9fe:a9fe]', '[64:ff9b::169.254.169.254]']) {
    it(`REJECTS IPv4-mapped/NAT64 metadata literal http://${host}/ without fetching`, async () => {
      const fetchModelList = getFetchModelListHandler();

      const result = await fetchModelList({
        base_url: `http://${host}/`,
        api_key: 'sk-test',
        try_fix: false,
      });

      expect(result.success).toBe(false);
      expect(result.msg).toMatch(/blocked|metadata|mapped|translated/i);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockModelsList).not.toHaveBeenCalled();
      expect(mockDnsLookup).not.toHaveBeenCalled();
    });
  }

  it('ALLOWS the IPv6 loopback literal [::1] - local models must keep working', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'local-v6' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://[::1]:11434/v1',
      api_key: 'local',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockModelsList).toHaveBeenCalledOnce();
    // IP literal -> no DNS lookup.
    expect(mockDnsLookup).not.toHaveBeenCalled();
  });

  it('ALLOWS localhost:11434 without a DNS lookup (resolves locally)', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'llama3' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://localhost:11434/v1',
      api_key: 'ollama',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockModelsList).toHaveBeenCalledOnce();
    expect(mockDnsLookup).not.toHaveBeenCalled();
  });

  it('ALLOWS 192.168.1.50:8080 (RFC1918 literal) without a DNS lookup', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'lan-model' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://192.168.1.50:8080/v1',
      api_key: 'lan-key',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockModelsList).toHaveBeenCalledOnce();
    expect(mockDnsLookup).not.toHaveBeenCalled();
  });

  // GAP 2 - DNS rebinding to metadata.
  it('REJECTS a hostname that RESOLVES to the metadata IP 169.254.169.254 (DNS rebinding)', async () => {
    mockDnsLookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://rebind.evil.example/v1',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(result.msg).toMatch(/blocked|metadata|resolve/i);
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('ALLOWS a hostname that RESOLVES to 127.0.0.1 - local models behind a hostname must keep working', async () => {
    mockDnsLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    mockModelsList.mockResolvedValue({ data: [{ id: 'local-via-host' }] });
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'http://my-ollama.local/v1',
      api_key: 'ollama',
      try_fix: false,
    });

    expect(result.success).toBe(true);
    expect(mockDnsLookup).toHaveBeenCalled();
    expect(mockModelsList).toHaveBeenCalledOnce();
  });
});
