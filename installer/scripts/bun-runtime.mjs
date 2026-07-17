import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  constants as fsConstants,
  copyFileSync,
  createReadStream,
  createWriteStream,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { get } from 'node:https';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST_PATH = join(HERE, 'bun-runtime-manifest.json');
const DEFAULT_MAX_ARCHIVE_BYTES = 150 * 1024 * 1024;
const MAX_EXPANDED_ENTRY_BYTES = 256 * 1024 * 1024;
const MAX_EXPANDED_TOTAL_BYTES = 320 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_ARCHIVE_ENTRIES = 32;

const CANONICAL_ASSET_BY_RUNTIME = Object.freeze({
  'darwin-arm64': 'bun-darwin-aarch64.zip',
  'darwin-x64': 'bun-darwin-x64-baseline.zip',
  'linux-arm64': 'bun-linux-aarch64.zip',
  'linux-arm64-musl': 'bun-linux-aarch64-musl.zip',
  'linux-x64': 'bun-linux-x64-baseline.zip',
  'linux-x64-musl': 'bun-linux-x64-musl-baseline.zip',
});

function readManifest() {
  return JSON.parse(readFileSync(DEFAULT_MANIFEST_PATH, 'utf8'));
}

function ensureRegularDirectory(path, label, mode) {
  try {
    mkdirSync(path, { mode });
  } catch (error) {
    if (!(error instanceof Error) || error.code !== 'EEXIST') {
      throw error;
    }
  }

  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} is not a regular directory.`);
  }
}

function validateHttpsUrl(value, label) {
  const url = value instanceof URL ? new URL(value.href) : new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error(`${label} must use HTTPS.`);
  }
  if (url.username || url.password) {
    throw new Error(`${label} must not contain credentials.`);
  }
  if (url.port && url.port !== '443') {
    throw new Error(`${label} must use the default HTTPS port.`);
  }
  return url;
}

export function detectLinuxLibc(
  platform = process.platform,
  report = platform === 'linux' ? process.report?.getReport?.() : undefined
) {
  if (platform !== 'linux') return null;
  if (!report || typeof report !== 'object' || !report.header || typeof report.header !== 'object') {
    throw new Error('Could not detect the Linux libc runtime.');
  }

  const glibcVersion = report.header.glibcVersionRuntime;
  if (typeof glibcVersion === 'string' && glibcVersion.trim() !== '') return 'glibc';
  if (glibcVersion !== undefined) {
    throw new Error('Could not detect the Linux libc runtime.');
  }

  const sharedObjects = report.sharedObjects;
  if (
    Array.isArray(sharedObjects) &&
    sharedObjects.every((entry) => typeof entry === 'string') &&
    sharedObjects.some((entry) => entry.includes('libc.musl-') || entry.includes('ld-musl-'))
  ) {
    return 'musl';
  }
  throw new Error('Could not detect the Linux libc runtime.');
}

export function selectBunAsset(
  platform,
  arch,
  manifest = readManifest(),
  libc = platform === 'linux' ? 'glibc' : null
) {
  if (!/^1\.\d+\.\d+$/.test(manifest?.version ?? '')) {
    throw new Error('Pinned Bun runtime manifest has an invalid version.');
  }

  if (platform === 'linux' && libc !== 'glibc' && libc !== 'musl') {
    throw new Error(`Unsupported Linux libc for the pinned Bun runtime: ${String(libc)}.`);
  }
  const key = platform === 'linux' && libc === 'musl' ? `${platform}-${arch}-musl` : `${platform}-${arch}`;
  const canonicalFilename = CANONICAL_ASSET_BY_RUNTIME[key];
  if (!canonicalFilename) {
    throw new Error(`Unsupported platform for the pinned Bun runtime: ${key}.`);
  }

  const asset = manifest?.assets?.[key];
  if (!asset) {
    throw new Error(`Pinned Bun runtime manifest is missing ${key}.`);
  }
  if (asset.filename !== canonicalFilename) {
    throw new Error(`Pinned Bun runtime manifest does not use the canonical asset for ${key}.`);
  }
  if (!/^[a-f0-9]{64}$/.test(asset.sha256 ?? '')) {
    throw new Error(`Pinned Bun runtime checksum is invalid for ${key}.`);
  }
  return asset;
}

export function validateBunReleaseUrl(value, version, filename) {
  if (!/^1\.\d+\.\d+$/.test(version) || !/^bun-[a-z0-9-]+\.zip$/.test(filename)) {
    throw new Error('Pinned Bun release coordinates are invalid.');
  }
  const url = validateHttpsUrl(value, 'Bun runtime release URL');
  if (url.hostname.toLowerCase() !== 'github.com') {
    throw new Error(`Bun runtime release host is not trusted: ${url.hostname}.`);
  }
  const canonicalPath = `/oven-sh/bun/releases/download/bun-v${version}/${filename}`;
  if (url.pathname !== canonicalPath || url.search || url.hash) {
    throw new Error('Bun runtime release URL is not the canonical pinned asset URL.');
  }
  return url;
}

export function validateBunRedirectUrl(value) {
  const url = validateHttpsUrl(value, 'Bun runtime redirect URL');
  if (url.hostname.toLowerCase() !== 'release-assets.githubusercontent.com') {
    throw new Error(`Bun runtime redirect host is not trusted: ${url.hostname}.`);
  }
  return url;
}

export function validateArchiveEntryNames(names, expectedRoot) {
  if (!Array.isArray(names) || names.length === 0 || names.length > MAX_ARCHIVE_ENTRIES) {
    throw new Error('Bun runtime archive has an invalid entry count.');
  }
  if (!/^[A-Za-z0-9._+-]+$/.test(expectedRoot)) {
    throw new Error('Bun runtime archive root is invalid.');
  }

  const unique = new Set();
  for (const name of names) {
    if (
      typeof name !== 'string' ||
      name.length === 0 ||
      name.length > 512 ||
      name.includes('\0') ||
      name.includes('\\') ||
      name.startsWith('/') ||
      /^[A-Za-z]:/.test(name) ||
      !/^[A-Za-z0-9._/@+-]+$/.test(name)
    ) {
      throw new Error(`Unsafe Bun runtime archive entry: ${JSON.stringify(name)}.`);
    }

    const parts = name.split('/');
    const pathParts = name.endsWith('/') ? parts.slice(0, -1) : parts;
    if (
      pathParts.length === 0 ||
      pathParts[0] !== expectedRoot ||
      pathParts.some((part) => part === '' || part === '.' || part === '..')
    ) {
      throw new Error(`Bun runtime archive entry escapes its expected root: ${name}.`);
    }
    if (unique.has(name)) {
      throw new Error(`Bun runtime archive contains a duplicate entry: ${name}.`);
    }
    unique.add(name);
  }

  if (!unique.has(`${expectedRoot}/bun`)) {
    throw new Error('Bun runtime archive does not contain the expected executable.');
  }
}

export function validateArchiveEntryModes(metadata, names) {
  const lines = String(metadata).split(/\r?\n/);
  let expandedTotal = 0;

  for (const name of names) {
    const line = lines.find((candidate) => candidate.endsWith(` ${name}`));
    if (!line) {
      throw new Error(`Bun runtime archive metadata is missing for ${name}.`);
    }

    const fields = line.trim().split(/\s+/);
    const mode = fields[0] ?? '';
    if (mode.startsWith('l')) {
      throw new Error(`Bun runtime archive contains a symlink: ${name}.`);
    }
    const expectedType = name.endsWith('/') ? 'd' : '-';
    if (mode[0] !== expectedType || !/^[dl-][rwxStTs-]{9}$/.test(mode)) {
      throw new Error(`Bun runtime archive contains an unsupported entry type: ${name}.`);
    }

    const expandedBytes = Number(fields[3]);
    if (!Number.isSafeInteger(expandedBytes) || expandedBytes < 0 || expandedBytes > MAX_EXPANDED_ENTRY_BYTES) {
      throw new Error(`Bun runtime archive entry has an unsafe expanded size: ${name}.`);
    }
    if (expectedType === 'd' && expandedBytes !== 0) {
      throw new Error(`Bun runtime archive directory has an invalid expanded size: ${name}.`);
    }
    expandedTotal += expandedBytes;
    if (!Number.isSafeInteger(expandedTotal) || expandedTotal > MAX_EXPANDED_TOTAL_BYTES) {
      throw new Error('Bun runtime archive exceeds the total expanded size limit.');
    }
  }
  return expandedTotal;
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

export async function downloadPinnedBunArchive({
  version,
  filename,
  destination,
  getImpl = get,
  maxArchiveBytes = DEFAULT_MAX_ARCHIVE_BYTES,
  maxRedirects = DEFAULT_MAX_REDIRECTS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
}) {
  const canonicalUrl = validateBunReleaseUrl(
    `https://github.com/oven-sh/bun/releases/download/bun-v${version}/${filename}`,
    version,
    filename
  );
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes <= 0) {
    throw new Error('Bun runtime download size limit is invalid.');
  }

  let destinationCreated = false;
  try {
    await downloadUrl(canonicalUrl, 0);
  } catch (error) {
    if (destinationCreated) rmSync(destination, { force: true });
    throw error;
  }

  async function downloadUrl(value, redirectCount) {
    const url = redirectCount === 0 ? canonicalUrl : validateBunRedirectUrl(value);
    await new Promise((resolve, reject) => {
      const request = getImpl(
        url,
        {
          headers: {
            Accept: 'application/octet-stream',
            'User-Agent': 'getwayland-installer',
          },
        },
        (response) => {
          const status = response.statusCode ?? 0;
          if ([301, 302, 303, 307, 308].includes(status)) {
            const location = response.headers.location;
            response.resume();
            if (!location) {
              reject(new Error('Bun runtime redirect did not include a destination.'));
              return;
            }
            if (redirectCount >= maxRedirects) {
              reject(new Error('Bun runtime download exceeded the redirect limit.'));
              return;
            }
            let next;
            try {
              next = validateBunRedirectUrl(new URL(location, url));
            } catch (error) {
              reject(error);
              return;
            }
            downloadUrl(next, redirectCount + 1).then(resolve, reject);
            return;
          }
          if (status !== 200) {
            response.resume();
            reject(new Error(`Bun runtime download failed with HTTP ${status}.`));
            return;
          }

          const lengthHeader = response.headers['content-length'];
          const declaredLength = lengthHeader === undefined ? null : Number(lengthHeader);
          if (
            declaredLength !== null &&
            (!Number.isSafeInteger(declaredLength) || declaredLength < 0 || declaredLength > maxArchiveBytes)
          ) {
            response.resume();
            reject(new Error('Bun runtime download declared an invalid size.'));
            return;
          }

          let received = 0;
          const limiter = new Transform({
            transform(chunk, _encoding, callback) {
              received += chunk.length;
              if (received > maxArchiveBytes) {
                callback(new Error('Bun runtime download exceeded the maximum size.'));
                return;
              }
              callback(null, chunk);
            },
          });
          const output = createWriteStream(destination, { flags: 'wx', mode: 0o600 });
          output.once('open', () => {
            destinationCreated = true;
          });

          pipeline(response, limiter, output).then(() => {
            if (declaredLength !== null && received !== declaredLength) {
              reject(new Error('Bun runtime download was truncated.'));
              return;
            }
            resolve();
          }, reject);
        }
      );
      request.setTimeout(requestTimeoutMs, () => {
        request.destroy(new Error('Bun runtime download timed out.'));
      });
      request.on('error', reject);
    });
  }
}

export function inspectArchive(archivePath, expectedRoot, { spawnImpl = spawnSync } = {}) {
  const nameListing = spawnImpl('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    shell: false,
  });
  if (nameListing.status !== 0) {
    throw new Error(`Could not inspect the Bun runtime archive: ${nameListing.stderr || 'unzip failed'}`);
  }
  const names = nameListing.stdout.split(/\r?\n/).filter(Boolean);
  validateArchiveEntryNames(names, expectedRoot);

  const modeListing = spawnImpl('unzip', ['-Z', '-l', archivePath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    shell: false,
  });
  if (modeListing.status !== 0) {
    throw new Error(`Could not inspect Bun runtime entry modes: ${modeListing.stderr || 'unzip failed'}`);
  }
  validateArchiveEntryModes(modeListing.stdout, names);
  return names;
}

export function extractArchive(archivePath, extractionRoot, expectedRoot, { spawnImpl = spawnSync } = {}) {
  mkdirSync(extractionRoot, { recursive: true, mode: 0o700 });
  const extraction = spawnImpl('unzip', ['-q', archivePath, '-d', extractionRoot], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    shell: false,
  });
  if (extraction.status !== 0) {
    throw new Error(`Could not extract the Bun runtime: ${extraction.stderr || 'unzip failed'}`);
  }

  const extractedBinary = join(extractionRoot, expectedRoot, 'bun');
  const extractedStat = lstatSync(extractedBinary);
  if (
    !extractedStat.isFile() ||
    extractedStat.isSymbolicLink() ||
    extractedStat.size <= 0 ||
    extractedStat.size > MAX_EXPANDED_ENTRY_BYTES
  ) {
    throw new Error('Extracted Bun runtime is not a bounded regular file.');
  }
  return extractedBinary;
}

export function verifyPinnedBunBinary(binaryPath, expectedVersion, { spawnImpl = spawnSync } = {}) {
  const binaryStat = lstatSync(binaryPath);
  if (!binaryStat.isFile() || binaryStat.isSymbolicLink()) {
    throw new Error('Staged Bun runtime is not a regular file.');
  }
  const verification = spawnImpl(binaryPath, ['--version'], {
    encoding: 'utf8',
    shell: false,
    timeout: 10_000,
  });
  if (verification.error || verification.status !== 0 || String(verification.stdout ?? '').trim() !== expectedVersion) {
    throw new Error('Staged Bun runtime failed its pinned version check.');
  }
}

export async function installPinnedBun(
  {
    platform = process.platform,
    arch = process.arch,
    libc = detectLinuxLibc(platform),
    homeDirectory = homedir(),
    temporaryDirectory = tmpdir(),
    manifest = readManifest(),
  } = {},
  dependencies = {}
) {
  const download = dependencies.downloadPinnedBunArchive ?? downloadPinnedBunArchive;
  const inspect = dependencies.inspectArchive ?? inspectArchive;
  const extract = dependencies.extractArchive ?? extractArchive;
  const verify = dependencies.verifyPinnedBunBinary ?? verifyPinnedBunBinary;
  const asset = selectBunAsset(platform, arch, manifest, libc);
  const archiveRoot = basename(asset.filename, '.zip');

  mkdirSync(temporaryDirectory, { recursive: true, mode: 0o700 });
  const temporaryRoot = mkdtempSync(join(temporaryDirectory, 'getwayland-bun-'));
  const archivePath = join(temporaryRoot, asset.filename);
  const extractionRoot = join(temporaryRoot, 'extracted');
  let stagingDirectory;

  try {
    await download({
      version: manifest.version,
      filename: asset.filename,
      destination: archivePath,
    });
    const actualSha256 = await sha256File(archivePath);
    if (actualSha256 !== asset.sha256) {
      throw new Error(
        `Bun runtime checksum mismatch for ${asset.filename}: expected ${asset.sha256}, received ${actualSha256}.`
      );
    }

    inspect(archivePath, archiveRoot);
    const extractedBinary = extract(archivePath, extractionRoot, archiveRoot);

    mkdirSync(homeDirectory, { recursive: true, mode: 0o755 });
    const bunDirectory = join(homeDirectory, '.bun');
    ensureRegularDirectory(bunDirectory, 'Bun runtime parent directory', 0o755);
    const destinationDirectory = join(bunDirectory, 'bin');
    ensureRegularDirectory(destinationDirectory, 'Bun runtime destination', 0o755);
    const destination = join(destinationDirectory, 'bun');

    stagingDirectory = mkdtempSync(join(destinationDirectory, '.bun-install-'));
    const stagedBinary = join(stagingDirectory, 'bun');
    copyFileSync(extractedBinary, stagedBinary, fsConstants.COPYFILE_EXCL);
    chmodSync(stagedBinary, 0o755);
    verify(stagedBinary, manifest.version);

    // A hard link publishes the already-verified inode atomically and fails
    // with EEXIST instead of replacing a prior file or following a symlink.
    linkSync(stagedBinary, destination);
    return destination;
  } finally {
    if (stagingDirectory) rmSync(stagingDirectory, { recursive: true, force: true });
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
