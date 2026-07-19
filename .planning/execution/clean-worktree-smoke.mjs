import assert from 'node:assert/strict'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const projectRoot = new URL('../..', import.meta.url).pathname
const parent = await mkdtemp(join(tmpdir(), 'wayland-gsd-clean-'))
const worktree = join(parent, 'app')
const required = [
  '.planning/PROJECT.md',
  '.planning/REQUIREMENTS.md',
  '.planning/ROADMAP.md',
  '.planning/STATE.md',
  '.planning/config.json',
  '.planning/execution/PACKET-GATES.json',
  '.planning/execution/PACKET-CONTRACTS.json',
  '.planning/execution/check-packet-gate.mjs',
  '.planning/execution/packet-gate-lib.mjs',
  '.planning/execution/check-packet-gate.test.mjs',
  '.planning/execution/packet-gate-manifest.test.mjs',
  '.planning/execution/wayland-gsd-gate.mjs',
]

function git(args) {
  return spawnSync('git', ['-C', projectRoot, ...args], { encoding: 'utf8' })
}

try {
  const add = git(['worktree', 'add', '--detach', worktree, 'HEAD'])
  assert.equal(add.status, 0, add.stderr || add.stdout)
  for (const path of required) await access(join(worktree, path))
  const proof = spawnSync(process.execPath, ['.planning/execution/check-packet-gate.test.mjs'], {
    cwd: worktree,
    encoding: 'utf8',
  })
  assert.equal(proof.status, 0, proof.stderr || proof.stdout)
  assert.match(proof.stdout, /authenticated packet gate tests: PASS/)
  const manifestProof = spawnSync(process.execPath, ['.planning/execution/packet-gate-manifest.test.mjs'], {
    cwd: worktree,
    encoding: 'utf8',
  })
  assert.equal(manifestProof.status, 0, manifestProof.stderr || manifestProof.stdout)
  assert.match(manifestProof.stdout, /packet gate manifest tests: PASS/)
  console.log('clean worktree GSD smoke: PASS')
} finally {
  git(['worktree', 'remove', '--force', worktree])
  await rm(parent, { recursive: true, force: true })
}
