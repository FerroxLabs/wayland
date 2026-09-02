/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * `--trust-workspace`, ASSERTED AT THE REAL SPAWN SITE.
 *
 * WHY THE FLAG EXISTS. The engine blocks loopback networking and egress inside
 * a workspace it has not been told to trust. Desktop copies the assistant's
 * skills into the ephemeral per-chat workspace and runs them there, so without
 * this flag no skill script can reach 127.0.0.1 or the network. Measured on
 * shipped engine v0.13.11, same directory, minutes apart: sandboxed
 * `fetch('http://127.0.0.1:9222/json/version')` -> `LOOPBACK_BLOCKED ... EPERM`,
 * and after `wayland-core --trust-workspace` in that directory -> `LOOPBACK_OK`.
 *
 * WHY THE NEGATIVES ARE THE POINT OF THIS FILE. `--trust-workspace` trusts the
 * workspace's executable configuration fingerprint - its `.wayland-core.toml`,
 * hooks and project skills. Aimed at a folder the USER opened, it hands a
 * cloned repository exactly the authority the trust control exists to withhold.
 * An earlier attempt at this fix was reverted (3ebacf41c) for precisely that.
 * So every negative below is a security assertion, not padding.
 *
 * This drives the REAL `WCoreAgent.start()` and reads the argv off the REAL
 * `spawn` call, following `tests/unit/artifacts/wcoreSpawnRunOutputDir.test.ts`.
 * No engine binary is needed: the resolver is stubbed and `spawn` throws the
 * moment it has been handed its arguments, which is after the decision under
 * test has already been made. Every negative is produced in the same `it` as a
 * positive, so a green result can never come from a spawn that never happened.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ calls: [] as Array<{ args: string[] }> }));

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: (_bin: string, args: string[]) => {
    captured.calls.push({ args });
    throw new Error('STOP_AFTER_SPAWN');
  },
}));

vi.mock('@process/agent/wcore/binaryResolver', () => ({
  resolveWCoreBinary: () => '/nonexistent/wcore',
}));

vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: () => ({ collectForwardedEnv: async () => ({}) }),
}));

import os from 'os';
import path from 'path';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'fs';

import { WCoreAgent } from '@process/agent/wcore';

const TRUST_FLAG = '--trust-workspace';

/** The exact basename shape `createWCoreAgent` mints (`wcore-temp-${Date.now()}`). */
const MINTED_NAME = 'wcore-temp-1787307089126';

let workRoot = '';
let userHome = '';

/** One real `WCoreAgent.start()`, stopped at the spawn. Returns that spawn's argv. */
async function spawnArgsFor(options: {
  workspace: string;
  managedWorkRoot?: string;
  customWorkspace?: boolean;
  projectId?: string;
}): Promise<string[]> {
  const before = captured.calls.length;
  const agent = new WCoreAgent({
    ...options,
    // The escape hatch to Core's own config: it skips profile resolution, model
    // hydration and both config leases, none of which the trust gate reads. The
    // spawn block itself is shared with every other launch mode - and the gate
    // is deliberately NOT conditioned on this flag, because the loopback block
    // applies to raw-engine sessions too.
    rawEngineMode: true,
    model: { name: 'm', useModel: 'm', platform: 'openai', baseUrl: '' } as never,
    onStreamEvent: () => {},
  });
  await expect(agent.start()).rejects.toThrow('STOP_AFTER_SPAWN');
  expect(captured.calls.length).toBe(before + 1);
  return captured.calls[captured.calls.length - 1].args;
}

/** A real directory, because the gate canonicalises with `realpath`. */
function makeDir(...segments: string[]): string {
  const dir = path.join(...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('the engine spawn trusts ONLY the workspace Desktop minted for this chat', () => {
  beforeEach(() => {
    captured.calls.length = 0;
    // Two distinct real trees: the app-data work root Desktop mints into, and a
    // stand-in for the user's own disk.
    workRoot = mkdtempSync(path.join(os.tmpdir(), 'wl-workroot-'));
    userHome = mkdtempSync(path.join(os.tmpdir(), 'wl-userhome-'));
  });

  afterEach(() => {
    rmSync(workRoot, { recursive: true, force: true });
    rmSync(userHome, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('trusts a wcore-temp-* workspace in the managed work root, and NOT a folder the user opened', async () => {
    const minted = makeDir(workRoot, MINTED_NAME);
    // The attack the gate exists for: a cloned repo whose `.wayland-core.toml`
    // carries hooks, MCP servers or providers.
    const clonedRepo = makeDir(userHome, 'dev', 'some-cloned-repo');

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: clonedRepo, managedWorkRoot: workRoot })).not.toContain(TRUST_FLAG);
  });

  it('trusts through the macOS CLI-safe symlink, where a raw string compare would silently never match', async () => {
    // Production shape: the work root is reached as `~/.wayland` (a symlink into
    // "Application Support"), while `startWithProjectConfigLease` has ALREADY
    // realpath'd the workspace. Comparing the two spellings raw yields false and
    // the fix would never fire, so this case is what keeps it canonicalised.
    const minted = makeDir(workRoot, MINTED_NAME);
    const rootLink = path.join(userHome, '.wayland');
    symlinkSync(workRoot, rootLink);

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: rootLink })).toContain(TRUST_FLAG);
  });

  it('matches the way the filesystem does, so a case-differing spelling still trusts on Windows', async () => {
    // The Windows unit shard caught this: the spawn argv came back as
    // ['--assistant','wayland-desktop'] with NO trust flag, because the gate
    // compared two spellings of the SAME directory with a strict `===`. On
    // Windows `realpathSync` can return a different case (or an 8.3 name like
    // RUNNER~1) than the one getSystemDir().workDir was built from, so the flag
    // was never passed and loopback/egress stayed blocked - the trust fix dead
    // in production while looking right in review.
    //
    // Asserted on win32 only, deliberately: POSIX filesystems really are
    // case-sensitive, so upper-casing a path there names a directory that does
    // not exist and MUST NOT be trusted. That is the control, and it runs on
    // this machine.
    const minted = makeDir(workRoot, MINTED_NAME);
    const shouted = workRoot.toUpperCase();

    if (process.platform === 'win32') {
      expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: shouted })).toContain(TRUST_FLAG);
    } else {
      expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: shouted })).not.toContain(TRUST_FLAG);
    }
    // Both platforms: the exact spelling always trusts.
    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
  });

  it('REFUSES a user-picked custom workspace even when it sits in the managed root', async () => {
    // `customWorkspace` is the user's own declaration of provenance and outranks
    // the path shape: the directory is not ours to trust regardless of location.
    const minted = makeDir(workRoot, MINTED_NAME);

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot, customWorkspace: true })).not.toContain(
      TRUST_FLAG
    );
  });

  it('REFUSES a project workspace (#455), which is the user’s own tree', async () => {
    const minted = makeDir(workRoot, MINTED_NAME);

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot, projectId: 'proj-1' })).not.toContain(
      TRUST_FLAG
    );
  });

  it('REFUSES a lookalike name outside the managed root, and a nested path inside it', async () => {
    const minted = makeDir(workRoot, MINTED_NAME);
    // Naming a folder `wcore-temp-<digits>` must not be enough: only Desktop
    // writes into the managed root, so LOCATION is the real authority.
    const lookalike = makeDir(userHome, MINTED_NAME);
    // `buildWorkspaceWidthFiles` mints direct children only. Anything deeper was
    // created by something else.
    const nested = makeDir(workRoot, MINTED_NAME, 'sub');

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: lookalike, managedWorkRoot: workRoot })).not.toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: nested, managedWorkRoot: workRoot })).not.toContain(TRUST_FLAG);
  });

  it('REFUSES a symlink PLANTED in the managed root that points at a user tree', async () => {
    // Canonicalising the full workspace path - not just its parent - is what
    // makes this fail: the resolved parent is the user tree, not the root.
    const minted = makeDir(workRoot, MINTED_NAME);
    const target = makeDir(userHome, 'dev', 'some-cloned-repo');
    const planted = path.join(workRoot, 'wcore-temp-1787307089127');
    symlinkSync(target, planted);

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: planted, managedWorkRoot: workRoot })).not.toContain(TRUST_FLAG);
  });

  it('REFUSES names outside the closed grammar, including other managed prefixes', async () => {
    const minted = makeDir(workRoot, MINTED_NAME);
    // The gate is narrower than the shared `isManagedWorkspaceName` grammar on
    // purpose: only the workspaces THIS spawn path mints are trusted.
    const otherBackend = makeDir(workRoot, 'gemini-temp-1787307089126');
    const nonNumeric = makeDir(workRoot, 'wcore-temp-abcdefghij');
    const plain = makeDir(workRoot, 'scratch');

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    for (const workspace of [otherBackend, nonNumeric, plain]) {
      expect(await spawnArgsFor({ workspace, managedWorkRoot: workRoot })).not.toContain(TRUST_FLAG);
    }
  });

  it('REFUSES when no managed work root was threaded in, rather than defaulting to trusted', async () => {
    // Fail-closed: an unresolvable root means unprovable provenance, and the
    // spawn keeps today's untrusted behaviour.
    const minted = makeDir(workRoot, MINTED_NAME);

    expect(await spawnArgsFor({ workspace: minted, managedWorkRoot: workRoot })).toContain(TRUST_FLAG);
    expect(await spawnArgsFor({ workspace: minted })).not.toContain(TRUST_FLAG);
    expect(
      await spawnArgsFor({ workspace: minted, managedWorkRoot: path.join(workRoot, 'no-such-root') })
    ).not.toContain(TRUST_FLAG);
  });
});
