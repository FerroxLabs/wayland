/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import {
  GOVERNANCE_DISCLOSURE,
  REQUIRED_CHECKS,
  type ChangeIdentity,
  type FinalReceipt,
  type GovernanceSnapshot,
  type PremergeManifest,
  findCheckRun,
  verifyGovernanceSnapshot,
} from '../../../scripts/verify-phase2-pr-governance';

const hex = (character: string, length: number): string => character.repeat(length);
const base = hex('1', 40);
const inputCommit = hex('2', 40);
const reviewedCommit = hex('3', 40);
const mergeCommit = hex('4', 40);

const identity = (commit_sha: string): ChangeIdentity => ({
  base_sha: base,
  commit_sha,
  tree_sha: hex('5', 40),
  normalized_diff_sha256: hex('6', 64),
  stable_patch_id: hex('7', 40),
  changed_paths_sha256: hex('8', 64),
});

const manifest = (): PremergeManifest => ({
  schema_version: 'phase2-desktop-premerge-v1',
  repository: 'FerroxLabs/wayland',
  base_ref: 'main',
  head_ref: 'feat/nano-activation-boundary',
  expected_author: 'FerroxLabs',
  issue: {
    repository: 'FerroxLabs/wayland',
    number: 1201,
    state: 'OPEN',
    assignee: 'FerroxLabs',
    labels: ['area:desktop-ui', 'needs:desktop', 'state:in-progress'],
  },
  governance: {
    merge_method: 'squash',
    linear_history_required: true,
    admin_enforcement_required: true,
    bypass_forbidden: true,
    disclosure: GOVERNANCE_DISCLOSURE,
  },
  required_checks: [...REQUIRED_CHECKS],
  nano: {
    repository: 'FerroxLabs/wayland-nano',
    source_commit_sha: '288de9ed3185c91717f8f777c9975c784709e824',
    merge_commit_sha: '1d80ecf93c1ec5fe14e89a44e89c4a0142ba1c9b',
    cargo_lock_sha256: '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a',
    cargo_lock_blob_sha: '7bb979cf829f7bf0a63692d8485bfc8e4935ed13',
    ci_run_id: 33318936491,
    merged_before_desktop: true,
  },
  nano_fixture_helper: {
    repository: 'FerroxLabs/wayland-nano',
    source_commit_sha: '2f7b33f4ad9344aea1ce78fc9fb09600a6f50dbe',
    merge_commit_sha: 'c10dcb9b0964a23df7b5bb2760ef494c4e15369d',
    cargo_lock_sha256: '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a',
    ci_run_id: 33369702224,
    merged_at: '2026-08-31T08:13:47Z',
    merged_before_desktop: true,
    public_schema: 'wayland.nano.phase2-fixture/v2',
    private_handoff_schema: 'wayland.nano.phase2-fixture-private/v1',
    production_cli_exposure: false,
  },
  artifact: {
    workflow_file: '.github/workflows/wayland-nano-activation.yml',
    workflow_name: 'Wayland Nano exact artifact',
    workflow_checks: [
      'Exact artifact (ubuntu-latest)',
      'Exact artifact (windows-latest)',
      'Production bootstrap contract',
    ],
    workflow_sha256: hex('f', 64),
    build_recipe: ['cargo build --locked --release -p nano-cli'],
    expected_compile_identity: {
      source_commit_sha: '288de9ed3185c91717f8f777c9975c784709e824',
      cargo_lock_sha256: '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a',
    },
    manifest_path: 'docs/evidence/phase2/activation-artifact-manifest.json',
    manifest_sha256: hex('9', 64),
    receipt_path: 'docs/evidence/phase2/activation-negative-crash-receipt.json',
    receipt_sha256: hex('a', 64),
    fixture_hashes: { row_ids_sha256: '11ff503f21b85bb84cbd5a98a94f209fea2ffb1d6bc16f78ce73f50552a9b754' },
    matrix_counts: { positive: 5, negative: 26, total: 31 },
  },
  implementation_input: identity(inputCommit),
  default_off: true,
});

const finalReceipt = (): FinalReceipt => ({
  schema_version: 'phase2-desktop-final-receipt-v1' as const,
  repository: 'FerroxLabs/wayland' as const,
  pr_number: 99,
  base_sha: base,
  reviewed_head_sha: reviewedCommit,
  reviewer: 'TradeCanyon',
  review_id: 101,
  approval_commit_sha: reviewedCommit,
  merger: 'TradeCanyon',
  squash_merge_sha: mergeCommit,
  check_run_ids: Object.fromEntries(REQUIRED_CHECKS.map((name, index) => [name, index + 10])),
  artifact_check_run_ids: {
    'Exact artifact (ubuntu-latest)': 20,
    'Exact artifact (windows-latest)': 21,
    'Production bootstrap contract': 22,
  },
  implementation_input: identity(inputCommit),
  reviewed_change: identity(reviewedCommit),
  squash_change: identity(mergeCommit),
  manifest_sha256: hex('c', 64),
  nano: { ...manifest().nano, merged_at: '2026-08-29T00:00:00Z' },
  nano_fixture_helper: { ...manifest().nano_fixture_helper },
  desktop_merged_at: '2026-09-01T00:00:00Z',
  default_off: true as const,
  protection_no_bypass: true as const,
  governance_disclosure: GOVERNANCE_DISCLOSURE,
});

const snapshot = (): GovernanceSnapshot => ({
  repository: 'FerroxLabs/wayland',
  default_branch: 'main',
  issue_open: true,
  issue_assignee: 'FerroxLabs',
  issue_labels: ['area:desktop-ui', 'needs:desktop', 'state:in-progress'],
  pr_base_ref: 'main',
  pr_base_sha: base,
  pr_head_ref: 'feat/nano-activation-boundary',
  pr_author: 'FerroxLabs',
  pr_head_sha: reviewedCommit,
  reviewed_head_sha: reviewedCommit,
  approved_reviewer: 'TradeCanyon',
  approval_review_id: 101,
  approval_commit_sha: reviewedCommit,
  checks: Object.fromEntries(
    REQUIRED_CHECKS.map((name, index) => [name, { conclusion: 'success', head_sha: reviewedCommit, id: index + 10 }])
  ),
  artifact_checks: {
    'Exact artifact (ubuntu-latest)': { conclusion: 'success', head_sha: reviewedCommit, id: 20 },
    'Exact artifact (windows-latest)': { conclusion: 'success', head_sha: reviewedCommit, id: 21 },
    'Production bootstrap contract': { conclusion: 'success', head_sha: reviewedCommit, id: 22 },
  },
  protection: {
    strict_checks: true,
    required_checks: [...REQUIRED_CHECKS],
    linear_history: true,
    enforce_admins: true,
    allow_force_pushes: false,
    allow_deletions: false,
  },
  merged: true,
  merge_method: 'squash',
  merger: 'TradeCanyon',
  merge_sha: mergeCommit,
  merge_parent_count: 1,
  bypassed: false,
  reviewed_identity: identity(reviewedCommit),
  merge_identity: identity(mergeCommit),
  nano_merge_time: '2026-08-29T00:00:00Z',
  nano_fixture_helper_merge_time: '2026-08-31T08:13:47Z',
  desktop_merge_time: '2026-09-01T00:00:00Z',
  default_off: true,
  disclosure: GOVERNANCE_DISCLOSURE,
});

describe('Phase 2 squash governance', () => {
  it('selects the receipt-frozen check when a newer skipped run has the same name', () => {
    const runs = [
      { id: 999, name: 'Code Quality', conclusion: 'skipped' },
      { id: 10, name: 'Code Quality', conclusion: 'success' },
    ];
    expect(findCheckRun(runs, 'Code Quality', 10)?.id).toBe(10);
    expect(findCheckRun(runs, 'Code Quality', 11)).toBeUndefined();
  });

  it('requires the tracked issue open premerge but permits it closed postmerge', () => {
    const state = snapshot();
    state.issue_open = false;
    expect(() => verifyGovernanceSnapshot(manifest(), state)).toThrow(/issue 1201 is stale\/unclaimed/);
    expect(() => verifyGovernanceSnapshot(manifest(), state, finalReceipt())).not.toThrow();
  });

  it.each([
    ['assignee', (state: GovernanceSnapshot) => (state.issue_assignee = 'wrong-owner')],
    ['labels', (state: GovernanceSnapshot) => (state.issue_labels = ['wrong-label'])],
  ])('retains postmerge issue %s governance', (_name, mutate) => {
    const state = snapshot();
    state.issue_open = false;
    mutate(state);
    expect(() => verifyGovernanceSnapshot(manifest(), state, finalReceipt())).toThrow(/issue 1201 is stale\/unclaimed/);
  });

  it('rejects a successful check whose run ID differs from the final receipt', () => {
    const state = snapshot();
    state.checks!['Code Quality'].id = 999;
    expect(() => verifyGovernanceSnapshot(manifest(), state, finalReceipt())).toThrow(/required check Code Quality/);
  });

  it('accepts exact change identity without requiring reviewed-head ancestry', () => {
    expect(() => verifyGovernanceSnapshot(manifest(), snapshot(), finalReceipt())).not.toThrow();
  });

  it.each([
    ['stale approval', (state: GovernanceSnapshot) => (state.approval_commit_sha = inputCommit)],
    ['stale head', (state: GovernanceSnapshot) => (state.pr_head_sha = inputCommit)],
    [
      'stale check',
      (state: GovernanceSnapshot) => {
        state.checks!['Code Quality'].head_sha = inputCommit;
      },
    ],
    ['branch-protection bypass', (state: GovernanceSnapshot) => (state.protection.enforce_admins = false)],
    ['merge bypass', (state: GovernanceSnapshot) => (state.bypassed = true)],
    [
      'wrong tree',
      (state: GovernanceSnapshot) => {
        state.merge_identity!.tree_sha = hex('d', 40);
      },
    ],
    [
      'wrong patch',
      (state: GovernanceSnapshot) => {
        state.merge_identity!.stable_patch_id = hex('e', 40);
      },
    ],
    ['non-squash merge', (state: GovernanceSnapshot) => (state.merge_parent_count = 2)],
  ])('rejects %s', (_name, mutate) => {
    const state = snapshot();
    mutate(state);
    expect(() => verifyGovernanceSnapshot(manifest(), state, finalReceipt())).toThrow();
  });

  it('rejects an ancestry-only proof with no independent reviewed/squash identity', () => {
    const state = snapshot();
    delete state.reviewed_identity;
    delete state.merge_identity;
    expect(() => verifyGovernanceSnapshot(manifest(), state, finalReceipt())).toThrow(/identity evidence missing/);
  });

  it('rejects a self-referential final-head field in the committed manifest schema', () => {
    const selfReferential = manifest() as PremergeManifest & { final_head_sha: string };
    selfReferential.final_head_sha = reviewedCommit;
    expect(() => verifyGovernanceSnapshot(selfReferential, snapshot())).toThrow(/self-referential/);
  });

  it.each([
    ['helper source', (value: PremergeManifest) => (value.nano_fixture_helper.source_commit_sha = hex('0', 40))],
    ['helper merge', (value: PremergeManifest) => (value.nano_fixture_helper.merge_commit_sha = hex('0', 40))],
    ['helper CI', (value: PremergeManifest) => (value.nano_fixture_helper.ci_run_id = 1)],
    [
      'helper public schema',
      (value: PremergeManifest) =>
        (value.nano_fixture_helper.public_schema = 'wrong' as 'wayland.nano.phase2-fixture/v2'),
    ],
  ])('rejects wrong %s provenance', (_name, mutate) => {
    const value = manifest();
    mutate(value);
    expect(() => verifyGovernanceSnapshot(value, snapshot(), finalReceipt())).toThrow(
      /fixture helper provenance mismatch/
    );
  });

  it('rejects a final receipt that changes the merged helper input', () => {
    const receipt = finalReceipt();
    receipt.nano_fixture_helper.ci_run_id = 1;
    expect(() => verifyGovernanceSnapshot(manifest(), snapshot(), receipt)).toThrow(/merged Nano fixture helper/);
  });
});
