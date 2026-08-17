/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1015 — the ONE runtime tuple shared by the Library probe and every
 * live-session serializer.
 *
 * Two defects are pinned here:
 *
 *  F1: the probe was fixed to spawn Wayland's own bundled MCP servers under a
 *      resolved JS runtime while the live-session serializers still emitted bare
 *      `node`. That combination is worse than the original bug: the probe returns
 *      tools, the health check clears its "0 tools" flag, and the chat silently
 *      has no builtin tools with nothing left to report it. The runtime ENV is
 *      half the tuple — in dev the command is the app binary and is only a Node
 *      runtime while ELECTRON_RUN_AS_NODE=1 rides along.
 *
 *  F2: matching our scripts by BASENAME re-pointed a user's own server that
 *      merely shares one of our filenames onto our runtime. The match must be an
 *      exact comparison against the path this install would actually spawn.
 */

import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  applyBuiltinMcpRuntime,
  isOwnBuiltinCoreMcpScript,
  resolveBuiltinMcpRuntimeSpawn,
  resolveSessionMcpStdioSpawn,
} from '@process/services/mcpServices/builtinMcpRuntime';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';

const PACKAGED_BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
const DEV_ELECTRON = '/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';
const OUT_MAIN = '/Applications/Wayland.app/Contents/Resources/app.asar.unpacked/out/main';

/** Packaged resolution: bundled Bun, no extra env. */
const packagedRuntime = (): ResolvedJsRuntime => ({ command: PACKAGED_BUN, env: {}, kind: 'bundled-bun' });
/** Dev resolution: the app binary as Node — ONLY valid with ELECTRON_RUN_AS_NODE. */
const devRuntime = (): ResolvedJsRuntime => ({
  command: DEV_ELECTRON,
  env: { ELECTRON_RUN_AS_NODE: '1' },
  kind: 'electron-node',
});

const posixScriptPath = (name: string) => `${OUT_MAIN}/${name}`;
const OURS = posixScriptPath('builtin-mcp-search-skills.js');

const winPath = (name: string) => `C:\\Program Files\\Wayland\\out\\main\\${name}`;

const stdioServer = (command: string, args: string[], env?: Record<string, string>) => ({
  id: 'builtin-search-skills',
  name: 'wayland-search-skills',
  transport: { type: 'stdio' as const, command, args, ...(env ? { env } : {}) },
});

const deps = (over: Record<string, unknown> = {}) => ({
  resolveRuntime: packagedRuntime,
  scriptPath: posixScriptPath,
  platform: 'darwin' as NodeJS.Platform,
  ...over,
});

describe('F2 — our own script is matched by exact path, never by basename', () => {
  it('accepts the absolute path this install actually seeds', () => {
    expect(isOwnBuiltinCoreMcpScript(OURS, deps())).toBe(true);
  });

  it("REFUSES a user's own server that merely shares our basename", () => {
    // The hijack: same filename, the user's own directory, the user's own file.
    // Basename matching silently re-pointed this onto Wayland's runtime.
    expect(isOwnBuiltinCoreMcpScript('/Users/me/tools/builtin-mcp-search-skills.js', deps())).toBe(false);
    expect(resolveBuiltinMcpRuntimeSpawn('node', ['/Users/me/tools/builtin-mcp-search-skills.js'], deps())).toBeNull();
  });

  it('leaves a hijack candidate spawning exactly what the user configured', () => {
    const spawn = resolveSessionMcpStdioSpawn('node', ['/Users/me/tools/builtin-mcp-search-skills.js'], deps());
    expect(spawn).toEqual({
      command: 'node',
      args: ['/Users/me/tools/builtin-mcp-search-skills.js'],
      env: {},
    });
  });

  it('refuses an unrelated filename in our own directory', () => {
    expect(isOwnBuiltinCoreMcpScript(posixScriptPath('not-ours.js'), deps())).toBe(false);
  });

  it('normalizes traversal rather than string-comparing raw input', () => {
    expect(isOwnBuiltinCoreMcpScript(`${OUT_MAIN}/sub/../builtin-mcp-search-skills.js`, deps())).toBe(true);
  });

  it('win32: matches case-insensitively (NTFS is case-preserving, not case-sensitive)', () => {
    const stored = 'c:\\program files\\wayland\\out\\main\\builtin-mcp-search-skills.js';
    expect(isOwnBuiltinCoreMcpScript(stored, deps({ scriptPath: winPath, platform: 'win32' }))).toBe(true);
    // Still an EQUALITY test, not a prefix/containment test: a sibling directory
    // that merely starts with ours must not match (the win32 containment trap).
    expect(
      isOwnBuiltinCoreMcpScript(
        'C:\\Program Files\\Wayland\\out\\main-evil\\builtin-mcp-search-skills.js',
        deps({ scriptPath: winPath, platform: 'win32' })
      )
    ).toBe(false);
  });

  it('posix: does NOT fold case (two different files on a case-sensitive volume)', () => {
    expect(isOwnBuiltinCoreMcpScript(OURS.toUpperCase(), deps())).toBe(false);
  });
});

describe('F1 — the resolved runtime tuple carries command AND env', () => {
  it('packaged: our core builtin runs under the bundled Bun', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('node', [OURS], deps())).toEqual({
      command: PACKAGED_BUN,
      args: [OURS],
      env: {},
    });
  });

  it('dev: our core builtin runs the app binary as Node, WITH ELECTRON_RUN_AS_NODE', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('node', [OURS], deps({ resolveRuntime: devRuntime }))).toEqual({
      command: DEV_ELECTRON,
      args: [OURS],
      env: { ELECTRON_RUN_AS_NODE: '1' },
    });
  });

  it('expands the sibling @wayland servers from their bare stored filename', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('node', ['builtin-mcp-apple.mjs', '--flag'], deps())).toEqual({
      command: PACKAGED_BUN,
      args: [posixScriptPath('builtin-mcp-apple.mjs'), '--flag'],
      env: {},
    });
  });

  it('returns null for anything that is not ours, so callers keep their own resolution', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('npx', ['-y', 'chrome-devtools-mcp@latest'], deps())).toBeNull();
    expect(resolveBuiltinMcpRuntimeSpawn('node', ['/opt/other/server.js'], deps())).toBeNull();
    expect(resolveBuiltinMcpRuntimeSpawn('/usr/bin/mcp-server', [], deps())).toBeNull();
  });
});

describe('applyBuiltinMcpRuntime — transport rewrite for serializers we do not own', () => {
  const server = stdioServer;

  it('dev: rewrites command and MERGES the runtime env over the server env', () => {
    const out = applyBuiltinMcpRuntime(
      server('node', [OURS], { WAYLAND_IMG_PLATFORM: 'openai' }),
      deps({ resolveRuntime: devRuntime })
    );
    expect(out.transport).toEqual({
      type: 'stdio',
      command: DEV_ELECTRON,
      args: [OURS],
      env: { WAYLAND_IMG_PLATFORM: 'openai', ELECTRON_RUN_AS_NODE: '1' },
    });
  });

  it('packaged: rewrites command and preserves the server env untouched', () => {
    const out = applyBuiltinMcpRuntime(server('node', [OURS], { WAYLAND_IMG_MODEL: 'gpt-image-1' }), deps());
    expect(out.transport).toEqual({
      type: 'stdio',
      command: PACKAGED_BUN,
      args: [OURS],
      env: { WAYLAND_IMG_MODEL: 'gpt-image-1' },
    });
  });

  it('returns the SAME object for a server that is not ours (no npx pre-resolution)', () => {
    const input = server('npx', ['-y', 'chrome-devtools-mcp@latest']);
    expect(applyBuiltinMcpRuntime(input, deps())).toBe(input);
    const userOwned = server('node', ['/Users/me/tools/builtin-mcp-search-skills.js']);
    expect(applyBuiltinMcpRuntime(userOwned, deps())).toBe(userOwned);
  });
});

describe('real resolution (no injected deps) still identifies our own scripts', () => {
  // Confirms the method finds a KNOWN POSITIVE against the live resolver, so the
  // negatives above cannot be passing merely because nothing ever matches.
  it('accepts the path getMcpScriptPath actually produces on this host', async () => {
    const { getMcpScriptPath } = await import('@process/utils/mcpScriptDir');
    const real = getMcpScriptPath('builtin-mcp-concierge-diag.js');
    expect(path.isAbsolute(real)).toBe(true);
    expect(isOwnBuiltinCoreMcpScript(real)).toBe(true);
    expect(isOwnBuiltinCoreMcpScript(path.join('/Users/me/tools', 'builtin-mcp-concierge-diag.js'))).toBe(false);
  });
});
