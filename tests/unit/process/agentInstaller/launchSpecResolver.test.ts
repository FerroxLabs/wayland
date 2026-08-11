/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isAcpLaunchSpec } from '@/common/types/acpTypes';
import {
  LaunchSpecUnresolvedError,
  resolveLaunchSpecWith,
  resolvePackageDir,
  resolveTargetTriple,
} from '@process/services/agentInstaller/launchSpecResolver';

const JS_RUNTIME = '/opt/wayland/bun';

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** Lay down `<prefix>/node_modules/<pkg>/package.json` with the given bin field. */
function writePackage(prefix: string, npmPackage: string, bin: unknown): string {
  const pkgDir = resolvePackageDir(prefix, npmPackage);
  writeFileTree(path.join(pkgDir, 'package.json'), JSON.stringify({ name: npmPackage, version: '1.0.0', bin }));
  return pkgDir;
}

describe('resolveTargetTriple', () => {
  it('maps the six shipped platform/arch pairs', () => {
    expect(resolveTargetTriple('darwin', 'arm64')).toBe('aarch64-apple-darwin');
    expect(resolveTargetTriple('darwin', 'x64')).toBe('x86_64-apple-darwin');
    expect(resolveTargetTriple('win32', 'arm64')).toBe('aarch64-pc-windows-msvc');
    expect(resolveTargetTriple('win32', 'x64')).toBe('x86_64-pc-windows-msvc');
    expect(resolveTargetTriple('linux', 'arm64')).toBe('aarch64-unknown-linux-musl');
    expect(resolveTargetTriple('linux', 'x64')).toBe('x86_64-unknown-linux-musl');
  });

  it('returns null for an unmapped pair', () => {
    expect(resolveTargetTriple('freebsd', 'x64')).toBeNull();
    expect(resolveTargetTriple('darwin', 'ia32')).toBeNull();
  });
});

describe('resolveLaunchSpecWith', () => {
  let prefix: string;

  beforeEach(() => {
    prefix = mkdtempSync(path.join(os.tmpdir(), 'wl-launchspec-'));
  });

  afterEach(() => {
    rmSync(prefix, { recursive: true, force: true });
  });

  it('prefers a native vendor binary in the platform-specific sibling package', () => {
    // Mirrors @openai/codex@0.147.0: the JS shim package holds only bin/codex.js,
    // the Mach-O executable ships in @openai/codex-darwin-arm64.
    const pkgDir = writePackage(prefix, '@openai/codex', { codex: 'bin/codex.js' });
    writeFileTree(path.join(pkgDir, 'bin', 'codex.js'), '#!/usr/bin/env node\n');

    const native = path.join(`${pkgDir}-darwin-arm64`, 'vendor', 'aarch64-apple-darwin', 'bin', 'codex');
    writeFileTree(native, 'MACHO');
    chmodSync(native, 0o755);

    const spec = resolveLaunchSpecWith({
      prefix,
      npmPackage: '@openai/codex',
      platform: 'darwin',
      arch: 'arm64',
      jsRuntimeCommand: JS_RUNTIME,
    });

    expect(isAcpLaunchSpec(spec)).toBe(true);
    expect(spec).toEqual({ command: native, args: [] });
    // The JS entry existed and was still not chosen, and the .bin shim is never used.
    expect(spec.command).not.toContain('node_modules/.bin');
    expect(spec.command).not.toBe(JS_RUNTIME);
  });

  it('prefers a native vendor binary nested inside the package itself', () => {
    const pkgDir = writePackage(prefix, '@openai/codex', { codex: 'bin/codex.js' });
    writeFileTree(path.join(pkgDir, 'bin', 'codex.js'), '#!/usr/bin/env node\n');

    const native = path.join(pkgDir, 'vendor', 'aarch64-apple-darwin', 'codex', 'codex');
    writeFileTree(native, 'MACHO');
    chmodSync(native, 0o755);

    expect(
      resolveLaunchSpecWith({
        prefix,
        npmPackage: '@openai/codex',
        platform: 'darwin',
        arch: 'arm64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toEqual({ command: native, args: [] });
  });

  it('picks the .exe native binary on win32', () => {
    const pkgDir = writePackage(prefix, '@openai/codex', { codex: 'bin/codex.js' });
    writeFileTree(path.join(pkgDir, 'bin', 'codex.js'), '#!/usr/bin/env node\n');

    const native = path.join(`${pkgDir}-win32-arm64`, 'vendor', 'aarch64-pc-windows-msvc', 'bin', 'codex.exe');
    writeFileTree(native, 'PE32+');

    expect(
      resolveLaunchSpecWith({
        prefix,
        npmPackage: '@openai/codex',
        platform: 'win32',
        arch: 'arm64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toEqual({ command: native, args: [] });
  });

  it('falls back to the JS entry plus the resolved runtime when no native binary exists', () => {
    // Mirrors @moonshot-ai/kimi-code: bin -> dist/main.mjs, no vendor tree.
    const pkgDir = writePackage(prefix, '@moonshot-ai/kimi-code', { kimi: 'dist/main.mjs' });
    const entry = path.join(pkgDir, 'dist', 'main.mjs');
    writeFileTree(entry, 'export {};\n');

    const spec = resolveLaunchSpecWith({
      prefix,
      npmPackage: '@moonshot-ai/kimi-code',
      platform: 'darwin',
      arch: 'arm64',
      jsRuntimeCommand: JS_RUNTIME,
    });

    expect(isAcpLaunchSpec(spec)).toBe(true);
    expect(spec).toEqual({ command: JS_RUNTIME, args: [entry] });
  });

  it('handles a string bin field by deriving the command name from the package name', () => {
    // Mirrors openclaw: bin is an object in practice, but the string form is legal npm.
    const pkgDir = writePackage(prefix, 'openclaw', 'openclaw.mjs');
    const entry = path.join(pkgDir, 'openclaw.mjs');
    writeFileTree(entry, 'export {};\n');

    const native = path.join(pkgDir, 'vendor', 'x86_64-unknown-linux-musl', 'bin', 'openclaw');
    writeFileTree(native, 'ELF');

    expect(
      resolveLaunchSpecWith({
        prefix,
        npmPackage: 'openclaw',
        platform: 'linux',
        arch: 'x64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toEqual({ command: native, args: [] });
  });

  it('throws a named error when neither a native binary nor a JS entry resolves', () => {
    writePackage(prefix, 'openclaw', { openclaw: 'openclaw.mjs' });
    // package.json declares the entry but the file was never written.

    expect(() =>
      resolveLaunchSpecWith({
        prefix,
        npmPackage: 'openclaw',
        platform: 'darwin',
        arch: 'arm64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toThrowError(LaunchSpecUnresolvedError);
  });

  it('throws a named error when the package is not installed at all', () => {
    expect(() =>
      resolveLaunchSpecWith({
        prefix,
        npmPackage: 'openclaw',
        platform: 'darwin',
        arch: 'arm64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toThrowError(LaunchSpecUnresolvedError);
  });

  it('refuses a bin entry that points outside the package directory', () => {
    // Deliberately no file on disk: containment is checked before existence, so
    // the throw must not depend on the escape target being absent.
    writePackage(prefix, 'openclaw', { openclaw: '../../../evil.mjs' });

    expect(() =>
      resolveLaunchSpecWith({
        prefix,
        npmPackage: 'openclaw',
        platform: 'darwin',
        arch: 'arm64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toThrowError(LaunchSpecUnresolvedError);
  });

  it('refuses a non-script bin entry rather than returning a half-built spec', () => {
    const pkgDir = writePackage(prefix, 'openclaw', { openclaw: 'launcher.sh' });
    writeFileTree(path.join(pkgDir, 'launcher.sh'), '#!/bin/sh\n');

    expect(() =>
      resolveLaunchSpecWith({
        prefix,
        npmPackage: 'openclaw',
        platform: 'darwin',
        arch: 'arm64',
        jsRuntimeCommand: JS_RUNTIME,
      })
    ).toThrowError(LaunchSpecUnresolvedError);
  });
});
