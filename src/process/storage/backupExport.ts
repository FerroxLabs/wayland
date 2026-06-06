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

/** Recursively add a directory's contents into a JSZip folder. */
async function addDir(zip: JSZip, dir: string, zipPath: string): Promise<void> {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const srcFull = path.join(dir, entry.name);
    const zipFull = `${zipPath}/${entry.name}`;
    if (entry.isDirectory()) {
      await addDir(zip, srcFull, zipFull);
    } else if (entry.isFile()) {
      const data = fs.readFileSync(srcFull);
      zip.file(zipFull, data);
    }
  }
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

export async function backupExport(opts: ExportOptions): Promise<void> {
  const zip = new JSZip();

  // Conversations
  await addDir(zip, path.join(opts.userData, 'conversations'), 'conversations');

  // Attachments / blobs
  await addDir(zip, path.join(opts.userData, 'attachments'), 'attachments');

  // Settings (localStorage snapshot not accessible from main; export config files)
  const configDir = path.join(opts.userData, 'config');
  await addDir(zip, configDir, 'config');

  // API keys (optional, encrypted)
  if (opts.includeKeys && opts.passphrase) {
    const keysFile = path.join(opts.userData, 'keys.json');
    if (fs.existsSync(keysFile)) {
      const raw = fs.readFileSync(keysFile);
      const encrypted = encryptBuffer(raw, opts.passphrase);
      zip.file('keys.json.enc', encrypted);
    }
  }

  // Manifest
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        includesKeys: opts.includeKeys,
      },
      null,
      2
    )
  );

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(opts.destPath, content);
}
