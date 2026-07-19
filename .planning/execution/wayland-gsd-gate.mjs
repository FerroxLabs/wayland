#!/usr/bin/env node

import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import { isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFile, realpath } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const configPath = join(homedir(), '.config/wayland-gsd/desktop-control.json')
const config = JSON.parse(await readFile(configPath, 'utf8'))
const gateId = process.argv[2]

function git(root, args) {
  return spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
}

function fail(message) {
  console.error(message)
  process.exit(2)
}

if (config.schema_version !== 1 || !Array.isArray(config.keys)) fail('Invalid external control/trust schema')
if (!/^[0-9a-f]{40}([0-9a-f]{24})?$/.test(config.control_commit ?? '')) fail('Invalid pinned control commit')
if (!Array.isArray(config.controlled_paths) || config.controlled_paths.length === 0) fail('No externally controlled paths')
if (!config.accepted_packets || typeof config.accepted_packets !== 'object') fail('No external accepted-packet registry')
if (!isAbsolute(config.verifier_lib_path ?? '')) fail('External verifier library path is not absolute')
if (!/^sha256:[0-9a-f]{64}$/.test(config.verifier_lib_digest ?? '')) fail('External verifier library digest is invalid')
if (!gateId) fail('Missing packet gate ID')

const rootResult = git(process.cwd(), ['rev-parse', '--show-toplevel'])
if (rootResult.status !== 0) fail('Not inside a Git worktree')
const projectRoot = rootResult.stdout.trim()
const commonResult = git(projectRoot, ['rev-parse', '--git-common-dir'])
if (commonResult.status !== 0) fail('Cannot resolve Git common directory')
const commonDir = await realpath(isAbsolute(commonResult.stdout.trim()) ? commonResult.stdout.trim() : resolve(projectRoot, commonResult.stdout.trim()))
if (commonDir !== await realpath(config.git_common_dir)) fail('Worktree does not belong to the externally pinned repository')

const commitCheck = git(projectRoot, ['cat-file', '-e', `${config.control_commit}^{commit}`])
if (commitCheck.status !== 0) fail('Pinned control commit does not exist')
const ancestry = git(projectRoot, ['merge-base', '--is-ancestor', config.control_commit, 'HEAD'])
if (ancestry.status !== 0) fail('Current candidate does not descend from the pinned control commit')
const expectedIntegrationHead = git(projectRoot, ['rev-parse', 'HEAD']).stdout.trim()

for (const path of config.controlled_paths) {
  if (isAbsolute(path) || path.includes('..')) fail(`Unsafe controlled path: ${path}`)
  const diff = git(projectRoot, ['diff', '--quiet', config.control_commit, '--', path])
  if (diff.status !== 0) fail(`Control-plane drift from pinned commit: ${path}`)
}

const verifierBytes = await readFile(config.verifier_lib_path)
const verifierDigest = `sha256:${createHash('sha256').update(verifierBytes).digest('hex')}`
if (verifierDigest !== config.verifier_lib_digest) fail('External verifier library digest mismatch')
const { checkGate } = await import(pathToFileURL(config.verifier_lib_path))
const manifestPath = join(projectRoot, '.planning/execution/PACKET-GATES.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const result = await checkGate({
  gateId,
  projectRoot,
  receiptDirectory: join(projectRoot, manifest.receipt_directory),
  manifestPath,
  contractsPath: join(projectRoot, manifest.contract_manifest),
  trustRootPath: configPath,
  authorizedCandidates: config.accepted_packets,
  expectedIntegrationHead,
})
const finalIntegrationHead = git(projectRoot, ['rev-parse', 'HEAD']).stdout.trim()
if (finalIntegrationHead !== expectedIntegrationHead) fail('Integration HEAD changed during gate verification')
console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
