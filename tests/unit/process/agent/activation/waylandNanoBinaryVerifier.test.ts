import '@/common/platform/register-node';

import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { copyFile, link, mkdtemp, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { verifyWaylandNanoBinary } from '@process/agent/activation/waylandNanoBinaryVerifier';
import { spawnGenericBackend } from '@process/agent/acp/acpConnectors';

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'wayland-nano-binary-'));
  roots.push(root);
  const binary = path.join(root, process.platform === 'win32' ? 'nano.exe' : 'nano');
  const bytes = Buffer.from('immutable nano executable');
  await writeFile(binary, bytes, { mode: 0o700 });
  return {
    binary,
    expectation: {
      canonicalPath: binary,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      size: bytes.byteLength,
      sourceCommitSha: '1bebbec9183d17883497bca76d42e0fdcea275ea',
      cargoLockSha256: 'cbdf22daeda3eb21dbeb81d39e42d8f33cd046e2f5c476b98b4e5eacac31d93d',
      stagingRoot: root,
    },
  };
}

async function executableFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'wayland-nano-executable-'));
  roots.push(root);
  const binary = path.join(root, process.platform === 'win32' ? 'node.exe' : 'node');
  await copyFile(process.execPath, binary);
  const bytes = await readFile(binary);
  return {
    binary,
    expectation: {
      canonicalPath: binary,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      size: (await stat(binary)).size,
      sourceCommitSha: '1bebbec9183d17883497bca76d42e0fdcea275ea',
      cargoLockSha256: 'cbdf22daeda3eb21dbeb81d39e42d8f33cd046e2f5c476b98b4e5eacac31d93d',
      stagingRoot: root,
    },
  };
}

describe('Wayland Nano executable identity', () => {
  it('binds the canonical digest and immutable Nano source/lock identity to one launch', async () => {
    const { binary, expectation } = await fixture();
    const token = await verifyWaylandNanoBinary(expectation);

    const stagedPath = await token.consume((verifiedPath) => verifiedPath);
    expect(stagedPath).not.toBe(binary);
    expect(await readFile(stagedPath, 'utf8')).toBe('immutable nano executable');
    await expect(token.consume(() => undefined)).rejects.toThrow('stale');
    await token.cleanupAfterLaunch();
    await expect(readFile(stagedPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects PATH names and stale digests while isolating launch from source replacement', async () => {
    const { binary, expectation } = await fixture();
    await expect(verifyWaylandNanoBinary({ ...expectation, canonicalPath: path.basename(binary) })).rejects.toThrow(
      'canonical and absolute'
    );
    await expect(verifyWaylandNanoBinary({ ...expectation, sha256: '0'.repeat(64) })).rejects.toThrow('digest');

    const token = await verifyWaylandNanoBinary(expectation);
    await writeFile(binary, 'replacement executable with different size');
    const launchedBytes = await token.consume((verifiedPath) => readFileSync(verifiedPath));
    expect(launchedBytes).toEqual(Buffer.from('immutable nano executable'));
    await token.cleanupAfterLaunch();
  });

  it('rejects an invalid immutable artifact manifest before touching the binary', async () => {
    const { expectation } = await fixture();
    await expect(verifyWaylandNanoBinary({ ...expectation, cargoLockSha256: 'not-a-lock' })).rejects.toThrow(
      'expectation is invalid'
    );
  });

  it('rejects a post-verification hardlink and immutable path reassignment before launch', async () => {
    const { expectation } = await fixture();
    const token = await verifyWaylandNanoBinary(expectation);
    const alias = `${token.canonicalPath}.alias`;
    let launches = 0;

    expect(() => Object.assign(token, { canonicalPath: alias })).toThrow();
    expect(() => Object.assign(token, { consume: () => undefined })).toThrow();
    expect(() => Object.defineProperty(token, 'dispose', { value: () => undefined })).toThrow();
    if (process.platform === 'win32') {
      await expect(link(token.canonicalPath, alias)).rejects.toMatchObject({ code: 'EPERM' });
      await token.consume(() => {
        launches += 1;
      });
      expect(launches).toBe(1);
      await token.dispose();
      return;
    }

    await link(token.canonicalPath, alias);
    await expect(
      token.consume(() => {
        launches += 1;
      })
    ).rejects.toThrow('changed after verification');
    expect(launches).toBe(0);

    await token.dispose();
    await unlink(alias);
  });

  it('disposes a verified token before any generic backend, argv, or environment bypass', async () => {
    for (const hostile of [
      { backend: 'codex', args: ['acp-host'], env: { NANO_HOME: 'C:/owner/nano-home' } },
      { backend: 'wnano', args: ['acp-host', '--nonpersistent'], env: { NANO_HOME: 'C:/owner/nano-home' } },
      { backend: 'wnano', args: ['acp-host'], env: { NANO_HOME: 'relative-home' } },
    ]) {
      const { expectation } = await fixture();
      const token = await verifyWaylandNanoBinary(expectation);
      const stagedPath = token.canonicalPath;

      await expect(
        spawnGenericBackend(
          hostile.backend,
          expectation.canonicalPath,
          expectation.stagingRoot,
          hostile.args,
          hostile.env,
          token
        )
      ).rejects.toThrow(/authenticated ACP host|environment is invalid/);
      await expect(readFile(stagedPath)).rejects.toMatchObject({ code: 'ENOENT' });
    }
  });

  it('replaces inherited authority variables with only the frozen owner environment', async () => {
    const { expectation } = await executableFixture();
    const token = await verifyWaylandNanoBinary(expectation);
    const output = path.join(expectation.stagingRoot, 'spawn-env.json');
    const probe = path.join(expectation.stagingRoot, 'acp-host');
    await writeFile(
      probe,
      `require('node:fs').writeFileSync(process.env.WN_ENV_OUTPUT, JSON.stringify(process.env)); process.exit(0);`
    );
    const previous = {
      WN_ENV_OUTPUT: process.env.WN_ENV_OUTPUT,
      nano_home: process.env.nano_home,
      NANO_ADMIN_ROOT_KEYREF: process.env.NANO_ADMIN_ROOT_KEYREF,
      FlUx_ApI_KeY_FiLe: process.env.FlUx_ApI_KeY_FiLe,
    };
    Object.assign(process.env, {
      WN_ENV_OUTPUT: output,
      nano_home: 'C:/hostile/home',
      NANO_ADMIN_ROOT_KEYREF: 'C:/hostile/admin.keyref',
      FlUx_ApI_KeY_FiLe: 'C:/hostile/flux.key',
    });
    try {
      const spawned = await spawnGenericBackend(
        'wnano',
        expectation.canonicalPath,
        expectation.stagingRoot,
        ['acp-host'],
        { NANO_HOME: 'C:/owner/nano-home', FLUX_API_KEY_FILE: 'C:/owner/flux.key' },
        token
      );
      if (spawned.child.exitCode === null) await once(spawned.child, 'exit');
      const environment = JSON.parse(await readFile(output, 'utf8')) as Record<string, string>;
      const authorityKeys = Object.keys(environment).filter(
        (key) => /^NANO_/i.test(key) || /AUTHORITY|KEYREF|ADMIN_ROOT|RECOVERY_ROOT/i.test(key)
      );
      expect(authorityKeys).toEqual(['NANO_HOME']);
      expect(environment.NANO_HOME).toBe('C:/owner/nano-home');
      expect(environment.FLUX_API_KEY_FILE).toBe('C:/owner/flux.key');
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      await token.dispose().catch(() => {});
    }
  });
});
