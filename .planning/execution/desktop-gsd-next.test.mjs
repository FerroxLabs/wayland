import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  SelectionError,
  computeEffectiveWaves,
  discoverPlans,
  pairConflicts,
  selectNext,
  validateEntryReceipt,
} from './desktop-gsd-next.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SELECTOR = join(HERE, 'desktop-gsd-next.mjs')
const OPERATOR = join(HERE, 'DESKTOP-GSD-OPERATOR.md')
const temporaryRoots = []

afterEach(() => {
  while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true })
})

function temporaryRoot() {
  const root = mkdtempSync(join(tmpdir(), 'desktop-gsd-next-'))
  temporaryRoots.push(root)
  mkdirSync(join(root, '.planning', 'execution'), { recursive: true })
  return root
}

function admissionConfig(overrides = {}) {
  return {
    schema_version: 1,
    verifier_contract: {
      schema_version: 2,
      entry_mode: 'entry',
      required_empty_field: 'accepted_targets',
    },
    plan_entry_gates: {},
    hard_denied_phase_numbers: [5, 6],
    seam_patterns: {
      lock: ['(^|/)(package-lock\\.json|Cargo\\.lock)$'],
      migration: ['(^|/)migrations?(/|$)'],
      schema: ['(^|/)schemas?(/|$)'],
      generated: ['(^|/)generated(/|$)'],
      config: ['(^|/)(package\\.json|tsconfig\\.json)$'],
    },
    ...overrides,
  }
}

function writeAdmission(root, overrides = {}) {
  const path = join(root, '.planning', 'execution', 'DESKTOP-GSD-ADMISSION.json')
  writeFileSync(path, `${JSON.stringify(admissionConfig(overrides), null, 2)}\n`)
  return path
}

function plan(id, overrides = {}) {
  const [phase] = id.split('-').map(Number)
  return {
    id,
    phaseNumber: phase,
    declaredWave: 1,
    autonomous: true,
    dependencies: [],
    files: [`src/${id}.ts`],
    authoritySeams: [],
    planPath: `.planning/phases/WLD-${id}/${id}-PLAN.md`,
    summaryPath: `.planning/phases/WLD-${id}/${id}-SUMMARY.md`,
    complete: false,
    ...overrides,
  }
}

function select(root, plans, options = {}) {
  const admissionPath = options.admissionPath ?? writeAdmission(root, options.admission ?? {})
  return selectNext({
    repoRoot: root,
    expectedBranch: options.expectedBranch ?? 'test-branch',
    expectedHead: options.expectedHead ?? 'a'.repeat(40),
    admissionPath,
    plans,
    skipGitCheck: options.skipGitCheck ?? true,
    verifyGate: options.verifyGate,
    worktreeParent: join(root, 'worktrees'),
  })
}

function expectSelectionError(fn, code) {
  assert.throws(fn, (error) => error instanceof SelectionError && error.code === code)
}

function writePlan(root, id, fields = {}) {
  const [phase, number] = id.split('-')
  const phaseDir = join(root, '.planning', 'phases', `WLD-${phase}-fixture`)
  mkdirSync(phaseDir, { recursive: true })
  const dependencies = fields.dependencies ?? []
  const files = fields.files ?? [`src/${id}.ts`]
  const text = [
    '---',
    `phase: WLD-${phase}-fixture`,
    `plan: ${Number(number)}`,
    `wave: ${fields.wave ?? 1}`,
    'depends_on:',
    ...dependencies.map((dependency) => `  - ${dependency}`),
    'files_modified:',
    ...files.map((file) => `  - ${file}`),
    `autonomous: ${fields.autonomous ?? true}`,
    'requirements: []',
    '---',
    '',
    '<objective>fixture</objective>',
    '',
  ].join('\n')
  writeFileSync(join(phaseDir, `${id}-PLAN.md`), text)
}

function initializeGit(root) {
  const run = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  run('init', '-b', 'test-branch')
  run('config', 'user.email', 'desktop-gsd-test@example.invalid')
  run('config', 'user.name', 'Desktop GSD Test')
  run('add', '.')
  run('commit', '-m', 'fixture')
  return { run, head: run('rev-parse', 'HEAD') }
}

function snapshot(root) {
  const paths = []
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue
      const absolute = join(directory, entry.name)
      if (entry.isDirectory()) walk(absolute)
      else paths.push(absolute)
    }
  }
  walk(root)
  return paths.toSorted().map((path) => [path.slice(root.length), statSync(path).mode, readFileSync(path).toString('base64')])
}

test('discovers plan frontmatter and computes dependency-derived waves', () => {
  const root = temporaryRoot()
  writePlan(root, '01-01')
  writePlan(root, '01-02', { dependencies: ['01-01'], wave: 99 })
  const plans = discoverPlans(root)
  assert.deepEqual(plans.map((item) => item.id), ['01-01', '01-02'])
  assert.deepEqual(Object.fromEntries(computeEffectiveWaves(plans)), { '01-01': 1, '01-02': 2 })
})

test('unrelated checkpoint does not block an unlocked autonomous plan', () => {
  const root = temporaryRoot()
  const output = select(root, [
    plan('01-01', { autonomous: false }),
    plan('01-02'),
  ])
  assert.deepEqual(output.candidate_plans.map((item) => item.plan_id), ['01-02'])
  assert.deepEqual(output.blocked, [])
})

test('explicit checkpoint dependency blocks even when a forged summary exists', () => {
  const root = temporaryRoot()
  const output = select(root, [
    plan('01-01', { autonomous: false, complete: true }),
    plan('01-02', { dependencies: ['01-01'] }),
  ])
  assert.deepEqual(output.candidate_plans, [])
  assert.deepEqual(output.blocked, [{
    plan_id: '01-02',
    blockers: [{ dependency: '01-01', reason: 'explicit-checkpoint-dependency' }],
  }])
})

test('incomplete autonomous predecessor is selected while its successor remains blocked', () => {
  const root = temporaryRoot()
  const output = select(root, [
    plan('01-01'),
    plan('01-02', { dependencies: ['01-01'] }),
  ])
  assert.deepEqual(output.candidate_plans.map((item) => item.plan_id), ['01-01'])
  assert.equal(output.blocked[0].plan_id, '01-02')
  assert.equal(output.blocked[0].blockers[0].reason, 'incomplete-construction-dependency')
})

test('unknown dependencies and cycles fail closed', () => {
  expectSelectionError(
    () => computeEffectiveWaves([plan('01-01', { dependencies: ['01-99'] })]),
    'UNKNOWN_DEPENDENCY',
  )
  expectSelectionError(
    () => computeEffectiveWaves([
      plan('01-01', { dependencies: ['01-02'] }),
      plan('01-02', { dependencies: ['01-01'] }),
    ]),
    'DEPENDENCY_CYCLE',
  )
})

test('exact files and ancestor directories conflict', () => {
  const seams = []
  assert.deepEqual(pairConflicts(plan('01-01', { files: ['src/a.ts'] }), plan('01-02', { files: ['src/a.ts'] }), seams), ['path:src/a.ts'])
  assert.deepEqual(pairConflicts(plan('01-01', { files: ['src'] }), plan('01-02', { files: ['src/a.ts'] }), seams), ['path:src<->src/a.ts'])
})

test('shared lock schema config generated migration and named authority seams serialize', () => {
  const root = temporaryRoot()
  const cases = [
    ['package-lock.json', 'nested/package-lock.json', 'seam:lock'],
    ['schemas/a.json', 'schemas/b.json', 'seam:schema'],
    ['package.json', 'nested/package.json', 'seam:config'],
    ['generated/a.ts', 'generated/b.ts', 'seam:generated'],
    ['migrations/001.sql', 'migrations/002.sql', 'seam:migration'],
  ]
  for (const [left, right, expected] of cases) {
    const output = select(root, [plan('01-01', { files: [left] }), plan('01-02', { files: [right] })])
    assert.equal(output.candidate_plans.length, 1)
    assert.ok(output.serialized_after[0].conflicts.some((conflict) => conflict.reason === expected))
  }
  const output = select(root, [
    plan('01-01', { authoritySeams: ['receipt-authority'] }),
    plan('01-02', { authoritySeams: ['receipt-authority'] }),
  ])
  assert.equal(output.serialized_after[0].conflicts[0].reason, 'authority:receipt-authority')
})

test('entry receipts are target-free schema-v2 construction evidence only', () => {
  const good = {
    schema_version: 2,
    gate_id: 'M2-entry',
    mode: 'entry',
    ok: true,
    prerequisites: [{ id: 'core', ok: true }],
    accepted_targets: [],
  }
  assert.deepEqual(validateEntryReceipt(good, 'M2-entry').accepted_targets, [])
  for (const [mutation, code] of [
    [{ schema_version: 1 }, 'VERIFIER_VERSION'],
    [{ gate_id: 'wrong' }, 'VERIFIER_GATE'],
    [{ mode: 'acceptance' }, 'VERIFIER_MODE'],
    [{ ok: false }, 'ENTRY_PREREQUISITES'],
    [{ prerequisites: [{ id: 'core', ok: false }] }, 'ENTRY_PREREQUISITES'],
    [{ accepted_targets: ['desktop'] }, 'ENTRY_TARGETS'],
  ]) {
    expectSelectionError(() => validateEntryReceipt({ ...good, ...mutation }, 'M2-entry'), code)
  }
})

test('mapped Phase 2 construction is admitted and unmapped work is denied', () => {
  const root = temporaryRoot()
  const gate = 'M2-entry'
  const receipt = {
    schema_version: 2,
    gate_id: gate,
    mode: 'entry',
    ok: true,
    prerequisites: [{ ok: true }],
    accepted_targets: [],
  }
  const output = select(root, [plan('02-01')], {
    admission: { plan_entry_gates: { '02-01': gate } },
    verifyGate: () => receipt,
  })
  assert.equal(output.candidate_plans[0].authenticated_admission.gate_id, gate)
  expectSelectionError(() => select(root, [plan('02-01')]), 'UNMAPPED_ADMISSION')
})

test('Phase 5 and 6 construction remain hard denied', () => {
  const root = temporaryRoot()
  expectSelectionError(() => select(root, [plan('05-01')]), 'PHASE_HARD_DENIED')
  expectSelectionError(() => select(root, [plan('06-01')]), 'PHASE_HARD_DENIED')
})

test('malformed plan frontmatter fails closed', () => {
  const root = temporaryRoot()
  const phaseDir = join(root, '.planning', 'phases', 'WLD-01-fixture')
  mkdirSync(phaseDir, { recursive: true })
  writeFileSync(join(phaseDir, '01-01-PLAN.md'), 'not frontmatter\n')
  expectSelectionError(() => discoverPlans(root), 'MALFORMED_FRONTMATTER')
})

test('wrong repository branch HEAD and dirty state fail before selection', () => {
  const root = temporaryRoot()
  writeAdmission(root)
  writePlan(root, '01-01')
  const git = initializeGit(root)
  const base = {
    repoRoot: root,
    expectedBranch: 'test-branch',
    expectedHead: git.head,
    admissionPath: join(root, '.planning', 'execution', 'DESKTOP-GSD-ADMISSION.json'),
    plans: [],
  }
  assert.deepEqual(selectNext(base).candidate_plans, [])
  expectSelectionError(() => selectNext({ ...base, repoRoot: join(root, '.planning') }), 'WRONG_REPOSITORY')
  expectSelectionError(() => selectNext({ ...base, expectedBranch: 'wrong' }), 'WRONG_BRANCH')
  expectSelectionError(() => selectNext({ ...base, expectedHead: '0'.repeat(40) }), 'STALE_HEAD')
  writeFileSync(join(root, 'dirty.txt'), 'dirty')
  expectSelectionError(() => selectNext(base), 'DIRTY_TREE')
})

test('CLI pass and failure are byte-for-byte read-only', () => {
  const root = temporaryRoot()
  writeAdmission(root)
  writePlan(root, '01-01')
  const git = initializeGit(root)
  const before = snapshot(root)
  const statusBefore = git.run('status', '--porcelain=v1', '--untracked-files=all')
  const pass = spawnSync(process.execPath, [
    SELECTOR,
    '--repo-root', root,
    '--expected-branch', 'test-branch',
    '--expected-head', git.head,
  ], { encoding: 'utf8' })
  assert.equal(pass.status, 0, pass.stderr)
  assert.equal(JSON.parse(pass.stdout).candidate_plans[0].plan_id, '01-01')
  const fail = spawnSync(process.execPath, [
    SELECTOR,
    '--repo-root', root,
    '--expected-branch', 'test-branch',
    '--expected-head', '0'.repeat(40),
  ], { encoding: 'utf8' })
  assert.equal(fail.status, 1)
  assert.equal(JSON.parse(fail.stderr).error.code, 'STALE_HEAD')
  assert.deepEqual(snapshot(root), before)
  assert.equal(git.run('status', '--porcelain=v1', '--untracked-files=all'), statusBefore)
})

test('operator contract prohibits stock routing and preserves authority', () => {
  const contract = readFileSync(OPERATOR, 'utf8').replace(/\s+/g, ' ')
  for (const required of [
    'Stock `gsd-progress --next`',
    'manually create exactly one named clean worktree',
    'Integrate one commit at a time',
    'never proves packet acceptance',
    'accepted_targets: []',
    'Phase 5 and Phase 6 are hard-denied',
    'Merge to main',
    'Sean-only authorization gates',
  ]) assert.ok(contract.toLowerCase().includes(required.toLowerCase()), `missing operator rule: ${required}`)
})

test('repository Phase 1 candidate set is deterministic without mutating planning', () => {
  const repoRoot = resolve(HERE, '..', '..')
  const admissionPath = join(HERE, 'DESKTOP-GSD-ADMISSION.json')
  const before = snapshot(join(repoRoot, '.planning'))
  const first = selectNext({
    repoRoot,
    expectedBranch: 'test',
    expectedHead: 'a'.repeat(40),
    admissionPath,
    skipGitCheck: true,
  })
  const second = selectNext({
    repoRoot,
    expectedBranch: 'test',
    expectedHead: 'a'.repeat(40),
    admissionPath,
    skipGitCheck: true,
  })
  assert.deepEqual(second, first)
  assert.ok(first.candidate_plans.some((candidate) => candidate.plan_id === '01-40'))
  assert.deepEqual(snapshot(join(repoRoot, '.planning')), before)
})
