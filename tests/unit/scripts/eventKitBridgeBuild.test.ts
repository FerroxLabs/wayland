/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * #1013 - apple-mcp shipped without its Swift EventKit helper, so 9 of its
 * tools were dead on arrival: Calendar listEvents/createEvent/updateEvent/
 * deleteEvent/findFreeSlot and Reminders listReminders/createReminder/
 * completeReminder/deleteReminder all route through that binary. Notes, Mail,
 * Maps and Photos go via AppleScript and were unaffected.
 *
 * The helper's SOURCE (`native/EventKitBridge.swift`) is committed in
 * waylandmcp; only the compiled `dist/` output is gitignored, so a plain CI
 * checkout has everything needed to produce it - nothing ever ran `swiftc`.
 * #1012 turned the silent no-op into a warning; a warning still ships a Library
 * card advertising controls that cannot work.
 *
 * So the build now compiles it on darwin, and a compile that fails is FATAL
 * rather than a warning - otherwise this regresses back to shipping green.
 *
 * The compiler is injected so all five branches run on every shard, including
 * the Linux gate, instead of only where swiftc exists.
 */
const gate = require('../../../scripts/build-mcp-servers.js') as {
  copyEventKitBridge: (
    src: string,
    outMain?: string,
    options?: {
      platform?: string;
      compile?: (args: { source: string; output: string }) => { status: number | null; stderr: string };
    }
  ) => Promise<void>;
};

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) fs.rmSync(dirs.pop()!, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function tmp(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

/** A source tree shaped like the real apple-mcp package: swift in, dist out. */
function appleSource(): string {
  const src = tmp('wl-apple-src-');
  fs.mkdirSync(path.join(src, 'native'), { recursive: true });
  fs.writeFileSync(path.join(src, 'native', 'EventKitBridge.swift'), '// EventKit bridge\n');
  return src;
}

describe('#1013 EventKit bridge is built, not merely hoped for', () => {
  it('compiles the Swift bridge on darwin and installs it next to the JS bundle', async () => {
    const src = appleSource();
    const outMain = tmp('wl-apple-out-');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls: Array<{ source: string; output: string }> = [];
    const compile = (args: { source: string; output: string }) => {
      calls.push(args);
      fs.mkdirSync(path.dirname(args.output), { recursive: true });
      fs.writeFileSync(args.output, 'MACH-O');
      return { status: 0, stderr: '' };
    };

    await gate.copyEventKitBridge(src, outMain, { platform: 'darwin', compile });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.source).toBe(path.join(src, 'native', 'EventKitBridge.swift'));
    expect(calls[0]!.output).toBe(path.join(src, 'dist', 'eventkit-bridge'));
    const installed = path.join(outMain, 'eventkit-bridge');
    expect(fs.readFileSync(installed, 'utf-8')).toBe('MACH-O');
    expect(fs.statSync(installed).mode & 0o777).toBe(0o755);
    expect(warn).not.toHaveBeenCalled();
  });

  it('is FATAL when the Swift compile fails on darwin, and names the compiler output', async () => {
    const src = appleSource();
    const outMain = tmp('wl-apple-out-');
    const compile = () => ({ status: 1, stderr: 'error: no such module EventKit' });

    await expect(gate.copyEventKitBridge(src, outMain, { platform: 'darwin', compile })).rejects.toThrow(
      /no such module EventKit/
    );
    expect(fs.existsSync(path.join(outMain, 'eventkit-bridge'))).toBe(false);
  });

  it('is FATAL when the compile reports success but produces nothing', async () => {
    const src = appleSource();
    const outMain = tmp('wl-apple-out-');
    const compile = () => ({ status: 0, stderr: '' });

    await expect(gate.copyEventKitBridge(src, outMain, { platform: 'darwin', compile })).rejects.toThrow(/#1013/);
    expect(fs.existsSync(path.join(outMain, 'eventkit-bridge'))).toBe(false);
  });

  it('does not rebuild when the bridge is already present', async () => {
    const src = appleSource();
    const outMain = tmp('wl-apple-out-');
    fs.mkdirSync(path.join(src, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(src, 'dist', 'eventkit-bridge'), 'PREBUILT');
    const compile = vi.fn(() => ({ status: 0, stderr: '' }));

    await gate.copyEventKitBridge(src, outMain, { platform: 'darwin', compile });

    expect(compile).not.toHaveBeenCalled();
    expect(fs.readFileSync(path.join(outMain, 'eventkit-bridge'), 'utf-8')).toBe('PREBUILT');
  });

  it('never invokes swiftc off darwin and keeps the existing warning there', async () => {
    const src = appleSource();
    const outMain = tmp('wl-apple-out-');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const compile = vi.fn(() => ({ status: 0, stderr: '' }));

    await gate.copyEventKitBridge(src, outMain, { platform: 'linux', compile });

    expect(compile).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(outMain, 'eventkit-bridge'))).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('#1013');
  });
});
