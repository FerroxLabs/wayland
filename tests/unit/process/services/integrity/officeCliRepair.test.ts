/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * OfficeCLI's self-updater replaced the bundled binary inside a signed .app and
 * broke the code seal (OFFICECLI-SEAL-BREAK-ROOT-CAUSE). The repair must put
 * back exactly the pinned bytes, from exactly the pinned URL, atomically - and
 * must leave the bundle untouched on every failure.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GOOD = Buffer.from('pinned officecli v1.0.136 bytes');
const DRIFTED = Buffer.from('officecli v1.0.148 written by the self-updater');
const sha = (b: Buffer) => `sha256:${createHash('sha256').update(b).digest('hex')}`;

vi.mock('@/common/capabilities', () => ({
  OFFICECLI_CAPABILITY: { version: '1.0.136' },
  findCapabilityPlatform: (_def: unknown, platform: string, arch: string) =>
    platform === 'darwin' && arch === 'arm64'
      ? { platform, arch, artifact: 'officecli-mac-arm64', binarySha256: sha(GOOD) }
      : undefined,
}));

vi.mock('@process/services/capabilities/OfficeCliContractValidator', () => ({
  digestOfficeCliEvidence: (value: Buffer | string) => sha(Buffer.from(value)),
}));

import { pinnedOfficeCliReleaseUrl, repairBundledOfficeCli } from '@process/services/integrity/officeCliRepair';

const URL = 'https://github.com/iOfficeAI/OfficeCLI/releases/download/v1.0.136/officecli-mac-arm64';
const posixOnly = process.platform === 'win32' ? it.skip : it;

let root: string;
let runtime: string;
let binary: string;

function writeManifest(overrides: Record<string, unknown> = {}) {
  fs.writeFileSync(
    path.join(runtime, 'manifest.json'),
    JSON.stringify({ version: 'v1.0.136', asset: 'officecli-mac-arm64', sha256: sha(GOOD), source: URL, ...overrides })
  );
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-repair-'));
  runtime = path.join(root, 'bundled-officecli', 'darwin-arm64');
  binary = path.join(runtime, 'officecli');
  fs.mkdirSync(runtime, { recursive: true });
  fs.writeFileSync(binary, DRIFTED, { mode: 0o755 });
  writeManifest();
});

afterEach(() => {
  fs.chmodSync(runtime, 0o755);
  fs.rmSync(root, { recursive: true, force: true });
});

describe('repairBundledOfficeCli', () => {
  it('downloads the pinned release asset and atomically restores the pinned bytes', async () => {
    const fetchBytes = vi.fn(async () => GOOD);

    const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', { fetchBytes });

    expect(outcome).toEqual({ status: 'repaired', url: URL });
    expect(pinnedOfficeCliReleaseUrl('v1.0.136', 'officecli-mac-arm64')).toBe(URL);
    expect(fetchBytes).toHaveBeenCalledWith(URL);
    expect(fs.readFileSync(binary).equals(GOOD)).toBe(true);
    if (process.platform !== 'win32') expect(fs.statSync(binary).mode & 0o111).not.toBe(0);
    // No temp file is left beside the binary (it would itself break the seal).
    expect(fs.readdirSync(runtime).toSorted()).toEqual(['manifest.json', 'officecli']);
  });

  it('accepts the verified-cache provenance the shared validator also accepts', async () => {
    writeManifest({ source: 'verified-cache' });
    const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', { fetchBytes: async () => GOOD });
    expect(outcome.status).toBe('repaired');
  });

  it('does nothing when the binary already carries the pinned digest', async () => {
    fs.writeFileSync(binary, GOOD);
    const fetchBytes = vi.fn(async () => GOOD);
    await expect(repairBundledOfficeCli(root, 'darwin', 'arm64', { fetchBytes })).resolves.toEqual({
      status: 'intact',
    });
    expect(fetchBytes).not.toHaveBeenCalled();
  });

  it('refuses downloaded bytes that do not match the pinned digest and leaves the bundle as it was', async () => {
    const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', {
      fetchBytes: async () => Buffer.from('some other release'),
    });
    expect(outcome).toMatchObject({ status: 'failed', reason: 'verify-failed' });
    expect(fs.readFileSync(binary).equals(DRIFTED)).toBe(true);
    expect(fs.readdirSync(runtime).toSorted()).toEqual(['manifest.json', 'officecli']);
  });

  it('reports a failed download without touching the bundle', async () => {
    const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', {
      fetchBytes: async () => {
        throw new Error('getaddrinfo ENOTFOUND github.com');
      },
    });
    expect(outcome).toEqual({
      status: 'failed',
      reason: 'download-failed',
      detail: 'getaddrinfo ENOTFOUND github.com',
    });
    expect(fs.readFileSync(binary).equals(DRIFTED)).toBe(true);
  });

  posixOnly('reports a read-only bundle before downloading anything', async () => {
    if (process.getuid?.() === 0) return; // root ignores directory permissions
    fs.chmodSync(runtime, 0o555);
    const fetchBytes = vi.fn(async () => GOOD);
    const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', { fetchBytes });
    expect(outcome).toMatchObject({ status: 'failed', reason: 'not-writable' });
    expect(fetchBytes).not.toHaveBeenCalled();
    expect(fs.readFileSync(binary).equals(DRIFTED)).toBe(true);
  });

  it('never downloads from a manifest that names anything but the pinned release', async () => {
    const fetchBytes = vi.fn(async () => GOOD);
    for (const overrides of [
      { source: 'https://example.com/officecli' },
      { version: 'v1.0.148' },
      { asset: 'officecli-mac-x64' },
      { sha256: sha(DRIFTED) },
    ]) {
      writeManifest(overrides);
      const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', { fetchBytes });
      expect(outcome).toMatchObject({ status: 'failed', reason: 'untrusted-layout' });
    }
    expect(fetchBytes).not.toHaveBeenCalled();
    expect(fs.readFileSync(binary).equals(DRIFTED)).toBe(true);
  });

  posixOnly('refuses a runtime directory that links out of the bundle', async () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-outside-'));
    try {
      fs.cpSync(runtime, outside, { recursive: true });
      fs.rmSync(runtime, { recursive: true });
      fs.symlinkSync(outside, runtime);
      const fetchBytes = vi.fn(async () => GOOD);
      const outcome = await repairBundledOfficeCli(root, 'darwin', 'arm64', { fetchBytes });
      expect(outcome).toMatchObject({ status: 'failed', reason: 'untrusted-layout' });
      expect(fetchBytes).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(runtime, { force: true });
      fs.mkdirSync(runtime, { recursive: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it('is a no-op for a target with no bundled OfficeCLI', async () => {
    await expect(repairBundledOfficeCli(root, 'linux', 'x64')).resolves.toEqual({ status: 'absent' });
  });
});
