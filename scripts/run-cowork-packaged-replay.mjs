#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const CONTRACT = 'wayland-desktop-cowork-package-replay/1.0';

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`M8_ARGUMENT_INVALID:${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`M8_ARGUMENT_VALUE_MISSING:${key}`);
    values[key.slice(2)] = value;
    index += 1;
  }
  return values;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function requireAbsoluteFile(value, label) {
  if (!value || !path.isAbsolute(value) || !fs.statSync(value, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`M8_${label}_INVALID:${value || '<missing>'}`);
  }
  return path.resolve(value);
}

function requireAbsoluteDirectory(value, label) {
  if (!value || !path.isAbsolute(value) || !fs.statSync(value, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`M8_${label}_INVALID:${value || '<missing>'}`);
  }
  return path.resolve(value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function fail(evidenceDir, stage, error, identity = {}) {
  const blocker = error instanceof Error ? error.message : String(error);
  const receipt = {
    contract: CONTRACT,
    status: 'failed',
    stage,
    blocker,
    ...identity,
    observedAt: new Date().toISOString(),
  };
  if (evidenceDir) writeJson(path.join(evidenceDir, 'receipt.json'), receipt);
  process.stderr.write(`${blocker}\n`);
  process.exitCode = 1;
}

let args;
let evidenceDir;
let userDataDir;
try {
  args = parseArgs(process.argv.slice(2));
  evidenceDir = path.resolve(args.evidence || path.join(ROOT, 'tests/e2e/results/cowork-packaged-replay'));
  if (!path.isAbsolute(evidenceDir)) throw new Error('M8_EVIDENCE_DIR_MUST_BE_ABSOLUTE');
  fs.mkdirSync(evidenceDir, { recursive: true, mode: 0o700 });

  const executable = requireAbsoluteFile(args.executable, 'PACKAGED_EXECUTABLE');
  const appAsar = requireAbsoluteFile(args.asar, 'PACKAGED_ASAR');
  const smokePath = requireAbsoluteFile(args['package-smoke-report'], 'PACKAGE_SMOKE_REPORT');
  const profileTemplate = requireAbsoluteDirectory(args['profile-template'], 'PROFILE_TEMPLATE');
  const candidateCommit = args.candidate;
  if (!/^[a-f0-9]{40,64}$/.test(candidateCommit || '')) {
    throw new Error(`M8_CANDIDATE_COMMIT_INVALID:${candidateCommit || '<missing>'}`);
  }

  const smoke = readJson(smokePath);
  const executableSha256 = sha256File(executable);
  const appAsarSha256 = sha256File(appAsar);
  const smokeSha256 = sha256File(smokePath);
  const identity = {
    candidateCommit,
    executable,
    executableSha256: `sha256:${executableSha256}`,
    appAsar,
    appAsarSha256: `sha256:${appAsarSha256}`,
    packageSmokeReport: smokePath,
    packageSmokeReportSha256: `sha256:${smokeSha256}`,
  };

  if (smoke.contract !== 'wayland-platform-package-smoke/2') throw new Error('M8_PACKAGE_SMOKE_CONTRACT_MISMATCH');
  if (smoke.sourceIdentity?.commit !== candidateCommit) throw new Error('M8_PACKAGE_SOURCE_COMMIT_MISMATCH');
  if (smoke.executableSha256 !== executableSha256) throw new Error('M8_PACKAGE_EXECUTABLE_DIGEST_MISMATCH');
  if (smoke.appAsarSha256 !== appAsarSha256) throw new Error('M8_PACKAGE_ASAR_DIGEST_MISMATCH');
  if (smoke.criticalResources !== 'verified') throw new Error('M8_PACKAGE_CRITICAL_RESOURCES_UNVERIFIED');
  if (smoke.electron?.booted !== true || smoke.electron?.rendererReady !== true) {
    throw new Error('M8_PACKAGE_RENDERER_PROOF_MISSING');
  }
  if (smoke.productionSandboxProof !== 'exercised') throw new Error('M8_PACKAGE_PRODUCTION_SANDBOX_UNPROVEN');

  const workspaceRoot = path.join(evidenceDir, 'workspaces');
  fs.rmSync(workspaceRoot, { recursive: true, force: true });
  fs.mkdirSync(workspaceRoot, { recursive: true, mode: 0o700 });
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-m8-cowork-profile-'));
  fs.cpSync(profileTemplate, userDataDir, { recursive: true, force: true });
  fs.chmodSync(userDataDir, 0o700);

  const command = path.join(ROOT, 'node_modules', '.bin', 'playwright');
  const commandArgs = [
    'test',
    '--config',
    path.join(ROOT, 'playwright.config.ts'),
    path.join(ROOT, 'tests/e2e/specs/cowork-packaged-replay.e2e.ts'),
    '--reporter=line',
    '--workers=1',
  ];
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    env: {
      ...process.env,
      WAYLAND_M8_EXECUTABLE: executable,
      WAYLAND_M8_USER_DATA_DIR: userDataDir,
      WAYLAND_M8_WORKSPACE_ROOT: workspaceRoot,
      WAYLAND_M8_EVIDENCE_ROOT: evidenceDir,
    },
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const fullLog = `${result.stdout || ''}${result.stderr || ''}`;
  const logPath = path.join(evidenceDir, 'playwright.log');
  fs.writeFileSync(logPath, fullLog, { mode: 0o600 });
  const journeyReceipts = fs
    .readdirSync(evidenceDir)
    .filter((name) => /^J(?:17|23-).+\.json$/.test(name))
    .toSorted()
    .map((name) => ({
      name,
      digest: `sha256:${sha256File(path.join(evidenceDir, name))}`,
      value: readJson(path.join(evidenceDir, name)),
    }));
  const status =
    result.status === 0 &&
    journeyReceipts.length === 3 &&
    journeyReceipts.every((item) => item.value.status === 'passed')
      ? 'passed'
      : 'failed';
  const receipt = {
    contract: CONTRACT,
    status,
    ...identity,
    command: [command, ...commandArgs],
    exitCode: result.status ?? 1,
    startedAt,
    completedAt: new Date().toISOString(),
    log: { path: logPath, digest: `sha256:${sha256File(logPath)}` },
    journeys: journeyReceipts.map(({ name, digest, value }) => ({
      name,
      digest,
      status: value.status,
      blocker: value.blocker,
    })),
  };
  writeJson(path.join(evidenceDir, 'receipt.json'), receipt);
  if (status !== 'passed') {
    process.stderr.write(`M8_PACKAGED_REPLAY_FAILED:${path.join(evidenceDir, 'receipt.json')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`${path.join(evidenceDir, 'receipt.json')}\n`);
  }
} catch (error) {
  fail(evidenceDir, 'preflight', error);
} finally {
  if (userDataDir) fs.rmSync(userDataDir, { recursive: true, force: true });
}
