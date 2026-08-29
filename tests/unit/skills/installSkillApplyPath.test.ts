/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The `install_skill` chain - driven through the REAL function the bridge calls.
 *
 * The previous version of this file re-implemented the chain over mocked modules
 * and then tried to compensate with regex assertions over the bridge's source.
 * Two independent audits broke it: `if (false && scan.verdict !== 'clean')` still
 * satisfied the regex, and swapping `downloadAndVerify(sha256, url)` changed
 * nothing the harness could see. Both left the suite fully green while the real
 * product was broken.
 *
 * So there is no harness any more. `runInstallSkillChain` IS the shipped chain;
 * the bridge injects production dependencies, this file injects fakes, and a
 * mutation to the chain has nowhere to hide.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInstallSkillChain, type InstallSkillDeps } from '@process/services/skills/installSkillPack';

const PROPOSAL = {
  name: 'tide-morning-brief',
  url: 'https://example.test/pack.zip',
  sha256: 'a'.repeat(64),
};

let deps: InstallSkillDeps;
let order: string[];

beforeEach(() => {
  order = [];
  deps = {
    download: vi.fn(async (url: string, sha: string) => {
      order.push(`download(${url},${sha.slice(0, 4)})`);
      return { ok: true as const, bytes: new Uint8Array([1]) };
    }),
    extract: vi.fn(async () => {
      order.push('extract');
      return { ok: true as const, files: 5 };
    }),
    scan: vi.fn(async () => {
      order.push('scan');
      return { verdict: 'clean' as const, reports: [] };
    }),
    scripts: vi.fn(async () => {
      order.push('scripts');
      return [] as string[];
    }),
    install: vi.fn(async () => {
      order.push('install');
      return { ok: true as const, name: 'tide-morning-brief', installedTo: '/x', files: 5 };
    }),
    enable: vi.fn(async () => {
      order.push('enable');
      return true;
    }),
    stagingDir: () => '/tmp/wl-test-staging/pack-1',
    cleanup: vi.fn(async () => {
      order.push('cleanup');
    }),
  };
});

describe('runInstallSkillChain', () => {
  it('installs and switches on when every gate passes', async () => {
    await expect(runInstallSkillChain(PROPOSAL, deps)).resolves.toBe(
      'Installed "tide-morning-brief" and switched it on for Smart Trader.'
    );
    expect(order).toEqual([
      `download(${PROPOSAL.url},aaaa)`, 'extract', 'scan', 'scripts', 'install', 'enable', 'cleanup',
    ]);
  });

  it('passes the URL and hash in the RIGHT ORDER', async () => {
    // A swapped argument order was one of the mutations that survived the old
    // harness: it downloaded from the hash and verified against the URL.
    await runInstallSkillChain(PROPOSAL, deps);
    expect(deps.download).toHaveBeenCalledWith(PROPOSAL.url, PROPOSAL.sha256);
  });

  it('a REVIEW verdict refuses the install, exactly like blocked', async () => {
    deps.scan = vi.fn(async () => ({
      verdict: 'review' as const,
      reports: [{ file: 'SKILL.md', report: { verdict: 'review' } as never }],
    }));
    await expect(runInstallSkillChain(PROPOSAL, deps)).rejects.toThrow(
      /did not pass the safety scan \(review: SKILL\.md\)/
    );
    expect(deps.install).not.toHaveBeenCalled();
    expect(deps.enable).not.toHaveBeenCalled();
  });

  it('a BLOCKED verdict refuses the install', async () => {
    deps.scan = vi.fn(async () => ({
      verdict: 'blocked' as const,
      reports: [{ file: 'a.md', report: { verdict: 'blocked' } as never }],
    }));
    await expect(runInstallSkillChain(PROPOSAL, deps)).rejects.toThrow(/blocked/);
    expect(deps.install).not.toHaveBeenCalled();
  });

  it('a bad hash stops before anything is unpacked', async () => {
    deps.download = vi.fn(async () => ({ ok: false as const, reason: 'The download did not match the expected checksum.' }));
    await expect(runInstallSkillChain(PROPOSAL, deps)).rejects.toThrow(/checksum/);
    expect(deps.extract).not.toHaveBeenCalled();
    expect(deps.scan).not.toHaveBeenCalled();
    expect(deps.install).not.toHaveBeenCalled();
  });

  it('a failed extract stops before the scan', async () => {
    deps.extract = vi.fn(async () => ({ ok: false as const, reason: 'The archive could not be read.' }));
    await expect(runInstallSkillChain(PROPOSAL, deps)).rejects.toThrow(/could not be read/);
    expect(deps.scan).not.toHaveBeenCalled();
    expect(deps.install).not.toHaveBeenCalled();
  });

  it('a failed install does not switch anything on', async () => {
    deps.install = vi.fn(async () => ({ ok: false as const, reason: 'A skill named X is already installed.' }));
    await expect(runInstallSkillChain(PROPOSAL, deps)).rejects.toThrow(/already installed/);
    expect(deps.enable).not.toHaveBeenCalled();
  });

  it('always cleans up the staging directory, including on refusal', async () => {
    deps.scan = vi.fn(async () => ({ verdict: 'blocked' as const, reports: [] }));
    await expect(runInstallSkillChain(PROPOSAL, deps)).rejects.toThrow();
    expect(deps.cleanup).toHaveBeenCalledWith('/tmp/wl-test-staging/pack-1');
  });

  it('reports honestly when the pack installs but could not be switched on', async () => {
    deps.enable = vi.fn(async () => false);
    await expect(runInstallSkillChain(PROPOSAL, deps)).resolves.toBe(
      'Installed "tide-morning-brief" - switch it on under Assistants to use it.'
    );
  });

  it('NAMES the runnable files the pack carries', async () => {
    // `findPackScripts` had no production caller at all, so a buyer accepting
    // this card installed executable code that was never mentioned to them.
    deps.scripts = vi.fn(async () => ['report/assemble.py', 'report/collect.mjs']);
    const msg = await runInstallSkillChain(PROPOSAL, deps);
    expect(msg).toContain('2 runnable files');
    expect(msg).toContain('report/assemble.py');
    expect(msg).toContain('report/collect.mjs');
  });

  it('says nothing about scripts when the pack carries none', async () => {
    const msg = await runInstallSkillChain(PROPOSAL, deps);
    expect(msg).not.toMatch(/runnable file/);
  });

  it('reads the script list from STAGING, before install moves the tree', async () => {
    await runInstallSkillChain(PROPOSAL, deps);
    expect(deps.scripts).toHaveBeenCalledWith('/tmp/wl-test-staging/pack-1');
    expect(order.indexOf('scripts')).toBeLessThan(order.indexOf('install'));
  });

  it('a THROWN enable cannot strand the pack on disk', async () => {
    // The install above is irreversible. If enabling throws, every retry then
    // fails with "already installed" forever, with the skill on for nobody -
    // so the failure must cost the toggle, never the pack.
    deps.enable = vi.fn(async () => {
      throw new Error('config write failed');
    });
    await expect(runInstallSkillChain(PROPOSAL, deps)).resolves.toContain(
      'switch it on under Assistants'
    );
    expect(deps.cleanup).toHaveBeenCalled();
  });

  it('a THROWN script read does not cost the user the install', async () => {
    deps.scripts = vi.fn(async () => {
      throw new Error('unreadable');
    });
    await expect(runInstallSkillChain(PROPOSAL, deps)).resolves.toContain('Installed');
  });
});

describe('the bridge really delegates to the shared chain', () => {
  it('no longer re-implements the chain inline', async () => {
    // Cheap structural guard on the ONE thing the injection cannot prove: that
    // the bridge calls this function rather than growing a second copy.
    const { readFileSync } = await import('fs');
    const path = await import('path');
    const src = readFileSync(
      path.resolve(__dirname, '../../../src/process/bridge/conciergeConfigBridge.ts'),
      'utf-8'
    );
    const body = src.slice(src.indexOf("case 'install_skill': {"), src.indexOf("case 'file_bug_report': {"));
    expect(body).toContain('runInstallSkillChain');
    expect(body, 'the gate must live in the shared chain, not be re-inlined here').not.toContain("verdict !== 'clean'");
  });
});
