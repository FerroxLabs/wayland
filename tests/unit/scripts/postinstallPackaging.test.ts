/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

type InstallBridgeDeps = (options: {
  bridgeDir: string;
  runCommand: (command: string, options?: unknown) => unknown;
  strict: boolean;
  verifyDependencies: (bridgeDir: string) => void;
}) => void;

type VerifyBridgeDependencies = (bridgeDir: string) => void;

type PostinstallModule = (() => void) & {
  installBridgeDeps?: InstallBridgeDeps;
  verifyBridgeDependencies?: VerifyBridgeDependencies;
};

const require = createRequire(import.meta.url);
const postinstall = require('../../../scripts/postinstall.js') as PostinstallModule;
const tempDirs: string[] = [];

const makeBridge = (dependencies: Record<string, string>): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wayland-postinstall-'));
  tempDirs.push(dir);
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture-bridge', private: true, type: 'module', dependencies }),
    'utf8'
  );
  return dir;
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('postinstall packaging mode', () => {
  it('keeps a bridge install failure non-fatal for an ordinary developer install', () => {
    const installBridgeDeps = postinstall.installBridgeDeps;
    expect(installBridgeDeps).toBeTypeOf('function');
    const bridgeDir = makeBridge({ fixture: '1.0.0' });
    const verifyDependencies = vi.fn();
    const runCommand = vi.fn((command: string) => {
      if (command !== 'bun --version') throw new Error('offline');
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => installBridgeDeps?.({ bridgeDir, runCommand, strict: false, verifyDependencies })).not.toThrow();
    expect(verifyDependencies).not.toHaveBeenCalled();
  });

  it('fails a packaged build when bridge dependencies cannot be installed', () => {
    const installBridgeDeps = postinstall.installBridgeDeps;
    expect(installBridgeDeps).toBeTypeOf('function');
    const bridgeDir = makeBridge({ fixture: '1.0.0' });
    const runCommand = vi.fn((command: string) => {
      if (command !== 'bun --version') throw new Error('offline');
    });

    expect(() => installBridgeDeps?.({ bridgeDir, runCommand, strict: true, verifyDependencies: vi.fn() })).toThrow(
      /strict packaging/i
    );
  });

  it('uses the frozen bridge lockfile and verifies imports in packaged builds', () => {
    const installBridgeDeps = postinstall.installBridgeDeps;
    expect(installBridgeDeps).toBeTypeOf('function');
    const bridgeDir = makeBridge({ fixture: '1.0.0' });
    const runCommand = vi.fn();
    const verifyDependencies = vi.fn();

    installBridgeDeps?.({ bridgeDir, runCommand, strict: true, verifyDependencies });

    expect(runCommand).toHaveBeenCalledWith(
      'bun install --frozen-lockfile',
      expect.objectContaining({ cwd: bridgeDir })
    );
    expect(verifyDependencies).toHaveBeenCalledWith(bridgeDir);
  });

  it('imports every declared bridge dependency and rejects a missing dependency', () => {
    const verifyBridgeDependencies = postinstall.verifyBridgeDependencies;
    expect(verifyBridgeDependencies).toBeTypeOf('function');
    const bridgeDir = makeBridge({ fixture: '1.0.0' });
    const fixtureDir = path.join(bridgeDir, 'node_modules', 'fixture');
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      path.join(fixtureDir, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0', type: 'module', exports: './index.js' }),
      'utf8'
    );
    writeFileSync(path.join(fixtureDir, 'index.js'), 'export const ready = true;\n', 'utf8');

    expect(() => verifyBridgeDependencies?.(bridgeDir)).not.toThrow();

    writeFileSync(
      path.join(bridgeDir, 'package.json'),
      JSON.stringify({ name: 'fixture-bridge', private: true, type: 'module', dependencies: { missing: '1.0.0' } }),
      'utf8'
    );
    expect(() => verifyBridgeDependencies?.(bridgeDir)).toThrow();
  });
});
