import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import yaml from 'js-yaml';

import {
  assertFreshCandidate,
  assertFreshInstaller,
  assertPortVacant,
  candidateContentDigest,
  captureCandidateState,
  createProcessMonitor,
  describeProcessRecord,
  chromiumRoleFromCommandLine,
  redactHighEntropyRuns,
  formatDescendantInventory,
  currentSourceIdentity,
  drainDescendants,
  expectedReleaseIdentity,
  findInstallerArtifacts,
  installArtifactSnapshot,
  isReadyRendererState,
  launchCommand,
  parseArgs,
  parseOptionalCapabilityStates,
  prepareInstalledCandidate,
  redactSmokeMarkerFromUrl,
  resolveInstalledCandidate,
  runSmoke,
  terminateProcessTree,
  verifyPackageSmokeEventLedger,
  verifyShutdownEvidence,
  waitForRendererReady,
} from '../../scripts/platform-package-smoke.mjs';

const require = createRequire(import.meta.url);
const { inspectExecutable, resolvePackagedTarget } = require('../../scripts/verify-packaged-resources.js');
const repoRoot = path.resolve(__dirname, '../..');
const temporaryRoots: string[] = [];
const TEST_SOURCE_COMMIT = '1'.repeat(40);
const TEST_SOURCE_TREE = '2'.repeat(40);

function cleanSourceDependencies() {
  return {
    execFileSync: (_command: string, args: string[]) => {
      if (args[0] === 'status') return '';
      if (args[0] === 'rev-parse' && args[1] === 'HEAD^{tree}') return TEST_SOURCE_TREE;
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') return TEST_SOURCE_COMMIT;
      throw new Error(`unexpected Git proof command: ${args.join(' ')}`);
    },
  };
}

type WorkflowStep = {
  id?: string;
  name?: string;
  if?: unknown;
  'continue-on-error'?: unknown;
  run?: string;
  env?: Record<string, string>;
  with?: Record<string, string>;
};

type WorkflowConfig = {
  env?: Record<string, string>;
  jobs: Record<
    string,
    {
      needs?: unknown;
      if?: unknown;
      env?: Record<string, string>;
      strategy?: {
        matrix?: {
          include?: Array<Record<string, string>>;
          platform_target?: string[];
          release_track?: string[];
        };
      };
      steps?: WorkflowStep[];
      with?: Record<string, string>;
    }
  >;
};

type FakeChild = EventEmitter & {
  pid: number;
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
  stdout: PassThrough;
  stderr: PassThrough;
  kill: ReturnType<typeof vi.fn>;
};

function temporaryRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-platform-smoke-test-'));
  temporaryRoots.push(root);
  return root;
}

function executableBytes(platform: 'linux' | 'win32', arch: 'x64' | 'arm64'): Buffer {
  if (platform === 'linux') {
    const bytes = Buffer.alloc(64);
    bytes.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1], 0);
    bytes.writeUInt16LE(arch === 'x64' ? 0x3e : 0xb7, 18);
    return bytes;
  }
  const bytes = Buffer.alloc(160);
  bytes.write('MZ', 0, 'ascii');
  bytes.writeUInt32LE(0x80, 0x3c);
  bytes.write('PE\0\0', 0x80, 'binary');
  bytes.writeUInt16LE(arch === 'x64' ? 0x8664 : 0xaa64, 0x84);
  return bytes;
}

function writeUnpackedTarget(
  outDir: string,
  platform: 'linux' | 'win32',
  arch: 'x64' | 'arm64',
  bytes = executableBytes(platform, arch)
): { appDir: string; resourceDir: string; executablePath: string } {
  const appDir = path.join(outDir, `${platform}-${arch}-unpacked`);
  const resourceDir = path.join(appDir, 'resources');
  const executablePath = path.join(appDir, platform === 'win32' ? 'Wayland.exe' : 'wayland');
  fs.mkdirSync(resourceDir, { recursive: true });
  fs.writeFileSync(executablePath, bytes, { mode: 0o755 });
  fs.writeFileSync(path.join(resourceDir, 'app.asar'), 'packaged application');
  return { appDir, resourceDir, executablePath };
}

function workflow(name: string): WorkflowConfig {
  return yaml.load(fs.readFileSync(path.join(repoRoot, '.github/workflows', name), 'utf8')) as WorkflowConfig;
}

function makeFakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.exitCode = null;
  child.signalCode = null;
  child.pid = 8123;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = vi.fn(() => {
    child.exitCode = 137;
    child.signalCode = 'SIGKILL';
    child.emit('exit', null, 'SIGKILL');
    return true;
  });
  return child;
}

function validSmokeEvents(marker: string, releaseIdentity = expectedReleaseIdentity('stable', 'linux', 'x64')) {
  const markerSha256 = `sha256:${crypto.createHash('sha256').update(marker).digest('hex')}`;
  return [
    'boot-start',
    'renderer-load-start',
    'renderer-loaded',
    'cleanup-start',
    'cleanup-complete',
    'will-quit',
    'quit',
  ].map((type, index) => {
    const event: Record<string, unknown> = {
      contract: 'wayland-package-smoke-event/1',
      seq: index + 1,
      markerSha256,
      type,
    };
    if (type === 'boot-start') event.releaseIdentity = releaseIdentity;
    if (type === 'quit') event.exitCode = 0;
    return event;
  });
}

function smokeHarness() {
  const root = temporaryRoot();
  const outDir = path.join(root, 'out');
  const candidateStateFile = path.join(root, 'candidate-state.json');
  const captured = captureCandidateState(outDir, 'linux', 'x64', candidateStateFile, {
    ...cleanSourceDependencies(),
    captureNonce: 'a'.repeat(64),
    releaseTrack: 'stable',
  });
  fs.mkdirSync(outDir, { recursive: true });
  const artifactPath = path.join(outDir, 'Wayland-0.0.0-linux-x64.deb');
  fs.writeFileSync(artifactPath, 'fresh installer payload');
  const privateRoot = path.join(root, 'private-install');
  const installRoot = path.join(privateRoot, 'installed');
  const candidate = writeUnpackedTarget(installRoot, 'linux', 'x64');
  Object.assign(candidate, { releaseIdentity: expectedReleaseIdentity('stable', 'linux', 'x64') });
  const installedDigest = candidateContentDigest(candidate);
  const installerFreshness = assertFreshInstaller(
    artifactPath,
    candidateStateFile,
    captured.digest,
    'linux',
    'x64',
    'stable',
    cleanSourceDependencies()
  );
  const installed = {
    artifactPath,
    candidate,
    installRoot,
    installerFreshness,
    installedDigest,
    privateRoot,
    snapshot: {
      snapshotPath: path.join(privateRoot, 'snapshot', 'installer.deb'),
      sourceDigest: installerFreshness.artifactDigest,
      sourceBytesSha256: '1'.repeat(64),
      snapshotBytesSha256: '1'.repeat(64),
    },
  };
  const child = makeFakeChild();
  const userDataDir = path.join(root, 'user-data');
  const options = {
    outDir,
    targetPlatform: 'linux',
    targetArch: 'x64',
    releaseTrack: 'stable',
    candidateStateFile,
    candidateStateDigest: captured.digest,
    timeoutMs: 1_000,
  };
  const verify = vi.fn(({ logger }: { logger: { log: (line: string) => void } }) => {
    logger.log('OK hub');
    logger.log('WARN whatsapp-bridge (optional, missing or empty)');
    logger.log('OK signal-cli-runtime');
    return { resourceDirs: [candidate.resourceDir] };
  });
  const dependencies = {
    hostPlatform: 'linux',
    hostArch: 'x64',
    env: { DISPLAY: ':99' },
    createUserData: vi.fn(() => {
      fs.mkdirSync(userDataDir);
      return userDataDir;
    }),
    prepareInstalledCandidate: vi.fn(() => installed),
    findFreePort: vi.fn(async () => 43123),
    assertPortVacant: vi.fn(async () => undefined),
    spawn: vi.fn(() => child),
    verifyPackagedResources: verify,
    waitForRendererReady: vi.fn(
      async (
        _port: number,
        _timeout: number,
        _child: FakeChild,
        expected: {
          rendererPath: string;
          smokeMarker: string;
          releaseIdentity: ReturnType<typeof expectedReleaseIdentity>;
        }
      ) => ({
        readyState: 'complete',
        title: 'Wayland',
        url: `${pathToFileURL(expected.rendererPath).href}?waylandSmokeMarker=${expected.smokeMarker}`,
        bodyChildren: 1,
        rootChildren: 1,
        smokeMarker: expected.smokeMarker,
        shellExperience: 'classic',
        releaseIdentity: expected.releaseIdentity,
        recoveryFallback: false,
        fatalErrorBoundary: false,
      })
    ),
    createProcessMonitor: vi.fn(() => ({
      stop: vi.fn(() => [{ pid: 9001, parentPid: 8123, identity: 'born\0core' }]),
    })),
    processRecordAlive: vi.fn(() => false),
    terminateProcessTree: vi.fn(async (target: FakeChild) => {
      if (target.exitCode === null && target.signalCode === null) target.kill('SIGKILL');
      return [];
    }),
    readPackageSmokeEventLedger: vi.fn(() => {
      const marker = dependencies.spawn.mock.calls[0][2].env.WAYLAND_PACKAGE_SMOKE_MARKER;
      return validSmokeEvents(marker);
    }),
    shutdownSettleMs: 0,
    requestJson: vi.fn(async () => ({ webSocketDebuggerUrl: 'ws://browser' })),
    cdpCommand: vi.fn(async () => {
      child.stdout.write('[Wayland] will-quit - all cleanup should be complete\n');
      child.stdout.write('[Wayland] quit (exitCode=0)\n');
      child.exitCode = 0;
      child.emit('exit', 0, null);
      return {};
    }),
  };
  return { root, candidate, child, options, verify, dependencies, installed };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('platform package smoke contract', () => {
  it('requires explicit target, output, and candidate state without hidden skip switches', () => {
    expect(() => parseArgs(['--out', 'out'])).toThrow('required argument missing');
    expect(() =>
      parseArgs([
        '--out',
        'out',
        '--target-platform',
        'darwin',
        '--target-arch',
        'arm64',
        '--release-track',
        'stable',
        '--candidate-state-file',
        'candidate-state.json',
        '--candidate-state-digest',
        `sha256:${'a'.repeat(64)}`,
        '--skip',
        'true',
      ])
    ).toThrow('unknown argument: --skip');
    expect(
      parseArgs([
        '--out',
        'out',
        '--target-platform',
        'win32',
        '--target-arch',
        'x64',
        '--release-track',
        'stable',
        '--candidate-state-file',
        'candidate-state.json',
        '--candidate-state-digest',
        `sha256:${'a'.repeat(64)}`,
      ]).targetPlatform
    ).toBe('win32');
    expect(() =>
      parseArgs([
        '--out',
        'out',
        '--target-platform',
        'linux',
        '--target-arch',
        'x64',
        '--release-track',
        'stable',
        '--capture-state',
        'state',
      ])
    ).toThrow('requires --github-output');
  });

  it('detects exact executable identity and rejects wrong-target or placeholder outputs', () => {
    const out = temporaryRoot();
    const x64 = writeUnpackedTarget(out, 'win32', 'x64');
    expect(inspectExecutable(x64.executablePath)).toEqual({ platform: 'win32', arch: 'x64' });
    expect(resolvePackagedTarget(out, 'win32', 'x64').executablePath).toBe(x64.executablePath);
    expect(() => resolvePackagedTarget(out, 'win32', 'arm64')).toThrow('found 0');

    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out);
    writeUnpackedTarget(out, 'win32', 'x64', Buffer.from('Wayland placeholder'));
    expect(() => resolvePackagedTarget(out, 'win32', 'x64')).toThrow('found 0');
  });

  it('binds stable and preview package identity, protocol, update channel, and Classic shell exactly', () => {
    expect(expectedReleaseIdentity('stable', 'win32', 'arm64')).toEqual({
      releaseTrack: 'stable',
      productName: 'Wayland',
      executableName: 'Wayland.exe',
      bundleName: 'Wayland.app',
      protocolScheme: 'wayland',
      updateChannel: 'latest-win-arm64',
      shellExperience: 'classic',
    });
    expect(expectedReleaseIdentity('preview', 'darwin', 'arm64')).toEqual({
      releaseTrack: 'preview',
      productName: 'Wayland Preview',
      executableName: 'Wayland Preview',
      bundleName: 'Wayland Preview.app',
      protocolScheme: 'wayland-preview',
      updateChannel: 'preview-arm64',
      shellExperience: 'classic',
    });
    expect(() => expectedReleaseIdentity('nightly', 'linux', 'x64')).toThrow('invalid release track');
  });

  // electron-builder writes `executableName` verbatim, so the Linux Preview
  // binary keeps its space. Expecting `wayland-preview` made both Linux preview
  // legs of Build Matrix report "found 0. Inventory: <empty>" against an
  // out-preview tree that had in fact packaged correctly.
  it('binds the Linux executable name to the product name on both tracks', () => {
    expect(expectedReleaseIdentity('stable', 'linux', 'x64').executableName).toBe('Wayland');
    expect(expectedReleaseIdentity('preview', 'linux', 'x64').executableName).toBe('Wayland Preview');
  });

  it('resolves a Linux Preview packaged app whose executable carries the product name', () => {
    const out = path.join(temporaryRoot(), 'out-preview');
    const appDir = path.join(out, 'linux-unpacked');
    fs.mkdirSync(path.join(appDir, 'resources'), { recursive: true });
    fs.writeFileSync(path.join(appDir, 'Wayland Preview'), executableBytes('linux', 'x64'), { mode: 0o755 });
    expect(path.basename(resolvePackagedTarget(out, 'linux', 'x64').executablePath)).toBe('Wayland Preview');

    fs.renameSync(path.join(appDir, 'Wayland Preview'), path.join(appDir, 'not-our-app'));
    expect(() => resolvePackagedTarget(out, 'linux', 'x64')).toThrow('found 0');
  });

  it('captures only the payload belonging to the requested release track', () => {
    const root = temporaryRoot();
    const preview = writeUnpackedTarget(root, 'linux', 'x64');
    fs.renameSync(preview.executablePath, path.join(preview.appDir, 'Wayland Preview'));
    const stableState = captureCandidateState(root, 'linux', 'x64', path.join(root, 'stable-state.json'), {
      ...cleanSourceDependencies(),
      captureNonce: '7'.repeat(64),
      releaseTrack: 'stable',
    });
    const previewState = captureCandidateState(root, 'linux', 'x64', path.join(root, 'preview-state.json'), {
      ...cleanSourceDependencies(),
      captureNonce: '8'.repeat(64),
      releaseTrack: 'preview',
    });
    expect(stableState.state.candidates).toHaveLength(0);
    expect(previewState.state.candidates).toHaveLength(1);
  });

  it('rejects metadata-only touches because content identity is unchanged', () => {
    const root = temporaryRoot();
    const outDir = path.join(root, 'out');
    const candidate = writeUnpackedTarget(outDir, 'linux', 'x64');
    const stateFile = path.join(root, 'candidate-state.json');
    const githubOutput = path.join(root, 'github-output');
    fs.writeFileSync(githubOutput, '');
    const before = captureCandidateState(outDir, 'linux', 'x64', stateFile, {
      ...cleanSourceDependencies(),
      captureNonce: 'b'.repeat(64),
      githubOutput,
      releaseTrack: 'stable',
    });
    expect(fs.readFileSync(githubOutput, 'utf8')).toBe(`candidate_state_digest=${before.digest}\n`);
    const future = new Date(Date.now() + 60_000);
    fs.utimesSync(candidate.appDir, future, future);
    fs.utimesSync(path.join(candidate.resourceDir, 'app.asar'), future, future);
    expect(() =>
      assertFreshCandidate(candidate, stateFile, before.digest, 'linux', 'x64', 'stable', cleanSourceDependencies())
    ).toThrow('content digest is unchanged');

    fs.appendFileSync(path.join(candidate.resourceDir, 'app.asar'), ' rebuilt');
    const after = assertFreshCandidate(
      candidate,
      stateFile,
      before.digest,
      'linux',
      'x64',
      'stable',
      cleanSourceDependencies()
    );
    expect(after.priorCandidateDigests).toEqual([before.state.candidates[0].digest]);
    expect(after.candidateDigest).not.toBe(before.state.candidates[0].digest);
  });

  it('rejects package evidence captured for a different source commit or tree', () => {
    const root = temporaryRoot();
    const outDir = path.join(root, 'out');
    const stateFile = path.join(root, 'candidate-state.json');
    const captured = captureCandidateState(outDir, 'linux', 'x64', stateFile, {
      ...cleanSourceDependencies(),
      captureNonce: '7'.repeat(64),
      releaseTrack: 'stable',
      sourceIdentity: { commit: '3'.repeat(40), tree: '4'.repeat(40) },
    });
    const candidate = writeUnpackedTarget(outDir, 'linux', 'x64');
    expect(() =>
      assertFreshCandidate(candidate, stateFile, captured.digest, 'linux', 'x64', 'stable', cleanSourceDependencies())
    ).toThrow('source commit/tree changed since candidate capture');
  });

  it('rejects tracked source drift instead of attributing it to the committed tree', () => {
    const sourceRoot = temporaryRoot();
    const sourceFile = path.join(sourceRoot, 'build-input.ts');
    execFileSync('git', ['init', '--quiet'], { cwd: sourceRoot });
    fs.writeFileSync(sourceFile, 'export const value = 1;\n');
    execFileSync('git', ['add', 'build-input.ts'], { cwd: sourceRoot });
    execFileSync(
      'git',
      ['-c', 'user.name=Wayland Test', '-c', 'user.email=wayland@example.test', 'commit', '--quiet', '-m', 'base'],
      { cwd: sourceRoot }
    );
    expect(currentSourceIdentity(sourceRoot)).toMatchObject({
      commit: expect.stringMatching(/^[a-f0-9]{40,64}$/),
      tree: expect.stringMatching(/^[a-f0-9]{40,64}$/),
    });

    fs.writeFileSync(sourceFile, 'export const value = 2;\n');
    expect(() => currentSourceIdentity(sourceRoot)).toThrow('source worktree is not clean');
  });

  it('rejects untracked build inputs instead of omitting them from source identity', () => {
    const sourceRoot = temporaryRoot();
    execFileSync('git', ['init', '--quiet'], { cwd: sourceRoot });
    fs.writeFileSync(path.join(sourceRoot, 'committed.ts'), 'export const committed = true;\n');
    execFileSync('git', ['add', 'committed.ts'], { cwd: sourceRoot });
    execFileSync(
      'git',
      ['-c', 'user.name=Wayland Test', '-c', 'user.email=wayland@example.test', 'commit', '--quiet', '-m', 'base'],
      { cwd: sourceRoot }
    );

    fs.writeFileSync(path.join(sourceRoot, 'injected-build-input.ts'), 'export const injected = true;\n');
    expect(() => currentSourceIdentity(sourceRoot)).toThrow('source worktree is not clean');
  });

  // NTFS has no POSIX permission bits: Node reports mode 0o666 for every writable file on
  // Windows and chmodSync only toggles the read-only flag, so there is no mode change for the
  // digest to bind to on a Windows host. The behaviour under test only exists for the
  // darwin/linux candidates this assertion builds.
  it.skipIf(process.platform === 'win32')(
    'binds candidate identity to executable permission modes as well as bytes',
    () => {
      const out = temporaryRoot();
      const candidate = writeUnpackedTarget(out, 'linux', 'x64');
      const executableDigest = candidateContentDigest(candidate);
      fs.chmodSync(candidate.executablePath, 0o644);
      expect(candidateContentDigest(candidate)).not.toBe(executableDigest);
    }
  );

  it('binds freshness to the real installer artifact and rejects metadata-only installer touches', () => {
    const root = temporaryRoot();
    const outDir = path.join(root, 'out');
    const stateFile = path.join(root, 'candidate-state.json');
    const captured = captureCandidateState(outDir, 'linux', 'x64', stateFile, {
      ...cleanSourceDependencies(),
      captureNonce: 'e'.repeat(64),
      releaseTrack: 'stable',
    });
    fs.mkdirSync(outDir, { recursive: true });
    const artifact = path.join(outDir, 'Wayland.deb');
    fs.writeFileSync(artifact, 'installer-one');
    expect(findInstallerArtifacts(outDir, 'linux')).toEqual([artifact]);
    const fresh = assertFreshInstaller(
      artifact,
      stateFile,
      captured.digest,
      'linux',
      'x64',
      'stable',
      cleanSourceDependencies()
    );
    expect(fresh.artifactDigest).toMatch(/^sha256:[a-f0-9]{64}$/);

    const postBuildState = path.join(root, 'post-build.json');
    const postBuild = captureCandidateState(outDir, 'linux', 'x64', postBuildState, {
      ...cleanSourceDependencies(),
      captureNonce: 'f'.repeat(64),
      releaseTrack: 'stable',
    });
    fs.utimesSync(artifact, new Date(), new Date());
    expect(() =>
      assertFreshInstaller(
        artifact,
        postBuildState,
        postBuild.digest,
        'linux',
        'x64',
        'stable',
        cleanSourceDependencies()
      )
    ).toThrow('stale installer output');
    fs.appendFileSync(artifact, 'installer-two');
    expect(
      assertFreshInstaller(
        artifact,
        postBuildState,
        postBuild.digest,
        'linux',
        'x64',
        'stable',
        cleanSourceDependencies()
      ).artifactDigest
    ).not.toBe(postBuild.state.artifacts[0].digest);
  });

  it('rejects deleted, rewritten-and-rehashed, replayed, and wrong-target candidate manifests', () => {
    const root = temporaryRoot();
    const outDir = path.join(root, 'out');
    const candidate = writeUnpackedTarget(outDir, 'linux', 'x64');
    const stateFile = path.join(root, 'candidate-state.json');
    const captured = captureCandidateState(outDir, 'linux', 'x64', stateFile, {
      ...cleanSourceDependencies(),
      captureNonce: 'c'.repeat(64),
      releaseTrack: 'stable',
    });
    fs.appendFileSync(path.join(candidate.resourceDir, 'app.asar'), ' rebuilt');

    const original = fs.readFileSync(stateFile);
    fs.rmSync(stateFile);
    expect(() =>
      assertFreshCandidate(candidate, stateFile, captured.digest, 'linux', 'x64', 'stable', cleanSourceDependencies())
    ).toThrow();

    const rewritten = JSON.parse(original.toString('utf8'));
    rewritten.candidates = [];
    const rewrittenBytes = Buffer.from(`${JSON.stringify(rewritten, null, 2)}\n`);
    const attackerDigest = `sha256:${crypto.createHash('sha256').update(rewrittenBytes).digest('hex')}`;
    expect(attackerDigest).not.toBe(captured.digest);
    fs.writeFileSync(stateFile, rewrittenBytes);
    expect(() =>
      assertFreshCandidate(candidate, stateFile, captured.digest, 'linux', 'x64', 'stable', cleanSourceDependencies())
    ).toThrow('candidate state digest mismatch');

    const currentFile = path.join(root, 'current-state.json');
    const current = captureCandidateState(outDir, 'linux', 'x64', currentFile, {
      ...cleanSourceDependencies(),
      captureNonce: 'd'.repeat(64),
      releaseTrack: 'stable',
    });
    fs.writeFileSync(currentFile, original);
    expect(() =>
      assertFreshCandidate(candidate, currentFile, current.digest, 'linux', 'x64', 'stable', cleanSourceDependencies())
    ).toThrow('candidate state digest mismatch');

    fs.writeFileSync(stateFile, original);
    expect(() =>
      assertFreshCandidate(candidate, stateFile, captured.digest, 'win32', 'x64', 'stable', cleanSourceDependencies())
    ).toThrow('wrong-target candidate state');
  });

  it('hashes confined framework symlinks but rejects dangling or escaping links', () => {
    const root = temporaryRoot();
    const candidate = writeUnpackedTarget(root, 'linux', 'x64');
    fs.writeFileSync(path.join(candidate.appDir, 'real-helper'), 'helper');
    fs.symlinkSync('real-helper', path.join(candidate.appDir, 'linked-helper'));
    expect(candidateContentDigest(candidate)).toMatch(/^sha256:/);
    expect(resolveInstalledCandidate(root, 'linux', 'x64', 'stable')).toMatchObject({
      appDir: fs.realpathSync(candidate.appDir),
    });

    // The escaping target has to be a file that really exists outside the install root on
    // every host: a POSIX-only path like /etc/passwd is merely dangling on Windows, so
    // realpathSync fails with ENOENT before the confinement check can report the escape.
    const foreignRoot = temporaryRoot();
    const foreignPayload = path.join(foreignRoot, 'foreign-helper');
    fs.writeFileSync(foreignPayload, 'foreign');
    fs.unlinkSync(path.join(candidate.appDir, 'linked-helper'));
    fs.symlinkSync(foreignPayload, path.join(candidate.appDir, 'linked-helper'), 'file');
    expect(() => candidateContentDigest(candidate)).toThrow('escapes its private installation root');
    expect(() => resolveInstalledCandidate(root, 'linux', 'x64', 'stable')).toThrow(
      'escapes its private installation root'
    );
  });

  it('redacts the package marker from top-level and nested URL evidence', () => {
    const marker = 'a'.repeat(64);
    const nested = `https://example.test/result?waylandSmokeMarker=${marker}`;
    const raw = `file:///tmp/index.html?waylandSmokeMarker=${marker}&next=${encodeURIComponent(nested)}`;
    const redacted = redactSmokeMarkerFromUrl(raw, marker);
    expect(redacted).not.toContain(marker);
    expect(redacted).not.toContain('waylandSmokeMarker');
    expect(redacted).toContain('next=');
  });

  it('reports available and unavailable optional capabilities without inventing a third state', () => {
    expect(
      parseOptionalCapabilityStates(`
        OK hub
        WARN whatsapp-bridge (optional, missing or empty)
        OK signal-cli-runtime
      `)
    ).toEqual({ hub: 'available', 'whatsapp-bridge': 'unavailable', 'signal-cli-runtime': 'available' });
    expect(() => parseOptionalCapabilityStates('OK hub\nOK whatsapp-bridge')).toThrow('signal-cli-runtime');
    expect(() => parseOptionalCapabilityStates('OK hub\nWARN hub\nOK whatsapp-bridge\nOK signal-cli-runtime')).toThrow(
      'hub'
    );
  });

  it('uses xvfb for headless Linux and never masks another target behind it', () => {
    expect(launchCommand('/tmp/wayland', 'linux', {})).toEqual({
      command: 'xvfb-run',
      args: ['-a', '/tmp/wayland', '--no-sandbox'],
      sandboxMode: 'smoke-only-disabled',
    });
    expect(launchCommand('/tmp/wayland', 'linux', { DISPLAY: ':99' })).toEqual({
      command: '/tmp/wayland',
      args: ['--no-sandbox'],
      sandboxMode: 'smoke-only-disabled',
    });
    expect(launchCommand('C:\\Wayland.exe', 'win32', {})).toEqual({
      command: 'C:\\Wayland.exe',
      args: [],
      sandboxMode: 'production-default',
    });
  });

  it('requires selected-candidate path, unguessable marker, usable shell, and no fatal fallback', () => {
    const expected = {
      rendererPath: path.resolve('/opt/Wayland/resources/app.asar/out/renderer/index.html'),
      smokeMarker: 'a'.repeat(64),
      releaseIdentity: expectedReleaseIdentity('stable', 'linux', 'x64'),
    };
    const ready = {
      readyState: 'complete',
      title: 'Wayland',
      url: `${pathToFileURL(expected.rendererPath).href}?waylandSmokeMarker=${expected.smokeMarker}`,
      bodyChildren: 1,
      rootChildren: 1,
      smokeMarker: expected.smokeMarker,
      shellExperience: 'classic',
      releaseIdentity: expected.releaseIdentity,
      recoveryFallback: false,
      fatalErrorBoundary: false,
    };
    expect(isReadyRendererState(ready, expected)).toBe(true);
    expect(isReadyRendererState({ ...ready, url: 'chrome-error://chromewebdata/' }, expected)).toBe(false);
    expect(isReadyRendererState({ ...ready, rootChildren: 0 }, expected)).toBe(false);
    expect(isReadyRendererState({ ...ready, url: 'file:///tmp/other/index.html' }, expected)).toBe(false);
    expect(isReadyRendererState({ ...ready, smokeMarker: 'b'.repeat(64) }, expected)).toBe(false);
    expect(isReadyRendererState({ ...ready, shellExperience: null }, expected)).toBe(false);
    expect(isReadyRendererState({ ...ready, recoveryFallback: true }, expected)).toBe(false);
    expect(isReadyRendererState({ ...ready, fatalErrorBoundary: true }, expected)).toBe(false);
  });
});

describe('real installer extraction and lifecycle evidence', () => {
  it('fails closed unless exactly one real installer artifact is available', () => {
    const root = temporaryRoot();
    const options = {
      outDir: root,
      targetPlatform: 'linux',
      targetArch: 'x64',
      candidateStateFile: path.join(root, 'state.json'),
      candidateStateDigest: `sha256:${'a'.repeat(64)}`,
      releaseTrack: 'stable',
    };
    expect(() => prepareInstalledCandidate(options)).toThrow('installer artifact, found 0');
    fs.writeFileSync(path.join(root, 'one.deb'), 'one');
    fs.writeFileSync(path.join(root, 'two.deb'), 'two');
    expect(() => prepareInstalledCandidate(options)).toThrow('installer artifact, found 2');
  });

  it('rejects an installer that extracts to stale pre-build application content', () => {
    const root = temporaryRoot();
    const outDir = path.join(root, 'out');
    const staleCandidate = writeUnpackedTarget(outDir, 'linux', 'x64');
    const stateFile = path.join(root, 'candidate-state.json');
    const captured = captureCandidateState(outDir, 'linux', 'x64', stateFile, {
      ...cleanSourceDependencies(),
      captureNonce: '9'.repeat(64),
      releaseTrack: 'stable',
    });
    const artifactPath = path.join(outDir, 'Wayland-fresh.deb');
    fs.writeFileSync(artifactPath, 'new installer bytes');
    const privateRoot = path.join(root, 'private');
    expect(() =>
      prepareInstalledCandidate(
        {
          outDir,
          targetPlatform: 'linux',
          targetArch: 'x64',
          releaseTrack: 'stable',
          candidateStateFile: stateFile,
          candidateStateDigest: captured.digest,
        },
        {
          ...cleanSourceDependencies(),
          createPrivateRoot: () => {
            fs.mkdirSync(privateRoot);
            return privateRoot;
          },
          installArtifactSnapshot: () => staleCandidate,
        }
      )
    ).toThrow('stale packaged output');
    expect(fs.existsSync(privateRoot)).toBe(false);
  });

  it.each([
    ['linux', 'dpkg-deb', ['-x', '/snapshot/installer.deb']],
    ['win32', '/snapshot/installer.exe', ['/S']],
  ] as const)(
    'invokes the native %s installer path before resolving the installed candidate',
    (platform, command, args) => {
      const root = temporaryRoot();
      const installRoot = path.join(root, 'installed');
      const candidate = {
        appDir: installRoot,
        resourceDir: path.join(installRoot, 'resources'),
        executablePath: 'app',
      };
      const execute = vi.fn(() => '');
      const resolve = vi.fn(() => candidate);
      const snapshot = `/snapshot/installer.${platform === 'linux' ? 'deb' : 'exe'}`;
      expect(
        installArtifactSnapshot(snapshot, platform, 'x64', installRoot, {
          execFileSync: execute,
          resolveInstalledCandidate: resolve,
          releaseTrack: 'stable',
        })
      ).toBe(candidate);
      expect(execute.mock.calls[0][0]).toBe(command);
      for (const argument of args) expect(execute.mock.calls[0][1]).toContain(argument);
      if (platform === 'win32') expect(execute.mock.calls[0][1]).toContain(`/D=${installRoot}`);
      expect(resolve).toHaveBeenCalledWith(installRoot, platform, 'x64', 'stable');
    }
  );

  it('gives the Windows silent install a budget that survives x86 emulation on ARM64', () => {
    const root = temporaryRoot();
    const installRoot = path.join(root, 'installed');
    const candidate = {
      appDir: installRoot,
      resourceDir: path.join(installRoot, 'resources'),
      executablePath: 'app',
    };
    const execute = vi.fn(() => '');
    installArtifactSnapshot('/snapshot/installer.exe', 'win32', 'arm64', installRoot, {
      execFileSync: execute,
      resolveInstalledCandidate: vi.fn(() => candidate),
      releaseTrack: 'stable',
    });
    // NSIS ships only an x86 stub, so win32-arm64 extracts the payload under
    // emulation. 120s expired on every arm64 release attempt; the budget must
    // stay well clear of it.
    const options = execute.mock.calls[0][2] as { timeout: number };
    expect(options.timeout).toBeGreaterThanOrEqual(600_000);
  });

  it('reports a timed-out Windows install as a budget overrun, not a bare ETIMEDOUT', () => {
    const root = temporaryRoot();
    const installRoot = path.join(root, 'installed');
    const timedOut = Object.assign(new Error('spawnSync installer.exe ETIMEDOUT'), { code: 'ETIMEDOUT' });
    const execute = vi.fn(() => {
      throw timedOut;
    });
    expect(() =>
      installArtifactSnapshot('/snapshot/installer.exe', 'win32', 'arm64', installRoot, {
        execFileSync: execute,
        resolveInstalledCandidate: vi.fn(),
        releaseTrack: 'stable',
      })
    ).toThrow(/did not finish within/);
  });

  it('mounts a DMG read-only, copies its application into private storage, and detaches it', () => {
    const root = temporaryRoot();
    const mount = path.join(root, 'mount');
    const installRoot = path.join(root, 'installed');
    fs.mkdirSync(path.join(mount, 'Wayland.app'), { recursive: true });
    const candidate = {
      appDir: path.join(installRoot, 'Wayland.app'),
      resourceDir: 'resources',
      executablePath: 'app',
    };
    const execute = vi.fn((command: string, args: string[]) => {
      if (command === 'hdiutil' && args[0] === 'attach') {
        return `<plist><dict><key>mount-point</key><string>${mount}</string></dict></plist>`;
      }
      return '';
    });
    const resolve = vi.fn(() => candidate);
    expect(
      installArtifactSnapshot('/snapshot/installer.dmg', 'darwin', 'arm64', installRoot, {
        execFileSync: execute,
        resolveInstalledCandidate: resolve,
        createDmgMountRoot: () => mount,
        releaseTrack: 'stable',
      })
    ).toBe(candidate);
    expect(execute).toHaveBeenCalledWith(
      'hdiutil',
      ['attach', '/snapshot/installer.dmg', '-nobrowse', '-readonly', '-noverify', '-mountpoint', mount, '-plist'],
      { encoding: 'utf8' }
    );
    expect(execute).toHaveBeenCalledWith(
      'ditto',
      [path.join(mount, 'Wayland.app'), path.join(installRoot, 'Wayland.app')],
      { stdio: 'pipe' }
    );
    expect(execute).toHaveBeenCalledWith('hdiutil', ['detach', mount, '-force'], { stdio: 'pipe' });
  });

  it('detaches a DMG once by device authority without double-detaching mount aliases', () => {
    const root = temporaryRoot();
    const requestedMount = path.join(root, 'requested-mount');
    const reportedMount = path.join(root, 'reported-mount');
    const installRoot = path.join(root, 'installed');
    fs.mkdirSync(requestedMount, { recursive: true });
    fs.mkdirSync(reportedMount, { recursive: true });
    const detachAttempts: string[] = [];
    const execute = vi.fn((command: string, args: string[]) => {
      if (command === 'hdiutil' && args[0] === 'attach') {
        return `<plist><dict><key>dev-entry</key><string>/dev/disk-test</string><key>mount-point</key><string>${reportedMount}</string></dict></plist>`;
      }
      if (command === 'hdiutil' && args[0] === 'detach') {
        detachAttempts.push(args[1]);
      }
      return '';
    });
    expect(() =>
      installArtifactSnapshot('/snapshot/installer.dmg', 'darwin', 'arm64', installRoot, {
        execFileSync: execute,
        createDmgMountRoot: () => requestedMount,
        resolveInstalledCandidate: vi.fn(),
        releaseTrack: 'stable',
      })
    ).toThrow('DMG must expose exactly one application bundle');
    expect(detachAttempts).toEqual(['/dev/disk-test']);
  });

  it('attempts cleanup at the private mountpoint even when hdiutil attach throws', () => {
    const root = temporaryRoot();
    const mount = path.join(root, 'partial-mount');
    const installRoot = path.join(root, 'installed');
    fs.mkdirSync(mount);
    const execute = vi.fn((command: string, args: string[]) => {
      if (command === 'hdiutil' && args[0] === 'attach') throw new Error('attach failed after partial mount');
      return '';
    });
    expect(() =>
      installArtifactSnapshot('/snapshot/installer.dmg', 'darwin', 'arm64', installRoot, {
        execFileSync: execute,
        createDmgMountRoot: () => mount,
        resolveInstalledCandidate: vi.fn(),
        releaseTrack: 'stable',
      })
    ).toThrow('attach failed after partial mount');
    expect(execute).toHaveBeenCalledWith('hdiutil', ['detach', mount, '-force'], { stdio: 'pipe' });
  });

  it('resolves exactly one native installed payload and rejects symlink escapes', () => {
    const root = temporaryRoot();
    const candidate = writeUnpackedTarget(root, 'linux', 'x64');
    expect(resolveInstalledCandidate(root, 'linux', 'x64', 'stable').executablePath).toBe(
      fs.realpathSync(candidate.executablePath)
    );
    const outside = temporaryRoot();
    fs.writeFileSync(path.join(outside, 'secret'), 'outside');
    fs.symlinkSync(path.join(outside, 'secret'), path.join(candidate.appDir, 'escape'));
    expect(() => resolveInstalledCandidate(root, 'linux', 'x64', 'stable')).toThrow(
      'escapes its private installation root'
    );
  });

  it('fails readiness immediately for signal-terminated children and rejects occupied CDP ports', async () => {
    const child = makeFakeChild();
    child.signalCode = 'SIGKILL';
    await expect(
      waitForRendererReady(43123, 1_000, child, {
        rendererPath: '/tmp/index.html',
        smokeMarker: 'a'.repeat(64),
        releaseIdentity: expectedReleaseIdentity('stable', 'linux', 'x64'),
      })
    ).rejects.toThrow('SIGKILL');
    await expect(
      assertPortVacant(
        43123,
        vi.fn(async () => ({ Browser: 'foreign' }))
      )
    ).rejects.toThrow('already occupied');
    await expect(
      assertPortVacant(
        43123,
        vi.fn(async () => Promise.reject(new Error('vacant')))
      )
    ).resolves.toBeUndefined();
  });

  it('requires an ordered failure-free event ledger and zero same-identity surviving descendants', () => {
    const marker = 'a'.repeat(64);
    const expectedMarkerSha256 = `sha256:${crypto.createHash('sha256').update(marker).digest('hex')}`;
    const releaseIdentity = expectedReleaseIdentity('stable', 'linux', 'x64');
    const events = validSmokeEvents(marker, releaseIdentity);
    const descendantRecords = [{ pid: 12, parentPid: 1, identity: 'boot-1\0wayland-helper' }];
    expect(
      verifyShutdownEvidence({
        events,
        expectedMarkerSha256,
        releaseIdentity,
        shutdown: { code: 0, signal: null },
        descendantRecords,
        targetPlatform: 'linux',
        processRecordAlive: () => false,
      })
    ).toEqual({
      parentExit: 'zero',
      subsystemCleanup: 'completed-with-structured-proof',
      eventEvidence: {
        contract: 'wayland-package-smoke-event/1',
        eventCount: 7,
        terminalSequence: 7,
      },
      descendantsObserved: 1,
      descendantsRemaining: 0,
    });
    expect(() =>
      verifyShutdownEvidence({
        events: [],
        expectedMarkerSha256,
        releaseIdentity,
        shutdown: { code: 0, signal: null },
        descendantRecords: [],
        targetPlatform: 'linux',
        processRecordAlive: () => false,
      })
    ).toThrow('event ledger is empty');
    expect(() =>
      verifyShutdownEvidence({
        events: [
          ...events.slice(0, 4),
          {
            contract: 'wayland-package-smoke-event/1',
            seq: 5,
            markerSha256: expectedMarkerSha256,
            type: 'cleanup-failed',
          },
          ...events.slice(4).map((event, index) => Object.assign({}, event, { seq: index + 6 })),
        ],
        expectedMarkerSha256,
        releaseIdentity,
        shutdown: { code: 0, signal: null },
        descendantRecords: [],
        targetPlatform: 'linux',
        processRecordAlive: () => false,
      })
    ).toThrow('reported fatal event: cleanup-failed');
    expect(() =>
      verifyShutdownEvidence({
        events,
        expectedMarkerSha256,
        releaseIdentity,
        shutdown: { code: 0, signal: null },
        descendantRecords,
        targetPlatform: 'linux',
        processRecordAlive: () => true,
      })
    ).toThrow('left descendant processes alive');
  });

  // The release gate was a coin flip because the settle before the assertion
  // above was a FLAT 250ms and Windows reaps Electron's helpers asynchronously.
  // Across five release legs the app quit cleanly and EXACTLY FOUR descendants
  // were still alive at that instant, on both Windows arches. `drainDescendants`
  // waits for them; it must NOT become a way to pass with a real leak, so the
  // third case below pins that it gives up at the deadline and hands the
  // survivors to the (unchanged) assertion.
  describe('drainDescendants', () => {
    const rec = (pid: number) => ({ pid, identity: `id-${pid}` });

    it('returns immediately when nothing is alive', async () => {
      const alive = vi.fn(() => false);
      const started = Date.now();
      await drainDescendants([rec(1), rec(2)], 'win32', {
        processRecordAlive: alive,
        shutdownDrainMs: 5_000,
        shutdownDrainPollMs: 50,
      });
      expect(Date.now() - started).toBeLessThan(200);
      expect(alive).toHaveBeenCalled();
    });

    it('POLLS - it waits while they are alive and returns once they exit', async () => {
      let calls = 0;
      // Alive for the first two sweeps, gone on the third. A plain sleep would
      // not observe the transition, so this is what proves it polls.
      const alive = vi.fn(() => {
        calls += 1;
        return calls <= 2;
      });
      await drainDescendants([rec(7)], 'win32', {
        processRecordAlive: alive,
        shutdownDrainMs: 5_000,
        shutdownDrainPollMs: 10,
      });
      expect(calls).toBeGreaterThanOrEqual(3);
    });

    it('gives up at the deadline so a REAL leak still reaches the assertion', async () => {
      const alive = vi.fn(() => true); // never exits
      const started = Date.now();
      await drainDescendants([rec(99)], 'win32', {
        processRecordAlive: alive,
        shutdownDrainMs: 120,
        shutdownDrainPollMs: 10,
      });
      expect(Date.now() - started).toBeGreaterThanOrEqual(100);
      // It returns rather than throwing: verifyShutdownEvidence stays the single
      // authoritative reporter of survivors.
      expect(() =>
        verifyShutdownEvidence({
          events: validSmokeEvents('c'.repeat(64), expectedReleaseIdentity('stable', 'linux', 'x64')),
          expectedMarkerSha256: `sha256:${crypto.createHash('sha256').update('c'.repeat(64)).digest('hex')}`,
          releaseIdentity: expectedReleaseIdentity('stable', 'linux', 'x64'),
          shutdown: { code: 0, signal: null },
          descendantRecords: [rec(99)],
          targetPlatform: 'linux',
          processRecordAlive: () => true,
        })
      ).toThrow(/left descendant processes alive[\s\S]*pid=99/);
    });
  });

  it('fails closed on gaps, unknown events, runtime identity drift, and renderer recovery', () => {
    const marker = 'b'.repeat(64);
    const markerSha = `sha256:${crypto.createHash('sha256').update(marker).digest('hex')}`;
    const identity = expectedReleaseIdentity('stable', 'linux', 'x64');
    const valid = validSmokeEvents(marker, identity);
    expect(() =>
      verifyPackageSmokeEventLedger(
        valid.filter((event) => event.seq !== 3),
        markerSha,
        identity
      )
    ).toThrow('discontinuous');
    expect(() =>
      verifyPackageSmokeEventLedger(
        valid.map((event) => (event.seq === 3 ? { ...event, type: 'invented-green' } : event)),
        markerSha,
        identity
      )
    ).toThrow('unknown');
    expect(() =>
      verifyPackageSmokeEventLedger(valid, markerSha, expectedReleaseIdentity('preview', 'linux', 'x64'))
    ).toThrow('release identity mismatch');
    const recovered = [
      ...valid.slice(0, 2),
      { ...valid[2], type: 'renderer-recovery-attempt' },
      ...valid.slice(2).map((event, index) => Object.assign({}, event, { seq: index + 4 })),
    ];
    expect(() => verifyPackageSmokeEventLedger(recovered, markerSha, identity)).toThrow(
      'reported fatal event: renderer-recovery-attempt'
    );
  });

  it('distinguishes a reused PID from the originally observed process identity', () => {
    const marker = 'c'.repeat(64);
    const markerSha = `sha256:${crypto.createHash('sha256').update(marker).digest('hex')}`;
    const identity = expectedReleaseIdentity('stable', 'linux', 'x64');
    const original = { pid: 99, parentPid: 1, identity: 'boot-a\0wayland-helper' };
    const base = {
      events: validSmokeEvents(marker, identity),
      expectedMarkerSha256: markerSha,
      releaseIdentity: identity,
      shutdown: { code: 0, signal: null },
      descendantRecords: [original],
      targetPlatform: 'linux',
    };
    expect(
      verifyShutdownEvidence({
        ...base,
        processRecordAlive: (record: typeof original) => record.identity === 'boot-b\0unrelated-process',
      }).descendantsRemaining
    ).toBe(0);
    // REPOINTED, NOT RELAXED. This used to assert the bare-pid message
    // ('...alive: 99'). A pid alone is unusable after the fact - the process is
    // gone by the time anyone reads CI - and that cost three sessions of guessing
    // at five real failures. The assertion is now STRICTER: it must still name
    // the pid, and must additionally carry the executable and how the record was
    // matched, so the next occurrence is diagnosed from the log itself.
    const thrown = (() => {
      try {
        verifyShutdownEvidence({ ...base, processRecordAlive: () => true });
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    })();
    expect(thrown).toContain('left descendant processes alive');
    expect(thrown).toContain('pid=99');
    expect(thrown).toContain('exe=wayland-helper');
    expect(thrown).toContain('started=boot-a');
    expect(thrown).toContain('matchedBy=');
  });

  it('does not mistake a post-kill PID reuse for a surviving descendant', async () => {
    const originalLine = '99 8123 Mon Jul 18 20:00:00 2026 /opt/Wayland/wayland-helper';
    const reusedLine = '99 1 Mon Jul 18 20:00:01 2026 /usr/bin/unrelated';
    const snapshots = [`${originalLine}\n`, `${reusedLine}\n`];
    const child = makeFakeChild();
    const processKill = vi.fn();
    await expect(
      terminateProcessTree(
        child,
        'linux',
        {
          execFileSync: vi.fn(() => snapshots.shift() || `${reusedLine}\n`),
          processKill,
          treeKillSettleMs: 0,
        },
        []
      )
    ).resolves.toMatchObject([{ pid: 99, parentPid: 8123 }]);
    expect(processKill).toHaveBeenCalledWith(-child.pid, 'SIGKILL');

    const survivingSnapshots = [`${originalLine}\n`, `${originalLine}\n`];
    await expect(
      terminateProcessTree(makeFakeChild(), 'linux', {
        execFileSync: vi.fn(() => survivingSnapshots.shift() || `${originalLine}\n`),
        processKill: vi.fn(),
        treeKillSettleMs: 0,
      })
    ).rejects.toThrow('could not terminate packaged process tree: 99');
  });

  it('discovers a launch-token child after immediate setsid and reparenting', () => {
    const token = 'tree-token-not-user-controlled';
    const reparented = `99 1 Mon Jul 18 20:00:00 2026 /opt/Wayland/wayland-core WAYLAND_PROCESS_TREE_ID=${token}\n`;
    const execFileSync = vi.fn((_command: string, args: string[]) => (args[0] === 'eww' ? reparented : ''));
    const monitor = createProcessMonitor(8123, 'linux', {
      execFileSync,
      processScopeTokens: [token],
      processMonitorIntervalMs: 60_000,
    });
    expect(monitor.stop()).toEqual([
      expect.objectContaining({
        pid: 99,
        parentPid: 1,
        identity: 'Mon Jul 18 20:00:00 2026\0/opt/Wayland/wayland-core',
        scopeText: expect.stringContaining(token),
      }),
    ]);
    expect(execFileSync).toHaveBeenCalledWith(
      'ps',
      ['eww', '-axo', 'pid=,ppid=,lstart=,command='],
      expect.objectContaining({ maxBuffer: 64 * 1024 * 1024 })
    );
  });

  it('records HOW each descendant was matched, so a survivor is not ambiguous', () => {
    // A record reaches the monitor two ways, and they mean different things when
    // one survives: `ancestry` proves the app orphaned it, `scope` can capture a
    // process that was never ours. Five real failures could not be told apart
    // because the survivor message carried neither.
    const token = 'scope-token-not-user-controlled';
    const childOfRoot = '101 8123 Mon Jul 18 20:00:00 2026 /opt/Wayland/wayland-core';
    const strangerWithToken = `202 1 Mon Jul 18 20:00:01 2026 /usr/bin/unrelated --dir=${token}`;
    const bothWays = `303 8123 Mon Jul 18 20:00:02 2026 /opt/Wayland/helper --dir=${token}`;
    const execFileSync = vi.fn(() => `${childOfRoot}\n${strangerWithToken}\n${bothWays}\n`);
    const monitor = createProcessMonitor(8123, 'linux', {
      execFileSync,
      processScopeTokens: [token],
      processMonitorIntervalMs: 60_000,
    });
    const byPid = new Map(monitor.stop().map((record) => [record.pid, record.matchedBy]));
    expect(byPid.get(101)).toBe('ancestry');
    expect(byPid.get(202)).toBe('scope');
    expect(byPid.get(303)).toBe('ancestry+scope');
  });

  it('renders the fields a reader needs and NEVER publishes command-line arguments', () => {
    // This repo is public, so CI logs are public. A Windows command line can
    // carry API keys, and it carries the smoke marker by construction (scope
    // matching searches command lines for it). Only Chromium role flags escape.
    const secret = 'sk-live-DEADBEEFdeadbeef0123456789abcdefTOPSECRET';
    const rendered = describeProcessRecord({
      pid: 6780,
      parentPid: 4242,
      identity: 'Wed Sep 3 08:00:00 2026\0C:\\Program Files\\Wayland\\Wayland.exe',
      matchedBy: 'scope',
      exePath: 'C:\\Program Files\\Wayland\\Wayland.exe',
      commandLine: `Wayland.exe --type=utility --utility-sub-type=network.mojom.NetworkService --api-key=${secret}`,
    });
    expect(rendered).toContain('pid=6780');
    expect(rendered).toContain('ppid=4242');
    expect(rendered).toContain('matchedBy=scope');
    expect(rendered).toContain('started=Wed Sep 3 08:00:00 2026');
    expect(rendered).toContain('exe=C:\\Program Files\\Wayland\\Wayland.exe');
    // The role is what identifies the process...
    expect(rendered).toContain('role=utility:network.mojom.NetworkService');
    // ...and nothing else from the command line survives.
    expect(rendered).not.toContain(secret);
    expect(rendered).not.toContain('--api-key');
  });

  it('reduces each Chromium role to a non-secret token, and reports none when absent', () => {
    expect(chromiumRoleFromCommandLine('Wayland.exe --type=gpu-process --foo')).toBe('gpu-process');
    expect(chromiumRoleFromCommandLine('Wayland.exe --type=renderer')).toBe('renderer');
    expect(chromiumRoleFromCommandLine('crashpad_handler.exe --type=crashpad-handler')).toBe('crashpad-handler');
    expect(chromiumRoleFromCommandLine('wayland-core.exe --json-stream')).toBe('<none>');
    expect(chromiumRoleFromCommandLine(undefined)).toBe('<none>');
  });

  it('bounds the descendant inventory so a huge population cannot bury the survivors', () => {
    const rec = (pid: number) => ({
      pid,
      parentPid: 1,
      identity: `boot\0/usr/bin/probe-${pid}`,
      matchedBy: 'scope',
    });
    expect(formatDescendantInventory([])).toContain('observed 0 descendant record(s)');
    const many = formatDescendantInventory(
      Array.from({ length: 250 }, (_, index) => rec(index + 1)),
      60
    );
    expect(many).toContain('observed 250 descendant record(s)');
    expect(many).toContain('pid=1 ');
    expect(many).toContain('…and 190 more record(s) not shown');
    // 60 shown + header + the elision line, never all 250.
    expect(many.split('\n')).toHaveLength(62);
    expect(many).not.toContain('probe-250');
  });

  it('redacts a token-shaped run from an executable path before it reaches a public log', () => {
    const marker = 'a'.repeat(64);
    expect(redactHighEntropyRuns(`C:\\Temp\\wayland-smoke-${marker}\\Wayland.exe`)).not.toContain(marker);
    expect(redactHighEntropyRuns(`C:\\Temp\\wayland-smoke-${marker}\\Wayland.exe`)).toContain('<redacted>');
    expect(redactHighEntropyRuns('C:\\Program Files\\Wayland\\Wayland.exe')).toBe(
      'C:\\Program Files\\Wayland\\Wayland.exe'
    );
  });

  it('individually reaps an observed POSIX child that escaped the root process group', async () => {
    const child = makeFakeChild();
    const original = '99 1 Mon Jul 18 20:00:00 2026 /opt/Wayland/wayland-core';
    let alive = true;
    const processKill = vi.fn((pid: number) => {
      if (pid === 99) alive = false;
    });
    const execFileSync = vi.fn(() => (alive ? `${original}\n` : ''));
    await expect(
      terminateProcessTree(child, 'linux', { execFileSync, processKill, treeKillSettleMs: 0 }, [
        { pid: 99, parentPid: 1, identity: `Mon Jul 18 20:00:00 2026\0/opt/Wayland/wayland-core` },
      ])
    ).resolves.toHaveLength(1);
    expect(processKill).toHaveBeenCalledWith(-child.pid, 'SIGKILL');
    expect(processKill).toHaveBeenCalledWith(99, 'SIGKILL');
  });
});

describe('runSmoke hostile orchestration', () => {
  it('rejects a host architecture that cannot execute the target package', async () => {
    const harness = smokeHarness();
    await expect(runSmoke(harness.options, { ...harness.dependencies, hostArch: 'arm64' })).rejects.toThrow(
      'target linux-x64 cannot be boot-tested on host linux-arm64'
    );
    expect(harness.dependencies.spawn).not.toHaveBeenCalled();
  });

  it('binds a successful verifier, content identity, renderer readiness, capabilities, and clean exit', async () => {
    const harness = smokeHarness();
    const report = await runSmoke(harness.options, harness.dependencies);
    expect(harness.dependencies.prepareInstalledCandidate).toHaveBeenCalledOnce();
    expect(harness.verify).toHaveBeenCalledOnce();
    expect(report.criticalResources).toBe('verified');
    expect(report.installerDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(report.verifiedCandidateDigest).toBe(harness.installed.installedDigest);
    expect(report.optionalCapabilities).toEqual({
      hub: 'available',
      'whatsapp-bridge': 'unavailable',
      'signal-cli-runtime': 'available',
    });
    expect(report.electron).toMatchObject({ booted: true, rendererReady: true, readyState: 'complete' });
    expect(report.installedExecutable).not.toContain('out');
    expect(report.releaseIdentity).toEqual(expectedReleaseIdentity('stable', 'linux', 'x64'));
    expect(report.sandboxMode).toBe('smoke-only-disabled');
    expect(report.shutdown).toMatchObject({ parentExit: 'zero', descendantsRemaining: 0 });
    const spawnOptions = harness.dependencies.spawn.mock.calls[0][2];
    expect(spawnOptions.env.WAYLAND_PACKAGE_SMOKE_MARKER).toMatch(/^[a-f0-9]{64}$/);
    expect(harness.child.kill).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(harness.root, 'user-data'))).toBe(false);
    expect(fs.existsSync(path.join(harness.root, 'out', 'platform-package-smoke-linux-x64.json'))).toBe(true);
  });

  it('rejects a stable payload when the requested runtime track is preview', async () => {
    const harness = smokeHarness();
    harness.options.releaseTrack = 'preview';
    await expect(runSmoke(harness.options, harness.dependencies)).rejects.toThrow(
      'installed candidate does not match the requested release identity'
    );
    expect(harness.dependencies.spawn).not.toHaveBeenCalled();
  });

  it('removes isolated state when spawn throws synchronously', async () => {
    const harness = smokeHarness();
    harness.dependencies.spawn = vi.fn(() => {
      throw new Error('spawn exploded synchronously');
    });
    await expect(runSmoke(harness.options, harness.dependencies)).rejects.toThrow('spawn exploded synchronously');
    expect(fs.existsSync(path.join(harness.root, 'user-data'))).toBe(false);
  });

  it('keeps structured failure authority after diagnostic output exceeds the ring buffer', async () => {
    const harness = smokeHarness();
    harness.dependencies.cdpCommand = vi.fn(async () => {
      harness.child.stderr.write(`old fatal line cleanup failed${'x'.repeat(70_000)}`);
      harness.child.exitCode = 0;
      harness.child.emit('exit', 0, null);
      return {};
    });
    harness.dependencies.readPackageSmokeEventLedger = vi.fn(() => {
      const marker = harness.dependencies.spawn.mock.calls[0][2].env.WAYLAND_PACKAGE_SMOKE_MARKER;
      const events = validSmokeEvents(marker);
      return [
        ...events.slice(0, 4),
        { ...events[4], type: 'cleanup-failed' },
        ...events.slice(4).map((event, index) => Object.assign({}, event, { seq: index + 6 })),
      ];
    });
    await expect(runSmoke(harness.options, harness.dependencies)).rejects.toThrow(
      'reported fatal event: cleanup-failed'
    );
  });

  it('never launches after a critical verifier failure or an evidence-free verifier bypass', async () => {
    const failed = smokeHarness();
    failed.dependencies.verifyPackagedResources = vi.fn(() => {
      throw new Error('critical bundle invalid');
    });
    await expect(runSmoke(failed.options, failed.dependencies)).rejects.toThrow('critical bundle invalid');
    expect(failed.dependencies.spawn).not.toHaveBeenCalled();

    const bypassed = smokeHarness();
    bypassed.dependencies.verifyPackagedResources = vi.fn(() => ({ resourceDirs: [bypassed.candidate.resourceDir] }));
    await expect(runSmoke(bypassed.options, bypassed.dependencies)).rejects.toThrow('did not report one honest state');
    expect(bypassed.dependencies.spawn).not.toHaveBeenCalled();

    const noCriticalProof = smokeHarness();
    noCriticalProof.dependencies.verifyPackagedResources = vi.fn(
      ({ logger }: { logger: { log: (line: string) => void } }) => {
        logger.log('OK hub');
        logger.log('OK whatsapp-bridge');
        logger.log('OK signal-cli-runtime');
        return undefined;
      }
    );
    await expect(runSmoke(noCriticalProof.options, noCriticalProof.dependencies)).rejects.toThrow(
      'critical resource verifier returned no proof'
    );
    expect(noCriticalProof.dependencies.spawn).not.toHaveBeenCalled();
  });

  it('rejects candidate mutation after verification or while the app is running', async () => {
    const beforeLaunch = smokeHarness();
    beforeLaunch.dependencies.verifyPackagedResources = vi.fn(
      ({ logger }: { logger: { log: (line: string) => void } }) => {
        logger.log('OK hub');
        logger.log('OK whatsapp-bridge');
        logger.log('OK signal-cli-runtime');
        fs.appendFileSync(path.join(beforeLaunch.candidate.resourceDir, 'app.asar'), ' verifier mutation');
        return { resourceDirs: [beforeLaunch.candidate.resourceDir] };
      }
    );
    await expect(runSmoke(beforeLaunch.options, beforeLaunch.dependencies)).rejects.toThrow(
      'changed after verification and before launch'
    );
    expect(beforeLaunch.dependencies.spawn).not.toHaveBeenCalled();

    const duringRun = smokeHarness();
    duringRun.dependencies.cdpCommand = vi.fn(async () => {
      fs.appendFileSync(path.join(duringRun.candidate.resourceDir, 'app.asar'), ' runtime mutation');
      duringRun.child.stdout.write('[Wayland] will-quit - all cleanup should be complete\n');
      duringRun.child.stdout.write('[Wayland] quit (exitCode=0)\n');
      duringRun.child.exitCode = 0;
      duringRun.child.emit('exit', 0, null);
      return {};
    });
    await expect(runSmoke(duringRun.options, duringRun.dependencies)).rejects.toThrow(
      'changed while the smoke test was running'
    );
  });

  it('rejects false CDP readiness, kills the child, and preserves the primary failure through cleanup', async () => {
    const falseEvidence = smokeHarness();
    falseEvidence.dependencies.waitForRendererReady = vi.fn(async () => ({
      readyState: 'complete',
      title: 'Error',
      url: 'chrome-error://chromewebdata/',
      bodyChildren: 1,
    }));
    await expect(runSmoke(falseEvidence.options, falseEvidence.dependencies)).rejects.toThrow(
      'renderer readiness evidence failed validation'
    );
    expect(falseEvidence.child.kill).toHaveBeenCalledWith('SIGKILL');
    expect(falseEvidence.dependencies.terminateProcessTree).toHaveBeenCalledOnce();

    const harness = smokeHarness();
    harness.dependencies.waitForRendererReady = vi.fn(async () => {
      throw new Error('renderer remained loading');
    });
    const removeUserData = vi.fn(() => {
      throw new Error('cleanup also failed');
    });
    await expect(runSmoke(harness.options, { ...harness.dependencies, removeUserData })).rejects.toThrow(
      'renderer remained loading'
    );
    expect(harness.child.kill).toHaveBeenCalledWith('SIGKILL');
    expect(removeUserData).toHaveBeenCalledOnce();
  });

  it('rejects nonzero shutdown and a child that leaks after Browser.close', async () => {
    const nonzero = smokeHarness();
    nonzero.dependencies.cdpCommand = vi.fn(async () => {
      nonzero.child.exitCode = 7;
      nonzero.child.emit('exit', 7, null);
      return {};
    });
    await expect(runSmoke(nonzero.options, nonzero.dependencies)).rejects.toThrow('shutdown was not clean (7)');

    const leaked = smokeHarness();
    const waitForExit = vi.fn(async () => {
      throw new Error('packaged app did not shut down cleanly');
    });
    leaked.dependencies.cdpCommand = vi.fn(async () => ({}));
    await expect(runSmoke(leaked.options, { ...leaked.dependencies, waitForExit })).rejects.toThrow(
      'did not shut down cleanly'
    );
    expect(leaked.child.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('fails an otherwise green smoke when isolated-state cleanup fails', async () => {
    const harness = smokeHarness();
    await expect(
      runSmoke(harness.options, {
        ...harness.dependencies,
        removeUserData: vi.fn(() => {
          throw new Error('locked');
        }),
      })
    ).rejects.toThrow('could not remove isolated user-data directory');
  });
});

describe('platform workflows cannot silently skip installed-package smoke', () => {
  it('covers all build-matrix targets with exact target identity and a mandatory smoke step', () => {
    const config = workflow('build-matrix.yml');
    const job = config.jobs.build;
    // The ONLY permitted dependency is the receipts producer. Without it the
    // packaged build aborts on "WAYLAND_CAPABILITY_RECEIPTS_DIR is required for
    // an evidence-backed package build" and this whole gate is dead; with any
    // other `needs` (or any `if`) a leg could silently skip instead of failing.
    expect(job.needs).toBe('capability-acceptance');
    expect(job.if).toBeUndefined();
    const receiptsJob = config.jobs['capability-acceptance'];
    expect(receiptsJob.if).toBeUndefined();
    expect(receiptsJob.needs).toBeUndefined();
    expect(
      receiptsJob.steps!.find((step) => step.name === 'Generate structured exact capability acceptance receipts')!.run
    ).toContain('generateCapabilityAcceptanceReceipts.js');
    expect(
      receiptsJob.steps!.find((step) => step.name === 'Upload capability acceptance receipts')!.with![
        'if-no-files-found'
      ]
    ).toBe('error');
    expect(job.strategy!.matrix!.release_track).toEqual(['stable', 'preview']);
    expect(job.strategy!.matrix!.platform_target).toHaveLength(6);
    expect(job.strategy!.matrix!.include!.map((entry) => `${entry.target_platform}-${entry.arch}@${entry.os}`)).toEqual(
      [
        'darwin-arm64@macos-15',
        'darwin-x64@macos-15-intel',
        'win32-x64@windows-2022',
        'win32-arm64@windows-11-arm',
        'linux-x64@ubuntu-24.04',
        'linux-arm64@ubuntu-24.04-arm',
      ]
    );
    const steps = job.steps!;
    const capture = steps.find((step) => step.name === 'Capture pre-build packaged content state')!;
    const smoke = steps.find((step) => step.name === 'Install and smoke real package payload')!;
    const hostAssertion = steps.find((step) => step.name === 'Assert native runner identity')!;
    const upload = steps.find((step) => step.name === 'Upload artifacts')!;
    expect(steps.indexOf(hostAssertion)).toBeLessThan(steps.indexOf(capture));
    expect(steps.indexOf(capture)).toBeLessThan(steps.findIndex((step) => step.name === 'Run packaged build'));
    expect(capture.id).toBe('package-candidate-state');
    expect(capture.if).toBeUndefined();
    expect(capture.run).toContain('--github-output "$GITHUB_OUTPUT"');
    expect(capture.run).toContain('--release-track "$WAYLAND_RELEASE_TRACK"');
    expect(hostAssertion.if).toBeUndefined();
    expect(hostAssertion['continue-on-error']).toBeUndefined();
    expect(hostAssertion.run).toContain('process.arch !== process.env.TARGET_ARCH');
    expect(smoke.if).toBeUndefined();
    expect(smoke['continue-on-error']).toBeUndefined();
    expect(smoke.run).toContain('platform-package-smoke.mjs');
    expect(smoke.run).toContain('--candidate-state-file');
    expect(smoke.run).toContain('--release-track "$WAYLAND_RELEASE_TRACK"');
    expect(smoke.run).toContain(
      '--candidate-state-digest "${{ steps.package-candidate-state.outputs.candidate_state_digest }}"'
    );
    const download = steps.find((step) => step.name === 'Download exact capability acceptance authority')!;
    const exportReceipts = steps.find((step) => step.name === 'Export capability acceptance authority path')!;
    expect(download.with!.name).toBe('${{ needs.capability-acceptance.outputs.artifact-name }}');
    expect(download.with!.path).toBe('${{ runner.temp }}/capability-acceptance');
    // The exported path must be the same expression the artifact landed at, or
    // the seal reads an empty directory.
    expect(exportReceipts.env!.RECEIPTS_DIR).toBe(download.with!.path);
    expect(exportReceipts.run).toContain('WAYLAND_CAPABILITY_RECEIPTS_DIR=${RECEIPTS_DIR}');
    expect(steps.indexOf(exportReceipts)).toBeGreaterThan(steps.indexOf(download));
    expect(steps.indexOf(exportReceipts)).toBeLessThan(steps.findIndex((step) => step.name === 'Run packaged build'));
    // Packaged bundled-bun verification must run against the real payload
    // directory: the test's own fallback scans ./out for a lowercase
    // "resources" basename, which silently it.skip()s on macOS bundles
    // (Contents/Resources) and on the preview track (out-preview).
    const bundledBun = steps.find((step) => step.name === 'Verify packaged bundled bun assets')!;
    expect(bundledBun.if).toBeUndefined();
    expect(bundledBun['continue-on-error']).toBeUndefined();
    expect(bundledBun.run).toContain('APP_RESOURCES_DIR="$resources_dir" bun run test:packaged:bun');
    expect(steps.indexOf(bundledBun)).toBeGreaterThan(steps.indexOf(smoke));
    expect(steps.indexOf(bundledBun)).toBeLessThan(steps.indexOf(upload));
    expect(config.env!.WCORE_SKIP).toBe('0');
    expect(job.env!.WAYLAND_RELEASE_TRACK).toBe('${{ matrix.release_track }}');
    expect(job.env!.PACKAGE_OUT_DIR).toContain('out-preview');
    expect(upload.with!['if-no-files-found']).toBe('error');
    expect(upload.with!.path).toContain('platform-package-smoke-*.json');
    expect(upload.with!.name).toContain('${{ matrix.release_track }}');
  });

  it('makes release smoke unconditional after platform builds and before artifact upload', () => {
    const config = workflow('_build-reusable.yml');
    const steps = config.jobs.build.steps!;
    const hostAssertionIndex = steps.findIndex((step) => step.name === 'Assert native runner identity');
    const captureIndex = steps.findIndex((step) => step.name === 'Capture pre-build packaged content state');
    const smokeIndex = steps.findIndex((step) => step.name === 'Install and smoke real package payload');
    const uploadIndex = steps.findIndex((step) => step.name === 'Upload build artifacts');
    const smoke = steps[smokeIndex];
    expect(smokeIndex).toBeGreaterThan(0);
    expect(captureIndex).toBeGreaterThan(0);
    expect(captureIndex).toBeGreaterThan(hostAssertionIndex);
    expect(smokeIndex).toBeGreaterThan(captureIndex);
    expect(uploadIndex).toBeGreaterThan(smokeIndex);
    expect(smoke.if).toBeUndefined();
    expect(smoke['continue-on-error']).toBeUndefined();
    expect(smoke.env).toEqual({
      TARGET_PLATFORM: '${{ matrix.target_platform }}',
      TARGET_ARCH: '${{ matrix.arch }}',
    });
    expect(steps[captureIndex].if).toBeUndefined();
    expect(steps[captureIndex]['continue-on-error']).toBeUndefined();
    expect(steps[captureIndex].run).toContain('--capture-state');
    expect(steps[captureIndex].run).toContain('--release-track "$WAYLAND_RELEASE_TRACK"');
    expect(steps[captureIndex].run).toContain('--github-output "$GITHUB_OUTPUT"');
    expect(steps[captureIndex].id).toBe('package-candidate-state');
    expect(steps[hostAssertionIndex].if).toBeUndefined();
    expect(steps[hostAssertionIndex]['continue-on-error']).toBeUndefined();
    expect(steps[hostAssertionIndex].run).toContain('process.arch !== process.env.TARGET_ARCH');
    expect(smoke.run).toContain(
      '--candidate-state-digest "${{ steps.package-candidate-state.outputs.candidate_state_digest }}"'
    );
    expect(smoke.run).toContain('--release-track "$WAYLAND_RELEASE_TRACK"');
    expect(config.env!.WAYLAND_RELEASE_TRACK).toBe('stable');
    expect(steps[uploadIndex].with!['if-no-files-found']).toBe('error');
    expect(steps[uploadIndex].with!.path).toContain('platform-package-smoke-*.json');
  });

  it('fails Windows builds closed instead of converting exceptions into green workflows', () => {
    const steps = workflow('_build-reusable.yml').jobs.build.steps!;
    const windowsBuild = steps.find((step) => step.name === 'Build with electron-builder (Windows)')!;
    expect(windowsBuild.if).toBe("startsWith(matrix.platform, 'windows')");
    expect(windowsBuild['continue-on-error']).toBeUndefined();
    expect(windowsBuild.run).toContain('throw');
    expect(windowsBuild.run).not.toContain('will not block');
    expect(windowsBuild.run).not.toContain('workflow is allowed to continue');
  });

  it('keeps the Linux sandbox waiver confined to the disposable package smoke', () => {
    const mainProcess = fs.readFileSync(path.join(repoRoot, 'src/index.ts'), 'utf8');
    expect(mainProcess).not.toContain("app.commandLine.appendSwitch('no-sandbox')");
    expect(mainProcess).not.toContain("app.commandLine.appendArgument('--no-sandbox')");
    expect(launchCommand('/opt/Wayland/wayland', 'linux', { DISPLAY: ':99' })).toMatchObject({
      args: ['--no-sandbox'],
      sandboxMode: 'smoke-only-disabled',
    });
  });

  it('gates Electron will-quit behind a terminal cleanup event instead of trusting an async listener', () => {
    const mainProcess = fs.readFileSync(path.join(repoRoot, 'src/index.ts'), 'utf8');
    const beforeQuit = mainProcess.indexOf("app.on('before-quit'");
    const preventDefault = mainProcess.indexOf('event.preventDefault()', beforeQuit);
    const cleanupCall = mainProcess.indexOf('performBeforeQuitCleanup()', preventDefault);
    const completionHandler = mainProcess.indexOf('.finally(() =>', cleanupCall);
    const terminalQuitRequest = mainProcess.indexOf('app.quit()', completionHandler);
    const cleanupFunction = mainProcess.indexOf('async function performBeforeQuitCleanup()', terminalQuitRequest);
    const cleanupComplete = mainProcess.indexOf("recordPackageSmokeEvent('cleanup-complete')", cleanupFunction);
    const willQuit = mainProcess.indexOf("app.on('will-quit'", cleanupComplete);
    expect(beforeQuit).toBeGreaterThan(-1);
    expect(preventDefault).toBeGreaterThan(beforeQuit);
    expect(cleanupCall).toBeGreaterThan(preventDefault);
    expect(completionHandler).toBeGreaterThan(cleanupCall);
    expect(terminalQuitRequest).toBeGreaterThan(completionHandler);
    expect(cleanupFunction).toBeGreaterThan(terminalQuitRequest);
    expect(cleanupComplete).toBeGreaterThan(cleanupFunction);
    expect(willQuit).toBeGreaterThan(cleanupComplete);
  });

  it('structurally declares exact platform identities for every release and manual target', () => {
    const expected = [
      'darwin-arm64@macos-15',
      'darwin-x64@macos-15-intel',
      'win32-x64@windows-2022',
      'win32-arm64@windows-11-arm',
      'linux-x64@ubuntu-24.04',
      'linux-arm64@ubuntu-24.04-arm',
    ];
    const releaseMatrix = JSON.parse(workflow('build-and-release.yml').jobs['build-pipeline'].with!.matrix);
    expect(
      releaseMatrix.include.map(
        (target: Record<string, string>) => `${target.target_platform}-${target.arch}@${target.os}`
      )
    ).toEqual(expected);

    const manualStep = workflow('build-manual.yml').jobs['prepare-matrix'].steps!.find(
      (step) => step.name === 'Generate build matrix'
    )!;
    const targetAssignments = [...manualStep.run!.matchAll(/^[ ]*([A-Z0-9_]+)='(\{[^\n]+\})'$/gm)].map((match) =>
      JSON.parse(match[2])
    );
    expect(
      targetAssignments.map((target: Record<string, string>) => `${target.target_platform}-${target.arch}@${target.os}`)
    ).toEqual(expected);
  });
});
