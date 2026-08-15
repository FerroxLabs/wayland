/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * `openclaw gateway` refuses to start unless `gateway.mode` is `local`, and we
 * spawned it with neither that nor `--allow-unconfigured`. So a user who
 * installed the CLI but never onboarded got a backend that DETECTED fine (we
 * only run `which openclaw`) and then died — reported as a raw
 * `Gateway exited with code N / Stdout: ... / Stderr: ...` dump with upstream's
 * own actionable sentence buried in a 500-char tail.
 *
 * The guard being mirrored here is not inferred from documentation. It was read
 * out of the published npm tarball (openclaw@2026.7.1-2, `dist/run-*.js`):
 *
 *   function getGatewayStartGuardErrors(params) {
 *     if (params.allowUnconfigured || params.mode === "local") return [];
 *     if (!params.configExists) return [`Missing config. Run ...`];
 *     if (params.mode === void 0) return [["Gateway start blocked: existing
 *       config is missing gateway.mode.", ...]];
 *     return [`Gateway start blocked: set gateway.mode=local (current: ...)`];
 *   }
 *
 * Three refusal arms, so there are three cases below. Each asserts we name the
 * command that FIXES it, because a blocker message the user cannot act on is the
 * same dead end in nicer words.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describeGatewayStartBlocker } from '@process/agent/openclaw/openclawConfig';

let stateDir: string;

/** Point the reader at a scratch state dir instead of the developer's real ~/.openclaw. */
function useScratchState(): void {
  stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-openclaw-state-'));
  vi.stubEnv('OPENCLAW_STATE_DIR', stateDir);
}

function writeConfig(config: unknown): void {
  fs.writeFileSync(path.join(stateDir, 'openclaw.json'), JSON.stringify(config), 'utf8');
}

describe('openclaw gateway start blocker', () => {
  beforeEach(useScratchState);

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  it('lets a properly onboarded install through', () => {
    writeConfig({ gateway: { mode: 'local', port: 18789 } });
    expect(describeGatewayStartBlocker()).toBeNull();
  });

  it('explains an install that was never onboarded, and names the fix', () => {
    // No config file at all - upstream's `!configExists` arm. This is the case
    // that actually shipped broken: install the CLI, never run setup.
    const blocker = describeGatewayStartBlocker();
    expect(blocker).toBeTruthy();
    expect(blocker).toContain('openclaw onboard');
  });

  it('explains a config with no gateway.mode rather than starting anyway', () => {
    // Upstream calls this "suspicious or clobbered" and refuses. So do we - a
    // config carrying auth but no mode is exactly the shape that would tempt a
    // reader into assuming it is configured.
    writeConfig({ gateway: { port: 18789, auth: { mode: 'token', token: 'x' } } });

    const blocker = describeGatewayStartBlocker();
    expect(blocker).toBeTruthy();
    expect(blocker).toContain('gateway.mode');
    expect(blocker).toContain('openclaw onboard');
  });

  it('reports the offending mode when it is set to something other than local', () => {
    writeConfig({ gateway: { mode: 'remote' } });

    const blocker = describeGatewayStartBlocker();
    expect(blocker).toBeTruthy();
    // Naming the current value is what makes this fixable without guesswork.
    expect(blocker).toContain('remote');
    expect(blocker).toContain('openclaw onboard');
  });

  it('does not treat a gateway-less config as onboarded', () => {
    // `{}` parses fine and has no gateway.mode, so it must land on the same
    // refusal as a missing one - not slip through on a truthy-config check.
    writeConfig({});
    expect(describeGatewayStartBlocker()).toBeTruthy();
  });

  it('says the config could not be READ rather than inventing a fact about its contents', () => {
    // readOpenClawConfig returns null for an unreadable file AND for unparseable
    // JSON, and `?.gateway?.mode` collapsed that into the same `undefined` as a
    // config we parsed fine. So a user with malformed JSON was told their config
    // "has no gateway.mode" - a claim about contents we never successfully read.
    fs.writeFileSync(path.join(stateDir, 'openclaw.json'), '{ this is not json', 'utf8');

    const blocker = describeGatewayStartBlocker();
    expect(blocker).toBeTruthy();
    expect(blocker).toContain('could not read');
    expect(blocker).not.toContain('has no gateway.mode');
    // Still actionable: every arm of this function names the command that fixes it.
    expect(blocker).toContain('openclaw onboard');
  });

  it('still reports a genuinely absent gateway.mode as exactly that', () => {
    // The counterpart control. Widening the read-failure arm must not swallow
    // the case it was carved out of, or the specific diagnosis is lost.
    writeConfig({ gateway: { port: 18789 } });

    const blocker = describeGatewayStartBlocker();
    expect(blocker).toContain('has no gateway.mode');
    expect(blocker).not.toContain('could not read');
  });
});
