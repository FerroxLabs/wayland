import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fuigoEngineStatus, resolveFuigoBinary } from '../../../src/process/agent/fuigo/runtime';

// Real bundle directories on disk: the resolver reads the receipt and digests
// the staged file, exactly as it does against resources/bundled-fuigo.
const runtime = `${process.platform}-${process.arch}`;
const binary = process.platform === 'win32' ? 'fuigo.exe' : 'fuigo';
let root: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuigo-status-'));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function stage(name: string, opts: { receipt?: boolean; tamper?: boolean; version?: string } = {}) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  const bytes = Buffer.from(`fake-fuigo-${name}`);
  const file = path.join(dir, binary);
  fs.writeFileSync(file, bytes);
  if (opts.receipt !== false) {
    const stagedSha256 = createHash('sha256')
      .update(opts.tamper ? Buffer.from('other') : bytes)
      .digest('hex');
    fs.writeFileSync(
      path.join(dir, 'bundle.json'),
      JSON.stringify({
        contract: 'fuigo-bundle/1.0',
        version: opts.version ?? '1.0.14',
        runtime,
        binary,
        stagedSha256,
      })
    );
  }
  return { dir, file };
}

describe('fuigoEngineStatus', () => {
  it('reports the verified bundle with its receipt version and path', () => {
    const { dir, file } = stage('ok');
    expect(fuigoEngineStatus([dir])).toEqual({ state: 'verified', version: '1.0.14', path: file });
    expect(resolveFuigoBinary([dir])).toEqual({ path: file, version: '1.0.14' });
  });

  it('reports a staged binary whose digest the receipt does not vouch for as unverified, keeping the receipt version', () => {
    const { dir, file } = stage('tampered', { tamper: true });
    expect(fuigoEngineStatus([dir])).toEqual({ state: 'unverified', version: '1.0.14', path: file });
    expect(resolveFuigoBinary([dir])).toBeNull();
  });

  it('reports a staged binary with no receipt as unverified with no version', () => {
    const { dir, file } = stage('bare', { receipt: false });
    expect(fuigoEngineStatus([dir])).toEqual({ state: 'unverified', path: file, version: undefined });
  });

  it('never surfaces a non-exact receipt version', () => {
    const { dir, file } = stage('loose', { version: '1.0.14-sk-ant-secret' });
    expect(fuigoEngineStatus([dir])).toEqual({ state: 'unverified', path: file, version: undefined });
  });

  it('reports missing when no candidate directory holds a binary', () => {
    expect(fuigoEngineStatus([path.join(root, 'nope'), path.join(root, 'nope2')])).toEqual({ state: 'missing' });
    expect(resolveFuigoBinary([path.join(root, 'nope')])).toBeNull();
  });

  it('prefers a verified candidate over an earlier unverified one', () => {
    const bad = stage('bad', { tamper: true });
    const good = stage('good');
    expect(fuigoEngineStatus([bad.dir, good.dir])).toEqual({ state: 'verified', version: '1.0.14', path: good.file });
  });
});
