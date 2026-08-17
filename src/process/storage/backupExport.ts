import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

export type ExportOptions = {
  userData: string;
  destPath: string;
  /** When true, encrypt the API-keys section with AES-256-GCM. */
  includeKeys: boolean;
  passphrase?: string;
};

/**
 * What an export actually captured. `includesKeys` can be false even when the
 * caller asked for keys: the legacy `keys.json` credential file does not exist
 * on a modern install, where provider credentials live in the primary database
 * instead. Callers must surface that rather than report a plain success (#1021).
 */
export type ExportReport = {
  /** True when an encrypted keys blob was written into the archive. */
  includesKeys: boolean;
  /** True when the caller asked for keys but no legacy keys file existed. */
  keysRequestedButAbsent: boolean;
  /** Files placed in the archive, excluding the manifest. */
  fileCount: number;
};

export type LegacyFileExportManifest = {
  format: 'wayland-legacy-file-export';
  version: 2;
  authoritative: false;
  exportedAt: string;
  includesKeys: boolean;
  includedPaths: ['conversations', 'attachments', 'config'];
  excludedAuthorities: string[];
};

/**
 * Per-install secret-key filename (mirror of SECRET_KEY_FILE in
 * secrets/fileKeyStore.ts). This file is the AES key that decrypts stored
 * credentials; it must NEVER be written into a backup archive. Bundling it
 * alongside the (encrypted) credential blobs would make an export equivalent to
 * plaintext secret exfiltration, defeating the write-only invariant
 * (cross-audit 2026-06-15). It currently lives at the workspace root, which
 * addDir does not walk - this is the belt-and-braces guarantee that a future
 * directory-layout change can never start leaking it.
 */
const NEVER_EXPORT_FILES = new Set(['.secret-key']);

/** Recursively add a directory's contents into a JSZip folder. */
async function addDir(zip: JSZip, dir: string, zipPath: string): Promise<number> {
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let added = 0;
  for (const entry of entries) {
    if (NEVER_EXPORT_FILES.has(entry.name)) continue;
    const srcFull = path.join(dir, entry.name);
    const zipFull = `${zipPath}/${entry.name}`;
    if (entry.isDirectory()) {
      added += await addDir(zip, srcFull, zipFull);
    } else if (entry.isFile()) {
      const data = fs.readFileSync(srcFull);
      zip.file(zipFull, data);
      added += 1;
    }
  }
  return added;
}

/** AES-256-GCM encrypt a Buffer with a passphrase. Returns base64. */
function encryptBuffer(buf: Buffer, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: salt(16) | iv(12) | tag(16) | ciphertext
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export async function backupExport(opts: ExportOptions): Promise<ExportReport> {
  if (opts.includeKeys && !opts.passphrase) {
    // Code-prefixed so the IPC provider can classify it without reading the
    // message, which is the only way the renderer can name the actual mistake.
    throw new Error('PASSPHRASE_REQUIRED: A passphrase is required when API keys are included.');
  }
  const zip = new JSZip();

  // Conversations
  let fileCount = await addDir(zip, path.join(opts.userData, 'conversations'), 'conversations');

  // Attachments / blobs
  fileCount += await addDir(zip, path.join(opts.userData, 'attachments'), 'attachments');

  // Settings (localStorage snapshot not accessible from main; export config files)
  const configDir = path.join(opts.userData, 'config');
  fileCount += await addDir(zip, configDir, 'config');

  // API keys (optional, encrypted)
  let includesKeys = false;
  let keysRequestedButAbsent = false;
  if (opts.includeKeys && opts.passphrase) {
    const keysFile = path.join(opts.userData, 'keys.json');
    if (fs.existsSync(keysFile)) {
      const raw = fs.readFileSync(keysFile);
      const encrypted = encryptBuffer(raw, opts.passphrase);
      zip.file('keys.json.enc', encrypted);
      includesKeys = true;
      fileCount += 1;
    } else {
      // The caller asked for keys and there are none to take. Provider
      // credentials live in the primary database, which this legacy file
      // export does not cover, so a silent `includesKeys: false` would let the
      // UI claim a keys-bearing export it never made (#1021).
      keysRequestedButAbsent = true;
    }
  }

  // Manifest
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        format: 'wayland-legacy-file-export',
        version: 2,
        authoritative: false,
        exportedAt: new Date().toISOString(),
        includesKeys,
        includedPaths: ['conversations', 'attachments', 'config'],
        excludedAuthorities: [
          'desktop.database',
          'projects',
          'schedules',
          'teams',
          'providers',
          'core.default-profile',
          'core.named-profiles',
          'external.workspaces',
        ],
      } satisfies LegacyFileExportManifest,
      null,
      2
    )
  );

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(opts.destPath, content);
  return { includesKeys, keysRequestedButAbsent, fileCount };
}
