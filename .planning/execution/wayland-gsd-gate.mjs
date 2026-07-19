#!/usr/bin/env node

import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
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

for (const path of config.controlled_paths) {
  if (isAbsolute(path) || path.includes('..')) fail(`Unsafe controlled path: ${path}`)
  const diff = git(projectRoot, ['diff', '--quiet', config.control_commit, '--', path])
  if (diff.status !== 0) fail(`Control-plane drift from pinned commit: ${path}`)
}

const checker = join(projectRoot, '.planning/execution/check-packet-gate.mjs')
const result = spawnSync(process.execPath, [checker, gateId], {
  cwd: projectRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    WAYLAND_GSD_TRUST_ROOT: configPath,
    WAYLAND_GSD_CONTROL_COMMIT: config.control_commit,
  },
})
process.stdout.write(result.stdout)
process.stderr.write(result.stderr)
process.exit(result.status ?? 2)
