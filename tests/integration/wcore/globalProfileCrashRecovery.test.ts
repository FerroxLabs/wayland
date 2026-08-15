/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-01 Task 3 - the literal PRF-06 acceptance proof: "a launch killed
 * mid-flight leaves the user's global config byte-identical to its
 * pre-launch state, proven by a real kill test, not a simulated one."
 *
 * This spawns a genuinely separate OS process
 * (`fixtures/globalProfileWriteHarness.ts`) running the REAL production
 * write path (`ProjectConfigTransaction`, `spliceDesktopMcpProfile`,
 * `appendDesktopMcpProfile`), waits for its write to be durably on disk,
 * sends it a real `SIGKILL`, then runs the exact same
 * `recoverProjectConfigTransaction` call `writeGlobalMcpProfile` already runs
 * at the top of every launch and asserts the file returns to byte-identical
 * pre-launch bytes.
 *
 * Disclosed coverage limit (raised by the plan-checker, K-01-PLAN.md Task 3):
 * the harness reconstructs the write from the same underlying primitives
 * rather than literally calling the private `writeGlobalMcpProfile` (which
 * cannot be invoked without standing up a whole `WCoreAgent`). The kill and
 * recovery are both real, but a defect specific to `writeGlobalMcpProfile`'s
 * OWN sequencing - notably its pre-write `recoverProjectConfigTransaction`
 * call - is exercised only by `tests/unit/process/agent/wcore/
 * wcoreGlobalMcpProfile.test.ts`, not by this one. This test is necessary,
 * not sufficient, for PRF-06 on its own.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recoverProjectConfigTransaction } from '@process/agent/wcore/projectConfigTransaction';

const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const HARNESS_PATH = resolve(__dirname, 'fixtures', 'globalProfileWriteHarness.ts');
const ELECTRON_STUB_PRELOAD_PATH = resolve(__dirname, 'fixtures', 'electronStub.preload.ts');

/** Poll until `predicate()` is true or `timeoutMs` elapses. */
async function waitFor(predicate: () => boolean, timeoutMs = 15000, intervalMs = 50): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`waitFor: condition not met within ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe('K-01: real SIGKILL crash-recovery proof for the global profile splice', () => {
  let root: string;
  let targetDir: string;
  let markerPath: string;
  let configPath: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'wayland-wcore-global-crash-'));
    targetDir = join(root, 'global-config');
    markerPath = join(root, 'marker');
    configPath = join(targetDir, 'config.toml');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('a REAL SIGKILL of the real production write path leaves a byte-identical, fresh (no-original) target after recovery', async () => {
    // Fresh dir - no pre-existing config.toml. Node.js `spawn` requires the
    // cwd to already exist.
    const { mkdirSync } = await import('node:fs');
    mkdirSync(targetDir, { recursive: true });

    const child = spawn('bun', ['--preload', ELECTRON_STUB_PRELOAD_PATH, HARNESS_PATH, targetDir, markerPath], {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    try {
      // The write is durably on disk (fsynced by atomicWriteProjectConfig)
      // by the time the harness writes this marker.
      await waitFor(() => existsSync(markerPath));
      expect(existsSync(configPath), `harness did not publish config.toml; stderr: ${stderr}`).toBe(true);

      const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolvePromise) => {
        child.once('exit', (code, signal) => resolvePromise({ code, signal }));
      });
      child.kill('SIGKILL');
      const { signal } = await exited;
      expect(signal).toBe('SIGKILL');
    } finally {
      if (!child.killed) child.kill('SIGKILL');
    }

    // The exact healing call writeGlobalMcpProfile runs at the top of
    // every launch.
    expect(recoverProjectConfigTransaction(configPath)).toBe('restored');

    expect(existsSync(configPath)).toBe(false);
    expect(existsSync(`${configPath}.wayland-desktop.transaction.json`)).toBe(false);
    expect(existsSync(`${configPath}.wayland-desktop.backup`)).toBe(false);
  }, 30000);

  it('a REAL SIGKILL of the real production write path leaves a REALISTIC pre-existing global config BYTE-IDENTICAL after recovery', async () => {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(targetDir, { recursive: true });
    const original = [
      '# my note - do not remove',
      '[providers.anthropic]',
      'base_url = "https://api.anthropic.com"',
      '',
    ].join('\n');
    writeFileSync(configPath, original, 'utf-8');

    const child = spawn('bun', ['--preload', ELECTRON_STUB_PRELOAD_PATH, HARNESS_PATH, targetDir, markerPath], {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    try {
      await waitFor(() => existsSync(markerPath));
      // Confirm the harness actually spliced the profile in - proves this
      // is a real kill of a real in-progress write, not a kill before
      // anything happened.
      const midFlight = readFileSync(configPath, 'utf-8');
      expect(midFlight, `harness did not splice the profile; stderr: ${stderr}`).toContain(
        '[profiles.__wayland_desktop_session]'
      );
      expect(midFlight).toContain('# my note - do not remove');

      const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolvePromise) => {
        child.once('exit', (code, signal) => resolvePromise({ code, signal }));
      });
      child.kill('SIGKILL');
      const { signal } = await exited;
      expect(signal).toBe('SIGKILL');
    } finally {
      if (!child.killed) child.kill('SIGKILL');
    }

    expect(recoverProjectConfigTransaction(configPath)).toBe('restored');

    // PRF-06, literal: byte-identical to the pre-launch state.
    expect(readFileSync(configPath, 'utf-8')).toBe(original);
    expect(existsSync(`${configPath}.wayland-desktop.transaction.json`)).toBe(false);
    expect(existsSync(`${configPath}.wayland-desktop.backup`)).toBe(false);
  }, 30000);
});
