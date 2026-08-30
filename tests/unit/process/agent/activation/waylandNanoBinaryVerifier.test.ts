import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { verifyWaylandNanoBinary } from '@process/agent/activation/waylandNanoBinaryVerifier';

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
});
