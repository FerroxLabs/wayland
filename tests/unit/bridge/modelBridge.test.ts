/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
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

const { handlers, mockModelsList, mockDnsLookup } = vi.hoisted(() => {
  return {
    handlers: {} as Record<string, Handler>,
    mockModelsList: vi.fn(),
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
      // Simulate real OpenAI SDK behavior: throw when apiKey is undefined or whitespace-only
      const key = config.apiKey;
      if (key === undefined || key.trim() === '') {
        throw new Error(
          'Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.'
        );
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

// The SSRF guard resolves non-literal hostnames (DNS-rebinding defense). Mock
// it so these tests never hit the network; default to a benign public address.
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

describe('modelBridge fetchModelList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModelsList.mockReset();
    mockDnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    initModelBridge();
  });

  it('fetches the LIVE MiniMax model list from /v1/models (incl. MiniMax-M3)', async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ id: 'MiniMax-M3' }, { id: 'MiniMax-M2.7-highspeed' }, { id: 'MiniMax-M2.5' }] }),
    })) as unknown as typeof fetch;
    try {
      const fetchModelList = getFetchModelListHandler();
      const result = await fetchModelList({ base_url: 'https://api.minimax.io/v1', api_key: 'minimax-key' });
      expect(result).toEqual({
        success: true,
        data: { mode: ['MiniMax-M3', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5'] },
      });
      // It hit /v1/models with a bearer token, not the OpenAI SDK.
      const calledUrl = (global.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0];
      expect(calledUrl).toBe('https://api.minimax.io/v1/models');
      expect(mockModelsList).not.toHaveBeenCalled();
    } finally {
      global.fetch = origFetch;
    }
  });

  it('falls back to the current static MiniMax list when /v1/models fails (dead models gone)', async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, statusText: 'err', json: async () => ({}) })) as unknown as typeof fetch;
    try {
      const fetchModelList = getFetchModelListHandler();
      const result = await fetchModelList({ base_url: 'https://api.minimax.io/v1', api_key: 'minimax-key' });
      expect(result.success).toBe(true);
      expect(result.data?.mode).toContain('MiniMax-M3'); // current generation present in fallback
      expect(result.data?.mode).not.toContain('M2-her'); // stale model never returns
      expect(result.data?.mode).not.toContain('MiniMax-M2.1-lightning');
    } finally {
      global.fetch = origFetch;
    }
  });

  it('fetches the LIVE DashScope coding-plan list from /v1/models (incl. qwen3.7-plus)', async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 'qwen3-coder-plus' }, { id: 'qwen3.7-plus' }, { id: 'glm-5' }] }),
    })) as unknown as typeof fetch;
    try {
      const fetchModelList = getFetchModelListHandler();
      const result = await fetchModelList({ base_url: 'https://coding.dashscope.aliyuncs.com/v1', api_key: 'ds-key' });
      expect(result).toEqual({ success: true, data: { mode: ['qwen3-coder-plus', 'qwen3.7-plus', 'glm-5'] } });
      const calledUrl = (global.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0];
      expect(calledUrl).toBe('https://coding.dashscope.aliyuncs.com/v1/models');
    } finally {
      global.fetch = origFetch;
    }
  });

  it('returns an auth error for an invalid DashScope key (401 preserved)', async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    })) as unknown as typeof fetch;
    try {
      const fetchModelList = getFetchModelListHandler();
      const result = await fetchModelList({ base_url: 'https://coding.dashscope.aliyuncs.com/v1', api_key: 'bad' });
      expect(result.success).toBe(false);
      expect(result.msg).toBe('Invalid API key');
    } finally {
      global.fetch = origFetch;
    }
  });

  it('falls back to the current static DashScope list on a network failure (incl. the new qwen3.7-plus)', async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    try {
      const fetchModelList = getFetchModelListHandler();
      const result = await fetchModelList({ base_url: 'https://coding.dashscope.aliyuncs.com/v1', api_key: 'ds-key' });
      expect(result.success).toBe(true);
      expect(result.data?.mode).toContain('qwen3.7-plus');
      expect(result.data?.mode).toContain('qwen3.6-plus');
    } finally {
      global.fetch = origFetch;
    }
  });

  it('returns error when apiKey is empty for new-api platform (Fixes ELECTRON-6X)', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'https://new-api.example.com',
      api_key: '',
      platform: 'new-api',
    });

    expect(result.success).toBe(false);
    expect(result.msg).toContain('API key is required');
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('returns error when apiKey is undefined for new-api platform (Fixes ELECTRON-6X)', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'https://new-api.example.com',
      api_key: undefined as unknown as string,
      platform: 'new-api',
    });

    expect(result.success).toBe(false);
    expect(result.msg).toContain('API key is required');
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('returns error when apiKey is whitespace-only for new-api platform (Fixes ELECTRON-6X)', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'https://new-api.example.com',
      api_key: '   ',
      platform: 'new-api',
    });

    expect(result.success).toBe(false);
    expect(result.msg).toContain('API key is required');
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('returns error when apiKey is whitespace-only for default OpenAI path (Fixes ELECTRON-6X)', async () => {
    const fetchModelList = getFetchModelListHandler();

    const result = await fetchModelList({
      base_url: 'https://api.openai.com/v1',
      api_key: ' \t\n ',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(result.msg).toContain('API key is required');
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('catches OpenAI constructor errors instead of unhandled rejection (Fixes ELECTRON-6X)', async () => {
    const fetchModelList = getFetchModelListHandler();

    // Even if apiKey somehow passes the guard, the constructor error should be caught
    const result = await fetchModelList({
      base_url: 'https://api.openai.com/v1',
      api_key: undefined as unknown as string,
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('returns the OpenAI-compatible result for non-MiniMax URLs', async () => {
    mockModelsList.mockResolvedValue({
      data: [{ id: 'gpt-4o-mini' }],
    });

    const fetchModelList = getFetchModelListHandler();
    const result = await fetchModelList({
      base_url: 'https://api.openai.com/v1',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(mockModelsList).toHaveBeenCalledOnce();
    expect(result).toEqual({
      success: true,
      data: {
        mode: ['gpt-4o-mini'],
      },
    });
  });

  it('returns an error when a non-MiniMax OpenAI-compatible provider fails', async () => {
    mockModelsList.mockRejectedValue(new Error('upstream unavailable'));

    const fetchModelList = getFetchModelListHandler();
    const result = await fetchModelList({
      base_url: 'https://example.com/v1',
      api_key: 'sk-test',
      try_fix: false,
    });

    expect(mockModelsList).toHaveBeenCalledOnce();
    expect(result).toEqual({
      success: false,
      msg: 'upstream unavailable',
    });
  });

  // ── Keyless local backends (Ollama / LM Studio / llama.cpp) ──────────────
  it('lists models for a LOCAL endpoint with an empty key (placeholder injected)', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'llama3:latest' }, { id: 'qwen2.5:7b' }] });

    const fetchModelList = getFetchModelListHandler();
    const result = await fetchModelList({
      base_url: 'http://127.0.0.1:11434/v1',
      api_key: '',
      try_fix: false,
    });

    // The OpenAI mock throws on an empty/whitespace key; reaching models.list()
    // proves a non-empty placeholder was injected for the local host.
    expect(mockModelsList).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true, data: { mode: ['llama3:latest', 'qwen2.5:7b'] } });
  });

  it('lists models for a localhost endpoint with no key (LM Studio style)', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'local-model' }] });

    const fetchModelList = getFetchModelListHandler();
    const result = await fetchModelList({
      base_url: 'http://localhost:1234/v1',
      api_key: undefined as unknown as string,
      try_fix: false,
    });

    expect(result).toEqual({ success: true, data: { mode: ['local-model'] } });
  });

  it('STILL errors for a CLOUD endpoint with an empty key (no keyless regression)', async () => {
    const fetchModelList = getFetchModelListHandler();
    const result = await fetchModelList({
      base_url: 'https://api.openai.com/v1',
      api_key: '',
      try_fix: false,
    });

    expect(result.success).toBe(false);
    expect(result.msg).toContain('API key is required');
    expect(mockModelsList).not.toHaveBeenCalled();
  });

  it('lists models for a LOCAL new-api endpoint with an empty key', async () => {
    mockModelsList.mockResolvedValue({ data: [{ id: 'local-1' }] });

    const fetchModelList = getFetchModelListHandler();
    const result = await fetchModelList({
      base_url: 'http://127.0.0.1:11434',
      api_key: '',
      platform: 'new-api',
    });

    expect(mockModelsList).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true, data: { mode: ['local-1'] } });
  });
});
