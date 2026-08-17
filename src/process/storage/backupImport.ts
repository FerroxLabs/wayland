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
 * What an import actually did. A legacy file export only ever covers
 * `conversations`, `attachments`, `config` and the optional encrypted
 * `keys.json`; everything else the app owns (the primary database - which is
 * where chats, projects and provider credentials live - Wayland Core state and
 * external workspaces) is out of scope by design. That makes "the archive was
 * read without error" a useless success signal: an archive taken from a modern
 * install legitimately contains nothing this importer can apply. Callers must
 * report `applied` to the user rather than assume a non-throwing import moved
 * data (#1021).
 */
export type ImportReport = {
  /** Top-level userData entries actually installed. Empty means nothing moved. */
  applied: string[];
  /** Archive top-level names present but outside the legacy restore scope. */
  outOfScope: string[];
  /** The archive carries encrypted keys that were skipped for want of a passphrase. */
  keysSkippedNoPassphrase: boolean;
  /** Files written into staging, keys included. */
  fileCount: number;
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

function validateLegacyManifest(value: unknown): void {
  if (!value || typeof value !== 'object') throw new Error('Backup manifest is missing or invalid.');
  const manifest = value as {
    version?: unknown;
    format?: unknown;
    authoritative?: unknown;
    includedPaths?: unknown;
    excludedAuthorities?: unknown;
  };
  // v1 was always the same limited file export, before its scope was named.
  if (manifest.version === 1) return;
  if (
    manifest.version !== 2 ||
    manifest.format !== 'wayland-legacy-file-export' ||
    manifest.authoritative !== false ||
    !Array.isArray(manifest.includedPaths) ||
    !Array.isArray(manifest.excludedAuthorities)
  ) {
    throw new Error('Unsupported or malformed legacy file-export manifest.');
  }
}

function replaceFromStaging(root: string, stagingRoot: string): string[] {
  const parent = path.dirname(root);
  const rollbackRoot = fs.mkdtempSync(path.join(parent, '.wayland-legacy-rollback-'));
  const relativeTargets = ['conversations', 'attachments', 'config', 'keys.json'];
  const installed: string[] = [];
  const displaced: string[] = [];

  try {
    for (const relativePath of relativeTargets) {
      const staged = path.join(stagingRoot, relativePath);
      if (!fs.existsSync(staged)) continue;
      const target = path.join(root, relativePath);
      const rollback = path.join(rollbackRoot, relativePath);
      if (fs.existsSync(target)) {
        fs.mkdirSync(path.dirname(rollback), { recursive: true });
        fs.renameSync(target, rollback);
        displaced.push(relativePath);
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.renameSync(staged, target);
      installed.push(relativePath);
    }
  } catch (error) {
    for (const relativePath of installed.reverse()) {
      fs.rmSync(path.join(root, relativePath), { recursive: true, force: true });
    }
    for (const relativePath of displaced.reverse()) {
      const rollback = path.join(rollbackRoot, relativePath);
      const target = path.join(root, relativePath);
      if (fs.existsSync(rollback)) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.renameSync(rollback, target);
      }
    }
    throw error;
  } finally {
    fs.rmSync(rollbackRoot, { recursive: true, force: true });
  }
  return installed;
}

export async function backupImport(opts: ImportOptions): Promise<ImportReport> {
  const raw = fs.readFileSync(opts.srcPath);
  const zip = await JSZip.loadAsync(raw);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Backup manifest is missing.');
  let manifest: unknown;
  try {
    manifest = JSON.parse(await manifestFile.async('string'));
  } catch {
    throw new Error('Backup manifest is not valid JSON.');
  }
  validateLegacyManifest(manifest);

  const restoreDirs = new Set(['conversations', 'attachments', 'config']);
  const root = path.resolve(opts.userData);
  fs.mkdirSync(path.dirname(root), { recursive: true });
  const stagingRoot = fs.mkdtempSync(path.join(path.dirname(root), '.wayland-legacy-restore-'));

  // Running total of decompressed bytes to bound zip-bomb amplification.
  let totalBytes = 0;
  let fileCount = 0;
  let keysSkippedNoPassphrase = false;
  const outOfScope = new Set<string>();
  const accountBytes = (len: number): void => {
    if (len > MAX_ENTRY_BYTES) throw new Error('Backup entry exceeds the decompression limit.');
    totalBytes += len;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('Backup exceeds the total decompression limit.');
  };

  try {
    for (const [zipPath, file] of Object.entries(zip.files)) {
      if (file.dir) continue;

      // Handle encrypted keys. Containment still applies even though the
      // destination is fixed - the same hardening must guard every write.
      if (zipPath === 'keys.json.enc') {
        if (!opts.passphrase) {
          keysSkippedNoPassphrase = true;
          continue;
        }
        const encoded = await file.async('string');
        const decrypted = decryptBuffer(encoded, opts.passphrase);
        accountBytes(decrypted.length);
        const keysDest = resolveContained(stagingRoot, 'keys.json');
        if (keysDest === null) continue;
        writeFile(keysDest, decrypted);
        fileCount += 1;
        continue;
      }

      // Skip manifest
      if (zipPath === 'manifest.json') continue;

      // Normalize separators BEFORE the top-dir gate so a mixed-separator
      // entry cannot slip a foreign top directory past the allowlist.
      const normalized = zipPath.replace(/\\/g, '/');
      const topDir = normalized.split('/')[0];
      if (!restoreDirs.has(topDir)) {
        outOfScope.add(topDir);
        continue;
      }

      // Restore files under known dirs, enforcing path containment.
      const destFull = resolveContained(stagingRoot, zipPath);
      if (destFull === null) continue;

      const data = await file.async('nodebuffer');
      accountBytes(data.length);
      writeFile(destFull, data);
      fileCount += 1;
    }
    const applied = replaceFromStaging(root, stagingRoot);
    return {
      applied,
      outOfScope: [...outOfScope].sort(),
      keysSkippedNoPassphrase,
      fileCount,
    };
  } finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
}
