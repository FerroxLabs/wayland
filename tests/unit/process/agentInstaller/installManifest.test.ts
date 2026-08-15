/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type AgentInstallReceipt,
  RECEIPT_FILENAME,
  ReceiptMismatchError,
  readInstallReceipt,
  resolveReceiptPath,
  uninstallAgent,
  writeInstallReceipt,
} from '@process/services/agentInstaller/installManifest';
import { InvalidAgentIdError } from '@process/services/agentInstaller/installPrefix';

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

describe('install receipts', () => {
  let userData: string;

  const receiptFor = (agentId: string): AgentInstallReceipt => ({
    agentId,
    npmPackage: `@vendor/${agentId}`,
    version: '1.2.3',
    prefix: path.join(userData, 'agents', agentId),
    launchSpec: { command: path.join(userData, 'agents', agentId, 'node_modules', '.payload'), args: [] },
    installedAt: '2026-08-11T00:00:00.000Z',
  });

  beforeEach(() => {
    userData = mkdtempSync(path.join(os.tmpdir(), 'wl-manifest-'));
  });

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true });
  });

  it('round-trips a receipt', () => {
    const receipt = receiptFor('codex');
    writeInstallReceipt(receipt);

    expect(existsSync(resolveReceiptPath(receipt.prefix))).toBe(true);
    expect(readInstallReceipt(receipt.prefix)).toEqual(receipt);
  });

  it('leaves no temp file behind after the write-then-rename', () => {
    const receipt = receiptFor('codex');
    writeInstallReceipt(receipt);

    expect(readdirSync(receipt.prefix)).toEqual([RECEIPT_FILENAME]);
  });

  it('treats a malformed receipt as absent', () => {
    const prefix = path.join(userData, 'agents', 'codex');
    writeFileTree(resolveReceiptPath(prefix), '{ not json');
    expect(readInstallReceipt(prefix)).toBeNull();

    writeFileSync(resolveReceiptPath(prefix), JSON.stringify({ agentId: 'codex' }), 'utf-8');
    expect(readInstallReceipt(prefix)).toBeNull();
  });

  it('rejects a receipt whose launchSpec is a legacy cliPath string', () => {
    const prefix = path.join(userData, 'agents', 'codex');
    const legacy = { ...receiptFor('codex'), launchSpec: '/usr/local/bin/codex' };
    writeFileTree(resolveReceiptPath(prefix), JSON.stringify(legacy));

    expect(readInstallReceipt(prefix)).toBeNull();
  });
});

describe('uninstallAgent', () => {
  let userData: string;

  beforeEach(() => {
    userData = mkdtempSync(path.join(os.tmpdir(), 'wl-uninstall-'));
  });

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true });
  });

  function install(agentId: string): AgentInstallReceipt {
    const prefix = path.join(userData, 'agents', agentId);
    const payload = path.join(prefix, 'node_modules', agentId, 'index.mjs');
    writeFileTree(payload, 'export {};\n');
    const receipt: AgentInstallReceipt = {
      agentId,
      npmPackage: agentId,
      version: '1.0.0',
      prefix,
      launchSpec: { command: '/opt/runtime/bun', args: [payload] },
      installedAt: '2026-08-11T00:00:00.000Z',
    };
    writeInstallReceipt(receipt);
    return receipt;
  }

  it('removes only what the receipt lists and leaves an unrelated sibling alone', () => {
    const codex = install('codex');
    const kimi = install('kimi');
    // A directory the installer never created, sitting in the same parent.
    const stranger = path.join(userData, 'agents', 'hand-made');
    writeFileTree(path.join(stranger, 'important.txt'), 'keep me');

    const report = uninstallAgent('codex', userData);

    expect(report).toEqual({ agentId: 'codex', prefix: codex.prefix, removed: true });
    expect(existsSync(codex.prefix)).toBe(false);
    // Sibling agent untouched, right down to its payload and receipt.
    expect(existsSync(kimi.prefix)).toBe(true);
    expect(existsSync(kimi.launchSpec.args[0])).toBe(true);
    expect(readInstallReceipt(kimi.prefix)).toEqual(kimi);
    // Unmanaged sibling untouched.
    expect(readFileSync(path.join(stranger, 'important.txt'), 'utf-8')).toBe('keep me');
    expect(readdirSync(path.join(userData, 'agents')).toSorted()).toEqual(['hand-made', 'kimi']);
  });

  it('removes nothing when there is no receipt, even though the directory exists', () => {
    const prefix = path.join(userData, 'agents', 'codex');
    writeFileTree(path.join(prefix, 'node_modules', 'codex', 'package.json'), '{}');

    const report = uninstallAgent('codex', userData);

    expect(report).toEqual({ agentId: 'codex', prefix, removed: false, reason: 'receipt-missing' });
    expect(existsSync(path.join(prefix, 'node_modules', 'codex', 'package.json'))).toBe(true);
  });

  it('removes nothing when the agent was never installed', () => {
    const report = uninstallAgent('codex', userData);
    expect(report.removed).toBe(false);
    expect(report.reason).toBe('receipt-missing');
  });

  it('refuses a doctored receipt that aims the remove at another directory', () => {
    const victim = path.join(userData, 'precious');
    writeFileTree(path.join(victim, 'data.txt'), 'irreplaceable');

    const prefix = path.join(userData, 'agents', 'codex');
    const doctored: AgentInstallReceipt = {
      agentId: 'codex',
      npmPackage: 'codex',
      version: '1.0.0',
      prefix: victim,
      launchSpec: { command: '/opt/runtime/bun', args: [] },
      installedAt: '2026-08-11T00:00:00.000Z',
    };
    writeFileTree(resolveReceiptPath(prefix), JSON.stringify(doctored));

    expect(() => uninstallAgent('codex', userData)).toThrowError(ReceiptMismatchError);
    expect(readFileSync(path.join(victim, 'data.txt'), 'utf-8')).toBe('irreplaceable');
  });

  it('refuses a receipt that names a different agent', () => {
    const prefix = path.join(userData, 'agents', 'codex');
    const mismatched: AgentInstallReceipt = {
      agentId: 'kimi',
      npmPackage: 'kimi',
      version: '1.0.0',
      prefix,
      launchSpec: { command: '/opt/runtime/bun', args: [] },
      installedAt: '2026-08-11T00:00:00.000Z',
    };
    writeFileTree(resolveReceiptPath(prefix), JSON.stringify(mismatched));

    expect(() => uninstallAgent('codex', userData)).toThrowError(ReceiptMismatchError);
    expect(existsSync(prefix)).toBe(true);
  });

  it('rejects a traversal agentId before reading or removing anything', () => {
    const victim = path.join(userData, 'precious');
    writeFileTree(path.join(victim, 'data.txt'), 'irreplaceable');

    expect(() => uninstallAgent('../../precious', userData)).toThrowError(InvalidAgentIdError);
    expect(readFileSync(path.join(victim, 'data.txt'), 'utf-8')).toBe('irreplaceable');
  });
});
