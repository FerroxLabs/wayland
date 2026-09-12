const crypto = require('node:crypto');
const { gunzipSync, brotliDecompressSync } = require('node:zlib');
const TARGETS = ['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-arm64', 'win32-x64'];
function exactVersion(value) {
  if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/.test(value))
    throw new Error('Fuigo requires an exact stable version');
  return value;
}
function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}
async function download(url, limit) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://registry.npmjs.org' || parsed.username || parsed.password)
    throw new Error('Untrusted Fuigo distribution URL');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(120000) });
  if (!response.ok || !response.body) throw new Error(`Fuigo download failed: HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) {
      throw new Error('Fuigo distribution exceeds size limit');
    }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
async function metadata(version, runtime) {
  exactVersion(version);
  if (!TARGETS.includes(runtime)) throw new Error('Unsupported Fuigo target');
  const name = `@fuigo/${runtime}`;
  const value = JSON.parse(
    (await download(`https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`, 1024 * 1024)).toString('utf8')
  );
  if (value.name !== name || value.version !== version || !value.dist?.integrity?.startsWith('sha512-'))
    throw new Error('Fuigo registry identity mismatch');
  return { url: value.dist.tarball, integrity: value.dist.integrity };
}
function readEntries(archive) {
  const tar = gunzipSync(archive, { maxOutputLength: 256 * 1024 * 1024 });
  const entries = new Map();
  const string = (b) => b.toString('utf8').split('\0')[0];
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const sizeText = string(header.subarray(124, 136)).trim();
    if (!/^[0-7]+$/.test(sizeText)) throw new Error('Invalid Fuigo tar entry size');
    const size = parseInt(sizeText, 8);
    const end = offset + 512 + size;
    if (!Number.isSafeInteger(size) || end > tar.length) throw new Error('Truncated Fuigo archive');
    const prefix = string(header.subarray(345, 500));
    const name = (prefix ? prefix + '/' : '') + string(header.subarray(0, 100));
    if (name.startsWith('/') || name.split('/').includes('..') || name.includes('\\'))
      throw new Error('Unsafe Fuigo archive path');
    if (header[156] === 48 || header[156] === 0) {
      if (entries.has(name)) throw new Error('Duplicate Fuigo archive entry');
      entries.set(name, tar.subarray(offset + 512, end));
    } else if (header[156] !== 53) throw new Error('Unsupported Fuigo archive entry type');
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}
function decode(archive, pin, version, runtime) {
  exactVersion(version);
  if (!TARGETS.includes(runtime)) throw new Error('Unsupported Fuigo target');
  const integrity = 'sha512-' + crypto.createHash('sha512').update(archive).digest('base64');
  if (integrity !== pin.integrity) throw new Error('Fuigo package integrity mismatch');
  const entries = readEntries(archive);
  const pkg = JSON.parse(entries.get('package/package.json')?.toString('utf8') || 'null');
  if (pkg?.name !== `@fuigo/${runtime}` || pkg?.version !== version) throw new Error('Fuigo package identity mismatch');
  const name = runtime.startsWith('win32-') ? 'fuigo.exe' : 'fuigo';
  const compressed = entries.get('package/bin/' + name + '.br');
  if (!compressed) throw new Error('Fuigo binary missing');
  const binary = brotliDecompressSync(compressed, { maxOutputLength: 512 * 1024 * 1024 });
  if (runtime.startsWith('darwin-')) {
    if (
      binary.readUInt32LE(0) !== 0xfeedfacf ||
      binary.readUInt32LE(4) !== (runtime.endsWith('arm64') ? 0x100000c : 0x1000007)
    )
      throw new Error('Fuigo Mach-O target mismatch');
  } else if (runtime.startsWith('linux-')) {
    if (
      binary.subarray(0, 4).toString('hex') !== '7f454c46' ||
      binary[4] !== 2 ||
      binary.readUInt16LE(18) !== (runtime.endsWith('arm64') ? 183 : 62)
    )
      throw new Error('Fuigo ELF target mismatch');
  } else {
    const pe = binary.readUInt32LE(60);
    if (
      binary.subarray(0, 2).toString() !== 'MZ' ||
      binary.subarray(pe, pe + 4).toString('hex') !== '50450000' ||
      binary.readUInt16LE(pe + 4) !== (runtime.endsWith('arm64') ? 0xaa64 : 0x8664)
    )
      throw new Error('Fuigo PE target mismatch');
  }
  const notices = [...entries].filter(
    ([path]) => /(?:LICENSE|LICENCE|NOTICE)/.test(path) && path !== 'package/package.json'
  );
  return { binary, name, binarySha256: digest(binary), archiveSha256: digest(archive), notices };
}
module.exports = { TARGETS, exactVersion, digest, download, metadata, decode };
