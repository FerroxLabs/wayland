/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so vi.mock factories can access them
const { handlers, mockModelsList } = vi.hoisted(() => {
  const handlers: Record<string, (...args: any[]) => any> = {};
  const mockModelsList = vi.fn();
  return { handlers, mockModelsList };
});

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));

// Auto-create channels on access via Proxy
vi.mock('@/common', () => {
  const mode = new Proxy(
    {},
    {
      get(_target, prop) {
        return {
          provider: vi.fn((fn: (...args: any[]) => any) => {
            handlers[prop as string] = fn;
          }),
          emit: vi.fn(),
          invoke: vi.fn(),
        };
      },
    }
  );
  return { ipcBridge: { mode } };
});

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(() => ({})), set: vi.fn() },
}));

vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getExtensionModelList: vi.fn(async () => []) })) },
}));

vi.mock('openai', () => {
  class MockOpenAI {
    models = { list: mockModelsList };
  }
  return { default: MockOpenAI };
});

import { initModelBridge } from '../../src/process/bridge/modelBridge';

beforeEach(() => {
  vi.clearAllMocks();
  mockModelsList.mockReset();
  initModelBridge();
});

describe('fetchModelList', () => {
  const fetchModelList = (args: any) => handlers.fetchModelList(args);

  describe('apiKey validation (Fixes ELECTRON-6X, ELECTRON-5, ELECTRON-1A)', () => {
    it('should return error when apiKey is empty string', async () => {
      const result = await fetchModelList({
        base_url: 'https://api.openai.com/v1',
        api_key: '',
        try_fix: false,
      });

      expect(result.success).toBe(false);
      expect(result.msg).toContain('API key is required');
    });

    it('should return error when apiKey is undefined', async () => {
      const result = await fetchModelList({
        base_url: 'https://api.openai.com/v1',
        api_key: undefined,
        try_fix: false,
      });

      expect(result.success).toBe(false);
      expect(result.msg).toContain('API key is required');
    });

    it('should proceed when apiKey is provided', async () => {
      mockModelsList.mockResolvedValueOnce({ data: [{ id: 'gpt-4' }] });

      const result = await fetchModelList({
        base_url: 'https://api.openai.com/v1',
        api_key: 'sk-test-key',
        try_fix: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.mode).toContain('gpt-4');
    });
  });

  describe('URL validation (Fixes ELECTRON-6Z, ELECTRON-G)', () => {
    it('should return error for invalid URL when try_fix is true', async () => {
      mockModelsList.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await fetchModelList({
        base_url: 'not-a-valid-url',
        api_key: 'sk-test-key',
        try_fix: true,
      });

      expect(result.success).toBe(false);
      // The SSRF base_url validator now rejects a malformed URL up front (before
      // the SDK call), with a clearer message than the old connection error.
      expect(result.msg).toContain('Invalid base URL');
    });

    it('should return original error when try_fix is false', async () => {
      mockModelsList.mockRejectedValueOnce(new Error('Connection refused'));

      // Use a valid (loopback, IP-literal so no DNS lookup) base_url that passes
      // the SSRF validator, so try_fix=false still exercises original-error
      // propagation from the SDK rather than the up-front URL rejection.
      const result = await fetchModelList({
        base_url: 'http://127.0.0.1:9999/v1',
        api_key: 'sk-test-key',
        try_fix: false,
      });

      expect(result.success).toBe(false);
      expect(result.msg).toBe('Connection refused');
    });
  });
});
