import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

export type ImportOptions = {
  userData: string;
  srcPath: string;
  passphrase?: string;
};

/**
 * Decompression caps to defend against zip-bombs. A backup archive holding
 * conversations + attachments is large but bounded; these limits reject a
 * single entry or a total payload that is implausible for a real backup.
 */
const MAX_ENTRY_BYTES = 256 * 1024 * 1024; // 256 MiB per entry
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024; // 1 GiB total

/** AES-256-GCM decrypt a base64-encoded payload produced by backupExport. */
function decryptBuffer(encoded: string, passphrase: string): Buffer {
  const buf = Buffer.from(encoded, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const tag = buf.subarray(28, 44);
  const ciphertext = buf.subarray(44);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Resolve a zip entry destination inside `baseDir`, rejecting any path that
 * escapes it (zip-slip). Normalizes BOTH separators before inspection so
 * mixed-separator entries (e.g. `config/..\..\evil.bat`) cannot bypass the
 * check on either POSIX or Windows.
 *
 * @returns the absolute, contained destination path, or `null` if the entry
 *          traverses outside `baseDir` and must be skipped.
 */
function resolveContained(baseDir: string, entryName: string): string | null {
  // Normalize backslashes to forward slashes so a single `..` check covers
  // both separator styles, then reject any `..` path segment outright.
  const normalized = entryName.replace(/\\/g, '/');
  if (normalized.split('/').some((seg) => seg === '..')) {
    return null;
  }
  const root = path.resolve(baseDir);
  const resolved = path.resolve(root, normalized);
  // Containment: the resolved path must equal the root or sit beneath it.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

/** Write a file, creating parent directories as needed. */
function writeFile(filePath: string, data: Buffer): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data);
}

export async function backupImport(opts: ImportOptions): Promise<void> {
  const raw = fs.readFileSync(opts.srcPath);
  const zip = await JSZip.loadAsync(raw);

  const restoreDirs = new Set(['conversations', 'attachments', 'config']);
  const root = path.resolve(opts.userData);

  // Running total of decompressed bytes to bound zip-bomb amplification.
  let totalBytes = 0;
  const accountBytes = (len: number): boolean => {
    if (len > MAX_ENTRY_BYTES) return false;
    totalBytes += len;
    return totalBytes <= MAX_TOTAL_BYTES;
  };

  await Promise.all(
    Object.entries(zip.files).map(async ([zipPath, file]) => {
      if (file.dir) return;

      // Handle encrypted keys. Containment still applies even though the
      // destination is fixed - the same hardening must guard every write.
      if (zipPath === 'keys.json.enc') {
        if (!opts.passphrase) return;
        const encoded = await file.async('string');
        const decrypted = decryptBuffer(encoded, opts.passphrase);
        if (!accountBytes(decrypted.length)) return;
        const keysDest = resolveContained(root, 'keys.json');
        if (keysDest === null) return;
        writeFile(keysDest, decrypted);
        return;
      }

      // Skip manifest
      if (zipPath === 'manifest.json') return;

      // Normalize separators BEFORE the top-dir gate so a mixed-separator
      // entry cannot slip a foreign top directory past the allowlist.
      const normalized = zipPath.replace(/\\/g, '/');
      const topDir = normalized.split('/')[0];
      if (!restoreDirs.has(topDir)) return;

      // Restore files under known dirs, enforcing path containment.
      const destFull = resolveContained(root, zipPath);
      if (destFull === null) return;

      const data = await file.async('nodebuffer');
      if (!accountBytes(data.length)) return;
      writeFile(destFull, data);
    })
  );
}
