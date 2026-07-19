#!/usr/bin/env node

import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile, realpath } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

function git(root, args) {
  return spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

function fail(errorCode) {
  console.error(JSON.stringify({ ok: false, error_code: errorCode }));
  process.exit(2);
}

async function main() {
  const configPath = join(homedir(), '.config/wayland-gsd/desktop-control.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const gateId = process.argv[2];

  if (config.schema_version !== 1 || !Array.isArray(config.keys)) fail('CONTROL_SCHEMA_INVALID');
  if (!/^[0-9a-f]{40}([0-9a-f]{24})?$/.test(config.control_commit ?? '')) fail('CONTROL_COMMIT_INVALID');
  if (!Array.isArray(config.controlled_paths) || config.controlled_paths.length === 0) fail('CONTROLLED_PATHS_MISSING');
  if (!config.accepted_packets || typeof config.accepted_packets !== 'object') fail('ACCEPTED_PACKET_REGISTRY_MISSING');
  if (!config.receipt_store || config.receipt_store.policy !== 'external-absolute-read-only-cas')
    fail('RECEIPT_STORE_POLICY_INVALID');
  if (!isAbsolute(config.receipt_store.path ?? '')) fail('RECEIPT_STORE_PATH_INVALID');
  if (!isAbsolute(config.verifier_lib_path ?? '')) fail('VERIFIER_LIBRARY_PATH_INVALID');
  if (!/^sha256:[0-9a-f]{64}$/.test(config.verifier_lib_digest ?? '')) fail('VERIFIER_LIBRARY_DIGEST_INVALID');
  if (!gateId) fail('GATE_ID_MISSING');

  const rootResult = git(process.cwd(), ['rev-parse', '--show-toplevel']);
  if (rootResult.status !== 0) fail('GIT_WORKTREE_REQUIRED');
  const projectRoot = rootResult.stdout.trim();
  const manifestPath = join(projectRoot, '.planning/execution/PACKET-GATES.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const commonResult = git(projectRoot, ['rev-parse', '--git-common-dir']);
  if (commonResult.status !== 0) fail('GIT_COMMON_DIRECTORY_UNAVAILABLE');
  const commonDir = await realpath(
    isAbsolute(commonResult.stdout.trim())
      ? commonResult.stdout.trim()
      : resolve(projectRoot, commonResult.stdout.trim())
  );
  if (commonDir !== (await realpath(config.git_common_dir))) fail('PINNED_REPOSITORY_MISMATCH');
  if ('receipt_directory' in manifest) fail('REPOSITORY_RECEIPT_OVERRIDE_FORBIDDEN');
  const receiptDirectory = await realpath(config.receipt_store.path);
  const projectReal = await realpath(projectRoot);
  if (
    receiptDirectory === projectReal ||
    receiptDirectory.startsWith(`${projectReal}/`) ||
    receiptDirectory === commonDir ||
    receiptDirectory.startsWith(`${commonDir}/`)
  ) {
    fail('RECEIPT_STORE_NOT_EXTERNAL');
  }

  const commitCheck = git(projectRoot, ['cat-file', '-e', `${config.control_commit}^{commit}`]);
  if (commitCheck.status !== 0) fail('CONTROL_COMMIT_NOT_FOUND');
  const ancestry = git(projectRoot, ['merge-base', '--is-ancestor', config.control_commit, 'HEAD']);
  if (ancestry.status !== 0) fail('CONTROL_COMMIT_ANCESTRY_MISMATCH');
  const expectedIntegrationHead = git(projectRoot, ['rev-parse', 'HEAD']).stdout.trim();

  for (const path of config.controlled_paths) {
    if (isAbsolute(path) || path.includes('..')) fail('CONTROLLED_PATH_UNSAFE');
    const diff = git(projectRoot, ['diff', '--quiet', config.control_commit, '--', path]);
    if (diff.status !== 0) fail('CONTROL_PLANE_DRIFT');
  }

  const verifierBytes = await readFile(config.verifier_lib_path);
  const verifierDigest = `sha256:${createHash('sha256').update(verifierBytes).digest('hex')}`;
  if (verifierDigest !== config.verifier_lib_digest) fail('VERIFIER_LIBRARY_DIGEST_MISMATCH');
  const { checkGate } = await import(pathToFileURL(config.verifier_lib_path));
  const result = await checkGate({
    gateId,
    projectRoot,
    receiptDirectory,
    manifestPath,
    contractsPath: join(projectRoot, manifest.contract_manifest),
    trustRootPath: configPath,
    authorizedCandidates: config.accepted_packets,
    expectedIntegrationHead,
  });
  const finalIntegrationHead = git(projectRoot, ['rev-parse', 'HEAD']).stdout.trim();
  if (finalIntegrationHead !== expectedIntegrationHead) fail('INTEGRATION_HEAD_CHANGED');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

await main().catch(() => fail('GATE_INTERNAL_ERROR'));
