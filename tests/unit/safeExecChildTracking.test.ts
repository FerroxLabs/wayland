/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EVERY safeExec CHILD MUST BE REAPABLE AT QUIT.
 *
 * `killAllAgentChildren` is the final before-quit step (src/index.ts), and it can
 * only kill what `trackAgentChild` knows about. wcore and AcpConnection register
 * their children; safeExec/safeExecFile did not, and they are what AcpDetector
 * uses to probe for CLIs - a `where` and then a `powershell -Command Get-Command`
 * per agent, eighteen agents deep, plus a WSL probe for whatever is still
 * missing.
 *
 * So on quit those probes were invisible to the reaper and simply outlived the
 * app. That is not a theoretical leak: it failed the v0.12.3 release twice, once
 * on the windows-x64 build and once on the win32-x64 updater observer, both with
 *
 *   [platform-package-smoke] packaged app left descendant processes alive: ...
 *
 * while the app itself had already logged a clean `quit (exitCode=0)`. The smoke
 * check walks the real process tree from the app's root pid, so those were
 * genuine orphans, not a false positive.
 *
 * The registry auto-removes on exit/error/close, so a probe that finishes
 * normally - which is almost all of them, in milliseconds - costs one Map entry
 * for its lifetime and nothing at quit.
 */
import { describe, it, expect } from 'vitest';
import { safeExec, safeExecFile } from '../../src/process/utils/safeExec';
import { killAllAgentChildren, liveAgentChildCount } from '../../src/process/agent/agentChildRegistry';

// A child that outlives the assertions without being killable by finishing.
const SLEEP_ARGS = ['-e', 'setTimeout(() => {}, 60000)'];

// safeExec goes through `cmd.exe /c` on Windows and `sh -c` on POSIX, so the
// command has to be shell-native rather than an argv the shell has to re-parse.
// A node one-liner is NOT portable here: `setTimeout(() => {}, 60000)` is all
// cmd metacharacters - parens group, the comma delimits - so cmd mangles it, the
// spawn fails, the `error` handler drops the child, and the registry reads 0.
// That is exactly how this test failed its first Windows shard.
const SHELL_SLEEP = process.platform === 'win32' ? 'ping -n 61 127.0.0.1 >nul' : 'sleep 60';

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

describe('safeExec child tracking', () => {
  it('registers a safeExecFile child so the before-quit reaper can reach it', async () => {
    const before = liveAgentChildCount();
    // Deliberately not awaited: the child is still running while we assert.
    const pending = safeExecFile(process.execPath, SLEEP_ARGS).catch(() => undefined);
    await settle();

    expect(liveAgentChildCount()).toBe(before + 1);

    await killAllAgentChildren(250);
    await pending;
    expect(liveAgentChildCount()).toBe(0);
  });

  it('registers a safeExec child too', async () => {
    const before = liveAgentChildCount();
    const pending = safeExec(SHELL_SLEEP).catch(() => undefined);
    await settle();

    expect(liveAgentChildCount()).toBe(before + 1);

    await killAllAgentChildren(250);
    await pending;
    expect(liveAgentChildCount()).toBe(0);
  });

  it('drops a child from the registry when it exits on its own', async () => {
    const before = liveAgentChildCount();
    await safeExecFile(process.execPath, ['-e', 'process.exit(0)']);
    await settle();
    expect(liveAgentChildCount()).toBe(before);
  });
});
