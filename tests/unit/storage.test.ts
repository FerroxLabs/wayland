import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { backupExport } from '../../src/process/storage/backupExport';
import { backupImport } from '../../src/process/storage/backupImport';
import { createLegacySafetyExport } from '../../src/process/storage/legacySafetyExport';
import { computeUsage, invalidateUsageCache } from '../../src/process/storage/computeUsage';
import JSZip from 'jszip';

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function mkTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
}

function writeFixture(dir: string, relPath: string, content: string): void {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
}

// -------------------------------------------------------------------
// computeUsage
// -------------------------------------------------------------------

describe('computeUsage', () => {
  let userData: string;
  let logsDir: string;

  beforeEach(() => {
    userData = mkTmpDir();
    logsDir = mkTmpDir();
    invalidateUsageCache();
  });

  afterEach(() => {
    fs.rmSync(userData, { recursive: true, force: true });
    fs.rmSync(logsDir, { recursive: true, force: true });
    invalidateUsageCache();
  });

  it('returns zero bytes for empty directories', async () => {
    const result = await computeUsage(userData, logsDir);
    expect(result.used).toBe(0);
    expect(result.breakdown.every((b) => b.bytes === 0)).toBe(true);
  });

  it('counts conversation bytes correctly', async () => {
    writeFixture(userData, 'conversations/a.json', 'hello world'); // 11 bytes
    const result = await computeUsage(userData, logsDir);
    const conv = result.breakdown.find((b) => b.label === 'conversations');
    expect(conv?.bytes).toBe(11);
    expect(result.used).toBeGreaterThanOrEqual(11);
  });

  it('counts cache bytes correctly', async () => {
    writeFixture(userData, 'cache/x.bin', 'abc'); // 3 bytes
    const result = await computeUsage(userData, logsDir);
    const cache = result.breakdown.find((b) => b.label === 'cache');
    expect(cache?.bytes).toBe(3);
  });

  it('counts log bytes correctly', async () => {
    writeFixture(logsDir, '2025-01-01.log', '0123456789'); // 10 bytes
    const result = await computeUsage(userData, logsDir);
    const logs = result.breakdown.find((b) => b.label === 'logs');
    expect(logs?.bytes).toBe(10);
  });

  it('returns cached result within TTL', async () => {
    writeFixture(userData, 'conversations/a.json', 'a');
    const first = await computeUsage(userData, logsDir);
    // Write more data - should NOT be reflected due to cache
    writeFixture(userData, 'conversations/b.json', 'bbb');
    const second = await computeUsage(userData, logsDir);
    expect(second.computedAt).toBe(first.computedAt);
  });

  it('recomputes after invalidateUsageCache()', async () => {
    writeFixture(userData, 'conversations/a.json', 'a');
    const first = await computeUsage(userData, logsDir);
    invalidateUsageCache();
    writeFixture(userData, 'conversations/b.json', 'bbb');
    const second = await computeUsage(userData, logsDir);
    // computedAt may be equal if both calls happen within the same ms tick;
    // what matters is that the result is fresh (not served from the old cache)
    expect(second.computedAt).toBeGreaterThanOrEqual(first.computedAt);
    expect(second.used).toBeGreaterThan(first.used);
  });
});

// -------------------------------------------------------------------
// backupExport + backupImport round-trip
// -------------------------------------------------------------------

describe('backupExport / backupImport round-trip', () => {
  let src: string;
  let dest: string;
  let restore: string;
  let zipPath: string;

  beforeEach(() => {
    src = mkTmpDir();
    dest = mkTmpDir();
    restore = mkTmpDir();
    zipPath = path.join(dest, 'backup.zip');
  });

  afterEach(() => {
    for (const d of [src, dest, restore]) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  it('exports and imports conversations without API keys', async () => {
    writeFixture(src, 'conversations/conv1.json', JSON.stringify({ id: '1', messages: [] }));
    writeFixture(src, 'conversations/sub/conv2.json', 'data');

    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });
    expect(fs.existsSync(zipPath)).toBe(true);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(0);

    await backupImport({ userData: restore, srcPath: zipPath });

    expect(fs.existsSync(path.join(restore, 'conversations/conv1.json'))).toBe(true);
    const content = fs.readFileSync(path.join(restore, 'conversations/conv1.json'), 'utf-8');
    expect(JSON.parse(content)).toEqual({ id: '1', messages: [] });

    expect(fs.existsSync(path.join(restore, 'conversations/sub/conv2.json'))).toBe(true);
  });

  it('labels the archive as non-authoritative and lists omitted state authorities', async () => {
    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });
    const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('string')) as {
      format: string;
      authoritative: boolean;
      excludedAuthorities: string[];
    };

    expect(manifest.format).toBe('wayland-legacy-file-export');
    expect(manifest.authoritative).toBe(false);
    expect(manifest.excludedAuthorities).toEqual(
      expect.arrayContaining(['desktop.database', 'core.default-profile', 'external.workspaces'])
    );
  });

  it('refuses to claim key coverage when no encryption passphrase is supplied', async () => {
    writeFixture(src, 'keys.json', '{"k":"v"}');
    await expect(
      backupExport({ userData: src, destPath: zipPath, includeKeys: true, passphrase: undefined })
    ).rejects.toThrow('passphrase');
    expect(fs.existsSync(zipPath)).toBe(false);
  });

  it('exports config directory', async () => {
    writeFixture(src, 'config/settings.json', '{"theme":"dark"}');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });
    await backupImport({ userData: restore, srcPath: zipPath });
    const restored = fs.readFileSync(path.join(restore, 'config/settings.json'), 'utf-8');
    expect(JSON.parse(restored)).toEqual({ theme: 'dark' });
  });

  it('does not restore unknown top-level dirs', async () => {
    writeFixture(src, 'conversations/c.json', 'ok');
    writeFixture(src, 'sensitive/secret.txt', 'secret');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });
    await backupImport({ userData: restore, srcPath: zipPath });
    expect(fs.existsSync(path.join(restore, 'sensitive'))).toBe(false);
  });

  it('round-trips API keys with AES-256-GCM encryption', async () => {
    const keysContent = JSON.stringify({ openai: 'sk-test-key' });
    writeFixture(src, 'keys.json', keysContent);

    await backupExport({ userData: src, destPath: zipPath, includeKeys: true, passphrase: 'hunter2' });
    await backupImport({ userData: restore, srcPath: zipPath, passphrase: 'hunter2' });

    const restored = fs.readFileSync(path.join(restore, 'keys.json'), 'utf-8');
    expect(JSON.parse(restored)).toEqual({ openai: 'sk-test-key' });
  });

  it('skips API keys when passphrase is missing on import', async () => {
    writeFixture(src, 'keys.json', '{"k":"v"}');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: true, passphrase: 'pw' });
    // Import without passphrase - keys.json.enc should be skipped
    await backupImport({ userData: restore, srcPath: zipPath, passphrase: undefined });
    expect(fs.existsSync(path.join(restore, 'keys.json'))).toBe(false);
  });

  it('rejects an archive without a manifest before changing live files', async () => {
    writeFixture(restore, 'config/settings.json', '{"theme":"keep"}');
    const zip = new JSZip();
    zip.file('config/settings.json', '{"theme":"replace"}');
    fs.writeFileSync(zipPath, await zip.generateAsync({ type: 'nodebuffer' }));

    await expect(backupImport({ userData: restore, srcPath: zipPath })).rejects.toThrow('manifest');
    expect(fs.readFileSync(path.join(restore, 'config/settings.json'), 'utf8')).toBe('{"theme":"keep"}');
  });

  it('stages the entire import before changing live files', async () => {
    writeFixture(src, 'config/settings.json', '{"theme":"replace"}');
    writeFixture(src, 'keys.json', '{"key":"encrypted"}');
    writeFixture(restore, 'config/settings.json', '{"theme":"keep"}');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: true, passphrase: 'correct' });

    await expect(backupImport({ userData: restore, srcPath: zipPath, passphrase: 'wrong' })).rejects.toThrow();
    expect(fs.readFileSync(path.join(restore, 'config/settings.json'), 'utf8')).toBe('{"theme":"keep"}');
  });

  // Cross-audit 2026-06-15: the per-install .secret-key decrypts stored
  // credentials. It must never be bundled into an export, or a backup becomes
  // plaintext secret exfiltration. Guard it even when it sits inside a walked dir.
  it('never exports the per-install .secret-key', async () => {
    writeFixture(src, 'config/settings.json', '{"theme":"dark"}');
    writeFixture(src, 'config/.secret-key', 'TOP-SECRET-AES-KEY');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: true, passphrase: 'pw' });
    await backupImport({ userData: restore, srcPath: zipPath, passphrase: 'pw' });
    // The benign config file round-trips; the secret key never lands in the restore.
    expect(fs.existsSync(path.join(restore, 'config/settings.json'))).toBe(true);
    expect(fs.existsSync(path.join(restore, 'config/.secret-key'))).toBe(false);
  });
});

describe('legacy import safety export', () => {
  let userData: string;

  beforeEach(() => {
    userData = mkTmpDir();
  });

  afterEach(() => {
    fs.rmSync(userData, { recursive: true, force: true });
  });

  it('atomically publishes a persistent rollback archive under recovery', async () => {
    writeFixture(userData, 'config/settings.json', '{"theme":"before"}');

    const safetyPath = await createLegacySafetyExport({
      userData,
      now: new Date('2026-07-16T00:00:00.000Z'),
    });

    expect(path.relative(userData, safetyPath)).toMatch(/^recovery[/\\]legacy-file-imports[/\\]pre-restore-/);
    expect(fs.existsSync(safetyPath)).toBe(true);
    expect(fs.existsSync(`${safetyPath}.incomplete`)).toBe(false);
    const zip = await JSZip.loadAsync(fs.readFileSync(safetyPath));
    expect(await zip.file('config/settings.json')!.async('string')).toBe('{"theme":"before"}');
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('string')) as { authoritative: boolean };
    expect(manifest.authoritative).toBe(false);
  });

  it('survives the subsequent legacy import that overwrites live config', async () => {
    const incoming = mkTmpDir();
    const incomingZip = path.join(incoming, 'incoming.zip');
    try {
      writeFixture(userData, 'config/settings.json', '{"theme":"before"}');
      writeFixture(incoming, 'config/settings.json', '{"theme":"after"}');
      await backupExport({ userData: incoming, destPath: incomingZip, includeKeys: false });

      const safetyPath = await createLegacySafetyExport({ userData });
      await backupImport({ userData, srcPath: incomingZip });

      expect(fs.readFileSync(path.join(userData, 'config/settings.json'), 'utf8')).toBe('{"theme":"after"}');
      expect(fs.existsSync(safetyPath)).toBe(true);
      const safetyZip = await JSZip.loadAsync(fs.readFileSync(safetyPath));
      expect(await safetyZip.file('config/settings.json')!.async('string')).toBe('{"theme":"before"}');
    } finally {
      fs.rmSync(incoming, { recursive: true, force: true });
    }
  });
});
