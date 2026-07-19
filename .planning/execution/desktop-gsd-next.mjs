#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { accessSync, constants, existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { basename, dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const PLAN_RE = /^(\d{2})-(\d{2})-PLAN\.md$/

export class SelectionError extends Error {
  constructor(code, message, details = undefined) {
    super(message)
    this.name = 'SelectionError'
    this.code = code
    this.details = details
  }
}

function frontmatter(text, source) {
  if (!text.startsWith('---\n')) {
    throw new SelectionError('MALFORMED_FRONTMATTER', `${source}: missing opening frontmatter delimiter`)
  }
  const end = text.indexOf('\n---\n', 4)
  if (end < 0) {
    throw new SelectionError('MALFORMED_FRONTMATTER', `${source}: missing closing frontmatter delimiter`)
  }

  let result
  try {
    result = yaml.load(text.slice(4, end), { schema: yaml.JSON_SCHEMA })
  } catch (error) {
    throw new SelectionError('MALFORMED_FRONTMATTER', `${source}: ${error.message}`)
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new SelectionError('MALFORMED_FRONTMATTER', `${source}: frontmatter must be a mapping`)
  }
  return result
}

function normalizeExternalRoot(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0')) {
    throw new SelectionError('ADMISSION_SCHEMA', `Unsafe external ownership root: ${String(path)}`)
  }
  const normalized = posix.normalize(path)
  if (normalized === '/') {
    throw new SelectionError('ADMISSION_SCHEMA', 'The filesystem root cannot be an external ownership root')
  }
  return canonicalProspectivePath(normalized).replace(/\/$/, '')
}

function regularFileExists(path, code, label) {
  try {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new SelectionError(code, `${label} must be a regular file: ${path}`)
    }
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function canonicalOwnedPath(path, allowedExternalRoots = []) {
  if (typeof path !== 'string' || path.trim() === '' || path.includes('\0')) {
    throw new SelectionError('UNSAFE_OWNERSHIP_PATH', `Invalid ownership path: ${String(path)}`)
  }
  const slashPath = path.replaceAll('\\', '/')
  const absolute = slashPath.startsWith('/') || /^[A-Za-z]:\//.test(slashPath)
  const normalized = posix.normalize(slashPath)
  if (normalized === '.' || (!absolute && (normalized === '..' || normalized.startsWith('../')))) {
    throw new SelectionError('UNSAFE_OWNERSHIP_PATH', `Ownership path escapes the repository: ${path}`)
  }
  if (absolute) {
    if (!normalized.startsWith('/')) {
      throw new SelectionError('UNSAFE_OWNERSHIP_PATH', `External ownership path is not supported on this host: ${path}`)
    }
    const canonical = canonicalProspectivePath(normalized)
    const allowed = allowedExternalRoots.some((root) => canonical === root || canonical.startsWith(`${root}/`))
    if (!allowed) {
      throw new SelectionError('UNSAFE_OWNERSHIP_PATH', `External ownership path is not allowlisted: ${path}`)
    }
    return canonical.replace(/\/$/, '')
  }
  return normalized.replace(/\/$/, '')
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

export function discoverPlans(repoRoot, options = {}) {
  const phasesRoot = join(repoRoot, '.planning', 'phases')
  const plans = []
  const gitPaths = options.gitHead
    ? new Set(gitTreePaths(repoRoot, options.gitHead, '.planning/phases'))
    : null
  const entries = gitPaths
    ? [...gitPaths]
      .filter((source) => {
        const parts = source.split('/')
        return parts.length === 4 && parts[0] === '.planning' && parts[1] === 'phases' && PLAN_RE.test(parts[3])
      })
      .map((source) => ({
        phaseDir: join(repoRoot, dirname(source)),
        name: basename(source),
        path: join(repoRoot, source),
        source,
      }))
      .toSorted((a, b) => a.source.localeCompare(b.source))
    : listPhaseDirectories(phasesRoot).flatMap((phaseDir) =>
      readdirSync(phaseDir).toSorted().filter((name) => PLAN_RE.test(name)).map((name) => ({
        phaseDir,
        name,
        path: join(phaseDir, name),
        source: relative(repoRoot, join(phaseDir, name)),
      })),
    )

  for (const { phaseDir, name, path, source } of entries) {
      const match = name.match(PLAN_RE)
      const text = options.gitHead
        ? readGitRegularFile(repoRoot, options.gitHead, source, 'PLAN_IDENTITY', 'Plan')
        : (regularFileExists(path, 'PLAN_IDENTITY', 'Plan'), readFileSync(path, 'utf8'))
      const data = frontmatter(text, source)
      const id = `${match[1]}-${match[2]}`
      const phaseName = basename(phaseDir)
      const phaseMatch = phaseName.match(/^WLD-(\d{2})(?:-|$)/)
      if (!phaseMatch || phaseMatch[1] !== match[1] || data.phase !== phaseName) {
        throw new SelectionError(
          'PHASE_ID_MISMATCH',
          `${source}: filename, directory, and phase frontmatter must identify the same phase`,
        )
      }
      const phaseNumber = Number(phaseMatch[1])
      if (!Number.isInteger(data.plan) || data.plan !== Number(match[2])) {
        throw new SelectionError('PLAN_ID_MISMATCH', `${source}: plan ID disagrees with filename`)
      }
      if (!Array.isArray(data.depends_on) || !Array.isArray(data.files_modified)) {
        throw new SelectionError('MALFORMED_PLAN', `${source}: missing dependency or ownership list`)
      }
      if (typeof data.autonomous !== 'boolean') {
        throw new SelectionError('MALFORMED_PLAN', `${source}: autonomous must be boolean`)
      }
      if (!Number.isInteger(data.wave) || data.wave < 1) {
        throw new SelectionError('MALFORMED_PLAN', `${source}: wave must be a positive integer`)
      }
      const dependencies = data.depends_on.map(String)
      if (dependencies.some((dependency) => !/^\d{2}-\d{2}$/.test(dependency)) || new Set(dependencies).size !== dependencies.length) {
        throw new SelectionError('MALFORMED_PLAN', `${source}: dependencies must be unique NN-NN plan IDs`)
      }
      const allowedExternalRoots = options.allowedExternalRoots ?? []
      const files = data.files_modified.map((ownedPath) => canonicalOwnedPath(ownedPath, allowedExternalRoots))
      if (new Set(files.map((ownedPath) => ownedPath.toLowerCase())).size !== files.length) {
        throw new SelectionError('MALFORMED_PLAN', `${source}: ownership paths must be unique after canonicalization`)
      }
      if (data.authority_seams !== undefined && !Array.isArray(data.authority_seams)) {
        throw new SelectionError('MALFORMED_PLAN', `${source}: authority_seams must be a list`)
      }
      const authoritySeams = (data.authority_seams ?? []).map((seam) => {
        if (typeof seam !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(seam)) {
          throw new SelectionError('MALFORMED_PLAN', `${source}: authority seam is invalid`)
        }
        return seam.toLowerCase()
      })
      if (new Set(authoritySeams).size !== authoritySeams.length) {
        throw new SelectionError('MALFORMED_PLAN', `${source}: authority seams must be unique`)
      }
      const summaryPath = join(phaseDir, `${id}-SUMMARY.md`)
      const summarySource = relative(repoRoot, summaryPath)
      const complete = gitPaths
        ? gitPaths.has(summarySource)
        : regularFileExists(summaryPath, 'SUMMARY_IDENTITY', 'Summary')
      if (complete && options.gitHead) {
        readGitRegularFile(repoRoot, options.gitHead, summarySource, 'SUMMARY_IDENTITY', 'Summary')
      }
      plans.push({
        id,
        phaseNumber,
        declaredWave: Number(data.wave),
        autonomous: data.autonomous,
        dependencies,
        files,
        authoritySeams,
        planPath: relative(repoRoot, path),
        summaryPath: relative(repoRoot, summaryPath),
        complete,
      })
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
    for (const pattern of patterns) compiled.push({ name, regex: new RegExp(pattern, 'i') })
  }
  return compiled
}

function pairConflicts(left, right, seamPatterns, allowedExternalRoots = []) {
  const reasons = []
  for (const leftPath of left.files) {
    const a = canonicalOwnedPath(leftPath, allowedExternalRoots)
    for (const rightPath of right.files) {
      const b = canonicalOwnedPath(rightPath, allowedExternalRoots)
      const aKey = a.toLowerCase()
      const bKey = b.toLowerCase()
      if (aKey === bKey || aKey.startsWith(`${bKey}/`) || bKey.startsWith(`${aKey}/`)) {
        reasons.push(`path:${a === b ? a : `${a}<->${b}`}`)
      }
    }
  }
  const leftNamed = new Set(left.authoritySeams.map((seam) => seam.toLowerCase()))
  for (const seam of right.authoritySeams) {
    const canonicalSeam = seam.toLowerCase()
    if (leftNamed.has(canonicalSeam)) reasons.push(`authority:${canonicalSeam}`)
  }
  for (const { name, regex } of seamPatterns) {
    if (left.files.some((path) => regex.test(canonicalOwnedPath(path, allowedExternalRoots))) &&
        right.files.some((path) => regex.test(canonicalOwnedPath(path, allowedExternalRoots)))) {
      reasons.push(`seam:${name}`)
    }
  }
  return [...new Set(reasons)].toSorted()
}

function validateAdmissionConfig(config, repoRoot) {
  if (config?.schema_version !== 1) throw new SelectionError('ADMISSION_SCHEMA', 'Admission schema must be version 1')
  if (config?.verifier_contract?.schema_version !== 2 || config?.verifier_contract?.entry_mode !== 'entry') {
    throw new SelectionError('ADMISSION_SCHEMA', 'Admission verifier contract must require schema-v2 entry mode')
  }
  if (!config.plan_entry_gates || Array.isArray(config.plan_entry_gates)) {
    throw new SelectionError('ADMISSION_SCHEMA', 'plan_entry_gates must be an object')
  }
  if (!Array.isArray(config.external_ownership_roots)) {
    throw new SelectionError('ADMISSION_SCHEMA', 'external_ownership_roots must be an array')
  }
  config.external_ownership_roots = config.external_ownership_roots.map(normalizeExternalRoot)
  const canonicalRepo = canonicalRoot(repoRoot)
  for (const root of config.external_ownership_roots) {
    if (root === canonicalRepo || root.startsWith(`${canonicalRepo}/`) || canonicalRepo.startsWith(`${root}/`)) {
      throw new SelectionError('ADMISSION_SCHEMA', `External ownership root overlaps the repository: ${root}`)
    }
  }
  if (!Number.isInteger(config.max_parallel_plans) || config.max_parallel_plans < 1 || config.max_parallel_plans > 8) {
    throw new SelectionError('ADMISSION_SCHEMA', 'max_parallel_plans must be an integer from 1 through 8')
  }
  const mandatorySeams = ['lock', 'migration', 'schema', 'generated', 'config', 'execution_authority']
  if (!config.seam_patterns || typeof config.seam_patterns !== 'object' || Array.isArray(config.seam_patterns)) {
    throw new SelectionError('ADMISSION_SCHEMA', 'seam_patterns must be an object')
  }
  for (const seam of mandatorySeams) {
    const patterns = config.seam_patterns[seam]
    if (!Array.isArray(patterns) || patterns.length === 0 || patterns.some((pattern) => typeof pattern !== 'string' || pattern === '')) {
      throw new SelectionError('ADMISSION_SCHEMA', `Mandatory seam ${seam} must contain patterns`)
    }
  }
  for (const [seam, patterns] of Object.entries(config.seam_patterns)) {
    if (!Array.isArray(patterns) || patterns.length === 0 || patterns.some((pattern) => typeof pattern !== 'string' || pattern === '')) {
      throw new SelectionError('ADMISSION_SCHEMA', `Seam ${seam} must contain patterns`)
    }
    try {
      for (const pattern of patterns) RegExp(pattern, 'i')
    } catch {
      throw new SelectionError('ADMISSION_SCHEMA', `Seam ${seam} contains an invalid pattern`)
    }
  }
  const verifier = config.verifier
  if (!verifier || typeof verifier !== 'object' || Array.isArray(verifier) ||
      typeof verifier.path !== 'string' || !verifier.path.startsWith('/') ||
      !/^sha256:[0-9a-f]{64}$/.test(verifier.digest ?? '') ||
      !Number.isInteger(verifier.timeout_ms) || verifier.timeout_ms < 100 || verifier.timeout_ms > 120_000 ||
      !Number.isInteger(verifier.max_output_bytes) || verifier.max_output_bytes < 1024 || verifier.max_output_bytes > 10_485_760) {
    throw new SelectionError('ADMISSION_SCHEMA', 'verifier identity and execution bounds are invalid')
  }
}

function everyPrerequisiteGreen(prerequisites) {
  if (!prerequisites || typeof prerequisites !== 'object' || Array.isArray(prerequisites)) return false
  const allowedKeys = new Set(['ok', 'required', 'alternatives', 'exclusive_alternatives'])
  if (Object.keys(prerequisites).some((key) => !allowedKeys.has(key))) return false
  if (prerequisites.ok !== true) return false
  const groupNames = ['required', 'alternatives', 'exclusive_alternatives']
  if (groupNames.some((key) => !Array.isArray(prerequisites[key]))) return false
  const items = groupNames.flatMap((key) => prerequisites[key])
  return items.length > 0 && items.every((item) => item && typeof item === 'object' && !Array.isArray(item) && item.ok === true)
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

function fileDigest(path) {
  return `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`
}

export function invokeVerifier(verifier, gateId, cwd) {
  let canonicalPath
  try {
    canonicalPath = realpathSync(verifier.path)
  } catch {
    throw new SelectionError('VERIFIER_UNAVAILABLE', 'Pinned verifier is unavailable')
  }
  if (canonicalPath !== verifier.path || fileDigest(canonicalPath) !== verifier.digest) {
    throw new SelectionError('VERIFIER_IDENTITY', 'Pinned verifier identity does not match')
  }
  const result = spawnSync(canonicalPath, [gateId], {
    cwd,
    encoding: 'utf8',
    timeout: verifier.timeout_ms,
    maxBuffer: verifier.max_output_bytes,
    killSignal: 'SIGKILL',
  })
  if (result.error?.code === 'ETIMEDOUT') {
    throw new SelectionError('VERIFIER_TIMEOUT', `Entry gate ${gateId} exceeded its execution bound`)
  }
  if (result.error?.code === 'ENOBUFS') {
    throw new SelectionError('VERIFIER_OUTPUT_LIMIT', `Entry gate ${gateId} exceeded its output bound`)
  }
  if (result.error) throw new SelectionError('VERIFIER_UNAVAILABLE', 'Pinned verifier could not execute')
  if (fileDigest(canonicalPath) !== verifier.digest) {
    throw new SelectionError('VERIFIER_IDENTITY', 'Pinned verifier changed during execution')
  }
  if (result.status !== 0) {
    throw new SelectionError('VERIFIER_REJECTED', `Entry gate ${gateId} exited ${result.status}`, {
      exit_code: result.status,
      signal: result.signal,
      stderr_bytes: Buffer.byteLength(result.stderr ?? ''),
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

function canonicalProspectivePath(path) {
  const missing = []
  let cursor = resolve(path)
  while (!existsSync(cursor)) {
    const parent = dirname(cursor)
    if (parent === cursor) break
    missing.unshift(basename(cursor))
    cursor = parent
  }
  return resolve(realpathSync(cursor), ...missing)
}

function gitTreePaths(repoRoot, head, prefix) {
  return execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', head, '--', prefix], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).split('\0').filter(Boolean)
}

function readGitRegularFile(repoRoot, head, source, code, label) {
  const entry = execFileSync('git', ['ls-tree', '-z', head, '--', source], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).split('\0')[0] ?? ''
  if (!/^100(?:644|755) blob [0-9a-f]{40,64}\t/.test(entry)) {
    throw new SelectionError(code, `${label} must be a regular file in ${head}: ${source}`)
  }
  return execFileSync('git', ['show', `${head}:${source}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
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

function planAdmissionGate(plan, config) {
  if (plan.phaseNumber === 1) return null
  if ((config.hard_denied_phase_numbers ?? []).includes(plan.phaseNumber)) {
    throw new SelectionError('PHASE_HARD_DENIED', `Phase ${plan.phaseNumber} construction is hard denied`)
  }
  if (plan.phaseNumber < 2 || plan.phaseNumber > 4) {
    throw new SelectionError('PHASE_UNMAPPED', `Phase ${plan.phaseNumber} is outside the admitted construction range`)
  }
  const gate = config.plan_entry_gates[plan.id]
  if (!gate) throw new SelectionError('UNMAPPED_ADMISSION', `No entry gate maps plan ${plan.id}`)
  return gate
}

function authenticatePlanAdmission(plan, gate, config, options) {
  if (gate === null) return null
  const receipt = options.verifyGate
    ? options.verifyGate(gate, plan)
    : invokeVerifier(config.verifier, gate, options.repoRoot)
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

function assertWorktreeTargetAvailable(repoRoot, branch, path) {
  const branchResult = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  if (branchResult.error || ![0, 1].includes(branchResult.status)) {
    throw new SelectionError('WORKTREE_PREFLIGHT', `Unable to verify proposed branch ${branch}`)
  }
  if (branchResult.status === 0) {
    throw new SelectionError('WORKTREE_COLLISION', `Proposed worktree branch already exists: ${branch}`)
  }
  if (existsSync(path)) {
    throw new SelectionError('WORKTREE_COLLISION', `Proposed worktree path already exists: ${path}`)
  }
  let ancestor = dirname(path)
  while (!existsSync(ancestor)) {
    const parent = dirname(ancestor)
    if (parent === ancestor) break
    ancestor = parent
  }
  let stat
  try {
    stat = lstatSync(ancestor)
    accessSync(ancestor, constants.W_OK | constants.X_OK)
  } catch {
    throw new SelectionError('WORKTREE_PARENT', `Existing worktree ancestor is not usable: ${ancestor}`)
  }
  if (!stat.isDirectory()) {
    throw new SelectionError('WORKTREE_PARENT', `Existing worktree ancestor is not a directory: ${ancestor}`)
  }
}

function selectNextInternal(options) {
  const repoRoot = canonicalRoot(options.repoRoot)
  if (!options.skipGitCheck) {
    assertGitIdentity(gitIdentity(repoRoot), {
      repoRoot,
      branch: options.expectedBranch,
      head: options.expectedHead,
    })
  }
  const canonicalAdmissionPath = join(repoRoot, '.planning', 'execution', 'DESKTOP-GSD-ADMISSION.json')
  const admissionPath = options.admissionPath ?? canonicalAdmissionPath
  let actualAdmissionPath
  try {
    actualAdmissionPath = realpathSync(admissionPath)
  } catch {
    throw new SelectionError('ADMISSION_IDENTITY', 'Canonical admission configuration is unavailable')
  }
  if (actualAdmissionPath !== canonicalAdmissionPath) {
    throw new SelectionError('ADMISSION_IDENTITY', 'Admission configuration must be the canonical repository file')
  }
  const admissionText = options.skipGitCheck
    ? readFileSync(actualAdmissionPath, 'utf8')
    : readGitRegularFile(
      repoRoot,
      options.expectedHead,
      '.planning/execution/DESKTOP-GSD-ADMISSION.json',
      'ADMISSION_IDENTITY',
      'Admission configuration',
    )
  const admission = JSON.parse(admissionText)
  validateAdmissionConfig(admission, repoRoot)
  if (options.verifyGate && !options.skipGitCheck) {
    throw new SelectionError('VERIFIER_IDENTITY', 'Verifier injection is forbidden for operational selection')
  }
  if (options.plans && !options.skipGitCheck) {
    throw new SelectionError('PLAN_IDENTITY', 'Plan injection is forbidden for operational selection')
  }
  const allowedExternalRoots = admission.external_ownership_roots
  const discoveredPlans = options.plans ?? discoverPlans(repoRoot, {
    allowedExternalRoots,
    gitHead: options.skipGitCheck ? undefined : options.expectedHead,
  })
  const plans = discoveredPlans.map((plan) => Object.assign({}, plan, {
    files: plan.files.map((ownedPath) => canonicalOwnedPath(ownedPath, allowedExternalRoots)),
  }))
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
    const admissionGate = planAdmissionGate(plan, admission)
    eligible.push({ ...plan, effectiveWave: waves.get(plan.id), admissionGate })
  }

  const seamPatterns = compileSeams(admission)
  const selected = []
  const serialized = []
  for (const plan of eligible.toSorted((a, b) => a.effectiveWave - b.effectiveWave || a.id.localeCompare(b.id))) {
    if (selected.length >= admission.max_parallel_plans) {
      serialized.push({
        plan_id: plan.id,
        conflicts: [{ with: null, reason: `concurrency-limit:${admission.max_parallel_plans}` }],
      })
      continue
    }
    const conflicts = selected.flatMap((other) =>
      pairConflicts(plan, other, seamPatterns, allowedExternalRoots).map((reason) => ({ with: other.id, reason })),
    )
    if (conflicts.length) serialized.push({ plan_id: plan.id, conflicts })
    else selected.push(plan)
  }

  const head = options.expectedHead ?? 'UNVERIFIED'
  if (typeof options.worktreeParent === 'string' && options.worktreeParent.includes('\0')) {
    throw new SelectionError('WORKTREE_PARENT', 'Worktree parent contains an invalid character')
  }
  const worktreeParent = canonicalProspectivePath(options.worktreeParent ?? dirname(repoRoot))
  if (worktreeParent === repoRoot || worktreeParent.startsWith(`${repoRoot}/`)) {
    throw new SelectionError('WORKTREE_PARENT', 'Worktree parent must be outside the integration worktree')
  }
  if (!options.skipGitCheck) {
    assertGitIdentity(gitIdentity(repoRoot), {
      repoRoot,
      branch: options.expectedBranch,
      head: options.expectedHead,
    })
  }
  const operational = options.fixtureMode !== true
  if (operational) {
    for (const plan of selected) {
      assertWorktreeTargetAvailable(
        repoRoot,
        safeWorktreeName(plan.id),
        join(worktreeParent, `wayland-desktop-${plan.id}`, 'app'),
      )
    }
  }
  const admittedSelected = selected.map((plan) => Object.assign({}, plan, {
    authenticatedAdmission: authenticatePlanAdmission(plan, plan.admissionGate, admission, {
      ...options,
      repoRoot,
    }),
  }))
  if (operational) {
    assertGitIdentity(gitIdentity(repoRoot), {
      repoRoot,
      branch: options.expectedBranch,
      head: options.expectedHead,
    })
  }
  return {
    schema_version: 1,
    operational,
    repository: repoRoot,
    branch: options.expectedBranch ?? 'UNVERIFIED',
    head,
    candidate_plans: admittedSelected.map((plan) => ({
      plan_id: plan.id,
      effective_construction_wave: plan.effectiveWave,
      plan_path: plan.planPath,
      owned_files: plan.files.toSorted(),
      authenticated_admission: operational ? plan.authenticatedAdmission : null,
      proposed_worktree: join(worktreeParent, `wayland-desktop-${plan.id}`, 'app'),
      proposed_branch: safeWorktreeName(plan.id),
      next_commands: operational ? [{
        executable: 'git',
        arguments: [
          'worktree',
          'add',
          '-b',
          safeWorktreeName(plan.id),
          join(worktreeParent, `wayland-desktop-${plan.id}`, 'app'),
          head,
        ],
        cwd: repoRoot,
      }] : [],
    })),
    serialized_after: serialized,
    blocked,
  }
}

export function selectNext(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new SelectionError('TEST_AUTHORITY', 'Operational selection options must be an object')
  }
  for (const key of ['skipGitCheck', 'plans', 'verifyGate', 'admissionPath', 'fixtureMode']) {
    if (key in options) {
      throw new SelectionError('TEST_AUTHORITY', `Operational selection forbids ${key}`)
    }
  }
  const allowed = ['repoRoot', 'expectedBranch', 'expectedHead', 'worktreeParent']
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) throw new SelectionError('TEST_AUTHORITY', `Operational selection forbids ${key}`)
  }
  const operationalOptions = Object.create(null)
  for (const key of allowed) {
    if (Object.hasOwn(options, key)) operationalOptions[key] = options[key]
  }
  return selectNextInternal(operationalOptions)
}

// Pure scheduling support for hostile unit fixtures. It never emits authenticated
// admissions or executable worktree commands and therefore has no operator authority.
export function schedulePlansForTest(options) {
  return selectNextInternal({ ...options, skipGitCheck: true, fixtureMode: true })
}

function parseArgs(argv) {
  const args = {}
  const allowed = new Set(['repo-root', 'expected-branch', 'expected-head', 'worktree-parent'])
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) throw new SelectionError('ARGUMENT', `Unexpected argument: ${token}`)
    const key = token.slice(2)
    if (!allowed.has(key)) throw new SelectionError('ARGUMENT', `Unsupported argument: ${token}`)
    if (Object.hasOwn(args, key)) throw new SelectionError('ARGUMENT', `Duplicate argument: ${token}`)
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
      worktreeParent: args['worktree-parent'],
    })
    process.stdout.write(`${JSON.stringify({ ok: true, ...output }, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${JSON.stringify(sanitizeError(error), null, 2)}\n`)
    process.exitCode = 1
  }
}

export { pairConflicts }
