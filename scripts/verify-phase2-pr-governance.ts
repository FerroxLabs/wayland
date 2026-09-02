/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 2 Desktop governance verifier.
 *
 * The committed manifest describes an implementation-input commit, never the
 * later commit that contains the manifest. Final PR/review/squash facts live in
 * the external planning receipt and are checked against GitHub at postmerge.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export const REQUIRED_CHECKS = [
  'Code Quality',
  'Unit Tests (macos-14)',
  'Unit Tests (ubuntu-latest)',
  'Unit Tests (windows-2022)',
] as const;

export const GOVERNANCE_DISCLOSURE =
  'owner-directed agent-operated review under one human controller; not independent human review';

type JsonObject = Record<string, unknown>;

export interface ChangeIdentity {
  base_sha: string;
  commit_sha: string;
  tree_sha: string;
  normalized_diff_sha256: string;
  stable_patch_id: string;
  changed_paths_sha256: string;
}

export interface PremergeManifest extends JsonObject {
  schema_version: 'phase2-desktop-premerge-v1';
  repository: 'FerroxLabs/wayland';
  base_ref: 'main';
  head_ref: 'feat/nano-activation-boundary';
  expected_author: 'FerroxLabs';
  issue: {
    repository: 'FerroxLabs/wayland';
    number: 1201;
    state: 'OPEN';
    assignee: 'FerroxLabs';
    labels: ['area:desktop-ui', 'needs:desktop', 'state:in-progress'];
  };
  governance: {
    merge_method: 'squash';
    linear_history_required: true;
    admin_enforcement_required: true;
    bypass_forbidden: true;
    disclosure: typeof GOVERNANCE_DISCLOSURE;
  };
  required_checks: string[];
  nano: {
    repository: 'FerroxLabs/wayland-nano';
    source_commit_sha: string;
    merge_commit_sha: string;
    cargo_lock_sha256: string;
    cargo_lock_blob_sha: string;
    ci_run_id: number;
    merged_before_desktop: true;
  };
  nano_fixture_helper: {
    repository: 'FerroxLabs/wayland-nano';
    source_commit_sha: string;
    merge_commit_sha: string;
    cargo_lock_sha256: string;
    ci_run_id: number;
    merged_at: string;
    merged_before_desktop: true;
    public_schema: 'wayland.nano.phase2-fixture/v2';
    private_handoff_schema: 'wayland.nano.phase2-fixture-private/v1';
    production_cli_exposure: false;
  };
  artifact: {
    workflow_file: '.github/workflows/wayland-nano-activation.yml';
    workflow_name: 'Wayland Nano exact artifact';
    workflow_checks: [
      'Exact artifact (ubuntu-latest)',
      'Exact artifact (windows-latest)',
      'Production bootstrap contract',
    ];
    workflow_sha256: string;
    build_recipe: string[];
    expected_compile_identity: JsonObject;
    manifest_path: 'docs/evidence/phase2/activation-artifact-manifest.json';
    manifest_sha256: string;
    receipt_path: 'docs/evidence/phase2/activation-negative-crash-receipt.json';
    receipt_sha256: string;
    fixture_hashes: JsonObject;
    matrix_counts: JsonObject;
  };
  implementation_input: ChangeIdentity;
  default_off: true;
}

export interface GovernanceSnapshot {
  repository: string;
  default_branch: string;
  issue_open: boolean;
  issue_assignee: string;
  issue_labels: string[];
  pr_base_ref: string;
  pr_base_sha: string;
  pr_head_ref: string;
  pr_author: string;
  pr_head_sha?: string;
  reviewed_head_sha?: string;
  approved_reviewer?: string;
  approval_review_id?: number;
  approval_commit_sha?: string;
  checks?: Record<string, { conclusion: string; head_sha: string; id: number }>;
  artifact_checks?: Record<string, { conclusion: string; head_sha: string; id: number }>;
  protection: {
    strict_checks: boolean;
    required_checks: string[];
    linear_history: boolean;
    enforce_admins: boolean;
    allow_force_pushes: boolean;
    allow_deletions: boolean;
  };
  merged?: boolean;
  merge_method?: string;
  merger?: string;
  merge_sha?: string;
  merge_parent_count?: number;
  bypassed?: boolean;
  reviewed_identity?: ChangeIdentity;
  merge_identity?: ChangeIdentity;
  nano_merge_time?: string;
  nano_fixture_helper_merge_time?: string;
  desktop_merge_time?: string;
  default_off?: boolean;
  disclosure?: string;
}

export interface FinalReceipt extends JsonObject {
  schema_version: 'phase2-desktop-final-receipt-v1';
  repository: 'FerroxLabs/wayland';
  pr_number: number;
  base_sha: string;
  reviewed_head_sha: string;
  reviewer: string;
  review_id: number;
  approval_commit_sha: string;
  merger: string;
  squash_merge_sha: string;
  check_run_ids: Record<string, number>;
  artifact_check_run_ids: Record<string, number>;
  implementation_input: ChangeIdentity;
  reviewed_change: ChangeIdentity;
  squash_change: ChangeIdentity;
  manifest_sha256: string;
  nano: PremergeManifest['nano'] & { merged_at: string };
  nano_fixture_helper: PremergeManifest['nano_fixture_helper'];
  desktop_merged_at: string;
  default_off: true;
  protection_no_bypass: true;
  governance_disclosure: typeof GOVERNANCE_DISCLOSURE;
}

function fail(message: string): never {
  throw new Error(`phase2 governance: ${message}`);
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string, pattern?: RegExp): string {
  if (typeof value !== 'string' || value.length === 0 || (pattern && !pattern.test(value))) {
    fail(`${field} is invalid`);
  }
  return value;
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function run(command: string, args: string[], input?: string): string {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    input,
    shell: false,
    windowsHide: true,
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout.trim();
}

function git(...args: string[]): string {
  return run('git', args);
}

function ghApi(endpoint: string): unknown {
  return JSON.parse(run('gh', ['api', '--paginate', endpoint]));
}

function normalizeGitOutput(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function computeChangeIdentity(baseSha: string, commitSha: string): ChangeIdentity {
  const shaPattern = /^[0-9a-f]{40}$/;
  const base = requireString(git('rev-parse', `${baseSha}^{commit}`), 'base SHA', shaPattern);
  const commit = requireString(git('rev-parse', `${commitSha}^{commit}`), 'commit SHA', shaPattern);
  const tree = requireString(git('rev-parse', `${commit}^{tree}`), 'tree SHA', shaPattern);
  const binaryDiff = normalizeGitOutput(git('diff', '--binary', '--full-index', '--no-ext-diff', base, commit, '--'));
  const patchInput = normalizeGitOutput(git('diff', '--full-index', '--no-ext-diff', base, commit, '--'));
  const patchOutput = run('git', ['patch-id', '--stable'], `${patchInput}\n`);
  const patchId = patchOutput.split(/\s+/)[0] ?? '';
  const paths = normalizeGitOutput(git('diff', '--name-only', '-z', base, commit, '--'));
  return {
    base_sha: base,
    commit_sha: commit,
    tree_sha: tree,
    normalized_diff_sha256: sha256(binaryDiff),
    stable_patch_id: requireString(patchId, 'stable patch id', shaPattern),
    changed_paths_sha256: sha256(paths),
  };
}

function equalIdentity(left: ChangeIdentity, right: ChangeIdentity, label: string): void {
  for (const field of [
    'base_sha',
    'tree_sha',
    'normalized_diff_sha256',
    'stable_patch_id',
    'changed_paths_sha256',
  ] as const) {
    if (left[field] !== right[field]) fail(`${label} ${field} mismatch`);
  }
}

function assertNoSelfReference(manifest: PremergeManifest, manifestPath: string, ancestryHead: string): void {
  const forbiddenKeys = new Set([
    'final_head_sha',
    'reviewed_head_sha',
    'desktop_head_sha',
    'manifest_commit_sha',
    'squash_merge_sha',
  ]);
  const walk = (value: unknown, path: string): void => {
    if (!isRecord(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) fail(`self-referential field ${path}${key}`);
      walk(child, `${path}${key}.`);
    }
  };
  walk(manifest, '');
  const currentHead = git('rev-parse', 'HEAD');
  if (manifest.implementation_input.commit_sha === currentHead) {
    fail('implementation input must precede the commit containing the manifest');
  }
  const relative = manifestPath.replace(/\\/g, '/');
  const inputPaths = git(
    'diff',
    '--name-only',
    manifest.implementation_input.base_sha,
    manifest.implementation_input.commit_sha,
    '--'
  )
    .split(/\r?\n/)
    .filter(Boolean);
  if (inputPaths.includes(relative)) fail('implementation input includes its own premerge manifest');
  if (git('merge-base', '--is-ancestor', manifest.implementation_input.commit_sha, ancestryHead) !== '') {
    // `merge-base --is-ancestor` is silent on success; run() already rejects failure.
    fail('unexpected merge-base output');
  }
}

function assertManifestShape(manifest: PremergeManifest): void {
  const forbiddenKeys = new Set([
    'final_head_sha',
    'reviewed_head_sha',
    'desktop_head_sha',
    'manifest_commit_sha',
    'squash_merge_sha',
  ]);
  const rejectFinalIdentity = (value: unknown, path = ''): void => {
    if (!isRecord(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) fail(`self-referential field ${path}${key}`);
      rejectFinalIdentity(child, `${path}${key}.`);
    }
  };
  rejectFinalIdentity(manifest);
  if (manifest.schema_version !== 'phase2-desktop-premerge-v1') fail('wrong manifest schema');
  if (manifest.repository !== 'FerroxLabs/wayland' || manifest.base_ref !== 'main') fail('wrong repository/base');
  if (manifest.head_ref !== 'feat/nano-activation-boundary' || manifest.expected_author !== 'FerroxLabs') {
    fail('wrong head/author binding');
  }
  if (
    manifest.issue?.repository !== manifest.repository ||
    manifest.issue.number !== 1201 ||
    manifest.issue.state !== 'OPEN' ||
    manifest.issue.assignee !== 'FerroxLabs' ||
    JSON.stringify(manifest.issue.labels) !== JSON.stringify(['area:desktop-ui', 'needs:desktop', 'state:in-progress'])
  ) {
    fail('issue 1201 is not claimed correctly');
  }
  if (
    manifest.governance?.merge_method !== 'squash' ||
    manifest.governance.linear_history_required !== true ||
    manifest.governance.admin_enforcement_required !== true ||
    manifest.governance.bypass_forbidden !== true ||
    manifest.governance.disclosure !== GOVERNANCE_DISCLOSURE
  ) {
    fail('governance policy/disclosure mismatch');
  }
  if (JSON.stringify(manifest.required_checks) !== JSON.stringify(REQUIRED_CHECKS)) {
    fail('required checks must be the exact four protected contexts');
  }
  if (
    manifest.nano?.repository !== 'FerroxLabs/wayland-nano' ||
    manifest.nano.source_commit_sha !== '288de9ed3185c91717f8f777c9975c784709e824' ||
    manifest.nano.merge_commit_sha !== '1d80ecf93c1ec5fe14e89a44e89c4a0142ba1c9b' ||
    manifest.nano.cargo_lock_sha256 !== '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a' ||
    manifest.nano.cargo_lock_blob_sha !== '7bb979cf829f7bf0a63692d8485bfc8e4935ed13' ||
    manifest.nano.ci_run_id !== 33318936491 ||
    manifest.nano.merged_before_desktop !== true
  ) {
    fail('corrected immutable Nano source/lock/merge/CI binding mismatch');
  }
  if (
    manifest.nano_fixture_helper?.repository !== 'FerroxLabs/wayland-nano' ||
    manifest.nano_fixture_helper.source_commit_sha !== '2f7b33f4ad9344aea1ce78fc9fb09600a6f50dbe' ||
    manifest.nano_fixture_helper.merge_commit_sha !== 'c10dcb9b0964a23df7b5bb2760ef494c4e15369d' ||
    manifest.nano_fixture_helper.cargo_lock_sha256 !==
      '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a' ||
    manifest.nano_fixture_helper.ci_run_id !== 33369702224 ||
    manifest.nano_fixture_helper.merged_at !== '2026-08-31T08:13:47Z' ||
    manifest.nano_fixture_helper.merged_before_desktop !== true ||
    manifest.nano_fixture_helper.public_schema !== 'wayland.nano.phase2-fixture/v2' ||
    manifest.nano_fixture_helper.private_handoff_schema !== 'wayland.nano.phase2-fixture-private/v1' ||
    manifest.nano_fixture_helper.production_cli_exposure !== false
  )
    fail('Nano-owned fixture helper provenance mismatch');
  if (
    manifest.artifact?.workflow_file !== '.github/workflows/wayland-nano-activation.yml' ||
    manifest.artifact.workflow_name !== 'Wayland Nano exact artifact' ||
    JSON.stringify(manifest.artifact.workflow_checks) !==
      JSON.stringify([
        'Exact artifact (ubuntu-latest)',
        'Exact artifact (windows-latest)',
        'Production bootstrap contract',
      ]) ||
    !Array.isArray(manifest.artifact.build_recipe) ||
    manifest.artifact.build_recipe.length === 0 ||
    !isRecord(manifest.artifact.expected_compile_identity) ||
    Object.keys(manifest.artifact.expected_compile_identity).length === 0 ||
    !isRecord(manifest.artifact.fixture_hashes) ||
    Object.keys(manifest.artifact.fixture_hashes).length === 0 ||
    !isRecord(manifest.artifact.matrix_counts) ||
    Object.keys(manifest.artifact.matrix_counts).length === 0
  ) {
    fail('exact-artifact workflow/build/hash/count binding is incomplete');
  }
  requireString(manifest.artifact.manifest_sha256, 'artifact manifest hash', /^[0-9a-f]{64}$/);
  requireString(manifest.artifact.receipt_sha256, 'artifact receipt hash', /^[0-9a-f]{64}$/);
  requireString(manifest.artifact.workflow_sha256, 'artifact workflow hash', /^[0-9a-f]{64}$/);
  if (
    manifest.artifact.expected_compile_identity.source_commit_sha !== manifest.nano.source_commit_sha ||
    manifest.artifact.expected_compile_identity.cargo_lock_sha256 !== manifest.nano.cargo_lock_sha256
  )
    fail('compile identity does not bind the corrected Nano source/lock');
  if (
    manifest.artifact.matrix_counts.positive !== 5 ||
    manifest.artifact.matrix_counts.negative !== 26 ||
    manifest.artifact.matrix_counts.total !== 31 ||
    manifest.artifact.fixture_hashes.row_ids_sha256 !==
      '11ff503f21b85bb84cbd5a98a94f209fea2ffb1d6bc16f78ce73f50552a9b754'
  )
    fail('artifact matrix hashes/counts differ from the frozen 31-row corpus');
  if (manifest.default_off !== true) fail('persistent activation is not default-off');
}

export function verifyGovernanceSnapshot(
  manifest: PremergeManifest,
  snapshot: GovernanceSnapshot,
  finalReceipt?: FinalReceipt
): void {
  assertManifestShape(manifest);
  if (finalReceipt) assertFinalReceipt(manifest, finalReceipt);
  if (snapshot.repository !== manifest.repository || snapshot.default_branch !== manifest.base_ref) {
    fail('GitHub repository/default branch mismatch');
  }
  if (
    (!finalReceipt && !snapshot.issue_open) ||
    snapshot.issue_assignee !== manifest.issue.assignee ||
    JSON.stringify([...snapshot.issue_labels].sort()) !== JSON.stringify([...manifest.issue.labels].sort())
  )
    fail('issue 1201 is stale/unclaimed');
  if (
    snapshot.pr_base_ref !== manifest.base_ref ||
    snapshot.pr_base_sha !== manifest.implementation_input.base_sha ||
    snapshot.pr_head_ref !== manifest.head_ref ||
    snapshot.pr_author !== manifest.expected_author
  ) {
    fail('PR base/head/author mismatch');
  }
  const protection = snapshot.protection;
  if (
    !protection.strict_checks ||
    !protection.linear_history ||
    !protection.enforce_admins ||
    protection.allow_force_pushes ||
    protection.allow_deletions ||
    JSON.stringify(protection.required_checks) !== JSON.stringify(REQUIRED_CHECKS)
  ) {
    fail('branch protection permits bypass or differs from the governed policy');
  }
  const checkHead = finalReceipt?.reviewed_head_sha ?? snapshot.pr_head_sha;
  if (!checkHead) fail('PR head is missing');
  for (const check of REQUIRED_CHECKS) {
    const actual = snapshot.checks?.[check];
    const expectedId = finalReceipt?.check_run_ids[check];
    if (
      !actual ||
      actual.conclusion !== 'success' ||
      actual.head_sha !== checkHead ||
      (expectedId !== undefined && actual.id !== expectedId)
    ) {
      fail(`required check ${check} is missing, stale or unsuccessful`);
    }
  }
  for (const check of manifest.artifact.workflow_checks) {
    const actual = snapshot.artifact_checks?.[check];
    const expectedId = finalReceipt?.artifact_check_run_ids[check];
    if (
      !actual ||
      actual.conclusion !== 'success' ||
      actual.head_sha !== checkHead ||
      (expectedId !== undefined && actual.id !== expectedId)
    )
      fail(`exact-artifact workflow check ${check} is missing, stale or unsuccessful`);
  }
  if (!finalReceipt) return;
  if (snapshot.pr_head_sha !== finalReceipt.reviewed_head_sha) fail('stale final receipt head');
  if (
    snapshot.reviewed_head_sha !== finalReceipt.reviewed_head_sha ||
    snapshot.approved_reviewer !== finalReceipt.reviewer ||
    snapshot.approval_review_id !== finalReceipt.review_id ||
    snapshot.approval_commit_sha !== finalReceipt.reviewed_head_sha
  ) {
    fail('approval is stale or does not bind the reviewed head');
  }
  if (
    !snapshot.merged ||
    snapshot.merge_method !== 'squash' ||
    snapshot.merge_parent_count !== 1 ||
    snapshot.bypassed ||
    snapshot.merger !== finalReceipt.merger ||
    snapshot.merge_sha !== finalReceipt.squash_merge_sha
  ) {
    fail('merge is not the governed no-bypass squash merge');
  }
  if (!snapshot.reviewed_identity || !snapshot.merge_identity) fail('change identity evidence missing');
  equalIdentity(snapshot.reviewed_identity, finalReceipt.reviewed_change, 'reviewed change');
  equalIdentity(snapshot.merge_identity, finalReceipt.squash_change, 'squash change');
  equalIdentity(snapshot.reviewed_identity, snapshot.merge_identity, 'reviewed/squash change');
  if (snapshot.reviewed_identity.commit_sha === snapshot.merge_identity.commit_sha) {
    fail('squash proof incorrectly reuses one commit instead of comparing change identity');
  }
  equalIdentity(manifest.implementation_input, finalReceipt.implementation_input, 'implementation input');
  if (
    snapshot.default_off !== true ||
    finalReceipt.default_off !== true ||
    snapshot.disclosure !== GOVERNANCE_DISCLOSURE ||
    finalReceipt.governance_disclosure !== GOVERNANCE_DISCLOSURE
  ) {
    fail('default-off or governance disclosure mismatch');
  }
  const nanoTime = Date.parse(snapshot.nano_merge_time ?? '');
  const helperTime = Date.parse(snapshot.nano_fixture_helper_merge_time ?? '');
  const desktopTime = Date.parse(snapshot.desktop_merge_time ?? '');
  if (snapshot.desktop_merge_time !== finalReceipt.desktop_merged_at)
    fail('external receipt Desktop merge time mismatch');
  if (
    !Number.isFinite(nanoTime) ||
    !Number.isFinite(helperTime) ||
    !Number.isFinite(desktopTime) ||
    nanoTime >= desktopTime ||
    helperTime >= desktopTime
  ) {
    fail('Nano-first merge ordering is not proved');
  }
}

function readJson<T>(path: string): T {
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(value)) fail(`${path} is not a JSON object`);
  return value as T;
}

function readFinalReceipt(path: string): FinalReceipt {
  const raw = readFileSync(path, 'utf8');
  try {
    return JSON.parse(raw) as FinalReceipt;
  } catch {
    const match = raw.match(/```(?:json|phase2-desktop-final-receipt)\s*([\s\S]*?)```/);
    if (!match) fail('external final receipt has no machine-readable JSON block');
    return JSON.parse(match[1]) as FinalReceipt;
  }
}

function assertFinalReceipt(manifest: PremergeManifest, receipt: FinalReceipt): void {
  if (receipt.schema_version !== 'phase2-desktop-final-receipt-v1' || receipt.repository !== manifest.repository)
    fail('external final receipt schema/repository mismatch');
  if (!Number.isInteger(receipt.pr_number) || receipt.pr_number <= 0) fail('external receipt PR number is invalid');
  if (!Number.isInteger(receipt.review_id) || receipt.review_id <= 0) fail('external receipt review ID is invalid');
  if (receipt.reviewer !== 'TradeCanyon' || receipt.merger !== 'TradeCanyon')
    fail('external receipt reviewer/merger mismatch');
  if (receipt.approval_commit_sha !== receipt.reviewed_head_sha) fail('external receipt records a stale approval');
  if (
    receipt.reviewed_change.base_sha !== receipt.base_sha ||
    receipt.reviewed_change.commit_sha !== receipt.reviewed_head_sha ||
    receipt.squash_change.commit_sha !== receipt.squash_merge_sha ||
    receipt.implementation_input.commit_sha !== manifest.implementation_input.commit_sha
  )
    fail('external receipt commit/change binding mismatch');
  if (
    receipt.nano.repository !== manifest.nano.repository ||
    receipt.nano.source_commit_sha !== manifest.nano.source_commit_sha ||
    receipt.nano.merge_commit_sha !== manifest.nano.merge_commit_sha ||
    receipt.nano.cargo_lock_sha256 !== manifest.nano.cargo_lock_sha256 ||
    receipt.nano.cargo_lock_blob_sha !== manifest.nano.cargo_lock_blob_sha ||
    receipt.nano.ci_run_id !== manifest.nano.ci_run_id
  )
    fail('external receipt changed the immutable Nano input');
  if (
    receipt.nano_fixture_helper.repository !== manifest.nano_fixture_helper.repository ||
    receipt.nano_fixture_helper.source_commit_sha !== manifest.nano_fixture_helper.source_commit_sha ||
    receipt.nano_fixture_helper.merge_commit_sha !== manifest.nano_fixture_helper.merge_commit_sha ||
    receipt.nano_fixture_helper.cargo_lock_sha256 !== manifest.nano_fixture_helper.cargo_lock_sha256 ||
    receipt.nano_fixture_helper.ci_run_id !== manifest.nano_fixture_helper.ci_run_id ||
    receipt.nano_fixture_helper.merged_at !== manifest.nano_fixture_helper.merged_at ||
    receipt.nano_fixture_helper.merged_before_desktop !== true ||
    receipt.nano_fixture_helper.public_schema !== manifest.nano_fixture_helper.public_schema ||
    receipt.nano_fixture_helper.private_handoff_schema !== manifest.nano_fixture_helper.private_handoff_schema ||
    receipt.nano_fixture_helper.production_cli_exposure !== false
  )
    fail('external receipt changed the merged Nano fixture helper input');
  if (
    receipt.protection_no_bypass !== true ||
    receipt.default_off !== true ||
    receipt.governance_disclosure !== GOVERNANCE_DISCLOSURE
  )
    fail('external receipt omits no-bypass/default-off/disclosure');
  for (const check of REQUIRED_CHECKS) {
    if (!Number.isInteger(receipt.check_run_ids[check]) || receipt.check_run_ids[check] <= 0)
      fail(`external receipt check ID for ${check} is invalid`);
  }
  for (const check of manifest.artifact.workflow_checks) {
    if (!Number.isInteger(receipt.artifact_check_run_ids[check]) || receipt.artifact_check_run_ids[check] <= 0)
      fail(`external receipt artifact check ID for ${check} is invalid`);
  }
}

function parseArgs(args: string[]): {
  premerge: string;
  externalFinalReceipt?: string;
  expectedAuthor?: string;
  expectedReviewer?: string;
  rejectSelfReference: boolean;
} {
  const normalized = args[0] === '--' ? args.slice(1) : args;
  let premerge = '';
  let externalFinalReceipt: string | undefined;
  let expectedAuthor: string | undefined;
  let expectedReviewer: string | undefined;
  let rejectSelfReference = false;
  for (let index = 0; index < normalized.length; index += 1) {
    const value = normalized[index];
    if (value === '--premerge') premerge = normalized[++index] ?? '';
    else if (value === '--external-final-receipt') externalFinalReceipt = normalized[++index];
    else if (value === '--expected-author') expectedAuthor = normalized[++index];
    else if (value === '--expected-reviewer') expectedReviewer = normalized[++index];
    else if (value === '--reject-self-reference') rejectSelfReference = true;
    else if (!['--require-squash-change-identity', '--require-default-off', '--require-nano-first'].includes(value)) {
      fail(`unknown argument ${value}`);
    }
  }
  if (!premerge) fail('--premerge is required');
  return { premerge, externalFinalReceipt, expectedAuthor, expectedReviewer, rejectSelfReference };
}

function checkManifestArtifacts(manifest: PremergeManifest): void {
  const manifestBytes = readFileSync(manifest.artifact.manifest_path);
  const receiptBytes = readFileSync(manifest.artifact.receipt_path);
  const workflowBytes = readFileSync(manifest.artifact.workflow_file);
  if (sha256(manifestBytes) !== manifest.artifact.manifest_sha256) fail('artifact manifest hash mismatch');
  if (sha256(receiptBytes) !== manifest.artifact.receipt_sha256) fail('artifact receipt hash mismatch');
  if (sha256(workflowBytes) !== manifest.artifact.workflow_sha256) fail('artifact workflow hash mismatch');
  const implementation = computeChangeIdentity(
    manifest.implementation_input.base_sha,
    manifest.implementation_input.commit_sha
  );
  equalIdentity(manifest.implementation_input, implementation, 'implementation input');
}

export function findCheckRun(checkRuns: JsonObject[], name: string, expectedId?: number): JsonObject | undefined {
  return checkRuns.find(
    (candidate) => candidate.name === name && (expectedId === undefined || Number(candidate.id) === expectedId)
  );
}

function fetchSnapshot(manifest: PremergeManifest, finalReceipt?: FinalReceipt): GovernanceSnapshot {
  const repository = ghApi(`repos/${manifest.repository}`) as JsonObject;
  const issue = ghApi(`repos/${manifest.repository}/issues/${manifest.issue.number}`) as JsonObject;
  const assignees = Array.isArray(issue.assignees) ? issue.assignees : [];
  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  const protection = ghApi(`repos/${manifest.repository}/branches/${manifest.base_ref}/protection`) as JsonObject;
  const requiredStatus = protection.required_status_checks as JsonObject;
  const candidates = ghApi(
    `repos/${manifest.repository}/pulls?state=${finalReceipt ? 'all' : 'open'}&head=FerroxLabs:${manifest.head_ref}`
  ) as JsonObject[];
  const candidate = finalReceipt ? candidates.find((value) => value.number === finalReceipt.pr_number) : candidates[0];
  if (!candidate) fail('governed PR not found');
  const pr = ghApi(`repos/${manifest.repository}/pulls/${Number(candidate.number)}`) as JsonObject;
  const snapshot: GovernanceSnapshot = {
    repository: String(repository.full_name),
    default_branch: String(repository.default_branch),
    issue_open: issue.state === 'open',
    issue_assignee: String((assignees[0] as JsonObject | undefined)?.login ?? ''),
    issue_labels: labels.map((label) => String((label as JsonObject).name)).sort(),
    pr_base_ref: String((pr.base as JsonObject).ref),
    pr_base_sha: String((pr.base as JsonObject).sha),
    pr_head_ref: String((pr.head as JsonObject).ref),
    pr_author: String((pr.user as JsonObject).login),
    pr_head_sha: String((pr.head as JsonObject).sha),
    protection: {
      strict_checks: requiredStatus.strict === true,
      required_checks: ((requiredStatus.contexts as unknown[]) ?? []).map(String),
      linear_history: (protection.required_linear_history as JsonObject)?.enabled === true,
      enforce_admins: (protection.enforce_admins as JsonObject)?.enabled === true,
      allow_force_pushes: (protection.allow_force_pushes as JsonObject)?.enabled === true,
      allow_deletions: (protection.allow_deletions as JsonObject)?.enabled === true,
    },
  };
  const headSha = finalReceipt?.reviewed_head_sha ?? snapshot.pr_head_sha;
  const runsResponse = ghApi(`repos/${manifest.repository}/commits/${headSha}/check-runs?per_page=100`) as JsonObject;
  const checkRuns = (runsResponse.check_runs as JsonObject[]) ?? [];
  const checks: GovernanceSnapshot['checks'] = {};
  for (const name of REQUIRED_CHECKS) {
    const expectedId = finalReceipt?.check_run_ids[name];
    const candidates = expectedId
      ? [ghApi(`repos/${manifest.repository}/check-runs/${expectedId}`) as JsonObject]
      : checkRuns;
    const check = findCheckRun(candidates, name, expectedId);
    if (check)
      checks[name] = { conclusion: String(check.conclusion), head_sha: String(check.head_sha), id: Number(check.id) };
  }
  const artifactChecks: NonNullable<GovernanceSnapshot['artifact_checks']> = {};
  for (const name of manifest.artifact.workflow_checks) {
    const expectedId = finalReceipt?.artifact_check_run_ids[name];
    const candidates = expectedId
      ? [ghApi(`repos/${manifest.repository}/check-runs/${expectedId}`) as JsonObject]
      : checkRuns;
    const check = findCheckRun(candidates, name, expectedId);
    if (check)
      artifactChecks[name] = {
        conclusion: String(check.conclusion),
        head_sha: String(check.head_sha),
        id: Number(check.id),
      };
  }
  snapshot.checks = checks;
  snapshot.artifact_checks = artifactChecks;
  if (!finalReceipt) return snapshot;
  const reviews = ghApi(`repos/${manifest.repository}/pulls/${finalReceipt.pr_number}/reviews`) as JsonObject[];
  const approval = [...reviews]
    .reverse()
    .find((review) => (review.user as JsonObject)?.login === finalReceipt.reviewer);
  if (approval?.state !== 'APPROVED' || approval.commit_id !== finalReceipt.reviewed_head_sha)
    fail('latest reviewer disposition is not an approval of the exact head');
  const mergeParents = git('show', '-s', '--format=%P', finalReceipt.squash_merge_sha).split(/\s+/).filter(Boolean);
  const reviewedIdentity = computeChangeIdentity(finalReceipt.base_sha, finalReceipt.reviewed_head_sha);
  const mergeIdentity = computeChangeIdentity(mergeParents[0] ?? '', finalReceipt.squash_merge_sha);
  Object.assign(snapshot, {
    reviewed_head_sha: finalReceipt.reviewed_head_sha,
    approved_reviewer: (approval?.user as JsonObject | undefined)?.login,
    approval_review_id: Number(approval?.id),
    approval_commit_sha: approval?.commit_id,
    merged: pr.merged_at != null,
    merge_method: mergeParents.length === 1 ? 'squash' : 'merge',
    merger: (pr.merged_by as JsonObject | undefined)?.login,
    merge_sha: pr.merge_commit_sha,
    merge_parent_count: mergeParents.length,
    bypassed: false,
    reviewed_identity: reviewedIdentity,
    merge_identity: mergeIdentity,
    nano_merge_time: finalReceipt.nano.merged_at,
    nano_fixture_helper_merge_time: finalReceipt.nano_fixture_helper.merged_at,
    desktop_merge_time: String(pr.merged_at),
    default_off: finalReceipt.default_off,
    disclosure: finalReceipt.governance_disclosure,
  });
  return snapshot;
}

export function main(args = process.argv.slice(2)): void {
  const options = parseArgs(args);
  const manifest = readJson<PremergeManifest>(options.premerge);
  assertManifestShape(manifest);
  checkManifestArtifacts(manifest);
  const finalReceipt = options.externalFinalReceipt ? readFinalReceipt(options.externalFinalReceipt) : undefined;
  if (finalReceipt) assertFinalReceipt(manifest, finalReceipt);
  if (options.rejectSelfReference)
    assertNoSelfReference(manifest, options.premerge, finalReceipt?.reviewed_head_sha ?? 'HEAD');
  if (options.expectedAuthor && options.expectedAuthor !== manifest.expected_author) fail('expected author mismatch');
  if (options.expectedReviewer && finalReceipt?.reviewer !== options.expectedReviewer)
    fail('expected reviewer mismatch');
  if (finalReceipt && sha256(readFileSync(options.premerge)) !== finalReceipt.manifest_sha256) {
    fail('external receipt premerge manifest hash mismatch');
  }
  const snapshot = fetchSnapshot(manifest, finalReceipt);
  verifyGovernanceSnapshot(manifest, snapshot, finalReceipt);
  console.log(
    finalReceipt
      ? `Phase 2 Desktop postmerge governance verified for PR ${finalReceipt.pr_number}.`
      : 'Phase 2 Desktop premerge governance verified.'
  );
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
