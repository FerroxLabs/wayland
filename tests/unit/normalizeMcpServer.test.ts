/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { normalizeMcpServerForSpawn, resolveFilesystemAllowedDirs } from '@/common/mcp/normalizeMcpServer';

const HOME = '/Users/tester';

function fsServer(args: string[], env?: Record<string, string>): IMcpServer {
  return {
    id: 'fs-1',
    name: 'io.modelcontextprotocol-server-filesystem',
    enabled: true,
    transport: { type: 'stdio', command: 'npx', args, env },
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
  };
}

const FS = '@modelcontextprotocol/server-filesystem';

describe('resolveFilesystemAllowedDirs', () => {
  it('defaults to the home directory when nothing is provided', () => {
    expect(resolveFilesystemAllowedDirs([], undefined, HOME)).toEqual([HOME]);
    expect(resolveFilesystemAllowedDirs([], '', HOME)).toEqual([HOME]);
  });

  it('splits a comma-separated ALLOWED_DIRS env value into positional dirs', () => {
    expect(resolveFilesystemAllowedDirs([], '/a, /b ,/c', HOME)).toEqual(['/a', '/b', '/c']);
  });

  it('expands a leading ~ to the home directory (separator inferred from home, not the OS)', () => {
    // joinUnderHome infers the separator from the home string so the result is
    // platform-independent - a POSIX home always yields POSIX-joined paths, even
    // when the test runs on Windows (do NOT use node:path.join here, it would
    // produce `\` on Windows and diverge from the impl).
    expect(resolveFilesystemAllowedDirs([], '~,~/docs', HOME)).toEqual([HOME, `${HOME}/docs`]);
  });

  it('expands ~ against a Windows-style home using a backslash separator', () => {
    const WIN_HOME = 'C:\\Users\\me';
    expect(resolveFilesystemAllowedDirs([], '~\\docs', WIN_HOME)).toEqual([`${WIN_HOME}\\docs`]);
  });

  it('drops tokens beginning with "-" (argument-injection guard)', () => {
    expect(resolveFilesystemAllowedDirs([], '--flag,/safe', HOME)).toEqual(['/safe']);
  });

  it('dedupes while preserving order and merges existing positional dirs first', () => {
    expect(resolveFilesystemAllowedDirs(['/proj'], '/proj,/other', HOME)).toEqual(['/proj', '/other']);
  });
});

describe('normalizeMcpServerForSpawn (filesystem #448)', () => {
  it('injects the home directory as a positional arg when none is set', () => {
    const out = normalizeMcpServerForSpawn(fsServer([FS]), HOME);
    expect(out.transport).toMatchObject({ command: 'npx', args: [FS, HOME] });
  });

  it('detects a version-pinned package id', () => {
    const out = normalizeMcpServerForSpawn(fsServer([`${FS}@0.6.2`]), HOME);
    expect((out.transport as { args: string[] }).args).toEqual([`${FS}@0.6.2`, HOME]);
  });

  it('moves ALLOWED_DIRS env into positional args and removes the dead env var', () => {
    const out = normalizeMcpServerForSpawn(fsServer([FS], { ALLOWED_DIRS: '/a,/b', OTHER: 'keep' }), HOME);
    const t = out.transport as { args: string[]; env: Record<string, string> };
    expect(t.args).toEqual([FS, '/a', '/b']);
    expect(t.env).toEqual({ OTHER: 'keep' });
    expect(t.env.ALLOWED_DIRS).toBeUndefined();
  });

  it('preserves directories already present as positional args', () => {
    const out = normalizeMcpServerForSpawn(fsServer([FS, '/existing']), HOME);
    expect((out.transport as { args: string[] }).args).toEqual([FS, '/existing']);
  });

  it('never mutates the input record', () => {
    const input = fsServer([FS], { ALLOWED_DIRS: '/a' });
    const snapshot = JSON.stringify(input);
    normalizeMcpServerForSpawn(input, HOME);
    expect(JSON.stringify(input)).toEqual(snapshot);
  });

  it('leaves a non-filesystem stdio server unchanged', () => {
    const other: IMcpServer = {
      ...fsServer(['some-other-package']),
      name: 'other',
    };
    expect(normalizeMcpServerForSpawn(other, HOME)).toBe(other);
  });

  it('leaves an http server unchanged', () => {
    const http: IMcpServer = {
      id: 'h1',
      name: 'hosted',
      enabled: true,
      transport: { type: 'streamable_http', url: 'https://example.com/mcp' },
      createdAt: 0,
      updatedAt: 0,
      originalJson: '{}',
    };
    expect(normalizeMcpServerForSpawn(http, HOME)).toBe(http);
  });
});
