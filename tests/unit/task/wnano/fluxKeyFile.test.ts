import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { cleanupWnanoFluxKeyFile, wnanoFluxKeyFilePath, writeWnanoFluxKeyFile } from '@process/task/wnano';

const SYNTHETIC_KEY = 'sk-flux-SYNTHETIC-test-key';

let userDataDir: string | undefined;

async function makeUserDataDir(): Promise<string> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'wnano-keyfile-test-'));
  userDataDir = dir;
  return dir;
}

afterEach(async () => {
  if (userDataDir) {
    await fs.promises.rm(userDataDir, { recursive: true, force: true });
    userDataDir = undefined;
  }
});

describe('wnano FLUX_API_KEY_FILE handoff (C8 Q4)', () => {
  it('writes the key under userData and returns the absolute path to inject', async () => {
    const dir = await makeUserDataDir();
    const file = await writeWnanoFluxKeyFile(dir, 'conv-1', SYNTHETIC_KEY);
    expect(file).toBe(wnanoFluxKeyFilePath(dir, 'conv-1'));
    expect(path.isAbsolute(file!)).toBe(true);
    await expect(fs.promises.readFile(file!, 'utf8')).resolves.toBe(SYNTHETIC_KEY);
  });

  it('writes atomically: no temp sibling is left behind after the rename', async () => {
    const dir = await makeUserDataDir();
    const file = (await writeWnanoFluxKeyFile(dir, 'conv-1', SYNTHETIC_KEY))!;
    const siblings = await fs.promises.readdir(path.dirname(file));
    expect(siblings).toEqual([path.basename(file)]);
  });

  it('overwrites a stale key file atomically on respawn', async () => {
    const dir = await makeUserDataDir();
    await writeWnanoFluxKeyFile(dir, 'conv-1', 'sk-flux-STALE');
    const file = (await writeWnanoFluxKeyFile(dir, 'conv-1', SYNTHETIC_KEY))!;
    await expect(fs.promises.readFile(file, 'utf8')).resolves.toBe(SYNTHETIC_KEY);
  });

  it('is mode 0600 on POSIX (Windows relies on the userData directory ACL instead)', async () => {
    if (process.platform === 'win32') {
      // POSIX mode bits are fiction on Windows; the guarantee there is the
      // user-scoped userData directory ACL, so there is no bit check to run.
      return;
    }
    const dir = await makeUserDataDir();
    const file = (await writeWnanoFluxKeyFile(dir, 'conv-1', SYNTHETIC_KEY))!;
    const mode = (await fs.promises.stat(file)).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('gives each conversation its own file (one teardown cannot strand another spawn)', async () => {
    const dir = await makeUserDataDir();
    const a = (await writeWnanoFluxKeyFile(dir, 'conv-a', 'sk-flux-A'))!;
    const b = (await writeWnanoFluxKeyFile(dir, 'conv-b', 'sk-flux-B'))!;
    expect(a).not.toBe(b);
    await cleanupWnanoFluxKeyFile(a);
    await expect(fs.promises.access(a)).rejects.toThrow();
    await expect(fs.promises.readFile(b, 'utf8')).resolves.toBe('sk-flux-B');
  });

  it('sanitizes hostile conversation ids into a safe file name inside userData', async () => {
    const dir = await makeUserDataDir();
    const file = (await writeWnanoFluxKeyFile(dir, '../../etc/evil', SYNTHETIC_KEY))!;
    expect(path.dirname(file)).toBe(path.join(dir, 'wnano'));
  });

  it('cleanup removes the file at teardown and never throws on a missing file', async () => {
    const dir = await makeUserDataDir();
    const file = (await writeWnanoFluxKeyFile(dir, 'conv-1', SYNTHETIC_KEY))!;
    await cleanupWnanoFluxKeyFile(file);
    await expect(fs.promises.access(file)).rejects.toThrow();
    await expect(cleanupWnanoFluxKeyFile(file)).resolves.toBeUndefined();
  });

  it('refuses an empty key and never creates a file for it', async () => {
    const dir = await makeUserDataDir();
    await expect(writeWnanoFluxKeyFile(dir, 'conv-1', '')).resolves.toBeUndefined();
    expect(fs.existsSync(wnanoFluxKeyFilePath(dir, 'conv-1'))).toBe(false);
  });

  it('returns undefined (never throws) when the target directory is not writable', async () => {
    const dir = await makeUserDataDir();
    // A regular file where the key directory must be created forces the write to fail.
    await fs.promises.writeFile(path.join(dir, 'wnano'), 'occupied');
    await expect(writeWnanoFluxKeyFile(dir, 'conv-1', SYNTHETIC_KEY)).resolves.toBeUndefined();
  });
});
