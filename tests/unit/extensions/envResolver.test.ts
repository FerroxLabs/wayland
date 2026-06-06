/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WAYLAND_STRICT_ENV_ENV } from '../../../src/process/extensions/constants';
import {
  UndefinedEnvVariableError,
  clearStrictModeCache,
  isGlobalStrictMode,
  resolveEnvInObject,
  resolveEnvTemplates,
} from '../../../src/process/extensions/resolvers/utils/envResolver';

describe('extensions/envResolver', () => {
  let envSnapshot: NodeJS.ProcessEnv;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    envSnapshot = { ...process.env };
    clearStrictModeCache();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    const currentKeys = Object.keys(process.env);
    for (const key of currentKeys) {
      if (!(key in envSnapshot)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(envSnapshot)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    clearStrictModeCache();
    warnSpy.mockRestore();
  });

  it('undefined variable in non-strict mode should be replaced with an empty string', () => {
    delete process.env.MISSING_VALUE;

    const result = resolveEnvTemplates('token=${env:MISSING_VALUE}', { strictMode: false });

    expect(result).toBe('token=');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('undefined variable in strict mode should throw UndefinedEnvVariableError', () => {
    delete process.env.REQUIRED_TOKEN;

    expect(() => resolveEnvTemplates('${env:REQUIRED_TOKEN}', { strictMode: true })).toThrow(UndefinedEnvVariableError);
  });

  it('resolveEnvInObject should recursively resolve templates in objects and arrays', () => {
    process.env.API_KEY = 'abc123';
    process.env.REGION = 'ap-guangzhou';

    const input = {
      headers: { authorization: 'Bearer ${env:API_KEY}' },
      tags: ['${env:REGION}', 'stable'],
      nested: {
        enabled: true,
        endpoint: 'https://${env:REGION}.example.com',
      },
    };

    const result = resolveEnvInObject(input, { strictMode: true });

    expect(result).toEqual({
      headers: { authorization: 'Bearer abc123' },
      tags: ['ap-guangzhou', 'stable'],
      nested: {
        enabled: true,
        endpoint: 'https://ap-guangzhou.example.com',
      },
    });
  });

  it('global strict mode should be cached and invalidated via clearStrictModeCache', () => {
    process.env[WAYLAND_STRICT_ENV_ENV] = '1';
    clearStrictModeCache();

    expect(isGlobalStrictMode()).toBe(true);

    process.env[WAYLAND_STRICT_ENV_ENV] = '0';
    // still uses cached value
    expect(isGlobalStrictMode()).toBe(true);

    clearStrictModeCache();
    expect(isGlobalStrictMode()).toBe(false);
  });
});
