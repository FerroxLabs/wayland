import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

export type ImportOptions = {
  userData: string;
  srcPath: string;
  passphrase?: string;
};

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

/** Write a file, creating parent directories as needed. */
function writeFile(filePath: string, data: Buffer): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data);
}

export async function backupImport(opts: ImportOptions): Promise<void> {
  const raw = fs.readFileSync(opts.srcPath);
  const zip = await JSZip.loadAsync(raw);

  const restoreDirs = new Set(['conversations', 'attachments', 'config']);

  await Promise.all(
    Object.entries(zip.files).map(async ([zipPath, file]) => {
      if (file.dir) return;

      // Handle encrypted keys
      if (zipPath === 'keys.json.enc') {
        if (!opts.passphrase) return;
        const encoded = await file.async('string');
        const decrypted = decryptBuffer(encoded, opts.passphrase);
        writeFile(path.join(opts.userData, 'keys.json'), decrypted);
        return;
      }

      // Skip manifest
      if (zipPath === 'manifest.json') return;

      // Restore files under known dirs
      const topDir = zipPath.split('/')[0];
      if (!restoreDirs.has(topDir)) return;

      const destFull = path.join(opts.userData, zipPath);
      const data = await file.async('nodebuffer');
      writeFile(destFull, data);
    })
  );
}
