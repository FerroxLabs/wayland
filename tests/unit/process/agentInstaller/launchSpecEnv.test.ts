/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * T-A decision (b): `AcpLaunchSpec` carries an optional `env`.
 *
 * `resolveJsRuntime()` answers with a command AND an env as one pair. UNPACKAGED
 * the command is the Electron binary and the env is `ELECTRON_RUN_AS_NODE=1`;
 * take the command alone and a dev-build install of a pure-JS agent (kimi,
 * openclaw) spawns an Electron WINDOW instead of Node, with no stdio JSON-RPC
 * and therefore no ACP handshake. Codex is unaffected — it resolves to a native
 * binary that needs nothing.
 *
 * Two properties matter and both are pinned here:
 *
 *  1. The env REACHES the spec, so it survives the receipt and the persisted
 *     conversation `extra` it is rehydrated from later.
 *  2. A spec WITHOUT an env still validates exactly as it did before this
 *     existed — every packaged spec, every native spec, and every spec written
 *     by a build that predates the field. That is a compatibility guarantee on
 *     a shared ACP contract, not a nicety.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isAcpLaunchSpec } from '@/common/types/acpTypes';
import {
  resolveLaunchSpec,
  resolveLaunchSpecWith,
  resolvePackageDir,
} from '@process/services/agentInstaller/launchSpecResolver';

const runtime = vi.hoisted(() => ({
  answer: { command: '', env: {} as Record<string, string>, kind: 'electron-node' as const },
}));

vi.mock('@process/utils/jsRuntime', () => ({
  resolveJsRuntime: () => runtime.answer,
}));

const ELECTRON = '/Applications/Wayland.app/Contents/MacOS/Wayland';
const RUN_AS_NODE = { ELECTRON_RUN_AS_NODE: '1' };

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** Lay down a JS-entry package: no native binary, so resolution takes the runtime branch. */
function writeJsPackage(prefix: string, npmPackage: string, binName: string, entry: string): void {
  const pkgDir = resolvePackageDir(prefix, npmPackage);
  writeFileTree(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: npmPackage, version: '1.0.0', bin: { [binName]: entry } })
  );
  writeFileTree(path.join(pkgDir, entry), 'export {};\n');
}

describe('isAcpLaunchSpec — `env` is optional and its absence is unchanged behaviour', () => {
  // THE compatibility guarantee. Adding an optional field to a shared contract
  // must not narrow what the guard already accepted: these are the exact shapes
  // written by every packaged install, every native agent, and every build that
  // shipped before `env` existed.
  it.each([
    ['native binary, no args', { command: '/opt/agents/codex/bin/codex', args: [] }],
    ['packaged bun + entry', { command: '/opt/bundled-bun/bun', args: ['/data/agents/kimi/main.mjs'] }],
    ['system node + entry', { command: 'node', args: ['/data/agents/openclaw/openclaw.mjs'] }],
  ])('accepts a spec with NO env at all (%s)', (_label, spec) => {
    expect(isAcpLaunchSpec(spec)).toBe(true);
  });

  it('accepts an explicitly undefined env, which is what JSON round-tripping produces', () => {
    expect(isAcpLaunchSpec({ command: ELECTRON, args: ['/entry.mjs'], env: undefined })).toBe(true);
  });

  it('accepts a well-formed env', () => {
    expect(isAcpLaunchSpec({ command: ELECTRON, args: ['/entry.mjs'], env: RUN_AS_NODE })).toBe(true);
    // Empty is well-formed too: the packaged runtimes answer with exactly this.
    expect(isAcpLaunchSpec({ command: '/opt/bun', args: ['/entry.mjs'], env: {} })).toBe(true);
  });

  // `env` arrives from untyped persisted JSON on the same path as `command` and
  // `args`, so it gets the same strictness. A non-string value reaches spawn's
  // env and is coerced or throws — the class of garbage this guard exists to stop.
  it.each([
    ['env is a string', 'ELECTRON_RUN_AS_NODE=1'],
    ['env is null', null],
    ['env is an array', ['ELECTRON_RUN_AS_NODE=1']],
    ['env value is a number', { ELECTRON_RUN_AS_NODE: 1 }],
    ['env value is nested', { PROXY: { host: 'x' } }],
    ['env value is null', { ELECTRON_RUN_AS_NODE: null }],
  ])('rejects a malformed env (%s)', (_label, env) => {
    expect(isAcpLaunchSpec({ command: ELECTRON, args: ['/entry.mjs'], env })).toBe(false);
  });
});

describe('resolveLaunchSpecWith — the runtime env travels with the spec', () => {
  let prefix: string;

  beforeEach(() => {
    prefix = mkdtempSync(path.join(os.tmpdir(), 'wl-launchenv-'));
  });

  afterEach(() => {
    rmSync(prefix, { recursive: true, force: true });
  });

  it('records the dev-build runtime env on a JS-entry spec (the whole point)', () => {
    writeJsPackage(prefix, '@moonshot-ai/kimi-code', 'kimi', 'dist/main.mjs');

    const spec = resolveLaunchSpecWith({
      prefix,
      npmPackage: '@moonshot-ai/kimi-code',
      platform: 'darwin',
      arch: 'arm64',
      jsRuntimeCommand: ELECTRON,
      jsRuntimeEnv: RUN_AS_NODE,
    });

    expect(spec.command).toBe(ELECTRON);
    expect(spec.env).toEqual(RUN_AS_NODE);
    // Still a valid spec by the shared guard — it has to survive the receipt.
    expect(isAcpLaunchSpec(spec)).toBe(true);
  });

  it('copies the env rather than aliasing the caller’s object', () => {
    writeJsPackage(prefix, 'openclaw', 'openclaw', 'openclaw.mjs');
    const runtimeEnv = { ...RUN_AS_NODE };

    const spec = resolveLaunchSpecWith({
      prefix,
      npmPackage: 'openclaw',
      platform: 'darwin',
      arch: 'arm64',
      jsRuntimeCommand: ELECTRON,
      jsRuntimeEnv: runtimeEnv,
    });

    runtimeEnv.ELECTRON_RUN_AS_NODE = 'tampered';
    expect(spec.env).toEqual({ ELECTRON_RUN_AS_NODE: '1' });
  });

  // A packaged build resolves bundled-bun or system-node, both of which answer
  // `env: {}`. Writing an empty object into the receipt would change the bytes
  // of every packaged receipt for no gain, so the key is omitted entirely.
  it.each([
    ['empty env (packaged runtimes)', {}],
    ['no env supplied at all', undefined],
  ])('omits the key when there is nothing to carry: %s', (_label, jsRuntimeEnv) => {
    writeJsPackage(prefix, 'openclaw', 'openclaw', 'openclaw.mjs');

    const spec = resolveLaunchSpecWith({
      prefix,
      npmPackage: 'openclaw',
      platform: 'linux',
      arch: 'x64',
      jsRuntimeCommand: '/opt/bundled-bun/bun',
      jsRuntimeEnv,
    });

    expect(spec.env).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(spec, 'env')).toBe(false);
    expect(isAcpLaunchSpec(spec)).toBe(true);
  });

  // The actual defect T-A fixes is a HALF-USED answer: `resolveJsRuntime()`
  // returns command AND env, and the production wrapper previously forwarded
  // only `.command`. Mocking the runtime is the only way to see that wiring,
  // since the real one answers `{}` on any packaged host and on CI.
  it('forwards BOTH halves of the resolveJsRuntime answer, not just the command', () => {
    writeJsPackage(prefix, '@moonshot-ai/kimi-code', 'kimi', 'dist/main.mjs');
    runtime.answer = { command: ELECTRON, env: RUN_AS_NODE, kind: 'electron-node' };

    const spec = resolveLaunchSpec(prefix, '@moonshot-ai/kimi-code');

    expect(spec.command).toBe(ELECTRON);
    expect(spec.env).toEqual(RUN_AS_NODE);
  });

  it('never puts an env on a native spec — the binary runs on its own', () => {
    const pkgDir = resolvePackageDir(prefix, '@openai/codex');
    writeFileTree(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@openai/codex', version: '1.0.0', bin: { codex: 'bin/codex.js' } })
    );
    writeFileTree(path.join(pkgDir, 'bin', 'codex.js'), '#!/usr/bin/env node\n');
    writeFileTree(path.join(`${pkgDir}-darwin-arm64`, 'vendor', 'aarch64-apple-darwin', 'bin', 'codex'), 'MACHO');

    const spec = resolveLaunchSpecWith({
      prefix,
      npmPackage: '@openai/codex',
      platform: 'darwin',
      arch: 'arm64',
      // Deliberately the dev-mode pair: codex must ignore BOTH halves.
      jsRuntimeCommand: ELECTRON,
      jsRuntimeEnv: RUN_AS_NODE,
    });

    expect(spec.command).not.toBe(ELECTRON);
    expect(spec.env).toBeUndefined();
  });
});
