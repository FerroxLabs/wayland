/**
 * Supply-chain guards for the optional wayland-core binary installed by the
 * published getwayland package. This module intentionally uses only Node.js
 * built-ins so the postinstall hook does not add another package dependency.
 */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  openSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { get } from 'node:https';
import { basename, dirname, isAbsolute, join, posix } from 'node:path';
import { gunzipSync } from 'node:zlib';

const INITIAL_HOST = 'github.com';
const REDIRECT_HOST = 'release-assets.githubusercontent.com';
const RELEASE_PATH_PREFIX = '/FerroxLabs/wayland-core/releases/download/';
const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 512 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const TRIPLES = {
  'linux-x64': 'x86_64-unknown-linux-gnu',
  'linux-arm64': 'aarch64-unknown-linux-gnu',
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
};

/** Validate a release URL before any network request is made. */
export function validateWcoreDownloadUrl(value, isRedirect = false) {
  let url;
  try {
    url = value instanceof URL ? new URL(value.href) : new URL(value);
  } catch {
    throw new Error('Invalid wayland-core download URL.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Wayland Core downloads require HTTPS.');
  }
  if (url.username || url.password) {
    throw new Error('Wayland Core download URLs must not contain credentials.');
  }
  if (url.port && url.port !== '443') {
    throw new Error('Wayland Core download URLs must use the default HTTPS port.');
  }
  if (url.hash) {
    throw new Error('Wayland Core download URLs must not contain fragments.');
  }

  if (url.hostname === INITIAL_HOST) {
    if (!url.pathname.startsWith(RELEASE_PATH_PREFIX)) {
      throw new Error('Wayland Core GitHub URL is outside the pinned release path.');
    }
    return url;
  }
  if (isRedirect && url.hostname === REDIRECT_HOST) return url;

  throw new Error(`Untrusted Wayland Core download host: ${url.hostname || '(missing)'}.`);
}

/** Resolve and validate a redirect, including relative Location headers. */
export function resolveTrustedRedirect(currentUrl, location) {
  if (typeof location !== 'string' || location.trim() === '') {
    throw new Error('Wayland Core download redirect is missing a Location header.');
  }
  const current = validateWcoreDownloadUrl(currentUrl, true);
  return validateWcoreDownloadUrl(new URL(location, current), true);
}

/** Select a checksum-pinned asset and reject malformed or drifted manifests. */
export function selectWcoreAsset(platform, arch, manifest) {
  if (!manifest || typeof manifest !== 'object' || !/^v\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new Error('Wayland Core checksum manifest has an invalid pinned version.');
  }

  const runtimeKey = `${platform}-${arch}`;
  const triple = TRIPLES[runtimeKey];
  if (!triple) throw new Error(`Unsupported platform for Wayland Core: ${runtimeKey}.`);

  const asset = manifest.assets?.[runtimeKey];
  if (!asset || typeof asset !== 'object') {
    throw new Error(`Missing pinned Wayland Core asset for ${runtimeKey}.`);
  }
  const expectedFilename = `wayland-core-${manifest.version}-${triple}.tar.gz`;
  if (asset.filename !== expectedFilename) {
    throw new Error(`Pinned Wayland Core asset filename mismatch for ${runtimeKey}.`);
  }
  if (typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
    throw new Error(`Missing or malformed Wayland Core checksum for ${runtimeKey}.`);
  }

  return { filename: asset.filename, sha256: asset.sha256 };
}

/** Publish a verified engine with an exclusive same-directory staging file. */
export function publishEngineAtomically(engine, destBin) {
  if (!Buffer.isBuffer(engine) || engine.length === 0) {
    throw new Error('Wayland Core engine must be a non-empty buffer.');
  }
  if (typeof destBin !== 'string' || !isAbsolute(destBin) || basename(destBin) === '') {
    throw new Error('Wayland Core destination must be an absolute file path.');
  }

  const tempPath = join(dirname(destBin), `.${basename(destBin)}.${process.pid}.${randomUUID()}.tmp`);
  const noFollow = constants.O_NOFOLLOW ?? 0;
  let fd;
  let staged = false;
  let published = false;

  try {
    fd = openSync(tempPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o700);
    staged = true;
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1) {
      throw new Error('Wayland Core staging path is not an exclusive regular file.');
    }

    writeFileSync(fd, engine);
    const written = fstatSync(fd);
    if (!written.isFile() || written.nlink !== 1 || written.size !== engine.length) {
      throw new Error('Wayland Core staging file failed validation.');
    }
    fchmodSync(fd, 0o755);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;

    renameSync(tempPath, destBin);
    published = true;
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (staged && !published) rmSync(tempPath, { force: true });
  }
}

/** Download a bounded archive while validating every redirect hop. */
export function downloadTrustedArchive(value, redirects = 0) {
  const url = validateWcoreDownloadUrl(value, redirects > 0);
  if (redirects > MAX_REDIRECTS) {
    return Promise.reject(new Error('Wayland Core download exceeded the redirect limit.'));
  }

  return new Promise((resolve, reject) => {
    const request = get(url, { headers: { 'User-Agent': 'getwayland-installer' } }, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        let next;
        try {
          next = resolveTrustedRedirect(url, response.headers.location);
        } catch (error) {
          reject(error);
          return;
        }
        downloadTrustedArchive(next, redirects + 1).then(resolve, reject);
        return;
      }

      if (status !== 200) {
        response.resume();
        reject(new Error(`Wayland Core download failed with HTTP ${status}.`));
        return;
      }

      const declaredLength = Number(response.headers['content-length'] ?? 0);
      if (Number.isFinite(declaredLength) && declaredLength > MAX_ARCHIVE_BYTES) {
        response.destroy();
        reject(new Error('Wayland Core archive exceeds the maximum download size.'));
        return;
      }

      const chunks = [];
      let total = 0;
      response.on('data', (chunk) => {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += bytes.length;
        if (total > MAX_ARCHIVE_BYTES) {
          response.destroy(new Error('Wayland Core archive exceeds the maximum download size.'));
          return;
        }
        chunks.push(bytes);
      });
      response.on('end', () => resolve(Buffer.concat(chunks, total)));
      response.on('error', reject);
      response.on('aborted', () => reject(new Error('Wayland Core download was aborted.')));
    });
    request.on('error', reject);
    request.setTimeout(120_000, () => request.destroy(new Error('Wayland Core download timed out.')));
  });
}

function readTarString(header, offset, length) {
  const field = header.subarray(offset, offset + length);
  const nul = field.indexOf(0);
  return field.subarray(0, nul === -1 ? field.length : nul).toString('utf8');
}

function readTarOctal(header, offset, length, label) {
  const field = header.subarray(offset, offset + length);
  if ((field[0] & 0x80) !== 0) {
    throw new Error(`Unsupported base-256 tar ${label}.`);
  }
  const value = field.toString('ascii').replace(/\0.*$/s, '').trim();
  if (value === '') return 0;
  if (!/^[0-7]+$/.test(value)) throw new Error(`Malformed tar ${label}.`);
  const parsed = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`Invalid tar ${label}.`);
  return parsed;
}

function validateTarHeaderChecksum(header) {
  const stored = readTarOctal(header, 148, 8, 'header checksum');
  let actual = 0;
  for (let index = 0; index < header.length; index += 1) {
    actual += index >= 148 && index < 156 ? 0x20 : header[index];
  }
  if (stored !== actual) throw new Error('Wayland Core archive has an invalid tar header checksum.');
}

function validateArchivePath(value) {
  if (!value || value.includes('\\') || value.startsWith('/') || /^[A-Za-z]:/.test(value)) {
    throw new Error(`Unsafe archive path: ${value || '(empty)'}.`);
  }
  const parts = value.split('/').filter((part) => part !== '' && part !== '.');
  if (parts.length === 0 || parts.some((part) => part === '..')) {
    throw new Error(`Unsafe archive path: ${value}.`);
  }
  const normalized = parts.join('/');
  if (posix.isAbsolute(normalized) || normalized.startsWith('../')) {
    throw new Error(`Unsafe archive path: ${value}.`);
  }
  return normalized;
}

function extractRegularEngine(tarBuffer) {
  let offset = 0;
  let engine = null;
  let foundEndMarker = false;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      foundEndMarker = true;
      break;
    }
    validateTarHeaderChecksum(header);

    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const archivePath = validateArchivePath(prefix ? `${prefix}/${name}` : name);
    const type = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
    const size = readTarOctal(header, 124, 12, 'entry size');
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > tarBuffer.length) throw new Error('Wayland Core archive contains a truncated entry.');

    if (type === '1') throw new Error(`Wayland Core archive contains a hard link: ${archivePath}.`);
    if (type === '2') throw new Error(`Wayland Core archive contains a symbolic link: ${archivePath}.`);
    if (type !== '0' && type !== '5') {
      throw new Error(`Wayland Core archive contains unsupported entry type ${type}: ${archivePath}.`);
    }
    if (type === '5' && size !== 0) {
      throw new Error(`Wayland Core archive directory has unexpected content: ${archivePath}.`);
    }

    if (type === '0' && /^(aionrs|wayland-core|wcore)$/.test(posix.basename(archivePath))) {
      if (engine) throw new Error('Wayland Core archive contains multiple engine binaries.');
      if (size === 0) throw new Error('Wayland Core archive engine binary is empty.');
      engine = Buffer.from(tarBuffer.subarray(dataStart, dataEnd));
    }

    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  if (!foundEndMarker) throw new Error('Wayland Core archive is missing the tar end marker.');
  if (!engine) throw new Error('Wayland Core engine binary not found in archive.');
  return engine;
}

/** Verify the compressed archive before parsing it, then return one regular binary. */
export function verifyAndExtractEngine(archive, expectedSha256) {
  if (!Buffer.isBuffer(archive) || archive.length === 0 || archive.length > MAX_ARCHIVE_BYTES) {
    throw new Error('Wayland Core archive is empty or exceeds the maximum size.');
  }
  if (typeof expectedSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(expectedSha256)) {
    throw new Error('Wayland Core expected checksum is missing or malformed.');
  }

  const actual = createHash('sha256').update(archive).digest();
  const expected = Buffer.from(expectedSha256, 'hex');
  if (!timingSafeEqual(actual, expected)) {
    throw new Error(
      `Wayland Core archive checksum mismatch (expected ${expectedSha256}, got ${actual.toString('hex')}).`
    );
  }

  let expanded;
  try {
    expanded = gunzipSync(archive, { maxOutputLength: MAX_EXPANDED_BYTES });
  } catch (error) {
    throw new Error(`Wayland Core archive could not be safely decompressed: ${error.message}`);
  }
  return extractRegularEngine(expanded);
}
