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

/**
 * Caps on the `outOfScope` diagnostic. Unlike the byte caps above these bound the
 * REPLY rather than the extraction, because the byte caps cannot see this: an
 * archive of zero-length entries decompresses to nothing while still carrying
 * megabytes of entry NAMES. See the call site for the executed consequence.
 */
const MAX_OUT_OF_SCOPE_NAMES = 20;
const MAX_OUT_OF_SCOPE_NAME_CHARS = 64;

/**
 * AES-256-GCM decrypt a base64-encoded payload produced by backupExport.
 *
 * A wrong passphrase surfaces as an authentication-tag failure from
 * `decipher.final()`, and that is by far the likeliest way a restore fails - a
 * typo. It is re-thrown under a fixed `BAD_PASSPHRASE:` code so the caller can
 * tell the user which of their two inputs was wrong WITHOUT forwarding the
 * underlying error, whose text can carry decrypted fragments and paths.
 */
function decryptBuffer(encoded: string, passphrase: string): Buffer {
  const buf = Buffer.from(encoded, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const tag = buf.subarray(28, 44);
  const ciphertext = buf.subarray(44);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("BAD_PASSPHRASE: the archive's encrypted keys would not decrypt.");
  }
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

/**
 * Remove a temporary tree, and NEVER throw doing it.
 *
 * Both cleanups here run in a `finally`, and a `finally` that throws REPLACES
 * the successful return it was supposed to follow. So an undeletable temp file -
 * an EACCES on a read-only directory, an EBUSY or EPERM on a Windows handle
 * another process still holds - turned a restore that had already installed
 * every file into a rejection carrying an `unlink` path. The caller then told
 * the user the restore failed and offered them the safety archive, which would
 * undo the good restore. Cleanup of our own scratch directory is best-effort by
 * definition: leaving a stale temp dir behind is strictly better than lying
 * about what happened to the user's data.
 */
function removeTempTree(target: string): void {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // Deliberately swallowed - see the doc comment above.
  }
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

/**
 * True while the rollback tree still holds a displaced original that was not
 * put back.
 *
 * This is the ONLY question that decides whether the rollback tree may be
 * removed after a failed restore, and it is asked of the disk rather than of a
 * success flag, because a flag can only record what the unwind BELIEVES it did.
 * A path is safe to forget exactly when its bytes are no longer here.
 */
function rollbackStillHoldsOriginals(rollbackRoot: string, displaced: string[]): boolean {
  return displaced.some((relativePath) => fs.existsSync(path.join(rollbackRoot, relativePath)));
}

function replaceFromStaging(root: string, stagingRoot: string): string[] {
  const parent = path.dirname(root);
  const rollbackRoot = fs.mkdtempSync(path.join(parent, '.wayland-legacy-rollback-'));
  const relativeTargets = ['conversations', 'attachments', 'config', 'keys.json'];
  const installed: string[] = [];
  const displaced: string[] = [];
  let keepRollback = false;

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
    // EVERY ITERATION OF BOTH SWEEPS IS GUARDED, AND THE CLEANUP IS CONDITIONAL
    // (#1050).
    //
    // Neither sweep used to be guarded, so one failure aborted the whole unwind
    // - and a failure here is ordinary, not exotic: an EBUSY or EPERM from a
    // handle another process still holds is the everyday Windows case. Executed
    // at the tag, a single injected EBUSY in the first sweep meant the SECOND
    // sweep never ran at all, and the unconditional `finally` below then deleted
    // the rollback tree with all three displaced originals still inside it. On
    // the no-passphrase path that tree is genuinely the only copy of the user's
    // `keys.json` on the machine, because legacySafetyExport omits keys when no
    // passphrase was given. This is the RECOVERY path: it runs precisely when
    // something has already gone wrong, so it is the last place that may lose
    // data. Losing a temp directory is nothing; losing the user's only copy is
    // the bug.
    //
    // That same escaping throw also meant `throw error` never ran, so the caller
    // was handed the rollback's error instead of the failure that actually
    // caused the restore to fail. Guarding the sweeps restores the original.
    for (const relativePath of [...installed].reverse()) {
      try {
        fs.rmSync(path.join(root, relativePath), { recursive: true, force: true });
      } catch {
        // Keep sweeping. A path we cannot clear is put back by the loop below.
      }
    }
    for (const relativePath of [...displaced].reverse()) {
      try {
        const rollback = path.join(rollbackRoot, relativePath);
        if (!fs.existsSync(rollback)) continue;
        const target = path.join(root, relativePath);
        // The sweep above may have failed to clear the archive copy it just
        // installed at this exact path, and the original cannot go back on top
        // of it. This is part of putting the original back, not a retry of the
        // temp-tree cleanup, which stays strictly best-effort.
        if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.renameSync(rollback, target);
      } catch {
        // Keep sweeping. Whatever is left in the rollback tree keeps the tree.
      }
    }
    keepRollback = rollbackStillHoldsOriginals(rollbackRoot, displaced);
    throw error;
  } finally {
    // On the success path the displaced originals were replaced deliberately and
    // the tree is scratch, so it always goes. After a failure it goes only once
    // every displaced original is verifiably back.
    if (!keepRollback) removeTempTree(rollbackRoot);
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
        // BOUNDED AT THE SOURCE, not in the renderer.
        //
        // These names are archive-controlled and this field crosses two
        // boundaries: the IPC bridge, whose adapter SILENTLY DROPS any reply over
        // 50 MB, and the HTTP route, which ships it to a browser. A zip of ~1000
        // zero-byte entries under 60 KB-long top-level names is legal, and the
        // zip-bomb BYTE caps never fire because nothing decompresses. Executed:
        // 1000 entries produced a 57.2 MB reply, the adapter dropped it, and
        // because `invoke` has no reject and no timeout the Restore button spun
        // for the rest of the session with nothing said - the exact symptom the
        // classified-result work exists to remove.
        //
        // Sanitising in the renderer is too late: the payload has already crossed.
        // This field is a diagnostic hint, so a couple of dozen truncated names is
        // all it was ever worth.
        if (outOfScope.size < MAX_OUT_OF_SCOPE_NAMES) outOfScope.add(topDir.slice(0, MAX_OUT_OF_SCOPE_NAME_CHARS));
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
    removeTempTree(stagingRoot);
  }
}
