import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { decode, exactVersion } from '../../../src/process/agent/fuigo/distribution.cjs';
// Fixture is an npm-format regular-file tar containing the exact platform
// package identity and a minimal Mach-O header. No fixture binary is executed.
function archive(extra: [string, Buffer][] = [], version = '1.0.6') {
  const binary = Buffer.alloc(64);
  binary.writeUInt32LE(0xfeedfacf, 0);
  binary.writeUInt32LE(0x100000c, 4);
  const entries: [string, Buffer][] = [
    ['package/package.json', Buffer.from(JSON.stringify({ name: '@fuigo/darwin-arm64', version }))],
    ['package/bin/fuigo.br', brotliCompressSync(binary)],
    ...extra,
  ];
  const blocks: Buffer[] = [];
  for (const [name, bytes] of entries) {
    const header = Buffer.alloc(512);
    header.write(name);
    header.write(bytes.length.toString(8).padStart(11, '0') + '\0', 124);
    header[156] = 48;
    blocks.push(header, bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  const bytes = gzipSync(Buffer.concat(blocks));
  return { bytes, pin: { integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') }, binary };
}
describe('Fuigo release admission', () => {
  it('decodes the exact package and binds its executable digest', () => {
    const f = archive();
    const result = decode(f.bytes, f.pin, '1.0.6', 'darwin-arm64');
    expect(result.binary).toEqual(f.binary);
    expect(result.binarySha256).toBe(createHash('sha256').update(f.binary).digest('hex'));
  });
  it('rejects tampered tarball bytes before extraction', () => {
    const f = archive();
    f.bytes[15] ^= 1;
    expect(() => decode(f.bytes, f.pin, '1.0.6', 'darwin-arm64')).toThrow('integrity mismatch');
  });
  it('rejects an exact-version identity mismatch', () => {
    const f = archive([], '1.0.7');
    expect(() => decode(f.bytes, f.pin, '1.0.6', 'darwin-arm64')).toThrow('identity mismatch');
  });
  it.each(['../escape', '/outside', 'package/../escape', 'package\\escape'])('rejects unsafe tar path %s', (name) => {
    const f = archive([[name, Buffer.from('x')]]);
    expect(() => decode(f.bytes, f.pin, '1.0.6', 'darwin-arm64')).toThrow('Unsafe');
  });
  it('rejects duplicated executable paths', () => {
    const f = archive([['package/bin/fuigo.br', Buffer.from('x')]]);
    expect(() => decode(f.bytes, f.pin, '1.0.6', 'darwin-arm64')).toThrow('Duplicate');
  });
  it('rejects a platform substitution', () => {
    const f = archive();
    expect(() => decode(f.bytes, f.pin, '1.0.6', 'linux-arm64')).toThrow('identity mismatch');
  });
  it.each(['latest', '^1.0.6', '1.0.7-rc.1', '../1.0.6'])('rejects unpinned version %s', (v) =>
    expect(() => exactVersion(v)).toThrow()
  );
});
