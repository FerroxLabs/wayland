#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { REPORT_KEYS } = require('./verifyPlatformPackageSmokes');

const COMMIT = /^[a-f0-9]{40,64}$/;

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} has missing or unknown critical fields`);
  }
  return value;
}

function regularFile(file, label) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0) {
    throw new Error(`${label} is not a non-empty regular file`);
  }
  return { bytes: fs.readFileSync(file), size: stat.size };
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${label} is invalid`);
  return parsed;
}

function createProtectedPlatformObservation(input, dependencies = {}) {
  exactKeys(
    input,
    ['target', 'candidate', 'reportPath', 'installerPath', 'outputPath', 'workflow', 'producer'],
    'protected platform observer input'
  );
  const candidate = exactKeys(input.candidate, ['commit', 'tree'], 'protected platform observer candidate');
  if (!COMMIT.test(String(candidate.commit)) || !COMMIT.test(String(candidate.tree))) {
    throw new Error('protected platform observer candidate is malformed');
  }
  const [platform, arch] = String(input.target).split('-');
  const livePlatform = dependencies.platform || process.platform;
  const liveArch = dependencies.arch || process.arch;
  if (platform !== livePlatform || arch !== liveArch) {
    throw new Error(`protected platform observer runner ${livePlatform}-${liveArch} cannot prove ${input.target}`);
  }
  const reportFile = regularFile(input.reportPath, 'platform smoke report');
  const installerFile = regularFile(input.installerPath, 'platform installer');
  let report;
  try {
    report = JSON.parse(reportFile.bytes.toString('utf8'));
  } catch {
    throw new Error('platform smoke report is not valid JSON');
  }
  exactKeys(report, REPORT_KEYS, 'platform smoke report');
  if (
    report.contract !== 'wayland-platform-package-smoke/2' ||
    report.target !== input.target ||
    report.sourceIdentity?.commit !== candidate.commit ||
    report.sourceIdentity?.tree !== candidate.tree
  ) {
    throw new Error('platform smoke report belongs to a stale, foreign, or wrong-target candidate');
  }
  if (
    path.basename(report.installer) !== path.basename(input.installerPath) ||
    `sha256:${report.installerSnapshotBytesSha256}` !== sha256(installerFile.bytes)
  ) {
    throw new Error('platform smoke report is not bound to exact installer bytes');
  }
  if (
    report.electron?.booted !== true ||
    report.electron?.rendererReady !== true ||
    report.shutdown?.parentExit !== 'zero' ||
    report.shutdown?.subsystemCleanup !== 'completed-with-structured-proof' ||
    report.shutdown?.descendantsRemaining !== 0
  ) {
    throw new Error('platform smoke report does not prove native boot, renderer, and shutdown');
  }
  const workflow = exactKeys(
    input.workflow,
    ['repository', 'workflow', 'ref', 'runId', 'runAttempt', 'runnerOs', 'runnerArch'],
    'protected platform observer workflow'
  );
  if (
    workflow.repository !== 'FerroxLabs/wayland' ||
    workflow.workflow !== '.github/workflows/protected-platform-package-observer.yml' ||
    workflow.ref !== 'refs/heads/release-trust-v1'
  ) {
    throw new Error('protected platform observer workflow identity is invalid');
  }
  workflow.runId = positiveInteger(workflow.runId, 'workflow run id');
  workflow.runAttempt = positiveInteger(workflow.runAttempt, 'workflow run attempt');
  const producer = exactKeys(
    input.producer,
    ['repository', 'runId', 'runAttempt', 'candidateCommit'],
    'protected platform producer identity'
  );
  if (producer.repository !== 'FerroxLabs/wayland' || producer.candidateCommit !== candidate.commit) {
    throw new Error('protected platform producer identity is invalid');
  }
  producer.runId = positiveInteger(producer.runId, 'producer run id');
  producer.runAttempt = positiveInteger(producer.runAttempt, 'producer run attempt');

  const observerScript = regularFile(
    path.join(__dirname, '..', 'platform-package-smoke.mjs'),
    'protected platform observer script'
  );
  const receipt = {
    contract: 'wayland-protected-platform-package-observation/1.0',
    target: input.target,
    candidate: { commit: candidate.commit, tree: candidate.tree },
    report: {
      fileName: path.basename(input.reportPath),
      sha256: sha256(reportFile.bytes),
      sizeBytes: reportFile.size,
    },
    installer: {
      fileName: path.basename(input.installerPath),
      sha256: sha256(installerFile.bytes),
      sizeBytes: installerFile.size,
    },
    nativeObservation: {
      platform,
      arch,
      booted: true,
      rendererReady: true,
      shutdownComplete: true,
      executableSha256: `sha256:${report.executableSha256}`,
      appAsarSha256: `sha256:${report.appAsarSha256}`,
      processTreeIdentitySha256: report.processTreeIdentitySha256,
    },
    workflow,
    producer,
    observerScriptSha256: sha256(observerScript.bytes),
    authority: 'protected-native-package-observer',
  };
  fs.writeFileSync(input.outputPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  const known = new Set(['target', 'commit', 'tree', 'report', 'installer', 'out']);
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const key = String(flag || '').replace(/^--/, '');
    if (!known.has(key) || !argv[index + 1]) throw new Error(`invalid argument: ${flag || '<missing>'}`);
    values[key] = argv[index + 1];
  }
  if (Object.keys(values).length !== known.size) throw new Error('all observer arguments are required');
  return values;
}

module.exports = { createProtectedPlatformObservation };

if (require.main === module) {
  try {
    const values = parseArgs(process.argv.slice(2));
    const protectedSigningJob = process.env.WAYLAND_PROTECTED_SIGNING_JOB === 'true';
    const observedPlatform = process.env.WAYLAND_OBSERVED_PLATFORM;
    const observedArch = process.env.WAYLAND_OBSERVED_ARCH;
    if (protectedSigningJob && (!observedPlatform || !observedArch)) {
      throw new Error('protected signing job omitted native observer identity');
    }
    createProtectedPlatformObservation(
      {
        target: values.target,
        candidate: { commit: values.commit, tree: values.tree },
        reportPath: path.resolve(values.report),
        installerPath: path.resolve(values.installer),
        outputPath: path.resolve(values.out),
        workflow: {
          repository: process.env.GITHUB_REPOSITORY,
          workflow: process.env.GITHUB_WORKFLOW_REF
            ?.split('@')[0]
            ?.replace(`${process.env.GITHUB_REPOSITORY}/`, ''),
          ref: process.env.GITHUB_REF,
          runId: process.env.GITHUB_RUN_ID,
          runAttempt: process.env.GITHUB_RUN_ATTEMPT,
          runnerOs: process.env.RUNNER_OS,
          runnerArch: process.env.RUNNER_ARCH,
        },
        producer: {
          repository: process.env.GITHUB_REPOSITORY,
          runId: process.env.WAYLAND_PRODUCER_RUN_ID,
          runAttempt: process.env.WAYLAND_PRODUCER_RUN_ATTEMPT,
          candidateCommit: values.commit,
        },
      },
      protectedSigningJob ? { platform: observedPlatform, arch: observedArch } : {}
    );
  } catch (error) {
    process.stderr.write(`Protected platform observation rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
