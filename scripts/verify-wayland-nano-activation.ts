import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  verify as verifySignature,
} from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmod, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import canonicalize from 'canonicalize';

const NANO_REMOTE = 'https://github.com/FerroxLabs/wayland-nano.git';
const SOURCE_SHA = '288de9ed3185c91717f8f777c9975c784709e824';
const MERGE_SHA = '1d80ecf93c1ec5fe14e89a44e89c4a0142ba1c9b';
const LOCK_SHA256 = '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a';
const LOCK_BLOB = '7bb979cf829f7bf0a63692d8485bfc8e4935ed13';
const HELPER_SOURCE_SHA = '2f7b33f4ad9344aea1ce78fc9fb09600a6f50dbe';
const HELPER_MERGE_SHA = 'c10dcb9b0964a23df7b5bb2760ef494c4e15369d';
const HELPER_MERGED_AT = '2026-08-31T08:13:47Z';
const HELPER_CI_RUN_ID = 33369702224;
const HELPER_LOCK_SHA256 = LOCK_SHA256;
const MANIFEST_PATH = path.resolve('docs/evidence/phase2/activation-artifact-manifest.json');
const RECEIPT_PATH = path.resolve('docs/evidence/phase2/activation-negative-crash-receipt.json');
const OFFLINE_AUTHORIZATION_PUBLIC_KEY = Buffer.from(
  '6f17bef14ee3a58b0cf7385e301eaed5a60b882634b885f0aa87d0320bc3cb28',
  'hex'
);
const ADMIN_BOOTSTRAP_DOMAIN = Buffer.from('WAYLAND-NANO-ADMIN-BOOTSTRAP\0v1\0');
const OFFLINE_AUTHORIZATION_DOMAIN = Buffer.from('WAYLAND-NANO-OFFLINE-BOOTSTRAP\0v1\0');
const OFFLINE_RECEIPT_DOMAIN = Buffer.from('WAYLAND-NANO-OFFLINE-BOOTSTRAP-RECEIPT\0v1\0');

type GateOptions = Readonly<{
  offlineBootstrapAuthorization: string | null;
  productionBootstrapPreparation: string | null;
  prepareProductionBootstrap: boolean;
  productionBootstrapResult: string | null;
  requireFreshNanoCheckout: boolean;
  requireProductionBootstrap: boolean;
  requireTerminalRefusal: boolean;
}>;

type CommandResult = Readonly<{ status: number; stdout: string; stderr: string }>;

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function rawEd25519PublicKey(raw: Buffer) {
  if (raw.length !== 32) throw new Error('evidence Ed25519 public key length is invalid');
  return createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]),
    format: 'der',
    type: 'spki',
  });
}

/** Evidence-tool-only verification. This is never imported by Desktop runtime code. */
export function verifyCanonicalEvidenceSignature(
  raw: Buffer,
  publicKey: Buffer,
  domain: Buffer
): Record<string, unknown> {
  const text = raw.toString('utf8');
  const value = JSON.parse(text) as Record<string, unknown>;
  if (!value || Array.isArray(value) || canonicalize(value) !== text)
    throw new Error('signed evidence is not canonical JCS');
  const signature = value.signature;
  if (typeof signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(signature))
    throw new Error('signed evidence signature encoding is invalid');
  const decoded = Buffer.from(signature, 'base64url');
  const unsigned = { ...value };
  delete unsigned.signature;
  const payload = canonicalize(unsigned);
  if (!payload) throw new Error('signed evidence payload is not canonicalizable');
  if (!verifySignature(null, Buffer.concat([domain, Buffer.from(payload)]), rawEd25519PublicKey(publicKey), decoded))
    throw new Error('signed evidence signature is invalid');
  return value;
}

function command(
  executable: string,
  args: readonly string[],
  options: Readonly<{
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    input?: string;
    inherit?: boolean;
    timeoutMs?: number;
  }> = {}
): CommandResult {
  const result = spawnSync(executable, [...args], {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    timeout: options.timeoutMs ?? 20 * 60_000,
    windowsHide: !options.inherit,
  });
  if (result.error) throw result.error;
  return {
    status: result.status ?? -1,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
  };
}

function mustRun(executable: string, args: readonly string[], cwd?: string, env?: NodeJS.ProcessEnv): CommandResult {
  const result = command(executable, args, { cwd, env });
  if (result.status !== 0) {
    throw new Error(
      `${executable} ${args.join(' ')} failed (${result.status})\n${result.stdout}\n${result.stderr}`.trim()
    );
  }
  return result;
}

function parseOptions(args: readonly string[]): GateOptions {
  let productionBootstrapResult: string | null = null;
  let productionBootstrapPreparation: string | null = null;
  let offlineBootstrapAuthorization: string | null = null;
  const flags = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--production-bootstrap-result') {
      const value = args[index + 1];
      if (!value || productionBootstrapResult) throw new Error('production bootstrap result argument is invalid');
      productionBootstrapResult = path.resolve(value);
      index += 1;
    } else if (arg === '--production-bootstrap-preparation') {
      const value = args[index + 1];
      if (!value || productionBootstrapPreparation)
        throw new Error('production bootstrap preparation argument is invalid');
      productionBootstrapPreparation = path.resolve(value);
      index += 1;
    } else if (arg === '--offline-bootstrap-authorization') {
      const value = args[index + 1];
      if (!value || offlineBootstrapAuthorization)
        throw new Error('offline bootstrap authorization argument is invalid');
      offlineBootstrapAuthorization = path.resolve(value);
      index += 1;
    } else if (
      arg === '--prepare-production-bootstrap' ||
      arg === '--require-fresh-nano-checkout' ||
      arg === '--require-production-bootstrap' ||
      arg === '--require-terminal-refusal'
    ) {
      if (flags.has(arg)) throw new Error(`duplicate argument: ${arg}`);
      flags.add(arg);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return Object.freeze({
    offlineBootstrapAuthorization,
    productionBootstrapPreparation,
    prepareProductionBootstrap: flags.has('--prepare-production-bootstrap'),
    productionBootstrapResult,
    requireFreshNanoCheckout: flags.has('--require-fresh-nano-checkout'),
    requireProductionBootstrap: flags.has('--require-production-bootstrap'),
    requireTerminalRefusal: flags.has('--require-terminal-refusal'),
  });
}

async function validateCommittedEvidence(): Promise<void> {
  const artifact = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Record<string, unknown>;
  const receipt = JSON.parse(await readFile(RECEIPT_PATH, 'utf8')) as Record<string, unknown>;
  if (artifact.schema !== 'wayland.desktop.nano-activation-artifact-manifest/v1') {
    throw new Error('artifact manifest schema mismatch');
  }
  if (receipt.schema !== 'wayland.desktop.nano-activation-negative-crash-receipt/v1') {
    throw new Error('negative/crash receipt schema mismatch');
  }
  const nano = artifact.nano as Record<string, unknown>;
  if (
    nano.reviewedSourceCommit !== SOURCE_SHA ||
    nano.mergeCommit !== MERGE_SHA ||
    nano.cargoLockSha256 !== LOCK_SHA256 ||
    nano.cargoLockBlob !== LOCK_BLOB
  ) {
    throw new Error('committed Nano input identity mismatch');
  }
  const helper = artifact.nanoFixtureHelper as Record<string, unknown>;
  if (
    helper.sourceCommit !== HELPER_SOURCE_SHA ||
    helper.mergeCommit !== HELPER_MERGE_SHA ||
    helper.cargoLockSha256 !== HELPER_LOCK_SHA256 ||
    helper.ciRunId !== HELPER_CI_RUN_ID ||
    helper.mergedAt !== HELPER_MERGED_AT ||
    helper.mergedBeforeDesktop !== true ||
    helper.publicSchema !== 'wayland.nano.phase2-fixture/v2' ||
    helper.privateHandoffSchema !== 'wayland.nano.phase2-fixture-private/v1' ||
    helper.productionCliExposure !== false
  ) {
    throw new Error('committed Nano fixture helper identity mismatch');
  }
  const matrix = artifact.matrix as Record<string, unknown>;
  const rowIds = matrix.rowIds as string[];
  if (
    matrix.positiveCount !== 5 ||
    matrix.negativeCount !== 26 ||
    matrix.totalCount !== 31 ||
    rowIds.length !== 31 ||
    new Set(rowIds).size !== 31 ||
    matrix.rowIdsSha256 !== sha256(rowIds.join('\n')) ||
    receipt.matrixRowIdsSha256 !== matrix.rowIdsSha256
  ) {
    throw new Error('committed acceptance matrix identity mismatch');
  }
}

async function freshCheckout(root: string): Promise<string> {
  const checkout = path.join(root, 'nano-source');
  mustRun('git', ['-c', 'core.autocrlf=false', 'clone', '--filter=blob:none', '--no-checkout', NANO_REMOTE, checkout]);
  mustRun('git', ['-C', checkout, 'config', 'core.autocrlf', 'false']);
  mustRun('git', ['-C', checkout, 'fetch', '--depth=1', 'origin', SOURCE_SHA]);
  mustRun('git', ['-C', checkout, 'checkout', '--detach', SOURCE_SHA]);
  const head = mustRun('git', ['-C', checkout, 'rev-parse', 'HEAD']).stdout.trim();
  const origin = mustRun('git', ['-C', checkout, 'remote', 'get-url', 'origin']).stdout.trim();
  const status = mustRun('git', ['-C', checkout, 'status', '--porcelain=v1']).stdout;
  if (head !== SOURCE_SHA || origin !== NANO_REMOTE || status !== '') {
    throw new Error('fresh Nano checkout identity mismatch');
  }
  const lock = await readFile(path.join(checkout, 'Cargo.lock'));
  const blob = mustRun('git', ['-C', checkout, 'hash-object', 'Cargo.lock']).stdout.trim();
  if (sha256(lock) !== LOCK_SHA256 || blob !== LOCK_BLOB) throw new Error('fresh Cargo.lock identity mismatch');
  return checkout;
}

async function freshHelperCheckout(root: string): Promise<string> {
  const checkout = path.join(root, 'nano-helper-source');
  mustRun('git', ['-c', 'core.autocrlf=false', 'clone', '--no-checkout', NANO_REMOTE, checkout]);
  mustRun('git', ['-C', checkout, 'config', 'core.autocrlf', 'false']);
  mustRun('git', ['-C', checkout, 'fetch', 'origin', HELPER_SOURCE_SHA]);
  mustRun('git', ['-C', checkout, 'checkout', '--detach', HELPER_SOURCE_SHA]);
  if (
    mustRun('git', ['-C', checkout, 'rev-parse', 'HEAD']).stdout.trim() !== HELPER_SOURCE_SHA ||
    mustRun('git', ['-C', checkout, 'remote', 'get-url', 'origin']).stdout.trim() !== NANO_REMOTE ||
    mustRun('git', ['-C', checkout, 'status', '--porcelain=v1']).stdout !== '' ||
    sha256(await readFile(path.join(checkout, 'Cargo.lock'))) !== HELPER_LOCK_SHA256
  )
    throw new Error('fresh Nano helper checkout identity mismatch');
  return checkout;
}

async function buildProfiles(
  checkout: string,
  helperCheckout: string | null,
  target: string
): Promise<Readonly<{ debug: string; fixture: string | null; release: string }>> {
  const env = { ...process.env, CARGO_TARGET_DIR: target };
  mustRun('cargo', ['build', '--locked', '-p', 'nano-cli', '--bin', 'wayland-nano'], checkout, env);
  mustRun('cargo', ['build', '--locked', '--release', '-p', 'nano-cli', '--bin', 'wayland-nano'], checkout, env);
  const helperTarget = path.join(target, 'helper-target');
  if (helperCheckout)
    mustRun(
      'cargo',
      [
        'build',
        '--locked',
        '--release',
        '-p',
        'nano-activation',
        '--features',
        'phase2-fixture',
        '--bin',
        'nano-phase2-fixture',
      ],
      helperCheckout,
      { ...process.env, CARGO_TARGET_DIR: helperTarget }
    );
  const filename = process.platform === 'win32' ? 'wayland-nano.exe' : 'wayland-nano';
  const debug = await realpath(path.join(target, 'debug', filename));
  const cargoRelease = await realpath(path.join(target, 'release', filename));
  const fixture = helperCheckout
    ? await realpath(
        path.join(
          helperTarget,
          'release',
          process.platform === 'win32' ? 'nano-phase2-fixture.exe' : 'nano-phase2-fixture'
        )
      )
    : null;
  for (const executable of [debug, cargoRelease]) {
    const metadata = await lstat(executable);
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size <= 0) {
      throw new Error(`built Nano executable is unsafe: ${executable}`);
    }
  }
  // Cargo uses a hard link for the Windows target artifact. Desktop's held
  // identity contract deliberately rejects multi-link executables, so publish
  // the exact freshly built bytes into a private single-link launch artifact.
  const artifactRoot = path.join(target, 'exact-artifact');
  await mkdir(artifactRoot);
  await makeOwnerOnly(artifactRoot);
  const release = path.join(artifactRoot, filename);
  await writePrivateFile(release, await readFile(cargoRelease));
  if (process.platform !== 'win32') await chmod(release, 0o500);
  const published = await lstat(release);
  if (!published.isFile() || published.isSymbolicLink() || published.nlink !== 1) {
    throw new Error('published Nano launch artifact is not single-link');
  }
  if (fixture) {
    const fixtureMetadata = await lstat(fixture);
    if (!fixtureMetadata.isFile() || fixtureMetadata.isSymbolicLink() || fixtureMetadata.size <= 0)
      throw new Error('Nano-owned Phase 2 fixture helper is unsafe');
  }
  return Object.freeze({ debug, fixture, release });
}

function runNanoContractMatrix(checkout: string, target: string): void {
  const env = { ...process.env, CARGO_TARGET_DIR: target };
  const suites: readonly (readonly string[])[] = [
    ['test', '--locked', '-p', 'nano-activation', '--lib'],
    ['test', '--locked', '-p', 'nano-activation', '--test', 'contract_vectors'],
    ['test', '--locked', '-p', 'nano-activation', '--test', 'admin_lifecycle', '--test', 'admin_crash_rebuild'],
    [
      'test',
      '--locked',
      '-p',
      'nano-activation',
      '--test',
      'admission_matrix',
      '--test',
      'replay_crash',
      '--test',
      'enablement',
    ],
    ['test', '--locked', '-p', 'nano-activation', '--test', 'receipt_offline', '--test', 'signer_provider'],
    ['test', '--locked', '-p', 'nano-activation', '--test', 'offline_bootstrap'],
    ['test', '--locked', '-p', 'nano-cli', '--test', 'activation_admission', '--test', 'activation_cli'],
    ['test', '--locked', '-p', 'nano-cli', '--test', 'offline_bootstrap_cli'],
    ['test', '--locked', '-p', 'nano-cli', '--test', 'activation_quarantine'],
    ['test', '--locked', '-p', 'nano-agent', 'activation_effect'],
  ];
  for (const args of suites) mustRun('cargo', args, checkout, env);
}

async function runHelperContractMatrix(checkout: string, target: string, evidenceRoot: string): Promise<void> {
  const testTemp = path.join(evidenceRoot, `helper-test-temp-${randomBytes(6).toString('hex')}`);
  await mkdir(testTemp);
  await makeOwnerOnly(testTemp);
  const gitLongPaths =
    process.platform === 'win32'
      ? { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.longpaths', GIT_CONFIG_VALUE_0: 'true' }
      : {};
  mustRun(
    'cargo',
    [
      'test',
      '--locked',
      '-p',
      'nano-activation',
      '--features',
      'phase2-fixture',
      '--test',
      'phase2_fixture',
      '--',
      '--test-threads=1',
    ],
    checkout,
    { ...process.env, ...gitLongPaths, CARGO_TARGET_DIR: target, TEMP: testTemp, TMP: testTemp }
  );
}

async function inventory(root: string): Promise<string> {
  const entries: string[] = [];
  async function walk(directory: string): Promise<void> {
    const children = await import('node:fs/promises').then((fs) => fs.readdir(directory, { withFileTypes: true }));
    for (const child of children.toSorted((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, child.name);
      if (child.isDirectory()) await walk(absolute);
      else if (child.isFile()) entries.push(`${path.relative(root, absolute)}\0${sha256(await readFile(absolute))}`);
      else entries.push(`${path.relative(root, absolute)}\0special`);
    }
  }
  await walk(root);
  return sha256(entries.join('\n'));
}

async function runTerminalRefusalProcesses(
  executable: string,
  fixtureHelper: string,
  frozenCheckout: string,
  root: string
): Promise<void> {
  const prefix = `terminal-refusal-${randomBytes(6).toString('hex')}`;
  const executableSha256 = sha256(await readFile(executable));
  const fluxKey = path.join(root, `${prefix}-flux-api-key.txt`);
  await writePrivateFile(fluxKey, 'phase2-public-process-fixture-not-a-live-key');
  const fixtureEnvironment = (home: string) => ({
    ...process.env,
    FLUX_API_KEY_FILE: fluxKey,
    NANO_HOME: home,
  });
  const primeFixture = (home: string) => {
    const primed = command(executable, ['acp-host'], { env: fixtureEnvironment(home), input: '' });
    if (primed.status !== 0) throw new Error(`public process fixture failed to open (${primed.status})`);
  };
  const unsignedFrame = '{"id":1,"jsonrpc":"2.0","method":"session/new","params":{"cwd":"."}}\n';
  for (const [label, args, input] of [
    ['desktop-legacy-acp', ['acp-host'], unsignedFrame],
    ['desktop-sdk-acp', ['acp-host'], unsignedFrame],
  ] as const) {
    const home = path.join(root, `${prefix}-${label}`);
    await createNanoOwnedFixture(fixtureHelper, root, home, frozenCheckout, executable, executableSha256);
    primeFixture(home);
    const before = await inventory(home);
    const result = command(executable, args, {
      env: fixtureEnvironment(home),
      input,
    });
    const after = await inventory(home);
    const transcript = `${result.stdout}\n${result.stderr}`;
    if (![0, 2].includes(result.status) || before !== after || !/activation|refus|signed/i.test(transcript)) {
      throw new Error(
        `${label} did not terminate at the Nano admission boundary: ${JSON.stringify({
          status: result.status,
          stdout: result.stdout.slice(0, 2048),
          stderr: result.stderr.slice(0, 2048),
          stateUnchanged: before === after,
        })}`
      );
    }
  }

  const request = path.join(root, `${prefix}-unsigned-activation.json`);
  await writeFile(request, unsignedFrame, { mode: 0o600 });
  for (const [label, args, input] of [
    ['direct-cli', ['exec', '--activation-request', request, 'acceptance'], undefined],
    ['protocol-host', ['protocol-host', '--activation-request', request], undefined],
    ['unsigned-control', ['acp-host'], '{"jsonrpc":"2.0","method":"session/cancel","params":{"sessionId":"none"}}\n'],
  ] as const) {
    const home = path.join(root, `${prefix}-${label}`);
    await createNanoOwnedFixture(fixtureHelper, root, home, frozenCheckout, executable, executableSha256);
    primeFixture(home);
    const before = await inventory(home);
    const result = command(executable, args, { env: fixtureEnvironment(home), input });
    const after = await inventory(home);
    if (![0, 2].includes(result.status) || before !== after) {
      throw new Error(
        `${label} refusal was not terminal and side-effect free: ${JSON.stringify({
          status: result.status,
          stdout: result.stdout.slice(0, 2048),
          stderr: result.stderr.slice(0, 2048),
          stateUnchanged: before === after,
        })}`
      );
    }
  }
}

async function makeOwnerOnly(target: string): Promise<void> {
  if (process.platform === 'win32') {
    const systemRoot = process.env.SystemRoot;
    if (!systemRoot || !path.isAbsolute(systemRoot)) throw new Error('Windows system root is unavailable');
    const row = mustRun(path.join(systemRoot, 'System32', 'whoami.exe'), ['/user', '/fo', 'csv', '/nh']).stdout.trim();
    const sid = row.split(',')[1]?.replaceAll('"', '');
    if (!sid || !/^S-\d(?:-\d+)+$/.test(sid)) throw new Error('Windows owner SID is unavailable');
    mustRun(path.join(systemRoot, 'System32', 'icacls.exe'), [
      target,
      '/inheritance:r',
      '/grant:r',
      `*${sid}:(OI)(CI)F`,
    ]);
    normalizeWindowsOwner(target, true, systemRoot);
  } else {
    await chmod(target, 0o700);
  }
}

async function writePrivateFile(target: string, bytes: Buffer | string): Promise<void> {
  await writeFile(target, bytes, { mode: 0o600 });
  if (process.platform === 'win32') {
    const systemRoot = process.env.SystemRoot;
    if (!systemRoot || !path.isAbsolute(systemRoot)) throw new Error('Windows system root is unavailable');
    const row = mustRun(path.join(systemRoot, 'System32', 'whoami.exe'), ['/user', '/fo', 'csv', '/nh']).stdout.trim();
    const sid = row.split(',')[1]?.replaceAll('"', '');
    if (!sid || !/^S-\d(?:-\d+)+$/.test(sid)) throw new Error('Windows owner SID is unavailable');
    mustRun(path.join(systemRoot, 'System32', 'icacls.exe'), [target, '/inheritance:r', '/grant:r', `*${sid}:F`]);
    normalizeWindowsOwner(target, false, systemRoot);
  } else {
    await chmod(target, 0o600);
  }
}

function normalizeWindowsOwner(target: string, directory: boolean, systemRoot: string): void {
  const encodedTarget = Buffer.from(target, 'utf8').toString('base64');
  const kind = directory ? 'Directory' : 'File';
  const script = String.raw`
$ErrorActionPreference='Stop'
$target=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedTarget}'))
$current=[Security.Principal.WindowsIdentity]::GetCurrent().User
$item=[IO.${kind}]::GetAccessControl($target)
$owner=$item.GetOwner([Security.Principal.SecurityIdentifier])
if($owner -ne $current){$item.SetOwner($current);[IO.${kind}]::SetAccessControl($target,$item)}
`;
  mustRun(path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    script,
  ]);
}

async function createEvidenceRoot(): Promise<string> {
  if (process.platform !== 'win32') return mkdtemp(path.join(os.tmpdir(), 'wayland-nano-exact-artifact-'));
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData || !path.isAbsolute(localAppData))
    throw new Error('Windows LocalAppData is unavailable for owner-only exact-artifact evidence');
  const parent = path.join(localAppData, 'WaylandNano', 'phase2-exact-artifact-evidence');
  await mkdir(parent, { recursive: true });
  await makeOwnerOnly(parent);
  const root = await mkdtemp(path.join(parent, 'run-'));
  await makeOwnerOnly(root);
  return root;
}

export type NanoFixture = Readonly<{
  artifact: Readonly<{ cargo_lock_sha256: string; executable_sha256: string; source_commit_sha: string }>;
  bootstrap_receipt_path: string;
  desktop_issuer_id: string;
  desktop_issuer_key_id: string;
  desktop_issuer_seed_path: string;
  desktop_principal_id: string;
  desktop_subject_id: string;
  enablement_not_after: string;
  executable_size: number;
  home: string;
  home_identity_sha256: string;
  helper_cargo_lock_sha256: string;
  helper_source_commit_sha: string;
  helper_source_dirty: boolean;
  local_cli_issuer_id: string;
  local_cli_issuer_key_id: string;
  local_cli_key_reference: string;
  local_cli_principal_id: string;
  local_cli_seed_path: string;
  local_cli_subject_id: string;
  private_handoff_sha256: string;
  project_id: string;
  receipt_signer_key_reference: string;
  receipt_signer_public_key: string;
  schema: 'wayland.nano.phase2-fixture/v2';
}>;

function nanoCanonicalPath(value: string): string {
  if (process.platform !== 'win32' || value.startsWith('\\\\?\\')) return value;
  if (!/^[A-Za-z]:\\/.test(value)) throw new Error('Nano fixture path is not a canonical local drive path');
  return `\\\\?\\${value}`;
}

export async function createNanoOwnedFixture(
  helper: string,
  evidenceRoot: string,
  home: string,
  frozenCheckout: string,
  executable: string,
  executableSha256: string
): Promise<NanoFixture> {
  const canonicalRoot = await realpath(evidenceRoot);
  if (path.dirname(home) !== canonicalRoot) throw new Error('Nano-owned fixture home is not a direct evidence child');
  const label = path.basename(home);
  const boundRoot = nanoCanonicalPath(canonicalRoot);
  const boundHome = nanoCanonicalPath(home);
  const handoffPath = path.join(boundRoot, `${label}-private.json`);
  const preparationPath = path.join(boundRoot, `${label}-preparation.json`);
  const notAfter = new Date(Date.now() + 60 * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  await writePrivateFile(
    preparationPath,
    canonicalize({
      cargo_lock_sha256: LOCK_SHA256,
      executable_path: nanoCanonicalPath(await realpath(executable)),
      executable_sha256: executableSha256,
      frozen_checkout_path: nanoCanonicalPath(await realpath(frozenCheckout)),
      schema: 'wayland.desktop.nano-phase2-fixture-preparation/v1',
      source_commit_sha: SOURCE_SHA,
    }) ?? ''
  );
  const result = mustRun(helper, [
    '--evidence-root',
    boundRoot,
    '--home',
    boundHome,
    '--private-handoff',
    handoffPath,
    '--preparation-path',
    preparationPath,
    '--not-after',
    notAfter,
  ]);
  const text = result.stdout.trimEnd();
  const publicOutput = JSON.parse(text) as Record<string, unknown>;
  const expectedKeys = [
    'artifact',
    'desktop_issuer_id',
    'desktop_issuer_key_id',
    'desktop_principal_id',
    'desktop_subject_id',
    'enablement_not_after',
    'executable_size',
    'helper_cargo_lock_sha256',
    'helper_source_commit_sha',
    'helper_source_dirty',
    'home_identity_sha256',
    'local_cli_issuer_id',
    'local_cli_issuer_key_id',
    'local_cli_principal_id',
    'local_cli_subject_id',
    'private_handoff_sha256',
    'project_id',
    'receipt_signer_public_key',
    'schema',
  ];
  if (
    canonicalize(publicOutput) !== text ||
    JSON.stringify(Object.keys(publicOutput).toSorted()) !== JSON.stringify(expectedKeys.toSorted()) ||
    publicOutput.schema !== 'wayland.nano.phase2-fixture/v2' ||
    publicOutput.desktop_issuer_id !== 'wayland-desktop' ||
    publicOutput.desktop_issuer_key_id !== 'desktop-phase2-fixture-key' ||
    publicOutput.desktop_subject_id !== 'phase2-agent' ||
    publicOutput.desktop_principal_id !== 'main' ||
    publicOutput.local_cli_issuer_id !== 'local-cli' ||
    publicOutput.local_cli_issuer_key_id !== 'local-cli-phase2-fixture-key' ||
    publicOutput.local_cli_subject_id !== 'main' ||
    publicOutput.local_cli_principal_id !== 'main' ||
    publicOutput.project_id !== 'phase2-project' ||
    publicOutput.enablement_not_after !== notAfter ||
    publicOutput.executable_size !== (await lstat(executable)).size ||
    publicOutput.home_identity_sha256 !== sha256(boundHome) ||
    (publicOutput.artifact as Record<string, unknown>)?.source_commit_sha !== SOURCE_SHA ||
    (publicOutput.artifact as Record<string, unknown>)?.cargo_lock_sha256 !== LOCK_SHA256 ||
    (publicOutput.artifact as Record<string, unknown>)?.executable_sha256 !== executableSha256 ||
    publicOutput.helper_source_commit_sha !== HELPER_SOURCE_SHA ||
    publicOutput.helper_cargo_lock_sha256 !== HELPER_LOCK_SHA256 ||
    publicOutput.helper_source_dirty !== false ||
    !/^[A-Za-z0-9_-]{43}$/.test(String(publicOutput.receipt_signer_public_key))
  )
    throw new Error('Nano-owned Phase 2 fixture output is invalid');
  const handoffText = await readFile(handoffPath, 'utf8');
  const handoff = JSON.parse(handoffText) as Record<string, unknown>;
  const handoffKeys = [
    'bootstrap_receipt_path',
    'desktop_issuer_seed_path',
    'home',
    'local_cli_key_reference',
    'local_cli_seed_path',
    'receipt_signer_key_reference',
    'schema',
  ];
  if (
    canonicalize(handoff) !== handoffText ||
    JSON.stringify(Object.keys(handoff).toSorted()) !== JSON.stringify(handoffKeys.toSorted()) ||
    handoff.schema !== 'wayland.nano.phase2-fixture-private/v1' ||
    handoff.home !== boundHome ||
    sha256(handoffText) !== publicOutput.private_handoff_sha256
  )
    throw new Error('Nano-owned Phase 2 private handoff is invalid');
  const canonicalHome = await realpath(boundHome);
  for (const candidate of [
    handoff.bootstrap_receipt_path,
    handoff.desktop_issuer_seed_path,
    handoff.local_cli_key_reference,
    handoff.local_cli_seed_path,
    handoff.receipt_signer_key_reference,
  ]) {
    if (typeof candidate !== 'string') throw new Error('Nano-owned fixture handoff path is invalid');
    const canonical = await realpath(candidate);
    if (canonical !== canonicalHome && !canonical.startsWith(`${canonicalHome}${path.sep}`))
      throw new Error('Nano-owned Phase 2 fixture path escapes its home');
  }
  return Object.freeze({ ...publicOutput, ...handoff } as NanoFixture);
}

function fixturePrivateKey(seed: Buffer) {
  return createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
    format: 'der',
    type: 'pkcs8',
  });
}

function signFixture(value: Record<string, unknown>, seed: Buffer, domain: string): Record<string, unknown> {
  const payload = canonicalize(value);
  if (!payload) throw new Error('Nano-owned fixture request canonicalization failed');
  return Object.freeze({
    ...value,
    signature: sign(null, Buffer.concat([Buffer.from(domain), Buffer.from(payload)]), fixturePrivateKey(seed)).toString(
      'base64url'
    ),
  });
}

function fixtureActivation(
  seed: Buffer,
  operation: 'new' | 'load',
  sessionId?: string,
  resumeFingerprint?: string
): Record<string, unknown> {
  const issuedAt = new Date();
  const issued = issuedAt.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const notAfter = new Date(issuedAt.getTime() + 5 * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const unique = randomBytes(12).toString('hex');
  return signFixture(
    {
      activation_id: `phase2-${unique}`,
      alg: 'Ed25519',
      budgets: {
        max_cost_microcents: 1_000,
        max_input_tokens: 4_096,
        max_output_tokens: 2_048,
        max_tool_calls: 8,
        max_turns: 4,
        wall_clock_ms: 60_000,
      },
      capabilities: ['filesystem.read'],
      continuity: {
        fallback: 'none',
        resume_fingerprint: operation === 'load' ? resumeFingerprint : null,
        strategy: operation === 'load' ? 'session_resume' : 'fresh',
      },
      controls: ['cancel', 'pause'],
      deadline: notAfter,
      idempotency_key: `phase2-${unique}`,
      issued_at: issued,
      issuer_id: 'wayland-desktop',
      key_id: 'desktop-phase2-fixture-key',
      nonce: `phase2-${unique}`,
      not_after: notAfter,
      not_before: new Date(issuedAt.getTime() - 5_000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      principal_id: 'main',
      product_subject_id: 'phase2-agent',
      project_id: 'phase2-project',
      schema: 'wayland.nano.activation/v1',
      session_id: operation === 'load' ? sessionId : null,
    },
    seed,
    'WAYLAND-NANO-ACTIVATION\0v1\0'
  );
}

function fixtureControl(seed: Buffer, activationId: string, sessionId: string): Record<string, unknown> {
  const issuedAt = new Date();
  return signFixture(
    {
      activation_id: activationId,
      alg: 'Ed25519',
      control: 'pause',
      issued_at: issuedAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      issuer_id: 'wayland-desktop',
      key_id: 'desktop-phase2-fixture-key',
      nonce: `control-${randomBytes(12).toString('hex')}`,
      not_after: new Date(issuedAt.getTime() + 5 * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      principal_id: 'main',
      project_id: 'phase2-project',
      schema: 'wayland.nano.control/v1',
      session_id: sessionId,
    },
    seed,
    'WAYLAND-NANO-CONTROL\0v1\0'
  );
}

function fixtureActivationFrame(
  activation: Record<string, unknown>,
  method: 'session/new' | 'session/load',
  sessionId?: string
): string {
  const frame = canonicalize({
    id: method === 'session/new' ? 1 : 2,
    jsonrpc: '2.0',
    method,
    params: {
      _meta: { waylandNanoActivation: activation },
      cwd: '.',
      mcpServers: [],
      ...(sessionId ? { sessionId } : {}),
    },
  });
  if (!frame) throw new Error('Nano-owned fixture activation frame canonicalization failed');
  return frame;
}

type ReceiptExpectation = Readonly<{
  activation?: Record<string, unknown>;
  control?: 'pause';
  decision: 'admitted' | 'control_accepted';
  executableSha256: string;
  issuerId: string;
  keyId: string;
  principalId: string;
  productSubjectId: string;
  projectId: string;
  rawAssertion?: Buffer;
  sessionId?: string | null;
  stage: 'control' | 'direct-cli' | 'fresh' | 'protocol-host' | 'resume';
}>;

async function verifyActivationReceipt(
  value: unknown,
  fixture: NanoFixture,
  expected: ReceiptExpectation
): Promise<Record<string, unknown>> {
  const raw = canonicalize(value);
  if (!raw) throw new Error(`Nano activation receipt is missing at ${expected.stage}`);
  const receipt = verifyCanonicalEvidenceSignature(
    Buffer.from(raw),
    Buffer.from(fixture.receipt_signer_public_key, 'base64url'),
    Buffer.from('WAYLAND-NANO-RECEIPT\0v1\0')
  );
  if (
    receipt.schema !== 'wayland.nano.activation-receipt/v1' ||
    receipt.source_commit_sha !== SOURCE_SHA ||
    receipt.cargo_lock_sha256 !== LOCK_SHA256 ||
    receipt.executable_sha256 !== expected.executableSha256 ||
    receipt.decision !== expected.decision ||
    receipt.issuer_id !== expected.issuerId ||
    receipt.key_id !== expected.keyId ||
    receipt.product_subject_id !== expected.productSubjectId ||
    receipt.principal_id !== expected.principalId ||
    receipt.project_id !== expected.projectId ||
    receipt.session_id !== (expected.sessionId ?? null) ||
    receipt.admin_epoch !== 1 ||
    receipt.issuer_epoch !== 1 ||
    receipt.grant_epoch !== 1 ||
    receipt.revocation_epoch !== 1 ||
    !Number.isSafeInteger(receipt.authority_journal_position) ||
    Number(receipt.authority_journal_position) < 1 ||
    !Number.isSafeInteger(receipt.activation_journal_position) ||
    Number(receipt.activation_journal_position) < 1 ||
    receipt.control !== (expected.control ?? null)
  )
    throw new Error('Nano activation receipt binding is invalid');
  if (expected.activation) {
    if (receipt.activation_id !== expected.activation.activation_id)
      throw new Error('Nano activation receipt changed activation identity');
    if (!expected.control) {
      const unsigned = { ...expected.activation };
      delete unsigned.signature;
      const canonical = canonicalize(unsigned);
      if (!canonical || receipt.canonical_payload_sha256 !== sha256(canonical))
        throw new Error('Nano activation receipt canonical request binding is invalid');
    }
  }
  if (expected.rawAssertion && receipt.raw_assertion_sha256 !== sha256(expected.rawAssertion))
    throw new Error('Nano activation receipt raw request binding is invalid');
  if (expected.control && expected.rawAssertion && receipt.canonical_payload_sha256 !== sha256(expected.rawAssertion))
    throw new Error('Nano control receipt canonical request binding is invalid');
  const journal = await readFile(path.join(fixture.home, 'activation', 'admission.jsonl'), 'utf8');
  const encoded = Buffer.from(raw).toString('base64');
  if (!journal.includes(encoded)) throw new Error('Nano activation receipt is absent from the durable journal');
  return receipt;
}

async function assertNoPositiveRowLeakage(home: string): Promise<void> {
  for (const relative of ['memory', 'cron', 'routines', 'hooks', 'tools', 'tasks']) {
    try {
      await lstat(path.join(home, relative));
      throw new Error(`positive activation created forbidden ${relative} state`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

function responseLines(stdout: string): Record<string, unknown>[] {
  return stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

export function extractControlReceipt(
  admission: string,
  activationId: string,
  nonce: string
): Record<string, unknown> | undefined {
  for (const line of admission.split(/\r?\n/).filter(Boolean)) {
    const record = JSON.parse(line) as Record<string, unknown>;
    if (
      record.record_type !== 'control' ||
      record.activation_id !== activationId ||
      record.nonce !== nonce ||
      typeof record.receipt !== 'string'
    )
      continue;
    const decoded = JSON.parse(Buffer.from(record.receipt, 'base64').toString('utf8')) as unknown;
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return undefined;
    return decoded as Record<string, unknown>;
  }
  return undefined;
}

async function runPositiveProcessRows(
  executable: string,
  fixtureHelper: string,
  frozenCheckout: string,
  root: string
): Promise<void> {
  const prefix = `positive-process-${randomBytes(6).toString('hex')}`;
  const executableSha256 = sha256(await readFile(executable));
  const directHome = path.join(root, `${prefix}-direct-cli-home`);
  const directFixture = await createNanoOwnedFixture(
    fixtureHelper,
    root,
    directHome,
    frozenCheckout,
    executable,
    executableSha256
  );
  const directEnvironment = { ...process.env, NANO_HOME: directHome };
  delete directEnvironment.FLUX_API_KEY;
  delete directEnvironment.FLUX_API_KEY_FILE;
  const direct = command(
    executable,
    [
      'exec',
      '--activation-keyref',
      directFixture.local_cli_key_reference,
      '--activation-issuer',
      directFixture.local_cli_issuer_id,
      '--activation-key-id',
      directFixture.local_cli_issuer_key_id,
      '--activation-project',
      directFixture.project_id,
      'phase2-acceptance',
    ],
    { env: directEnvironment }
  );
  const directMatch = direct.stderr.match(/wayland-nano-activation-receipt: (\{[^\r\n]+\})/);
  if (!directMatch || direct.status !== 2 || !/FLUX_API_KEY/.test(direct.stderr))
    throw new Error('direct CLI did not admit before the intentional provider boundary');
  await verifyActivationReceipt(JSON.parse(directMatch[1]), directFixture, {
    decision: 'admitted',
    executableSha256,
    issuerId: directFixture.local_cli_issuer_id,
    keyId: directFixture.local_cli_issuer_key_id,
    principalId: directFixture.local_cli_principal_id,
    productSubjectId: directFixture.local_cli_subject_id,
    projectId: directFixture.project_id,
    sessionId: null,
    stage: 'direct-cli',
  });
  await assertNoPositiveRowLeakage(directHome);

  const protocolHome = path.join(root, `${prefix}-protocol-host-home`);
  const protocolFixture = await createNanoOwnedFixture(
    fixtureHelper,
    root,
    protocolHome,
    frozenCheckout,
    executable,
    executableSha256
  );
  const protocolSeed = await readFile(protocolFixture.desktop_issuer_seed_path);
  try {
    const request = path.join(root, `${prefix}-protocol-host-activation.json`);
    const protocolActivation = fixtureActivation(protocolSeed, 'new');
    const protocolFrame = fixtureActivationFrame(protocolActivation, 'session/new');
    await writePrivateFile(request, protocolFrame);
    const protocolEnvironment = { ...process.env, NANO_HOME: protocolHome };
    delete protocolEnvironment.FLUX_API_KEY;
    delete protocolEnvironment.FLUX_API_KEY_FILE;
    const protocol = command(executable, ['protocol-host', '--activation-request', request], {
      env: protocolEnvironment,
      input: '',
    });
    const protocolMatch = protocol.stderr.match(/wayland-nano-activation-receipt: (\{[^\r\n]+\})/);
    if (!protocolMatch || protocol.status !== 2 || !/FLUX_API_KEY/.test(protocol.stderr))
      throw new Error(
        `protocol-host did not admit before the intentional provider boundary: ${JSON.stringify({
          status: protocol.status,
          stderr: protocol.stderr.slice(0, 2048),
          stdout: protocol.stdout.slice(0, 2048),
        })}`
      );
    await verifyActivationReceipt(JSON.parse(protocolMatch[1]), protocolFixture, {
      activation: protocolActivation,
      decision: 'admitted',
      executableSha256,
      issuerId: protocolFixture.desktop_issuer_id,
      keyId: protocolFixture.desktop_issuer_key_id,
      principalId: protocolFixture.desktop_principal_id,
      productSubjectId: protocolFixture.desktop_subject_id,
      projectId: protocolFixture.project_id,
      rawAssertion: Buffer.from(protocolFrame),
      sessionId: null,
      stage: 'protocol-host',
    });
    await assertNoPositiveRowLeakage(protocolHome);
  } finally {
    protocolSeed.fill(0);
  }

  const resumeHome = path.join(root, `${prefix}-control-resume-home`);
  const resumeFixture = await createNanoOwnedFixture(
    fixtureHelper,
    root,
    resumeHome,
    frozenCheckout,
    executable,
    executableSha256
  );
  const resumeSeed = await readFile(resumeFixture.desktop_issuer_seed_path);
  const fluxKey = path.join(root, `${prefix}-flux-api-key.txt`);
  await writePrivateFile(fluxKey, 'phase2-public-process-fixture-not-a-live-key');
  const resumeEnvironment = { ...process.env, FLUX_API_KEY_FILE: fluxKey, NANO_HOME: resumeHome };
  try {
    const freshActivation = fixtureActivation(resumeSeed, 'new');
    const freshFrame = fixtureActivationFrame(freshActivation, 'session/new');
    const fresh = command(executable, ['acp-host'], {
      env: resumeEnvironment,
      input: `${freshFrame}\n`,
    });
    if (fresh.status !== 0) throw new Error('control/resume fresh ACP activation failed');
    const freshResponse = responseLines(fresh.stdout).find((response) => response.id === 1);
    const freshResult = freshResponse?.result as Record<string, unknown> | undefined;
    const freshMeta = freshResult?._meta as Record<string, unknown> | undefined;
    const sessionId = freshResult?.sessionId;
    const fingerprint = freshMeta?.waylandNanoResumeFingerprint;
    if (typeof sessionId !== 'string' || typeof fingerprint !== 'string' || !/^[0-9a-f]{64}$/.test(fingerprint))
      throw new Error('control/resume fresh session binding is invalid');
    await verifyActivationReceipt(freshMeta?.waylandNanoActivationReceipt, resumeFixture, {
      activation: freshActivation,
      decision: 'admitted',
      executableSha256,
      issuerId: resumeFixture.desktop_issuer_id,
      keyId: resumeFixture.desktop_issuer_key_id,
      principalId: resumeFixture.desktop_principal_id,
      productSubjectId: resumeFixture.desktop_subject_id,
      projectId: resumeFixture.project_id,
      rawAssertion: Buffer.from(freshFrame),
      sessionId: null,
      stage: 'fresh',
    });
    const resumedActivation = fixtureActivation(resumeSeed, 'load', sessionId, fingerprint);
    const control = fixtureControl(resumeSeed, String(resumedActivation.activation_id), sessionId);
    const controlRaw = canonicalize(control);
    if (!controlRaw) throw new Error('signed pause control payload encoding failed');
    const controlFrame = canonicalize({
      jsonrpc: '2.0',
      method: 'session/pause',
      params: { _meta: { waylandNanoControl: control }, sessionId },
    });
    if (!controlFrame) throw new Error('signed pause control encoding failed');
    const resumeFrame = fixtureActivationFrame(resumedActivation, 'session/load', sessionId);
    const resumed = command(executable, ['acp-host'], {
      env: resumeEnvironment,
      input: `${resumeFrame}\n${controlFrame}\n`,
    });
    if (resumed.status !== 0) throw new Error('signed control/resume ACP activation failed');
    const resumeResponse = responseLines(resumed.stdout).find((response) => response.id === 2);
    const resumeResult = resumeResponse?.result as Record<string, unknown> | undefined;
    const resumeMeta = resumeResult?._meta as Record<string, unknown> | undefined;
    if (!resumeMeta?.waylandNanoActivationReceipt) {
      throw new Error(
        `Nano resume response omitted its receipt: ${JSON.stringify({
          error: resumeResponse?.error,
          hasResult: Boolean(resumeResult),
          responseIds: responseLines(resumed.stdout)
            .map((response) => response.id ?? null)
            .slice(0, 16),
          resultKeys: resumeResult ? Object.keys(resumeResult).toSorted() : [],
        })}`
      );
    }
    await verifyActivationReceipt(resumeMeta?.waylandNanoActivationReceipt, resumeFixture, {
      activation: resumedActivation,
      decision: 'admitted',
      executableSha256,
      issuerId: resumeFixture.desktop_issuer_id,
      keyId: resumeFixture.desktop_issuer_key_id,
      principalId: resumeFixture.desktop_principal_id,
      productSubjectId: resumeFixture.desktop_subject_id,
      projectId: resumeFixture.project_id,
      rawAssertion: Buffer.from(resumeFrame),
      sessionId,
      stage: 'resume',
    });
    const admission = await readFile(path.join(resumeHome, 'activation', 'admission.jsonl'), 'utf8');
    const controlValue = extractControlReceipt(
      admission,
      String(resumedActivation.activation_id),
      String(control.nonce)
    );
    if (!controlValue) {
      const controls = admission
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>)
        .filter((record) => record.record_type === 'control')
        .slice(0, 8)
        .map((record) => ({
          activation_id: record.activation_id,
          kind: record.kind,
          nonce: record.nonce,
          outcome: record.outcome,
          sequence: record.sequence,
        }));
      throw new Error(`Nano control receipt is missing: ${JSON.stringify(controls)}`);
    }
    await verifyActivationReceipt(controlValue, resumeFixture, {
      activation: resumedActivation,
      control: 'pause',
      decision: 'control_accepted',
      executableSha256,
      issuerId: resumeFixture.desktop_issuer_id,
      keyId: resumeFixture.desktop_issuer_key_id,
      principalId: resumeFixture.desktop_principal_id,
      productSubjectId: resumeFixture.desktop_subject_id,
      projectId: resumeFixture.project_id,
      rawAssertion: Buffer.from(controlRaw),
      sessionId,
      stage: 'control',
    });
    await assertNoPositiveRowLeakage(resumeHome);
  } finally {
    resumeSeed.fill(0);
  }
}

async function createProductionBootstrapMaterial(root: string) {
  const home = path.join(root, 'production-bootstrap-home');
  const keys = path.join(root, 'production-bootstrap-keys');
  await mkdir(home);
  await mkdir(keys);
  await makeOwnerOnly(home);
  await makeOwnerOnly(keys);
  const roles = ['admin_root', 'recovery_root', 'receipt_signer', 'local_cli_issuer'] as const;
  const refs: string[] = [];
  for (const [index, role] of roles.entries()) {
    const key = path.join(keys, `${role}.seed`);
    const ref = path.join(keys, `${role}.keyref`);
    const seed = randomBytes(32);
    seed[0] ^= index + 1;
    await writePrivateFile(key, seed);
    seed.fill(0);
    await writePrivateFile(ref, JSON.stringify({ provider: 'file', reference: key, role }));
    refs.push(ref);
  }
  return Object.freeze({ home, refs: Object.freeze(refs) });
}

async function prepareProductionBootstrap(
  executable: string,
  executableSha256: string,
  checkout: string,
  root: string
): Promise<Readonly<{ challengePath: string; preparationPath: string; resultPath: string }>> {
  if (process.platform !== 'win32') throw new Error('signed offline bootstrap preparation requires Windows');
  const { home, refs } = await createProductionBootstrapMaterial(root);
  const challengePath = path.join(root, 'offline-bootstrap-challenge.json');
  const preparationPath = path.join(root, 'offline-bootstrap-preparation.json');
  const resultPath = path.join(root, 'production-bootstrap-result.json');
  const challengeArgs = [
    'admin',
    'offline-bootstrap-challenge',
    '--admin-root-keyref',
    refs[0],
    '--recovery-root-keyref',
    refs[1],
    '--receipt-signer-keyref',
    refs[2],
    '--local-cli-keyref',
    refs[3],
    '--output',
    challengePath,
  ];
  const challenge = command(executable, challengeArgs, { env: { ...process.env, NANO_HOME: home } });
  if (challenge.status !== 0) throw new Error(`Nano offline bootstrap challenge refused (${challenge.status})`);
  const challengeBytes = await readFile(challengePath);
  const challengeDocument = JSON.parse(challengeBytes.toString('utf8')) as Record<string, unknown>;
  if (
    challengeDocument.schema !== 'wayland.nano.offline-bootstrap-challenge/v1' ||
    challengeDocument.nano_source_commit_sha !== SOURCE_SHA ||
    challengeDocument.cargo_lock_sha256 !== LOCK_SHA256 ||
    challengeDocument.executable_sha256 !== executableSha256
  )
    throw new Error('Nano offline bootstrap challenge identity mismatch');
  await writePrivateFile(
    preparationPath,
    JSON.stringify({
      cargoLockSha256: LOCK_SHA256,
      challengePath,
      challengeSha256: sha256(challengeBytes),
      executablePath: executable,
      executableSha256,
      keyReferences: refs,
      nanoCheckoutPath: checkout,
      nanoHomePath: home,
      resultPath,
      schema: 'wayland.desktop.nano-offline-bootstrap-preparation/v1',
      sourceCommit: SOURCE_SHA,
    })
  );
  return Object.freeze({ challengePath, preparationPath, resultPath });
}

async function completeProductionBootstrap(preparationPath: string, authorizationPath: string): Promise<string> {
  if (process.platform !== 'win32') throw new Error('signed offline bootstrap apply requires Windows');
  if (!path.isAbsolute(preparationPath) || !path.isAbsolute(authorizationPath))
    throw new Error('offline bootstrap preparation and authorization paths must be absolute');
  const preparation = JSON.parse(await readFile(preparationPath, 'utf8')) as Record<string, unknown>;
  const expectedKeys = [
    'cargoLockSha256',
    'challengePath',
    'challengeSha256',
    'executablePath',
    'executableSha256',
    'keyReferences',
    'nanoCheckoutPath',
    'nanoHomePath',
    'resultPath',
    'schema',
    'sourceCommit',
  ];
  if (
    JSON.stringify(Object.keys(preparation).toSorted()) !== JSON.stringify(expectedKeys.toSorted()) ||
    preparation.schema !== 'wayland.desktop.nano-offline-bootstrap-preparation/v1' ||
    preparation.sourceCommit !== SOURCE_SHA ||
    preparation.cargoLockSha256 !== LOCK_SHA256 ||
    typeof preparation.challengePath !== 'string' ||
    typeof preparation.challengeSha256 !== 'string' ||
    typeof preparation.executablePath !== 'string' ||
    typeof preparation.executableSha256 !== 'string' ||
    typeof preparation.nanoCheckoutPath !== 'string' ||
    typeof preparation.nanoHomePath !== 'string' ||
    typeof preparation.resultPath !== 'string' ||
    !Array.isArray(preparation.keyReferences) ||
    preparation.keyReferences.length !== 4 ||
    !preparation.keyReferences.every((value) => typeof value === 'string')
  )
    throw new Error('offline bootstrap preparation is invalid');
  const challengeBytes = await readFile(preparation.challengePath);
  if (sha256(challengeBytes) !== preparation.challengeSha256)
    throw new Error('offline bootstrap challenge hash mismatch');
  const authorizationBytes = await readFile(authorizationPath);
  const applyArgs = [
    'admin',
    'offline-bootstrap-apply',
    '--admin-root-keyref',
    preparation.keyReferences[0],
    '--recovery-root-keyref',
    preparation.keyReferences[1],
    '--receipt-signer-keyref',
    preparation.keyReferences[2],
    '--local-cli-keyref',
    preparation.keyReferences[3],
    '--authorization',
    authorizationPath,
  ];
  const result = command(preparation.executablePath, applyArgs, {
    env: { ...process.env, NANO_HOME: preparation.nanoHomePath },
  });
  if (result.status !== 0) throw new Error(`Nano offline bootstrap authorization refused (${result.status})`);
  const lines = result.stdout.trimEnd().split(/\r?\n/);
  if (lines.length !== 3 || !lines[0].startsWith('offline bootstrap result: '))
    throw new Error('Nano offline bootstrap output is invalid');
  const bootstrapReceipt = Buffer.from(lines[1]);
  const consumptionReceipt = Buffer.from(lines[2]);
  const bootstrap = JSON.parse(lines[1]) as Record<string, unknown>;
  const consumption = JSON.parse(lines[2]) as Record<string, unknown>;
  if (
    bootstrap.schema !== 'wayland.nano.admin-bootstrap-receipt/v1' ||
    consumption.schema !== 'wayland.nano.offline-bootstrap-consumption-receipt/v1' ||
    consumption.owner_directed_agent_operated_bootstrap !== true ||
    consumption.physical_console_presence_replaced !== true ||
    consumption.remote_session_observed !== true ||
    consumption.nano_source_commit_sha !== SOURCE_SHA ||
    consumption.cargo_lock_sha256 !== LOCK_SHA256 ||
    consumption.executable_sha256 !== preparation.executableSha256
  )
    throw new Error('Nano offline bootstrap signed receipts are invalid');
  const root = path.dirname(preparationPath);
  const bootstrapReceiptPath = path.join(root, 'admin-bootstrap-receipt.json');
  const consumptionReceiptPath = path.join(root, 'offline-bootstrap-consumption-receipt.json');
  await writePrivateFile(bootstrapReceiptPath, bootstrapReceipt);
  await writePrivateFile(consumptionReceiptPath, consumptionReceipt);
  const authorityPath = path.join(preparation.nanoHomePath, 'activation', 'authority.jsonl');
  await writePrivateFile(
    preparation.resultPath,
    JSON.stringify({
      authorityJournalPath: authorityPath,
      authorityJournalSha256: sha256(await readFile(authorityPath)),
      authorizationPath,
      authorizationSha256: sha256(authorizationBytes),
      bootstrapReceiptPath,
      bootstrapReceiptSha256: sha256(bootstrapReceipt),
      cargoLockSha256: LOCK_SHA256,
      challengePath: preparation.challengePath,
      challengeSha256: preparation.challengeSha256,
      consumptionReceiptPath,
      consumptionReceiptSha256: sha256(consumptionReceipt),
      executablePath: preparation.executablePath,
      executableSha256: preparation.executableSha256,
      nanoCheckoutPath: preparation.nanoCheckoutPath,
      outcome: String(consumption.result),
      schema: 'wayland.desktop.nano-offline-bootstrap-result/v1',
      sourceCommit: SOURCE_SHA,
    })
  );
  return preparation.resultPath;
}

async function verifyProductionBootstrapResult(
  resultPath: string
): Promise<Readonly<{ checkout: string; executable: string; executableSha256: string }>> {
  if (!path.isAbsolute(resultPath)) throw new Error('production bootstrap result path must be absolute');
  const parsed = JSON.parse(await readFile(resultPath, 'utf8')) as Record<string, unknown>;
  const expectedKeys = [
    'authorityJournalPath',
    'authorityJournalSha256',
    'authorizationPath',
    'authorizationSha256',
    'bootstrapReceiptPath',
    'bootstrapReceiptSha256',
    'cargoLockSha256',
    'challengePath',
    'executableSha256',
    'executablePath',
    'nanoCheckoutPath',
    'challengeSha256',
    'consumptionReceiptPath',
    'consumptionReceiptSha256',
    'outcome',
    'schema',
    'sourceCommit',
  ];
  if (JSON.stringify(Object.keys(parsed).toSorted()) !== JSON.stringify(expectedKeys.toSorted())) {
    throw new Error('production bootstrap result fields are not closed');
  }
  if (
    parsed.schema !== 'wayland.desktop.nano-offline-bootstrap-result/v1' ||
    !['bootstrapped', 'already_bootstrapped_same_authorization'].includes(String(parsed.outcome)) ||
    parsed.sourceCommit !== SOURCE_SHA ||
    parsed.cargoLockSha256 !== LOCK_SHA256 ||
    typeof parsed.executableSha256 !== 'string' ||
    typeof parsed.executablePath !== 'string' ||
    typeof parsed.nanoCheckoutPath !== 'string'
  ) {
    throw new Error('production bootstrap result identity mismatch');
  }
  const authorityPath = parsed.authorityJournalPath;
  const authorizationPath = parsed.authorizationPath;
  const bootstrapReceiptPath = parsed.bootstrapReceiptPath;
  const challengePath = parsed.challengePath;
  const consumptionReceiptPath = parsed.consumptionReceiptPath;
  if (
    typeof authorityPath !== 'string' ||
    typeof authorizationPath !== 'string' ||
    typeof bootstrapReceiptPath !== 'string' ||
    typeof challengePath !== 'string' ||
    typeof consumptionReceiptPath !== 'string'
  ) {
    throw new Error('production bootstrap evidence paths are invalid');
  }
  if (sha256(await readFile(authorityPath)) !== parsed.authorityJournalSha256) {
    throw new Error('production bootstrap authority journal hash mismatch');
  }
  const authorizationBytes = await readFile(authorizationPath);
  const challengeBytes = await readFile(challengePath);
  if (sha256(authorizationBytes) !== parsed.authorizationSha256 || sha256(challengeBytes) !== parsed.challengeSha256)
    throw new Error('offline bootstrap challenge/authorization hash mismatch');
  const challengeText = challengeBytes.toString('utf8');
  const challenge = JSON.parse(challengeText) as Record<string, unknown>;
  if (canonicalize(challenge) !== challengeText || challenge.schema !== 'wayland.nano.offline-bootstrap-challenge/v1')
    throw new Error('offline bootstrap challenge is not canonical bound evidence');
  const authorization = verifyCanonicalEvidenceSignature(
    authorizationBytes,
    OFFLINE_AUTHORIZATION_PUBLIC_KEY,
    OFFLINE_AUTHORIZATION_DOMAIN
  );
  if (
    authorization.schema !== 'wayland.nano.offline-bootstrap-authorization/v1' ||
    authorization.authorization_key_id !== 'phase2-offline-bootstrap-2026-08-30' ||
    authorization.authorization_id !== 'phase2-windows-exact-artifact-bootstrap-1' ||
    authorization.authorization_counter !== 1 ||
    authorization.challenge_sha256 !== parsed.challengeSha256 ||
    authorization.signature_alg !== 'Ed25519' ||
    authorization.owner_directed_agent_operated_bootstrap !== true ||
    authorization.physical_console_presence_replaced !== true ||
    authorization.remote_session_observed !== true
  )
    throw new Error('offline bootstrap authorization scope is invalid');
  for (const [key, value] of Object.entries(challenge)) {
    if (key === 'schema') continue;
    if (authorization[key] !== value) throw new Error(`offline bootstrap authorization changed challenge field ${key}`);
  }
  const authorityBytes = await readFile(authorityPath);
  const authorityLines = authorityBytes.toString('utf8').trimEnd().split('\n');
  if (authorityLines.length !== 2 || !authorityBytes.toString('utf8').endsWith('\n'))
    throw new Error('offline bootstrap authority journal shape is invalid');
  const authorityRecords = authorityLines.map((line) => {
    const record = JSON.parse(line) as Record<string, unknown>;
    if (canonicalize(record) !== line) throw new Error('offline bootstrap authority journal is noncanonical');
    return record;
  });
  if (
    authorityRecords[0].record_type !== 'bootstrap' ||
    authorityRecords[0].sequence !== 1 ||
    authorityRecords[1].record_type !== 'bootstrap_receipt' ||
    authorityRecords[1].sequence !== 2 ||
    typeof authorityRecords[0].snapshot !== 'object' ||
    authorityRecords[0].snapshot === null
  )
    throw new Error('offline bootstrap authority journal records are invalid');
  const snapshot = authorityRecords[0].snapshot as Record<string, unknown>;
  const receiptPublic = snapshot.receipt_signer_public_key;
  if (
    !Array.isArray(receiptPublic) ||
    receiptPublic.length !== 32 ||
    !receiptPublic.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)
  )
    throw new Error('offline bootstrap receipt signer key is invalid');
  const receiptPublicKey = Buffer.from(receiptPublic);
  const bootstrapBytes = await readFile(bootstrapReceiptPath);
  const consumptionBytes = await readFile(consumptionReceiptPath);
  if (
    sha256(bootstrapBytes) !== parsed.bootstrapReceiptSha256 ||
    sha256(consumptionBytes) !== parsed.consumptionReceiptSha256
  )
    throw new Error('offline bootstrap receipt hash mismatch');
  const bootstrap = verifyCanonicalEvidenceSignature(bootstrapBytes, receiptPublicKey, ADMIN_BOOTSTRAP_DOMAIN);
  const consumption = verifyCanonicalEvidenceSignature(consumptionBytes, receiptPublicKey, OFFLINE_RECEIPT_DOMAIN);
  const snapshotCanonical = canonicalize(snapshot);
  if (!snapshotCanonical) throw new Error('offline bootstrap authority snapshot is not canonicalizable');
  const adminPublic = snapshot.admin_public_key;
  if (
    !Array.isArray(adminPublic) ||
    adminPublic.length !== 32 ||
    !adminPublic.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)
  )
    throw new Error('offline bootstrap administrator key is invalid');
  const recoveryPublic = snapshot.recovery_public_key;
  const localCliPublic = snapshot.local_cli_public_key;
  for (const [label, value] of [
    ['recovery', recoveryPublic],
    ['local CLI', localCliPublic],
  ] as const) {
    if (
      !Array.isArray(value) ||
      value.length !== 32 ||
      !value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
    )
      throw new Error(`offline bootstrap ${label} key is invalid`);
  }
  if (
    bootstrap.schema !== 'wayland.nano.admin-bootstrap-receipt/v1' ||
    bootstrap.admin_id !== snapshot.admin_id ||
    bootstrap.admin_epoch !== snapshot.admin_epoch ||
    bootstrap.authority_snapshot_sha256 !== sha256(snapshotCanonical) ||
    bootstrap.root_public_key_fingerprint !== sha256(Buffer.from(adminPublic)) ||
    bootstrap.authority_journal_position !== 1 ||
    authorityRecords[1].receipt !== bootstrapBytes.toString('utf8') ||
    consumption.schema !== 'wayland.nano.offline-bootstrap-consumption-receipt/v1' ||
    consumption.owner_directed_agent_operated_bootstrap !== true ||
    consumption.physical_console_presence_replaced !== true ||
    consumption.remote_session_observed !== true ||
    consumption.nano_source_commit_sha !== SOURCE_SHA ||
    consumption.cargo_lock_sha256 !== LOCK_SHA256 ||
    consumption.executable_sha256 !== parsed.executableSha256 ||
    consumption.authorization_sha256 !== parsed.authorizationSha256 ||
    consumption.challenge_sha256 !== parsed.challengeSha256 ||
    consumption.proposed_snapshot_sha256 !== authorization.proposed_snapshot_sha256 ||
    consumption.proposed_snapshot_sha256 !== challenge.proposed_snapshot_sha256 ||
    consumption.bootstrap_receipt_sha256 !== sha256(bootstrapBytes) ||
    consumption.authority_bootstrap_position !== 1 ||
    consumption.authority_receipt_position !== 2 ||
    consumption.receipt_signer_key_id !== bootstrap.receipt_signer_key_id ||
    consumption.nano_home_binding_sha256 !== challenge.nano_home_binding_sha256 ||
    challenge.admin_root_key_fingerprint !== sha256(Buffer.from(adminPublic)) ||
    challenge.recovery_root_key_fingerprint !== sha256(Buffer.from(recoveryPublic as number[])) ||
    challenge.receipt_signer_key_fingerprint !== sha256(receiptPublicKey) ||
    challenge.local_cli_issuer_key_fingerprint !== sha256(Buffer.from(localCliPublic as number[]))
  )
    throw new Error('offline bootstrap receipts are not canonical signed Nano evidence');
  for (const field of [
    'operation_id',
    'authorization_id',
    'authorization_key_id',
    'authorization_counter',
    'machine_binding_sha256',
    'owner_sid_binding_sha256',
    'nano_home_binding_sha256',
    'proposed_snapshot_sha256',
    'admin_root_key_fingerprint',
    'recovery_root_key_fingerprint',
    'receipt_signer_key_fingerprint',
    'local_cli_issuer_key_fingerprint',
    'nano_source_commit_sha',
    'cargo_lock_sha256',
    'executable_sha256',
  ]) {
    if (consumption[field] !== authorization[field])
      throw new Error(`offline bootstrap consumption receipt changed authorization field ${field}`);
  }
  for (const field of [
    'global_reservation_position',
    'target_accepted_position',
    'target_completion_position',
    'global_completion_position',
  ]) {
    if (!Number.isSafeInteger(consumption[field]) || Number(consumption[field]) <= 0)
      throw new Error(`offline bootstrap journal position ${field} is invalid`);
  }
  const checkout = await realpath(parsed.nanoCheckoutPath);
  const executable = await realpath(parsed.executablePath);
  if (mustRun('git', ['-C', checkout, 'rev-parse', 'HEAD']).stdout.trim() !== SOURCE_SHA) {
    throw new Error('production bootstrap Nano checkout source mismatch');
  }
  if (sha256(await readFile(path.join(checkout, 'Cargo.lock'))) !== LOCK_SHA256) {
    throw new Error('production bootstrap Nano checkout lock mismatch');
  }
  if (sha256(await readFile(executable)) !== parsed.executableSha256) {
    throw new Error('production bootstrap executable hash mismatch');
  }
  return Object.freeze({ checkout, executable, executableSha256: parsed.executableSha256 });
}

export async function verifyWaylandNanoActivation(args: readonly string[]): Promise<void> {
  const options = parseOptions(args);
  if (!options.requireFreshNanoCheckout) throw new Error('fresh Nano checkout is mandatory');
  await validateCommittedEvidence();
  if (Boolean(options.productionBootstrapPreparation) !== Boolean(options.offlineBootstrapAuthorization))
    throw new Error('offline bootstrap completion requires both preparation and authorization');
  if (options.prepareProductionBootstrap && options.productionBootstrapPreparation)
    throw new Error('offline bootstrap prepare and completion modes are mutually exclusive');
  if (options.productionBootstrapResult && options.productionBootstrapPreparation)
    throw new Error('offline bootstrap result import and completion modes are mutually exclusive');
  if (options.productionBootstrapPreparation && !options.requireProductionBootstrap)
    throw new Error('offline bootstrap completion requires --require-production-bootstrap');
  const completedResult =
    options.productionBootstrapPreparation && options.offlineBootstrapAuthorization
      ? await completeProductionBootstrap(options.productionBootstrapPreparation, options.offlineBootstrapAuthorization)
      : options.productionBootstrapResult;
  if (options.requireProductionBootstrap && completedResult) {
    const imported = await verifyProductionBootstrapResult(completedResult);
    const target = path.dirname(path.dirname(imported.executable));
    const helperCheckout = await realpath(path.join(path.dirname(completedResult), 'nano-helper-source'));
    const fixtureHelper = await realpath(
      path.join(
        target,
        'helper-target',
        'release',
        process.platform === 'win32' ? 'nano-phase2-fixture.exe' : 'nano-phase2-fixture'
      )
    );
    runNanoContractMatrix(imported.checkout, target);
    await runHelperContractMatrix(helperCheckout, path.join(target, 'helper-target'), path.dirname(completedResult));
    await runPositiveProcessRows(imported.executable, fixtureHelper, imported.checkout, path.dirname(completedResult));
    if (options.requireTerminalRefusal) {
      await runTerminalRefusalProcesses(
        imported.executable,
        fixtureHelper,
        imported.checkout,
        path.dirname(completedResult)
      );
    }
    const desktopHome = path.join(path.dirname(completedResult), `desktop-stacks-${randomBytes(6).toString('hex')}`);
    const desktopFixture = await createNanoOwnedFixture(
      fixtureHelper,
      path.dirname(completedResult),
      desktopHome,
      imported.checkout,
      imported.executable,
      imported.executableSha256
    );
    const env = {
      ...process.env,
      WAYLAND_NANO_EXACT_CHECKOUT: imported.checkout,
      WAYLAND_NANO_EXACT_EXECUTABLE: imported.executable,
      WAYLAND_NANO_EXACT_EXECUTABLE_SHA256: imported.executableSha256,
      WAYLAND_NANO_EXACT_FIXTURE: fixtureHelper,
      WAYLAND_NANO_FIXTURE_DESKTOP_HOME: desktopFixture.home,
      WAYLAND_NANO_FIXTURE_DESKTOP_ISSUER_SEED: desktopFixture.desktop_issuer_seed_path,
      WAYLAND_NANO_FIXTURE_RECEIPT_PUBLIC_KEY: desktopFixture.receipt_signer_public_key,
    };
    mustRun(
      'bun',
      ['run', 'test:vitest', '--', 'tests/integration/process/acp/waylandNanoExactArtifact.test.ts'],
      process.cwd(),
      env
    );
    process.stdout.write(
      `${JSON.stringify({
        cargoLockSha256: LOCK_SHA256,
        executableSha256: imported.executableSha256,
        productionBootstrap: 'signed_offline_consumption_receipt_verified',
        sourceCommit: SOURCE_SHA,
      })}\n`
    );
    return;
  }
  const root = await createEvidenceRoot();
  let preserveRoot = false;
  try {
    const checkout = await freshCheckout(root);
    const helperCheckout = process.platform === 'win32' ? await freshHelperCheckout(root) : null;
    const target = path.join(root, 'cargo-target');
    const binaries = await buildProfiles(checkout, helperCheckout, target);
    const releaseBytes = await readFile(binaries.release);
    const executableSha = sha256(releaseBytes);
    if (options.prepareProductionBootstrap) {
      const prepared = await prepareProductionBootstrap(binaries.release, executableSha, checkout, root);
      preserveRoot = true;
      process.stdout.write(
        `${JSON.stringify({
          challengePath: prepared.challengePath,
          executableSha256: executableSha,
          preparationPath: prepared.preparationPath,
          resultPath: prepared.resultPath,
          schema: 'wayland.desktop.nano-offline-bootstrap-preparation/v1',
        })}\n`
      );
      return;
    }
    runNanoContractMatrix(checkout, target);
    if (process.platform !== 'win32') {
      process.stdout.write(
        `${JSON.stringify({
          cargoLockSha256: LOCK_SHA256,
          executableSha256: executableSha,
          matrix: 'cross-platform-nano-contracts',
          sourceCommit: SOURCE_SHA,
        })}\n`
      );
      return;
    }
    if (!helperCheckout || !binaries.fixture) throw new Error('Windows Phase 2 helper build is missing');
    await runHelperContractMatrix(helperCheckout, path.join(target, 'helper-target'), root);
    await runPositiveProcessRows(binaries.release, binaries.fixture, checkout, root);
    if (options.requireTerminalRefusal)
      await runTerminalRefusalProcesses(binaries.release, binaries.fixture, checkout, root);
    if (options.requireProductionBootstrap) {
      if (!completedResult) {
        throw new Error(
          'signed offline bootstrap result missing; prepare a challenge, authorize it out of band, then apply it'
        );
      }
      await verifyProductionBootstrapResult(completedResult);
    }
    const desktopHome = path.join(root, `desktop-stacks-${randomBytes(6).toString('hex')}`);
    const desktopFixture = await createNanoOwnedFixture(
      binaries.fixture,
      root,
      desktopHome,
      checkout,
      binaries.release,
      executableSha
    );
    const env = {
      ...process.env,
      WAYLAND_NANO_EXACT_CHECKOUT: checkout,
      WAYLAND_NANO_EXACT_EXECUTABLE: binaries.release,
      WAYLAND_NANO_EXACT_EXECUTABLE_SHA256: executableSha,
      WAYLAND_NANO_EXACT_FIXTURE: binaries.fixture,
      WAYLAND_NANO_FIXTURE_DESKTOP_HOME: desktopFixture.home,
      WAYLAND_NANO_FIXTURE_DESKTOP_ISSUER_SEED: desktopFixture.desktop_issuer_seed_path,
      WAYLAND_NANO_FIXTURE_RECEIPT_PUBLIC_KEY: desktopFixture.receipt_signer_public_key,
    };
    mustRun(
      'bun',
      ['run', 'test:vitest', '--', 'tests/integration/process/acp/waylandNanoExactArtifact.test.ts'],
      process.cwd(),
      env
    );
    process.stdout.write(
      `${JSON.stringify({ cargoLockSha256: LOCK_SHA256, executableSha256: executableSha, sourceCommit: SOURCE_SHA })}\n`
    );
  } finally {
    if (!preserveRoot) await rm(root, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  verifyWaylandNanoActivation(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
