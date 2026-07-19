#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PLAN_RE = /^(\d{2})-(\d{2})-PLAN\.md$/

export class SelectionError extends Error {
  constructor(code, message, details = undefined) {
    super(message)
    this.name = 'SelectionError'
    this.code = code
    this.details = details
  }
}

function parseScalar(value) {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
  if (trimmed === '[]') return []
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }
  return trimmed.replace(/^['"]|['"]$/g, '')
}

function frontmatter(text, source) {
  if (!text.startsWith('---\n')) {
    throw new SelectionError('MALFORMED_FRONTMATTER', `${source}: missing opening frontmatter delimiter`)
  }
  const end = text.indexOf('\n---\n', 4)
  if (end < 0) {
    throw new SelectionError('MALFORMED_FRONTMATTER', `${source}: missing closing frontmatter delimiter`)
  }

  const result = {}
  const lines = text.slice(4, end).split('\n')
  let listKey = null
  for (const [index, line] of lines.entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const listItem = line.match(/^\s{2}-\s+(.+)$/)
    if (listItem && listKey) {
      result[listKey].push(parseScalar(listItem[1]))
      continue
    }
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/)
    if (!match) {
      if (/^\s/.test(line)) continue
      throw new SelectionError(
        'MALFORMED_FRONTMATTER',
        `${source}:${index + 2}: unsupported frontmatter syntax`,
      )
    }
    const [, key, raw = ''] = match
    if (raw.trim() === '') {
      result[key] = []
      listKey = key
    } else {
      result[key] = parseScalar(raw)
      listKey = null
    }
  }
  return result
}

function listPhaseDirectories(phasesRoot) {
  if (!existsSync(phasesRoot)) {
    throw new SelectionError('MISSING_PHASES', `Missing planning phases directory: ${phasesRoot}`)
  }
  return readdirSync(phasesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(phasesRoot, entry.name))
    .toSorted()
}

export function discoverPlans(repoRoot) {
  const phasesRoot = join(repoRoot, '.planning', 'phases')
  const plans = []
  for (const phaseDir of listPhaseDirectories(phasesRoot)) {
    for (const name of readdirSync(phaseDir).toSorted()) {
      const match = name.match(PLAN_RE)
      if (!match) continue
      const path = join(phaseDir, name)
      const data = frontmatter(readFileSync(path, 'utf8'), relative(repoRoot, path))
      const id = `${match[1]}-${match[2]}`
      const phaseNumber = Number(match[1])
      if (String(data.plan).padStart(2, '0') !== match[2]) {
        throw new SelectionError('PLAN_ID_MISMATCH', `${relative(repoRoot, path)}: plan ID disagrees with filename`)
      }
      if (!Array.isArray(data.depends_on) || !Array.isArray(data.files_modified)) {
        throw new SelectionError('MALFORMED_PLAN', `${relative(repoRoot, path)}: missing dependency or ownership list`)
      }
      if (typeof data.autonomous !== 'boolean') {
        throw new SelectionError('MALFORMED_PLAN', `${relative(repoRoot, path)}: autonomous must be boolean`)
      }
      const summaryPath = join(phaseDir, `${id}-SUMMARY.md`)
      plans.push({
        id,
        phaseNumber,
        declaredWave: Number(data.wave),
        autonomous: data.autonomous,
        dependencies: data.depends_on.map(String),
        files: data.files_modified.map(String),
        authoritySeams: Array.isArray(data.authority_seams) ? data.authority_seams.map(String) : [],
        planPath: relative(repoRoot, path),
        summaryPath: relative(repoRoot, summaryPath),
        complete: existsSync(summaryPath),
      })
    }
  }
  const ids = new Set()
  for (const plan of plans) {
    if (ids.has(plan.id)) throw new SelectionError('DUPLICATE_PLAN', `Duplicate plan ID: ${plan.id}`)
    ids.add(plan.id)
  }
  return plans.toSorted((a, b) => a.id.localeCompare(b.id))
}

export function computeEffectiveWaves(plans) {
  const byId = new Map(plans.map((plan) => [plan.id, plan]))
  for (const plan of plans) {
    for (const dependency of plan.dependencies) {
      if (!byId.has(dependency)) {
        throw new SelectionError('UNKNOWN_DEPENDENCY', `${plan.id} depends on unknown plan ${dependency}`)
      }
    }
  }

  const state = new Map()
  const waves = new Map()
  function visit(id, trail = []) {
    if (state.get(id) === 'visiting') {
      throw new SelectionError('DEPENDENCY_CYCLE', `Dependency cycle: ${[...trail, id].join(' -> ')}`)
    }
    if (state.get(id) === 'done') return waves.get(id)
    state.set(id, 'visiting')
    const plan = byId.get(id)
    const wave = plan.dependencies.length
      ? Math.max(...plan.dependencies.map((dependency) => visit(dependency, [...trail, id]))) + 1
      : 1
    waves.set(id, wave)
    state.set(id, 'done')
    return wave
  }
  for (const plan of plans) visit(plan.id)
  return waves
}

function compileSeams(config) {
  const compiled = []
  for (const [name, patterns] of Object.entries(config.seam_patterns ?? {})) {
    for (const pattern of patterns) compiled.push({ name, regex: new RegExp(pattern) })
  }
  return compiled
}

function normalizedOwnedPath(path) {
  return path.replaceAll('\\', '/').replace(/\/$/, '')
}

function pairConflicts(left, right, seamPatterns) {
  const reasons = []
  for (const leftPath of left.files) {
    const a = normalizedOwnedPath(leftPath)
    for (const rightPath of right.files) {
      const b = normalizedOwnedPath(rightPath)
      if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) {
        reasons.push(`path:${a === b ? a : `${a}<->${b}`}`)
      }
    }
  }
  const leftNamed = new Set(left.authoritySeams)
  for (const seam of right.authoritySeams) if (leftNamed.has(seam)) reasons.push(`authority:${seam}`)
  for (const { name, regex } of seamPatterns) {
    if (left.files.some((path) => regex.test(normalizedOwnedPath(path))) &&
        right.files.some((path) => regex.test(normalizedOwnedPath(path)))) {
      reasons.push(`seam:${name}`)
    }
  }
  return [...new Set(reasons)].toSorted()
}

function validateAdmissionConfig(config) {
  if (config?.schema_version !== 1) throw new SelectionError('ADMISSION_SCHEMA', 'Admission schema must be version 1')
  if (config?.verifier_contract?.schema_version !== 2 || config?.verifier_contract?.entry_mode !== 'entry') {
    throw new SelectionError('ADMISSION_SCHEMA', 'Admission verifier contract must require schema-v2 entry mode')
  }
  if (!config.plan_entry_gates || Array.isArray(config.plan_entry_gates)) {
    throw new SelectionError('ADMISSION_SCHEMA', 'plan_entry_gates must be an object')
  }
}

function everyPrerequisiteGreen(prerequisites) {
  if (Array.isArray(prerequisites)) return prerequisites.every((item) => item && item.ok === true)
  if (prerequisites && typeof prerequisites === 'object') {
    if (prerequisites.ok === false) return false
    if (Array.isArray(prerequisites.items)) return prerequisites.items.every((item) => item && item.ok === true)
    return prerequisites.ok === true
  }
  return false
}

export function validateEntryReceipt(receipt, expectedGate) {
  if (!receipt || receipt.schema_version !== 2) throw new SelectionError('VERIFIER_VERSION', 'Verifier output is not schema v2')
  if (receipt.gate_id !== expectedGate) throw new SelectionError('VERIFIER_GATE', `Verifier returned ${receipt.gate_id ?? 'no gate'} for ${expectedGate}`)
  if (receipt.mode !== 'entry') throw new SelectionError('VERIFIER_MODE', `Gate ${expectedGate} is not entry mode`)
  if (receipt.ok !== true || !everyPrerequisiteGreen(receipt.prerequisites)) {
    throw new SelectionError('ENTRY_PREREQUISITES', `Gate ${expectedGate} prerequisites are not green`)
  }
  if (!Array.isArray(receipt.accepted_targets) || receipt.accepted_targets.length !== 0) {
    throw new SelectionError('ENTRY_TARGETS', `Entry gate ${expectedGate} must return accepted_targets: []`)
  }
  return { gate_id: expectedGate, mode: 'entry', prerequisites: 'green', accepted_targets: [] }
}

export function invokeVerifier(verifierPath, gateId, cwd) {
  const result = spawnSync(verifierPath, [gateId], { cwd, encoding: 'utf8' })
  if (result.error) throw new SelectionError('VERIFIER_UNAVAILABLE', result.error.message)
  if (result.status !== 0) {
    throw new SelectionError('VERIFIER_REJECTED', `Entry gate ${gateId} exited ${result.status}`, {
      stderr: result.stderr.trim(),
    })
  }
  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    throw new SelectionError('VERIFIER_OUTPUT', `Entry gate ${gateId} returned malformed JSON`)
  }
  return parsed
}

function canonicalRoot(path) {
  return realpathSync(resolve(path))
}

export function gitIdentity(repoRoot) {
  const run = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()
  return {
    root: canonicalRoot(run('rev-parse', '--show-toplevel')),
    branch: run('rev-parse', '--abbrev-ref', 'HEAD'),
    head: run('rev-parse', 'HEAD'),
    status: run('status', '--porcelain=v1', '--untracked-files=all'),
  }
}

function assertGitIdentity(actual, expected) {
  if (actual.root !== canonicalRoot(expected.repoRoot)) {
    throw new SelectionError('WRONG_REPOSITORY', `Expected ${canonicalRoot(expected.repoRoot)}, got ${actual.root}`)
  }
  if (actual.branch !== expected.branch) {
    throw new SelectionError('WRONG_BRANCH', `Expected branch ${expected.branch}, got ${actual.branch}`)
  }
  if (actual.head !== expected.head) {
    throw new SelectionError('STALE_HEAD', `Expected HEAD ${expected.head}, got ${actual.head}`)
  }
  if (actual.status !== '') throw new SelectionError('DIRTY_TREE', 'Worktree is not clean')
}

function planAdmission(plan, config, options) {
  if (plan.phaseNumber === 1) return null
  if ((config.hard_denied_phase_numbers ?? []).includes(plan.phaseNumber)) {
    throw new SelectionError('PHASE_HARD_DENIED', `Phase ${plan.phaseNumber} construction is hard denied`)
  }
  if (plan.phaseNumber < 2 || plan.phaseNumber > 4) {
    throw new SelectionError('PHASE_UNMAPPED', `Phase ${plan.phaseNumber} is outside the admitted construction range`)
  }
  const gate = config.plan_entry_gates[plan.id]
  if (!gate) throw new SelectionError('UNMAPPED_ADMISSION', `No entry gate maps plan ${plan.id}`)
  const receipt = options.verifyGate
    ? options.verifyGate(gate, plan)
    : invokeVerifier(options.verifierPath, gate, options.repoRoot)
  return validateEntryReceipt(receipt, gate)
}

function dependencyState(plan, byId) {
  const blockers = []
  for (const id of plan.dependencies) {
    const dependency = byId.get(id)
    if (!dependency.autonomous) {
      blockers.push({ dependency: id, reason: 'explicit-checkpoint-dependency' })
    } else if (!dependency.complete) {
      blockers.push({ dependency: id, reason: 'incomplete-construction-dependency' })
    }
  }
  return blockers
}

function safeWorktreeName(id) {
  return `worktree-agent-desktop-${id.toLowerCase()}`
}

export function selectNext(options) {
  const repoRoot = canonicalRoot(options.repoRoot)
  const admissionPath = options.admissionPath ?? join(repoRoot, '.planning', 'execution', 'DESKTOP-GSD-ADMISSION.json')
  const admission = JSON.parse(readFileSync(admissionPath, 'utf8'))
  validateAdmissionConfig(admission)
  if (!options.skipGitCheck) {
    assertGitIdentity(gitIdentity(repoRoot), {
      repoRoot,
      branch: options.expectedBranch,
      head: options.expectedHead,
    })
  }

  const plans = options.plans ?? discoverPlans(repoRoot)
  const waves = computeEffectiveWaves(plans)
  const byId = new Map(plans.map((plan) => [plan.id, plan]))
  const blocked = []
  const eligible = []
  for (const plan of plans) {
    if (plan.complete || !plan.autonomous) continue
    const dependencyBlockers = dependencyState(plan, byId)
    if (dependencyBlockers.length) {
      blocked.push({ plan_id: plan.id, blockers: dependencyBlockers })
      continue
    }
    const authenticatedAdmission = planAdmission(plan, admission, {
      ...options,
      repoRoot,
    })
    eligible.push({ ...plan, effectiveWave: waves.get(plan.id), authenticatedAdmission })
  }

  const seamPatterns = compileSeams(admission)
  const selected = []
  const serialized = []
  for (const plan of eligible.toSorted((a, b) => a.effectiveWave - b.effectiveWave || a.id.localeCompare(b.id))) {
    const conflicts = selected.flatMap((other) =>
      pairConflicts(plan, other, seamPatterns).map((reason) => ({ with: other.id, reason })),
    )
    if (conflicts.length) serialized.push({ plan_id: plan.id, conflicts })
    else selected.push(plan)
  }

  const head = options.expectedHead ?? 'UNVERIFIED'
  const worktreeParent = options.worktreeParent ?? dirname(repoRoot)
  return {
    schema_version: 1,
    repository: repoRoot,
    branch: options.expectedBranch ?? 'UNVERIFIED',
    head,
    candidate_plans: selected.map((plan) => ({
      plan_id: plan.id,
      effective_construction_wave: plan.effectiveWave,
      plan_path: plan.planPath,
      owned_files: plan.files.toSorted(),
      authenticated_admission: plan.authenticatedAdmission,
      proposed_worktree: join(worktreeParent, `wayland-desktop-${plan.id}`, 'app'),
      proposed_branch: safeWorktreeName(plan.id),
      next_commands: [
        `git worktree add -b ${safeWorktreeName(plan.id)} ${join(worktreeParent, `wayland-desktop-${plan.id}`, 'app')} ${head}`,
        `cd ${join(worktreeParent, `wayland-desktop-${plan.id}`, 'app')}`,
      ],
    })),
    serialized_after: serialized,
    blocked,
  }
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) throw new SelectionError('ARGUMENT', `Unexpected argument: ${token}`)
    const key = token.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) throw new SelectionError('ARGUMENT', `Missing value for ${token}`)
    args[key] = value
    i += 1
  }
  for (const key of ['repo-root', 'expected-branch', 'expected-head']) {
    if (!args[key]) throw new SelectionError('ARGUMENT', `Missing --${key}`)
  }
  return args
}

function sanitizeError(error) {
  if (error instanceof SelectionError) {
    return { ok: false, error: { code: error.code, message: error.message, details: error.details } }
  }
  return { ok: false, error: { code: 'UNEXPECTED', message: error.message } }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2))
    const output = selectNext({
      repoRoot: args['repo-root'],
      expectedBranch: args['expected-branch'],
      expectedHead: args['expected-head'],
      admissionPath: args.admission,
      verifierPath: args.verifier ?? '/Users/seandonahoe/.local/bin/wayland-gsd-gate',
      worktreeParent: args['worktree-parent'],
    })
    process.stdout.write(`${JSON.stringify({ ok: true, ...output }, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${JSON.stringify(sanitizeError(error), null, 2)}\n`)
    process.exitCode = 1
  }
}

export { pairConflicts }
