/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The `install_skill` APPLY path - the orchestration, not the parts.
 *
 * `installSkillPack.test.ts` already covers download/extract/scan/install
 * individually. What is asserted here is the thing no unit of those can see:
 * that the bridge chains them in the right order and REFUSES at each gate, so a
 * pack that fails one step cannot reach the next.
 *
 * The gate that matters most is `review`. It is treated as `blocked` here, and
 * that is a deliberate product decision, not an oversight: the Settings importer
 * can afford a middle verdict because it holds the skill unregistered and makes
 * the user re-confirm against the contentHash they were shown, whereas this
 * card's Accept is ONE irreversible click with no second step. If someone later
 * "fixes" this to install-with-a-warning, this test is what stops it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const downloadSpy = vi.hoisted(() => vi.fn());
const extractSpy = vi.hoisted(() => vi.fn());
const scanSpy = vi.hoisted(() => vi.fn());
const installSpy = vi.hoisted(() => vi.fn());
const enableSpy = vi.hoisted(() => vi.fn());

vi.mock('@process/services/skills/installSkillPack', () => ({
  downloadAndVerify: downloadSpy,
  extractPack: extractSpy,
  scanPack: scanSpy,
  installExtractedPack: installSpy,
  stagingRoot: () => '/tmp/wl-test-staging',
}));
vi.mock('@process/services/skills/enableSkillForAssistant', () => ({
  enableSkillForAssistant: enableSpy,
  SMART_TRADER_ASSISTANT_ID: 'builtin-smart-trader',
}));

const PROPOSAL = {
  kind: 'install_skill' as const,
  name: 'tide-morning-brief',
  url: 'https://example.test/pack.zip',
  sha256: 'a'.repeat(64),
};

/**
 * Re-implements the bridge's chain over the SAME mocked modules the bridge
 * imports. The bridge's own `applyProposal` is not exported and reaching it
 * needs the full electron/database harness; this keeps the assertions on the
 * ordering and refusal logic, which is what actually went wrong historically.
 */
async function applyInstallSkill(content: typeof PROPOSAL): Promise<string> {
  const mod = await import('@process/services/skills/installSkillPack');
  const en = await import('@process/services/skills/enableSkillForAssistant');

  const download = await mod.downloadAndVerify(content.url, content.sha256);
  if (!download.ok) throw new Error(download.reason);
  const staging = `${mod.stagingRoot()}/pack-1`;
  const extracted = await mod.extractPack(download.bytes, staging);
  if (!extracted.ok) throw new Error(extracted.reason);
  const scan = await mod.scanPack(staging);
  if (scan.verdict !== 'clean') {
    const flagged = scan.reports
      .filter((r: { report: { verdict: string } }) => r.report.verdict !== 'clean')
      .map((r: { file: string }) => r.file)
      .join(', ');
    throw new Error(
      `The pack did not pass the safety scan (${scan.verdict}${flagged ? `: ${flagged}` : ''}), so nothing was installed.`
    );
  }
  const installed = await mod.installExtractedPack(staging, content.name);
  if (!installed.ok) throw new Error(installed.reason);
  const enabled = await en.enableSkillForAssistant(en.SMART_TRADER_ASSISTANT_ID, content.name);
  return enabled
    ? `Installed "${content.name}" and switched it on for Smart Trader.`
    : `Installed "${content.name}" - switch it on under Assistants to use it.`;
}

beforeEach(() => {
  downloadSpy.mockReset().mockResolvedValue({ ok: true, bytes: new Uint8Array([1]) });
  extractSpy.mockReset().mockResolvedValue({ ok: true, files: 5 });
  scanSpy.mockReset().mockResolvedValue({ verdict: 'clean', reports: [] });
  installSpy.mockReset().mockResolvedValue({ ok: true, name: 'tide-morning-brief', installedTo: '/x', files: 5 });
  enableSpy.mockReset().mockResolvedValue(true);
});

describe('install_skill apply path', () => {
  it('installs and switches on when every gate passes', async () => {
    await expect(applyInstallSkill(PROPOSAL)).resolves.toBe(
      'Installed "tide-morning-brief" and switched it on for Smart Trader.'
    );
    expect(enableSpy).toHaveBeenCalledWith('builtin-smart-trader', 'tide-morning-brief');
  });

  it('a REVIEW verdict refuses the install, exactly like blocked', async () => {
    scanSpy.mockResolvedValue({
      verdict: 'review',
      reports: [{ file: 'SKILL.md', report: { verdict: 'review' } }],
    });
    await expect(applyInstallSkill(PROPOSAL)).rejects.toThrow(/did not pass the safety scan \(review: SKILL\.md\)/);
    expect(installSpy).not.toHaveBeenCalled();
    expect(enableSpy).not.toHaveBeenCalled();
  });

  it('a BLOCKED verdict refuses the install', async () => {
    scanSpy.mockResolvedValue({ verdict: 'blocked', reports: [{ file: 'a.md', report: { verdict: 'blocked' } }] });
    await expect(applyInstallSkill(PROPOSAL)).rejects.toThrow(/blocked/);
    expect(installSpy).not.toHaveBeenCalled();
  });

  it('a bad hash stops before anything is unpacked', async () => {
    downloadSpy.mockResolvedValue({ ok: false, reason: 'The download did not match the expected checksum.' });
    await expect(applyInstallSkill(PROPOSAL)).rejects.toThrow(/checksum/);
    expect(extractSpy).not.toHaveBeenCalled();
    expect(scanSpy).not.toHaveBeenCalled();
    expect(installSpy).not.toHaveBeenCalled();
  });

  it('a failed extract stops before the scan', async () => {
    extractSpy.mockResolvedValue({ ok: false, reason: 'The archive could not be read.' });
    await expect(applyInstallSkill(PROPOSAL)).rejects.toThrow(/could not be read/);
    expect(scanSpy).not.toHaveBeenCalled();
    expect(installSpy).not.toHaveBeenCalled();
  });

  it('the SCAN runs before the install, never after', async () => {
    // Ordering, asserted directly: scanning after installing would mean a
    // hostile pack had already landed in the skills directory.
    const order: string[] = [];
    scanSpy.mockImplementation(async () => {
      order.push('scan');
      return { verdict: 'clean', reports: [] };
    });
    installSpy.mockImplementation(async () => {
      order.push('install');
      return { ok: true, name: 'x', installedTo: '/x', files: 1 };
    });
    await applyInstallSkill(PROPOSAL);
    expect(order).toEqual(['scan', 'install']);
  });

  it('reports honestly when the pack installs but could not be switched on', async () => {
    // The skill IS on disk at this point, so claiming failure would tell the
    // user nothing happened when something did.
    enableSpy.mockResolvedValue(false);
    await expect(applyInstallSkill(PROPOSAL)).resolves.toBe(
      'Installed "tide-morning-brief" - switch it on under Assistants to use it.'
    );
  });
});

/**
 * The harness above runs a COPY of the bridge's chain over the same mocked
 * modules, which is enough to pin the ordering and refusal semantics but is NOT
 * enough on its own: a copy passes happily while the original drifts. That is
 * precisely the shape of vacuous test this codebase has been bitten by twice.
 *
 * So these assertions read the REAL bridge source and check the two properties
 * that would silently change the product's behaviour if someone edited them.
 */
describe('the shipped bridge really implements what the harness models', () => {
  const source = readFileSync(
    path.resolve(__dirname, '../../../src/process/bridge/conciergeConfigBridge.ts'),
    'utf-8'
  );
  const caseBody = source.slice(source.indexOf("case 'install_skill': {"), source.indexOf("case 'file_bug_report': {"));

  it('has an install_skill case at all', () => {
    expect(caseBody.length).toBeGreaterThan(200);
  });

  it("gates on verdict !== 'clean', so review is refused alongside blocked", () => {
    // If this becomes `=== 'blocked'`, a REVIEW pack installs on one
    // irreversible click. That is the decision this line encodes.
    expect(caseBody).toMatch(/verdict\s*!==\s*'clean'/);
    expect(caseBody).not.toMatch(/verdict\s*===\s*'blocked'/);
  });

  it('scans BEFORE it installs', () => {
    const scanAt = caseBody.indexOf('scanPack(');
    const installAt = caseBody.indexOf('installExtractedPack(');
    expect(scanAt).toBeGreaterThan(-1);
    expect(installAt).toBeGreaterThan(-1);
    expect(scanAt).toBeLessThan(installAt);
  });

  it('verifies the download before unpacking it', () => {
    const dlAt = caseBody.indexOf('downloadAndVerify(');
    const exAt = caseBody.indexOf('extractPack(');
    expect(dlAt).toBeGreaterThan(-1);
    expect(exAt).toBeGreaterThan(dlAt);
  });

  it('always cleans up the staging directory', () => {
    expect(caseBody).toMatch(/finally\s*\{[\s\S]*rm\(staging/);
  });
});
