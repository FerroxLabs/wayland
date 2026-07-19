import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
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
  schedulePlansForTest,
  selectNext,
  validateEntryReceipt,
  invokeVerifier,
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
    max_parallel_plans: 3,
    verifier: {
      path: '/Users/seandonahoe/.local/bin/wayland-gsd-gate',
      digest: 'sha256:5d0bade731431ca1d6d440ab27680ea8d46daaba4a5982b16c8f12c6be9f2398',
      timeout_ms: 30_000,
      max_output_bytes: 1_048_576,
    },
    external_ownership_roots: [],
    seam_patterns: {
      lock: ['(^|/)(package-lock\\.json|Cargo\\.lock)$'],
      migration: ['(^|/)migrations?(/|$)'],
      schema: ['(^|/)schemas?(/|$)'],
      generated: ['(^|/)generated(/|$)'],
      config: ['(^|/)(package\\.json|tsconfig\\.json)$'],
      execution_authority: ['(^|/)\\.planning/execution(/|$)'],
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
  return schedulePlansForTest({
    repoRoot: root,
    expectedBranch: options.expectedBranch ?? 'test-branch',
    expectedHead: options.expectedHead ?? 'a'.repeat(40),
    admissionPath,
    plans,
    skipGitCheck: options.skipGitCheck ?? true,
    verifyGate: options.verifyGate,
    worktreeParent: join(dirname(root), `${root.split('/').at(-1)}-worktrees`),
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
    dependencies.length ? 'depends_on:' : 'depends_on: []',
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

test('canonical ownership aliases conflict and unsafe ownership is rejected', () => {
  assert.deepEqual(
    pairConflicts(plan('01-01', { files: ['src/a.ts'] }), plan('01-02', { files: ['./src/a.ts'] }), []),
    ['path:src/a.ts'],
  )
  assert.deepEqual(
    pairConflicts(plan('01-01', { files: ['src/a.ts'] }), plan('01-02', { files: ['src/dir/../a.ts'] }), []),
    ['path:src/a.ts'],
  )
  const root = temporaryRoot()
  expectSelectionError(() => select(root, [plan('01-01', { files: ['../escape.ts'] })]), 'UNSAFE_OWNERSHIP_PATH')
  expectSelectionError(() => select(root, [plan('01-01', { files: ['/tmp/escape.ts'] })]), 'UNSAFE_OWNERSHIP_PATH')
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
  const caseInsensitive = select(root, [
    plan('01-01', { files: ['PACKAGE-LOCK.JSON'] }),
    plan('01-02', { files: ['nested/package-lock.json'] }),
  ])
  assert.ok(caseInsensitive.serialized_after[0].conflicts.some((conflict) => conflict.reason === 'seam:lock'))
  const output = select(root, [
    plan('01-01', { authoritySeams: ['receipt-authority'] }),
    plan('01-02', { authoritySeams: ['receipt-authority'] }),
  ])
  assert.equal(output.serialized_after[0].conflicts[0].reason, 'authority:receipt-authority')
  assert.deepEqual(
    pairConflicts(
      plan('01-01', { authoritySeams: ['Receipt-Authority'] }),
      plan('01-02', { authoritySeams: ['receipt-authority'] }),
      [],
    ),
    ['authority:receipt-authority'],
  )
})

test('entry receipts are target-free schema-v2 construction evidence only', () => {
  const good = {
    schema_version: 2,
    gate_id: 'M2-entry',
    mode: 'entry',
    ok: true,
    prerequisites: {
      ok: true,
      required: [{ id: 'core', ok: true }],
      alternatives: [],
      exclusive_alternatives: [],
    },
    accepted_targets: [],
  }
  assert.deepEqual(validateEntryReceipt({
    ...good,
    prerequisites: {
      ok: true,
      required: [{ id: 'required', ok: true }],
      alternatives: [],
      exclusive_alternatives: [],
    },
  }, 'M2-entry').accepted_targets, [])
  assert.deepEqual(validateEntryReceipt(good, 'M2-entry').accepted_targets, [])
  for (const [mutation, code] of [
    [{ schema_version: 1 }, 'VERIFIER_VERSION'],
    [{ gate_id: 'wrong' }, 'VERIFIER_GATE'],
    [{ mode: 'acceptance' }, 'VERIFIER_MODE'],
    [{ ok: false }, 'ENTRY_PREREQUISITES'],
    [{ prerequisites: { ...good.prerequisites, required: [{ id: 'core', ok: false }] } }, 'ENTRY_PREREQUISITES'],
    [{ prerequisites: [] }, 'ENTRY_PREREQUISITES'],
    [{ prerequisites: { ok: true, required: [], alternatives: [] } }, 'ENTRY_PREREQUISITES'],
    [{
      prerequisites: {
        ok: true,
        required: [{ id: 'visible', ok: true }],
        alternatives: [],
        exclusive_alternatives: [],
        hidden_claims: [{ id: 'hidden-contradiction', ok: false }],
      },
    }, 'ENTRY_PREREQUISITES'],
    [{
      prerequisites: {
        ...good.prerequisites,
        items: [{ id: 'mixed-representation', ok: true }],
      },
    }, 'ENTRY_PREREQUISITES'],
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
    prerequisites: {
      ok: true,
      required: [{ ok: true }],
      alternatives: [],
      exclusive_alternatives: [],
    },
    accepted_targets: [],
  }
  const output = select(root, [plan('02-01')], {
    admission: { plan_entry_gates: { '02-01': gate } },
    verifyGate: () => receipt,
  })
  assert.equal(output.operational, false)
  assert.equal(output.candidate_plans[0].authenticated_admission, null)
  assert.deepEqual(output.candidate_plans[0].next_commands, [])
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

test('valid YAML indentation preserves dependencies instead of unlocking a root', () => {
  const root = temporaryRoot()
  writePlan(root, '01-01')
  writePlan(root, '01-02', { dependencies: ['01-01'] })
  const path = join(root, '.planning', 'phases', 'WLD-01-fixture', '01-02-PLAN.md')
  writeFileSync(path, readFileSync(path, 'utf8').replace('  - 01-01', '    - 01-01'))
  assert.deepEqual(discoverPlans(root).find((item) => item.id === '01-02').dependencies, ['01-01'])
})

test('filename directory and frontmatter phase identity must agree', () => {
  const root = temporaryRoot()
  const phaseDir = join(root, '.planning', 'phases', 'WLD-05-release')
  mkdirSync(phaseDir, { recursive: true })
  writeFileSync(join(phaseDir, '01-99-PLAN.md'), [
    '---',
    'phase: WLD-05-release',
    'plan: 99',
    'wave: 1',
    'depends_on: []',
    'files_modified: []',
    'autonomous: true',
    '---',
    '',
  ].join('\n'))
  expectSelectionError(() => discoverPlans(root), 'PHASE_ID_MISMATCH')
})

test('plan identity requires an integer rather than string coercion', () => {
  const root = temporaryRoot()
  writePlan(root, '01-01')
  const path = join(root, '.planning', 'phases', 'WLD-01-fixture', '01-01-PLAN.md')
  writeFileSync(path, readFileSync(path, 'utf8').replace('plan: 1', 'plan: [1]'))
  expectSelectionError(() => discoverPlans(root), 'PLAN_ID_MISMATCH')
})

test('plan and summary symlinks cannot change selection under an identical HEAD', () => {
  const root = temporaryRoot()
  writePlan(root, '01-01')
  const phaseDir = join(root, '.planning', 'phases', 'WLD-01-fixture')
  const planPath = join(phaseDir, '01-01-PLAN.md')
  const externalPlan = join(temporaryRoot(), 'external-plan.md')
  writeFileSync(externalPlan, readFileSync(planPath))
  unlinkSync(planPath)
  symlinkSync(externalPlan, planPath)
  expectSelectionError(() => discoverPlans(root), 'PLAN_IDENTITY')

  unlinkSync(planPath)
  writeFileSync(planPath, readFileSync(externalPlan))
  const externalSummary = join(temporaryRoot(), 'external-summary.md')
  writeFileSync(externalSummary, 'forged completion\n')
  symlinkSync(externalSummary, join(phaseDir, '01-01-SUMMARY.md'))
  expectSelectionError(() => discoverPlans(root), 'SUMMARY_IDENTITY')
})

test('external admission and verifier CLI overrides are rejected', () => {
  const root = temporaryRoot()
  const externalRoot = temporaryRoot()
  writeAdmission(root)
  writePlan(root, '01-01')
  const git = initializeGit(root)
  const forged = join(externalRoot, 'forged-admission.json')
  writeFileSync(forged, '{}\n')
  expectSelectionError(() => selectNext({
    repoRoot: root,
    expectedBranch: 'test-branch',
    expectedHead: git.head,
    admissionPath: forged,
    plans: [],
  }), 'TEST_AUTHORITY')
  for (const argument of ['--admission', '--verifier']) {
    const result = spawnSync(process.execPath, [
      SELECTOR,
      '--repo-root', root,
      '--expected-branch', 'test-branch',
      '--expected-head', git.head,
      argument, forged,
    ], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stderr).error.code, 'ARGUMENT')
  }
})

function writeVerifier(root, body) {
  const path = join(root, 'verifier.mjs')
  writeFileSync(path, `#!/usr/bin/env node\n${body}\n`)
  chmodSync(path, 0o755)
  const digest = `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`
  return { path: realpathSync(path), digest, timeout_ms: 1000, max_output_bytes: 4096 }
}

test('verifier identity timeout and rejection output fail closed without leaking stderr', () => {
  const root = temporaryRoot()
  const rejecting = writeVerifier(root, "process.stderr.write('SECRET-VALUE'); process.exit(7)")
  assert.throws(
    () => invokeVerifier(rejecting, 'M2-entry', root),
    (error) => error.code === 'VERIFIER_REJECTED' &&
      error.details.exit_code === 7 &&
      error.details.stderr_bytes === 12 &&
      !JSON.stringify(error).includes('SECRET-VALUE'),
  )
  expectSelectionError(
    () => invokeVerifier({ ...rejecting, digest: `sha256:${'0'.repeat(64)}` }, 'M2-entry', root),
    'VERIFIER_IDENTITY',
  )
  const hanging = { ...writeVerifier(root, 'setInterval(() => {}, 1000)'), timeout_ms: 100 }
  expectSelectionError(() => invokeVerifier(hanging, 'M2-entry', root), 'VERIFIER_TIMEOUT')
})

test('allowlisted external ownership remains conflict-safe when installation plans unlock', () => {
  const root = temporaryRoot()
  const externalRoot = realpathSync(root)
  const output = select(root, [
    plan('01-01', { files: [`${externalRoot}/bin/tool`] }),
    plan('01-02', { files: [`${externalRoot}/bin`] }),
  ], { admission: { external_ownership_roots: [externalRoot] } })
  assert.equal(output.candidate_plans.length, 1)
  assert.match(output.serialized_after[0].conflicts[0].reason, /^path:/)
})

test('external ownership allowlists use canonical containment through symlinks', () => {
  const root = temporaryRoot()
  const externalRoot = temporaryRoot()
  const outsideRoot = temporaryRoot()
  symlinkSync(outsideRoot, join(externalRoot, 'escape'))
  expectSelectionError(
    () => select(root, [plan('01-01', { files: [join(externalRoot, 'escape', 'tool')] })], {
      admission: { external_ownership_roots: [externalRoot] },
    }),
    'UNSAFE_OWNERSHIP_PATH',
  )
})

test('filesystem root cannot become a universal external ownership allowlist', () => {
  const root = temporaryRoot()
  expectSelectionError(
    () => select(root, [plan('01-01', { files: ['/etc/passwd'] })], {
      admission: { external_ownership_roots: ['/'] },
    }),
    'ADMISSION_SCHEMA',
  )
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
  }
  assert.deepEqual(selectNext(base).candidate_plans.map((candidate) => candidate.plan_id), ['01-01'])
  expectSelectionError(() => selectNext({ ...base, repoRoot: join(root, '.planning') }), 'WRONG_REPOSITORY')
  expectSelectionError(() => selectNext({ ...base, expectedBranch: 'wrong' }), 'WRONG_BRANCH')
  expectSelectionError(() => selectNext({ ...base, expectedHead: '0'.repeat(40) }), 'STALE_HEAD')
  writeFileSync(join(root, 'dirty.txt'), 'dirty')
  expectSelectionError(() => selectNext(base), 'DIRTY_TREE')
})

test('operational selection is bound to exact HEAD through verifier completion', () => {
  const root = temporaryRoot()
  writePlan(root, '02-01')
  const planPath = join(root, '.planning', 'phases', 'WLD-02-fixture', '02-01-PLAN.md')
  const receipt = JSON.stringify({
    schema_version: 2,
    gate_id: 'M2-entry',
    mode: 'entry',
    ok: true,
    prerequisites: {
      ok: true,
      required: [{ id: 'core', ok: true }],
      alternatives: [],
      exclusive_alternatives: [],
    },
    accepted_targets: [],
  })
  const verifier = writeVerifier(root, [
    "import { appendFileSync } from 'node:fs'",
    `appendFileSync(${JSON.stringify(planPath)}, '\\nmutation-after-head-check\\n')`,
    `process.stdout.write(${JSON.stringify(receipt)})`,
  ].join('\n'))
  writeAdmission(root, {
    plan_entry_gates: { '02-01': 'M2-entry' },
    verifier,
  })
  const git = initializeGit(root)
  expectSelectionError(() => selectNext({
    repoRoot: root,
    expectedBranch: 'test-branch',
    expectedHead: git.head,
  }), 'DIRTY_TREE')
})

test('candidate selection obeys the configured concurrency bound', () => {
  const root = temporaryRoot()
  const output = select(root, [plan('01-01'), plan('01-02'), plan('01-03'), plan('01-04')])
  assert.deepEqual(output.candidate_plans.map((item) => item.plan_id), ['01-01', '01-02', '01-03'])
  assert.deepEqual(output.serialized_after.at(-1), {
    plan_id: '01-04',
    conflicts: [{ with: null, reason: 'concurrency-limit:3' }],
  })
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

test('operational selection rejects injected plans and emits argv-safe worktree instructions', () => {
  const root = temporaryRoot()
  writeAdmission(root)
  writePlan(root, '01-01')
  const git = initializeGit(root)
  expectSelectionError(() => selectNext({
    repoRoot: root,
    expectedBranch: 'test-branch',
    expectedHead: git.head,
    plans: [],
  }), 'TEST_AUTHORITY')
  const output = selectNext({
    repoRoot: root,
    expectedBranch: 'test-branch',
    expectedHead: git.head,
    worktreeParent: join(dirname(root), 'spaces ; $()', 'worktrees'),
  })
  const command = output.candidate_plans[0].next_commands[0]
  assert.equal(command.executable, 'git')
  assert.deepEqual(command.arguments.slice(0, 4), ['worktree', 'add', '-b', 'worktree-agent-desktop-01-01'])
  assert.equal(command.arguments.length, 6)
  assert.match(command.arguments[4], /spaces ; \$\(\)/)
  assert.equal(typeof command.arguments[4], 'string')
  assert.equal(command.cwd, realpathSync(root))
})

test('operational selection rejects every fixture authority injection', () => {
  const root = temporaryRoot()
  writeAdmission(root)
  writePlan(root, '01-01')
  const git = initializeGit(root)
  const base = { repoRoot: root, expectedBranch: 'test-branch', expectedHead: git.head }
  for (const mutation of [
    { skipGitCheck: true },
    { plans: [plan('02-01')] },
    { verifyGate: () => ({ ok: true }) },
    { fixtureMode: true },
    { admissionPath: join(root, '.planning', 'execution', 'DESKTOP-GSD-ADMISSION.json') },
  ]) expectSelectionError(() => selectNext({ ...base, ...mutation }), 'TEST_AUTHORITY')

  const inherited = Object.assign(Object.create({ skipGitCheck: true }), base)
  expectSelectionError(() => selectNext(inherited), 'TEST_AUTHORITY')
})

test('admission requires every mandatory nonempty seam registry class', () => {
  const root = temporaryRoot()
  const plans = [plan('01-01')]
  expectSelectionError(() => select(root, plans, { admission: { seam_patterns: {} } }), 'ADMISSION_SCHEMA')
  const missingExecution = { ...admissionConfig().seam_patterns }
  delete missingExecution.execution_authority
  expectSelectionError(
    () => select(root, plans, { admission: { seam_patterns: missingExecution } }),
    'ADMISSION_SCHEMA',
  )
  expectSelectionError(
    () => select(root, plans, { admission: { seam_patterns: { ...admissionConfig().seam_patterns, lock: [] } } }),
    'ADMISSION_SCHEMA',
  )
})

test('symlinked worktree parent cannot resolve inside the integration repository', () => {
  const root = temporaryRoot()
  writeAdmission(root)
  writePlan(root, '01-01')
  const git = initializeGit(root)
  const external = temporaryRoot()
  const link = join(external, 'worktrees')
  symlinkSync(join(root, '.planning'), link)
  expectSelectionError(() => selectNext({
    repoRoot: root,
    expectedBranch: 'test-branch',
    expectedHead: git.head,
    worktreeParent: link,
  }), 'WORKTREE_PARENT')
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
  const first = schedulePlansForTest({
    repoRoot,
    expectedBranch: 'test',
    expectedHead: 'a'.repeat(40),
    admissionPath,
    skipGitCheck: true,
  })
  const second = schedulePlansForTest({
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
