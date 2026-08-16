#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const require = createRequire(import.meta.url);
const {
  findPackagedCandidates,
  inspectExecutable,
  verifyPackagedResources,
} = require('./verify-packaged-resources.js');
const { isSupportedWNanoTarget } = require('./prepareWaylandNano.js');

const TAG = '[platform-package-smoke]';
const OPTIONAL_RESOURCES = ['hub', 'whatsapp-bridge', 'signal-cli-runtime'];
const VALID_PLATFORMS = new Set(['darwin', 'linux', 'win32']);
const VALID_ARCHES = new Set(['x64', 'arm64']);
const VALID_RELEASE_TRACKS = new Set(['stable', 'preview']);
const INSTALLER_EXTENSIONS = { darwin: '.dmg', linux: '.deb', win32: '.exe' };
const SMOKE_EVENT_CONTRACT = 'wayland-package-smoke-event/1';
const SMOKE_EVENT_FILE = 'package-smoke-events.jsonl';
const REQUIRED_SMOKE_EVENTS = [
  'boot-start',
  'renderer-load-start',
  'renderer-loaded',
  'cleanup-start',
  'cleanup-complete',
  'will-quit',
  'quit',
];
const FAILURE_SMOKE_EVENTS = new Set([
  'renderer-load-failed',
  'did-fail-load',
  'render-process-gone',
  'renderer-unresponsive',
  'renderer-recovery-attempt',
  'cleanup-failed',
]);

export function expectedReleaseIdentity(releaseTrack, targetPlatform, targetArch) {
  if (!VALID_RELEASE_TRACKS.has(releaseTrack)) throw new Error(`${TAG} invalid release track: ${releaseTrack}`);
  const preview = releaseTrack === 'preview';
  const productName = preview ? 'Wayland Preview' : 'Wayland';
  const executableName =
    targetPlatform === 'win32'
      ? `${productName}.exe`
      : targetPlatform === 'linux'
        ? preview
          ? 'wayland-preview'
          : 'wayland'
        : productName;
  const baseChannel = preview ? 'preview' : 'latest';
  const updateChannel =
    targetPlatform === 'win32' && targetArch === 'arm64'
      ? `${baseChannel}-win-arm64`
      : targetPlatform === 'darwin' && targetArch === 'arm64'
        ? `${baseChannel}-arm64`
        : baseChannel;
  return {
    releaseTrack,
    productName,
    executableName,
    bundleName: `${productName}.app`,
    protocolScheme: preview ? 'wayland-preview' : 'wayland',
    updateChannel,
    shellExperience: 'classic',
  };
}

export function parseArgs(argv, cwd = process.cwd()) {
  const allowed = new Set([
    '--out',
    '--target-platform',
    '--target-arch',
    '--release-track',
    '--candidate-state-file',
    '--candidate-state-digest',
    '--capture-state',
    '--github-output',
    '--timeout-ms',
  ]);
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(flag)) throw new Error(`${TAG} unknown argument: ${flag || '<missing>'}`);
    if (!value || value.startsWith('--')) throw new Error(`${TAG} missing value for ${flag}`);
    if (values.has(flag)) throw new Error(`${TAG} duplicate argument: ${flag}`);
    values.set(flag, value);
  }

  for (const required of ['--out', '--target-platform', '--target-arch', '--release-track']) {
    if (!values.has(required)) throw new Error(`${TAG} required argument missing: ${required}`);
  }
  const targetPlatform = values.get('--target-platform');
  const targetArch = values.get('--target-arch');
  const releaseTrack = values.get('--release-track');
  if (!VALID_PLATFORMS.has(targetPlatform)) throw new Error(`${TAG} invalid target platform: ${targetPlatform}`);
  if (!VALID_ARCHES.has(targetArch)) throw new Error(`${TAG} invalid target architecture: ${targetArch}`);
  if (!VALID_RELEASE_TRACKS.has(releaseTrack)) throw new Error(`${TAG} invalid release track: ${releaseTrack}`);
  const captureState = values.get('--capture-state');
  const candidateStateFile = values.get('--candidate-state-file');
  if (Boolean(captureState) === Boolean(candidateStateFile)) {
    throw new Error(`${TAG} declare exactly one of --capture-state or --candidate-state-file`);
  }
  const candidateStateDigest = values.get('--candidate-state-digest');
  const githubOutput = values.get('--github-output');
  if (captureState && (!githubOutput || candidateStateDigest)) {
    throw new Error(`${TAG} capture mode requires --github-output and forbids --candidate-state-digest`);
  }
  if (candidateStateFile && (!/^sha256:[a-f0-9]{64}$/.test(candidateStateDigest || '') || githubOutput)) {
    throw new Error(`${TAG} smoke mode requires --candidate-state-digest and forbids --github-output`);
  }
  const timeoutMs = Number(values.get('--timeout-ms') || 45_000);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 180_000) {
    throw new Error(`${TAG} --timeout-ms must be an integer from 1000 through 180000`);
  }
  return {
    outDir: path.resolve(cwd, values.get('--out')),
    targetPlatform,
    targetArch,
    releaseTrack,
    mode: captureState ? 'capture' : 'smoke',
    candidateStateFile: path.resolve(cwd, captureState || candidateStateFile),
    candidateStateDigest,
    githubOutput: githubOutput ? path.resolve(cwd, githubOutput) : null,
    timeoutMs,
  };
}

function updateHashWithFile(hash, filePath) {
  const descriptor = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead);
  } finally {
    fs.closeSync(descriptor);
  }
}

export function candidateContentDigest(candidate) {
  const root = fs.realpathSync(candidate.appDir);
  const hash = crypto.createHash('sha256');
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => {
      return Buffer.from(left.name).compare(Buffer.from(right.name));
    })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      const stat = fs.lstatSync(absolute);
      const mode = stat.mode & 0o7777;
      if (stat.isDirectory()) {
        hash.update(`dir\0${relative}\0${mode.toString(8)}\0`);
        visit(absolute);
      } else if (stat.isFile()) {
        hash.update(`file\0${relative}\0${mode.toString(8)}\0${stat.size}\0`);
        updateHashWithFile(hash, absolute);
        hash.update('\0');
      } else if (stat.isSymbolicLink()) {
        // macOS framework bundles legitimately use symlinks. Hash the link
        // itself, but only after proving its complete resolution stays inside
        // the selected application payload. Dangling and escaping links fail.
        assertConfinedPath(root, absolute);
        hash.update(`symlink\0${relative}\0${mode.toString(8)}\0${fs.readlinkSync(absolute)}\0`);
      } else {
        throw new Error(`${TAG} unsupported packaged filesystem entry: ${absolute}`);
      }
    }
  };
  visit(root);
  return `sha256:${hash.digest('hex')}`;
}

export function currentSourceIdentity(cwd = process.cwd(), dependencies = {}) {
  const execute = dependencies.execFileSync || execFileSync;
  const git = (...args) => String(execute('git', args, { cwd, encoding: 'utf8' })).trim();
  const commit = git('rev-parse', 'HEAD');
  const tree = git('rev-parse', 'HEAD^{tree}');
  if (!/^[a-f0-9]{40,64}$/.test(commit) || !/^[a-f0-9]{40,64}$/.test(tree)) {
    throw new Error(`${TAG} source identity is not a valid Git commit/tree pair`);
  }
  // HEAD/tree identify only committed content. Without this clean-input gate a
  // package built from modified or untracked source can still be falsely
  // attributed to the untouched commit. Include every non-ignored untracked
  // path because a newly introduced build input is just as authoritative as a
  // modified tracked file.
  const dirty = git('status', '--porcelain=v1', '--untracked-files=all');
  if (dirty) {
    // Name the offending paths. Without them this gate reports only that something
    // changed, which is undiagnosable on a CI runner whose worktree is already gone
    // by the time anyone reads the log.
    const paths = dirty.split('\n').filter(Boolean);
    const shown = paths.slice(0, 20).join(', ');
    const rest = paths.length > 20 ? ` (+${paths.length - 20} more)` : '';
    throw new Error(
      `${TAG} source worktree is not clean; refusing immutable commit/tree attestation. ` +
        `Dirty paths: ${shown}${rest}`
    );
  }
  return { commit, tree };
}

function artifactContentDigest(filePath) {
  const stat = fs.lstatSync(filePath);
  if (!stat.isFile() || stat.size === 0) throw new Error(`${TAG} installer artifact is missing or empty: ${filePath}`);
  const hash = crypto.createHash('sha256');
  hash.update(`file\0${stat.mode & 0o7777}\0${stat.size}\0`);
  updateHashWithFile(hash, filePath);
  return `sha256:${hash.digest('hex')}`;
}

export function findInstallerArtifacts(outDir, targetPlatform) {
  const extension = INSTALLER_EXTENSIONS[targetPlatform];
  if (!extension || !fs.existsSync(outDir)) return [];
  return fs
    .readdirSync(outDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => path.join(outDir, entry.name))
    .sort((left, right) => Buffer.from(path.basename(left)).compare(Buffer.from(path.basename(right))));
}

function sha256Bytes(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

export function captureCandidateState(outDir, targetPlatform, targetArch, stateFile, options = {}) {
  const releaseTrack = options.releaseTrack;
  const releaseIdentity = expectedReleaseIdentity(releaseTrack, targetPlatform, targetArch);
  const candidates = findPackagedCandidates(outDir).filter((candidate) => {
    if (candidate.platform !== targetPlatform || candidate.arch !== targetArch) return false;
    if (path.basename(candidate.executablePath).toLowerCase() !== releaseIdentity.executableName.toLowerCase()) {
      return false;
    }
    return targetPlatform !== 'darwin' || path.basename(candidate.appDir) === releaseIdentity.bundleName;
  });
  const state = {
    contract: 'wayland-platform-package-candidate-state/2',
    target: `${targetPlatform}-${targetArch}`,
    releaseIdentity,
    sourceIdentity: options.sourceIdentity || currentSourceIdentity(options.sourceRoot || process.cwd(), options),
    captureNonce: options.captureNonce || crypto.randomBytes(32).toString('hex'),
    candidates: candidates.map((candidate) => ({
      executable: path.relative(outDir, candidate.executablePath).split(path.sep).join('/'),
      digest: candidateContentDigest(candidate),
    })),
    artifacts: findInstallerArtifacts(outDir, targetPlatform).map((artifactPath) => ({
      path: path.relative(outDir, artifactPath).split(path.sep).join('/'),
      digest: artifactContentDigest(artifactPath),
    })),
  };
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const bytes = Buffer.from(`${JSON.stringify(state, null, 2)}\n`);
  const digest = sha256Bytes(bytes);
  const temporary = `${stateFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, bytes, { flag: 'wx' });
  fs.renameSync(temporary, stateFile);
  if (options.githubOutput) {
    fs.appendFileSync(options.githubOutput, `candidate_state_digest=${digest}\n`);
  }
  return { state, digest };
}

function readCandidateState(stateFile, expectedDigest, targetPlatform, targetArch, releaseTrack, dependencies = {}) {
  const raw = fs.readFileSync(stateFile);
  const actualDigest = sha256Bytes(raw);
  if (actualDigest !== expectedDigest) {
    throw new Error(`${TAG} candidate state digest mismatch: expected ${expectedDigest}, observed ${actualDigest}`);
  }
  const text = raw.toString('utf8');
  const state = JSON.parse(text);
  const expectedIdentity = expectedReleaseIdentity(releaseTrack, targetPlatform, targetArch);
  if (
    state?.contract !== 'wayland-platform-package-candidate-state/2' ||
    state?.target !== `${targetPlatform}-${targetArch}` ||
    JSON.stringify(state?.releaseIdentity) !== JSON.stringify(expectedIdentity) ||
    !/^[a-f0-9]{40,64}$/.test(state?.sourceIdentity?.commit || '') ||
    !/^[a-f0-9]{40,64}$/.test(state?.sourceIdentity?.tree || '') ||
    !/^[a-f0-9]{64}$/.test(state?.captureNonce || '') ||
    !Array.isArray(state?.candidates) ||
    !Array.isArray(state?.artifacts) ||
    state.candidates.some(
      (candidate) => typeof candidate?.executable !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(candidate?.digest || '')
    ) ||
    state.artifacts.some(
      (artifact) => typeof artifact?.path !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(artifact?.digest || '')
    )
  ) {
    throw new Error(`${TAG} invalid or wrong-target candidate state: ${stateFile}`);
  }
  const canonical = `${JSON.stringify(state, null, 2)}\n`;
  if (text !== canonical) throw new Error(`${TAG} candidate state is not canonical: ${stateFile}`);
  const liveSourceIdentity = currentSourceIdentity(dependencies.sourceRoot || process.cwd(), dependencies);
  if (JSON.stringify(state.sourceIdentity) !== JSON.stringify(liveSourceIdentity)) {
    throw new Error(`${TAG} source commit/tree changed since candidate capture`);
  }
  return state;
}

export function assertFreshInstaller(
  artifactPath,
  candidateStateFile,
  candidateStateDigest,
  targetPlatform,
  targetArch,
  releaseTrack,
  dependencies = {}
) {
  const state = readCandidateState(
    candidateStateFile,
    candidateStateDigest,
    targetPlatform,
    targetArch,
    releaseTrack,
    dependencies
  );
  const artifactDigest = artifactContentDigest(artifactPath);
  const priorArtifactDigests = state.artifacts.map((entry) => entry.digest);
  if (priorArtifactDigests.includes(artifactDigest)) {
    throw new Error(`${TAG} stale installer output: artifact content digest is unchanged from pre-build state`);
  }
  return {
    artifactDigest,
    priorArtifactDigests,
    candidateStateDigest,
    captureNonce: state.captureNonce,
    sourceIdentity: state.sourceIdentity,
  };
}

export function assertFreshCandidate(
  candidate,
  candidateStateFile,
  candidateStateDigest,
  targetPlatform,
  targetArch,
  releaseTrack,
  dependencies = {}
) {
  const asarPath = path.join(candidate.resourceDir, 'app.asar');
  const asarStat = fs.lstatSync(asarPath);
  if (!asarStat.isFile() || asarStat.size === 0) {
    throw new Error(`${TAG} packaged application archive is missing or empty: ${asarPath}`);
  }
  const state = readCandidateState(
    candidateStateFile,
    candidateStateDigest,
    targetPlatform,
    targetArch,
    releaseTrack,
    dependencies
  );
  const candidateDigest = candidateContentDigest(candidate);
  const priorCandidateDigests = state.candidates.map((entry) => entry.digest);
  if (priorCandidateDigests.includes(candidateDigest)) {
    throw new Error(`${TAG} stale packaged output: candidate content digest is unchanged from pre-build state`);
  }
  const candidateStat = fs.statSync(candidate.appDir);
  return {
    candidateDigest,
    priorCandidateDigests,
    candidateStateDigest,
    captureNonce: state.captureNonce,
    sourceIdentity: state.sourceIdentity,
    diagnosticTimes: {
      candidateMtimeMs: candidateStat.mtimeMs,
      appAsarMtimeMs: asarStat.mtimeMs,
    },
  };
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const descriptor = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead);
  } finally {
    fs.closeSync(descriptor);
  }
  return hash.digest('hex');
}

export function parseOptionalCapabilityStates(lines) {
  const text = Array.isArray(lines) ? lines.join('\n') : String(lines);
  return Object.fromEntries(
    OPTIONAL_RESOURCES.map((resource) => {
      const ok = new RegExp(`\\bOK\\s+${resource.replace('-', '\\-')}\\b`).test(text);
      const missing = new RegExp(`\\bWARN\\s+${resource.replace('-', '\\-')}\\b`).test(text);
      if (ok === missing) {
        throw new Error(`${TAG} verifier did not report one honest state for optional capability: ${resource}`);
      }
      return [resource, ok ? 'available' : 'unavailable'];
    })
  );
}

function requestJson(url, timeoutMs = 1_500) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}`));
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('request timed out')));
    request.on('error', reject);
  });
}

function cdpCommand(webSocketUrl, method, params = {}, timeoutMs = 5_000) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error(`${TAG} CDP command timed out: ${method}`));
    }, timeoutMs);
    const finish = (callback, value) => {
      clearTimeout(timer);
      socket.close();
      callback(value);
    };
    socket.once('error', (error) => finish(reject, error));
    socket.once('open', () => socket.send(JSON.stringify({ id: 1, method, params })));
    socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (message.id !== 1) return;
      if (message.error) return finish(reject, new Error(`${TAG} CDP ${method} failed: ${message.error.message}`));
      finish(resolve, message.result);
    });
  });
}

function assertConfinedPath(root, candidatePath) {
  const realRoot = fs.realpathSync(root);
  const realCandidate = fs.realpathSync(candidatePath);
  const relative = path.relative(realRoot, realCandidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${TAG} installed payload escapes its private installation root: ${candidatePath}`);
  }
  return realCandidate;
}

function walkDirectories(root, visit) {
  const queue = [root];
  while (queue.length) {
    const directory = queue.shift();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        assertConfinedPath(root, absolute);
        continue;
      }
      if (!entry.isDirectory()) continue;
      if (visit(absolute, entry.name) === false) continue;
      queue.push(absolute);
    }
  }
}

function assertSelectedPayloadSymlinksAreConfined(appDir) {
  const queue = [appDir];
  while (queue.length) {
    const directory = queue.shift();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        assertConfinedPath(appDir, absolute);
        continue;
      }
      if (entry.isDirectory()) queue.push(absolute);
    }
  }
}

export function resolveInstalledCandidate(installRoot, targetPlatform, targetArch, releaseTrack) {
  const realInstallRoot = fs.realpathSync(installRoot);
  const expectedIdentity = expectedReleaseIdentity(releaseTrack, targetPlatform, targetArch);
  const candidates = [];
  if (targetPlatform === 'darwin') {
    walkDirectories(realInstallRoot, (directory, name) => {
      if (name !== expectedIdentity.bundleName) return name.endsWith('.app') ? false : true;
      const macosDir = path.join(directory, 'Contents', 'MacOS');
      const resourceDir = path.join(directory, 'Contents', 'Resources');
      if (!fs.existsSync(macosDir) || !fs.existsSync(path.join(resourceDir, 'app.asar'))) return false;
      const executables = fs
        .readdirSync(macosDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name === expectedIdentity.executableName)
        .map((entry) => path.join(macosDir, entry.name))
        .filter((executablePath) => {
          const identity = inspectExecutable(executablePath);
          return identity?.platform === targetPlatform && identity?.arch === targetArch;
        });
      for (const executablePath of executables) {
        candidates.push({ appDir: directory, resourceDir, executablePath, platform: targetPlatform, arch: targetArch });
      }
      return false;
    });
  } else {
    const executableName = expectedIdentity.executableName.toLowerCase();
    const queue = [realInstallRoot];
    while (queue.length) {
      const directory = queue.shift();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) {
          assertConfinedPath(realInstallRoot, absolute);
          continue;
        }
        if (entry.isDirectory()) {
          queue.push(absolute);
          continue;
        }
        if (!entry.isFile() || entry.name.toLowerCase() !== executableName) continue;
        const resourceDir = path.join(directory, 'resources');
        if (!fs.existsSync(path.join(resourceDir, 'app.asar'))) continue;
        const identity = inspectExecutable(absolute);
        if (identity?.platform === targetPlatform && identity?.arch === targetArch) {
          candidates.push({ appDir: directory, resourceDir, executablePath: absolute, ...identity });
        }
      }
    }
  }
  if (candidates.length !== 1) {
    throw new Error(
      `${TAG} expected exactly one installed ${targetPlatform}-${targetArch} application, found ${candidates.length}`
    );
  }
  assertConfinedPath(realInstallRoot, candidates[0].appDir);
  assertConfinedPath(realInstallRoot, candidates[0].resourceDir);
  assertConfinedPath(realInstallRoot, candidates[0].executablePath);
  assertSelectedPayloadSymlinksAreConfined(candidates[0].appDir);
  candidates[0].releaseIdentity = expectedIdentity;
  return candidates[0];
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

export function installArtifactSnapshot(snapshotPath, targetPlatform, targetArch, installRoot, dependencies = {}) {
  const execute = dependencies.execFileSync || execFileSync;
  const resolveCandidate = dependencies.resolveInstalledCandidate || resolveInstalledCandidate;
  const releaseTrack = dependencies.releaseTrack;
  fs.mkdirSync(installRoot, { recursive: true, mode: 0o700 });
  fs.chmodSync(installRoot, 0o700);

  if (targetPlatform === 'darwin') {
    const requestedMount = dependencies.createDmgMountRoot
      ? dependencies.createDmgMountRoot()
      : fs.mkdtempSync(path.join(path.dirname(installRoot), 'mounted-dmg-'));
    let detachTargets = [requestedMount];
    let attachAttempted = false;
    let primaryError;
    try {
      attachAttempted = true;
      const plist = String(
        execute(
          'hdiutil',
          ['attach', snapshotPath, '-nobrowse', '-readonly', '-noverify', '-mountpoint', requestedMount, '-plist'],
          { encoding: 'utf8' }
        )
      );
      // hdiutil reports the canonical mount path (/private/var/...) while the
      // requested mount is the symlinked form (/var/...). Deduplicating the raw
      // strings therefore keeps both, the single mounted volume is scanned twice,
      // and the one application bundle is counted as two.
      const canonicalise = (candidate) => {
        try {
          return fs.realpathSync.native(candidate);
        } catch {
          return candidate;
        }
      };
      const seenMountPoints = new Set();
      const mountPoints = [];
      for (const candidate of [
        requestedMount,
        ...[...plist.matchAll(/<key>mount-point<\/key>\s*<string>([^<]+)<\/string>/g)].map((match) =>
          decodeXml(match[1])
        ),
      ]) {
        if (!fs.existsSync(candidate)) continue;
        const key = canonicalise(candidate);
        if (seenMountPoints.has(key)) continue;
        seenMountPoints.add(key);
        // Keep the path as reported rather than its canonical form: only the
        // duplicate detection needs canonicalising.
        mountPoints.push(candidate);
      }
      // Detach the whole-disk devices only. A plist lists both /dev/diskN and its
      // /dev/diskNsM partitions; detaching the disk invalidates its partitions, so
      // detaching every entry reports spurious "No such file or directory" failures
      // for work that already succeeded.
      const deviceEntries = [
        ...new Set(
          [...plist.matchAll(/<key>dev-entry<\/key>\s*<string>([^<]+)<\/string>/g)]
            .map((match) => decodeXml(match[1]))
            .map((entry) => /^(\/dev\/disk\d+)s\d+$/.exec(entry)?.[1] ?? entry)
        ),
      ];
      // A device node is the idempotent hdiutil detach authority. Falling
      // back to the requested mount remains necessary when attach errors
      // before returning a plist.
      if (deviceEntries.length) detachTargets = deviceEntries;
      const mountedApps = mountPoints.flatMap((mountPoint) => {
        return fs
          .readdirSync(mountPoint, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'))
          .map((entry) => ({ mountPoint, name: entry.name }));
      });
      if (mountedApps.length !== 1) {
        throw new Error(
          `${TAG} DMG must expose exactly one application bundle; found ${mountedApps.length} ` +
            `(${mountedApps.map((app) => `${app.mountPoint}/${app.name}`).join(', ') || 'none'}) ` +
            `across mount points ${mountPoints.join(', ') || 'none'}`
        );
      }
      const [{ mountPoint, name }] = mountedApps;
      execute('ditto', [path.join(mountPoint, name), path.join(installRoot, name)], { stdio: 'pipe' });
    } catch (error) {
      primaryError = error;
    } finally {
      const cleanupErrors = [];
      if (attachAttempted) {
        for (const mounted of detachTargets) {
          try {
            execute('hdiutil', ['detach', mounted, '-force'], { stdio: 'pipe' });
          } catch (error) {
            // Detaching one device of an attachment tears down its siblings, so a
            // device that is already gone reports a failure for work that has in
            // fact succeeded. The desired end state is reached either way.
            const message = error instanceof Error ? error.message : String(error);
            if (/no such file or directory|not attached|no mountable file systems/i.test(message)) continue;
            cleanupErrors.push(`${mounted}: ${message}`);
          }
        }
      }
      try {
        fs.rmSync(requestedMount, { recursive: true, force: true });
      } catch (error) {
        cleanupErrors.push(`${requestedMount}: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (primaryError) {
        if (cleanupErrors.length) {
          throw new Error(
            `${primaryError instanceof Error ? primaryError.message : String(primaryError)}; DMG cleanup failures: ${cleanupErrors.join('; ')}`,
            { cause: primaryError }
          );
        }
        throw primaryError;
      }
      if (cleanupErrors.length) {
        throw new Error(`${TAG} DMG cleanup failures: ${cleanupErrors.join('; ')}`);
      }
    }
  } else if (targetPlatform === 'linux') {
    execute('dpkg-deb', ['-x', snapshotPath, installRoot], { stdio: 'pipe' });
  } else if (targetPlatform === 'win32') {
    execute(snapshotPath, ['/S', `/D=${installRoot}`], { stdio: 'pipe', timeout: 120_000, windowsHide: true });
  } else {
    throw new Error(`${TAG} unsupported installer platform: ${targetPlatform}`);
  }
  return resolveCandidate(installRoot, targetPlatform, targetArch, releaseTrack);
}

export function snapshotInstallerArtifact(artifactPath, temporaryRoot) {
  const sourceDigest = artifactContentDigest(artifactPath);
  const sourceBytesSha256 = sha256File(artifactPath);
  fs.mkdirSync(temporaryRoot, { recursive: true, mode: 0o700 });
  fs.chmodSync(temporaryRoot, 0o700);
  const snapshotPath = path.join(temporaryRoot, `installer${path.extname(artifactPath).toLowerCase()}`);
  fs.copyFileSync(artifactPath, snapshotPath, fs.constants.COPYFILE_EXCL);
  if (process.platform !== 'win32') fs.chmodSync(snapshotPath, 0o500);
  const snapshotBytesSha256 = sha256File(snapshotPath);
  if (snapshotBytesSha256 !== sourceBytesSha256) throw new Error(`${TAG} private installer snapshot digest mismatch`);
  return { snapshotPath, sourceDigest, sourceBytesSha256, snapshotBytesSha256 };
}

export async function findFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

export async function assertPortVacant(port, request = requestJson) {
  try {
    await request(`http://127.0.0.1:${port}/json/version`, 250);
  } catch {
    return;
  }
  throw new Error(`${TAG} selected CDP endpoint was already occupied before launch`);
}

export function rendererExpectation(candidate, smokeMarker, releaseIdentity) {
  const rendererPath = path.join(candidate.resourceDir, 'app.asar', 'out', 'renderer', 'index.html');
  return { rendererPath: path.resolve(rendererPath), smokeMarker, releaseIdentity };
}

export function redactSmokeMarkerFromUrl(rawUrl, smokeMarker) {
  const redactNested = (value, depth = 0) => {
    if (depth > 6) return value;
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      return value;
    }
    parsed.searchParams.delete('waylandSmokeMarker');
    for (const [name, nestedValue] of [...parsed.searchParams.entries()]) {
      const redactedValue = redactNested(nestedValue, depth + 1);
      if (redactedValue !== nestedValue) parsed.searchParams.set(name, redactedValue);
    }
    if (parsed.hash.length > 1) {
      const fragment = parsed.hash.slice(1);
      const redactedFragment = redactNested(fragment, depth + 1);
      if (redactedFragment !== fragment) parsed.hash = redactedFragment;
    }
    return parsed.href;
  };
  // Recursive URL parsing removes marker parameters at every URL layer. The
  // final literal replacement is an authority backstop for encoded, malformed,
  // or fragment-contained values that are not themselves parseable URLs.
  return redactNested(String(rawUrl)).split(String(smokeMarker)).join('<redacted>');
}

function normalizedFileUrlPath(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'file:') return null;
    return path.resolve(fileURLToPath(parsed));
  } catch {
    return null;
  }
}

export function isReadyRendererState(state, expected) {
  const url = String(state?.url || '');
  const rendererPath = normalizedFileUrlPath(url);
  const expectedPath = expected?.rendererPath ? path.resolve(expected.rendererPath) : null;
  return (
    Boolean(expectedPath && expected?.smokeMarker) &&
    state?.readyState === 'complete' &&
    state?.title === 'Wayland' &&
    Number.isInteger(state?.bodyChildren) &&
    state.bodyChildren > 0 &&
    Number.isInteger(state?.rootChildren) &&
    state.rootChildren > 0 &&
    rendererPath === expectedPath &&
    state?.smokeMarker === expected.smokeMarker &&
    state?.shellExperience === expected?.releaseIdentity?.shellExperience &&
    state?.recoveryFallback === false &&
    state?.fatalErrorBoundary === false
  );
}

function terminatedChildState(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return child.exitCode ?? child.signalCode ?? 'unknown';
  }
  return null;
}

export async function waitForRendererReady(port, timeoutMs, child, expected) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'CDP endpoint unavailable';
  while (Date.now() < deadline) {
    const terminated = terminatedChildState(child);
    if (terminated !== null) throw new Error(`${TAG} packaged app exited before readiness (${terminated})`);
    try {
      const targets = await requestJson(`http://127.0.0.1:${port}/json/list`);
      const page = targets.find(
        (target) =>
          target.type === 'page' &&
          target.webSocketDebuggerUrl &&
          String(target.url || '') &&
          !String(target.url).startsWith('about:blank') &&
          !String(target.url).startsWith('chrome-error://') &&
          !String(target.url).startsWith('devtools://')
      );
      if (page) {
        const evaluation = await cdpCommand(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
          expression:
            'JSON.stringify({readyState: document.readyState, title: document.title, url: location.href, bodyChildren: document.body?.childElementCount ?? 0, rootChildren: document.querySelector("#root")?.childElementCount ?? 0, smokeMarker: new URL(location.href).searchParams.get("waylandSmokeMarker"), shellExperience: document.querySelector(".app-shell")?.getAttribute("data-shell-experience") ?? null, recoveryFallback: Boolean(document.querySelector("[data-testid=\\"shell-recovery-fallback\\"]")), fatalErrorBoundary: Array.from(document.querySelectorAll("h2")).some((node) => node.textContent === "Something went wrong")})',
          returnByValue: true,
        });
        const result = JSON.parse(evaluation?.result?.value || '{}');
        if (isReadyRendererState(result, expected)) return result;
        lastError = `renderer was not usable (${result.readyState || '<missing>'}, ${result.url || '<missing>'})`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${TAG} Electron renderer did not become ready: ${lastError}`);
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${TAG} packaged app did not shut down cleanly`)), timeoutMs);
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

function parseWindowsProcesses(raw) {
  if (!String(raw).trim()) return [];
  const parsed = JSON.parse(String(raw));
  return (Array.isArray(parsed) ? parsed : [parsed]).map((entry) => ({
    pid: Number(entry.ProcessId),
    parentPid: Number(entry.ParentProcessId),
    identity: `${entry.CreationDate || '<unknown>'}\0${entry.ExecutablePath || entry.Name || '<unknown>'}`,
    scopeText: `${entry.ExecutablePath || entry.Name || ''}\0${entry.CommandLine || ''}`,
  }));
}

function parsePosixProcesses(raw) {
  const records = [];
  for (const line of String(raw).split(/\r?\n/)) {
    const match = line.match(
      /^\s*(\d+)\s+(\d+)\s+([A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.*)$/
    );
    if (!match) continue;
    const command = match[4];
    records.push({
      pid: Number(match[1]),
      parentPid: Number(match[2]),
      // Keep identity independent of the environment-bearing snapshot so the
      // same live process compares equal in both lightweight and final sweeps.
      identity: `${match[3]}\0${command.trim().split(/\s+/, 1)[0] || '<unknown>'}`,
      scopeText: command,
    });
  }
  return records;
}

function processSnapshot(targetPlatform, dependencies = {}, includeEnvironment = false) {
  const execute = dependencies.execFileSync || execFileSync;
  if (targetPlatform === 'win32') {
    return parseWindowsProcesses(
      execute(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,ExecutablePath,Name,CommandLine | ConvertTo-Json -Compress',
        ],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
      )
    );
  }
  // Poll using the small process table. The final sweep asks for the environment
  // too, so an inherited launch token can recover a child that immediately
  // reparented.
  //
  // The environment form is not portable. BSD ps (macOS) takes `eww -axo`, while
  // procps (Linux) rejects that exact combination with "must set personality to
  // get -x option" and wants the all-BSD `axeww o` instead. Verified on both:
  // `-axo` alone carries no environment on procps, so the split is required
  // rather than cosmetic.
  const format = 'pid=,ppid=,lstart=,command=';
  const options = { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 };
  if (!includeEnvironment) {
    return parsePosixProcesses(execute('ps', ['-axo', format], options));
  }
  try {
    return parsePosixProcesses(execute('ps', ['eww', '-axo', format], options));
  } catch (error) {
    // procps (Linux) rejects that BSD/UNIX mix with "must set personality to get
    // -x option" and wants the all-BSD spelling instead, while BSD ps (macOS)
    // returns nothing for the all-BSD form. Retry only on that specific rejection
    // so a real ps failure still propagates. Note `-axo` alone is not a substitute:
    // it succeeds on procps but carries no environment, which would silently defeat
    // the launch-token recovery this sweep exists for.
    const message = error instanceof Error ? error.message : String(error);
    if (!/must set personality|unsupported option|illegal option|invalid option/i.test(message)) throw error;
    return parsePosixProcesses(execute('ps', ['axeww', 'o', format], options));
  }
}

function descendantsFromSnapshot(rootPid, snapshot) {
  if (!Number.isInteger(rootPid) || rootPid <= 0) return [];
  const childrenByParent = new Map();
  for (const record of snapshot) {
    if (!Number.isInteger(record.pid) || !Number.isInteger(record.parentPid)) continue;
    const children = childrenByParent.get(record.parentPid) || [];
    children.push(record);
    childrenByParent.set(record.parentPid, children);
  }
  const descendants = [];
  const queue = [...(childrenByParent.get(rootPid) || [])];
  while (queue.length) {
    const record = queue.shift();
    descendants.push(record);
    queue.push(...(childrenByParent.get(record.pid) || []));
  }
  return descendants;
}

export function listDescendantProcessRecords(rootPid, targetPlatform, dependencies = {}) {
  return descendantsFromSnapshot(rootPid, processSnapshot(targetPlatform, dependencies));
}

export function listDescendantPids(rootPid, targetPlatform, dependencies = {}) {
  return listDescendantProcessRecords(rootPid, targetPlatform, dependencies).map((record) => record.pid);
}

function currentProcessIdentity(pid, targetPlatform, dependencies = {}) {
  const record = processSnapshot(targetPlatform, dependencies).find((candidate) => candidate.pid === pid);
  return record?.identity || null;
}

function isSameProcessAlive(record, targetPlatform, dependencies = {}) {
  try {
    return currentProcessIdentity(record.pid, targetPlatform, dependencies) === record.identity;
  } catch {
    return false;
  }
}

export function createProcessMonitor(rootPid, targetPlatform, dependencies = {}) {
  const records = new Map();
  const collect = (includeEnvironment = false) => {
    const scopeTokens = (dependencies.processScopeTokens || []).map((value) => String(value)).filter(Boolean);
    const snapshot = processSnapshot(targetPlatform, dependencies, includeEnvironment);
    const descendants = descendantsFromSnapshot(rootPid, snapshot);
    const scoped = scopeTokens.length
      ? snapshot.filter(
          (record) => record.pid !== process.pid && scopeTokens.some((token) => record.scopeText.includes(token))
        )
      : [];
    for (const record of [...descendants, ...scoped]) {
      if (record.pid === rootPid) continue;
      records.set(`${record.pid}\0${record.identity}`, record);
    }
  };
  collect();
  // Scope matching catches a packaged child after it reparents or changes its
  // process group; the short poll bounds the remaining fork/exec observation
  // window without claiming OS-level containment.
  const timer = setInterval(collect, dependencies.processMonitorIntervalMs ?? 25);
  timer.unref?.();
  return {
    stop() {
      clearInterval(timer);
      collect(true);
      return [...records.values()];
    },
  };
}

export async function terminateProcessTree(child, targetPlatform, dependencies = {}, observedRecords = []) {
  const recordsByIdentity = new Map();
  for (const record of [...observedRecords, ...listDescendantProcessRecords(child.pid, targetPlatform, dependencies)]) {
    recordsByIdentity.set(`${record.pid}\0${record.identity}`, record);
  }
  const records = [...recordsByIdentity.values()];
  const execute = dependencies.execFileSync || execFileSync;
  if (targetPlatform === 'win32') {
    try {
      execute('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'pipe', windowsHide: true });
    } catch {
      child.kill('SIGKILL');
    }
    for (const record of records) {
      if (!isSameProcessAlive(record, targetPlatform, dependencies)) continue;
      try {
        execute('taskkill', ['/PID', String(record.pid), '/T', '/F'], { stdio: 'pipe', windowsHide: true });
      } catch {
        // The stable-identity verification below is authoritative.
      }
    }
  } else {
    try {
      (dependencies.processKill || process.kill)(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
    // A descendant may have called setsid(2) or reparented, escaping the root
    // process group. Reap every observed stable-identity process explicitly.
    for (const record of records) {
      if (!isSameProcessAlive(record, targetPlatform, dependencies)) continue;
      try {
        (dependencies.processKill || process.kill)(record.pid, 'SIGKILL');
      } catch {
        // Stable-identity verification after the settle window is authoritative.
      }
    }
  }
  await new Promise((resolve) => setTimeout(resolve, dependencies.treeKillSettleMs ?? 100));
  const survivors = records.filter((record) => isSameProcessAlive(record, targetPlatform, dependencies));
  if (survivors.length) {
    throw new Error(
      `${TAG} could not terminate packaged process tree: ${survivors.map((record) => record.pid).join(',')}`
    );
  }
  return records;
}

export function readPackageSmokeEventLedger(eventFile) {
  const text = fs.readFileSync(eventFile, 'utf8');
  if (!text.endsWith('\n')) throw new Error(`${TAG} package smoke event ledger ended with a partial record`);
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function verifyPackageSmokeEventLedger(events, expectedMarkerSha256, releaseIdentity) {
  if (!Array.isArray(events) || events.length === 0) throw new Error(`${TAG} package smoke event ledger is empty`);
  const allowed = new Set([...REQUIRED_SMOKE_EVENTS, ...FAILURE_SMOKE_EVENTS]);
  for (const [index, event] of events.entries()) {
    if (
      event?.contract !== SMOKE_EVENT_CONTRACT ||
      event?.seq !== index + 1 ||
      event?.markerSha256 !== expectedMarkerSha256 ||
      !allowed.has(event?.type)
    ) {
      throw new Error(`${TAG} malformed, discontinuous, or unknown package smoke event at sequence ${index + 1}`);
    }
    if (FAILURE_SMOKE_EVENTS.has(event.type)) {
      throw new Error(`${TAG} package startup or cleanup reported fatal event: ${event.type}`);
    }
  }
  let priorIndex = -1;
  for (const required of REQUIRED_SMOKE_EVENTS) {
    const matching = events.filter((event) => event.type === required);
    if (matching.length !== 1) throw new Error(`${TAG} package smoke event must occur exactly once: ${required}`);
    const index = events.indexOf(matching[0]);
    if (index <= priorIndex) throw new Error(`${TAG} package smoke event order is invalid at: ${required}`);
    priorIndex = index;
  }
  const boot = events.find((event) => event.type === 'boot-start');
  if (JSON.stringify(boot?.releaseIdentity) !== JSON.stringify(releaseIdentity)) {
    throw new Error(`${TAG} packaged runtime release identity mismatch`);
  }
  const quit = events.find((event) => event.type === 'quit');
  if (quit?.exitCode !== 0) throw new Error(`${TAG} package smoke quit event was not clean`);
  return { contract: SMOKE_EVENT_CONTRACT, eventCount: events.length, terminalSequence: events.length };
}

export function verifyShutdownEvidence({
  events,
  expectedMarkerSha256,
  releaseIdentity,
  shutdown,
  descendantRecords,
  targetPlatform,
  processRecordAlive = isSameProcessAlive,
  dependencies = {},
}) {
  if (shutdown.signal || shutdown.code !== 0) {
    throw new Error(`${TAG} packaged app shutdown was not clean (${shutdown.code ?? shutdown.signal})`);
  }
  const eventEvidence = verifyPackageSmokeEventLedger(events, expectedMarkerSha256, releaseIdentity);
  const survivingDescendants = descendantRecords.filter((record) =>
    processRecordAlive(record, targetPlatform, dependencies)
  );
  if (survivingDescendants.length) {
    throw new Error(
      `${TAG} packaged app left descendant processes alive: ${survivingDescendants.map((record) => record.pid).join(',')}`
    );
  }
  return {
    parentExit: 'zero',
    subsystemCleanup: 'completed-with-structured-proof',
    eventEvidence,
    descendantsObserved: descendantRecords.length,
    descendantsRemaining: 0,
  };
}

export function launchCommand(executablePath, targetPlatform, env = process.env) {
  if (targetPlatform === 'linux' && !env.DISPLAY) {
    // This is deliberately scoped to the disposable installed-package smoke.
    // Production startup never receives this flag. A non-root `dpkg-deb -x`
    // cannot reproduce chrome-sandbox's root ownership, so testing the package
    // with an explicit smoke-only sandbox waiver is more honest than pretending
    // extraction is a privileged system installation.
    return { command: 'xvfb-run', args: ['-a', executablePath, '--no-sandbox'], sandboxMode: 'smoke-only-disabled' };
  }
  if (targetPlatform === 'linux') {
    return { command: executablePath, args: ['--no-sandbox'], sandboxMode: 'smoke-only-disabled' };
  }
  return { command: executablePath, args: [], sandboxMode: 'production-default' };
}

export function prepareInstalledCandidate(options, dependencies = {}) {
  const artifacts = (dependencies.findInstallerArtifacts || findInstallerArtifacts)(
    options.outDir,
    options.targetPlatform
  );
  if (artifacts.length !== 1) {
    throw new Error(
      `${TAG} expected exactly one ${INSTALLER_EXTENSIONS[options.targetPlatform]} installer artifact, found ${artifacts.length}`
    );
  }
  const artifactPath = artifacts[0];
  const installerFreshness = (dependencies.assertFreshInstaller || assertFreshInstaller)(
    artifactPath,
    options.candidateStateFile,
    options.candidateStateDigest,
    options.targetPlatform,
    options.targetArch,
    options.releaseTrack,
    dependencies
  );
  const privateRoot = (
    dependencies.createPrivateRoot || (() => fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-installed-smoke-')))
  )();
  fs.chmodSync(privateRoot, 0o700);
  try {
    const snapshot = (dependencies.snapshotInstallerArtifact || snapshotInstallerArtifact)(
      artifactPath,
      path.join(privateRoot, 'snapshot')
    );
    if (snapshot.sourceDigest !== installerFreshness.artifactDigest) {
      throw new Error(`${TAG} installer changed between freshness proof and private snapshot`);
    }
    const installRoot = path.join(privateRoot, 'installed');
    const candidate = (dependencies.installArtifactSnapshot || installArtifactSnapshot)(
      snapshot.snapshotPath,
      options.targetPlatform,
      options.targetArch,
      installRoot,
      { ...dependencies, releaseTrack: options.releaseTrack }
    );
    const candidateFreshness = (dependencies.assertFreshCandidate || assertFreshCandidate)(
      candidate,
      options.candidateStateFile,
      options.candidateStateDigest,
      options.targetPlatform,
      options.targetArch,
      options.releaseTrack,
      dependencies
    );
    const installedDigest = candidateFreshness.candidateDigest;
    return {
      artifactPath,
      candidate,
      installRoot,
      installerFreshness,
      candidateFreshness,
      installedDigest,
      privateRoot,
      snapshot,
    };
  } catch (error) {
    fs.rmSync(privateRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function runSmoke(options, dependencies = {}) {
  const hostPlatform = dependencies.hostPlatform || process.platform;
  const hostArch = dependencies.hostArch || process.arch;
  if (hostPlatform !== options.targetPlatform || hostArch !== options.targetArch) {
    throw new Error(
      `${TAG} target ${options.targetPlatform}-${options.targetArch} cannot be boot-tested on host ${hostPlatform}-${hostArch}`
    );
  }

  const inspectTarget = dependencies.inspectExecutable || inspectExecutable;
  const verifyResources = dependencies.verifyPackagedResources || verifyPackagedResources;
  const request = dependencies.requestJson || requestJson;
  const command = dependencies.cdpCommand || cdpCommand;
  const waitForExitImpl = dependencies.waitForExit || waitForExit;
  const digestCandidate = dependencies.candidateContentDigest || candidateContentDigest;
  const removeUserData =
    dependencies.removeUserData || ((directory) => fs.rmSync(directory, { recursive: true, force: true }));
  const removeInstalledPayload =
    dependencies.removeInstalledPayload || ((directory) => fs.rmSync(directory, { recursive: true, force: true }));

  const installed = (dependencies.prepareInstalledCandidate || prepareInstalledCandidate)(options, dependencies);
  let installedSmokePassed = false;
  try {
    const candidate = installed.candidate;
    const identity = inspectTarget(candidate.executablePath);
    if (identity?.platform !== options.targetPlatform || identity?.arch !== options.targetArch) {
      throw new Error(`${TAG} executable identity mismatch; placeholders and wrong-target outputs are forbidden`);
    }
    const initialInstalledDigest = digestCandidate(candidate);
    if (initialInstalledDigest !== installed.installedDigest) {
      throw new Error(`${TAG} installed candidate changed before verification`);
    }

    const verifierLines = [];
    const logger = {
      log: (...items) => verifierLines.push(items.join(' ')),
      warn: (...items) => verifierLines.push(items.join(' ')),
      error: (...items) => verifierLines.push(items.join(' ')),
    };
    const verification = verifyResources({
      argv: [
        'node',
        'verify-packaged-resources.js',
        '--out',
        installed.installRoot,
        '--target-platform',
        options.targetPlatform,
        '--target-arch',
        options.targetArch,
        '--resources-dir',
        candidate.resourceDir,
        '--app-executable',
        candidate.executablePath,
        '--wcore-runtime',
        `${options.targetPlatform}-${options.targetArch}`,
        '--officecli-runtime',
        `${options.targetPlatform}-${options.targetArch}`,
        // Nano is bundled as of 0.12.0 and the verifier refuses to infer its target
        // identity, so the installed-payload smoke has to declare it like the others.
        // Targets wayland-nano does not publish (win32-arm64) carry no bundle to check.
        ...(isSupportedWNanoTarget(options.targetPlatform, options.targetArch)
          ? ['--wnano-runtime', `${options.targetPlatform}-${options.targetArch}`]
          : []),
      ],
      logger,
    });
    if (
      !Array.isArray(verification?.resourceDirs) ||
      !verification.resourceDirs.some((directory) => path.resolve(directory) === path.resolve(candidate.resourceDir))
    ) {
      throw new Error(`${TAG} critical resource verifier returned no proof for the selected packaged target`);
    }
    const optionalCapabilities = parseOptionalCapabilityStates(verifierLines);

    const preLaunchDigest = digestCandidate(candidate);
    if (preLaunchDigest !== initialInstalledDigest) {
      throw new Error(`${TAG} installed candidate changed after verification and before launch`);
    }

    const port = await (dependencies.findFreePort || findFreePort)();
    await (dependencies.assertPortVacant || assertPortVacant)(port, request);
    const releaseIdentity = expectedReleaseIdentity(options.releaseTrack, options.targetPlatform, options.targetArch);
    if (
      path.basename(candidate.executablePath).toLowerCase() !== releaseIdentity.executableName.toLowerCase() ||
      (candidate.releaseIdentity && JSON.stringify(candidate.releaseIdentity) !== JSON.stringify(releaseIdentity))
    ) {
      throw new Error(`${TAG} installed candidate does not match the requested release identity`);
    }
    const output = [];
    let outputBytes = 0;
    let userDataDir;
    let child;
    let processMonitor;
    let smokePassed = false;
    try {
      userDataDir = (
        dependencies.createUserData || (() => fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-package-smoke-')))
      )();
      const eventFile = path.join(userDataDir, SMOKE_EVENT_FILE);
      fs.writeFileSync(eventFile, '', { flag: 'wx', mode: 0o600 });
      const smokeMarker = crypto
        .createHash('sha256')
        .update(
          `${installed.installerFreshness.artifactDigest}\0${initialInstalledDigest}\0${crypto.randomBytes(32).toString('hex')}`
        )
        .digest('hex');
      const processTreeId = crypto.randomBytes(32).toString('hex');
      const markerSha256 = sha256Bytes(Buffer.from(smokeMarker));
      const expectedRenderer = rendererExpectation(candidate, smokeMarker, releaseIdentity);
      const launch = launchCommand(candidate.executablePath, options.targetPlatform, dependencies.env || process.env);
      child = (dependencies.spawn || spawn)(launch.command, launch.args, {
        detached: options.targetPlatform !== 'win32',
        env: {
          ...process.env,
          WAYLAND_CDP_PORT: String(port),
          WAYLAND_PACKAGE_SMOKE_MARKER: smokeMarker,
          WAYLAND_PROCESS_TREE_ID: processTreeId,
          WAYLAND_PACKAGE_SMOKE_EVENT_FILE: eventFile,
          WAYLAND_DISABLE_AUTO_UPDATE: '1',
          WAYLAND_DISABLE_DEVTOOLS: '1',
          WAYLAND_E2E_TEST: '1',
          WAYLAND_E2E_USER_DATA_DIR: userDataDir,
          WAYLAND_MULTI_INSTANCE: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      const spawnFailure = new Promise((_, reject) => {
        child.once('error', (error) => reject(new Error(`${TAG} failed to launch packaged app: ${error.message}`)));
      });
      for (const stream of [child.stdout, child.stderr]) {
        stream?.on('data', (chunk) => {
          const text = String(chunk);
          output.push(text);
          outputBytes += Buffer.byteLength(text);
          while (outputBytes > 64_000 && output.length > 1) {
            outputBytes -= Buffer.byteLength(output.shift());
          }
        });
      }
      processMonitor = (dependencies.createProcessMonitor || createProcessMonitor)(child.pid, options.targetPlatform, {
        ...dependencies,
        processScopeTokens: [candidate.appDir, installed.installRoot, userDataDir, smokeMarker, processTreeId],
      });
      const renderer = await Promise.race([
        (dependencies.waitForRendererReady || waitForRendererReady)(port, options.timeoutMs, child, expectedRenderer),
        spawnFailure,
      ]);
      if (!isReadyRendererState(renderer, expectedRenderer)) {
        throw new Error(`${TAG} renderer readiness evidence failed validation`);
      }
      const browser = await request(`http://127.0.0.1:${port}/json/version`);
      if (!browser.webSocketDebuggerUrl) throw new Error(`${TAG} browser CDP endpoint omitted its websocket URL`);
      // Browser.close is how the shutdown is requested; it is not the evidence that
      // the shutdown happened. Packaged Wayland does not always answer the CDP call
      // before it tears the session down, and macOS and Linux release builds both sat
      // here until the call timed out even though the request had been delivered.
      //
      // A missing acknowledgement is therefore tolerated and reported. The assertions
      // that matter are untouched and immediately below: the child must exit inside
      // its own window, the shutdown evidence must validate, and the candidate must be
      // byte-identical afterwards. An app that ignores the request still fails, now at
      // the step that can say so.
      try {
        await command(browser.webSocketDebuggerUrl, 'Browser.close', {}, 20_000);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/timed out: Browser\.close/.test(message)) throw error;
        // Deliberately not the verifier's logger: those lines are parsed for optional
        // capability states and must carry nothing else.
        console.log(`${TAG} Browser.close was not acknowledged; falling through to the exit and shutdown checks`);
      }
      const shutdown = await waitForExitImpl(child, 10_000);
      await new Promise((resolve) => setTimeout(resolve, dependencies.shutdownSettleMs ?? 250));
      const descendantRecords = processMonitor.stop();
      processMonitor = null;
      const events = (dependencies.readPackageSmokeEventLedger || readPackageSmokeEventLedger)(eventFile);
      const shutdownEvidence = (dependencies.verifyShutdownEvidence || verifyShutdownEvidence)({
        events,
        expectedMarkerSha256: markerSha256,
        releaseIdentity,
        shutdown,
        descendantRecords,
        targetPlatform: options.targetPlatform,
        processRecordAlive: dependencies.processRecordAlive,
        dependencies,
      });
      const postShutdownDigest = digestCandidate(candidate);
      if (postShutdownDigest !== preLaunchDigest) {
        throw new Error(`${TAG} packaged candidate changed while the smoke test was running`);
      }

      const report = {
        contract: 'wayland-platform-package-smoke/2',
        target: `${options.targetPlatform}-${options.targetArch}`,
        installer: path.relative(options.outDir, installed.artifactPath),
        installerDigest: installed.installerFreshness.artifactDigest,
        installerSnapshotBytesSha256: installed.snapshot.snapshotBytesSha256,
        installedExecutable: path.relative(installed.installRoot, candidate.executablePath),
        installedResources: path.relative(installed.installRoot, candidate.resourceDir),
        executableIdentity: identity,
        executableSha256: sha256File(candidate.executablePath),
        appAsarSha256: sha256File(path.join(candidate.resourceDir, 'app.asar')),
        freshness: installed.installerFreshness,
        candidateFreshness: installed.candidateFreshness,
        sourceIdentity:
          installed.candidateFreshness?.sourceIdentity ||
          installed.installerFreshness?.sourceIdentity ||
          currentSourceIdentity(),
        releaseIdentity,
        sandboxMode: launch.sandboxMode,
        productionSandboxProof:
          launch.sandboxMode === 'production-default' ? 'exercised' : 'not-proven-by-unprivileged-package-extraction',
        verifiedCandidateDigest: postShutdownDigest,
        criticalResources: 'verified',
        optionalCapabilities,
        electron: {
          booted: true,
          rendererReady: true,
          expectedRendererPath: path.relative(installed.installRoot, expectedRenderer.rendererPath),
          markerSha256,
          ...renderer,
          url: redactSmokeMarkerFromUrl(renderer.url, smokeMarker),
          smokeMarker: '<redacted>',
        },
        shutdown: shutdownEvidence,
        processTreeIdentitySha256: sha256Bytes(Buffer.from(processTreeId)),
      };
      fs.writeFileSync(
        path.join(options.outDir, `platform-package-smoke-${options.targetPlatform}-${options.targetArch}.json`),
        `${JSON.stringify(report, null, 2)}\n`
      );
      smokePassed = true;
      installedSmokePassed = true;
      return report;
    } catch (error) {
      const observedRecords = processMonitor?.stop() || [];
      processMonitor = null;
      let cleanupError;
      if (child) {
        try {
          await (dependencies.terminateProcessTree || terminateProcessTree)(
            child,
            options.targetPlatform,
            dependencies,
            observedRecords
          );
          await waitForExitImpl(child, 5_000).catch(() => undefined);
        } catch (treeError) {
          cleanupError = treeError;
        }
      }
      const logs = output.join('').slice(-8_000);
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}` +
          `${cleanupError ? `; process-tree cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}` : ''}` +
          `${logs ? `\n${TAG} tail:\n${logs}` : ''}`
      );
    } finally {
      if (processMonitor) processMonitor.stop();
      if (userDataDir) {
        try {
          removeUserData(userDataDir);
        } catch {
          // Cleanup failure must not replace the actual smoke failure. A passing
          // smoke has no such primary failure and therefore fails on leaked state.
          if (smokePassed) throw new Error(`${TAG} could not remove isolated user-data directory`);
        }
      }
    }
  } finally {
    // Covers verifier/identity failures that occur before the child-process
    // lifecycle begins. The inner finally above turns cleanup failure after a
    // green smoke into a hard failure; this outer guard preserves a primary
    // verification error while still making a best effort to remove the payload.
    try {
      removeInstalledPayload(installed.privateRoot);
    } catch {
      if (installedSmokePassed) throw new Error(`${TAG} could not remove private installed-payload directory`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.mode === 'capture') {
    const captured = captureCandidateState(
      options.outDir,
      options.targetPlatform,
      options.targetArch,
      options.candidateStateFile,
      { githubOutput: options.githubOutput, releaseTrack: options.releaseTrack }
    );
    console.log(
      `${TAG} captured ${captured.state.target} pre-build state ` +
        `(${captured.state.candidates.length} candidate(s), ${captured.state.artifacts.length} installer(s), ${captured.digest})`
    );
    return;
  }
  const report = await runSmoke(options);
  console.log(
    `${TAG} PASS ${report.target}: identity, resources, readiness, capabilities, and clean shutdown verified`
  );
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
