/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Task 1 smoke test (#645 Terminal mode v1): proves the `@lydell/node-pty`
 * N-API prebuild loads under the app's runtime and can spawn a real PTY that
 * streams output back. Uses plain `node` (always on PATH in CI) as the child so
 * the test exercises the PTY seam, not any agent CLI. If this fails to load the
 * native binding the whole terminal feature is a non-starter, so it is the
 * first gate.
 */
import { describe, expect, it } from 'vitest';

describe('node-pty prebuild smoke (#645 Task 1)', () => {
  it('loads the native binding and streams child output through a PTY', async () => {
    const pty = await import('@lydell/node-pty');
    expect(typeof pty.spawn).toBe('function');

    const output = await new Promise<string>((resolve, reject) => {
      let buf = '';
      const child = pty.spawn(process.execPath, ['-e', 'process.stdout.write("ok")'], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env as Record<string, string>,
      });
      const timer = setTimeout(() => {
        try {
          child.kill();
        } catch {
          /* already gone */
        }
        reject(new Error('pty smoke timed out'));
      }, 10_000);
      child.onData((d) => {
        buf += d;
      });
      child.onExit(() => {
        clearTimeout(timer);
        resolve(buf);
      });
    });

    expect(output).toContain('ok');
  });
});
