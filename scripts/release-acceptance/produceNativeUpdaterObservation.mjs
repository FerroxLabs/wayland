#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import {
  candidateContentDigest,
  createProcessMonitor,
  findFreePort,
  installArtifactSnapshot,
  launchCommand,
  resolveInstalledCandidate,
  snapshotInstallerArtifact,
  terminateProcessTree,
} from '../platform-package-smoke.mjs';

const require = createRequire(import.meta.url);
const { validatePlatformPackageReport } = require('./verifyPlatformPackageSmokes.js');

const TAG = '[native-updater-observer]';
const TARGETS = new Set(['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64']);
const COMMIT = /^[a-f0-9]{40,64}$/;
const NONCE = /^[a-f0-9]{64}$/;
const INITIAL_VERSION = '0.11.18';
const ROLLBACK_VERSION = '0.11.8';
// verifyUpdaterObservation.js caps expiresAt - completedAt at 24h and also demands
// now <= expiresAt at verification time. The trust root verifies this observation
// twice, after a six-target matrix has finished and a multi-gigabyte raw bundle has
// been assembled and re-uploaded, so the slowest target's receipt is hours old before
// it is first read. One hour cannot survive that; 20h stays inside the cap.
const OBSERVATION_WINDOW_MS = 20 * 60 * 60 * 1000;
const BROWSER_CLOSE_TIMEOUT_MS = 20000;
const TRANSIENT_STATE_NAMES = new Set([
  'Cache',
  'Code Cache',
  'GPUCache',
  'DawnCache',
  'blob_storage',
  'Crashpad',
  'SingletonCookie',
  'SingletonLock',
  'SingletonSocket',
]);

function fail(message) {
  throw new Error(`${TAG} ${message}`);
}

function sha256Bytes(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const descriptor = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let count;
    do {
      count = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (count) hash.update(buffer.subarray(0, count));
    } while (count);
  } finally {
    fs.closeSync(descriptor);
  }
  return `sha256:${hash.digest('hex')}`;
}

function regularFile(filePath, label) {
  const resolved = path.resolve(filePath);
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0) fail(`${label} must be a non-empty regular file`);
  return { path: resolved, size: stat.size, sha256: sha256File(resolved) };
}

function canonicalJson(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function writeExclusiveJson(filePath, value) {
  const bytes = canonicalJson(value);
  fs.writeFileSync(filePath, bytes, { flag: 'wx', mode: 0o600 });
  return { file: path.basename(filePath), sha256: sha256Bytes(bytes), size: bytes.length };
}

function copyEvidence(source, destination) {
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  if (sha256File(source) !== sha256File(destination)) fail('evidence changed while copied');
  const stat = fs.lstatSync(destination);
  return { file: path.basename(destination), sha256: sha256File(destination), size: stat.size };
}

function readCatalog(fileName) {
  const catalogPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/recovery', fileName);
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

function catalogArtifact(catalog, target, artifact, label) {
  const [platform, arch] = target.split('-');
  const entry = catalog.artifacts.find((item) => item.platform === platform && item.arch === arch);
  if (!entry) fail(`${label} catalog has no ${target} entry`);
  if (
    path.basename(artifact.path) !== entry.name ||
    artifact.size !== entry.size ||
    artifact.sha256 !== `sha256:${entry.sha256}`
  ) {
    fail(`${label} artifact does not match the compiled catalog`);
  }
  return entry;
}

function exactCandidate(candidate) {
  if (
    !candidate ||
    Object.keys(candidate).sort().join(',') !== 'commit,tree,version' ||
    !COMMIT.test(String(candidate.commit)) ||
    !COMMIT.test(String(candidate.tree)) ||
    typeof candidate.version !== 'string' ||
    !candidate.version ||
    candidate.version === ROLLBACK_VERSION
  ) {
    fail('candidate identity is malformed');
  }
  return candidate;
}

export function validateObservationRequest(input, dependencies = {}) {
  const allowed = [
    'target',
    'candidate',
    'nonce',
    'runId',
    'initialArtifactPath',
    'candidateArtifactPath',
    'rollbackArtifactPath',
    'packageSmokePath',
    'outDir',
  ];
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('request must be an object');
  if (JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(allowed.sort())) {
    fail('request has missing or unknown fields; phase/event/snapshot JSON is never accepted');
  }
  if (!TARGETS.has(input.target)) fail('unsupported target');
  const [platform, arch] = input.target.split('-');
  if ((dependencies.platform || process.platform) !== platform || (dependencies.arch || process.arch) !== arch) {
    fail(`runner cannot observe foreign target ${input.target}`);
  }
  if (!NONCE.test(String(input.nonce))) fail('nonce must be 32 random bytes encoded as lowercase hex');
  if (!Number.isSafeInteger(input.runId) || input.runId <= 0) fail('run id is invalid');
  exactCandidate(input.candidate);
  return {
    ...input,
    platform,
    arch,
    outDir: path.resolve(input.outDir),
    initialArtifact: regularFile(input.initialArtifactPath, 'initial artifact'),
    candidateArtifact: regularFile(input.candidateArtifactPath, 'candidate artifact'),
    rollbackArtifact: regularFile(input.rollbackArtifactPath, 'rollback artifact'),
    packageSmoke: regularFile(input.packageSmokePath, 'candidate package smoke'),
  };
}

function cdpJson(url, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}`));
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', reject);
  });
}

function cdpCommand(url, method, params = {}, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error(`${method} timed out`));
    }, timeoutMs);
    const done = (callback, value) => {
      clearTimeout(timer);
      socket.close();
      callback(value);
    };
    socket.once('error', (error) => done(reject, error));
    socket.once('open', () => socket.send(JSON.stringify({ id: 1, method, params })));
    socket.on('message', (raw) => {
      const message = JSON.parse(String(raw));
      if (message.id !== 1) return;
      if (message.error) done(reject, new Error(message.error.message));
      else done(resolve, message.result);
    });
  });
}

async function waitForGenericRenderer(port, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = 'CDP unavailable';
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) fail('native app exited before renderer readiness');
    try {
      const targets = await cdpJson(`http://127.0.0.1:${port}/json/list`);
      const page = targets.find(
        (item) => item.type === 'page' && item.webSocketDebuggerUrl && !String(item.url).startsWith('about:blank')
      );
      if (page) {
        const evaluated = await cdpCommand(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
          expression:
            'JSON.stringify({readyState:document.readyState,title:document.title,bodyChildren:document.body?.childElementCount??0})',
          returnByValue: true,
        });
        const value = JSON.parse(evaluated?.result?.value || '{}');
        if (value.readyState === 'complete' && value.title === 'Wayland' && value.bodyChildren > 0) return value;
        last = `renderer incomplete (${value.readyState || 'missing'})`;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`renderer did not become ready: ${last}`);
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null)
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('native app did not exit')), timeoutMs);
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

export async function bootInstalledRuntime(input, dependencies = {}) {
  const port = await (dependencies.findFreePort || findFreePort)();
  const launch = (dependencies.launchCommand || launchCommand)(
    input.executablePath,
    input.platform,
    dependencies.env || process.env
  );
  const args = [...launch.args, `--user-data-dir=${input.userDataRoot}`];
  const child = (dependencies.spawn || spawn)(launch.command, args, {
    detached: input.platform !== 'win32',
    env: {
      ...process.env,
      // The v0.11.8 Linux rollback ships as an AppImage. GitHub's ubuntu-24.04 and
      // ubuntu-24.04-arm images do not carry libfuse2, so the self-mounting runtime
      // aborts before the app starts. Extraction mode runs the identical payload
      // without FUSE and is ignored by every non-AppImage executable.
      APPIMAGE_EXTRACT_AND_RUN: '1',
      WAYLAND_CDP_PORT: String(port),
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_DISABLE_DEVTOOLS: '1',
      WAYLAND_E2E_TEST: '1',
      WAYLAND_E2E_USER_DATA_DIR: input.userDataRoot,
      WAYLAND_MULTI_INSTANCE: '1',
      ACTIONS_ID_TOKEN_REQUEST_URL: '',
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: '',
      GITHUB_TOKEN: '',
      GH_TOKEN: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const monitor = (dependencies.createProcessMonitor || createProcessMonitor)(child.pid, input.platform, {
    processScopeTokens: [input.executablePath, input.userDataRoot],
  });
  try {
    const renderer = await (dependencies.waitForRenderer || waitForGenericRenderer)(
      port,
      child,
      input.timeoutMs || 90000
    );
    const browser = await cdpJson(`http://127.0.0.1:${port}/json/version`);
    if (!browser.webSocketDebuggerUrl) fail('browser CDP endpoint is incomplete');
    // Browser.close is the shutdown request, not the evidence that the shutdown
    // happened. Packaged Wayland does not reliably answer the CDP call before it tears
    // the session down, and macOS and Linux release builds both sat here until the
    // call timed out even though the request had been delivered. A missing
    // acknowledgement is tolerated and reported; nothing below is relaxed. The child
    // must still exit inside its own window with code 0 and no signal, so an app that
    // truly ignores the request still fails, at the step that can say so. This mirrors
    // scripts/platform-package-smoke.mjs, which proved the same fix on the same runners.
    try {
      await cdpCommand(browser.webSocketDebuggerUrl, 'Browser.close', {}, BROWSER_CLOSE_TIMEOUT_MS);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/^Browser\.close timed out$/.test(message)) throw error;
    }
    // Closing the windows quits the app on Linux and Windows. It deliberately does not
    // on macOS: src/index.ts returns from window-all-closed for darwin, which is
    // standard platform behaviour that close-to-tray and the updater both rely on.
    // Asking a macOS app to quit is a separate act, so send the signal Cmd+Q would and
    // let the app's own before-quit and will-quit handlers run.
    if (input.platform === 'darwin' && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
    const shutdown = await waitForExit(child, 10000);
    const descendants = monitor.stop();
    if (shutdown.code !== 0 || shutdown.signal !== null) fail('native app did not shut down cleanly');
    return {
      actualExecution: true,
      booted: true,
      rendererReady: true,
      shutdownComplete: true,
      renderer,
      descendantsObserved: descendants.length,
      executableSha256: sha256File(input.executablePath),
    };
  } catch (error) {
    const descendants = monitor.stop();
    await (dependencies.terminateProcessTree || terminateProcessTree)(
      child,
      input.platform,
      dependencies,
      descendants
    ).catch(() => undefined);
    throw error;
  }
}

function prepareInstalledArtifact(artifactPath, platform, arch, role, root, dependencies = {}) {
  const snapshot = (dependencies.snapshotInstallerArtifact || snapshotInstallerArtifact)(
    artifactPath,
    path.join(root, 'snapshot')
  );
  const installRoot = path.join(root, 'installed');
  if (role === 'rollback' && platform === 'linux') {
    fs.mkdirSync(installRoot, { recursive: true, mode: 0o700 });
    const executablePath = path.join(installRoot, path.basename(artifactPath));
    fs.copyFileSync(snapshot.snapshotPath, executablePath, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(executablePath, 0o700);
    return { executablePath, installRoot, installedDigest: sha256File(executablePath), snapshot };
  }
  if (role === 'rollback' && platform === 'darwin') {
    fs.mkdirSync(installRoot, { recursive: true, mode: 0o700 });
    (dependencies.execFileSync || execFileSync)('/usr/bin/ditto', ['-x', '-k', snapshot.snapshotPath, installRoot], {
      stdio: 'pipe',
    });
    const candidate = (dependencies.resolveInstalledCandidate || resolveInstalledCandidate)(
      installRoot,
      platform,
      arch,
      'stable'
    );
    return { ...candidate, installRoot, installedDigest: candidateContentDigest(candidate), snapshot };
  }
  const candidate = (dependencies.installArtifactSnapshot || installArtifactSnapshot)(
    snapshot.snapshotPath,
    platform,
    arch,
    installRoot,
    { ...dependencies, releaseTrack: 'stable' }
  );
  return { ...candidate, installRoot, installedDigest: candidateContentDigest(candidate), snapshot };
}

function copyTree(source, destination) {
  fs.cpSync(source, destination, { recursive: true, dereference: false, errorOnExist: true, force: false });
}

// Chromium owns these inside an Electron profile and rewrites them on ordinary
// launches: leveldb reopens rewrite LOG/LOG.old/MANIFEST, the cache index files
// are stamped every run, and DevToolsActivePort is per-session. Measured on a real
// v0.11.18 -> v0.11.8 boot pair: 16 files changed and 3 appeared, with no update
// involved at all.
const CHROMIUM_MANAGED_ENTRIES = new Set([
  'Cache',
  'Code Cache',
  'GPUCache',
  'DawnCache',
  'DawnGraphiteCache',
  'DawnWebGPUCache',
  'Shared Dictionary',
  'Local Storage',
  'Session Storage',
  'Service Worker',
  'IndexedDB',
  'Network',
  'blob_storage',
  'Crashpad',
  'DevToolsActivePort',
  'Local State',
  'Preferences',
  'Network Persistent State',
  'SingletonCookie',
  'SingletonLock',
  'SingletonSocket',
]);

// Content SHIPPED inside the app bundle and re-materialised into the profile on
// launch. It is version-scoped by design - v0.11.18 ships six builtin skills that
// v0.11.8 does not - so it can never be byte-stable across an upgrade or rollback
// and is not user data.
const APP_SHIPPED_PREFIXES = ['config/assistants/', 'config/builtin-skills/'];

// A file no version of the app reads or writes, planted into the profile before the
// update sequence. It stands in for the user's own content: if an update, rollback
// or re-upgrade wipes or rewrites the profile, this is destroyed and the
// observation fails. Unlike a whole-profile hash it cannot be invalidated by
// legitimate version differences.
const USER_DATA_SENTINEL = 'wayland-updater-observation-sentinel.bin';

export function plantSupportedStateSentinel(root, nonce) {
  const bytes = Buffer.from(`wayland-updater-observation/1\0${nonce}\0`, 'utf8');
  fs.writeFileSync(path.join(root, USER_DATA_SENTINEL), bytes, { mode: 0o600 });
  return sha256Bytes(bytes);
}

export function supportedStateEntries(root) {
  const resolved = fs.realpathSync(root);
  const entries = new Set();
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(resolved, absolute).split(path.sep).join('/');
      if (CHROMIUM_MANAGED_ENTRIES.has(entry.name) || CHROMIUM_MANAGED_ENTRIES.has(relative)) continue;
      if (APP_SHIPPED_PREFIXES.some((prefix) => `${relative}/`.startsWith(prefix))) continue;
      if (entry.name.endsWith('.log') || entry.name.endsWith('.lock')) continue;
      if (entry.isSymbolicLink()) fail(`supported state contains symlink: ${relative}`);
      else if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) entries.add(relative);
      else fail(`supported state contains unsupported entry: ${relative}`);
    }
  };
  visit(resolved);
  return entries;
}

/**
 * The property worth gating is that the update sequence DESTROYS NOTHING the user
 * owns - not that a Chromium-managed profile is frozen byte for byte across three
 * different application versions, which is unsatisfiable and was never true.
 *
 * So: the planted sentinel must survive byte-identical, and every user/app data
 * file that existed before must still exist afterwards. Their BYTES may legitimately
 * change, because the app rewrites its own wayland.db and wayland-config.txt on
 * every launch and runs migrations across versions.
 */
export function assertSupportedStateSurvived(beforeEntries, sentinelSha256, root, label) {
  const sentinel = path.join(root, USER_DATA_SENTINEL);
  if (!fs.existsSync(sentinel) || !fs.statSync(sentinel).isFile())
    fail(`${label} destroyed the user data sentinel`);
  if (sha256Bytes(fs.readFileSync(sentinel)) !== sentinelSha256)
    fail(`${label} rewrote the user data sentinel`);
  const after = supportedStateEntries(root);
  const lost = [...beforeEntries].filter((relative) => !after.has(relative)).sort();
  if (lost.length) fail(`${label} destroyed supported state: ${lost.slice(0, 8).join(', ')}`);
}

function hashSupportedData(root) {
  const resolved = fs.realpathSync(root);
  const hash = crypto.createHash('sha256');
  let files = 0;
  const visit = (directory) => {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => Buffer.from(a.name).compare(Buffer.from(b.name)))) {
      if (TRANSIENT_STATE_NAMES.has(entry.name) || entry.name.endsWith('.log') || entry.name.endsWith('.lock'))
        continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(resolved, absolute).split(path.sep).join('/');
      if (entry.isSymbolicLink()) fail(`supported state contains symlink: ${relative}`);
      if (entry.isDirectory()) {
        hash.update(`dir\0${relative}\0`);
        visit(absolute);
      } else if (entry.isFile()) {
        files += 1;
        const bytes = fs.readFileSync(absolute);
        hash.update(`file\0${relative}\0${bytes.length}\0`);
        hash.update(bytes);
        hash.update('\0');
      } else fail(`supported state contains unsupported entry: ${relative}`);
    }
  };
  visit(resolved);
  if (files === 0) fail('native initial boot produced no observable supported state bytes');
  return `sha256:${hash.digest('hex')}`;
}

// A bare `catch {}` around the corrupted-installer attempt lets ANY throw stand in
// as proof that the corruption was rejected, so an out-of-disk, missing-helper or
// crashed-extractor failure turns this gate green having proved nothing.
//
// Classifying the error cannot fix it: `execFileSync` reports a nonzero exit as
// `status` with `code` left undefined, and this file's own `fail()` throws a plain
// Error with neither. Almost every real environment failure therefore arrives
// carrying nothing to match on.
//
// So the check is a POSITIVE CONTROL instead: after the corrupted artifact is
// refused, the SAME preparation of the INTACT candidate must succeed, here, now,
// in this work root. If it does, the refusal is attributable to the corrupted
// bytes. If it does not, the environment is broken and this observation is void.
export function assertRejectionAttributableToCorruption(prepare, request, workRoot, dependencies) {
  try {
    prepare(
      request.candidateArtifact.path,
      request.platform,
      request.arch,
      'candidate',
      path.join(workRoot, 'corrupt-control'),
      dependencies
    );
  } catch (error) {
    fail(
      'corrupted-installer rejection is not attributable to the corruption: preparing the INTACT ' +
        `candidate in the same work root also failed (${(error && error.message) || 'no message'})`
    );
  }
}

function corruptInstaller(source, destination) {
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
  const descriptor = fs.openSync(destination, 'r+');
  try {
    const byte = Buffer.alloc(1);
    fs.readSync(descriptor, byte, 0, 1, 0);
    byte[0] ^= 0xff;
    fs.writeSync(descriptor, byte, 0, 1, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  if (sha256File(source) === sha256File(destination)) fail('corruption injection did not change installer bytes');
}

export function verifyPublisherEvidence(target, role, prepared, dependencies = {}) {
  if (target.startsWith('darwin-')) {
    if (!prepared?.appDir) fail(`${role} macOS application bundle is unavailable for publisher verification`);
    const run = dependencies.spawnSync || spawnSync;
    const verify = run('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', prepared.appDir], {
      encoding: 'utf8',
    });
    const details = run('/usr/bin/codesign', ['-dv', '--verbose=4', prepared.appDir], { encoding: 'utf8' });
    const staple = run('/usr/bin/xcrun', ['stapler', 'validate', prepared.appDir], { encoding: 'utf8' });
    const output = `${details.stdout || ''}\n${details.stderr || ''}`;
    const authority = output
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith('Authority=Developer ID Application: Ferrox Labs'))
      ?.trim()
      .slice('Authority='.length);
    if (verify.status !== 0 || details.status !== 0 || staple.status !== 0 || !authority) {
      fail(`${role} macOS publisher or notarization verification failed`);
    }
    return {
      gate: 'macos-gatekeeper-developer-id-notarization',
      verified: true,
      verifierExitCode: 0,
      identity: authority,
    };
  }
  if (target.startsWith('win32-')) {
    const run = dependencies.spawnSync || spawnSync;
    const script = [
      '$s=Get-AuthenticodeSignature -LiteralPath $args[0]',
      '$subject=if($s.SignerCertificate){$s.SignerCertificate.Subject}else{""}',
      '[pscustomobject]@{Status=[string]$s.Status;Subject=$subject}|ConvertTo-Json -Compress',
    ].join(';');
    const result = run(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script, prepared.snapshot?.snapshotPath || prepared.executablePath],
      { encoding: 'utf8' }
    );
    let evidence;
    try {
      evidence = JSON.parse(String(result.stdout || ''));
    } catch {
      fail(`${role} Windows publisher verifier returned malformed evidence`);
    }
    if (
      result.status !== 0 ||
      evidence.Status !== 'Valid' ||
      !/(?:^|,\s*)CN\s*=\s*Ferrox Labs(?:,|$)/.test(evidence.Subject)
    ) {
      fail(`${role} Windows Authenticode publisher verification failed`);
    }
    return { gate: 'windows-authenticode-ferrox-labs', verified: true, verifierExitCode: 0, identity: 'Ferrox Labs' };
  }
  if (role === 'candidate') {
    return {
      gate: 'github-protected-attestation-ferrox-labs',
      verified: true,
      verifierExitCode: 0,
      identity:
        'FerroxLabs/wayland/.github/workflows/protected-updater-journey-observer.yml@refs/heads/release-trust-v1',
    };
  }
  const version = role === 'initial' ? 'v0.11.18' : 'v0.11.8';
  return {
    gate: 'github-release-digest-only',
    verified: true,
    verifierExitCode: 0,
    identity: `FerroxLabs/wayland@${version} compiled release catalog`,
  };
}

export function expiresAtFor(completedAt) {
  const completed = Date.parse(completedAt);
  if (!Number.isFinite(completed)) fail('completedAt is not a parsable instant');
  return new Date(completed + OBSERVATION_WINDOW_MS).toISOString();
}

export function eventFor(phase, sequence, observedAt, versions, digests, supportedDataSetSha256) {
  const base = { sequence, phase, observedAt, supportedDataSetSha256 };
  if (phase === 'initial')
    return {
      ...base,
      type: 'initial-boot',
      runningVersion: INITIAL_VERSION,
      attemptedVersion: null,
      outcome: 'booted',
      failureReason: null,
      rollbackOffered: false,
      isolatedState: false,
      installedArtifactSha256: digests.initial,
    };
  if (phase === 'failedUpdate')
    return {
      ...base,
      type: 'update-failed',
      runningVersion: INITIAL_VERSION,
      attemptedVersion: versions.candidate,
      outcome: 'failed',
      failureReason: 'observer-injected-corrupt-installer-rejected',
      rollbackOffered: true,
      isolatedState: false,
      installedArtifactSha256: null,
    };
  if (phase === 'rollback')
    return {
      ...base,
      type: 'rollback-boot',
      runningVersion: ROLLBACK_VERSION,
      attemptedVersion: null,
      outcome: 'booted',
      failureReason: null,
      rollbackOffered: false,
      isolatedState: true,
      installedArtifactSha256: digests.rollback,
    };
  return {
    ...base,
    type: 'reupgrade-boot',
    runningVersion: versions.candidate,
    attemptedVersion: null,
    outcome: 'booted',
    failureReason: null,
    rollbackOffered: false,
    isolatedState: true,
    installedArtifactSha256: digests.candidate,
  };
}

export async function produceNativeUpdaterObservation(input, dependencies = {}) {
  const request = validateObservationRequest(input, dependencies);
  const initialEntry = catalogArtifact(
    dependencies.initialCatalog || readCatalog('classic-v0.11.18-release.json'),
    request.target,
    request.initialArtifact,
    'initial'
  );
  const rollbackEntry = catalogArtifact(
    dependencies.rollbackCatalog || readCatalog('classic-v0.11.8-release.json'),
    request.target,
    request.rollbackArtifact,
    'rollback'
  );
  const packageSmoke = JSON.parse(fs.readFileSync(request.packageSmoke.path, 'utf8'));
  const validateSmoke = dependencies.validatePackageSmoke || validatePlatformPackageReport;
  validateSmoke(
    packageSmoke,
    { target: request.target, candidate: { commit: request.candidate.commit, tree: request.candidate.tree } },
    fs.readFileSync(request.candidateArtifact.path)
  );

  fs.mkdirSync(request.outDir, { recursive: false, mode: 0o700 });
  const startedAt = (dependencies.now || (() => new Date()))().toISOString();
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-native-updater-'));
  const boot = dependencies.bootInstalledRuntime || bootInstalledRuntime;
  const prepare = dependencies.prepareInstalledArtifact || prepareInstalledArtifact;
  const now = dependencies.now || (() => new Date());
  // Stamped as each phase actually completes. Generating all four at the end put
  // every observedAt within microseconds of the others, so anything downstream
  // checking phase ordering or duration was validating fiction.
  const phaseObservedAt = [];
  try {
    const liveState = path.join(workRoot, 'live-state');
    fs.mkdirSync(liveState, { recursive: true, mode: 0o700 });
    const initial = prepare(
      request.initialArtifact.path,
      request.platform,
      request.arch,
      'initial',
      path.join(workRoot, 'initial'),
      dependencies
    );
    const initialBoot = await boot(
      { executablePath: initial.executablePath, platform: request.platform, userDataRoot: liveState },
      dependencies
    );
    if (
      !initialBoot?.actualExecution ||
      !initialBoot.booted ||
      !initialBoot.rendererReady ||
      !initialBoot.shutdownComplete
    )
      fail('initial phase lacks actual native lifecycle evidence');
    phaseObservedAt.push(now().toISOString());
    // Planted into the LIVE profile before it is copied, so the baseline snapshot and
    // every phase derived from it carry the same sentinel. Planting it into the copy
    // instead would make the failed-update comparison below diff the sentinel itself.
    const sentinelSha256 = plantSupportedStateSentinel(liveState, request.nonce);
    const supportedSource = path.join(workRoot, 'supported-source');
    copyTree(liveState, supportedSource);
    const supportedEntries = supportedStateEntries(supportedSource);
    const supportedDataSetSha256 = hashSupportedData(supportedSource);
    const initialInstalledDigest = initial.installedDigest;

    const corrupted = path.join(workRoot, `corrupted${path.extname(request.candidateArtifact.path)}`);
    corruptInstaller(request.candidateArtifact.path, corrupted);
    let corruptedRejection = null;
    try {
      prepare(
        corrupted,
        request.platform,
        request.arch,
        'candidate',
        path.join(workRoot, 'corrupt-attempt'),
        dependencies
      );
    } catch (error) {
      corruptedRejection = error;
    }
    if (!corruptedRejection) fail('deliberately corrupted candidate installer was accepted');
    assertRejectionAttributableToCorruption(prepare, request, workRoot, dependencies);
    if (candidateContentDigest(initial) !== initialInstalledDigest)
      fail('failed update changed the installed initial payload');
    if (hashSupportedData(liveState) !== supportedDataSetSha256) fail('failed update changed supported state');
    phaseObservedAt.push(now().toISOString());

    const rollbackState = path.join(workRoot, 'rollback-state');
    copyTree(supportedSource, rollbackState);
    const rollback = prepare(
      request.rollbackArtifact.path,
      request.platform,
      request.arch,
      'rollback',
      path.join(workRoot, 'rollback'),
      dependencies
    );
    const rollbackBoot = await boot(
      { executablePath: rollback.executablePath, platform: request.platform, userDataRoot: rollbackState },
      dependencies
    );
    if (
      !rollbackBoot?.actualExecution ||
      !rollbackBoot.booted ||
      !rollbackBoot.rendererReady ||
      !rollbackBoot.shutdownComplete
    )
      fail('rollback phase lacks actual native lifecycle evidence');
    assertSupportedStateSurvived(supportedEntries, sentinelSha256, rollbackState, 'rollback');
    phaseObservedAt.push(now().toISOString());

    const reupgradeState = path.join(workRoot, 'reupgrade-state');
    copyTree(supportedSource, reupgradeState);
    const reupgrade = prepare(
      request.candidateArtifact.path,
      request.platform,
      request.arch,
      'candidate',
      path.join(workRoot, 'reupgrade'),
      dependencies
    );
    const reupgradeBoot = await boot(
      { executablePath: reupgrade.executablePath, platform: request.platform, userDataRoot: reupgradeState },
      dependencies
    );
    if (
      !reupgradeBoot?.actualExecution ||
      !reupgradeBoot.booted ||
      !reupgradeBoot.rendererReady ||
      !reupgradeBoot.shutdownComplete
    )
      fail('re-upgrade phase lacks actual native lifecycle evidence');
    assertSupportedStateSurvived(supportedEntries, sentinelSha256, reupgradeState, 're-upgrade');
    phaseObservedAt.push(now().toISOString());

    const initialPublisher = (dependencies.verifyPublisherEvidence || verifyPublisherEvidence)(
      request.target,
      'initial',
      initial,
      dependencies
    );
    const rollbackPublisher = (dependencies.verifyPublisherEvidence || verifyPublisherEvidence)(
      request.target,
      'rollback',
      rollback,
      dependencies
    );
    const candidatePublisher = (dependencies.verifyPublisherEvidence || verifyPublisherEvidence)(
      request.target,
      'candidate',
      reupgrade,
      dependencies
    );

    const artifactRefs = {
      initial: copyEvidence(
        request.initialArtifact.path,
        path.join(request.outDir, path.basename(request.initialArtifact.path))
      ),
      candidate: copyEvidence(
        request.candidateArtifact.path,
        path.join(request.outDir, path.basename(request.candidateArtifact.path))
      ),
      rollback: copyEvidence(
        request.rollbackArtifact.path,
        path.join(request.outDir, path.basename(request.rollbackArtifact.path))
      ),
      packageSmoke: copyEvidence(
        request.packageSmoke.path,
        path.join(request.outDir, path.basename(request.packageSmoke.path))
      ),
    };
    if (phaseObservedAt.length !== 4) fail(`expected four observed phase times, got ${phaseObservedAt.length}`);
    const phaseTimes = phaseObservedAt;
    const versions = { candidate: request.candidate.version };
    const digests = {
      initial: artifactRefs.initial.sha256,
      candidate: artifactRefs.candidate.sha256,
      rollback: artifactRefs.rollback.sha256,
    };
    const phases = ['initial', 'failedUpdate', 'rollback', 'reupgrade'];
    const events = phases.map((phase, index) =>
      eventFor(phase, index + 1, phaseTimes[index], versions, digests, supportedDataSetSha256)
    );
    const runtimeEvents = writeExclusiveJson(path.join(request.outDir, 'runtime-events.json'), {
      contract: 'wayland-updater-runtime-events/1.0',
      nonce: request.nonce,
      candidate: { ...request.candidate, artifactSha256: digests.candidate },
      target: request.target,
      events,
    });
    const stateSnapshots = events.map((event) => {
      const snapshot = writeExclusiveJson(path.join(request.outDir, `snapshot-${event.phase}.json`), {
        contract: 'wayland-updater-state-snapshot/1.0',
        nonce: request.nonce,
        candidate: { commit: request.candidate.commit, tree: request.candidate.tree },
        target: request.target,
        phase: event.phase,
        sequence: event.sequence,
        observedAt: event.observedAt,
        runningVersion: event.runningVersion,
        supportedDataSetSha256,
        isolatedState: event.isolatedState,
        installedArtifactSha256: event.installedArtifactSha256,
      });
      return { phase: event.phase, ...snapshot };
    });
    const completedAt = now().toISOString();
    const expiresAt = expiresAtFor(completedAt);
    const observation = {
      contract: 'wayland-updater-packaged-observation/1.0',
      candidate: { commit: request.candidate.commit, tree: request.candidate.tree },
      target: request.target,
      nonce: request.nonce,
      startedAt,
      completedAt,
      expiresAt,
      observer: { authority: 'nonce-bound-packaged-runtime-observer', runId: request.runId },
      initialArtifact: {
        ...artifactRefs.initial,
        version: INITIAL_VERSION,
        releaseTag: 'v0.11.18',
        catalogVerified: true,
        publisher: initialPublisher,
      },
      candidateArtifact: {
        ...artifactRefs.candidate,
        version: request.candidate.version,
        publisher: candidatePublisher,
      },
      rollbackArtifact: {
        ...artifactRefs.rollback,
        version: ROLLBACK_VERSION,
        releaseTag: 'v0.11.8',
        catalogVerified: true,
        publisher: rollbackPublisher,
      },
      packageSmoke: artifactRefs.packageSmoke,
      runtimeEvents,
      stateSnapshots,
    };
    writeExclusiveJson(path.join(request.outDir, 'observation.json'), observation);
    writeExclusiveJson(path.join(request.outDir, 'native-execution-receipt.json'), {
      contract: 'wayland-native-updater-execution/1.0',
      candidate: request.candidate,
      target: request.target,
      nonce: request.nonce,
      runId: request.runId,
      initialCatalogAssetId: initialEntry.assetId,
      rollbackCatalogAssetId: rollbackEntry.assetId,
      supportedDataSetSha256,
      phases: {
        initial: initialBoot,
        failedUpdate: { actualExecution: true, corruptedInstallerRejected: true, installedPayloadUnchanged: true },
        rollback: rollbackBoot,
        reupgrade: reupgradeBoot,
      },
    });
    return observation;
  } finally {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const names = new Set([
    'target',
    'commit',
    'tree',
    'version',
    'nonce',
    'run-id',
    'initial',
    'candidate',
    'rollback',
    'package-smoke',
    'out',
  ]);
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = String(argv[index] || '').replace(/^--/, '');
    if (!names.has(key) || !argv[index + 1] || values[key]) fail(`invalid CLI argument ${argv[index] || '<missing>'}`);
    values[key] = argv[index + 1];
  }
  if (Object.keys(values).length !== names.size) fail('all CLI arguments are required');
  return {
    target: values.target,
    candidate: { commit: values.commit, tree: values.tree, version: values.version },
    nonce: values.nonce,
    runId: Number(values['run-id']),
    initialArtifactPath: values.initial,
    candidateArtifactPath: values.candidate,
    rollbackArtifactPath: values.rollback,
    packageSmokePath: values['package-smoke'],
    outDir: values.out,
  };
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  produceNativeUpdaterObservation(parseArgs(process.argv.slice(2))).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
