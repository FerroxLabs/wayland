/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

type Step = {
  env?: Record<string, string>;
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  'continue-on-error'?: boolean;
};

type Job = {
  if?: string;
  name?: string;
  permissions?: Record<string, string>;
  steps?: Step[];
  strategy?: {
    matrix?: {
      include?: Array<Record<string, string>>;
    };
  };
};

type Workflow = {
  concurrency?: Record<string, unknown>;
  permissions?: Record<string, string>;
  on?: Record<string, unknown>;
  jobs?: Record<string, Job>;
};

const repoFile = (relativePath: string): string => path.resolve(process.cwd(), relativePath);
const readRepoFile = (relativePath: string): string => readFileSync(repoFile(relativePath), 'utf8');
const workflow = (name: string): Workflow => load(readRepoFile(`.github/workflows/${name}.yml`)) as Workflow;
const findStep = (job: Job | undefined, name: string): Step | undefined =>
  job?.steps?.find((step) => step.name === name);

describe('remaining GitHub workflow trust boundaries', () => {
  it('closes release issues only for a verified stable release and trusted structured marker', () => {
    const parsed = workflow('close-fixed-on-release');
    const job = parsed.jobs?.close;
    const validation = findStep(job, 'Validate the published release event');
    const checkout = findStep(job, 'Check out the release tag (to read the bundled engine version)');
    const closeStep = findStep(job, 'Close only the issues this release actually delivers');
    const validationScript = validation?.run ?? '';
    const script = closeStep?.run ?? '';

    expect(parsed.on).toEqual({ release: { types: ['published'] } });
    expect(parsed.concurrency).toMatchObject({ queue: 'max' });
    expect(job?.if).toContain('github.event.release.prerelease == false');
    expect(validation?.id).toBe('validate');
    expect(validationScript).toContain('OBJECT_TYPE');
    expect(validationScript).toContain('git/tags/$OBJECT_SHA');
    expect(validationScript).toContain('release_sha=');
    expect(checkout?.['continue-on-error']).not.toBe(true);
    expect(checkout?.with?.ref).toBe('${{ steps.validate.outputs.release_sha }}');
    expect(script).toContain('^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$');
    expect(script).toContain('git rev-parse HEAD');
    expect(script).toContain('EXPECTED_RELEASE_SHA');
    expect(script).toContain('.authorAssociation == "OWNER" or .authorAssociation == "MEMBER"');
    expect(script).toContain('MARKER_COUNT');
    expect(script).toContain("grep -oE 'fixed-in=[^[:space:]<>]+'");
    expect(script).toContain('core|wayland-core)');
    expect(script).toContain('getwayland|wayland-desktop|FerroxLabs/wayland|wayland)');
    expect(script).toContain('gte "$BUNDLED" "$ver"');
    expect(script).toContain('gte "$TAGV" "$ver"');
    expect(script).toContain('unknown carrier');
    expect(script).toContain('if ! gh issue close');
    expect(script).toContain("--add-label 'state:fixed-pending-release'");
    expect(script).not.toContain("--remove-label 'state:fixed-pending-release' || true");
    expect(script).not.toMatch(/\*\)\s*\[\s*"\$ver"\s*=\s*"\$TAGV"\s*\]/);
  });

  it('runs the WSL live test only for its immutable push SHA with read-only permissions', () => {
    const parsed = workflow('wsl-detect-live');
    const checkout = findStep(parsed.jobs?.['wsl-detect'], 'Checkout');

    expect(parsed.on).not.toHaveProperty('workflow_dispatch');
    expect(parsed.permissions).toEqual({ contents: 'read' });
    expect(checkout?.with?.ref).toBe('${{ github.sha }}');
    expect(checkout?.with?.['persist-credentials']).toBe(false);
  });

  it('keeps scheduled upstream sync credentials out of checkout and branch-selected dispatches', () => {
    const parsed = workflow('upstream-sync');
    const job = parsed.jobs?.sync;
    const checkout = job?.steps?.find((step) => step.uses?.startsWith('actions/checkout@'));
    const update = findStep(job, 'Open or update sync PR');
    const script = update?.run ?? '';

    expect(parsed.on).not.toHaveProperty('workflow_dispatch');
    expect(parsed.concurrency).toMatchObject({ queue: 'max' });
    expect(checkout?.with?.['persist-credentials']).toBe(false);
    expect(checkout?.with).not.toHaveProperty('token');
    expect(script).toContain('git/refs/heads/$SYNC_BRANCH');
    expect(script).not.toContain('git push');
  });

  it('fails closed when the Discord SEV-1 notification is not delivered', () => {
    const parsed = workflow('sev1-alert');
    const alert = parsed.jobs?.alert;
    const notify = findStep(alert, 'Notify Sean on Discord');
    const script = notify?.run ?? '';

    expect(parsed.on).not.toHaveProperty('workflow_dispatch');
    expect(alert?.if).toBe("github.event.label.name == 'priority:critical'");
    expect(script).toContain('set -euo pipefail');
    expect(script).toContain('[ -z "$DISCORD_BOT_TOKEN" ]');
    expect(script).toContain('--fail-with-body');
    expect(script).toContain('--connect-timeout');
    expect(script).toContain('--max-time');
    expect(script).toContain("jq -e '.id | strings | length > 0'");
  });

  it('reads only regular blobs from the immutable expected PR head', () => {
    const source = readRepoFile('.github/actions/read-file-contents/action.yml');

    expect(source).toContain('expected_head_sha');
    expect(source).toContain('execFileSync');
    expect(source).toContain("['rev-parse', 'HEAD']");
    expect(source).toContain('pr_head_sha.txt');
    expect(source).toContain("['ls-tree', '-z'");
    expect(source).toContain("['cat-file', 'blob'");
    expect(source).toContain("mode !== '100644' && mode !== '100755'");
    expect(source).toContain('maxBuffer');
    expect(source).toContain('catch (error) {');
    expect(source).toContain('Immutable PR content read failed');
    expect(source).not.toContain('} catch {\n              // File might not exist in checkout');
  });

  it('derives gathered PR metadata and diff from one immutable base/head pair', () => {
    const source = readRepoFile('.github/actions/gather-pr-diff/action.yml');

    expect(source).toContain('base_sha');
    expect(source).toContain('head_sha');
    expect(source).toContain('pr_head_sha.txt');
    expect(source).toContain('compareCommitsWithBasehead');
    expect(source).toContain('application/vnd.github.diff');
    expect(source).toContain('baseSha');
    expect(source).toContain('headSha');
    expect(source).toContain('300 changed files');
    expect(source).not.toContain('pulls.listFiles');
  });

  it('writes OpenAI output only to a regular file directly inside RUNNER_TEMP', () => {
    const source = readRepoFile('.github/actions/call-openai/action.yml');

    expect(source).toContain('path.basename');
    expect(source).toContain('path.resolve');
    expect(source).toContain('path.relative');
    expect(source).toContain('fs.constants.O_NOFOLLOW');
    expect(source).toContain('fs.fstatSync');
    expect(source).toContain('fs.lstatSync');
    expect(source).toContain('fs.readSync');
    expect(source).toContain('MAX_PROMPT_BYTES');
    expect(source).toContain('REQUEST_TIMEOUT_MS');
    expect(source).toContain('AbortSignal.timeout');
    expect(source).toContain("errorName === 'TimeoutError'");
    expect(source).toContain('await response.body?.cancel()');
    expect(source).not.toContain('fs.readFileSync(`${tmpDir}/system_prompt.txt`');
  });

  it.each(['pr-e2e-artifacts', 'release-gates', 'pr-checks', 'pr-checks-docs', 'build-matrix', '_build-reusable'])(
    'does not duplicate or ignore the root postinstall in %s',
    (workflowName) => {
      const parsed = workflow(workflowName);
      const steps = Object.values(parsed.jobs ?? {}).flatMap((job) => job.steps ?? []);

      expect(steps.some((step) => /\b(?:bun|npm) run postinstall\b/.test(step.run ?? ''))).toBe(false);
      expect(steps.map((step) => step.run ?? '').join('\n')).not.toContain('postinstall || true');
    }
  );

  it('fails the PR coverage job when coverage execution fails', () => {
    const parsed = workflow('pr-checks');
    const coverage = findStep(parsed.jobs?.['coverage-tests'], 'Run coverage tests');
    const summary = findStep(parsed.jobs?.['coverage-tests'], 'Coverage result summary');

    expect(coverage?.run).toBe('bun run test:coverage');
    expect(coverage?.['continue-on-error']).not.toBe(true);
    expect(summary?.run).not.toContain('non-blocking');
  });

  it('enforces the measured conservative global coverage ratchet', () => {
    const source = readRepoFile('vitest.config.ts');
    const thresholds = source.match(/thresholds:\s*\{([\s\S]*?)\}/)?.[1] ?? '';

    expect(thresholds).toContain('statements: 50');
    expect(thresholds).toContain('branches: 40');
    expect(thresholds).toContain('functions: 45');
    expect(thresholds).toContain('lines: 50');
  });

  it.each([
    ['_build-reusable', 'build'],
    ['build-matrix', 'build'],
  ])('requires WhatsApp bridge dependencies in packaged builds for %s', (workflowName, jobName) => {
    const parsed = workflow(workflowName);
    const install = findStep(parsed.jobs?.[jobName], 'Install dependencies');

    expect(install?.env?.WAYLAND_STRICT_PACKAGING).toBe('1');
  });

  it('binds i18n regression validation to the immutable PR base', () => {
    const parsed = workflow('pr-checks');
    const job = parsed.jobs?.['i18n-check'];
    const checkout = findStep(job, 'Checkout code');
    const validation = findStep(job, 'Run i18n validation');

    expect(checkout?.with?.['fetch-depth']).toBe(0);
    expect(validation?.env?.I18N_BASE_SHA).toBe('${{ github.event.pull_request.base.sha }}');
  });

  it('runs a checksum-pinned, redacted PR delta secret scan in the required code-quality job', () => {
    const parsed = workflow('pr-checks');
    const job = parsed.jobs?.['code-quality'];
    const install = findStep(job, 'Install checksum-pinned Gitleaks');
    const scan = findStep(job, 'Scan PR commit delta for secrets');
    const installScript = install?.run ?? '';
    const scanScript = scan?.run ?? '';

    expect(job?.name).toBe('Code Quality');
    expect(installScript).toContain('gitleaks_8.30.1_linux_x64.tar.gz');
    expect(installScript).toContain('551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb');
    expect(installScript).toContain('sha256sum --check --strict');
    expect(installScript).toContain("--proto '=https'");
    expect(scan?.env?.BASE_SHA).toBe('${{ github.event.pull_request.base.sha }}');
    expect(scan?.env?.HEAD_SHA).toBe('${{ needs.resolve-pr-context.outputs.checkout_ref }}');
    expect(scanScript).toContain('git rev-parse HEAD');
    expect(scanScript).toContain('git show "$BASE_SHA:.gitleaks.toml"');
    expect(scanScript).toContain('--log-opts="$BASE_SHA..$HEAD_SHA"');
    expect(scanScript).toContain('--redact=100');
    expect(scanScript).not.toContain('--all');
  });

  it('uses a supported GitHub runner for Intel macOS builds', () => {
    const parsed = workflow('build-matrix');
    const include = parsed.jobs?.build?.strategy?.matrix?.include ?? [];
    const macosX64 = include.find((entry) => entry.platform === 'macos-x64');

    expect(macosX64?.os).toBe('macos-15-intel');
    expect(readRepoFile('.github/workflows/build-matrix.yml')).not.toContain('macos-13');
  });

  it('uses meaningful E2E concurrency and requires the report artifact', () => {
    const parsed = workflow('pr-e2e-artifacts');
    const upload = findStep(
      parsed.jobs?.['e2e-artifacts'],
      'Upload E2E report (self-contained with screenshots & traces)'
    );

    expect(parsed.concurrency?.group).not.toContain('github.run_id');
    expect(upload?.with?.['if-no-files-found']).toBe('error');
  });
});
