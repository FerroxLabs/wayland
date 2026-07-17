/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// RT-B6-04: a renderer-supplied `repo` (or WAYLAND_GITHUB_REPO in a packaged
// build) must NOT redirect the update-metadata / integrity-verification source.
// The repo used for the GitHub API calls that yield the signed SHA-512 metadata
// must stay pinned to the canonical build-time constant.

import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { load } from 'js-yaml';
import { describe, it, expect, vi, beforeEach } from 'vitest';

type WorkflowStep = {
  name?: string;
  if?: string;
  uses?: string;
  run?: string;
  env?: Record<string, unknown>;
  with?: Record<string, unknown>;
  'continue-on-error'?: boolean;
};

type WorkflowJob = {
  needs?: string | string[];
  if?: string;
  uses?: string;
  environment?: string | { name?: string; deployment?: boolean };
  permissions?: Record<string, string>;
  with?: Record<string, unknown>;
  secrets?: unknown;
  steps?: WorkflowStep[];
};

type Workflow = {
  'run-name'?: string;
  concurrency?: {
    group?: string;
    'cancel-in-progress'?: boolean;
    queue?: 'single' | 'max';
  };
  permissions?: Record<string, string>;
  on?: {
    push?: {
      branches?: string[];
      tags?: string[];
    };
    workflow_call?: {
      inputs?: Record<string, unknown>;
      secrets?: Record<string, { required?: boolean }>;
    };
    workflow_dispatch?: {
      inputs?: Record<string, unknown>;
    };
    issue_comment?: {
      types?: string[];
    };
    repository_dispatch?: {
      types?: string[];
    };
  };
  jobs?: Record<string, WorkflowJob>;
};

type BuilderConfig = {
  win?: {
    azureSignOptions?: Record<string, unknown>;
    forceCodeSigning?: boolean;
    verifyUpdateCodeSignature?: boolean;
  };
  publish?: Record<string, unknown>;
};

type PackageManifest = {
  dependencies?: Record<string, string>;
  patchedDependencies?: Record<string, string>;
};

type PackagedRequirement = { rel: string; critical: boolean; kind: string };

type VerifierModule = {
  REQUIRED: PackagedRequirement[];
  validateAppUpdateMetadataText: (content: string) => boolean;
  verifyResourceDir: (
    resourceDir: string,
    requirements?: PackagedRequirement[]
  ) => Array<{ requirement: PackagedRequirement; ok: boolean }>;
};

type UnsignedWindowsOverrides = (builderArguments: string, env: Record<string, string | undefined>) => string[];

const repoFile = (relativePath: string): string => path.resolve(process.cwd(), relativePath);

const readRepoFile = (relativePath: string): string => readFileSync(repoFile(relativePath), 'utf8');

const loadWorkflow = (relativePath: string): Workflow => load(readRepoFile(relativePath)) as Workflow;

const listYamlFiles = (relativeDirectory: string): string[] => {
  const files: string[] = [];
  const visit = (relativePath: string): void => {
    for (const entry of readdirSync(repoFile(relativePath), { withFileTypes: true })) {
      const child = path.join(relativePath, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (/\.ya?ml$/i.test(entry.name)) files.push(child);
    }
  };

  visit(relativeDirectory);
  return files;
};

const getCheckoutJobs = (workflow: Workflow): Array<[string, WorkflowJob]> =>
  Object.entries(workflow.jobs ?? {}).filter(([, job]) =>
    job.steps?.some((step) => step.uses?.startsWith('actions/checkout@'))
  );

const findStep = (workflow: Workflow, name: string): WorkflowStep => {
  const step = workflow.jobs?.build?.steps?.find((candidate) => candidate.name === name);
  if (!step) throw new Error(`Missing workflow step: ${name}`);
  return step;
};

const loadVerifierModule = (): VerifierModule => {
  const source = readRepoFile('scripts/verify-packaged-resources.js');
  expect(source).toContain('if (require.main === module)');

  const require = createRequire(import.meta.url);
  return require(repoFile('scripts/verify-packaged-resources.js')) as VerifierModule;
};

const loadUnsignedWindowsOverrides = (): UnsignedWindowsOverrides => {
  const source = readRepoFile('scripts/build-with-builder.js');
  const start = source.indexOf('function getUnsignedWindowsConfigOverrides');
  const end = source.indexOf('// Parse command line arguments', start);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  const declaration = source.slice(start, end);
  return Function(
    `'use strict';\n${declaration}\nreturn getUnsignedWindowsConfigOverrides;`
  )() as UnsignedWindowsOverrides;
};

vi.mock('@office-ai/platform', () => ({
  bridge: {
    buildProvider: vi.fn(() => {
      const handlerMap = new Map<string, Function>();
      return {
        provider: vi.fn((handler: Function) => {
          handlerMap.set('handler', handler);
          return vi.fn();
        }),
        invoke: vi.fn(),
        _getHandler: () => handlerMap.get('handler'),
      };
    }),
    buildEmitter: vi.fn(() => ({
      emit: vi.fn(),
      on: vi.fn(),
    })),
  },
  storage: {
    buildStorage: () => ({
      getSync: () => undefined,
      setSync: () => {},
      get: () => Promise.resolve(undefined),
      set: () => Promise.resolve(),
    }),
  },
}));

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn(() => '/test/path'),
    isPackaged: true,
  },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    logger: null,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    allowPrerelease: false,
    allowDowngrade: false,
    on: vi.fn(),
    removeListener: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    checkForUpdatesAndNotify: vi.fn(),
  },
}));

vi.mock('electron-log', () => ({
  default: {
    transports: { file: { level: 'info' } },
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/process/services/ijfwSystemService', () => ({
  ijfwSystemService: {
    detectLocalInstall: vi.fn(async () => ({
      installed: false,
      detectedVia: 'none',
      pathProbe: { homebrew: false, usrLocal: false, standardPath: false },
    })),
    getLatestPublished: vi.fn(async () => '1.6.0'),
  },
}));

const CANONICAL_REPO = 'FerroxLabs/wayland';

const getCheckHandler = async () => {
  vi.resetModules();
  const { initUpdateBridge } = await import('@process/bridge/updateBridge');
  const { ipcBridge } = await import('@/common');

  initUpdateBridge();

  const provider = vi.mocked(ipcBridge.update.check.provider);
  const lastCall = provider.mock.calls.at(-1);
  if (!lastCall) throw new Error('update.check handler not registered');
  return lastCall[0];
};

/** Extract every distinct GitHub API repo slug the handler fetched. */
const githubReposHit = (fetchMock: ReturnType<typeof vi.fn>): string[] => {
  const slugs = new Set<string>();
  for (const call of fetchMock.mock.calls) {
    const url = String(call[0]);
    const m = url.match(/^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\//);
    if (m) slugs.add(m[1]);
  }
  return [...slugs];
};

describe('pull-request workflow security contracts', () => {
  const workflowPaths = ['.github/workflows/pr-checks.yml', '.github/workflows/pr-checks-docs.yml'];
  const codeJobNames = [
    'code-quality',
    'unit-tests',
    'coverage-tests',
    'i18n-check',
    'security-audit',
    'release-script-test',
  ];

  it('keeps every PR-code job restricted to the read-only workflow token', () => {
    const workflow = loadWorkflow(workflowPaths[0]);

    expect(workflow.permissions).toEqual({ contents: 'read' });
    const codeJobs = getCheckoutJobs(workflow);
    expect(codeJobs.map(([name]) => name)).toEqual(codeJobNames);
    for (const [jobName, job] of codeJobs) {
      expect(job.permissions, `${jobName} must inherit read-only permissions`).toBeUndefined();
      expect(job.secrets, `${jobName} must not receive secrets`).toBeUndefined();
    }
  });

  it('has no comment-triggered privileged rerun path and keeps every job pull_request-only', () => {
    const workflow = loadWorkflow(workflowPaths[0]);

    expect(workflow.on).not.toHaveProperty('workflow_dispatch');
    expect(workflow.on).not.toHaveProperty('issue_comment');
    expect(workflow.jobs).not.toHaveProperty('rerun-pr-checks');

    for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
      expect(job.if, `${jobName} must be pull_request-only`).toContain("github.event_name == 'pull_request'");
      expect(job.permissions, `${jobName} must not grant action-rerun authority`).not.toMatchObject({
        actions: 'write',
      });
    }

    const rawWorkflow = readRepoFile(workflowPaths[0]);
    expect(rawWorkflow).not.toContain('/rerun-pr-checks');
    expect(rawWorkflow).not.toContain('actions/runs/$RUN_ID/rerun');
  });

  it('checks out one resolved immutable SHA in every pull-request code job without persisting credentials', () => {
    const workflow = loadWorkflow(workflowPaths[0]);

    for (const [jobName, job] of getCheckoutJobs(workflow)) {
      const needs = Array.isArray(job?.needs) ? job.needs : [job?.needs];
      const checkout = job?.steps?.find((step) => step.uses?.startsWith('actions/checkout@'));

      expect(needs).toContain('resolve-pr-context');
      expect(job.if, `${jobName} must be pull_request-only`).toContain("github.event_name == 'pull_request'");
      expect(job.if, `${jobName} must not execute during workflow_dispatch`).not.toContain(
        "github.event_name == 'workflow_dispatch'"
      );
      expect(job.if, `${jobName} must not execute during issue_comment`).not.toContain(
        "github.event_name == 'issue_comment'"
      );
      expect(checkout?.with?.ref).toBe('${{ needs.resolve-pr-context.outputs.checkout_ref }}');
      expect(checkout?.with?.['persist-credentials']).toBe(false);
    }

    const rawWorkflow = readRepoFile(workflowPaths[0]);
    expect(rawWorkflow).not.toContain('./.github/actions/checkout-pr');
  });

  it('keeps cache access restricted to pull_request execution', () => {
    const workflow = loadWorkflow(workflowPaths[0]);
    const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);

    const cacheSteps = steps.filter((step) => /^actions\/cache(?:\/(?:restore|save))?@/.test(step.uses ?? ''));
    expect(cacheSteps.length).toBeGreaterThan(0);
    for (const step of cacheSteps) {
      expect(step.if).toContain("github.event_name == 'pull_request'");
    }
  });

  it('does not interpolate flexible workflow input or ref contexts directly into shell scripts', () => {
    for (const workflowPath of workflowPaths) {
      const workflow = loadWorkflow(workflowPath);
      const scripts = Object.values(workflow.jobs ?? {})
        .flatMap((job) => job.steps ?? [])
        .map((step) => step.run ?? '')
        .join('\n');

      expect(scripts).not.toMatch(/\$\{\{\s*inputs\./);
      expect(scripts).not.toMatch(/\$\{\{\s*github\.(?:base_ref|head_ref)/);
      expect(scripts).not.toMatch(/\$\{\{\s*github\.event\.pull_request/);
    }
  });

  it('keeps Codecov credentials and OIDC out of untrusted PR execution', () => {
    const rawWorkflow = readRepoFile(workflowPaths[0]);

    expect(rawWorkflow).not.toContain('CODECOV_TOKEN');
    expect(rawWorkflow).not.toContain('id-token');
    expect(rawWorkflow).not.toContain('codecov/codecov-action');
  });

  it('pins every external action and toolchain input to an immutable version', () => {
    for (const workflowPath of workflowPaths) {
      const workflow = loadWorkflow(workflowPath);
      const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
      const externalActions = steps
        .map((step) => step.uses)
        .filter((uses): uses is string => Boolean(uses) && !uses.startsWith('./'));

      expect(externalActions.length).toBeGreaterThan(0);
      for (const action of externalActions) {
        expect(action).toMatch(/^[^@]+@[0-9a-f]{40}$/);
      }

      for (const step of steps.filter((candidate) => candidate.name === 'Setup Node.js')) {
        expect(step.with?.['node-version']).toBe('24.18.0');
      }
      for (const step of steps.filter((candidate) => /Setup [Bb]un/.test(candidate.name ?? ''))) {
        expect(step.with?.['bun-version']).toBe('1.3.11');
      }

      const installPrek = steps.find((step) => step.name === 'Install prek');
      expect(installPrek?.run).toContain('@j178/prek@0.4.10');
    }
  });

  it('disables checkout credential persistence in the docs-only workflow', () => {
    const workflow = loadWorkflow(workflowPaths[1]);
    const checkout = workflow.jobs?.['code-quality']?.steps?.find((step) => step.name === 'Checkout code');

    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(checkout?.with?.['persist-credentials']).toBe(false);
  });

  it('removes the obsolete token-accepting local PR resolver action', () => {
    expect(existsSync(repoFile('.github/actions/checkout-pr/action.yml'))).toBe(false);
  });
});

describe('repository-wide GitHub Actions supply-chain contracts', () => {
  it('pins every external workflow and composite-action dependency to a full commit SHA', () => {
    const yamlFiles = [...listYamlFiles('.github/workflows'), ...listYamlFiles('.github/actions')];
    let externalActionCount = 0;

    for (const yamlFile of yamlFiles) {
      const source = readRepoFile(yamlFile);
      const actionRefs = [...source.matchAll(/^\s*(?:-\s*)?uses:\s*['"]?([^'"\s#]+)['"]?/gm)].map((match) => match[1]);

      for (const actionRef of actionRefs) {
        if (actionRef.startsWith('./') || actionRef.startsWith('docker://')) continue;
        externalActionCount += 1;
        expect(actionRef, `${yamlFile} must use an immutable external action ref`).toMatch(/^[^@\s]+@[0-9a-f]{40}$/);
      }
    }

    expect(externalActionCount).toBeGreaterThan(0);
  });
});

describe('updateBridge RT-B6-04 repo pinning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WAYLAND_GITHUB_REPO;
  });

  it('ignores a renderer-supplied repo and queries the canonical repo for update metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const handler = await getCheckHandler();
      const result = await handler({ repo: 'attacker/evil', includePrerelease: false });

      expect(result.success).toBe(true);

      const repos = githubReposHit(fetchMock);
      expect(repos).toEqual([CANONICAL_REPO]);
      expect(repos).not.toContain('attacker/evil');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ignores WAYLAND_GITHUB_REPO in a packaged build', async () => {
    process.env.WAYLAND_GITHUB_REPO = 'attacker/evil';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const handler = await getCheckHandler();
      await handler({ includePrerelease: false });

      const repos = githubReposHit(fetchMock);
      expect(repos).toEqual([CANONICAL_REPO]);
    } finally {
      vi.unstubAllGlobals();
      delete process.env.WAYLAND_GITHUB_REPO;
    }
  });
});

describe('release publication fail-closed contracts', () => {
  it('keeps manual builds on the protected main commit without inherited secrets', () => {
    const workflow = loadWorkflow('.github/workflows/build-manual.yml');
    const prepare = workflow.jobs?.['prepare-matrix'];
    const pipeline = workflow.jobs?.['build-pipeline'];

    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.on?.workflow_dispatch?.inputs).not.toHaveProperty('branch');
    expect(prepare?.if).toContain("github.ref == 'refs/heads/main'");
    expect(pipeline?.if).toContain("github.ref == 'refs/heads/main'");
    expect(pipeline?.with?.ref).toBe('${{ github.sha }}');
    expect(pipeline?.secrets).toBeUndefined();
  });

  it.each([
    ['.github/workflows/_build-reusable.yml', 2],
    ['.github/workflows/build-and-release.yml', 4],
    ['.github/workflows/sync-release.yml', 1],
    ['.github/workflows/build-matrix.yml', 1],
  ])('does not persist checkout credentials in %s', (workflowPath, expectedCount) => {
    const workflow = loadWorkflow(workflowPath);
    const checkoutSteps = Object.values(workflow.jobs ?? {})
      .flatMap((job) => job.steps ?? [])
      .filter((step) => step.uses?.startsWith('actions/checkout@'));

    expect(checkoutSteps).toHaveLength(expectedCount);
    for (const checkout of checkoutSteps) {
      expect(checkout.with?.['persist-credentials']).toBe(false);
    }
  });

  it.each([
    '.github/workflows/_build-reusable.yml',
    '.github/workflows/build-and-release.yml',
    '.github/workflows/sync-release.yml',
    '.github/workflows/build-matrix.yml',
  ])('pins every external action in %s to a full commit SHA', (workflowPath) => {
    const workflow = loadWorkflow(workflowPath);
    const jobs = Object.values(workflow.jobs ?? {});
    const actionRefs = [
      ...jobs.map((job) => job.uses),
      ...jobs.flatMap((job) => job.steps ?? []).map((step) => step.uses),
    ].filter((uses): uses is string => Boolean(uses) && !uses.startsWith('./'));
    const verifiedActionShas: Record<string, string[]> = {
      'actions/cache': ['0057852bfaa89a56745cba8c7296529d2fc39830'],
      'actions/checkout': ['34e114876b0b11c390a56381ad16ebd13914f8d5', 'df4cb1c069e1874edd31b4311f1884172cec0e10'],
      'actions/download-artifact': ['37930b1c2abaa49bbe596cd826c3c89aef350131'],
      'actions/setup-node': ['49933ea5288caeca8642d1e84afbd3f7d6820020'],
      'actions/setup-python': ['a26af69be951a213d495a4c3e4e4022e16d87065'],
      'actions/upload-artifact': [
        'b7c566a772e6b6bfb58ed0dc250532a479d7789f',
        'ea165f8d65b6e75b540449e92b4886f43607fa02',
      ],
      'jdx/mise-action': ['c37c93293d6b742fc901e1406b8f764f6fb19dac'],
      'microsoft/setup-msbuild': ['6fb02220983dee41ce7ae257b6f4d8f9bf5ed4ce'],
      'nick-fields/retry': ['ce71cc2ab81d554ebbe88c79ab5975992d79ba08'],
      'oven-sh/setup-bun': ['0c5077e51419868618aeaa5fe8019c62421857d6'],
      'softprops/action-gh-release': ['3bb12739c298aeb8a4eeaf626c5b8d85266b0e65'],
    };

    expect(actionRefs.length).toBeGreaterThan(0);
    expect(actionRefs.every((uses) => /^[^@]+@[0-9a-f]{40}$/.test(uses))).toBe(true);
    for (const uses of actionRefs) {
      const [action, sha] = uses.split('@');
      expect(verifiedActionShas[action]).toContain(sha);
    }
  });

  it('uses exact release-build runtime and native-tool versions', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
    const setupNodes = steps.filter((step) => step.uses?.startsWith('actions/setup-node@'));
    const setupBuns = steps.filter((step) => step.uses?.startsWith('oven-sh/setup-bun@'));
    const setupPython = steps.find((step) => step.uses?.startsWith('actions/setup-python@'));
    const nativeSetup = steps.find((step) => step.name === 'Setup Windows native dependencies (for Windows only)');

    expect(setupNodes.map((step) => step.with?.['node-version'])).toEqual(['22.23.1', '22.23.1']);
    expect(setupBuns.map((step) => step.with?.['bun-version'])).toEqual(['1.3.11', '1.3.11']);
    expect(setupPython?.with?.['python-version']).toBe('3.12.10');
    expect(nativeSetup?.run).toContain('node-gyp@13.0.0');
  });

  it('uses exact runtime versions in sync and matrix workflows', () => {
    const sync = loadWorkflow('.github/workflows/sync-release.yml');
    const matrix = loadWorkflow('.github/workflows/build-matrix.yml');
    const syncSteps = Object.values(sync.jobs ?? {}).flatMap((job) => job.steps ?? []);
    const matrixSteps = Object.values(matrix.jobs ?? {}).flatMap((job) => job.steps ?? []);

    expect(syncSteps.find((step) => step.uses?.startsWith('oven-sh/setup-bun@'))?.with?.['bun-version']).toBe('1.3.11');
    expect(matrixSteps.find((step) => step.uses?.startsWith('actions/setup-node@'))?.with?.['node-version']).toBe(
      '24.18.0'
    );
    expect(matrixSteps.find((step) => step.uses?.startsWith('oven-sh/setup-bun@'))?.with?.['bun-version']).toBe(
      '1.3.11'
    );
  });

  it('builds a validated release-tag package without OIDC before publishing it', () => {
    const workflow = loadWorkflow('.github/workflows/publish-npm.yml');
    const prepare = workflow.jobs?.['prepare-package'];
    const publish = workflow.jobs?.publish;
    const prepareSteps = prepare?.steps ?? [];
    const publishSteps = publish?.steps ?? [];
    const serialized = JSON.stringify(workflow);
    const validation = prepareSteps.find((step) => step.name === 'Validate tag and package version');
    const checkout = prepareSteps.find((step) => step.uses?.includes('actions/checkout'));
    const publishStep = publishSteps.find((step) => step.name === 'Publish verified tarball with OIDC');
    const actionRefs = [...prepareSteps, ...publishSteps]
      .map((step) => step.uses)
      .filter((uses): uses is string => Boolean(uses));

    expect(workflow.permissions).toEqual({});
    expect(workflow.on?.workflow_dispatch).toBeUndefined();
    expect(workflow.on?.repository_dispatch?.types).toEqual(['npm-publish']);
    expect(workflow['run-name']).toContain('github.event.client_payload.correlation');
    expect(workflow.concurrency).toEqual({
      group: 'publish-getwayland',
      'cancel-in-progress': false,
    });
    expect(prepare?.permissions).toEqual({ contents: 'read' });
    expect(prepare?.permissions).not.toHaveProperty('id-token');
    expect(publish?.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
    expect(publish?.environment).toBe('npm-publish');
    expect(checkout?.with?.['persist-credentials']).toBe(false);
    expect(validation?.run).toContain('merge-base --is-ancestor');
    expect(validation?.run).toContain('EXPECTED_SHA');
    expect(validation?.run).toContain('package.json');
    expect(validation?.run).toContain('^v(0|[1-9][0-9]*)\\.');
    expect(publishSteps.some((step) => step.uses?.includes('actions/checkout'))).toBe(false);
    expect(publishStep?.run).toContain('npm publish "$TARBALL" --ignore-scripts');
    expect(publishStep?.run).toContain('DIST_TAG=backfill');
    expect(publishStep?.run).toContain('CURRENT_VERSION=');
    expect(publishStep?.run).toContain('Requested version must be newer than the current dist-tag');
    expect(publishStep?.run).toContain('Existing version is not promoted');
    expect(publishStep?.env).toBeUndefined();
    expect(actionRefs.length).toBeGreaterThan(0);
    expect(actionRefs.every((uses) => /^[^@]+@[0-9a-f]{40}$/.test(uses))).toBe(true);
    expect(serialized).not.toContain('NPM_TOKEN');
    expect(serialized).not.toContain('NODE_AUTH_TOKEN');
  });

  it('waits for the correlated default-branch npm publisher before exposing the release', () => {
    const workflow = loadWorkflow('.github/workflows/build-and-release.yml');
    const publishRelease = workflow.jobs?.['publish-release'];
    const publishNpmStep = publishRelease?.steps?.find(
      (step) => step.name === 'Publish npm package and wait for success'
    );
    const exposeStep = publishRelease?.steps?.find((step) => step.name === 'Expose the verified release');
    const npmScript = publishNpmStep?.run ?? '';
    const exposeScript = exposeStep?.run ?? '';

    expect(workflow.jobs?.['publish-getwayland-npm']).toBeUndefined();
    expect(npmScript).toContain('event_type: "npm-publish"');
    expect(npmScript).toContain('expected_sha: $sha');
    expect(npmScript).toContain('gh run watch "$NPM_RUN_ID"');
    expect(npmScript).toContain('--exit-status');
    expect(npmScript).toContain('${{ github.run_id }}-${{ github.run_attempt }}');
    expect(npmScript).not.toContain('gh release edit');
    expect(exposeScript).toContain('gh release edit');
  });

  it('serializes all stable release runs in one global concurrency group', () => {
    const workflow = loadWorkflow('.github/workflows/build-and-release.yml');

    expect(workflow.concurrency).toEqual({
      group: 'stable-release',
      'cancel-in-progress': false,
      queue: 'max',
    });
  });

  it('queues every sync-triggered release instead of replacing a pending run', () => {
    const workflow = loadWorkflow('.github/workflows/sync-release.yml');

    expect(workflow.concurrency).toEqual({
      group: 'sync-release',
      'cancel-in-progress': false,
      queue: 'max',
    });
  });

  it('revalidates npm latest immediately before exposing a stable release', () => {
    const workflow = loadWorkflow('.github/workflows/build-and-release.yml');
    const expose = workflow.jobs?.['publish-release']?.steps?.find(
      (step) => step.name === 'Expose the verified release'
    );
    const script = expose?.run ?? '';
    const lookupIndex = script.indexOf('https://registry.npmjs.org/getwayland/latest');
    const mismatchIndex = script.indexOf('Promoted npm version mismatch');
    const exposeIndex = script.indexOf('gh release edit "$TAG"', mismatchIndex);

    expect(lookupIndex).toBeGreaterThanOrEqual(0);
    expect(mismatchIndex).toBeGreaterThan(lookupIndex);
    expect(exposeIndex).toBeGreaterThan(mismatchIndex);
    expect(script).toContain('exit 1');
  });

  it('loads secret-bearing release orchestration only from a default-branch repository event', () => {
    const workflow = loadWorkflow('.github/workflows/build-and-release.yml');
    const validation = workflow.jobs?.['validate-release-ref'];
    const pipeline = workflow.jobs?.['build-pipeline'];
    const validationScript = validation?.steps
      ?.map((step) => step.run ?? '')
      .filter(Boolean)
      .join('\n');

    expect(workflow.permissions).toEqual({});
    expect(workflow.on?.push).toBeUndefined();
    expect(workflow.on?.workflow_dispatch).toBeUndefined();
    expect(workflow.on?.repository_dispatch?.types).toEqual(['stable-release']);
    expect(validation?.permissions).toEqual({ contents: 'read' });
    expect(validationScript).toContain('^v(0|[1-9][0-9]*)\\.');
    expect(validationScript).toContain('merge-base --is-ancestor');
    expect(validationScript).toContain('package.json');
    expect(validationScript).toContain('EXPECTED_SHA');
    expect(pipeline?.needs).toBe('validate-release-ref');
    expect(pipeline?.if).toContain("needs.validate-release-ref.result == 'success'");
    expect(pipeline?.with?.ref).toBe('${{ needs.validate-release-ref.outputs.release_sha }}');
    expect(pipeline?.with?.release_tag).toBe('${{ needs.validate-release-ref.outputs.release_tag }}');
    expect(workflow.jobs?.['create-tag']).toBeUndefined();
    expect(workflow.jobs?.['auto-retry-workflow']).toBeUndefined();
  });

  it('sources release-build credentials only after the called job enters the protected environment', () => {
    const release = loadWorkflow('.github/workflows/build-and-release.yml');
    const reusable = loadWorkflow('.github/workflows/_build-reusable.yml');
    const pipelineSecrets = release.jobs?.['build-pipeline']?.secrets;

    expect(pipelineSecrets).toBeUndefined();
    expect(reusable.on?.workflow_call?.secrets).toBeUndefined();
    expect(reusable.jobs?.build?.environment).toEqual({
      name: "${{ inputs.release_tag != '' && 'release' || 'build-unprotected' }}",
      deployment: false,
    });
    expect(JSON.stringify(reusable.jobs?.build)).not.toContain('NPM_TOKEN');
  });

  it('dispatches automatic releases through the default-branch repository event', () => {
    const workflow = loadWorkflow('.github/workflows/sync-release.yml');
    const releaseStep = workflow.jobs?.['tag-release']?.steps?.find(
      (step) => step.name === 'Bump patch, commit, tag, push'
    );
    const script = releaseStep?.run ?? '';

    expect(script).toContain('event_type: "stable-release"');
    expect(script).toContain('expected_sha: $sha');
    expect(script).toContain('gh api --method POST');
  });

  it('does not expose the privileged sync release workflow to branch-selected manual dispatch', () => {
    const workflow = loadWorkflow('.github/workflows/sync-release.yml');

    expect(workflow.on).not.toHaveProperty('workflow_dispatch');
  });

  it('publishes a stable release only after release and both smoke gates succeed', () => {
    const workflow = loadWorkflow('.github/workflows/build-and-release.yml');
    const publish = workflow.jobs?.['publish-release'];
    const condition = publish?.if?.replace(/\s+/g, ' ').trim();

    expect(publish?.needs).toEqual(['release', 'release-smoke-gate', 'release-smoke-gate-windows']);
    expect(condition).toBe(
      "always() && needs.release.result == 'success' && needs.release-smoke-gate.result == 'success' && needs.release-smoke-gate-windows.result == 'success'"
    );
  });

  it('fails a stable Windows tag before building when any Azure credential is missing', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const guard = findStep(workflow, 'Require Azure signing credentials on release tag (Windows)');
    const script = guard.run ?? '';
    const conditionLine = script
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith('if '));

    expect(guard.env).toMatchObject({
      AZURE_TENANT_ID: expect.any(String),
      AZURE_CLIENT_ID: expect.any(String),
      AZURE_CLIENT_SECRET: expect.any(String),
    });
    expect(conditionLine).toBe(
      'if [ -z "${AZURE_TENANT_ID//[[:space:]]/}" ] || [ -z "${AZURE_CLIENT_ID//[[:space:]]/}" ] || [ -z "${AZURE_CLIENT_SECRET//[[:space:]]/}" ]; then'
    );
    expect(script).toContain('exit 1');
    expect(script).not.toContain('::warning title=Unsigned Windows build');
    expect(guard['continue-on-error']).not.toBe(true);
  });

  it('scopes the signing guard to stable Windows release tags', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const guard = findStep(workflow, 'Require Azure signing credentials on release tag (Windows)');

    expect(guard.if?.replace(/\s+/g, ' ').trim()).toBe(
      "startsWith(matrix.platform, 'windows') && inputs.release_tag != ''"
    );
    expect(workflow.on?.workflow_call?.inputs).toHaveProperty('release_tag');
  });

  it('runs the stable signing guard before the Windows build step', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const steps = workflow.jobs?.build?.steps ?? [];
    const guardIndex = steps.findIndex(
      (step) => step.name === 'Require Azure signing credentials on release tag (Windows)'
    );
    const buildIndex = steps.findIndex((step) => step.name === 'Build with electron-builder (Windows)');

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(buildIndex).toBeGreaterThan(guardIndex);
  });

  it('downloads, hashes, and pre-provisions one exact TrustedSigning module before credentials', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const install = findStep(workflow, 'Install pinned Azure TrustedSigning module (Windows release)');
    const script = install.run ?? '';

    expect(install.if?.replace(/\s+/g, ' ').trim()).toBe(
      "startsWith(matrix.platform, 'windows') && inputs.release_tag != ''"
    );
    expect(install.env).toBeUndefined();
    expect(script).toContain('Invoke-WebRequest');
    expect(script).toContain(
      'h3QX13+As/6i8v7rSUhgDWg033GklH5JiVLGFV0Rl3CipfT6/0XQPqEhI2uOogGTFkxiqXOTCeQc4zTSt2v6KQ=='
    );
    expect(script).not.toContain('Install-Module');
    expect(script).toContain('Get-EveryDependency');
    expect(script).toContain('Test-FileCatalog');
    expect(script).toContain('WAYLAND_TRUSTED_SIGNING_MODULE_PATH=');
    expect(script).toContain('$env:GITHUB_ENV');
    expect(script).toContain("$moduleVersion = '0.5.8'");
  });

  it('patches and locks electron-builder to the validated module path and secretless dependency setup', () => {
    const manifest = JSON.parse(readRepoFile('package.json')) as PackageManifest;
    const patchPath = manifest.patchedDependencies?.['app-builder-lib@26.10.0'];
    const lockfile = readRepoFile('bun.lock');

    expect(patchPath).toBe('patches/app-builder-lib@26.10.0.patch');
    expect(lockfile).toContain('"app-builder-lib@26.10.0": "patches/app-builder-lib@26.10.0.patch"');

    const addedLines = readRepoFile(patchPath ?? '')
      .split(/\r?\n/)
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .map((line) => line.slice(1))
      .join('\n');

    expect(addedLines).toContain('TRUSTED_SIGNING_MODULE_VERSION = "0.5.8"');
    expect(addedLines).toContain('WAYLAND_TRUSTED_SIGNING_MODULE_PATH');
    expect(addedLines).toContain('Test-FileCatalog');
    expect(addedLines).toContain('Get-EveryDependency');
    expect(addedLines).toContain('Remove-Item -LiteralPath "Env:');
    expect(addedLines).not.toContain('Install-Module');
    expect(addedLines).not.toContain('Install-PackageProvider');
  });

  it('propagates a Windows build failure before recording success', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const build = findStep(workflow, 'Build with electron-builder (Windows)');
    const script = build.run ?? '';
    const invocation = script.indexOf('Invoke-Expression $Command');
    const saveExitCode = script.indexOf('$BuildExitCode = $LASTEXITCODE');
    const checkExitCode = script.indexOf('if ($BuildExitCode -ne 0)');
    const exitWithCode = script.indexOf('exit $BuildExitCode');
    const successOutput = script.indexOf('result=success');

    expect(build.env).toMatchObject({ WINDOWS_BUILD_COMMAND: expect.any(String) });
    expect(build['continue-on-error']).not.toBe(true);
    expect(invocation).toBeGreaterThanOrEqual(0);
    expect(saveExitCode).toBeGreaterThan(invocation);
    expect(checkExitCode).toBeGreaterThan(saveExitCode);
    expect(exitWithCode).toBeGreaterThan(checkExitCode);
    expect(successOutput).toBeGreaterThan(exitWithCode);
  });

  it('treats missing required build artifacts as an error', () => {
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const upload = findStep(workflow, 'Upload build artifacts');

    expect(upload.with?.['if-no-files-found']).toBe('error');
  });
});

describe('electron-builder release signing contracts', () => {
  it('pins strict Azure Trusted Signing and canonical GitHub publication metadata', () => {
    const builder = load(readRepoFile('electron-builder.yml')) as BuilderConfig;

    expect(builder.publish).toMatchObject({
      provider: 'github',
      owner: 'FerroxLabs',
      repo: 'wayland',
      publishAutoUpdate: true,
    });
    expect(builder.win?.azureSignOptions).toMatchObject({
      publisherName: 'Ferrox Labs, LLC',
      endpoint: 'https://eus.codesigning.azure.net/',
      codeSigningAccountName: 'ferrox-labs-signing',
      certificateProfileName: 'ferroxlabs',
    });
    expect(builder.win?.forceCodeSigning).toBe(true);
    expect(builder.win?.verifyUpdateCodeSignature).toBe(true);
  });
});

describe('local unsigned Windows build overrides', () => {
  const completeAzureEnv = {
    AZURE_TENANT_ID: 'tenant',
    AZURE_CLIENT_ID: 'client',
    AZURE_CLIENT_SECRET: 'secret',
  };

  it.each([
    ['tenant ID', 'AZURE_TENANT_ID'],
    ['client ID', 'AZURE_CLIENT_ID'],
    ['client secret', 'AZURE_CLIENT_SECRET'],
  ] as const)('adds exactly the three unsigned overrides when the %s is missing', (_label, missingName) => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--win', { ...completeAzureEnv, [missingName]: undefined })).toEqual([
      '--config.win.azureSignOptions=',
      '--config.win.forceCodeSigning=false',
      '--config.win.verifyUpdateCodeSignature=false',
    ]);
  });

  it.each([
    ['tenant ID', 'AZURE_TENANT_ID'],
    ['client ID', 'AZURE_CLIENT_ID'],
    ['client secret', 'AZURE_CLIENT_SECRET'],
  ] as const)('treats a whitespace-only %s as missing', (_label, whitespaceName) => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--win', { ...completeAzureEnv, [whitespaceName]: '   ' })).toEqual([
      '--config.win.azureSignOptions=',
      '--config.win.forceCodeSigning=false',
      '--config.win.verifyUpdateCodeSignature=false',
    ]);
  });

  it('adds the same three overrides for an all-platform build without credentials', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--all', {})).toEqual([
      '--config.win.azureSignOptions=',
      '--config.win.forceCodeSigning=false',
      '--config.win.verifyUpdateCodeSignature=false',
    ]);
  });

  it.each([
    ['tenant ID', 'AZURE_TENANT_ID'],
    ['client ID', 'AZURE_CLIENT_ID'],
    ['client secret', 'AZURE_CLIENT_SECRET'],
  ] as const)('fails closed for a stable Windows tag when the %s is missing', (_label, missingName) => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(() =>
      getOverrides('--win', {
        ...completeAzureEnv,
        [missingName]: undefined,
        GITHUB_REF: 'refs/tags/v1.2.3',
      })
    ).toThrow('Stable Windows release requires complete Azure signing credentials');
  });

  it.each([
    ['tenant ID', 'AZURE_TENANT_ID'],
    ['client ID', 'AZURE_CLIENT_ID'],
    ['client secret', 'AZURE_CLIENT_SECRET'],
  ] as const)('fails closed for a stable Windows tag when the %s is whitespace-only', (_label, whitespaceName) => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(() =>
      getOverrides('--all', {
        ...completeAzureEnv,
        [whitespaceName]: ' \t\r\n ',
        GITHUB_REF: 'refs/tags/v1.2.3',
      })
    ).toThrow('Stable Windows release requires complete Azure signing credentials');
  });

  it('keeps unsigned overrides available for a development tag', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--win', { GITHUB_REF: 'refs/tags/v1.2.3-dev-4' })).toEqual([
      '--config.win.azureSignOptions=',
      '--config.win.forceCodeSigning=false',
      '--config.win.verifyUpdateCodeSignature=false',
    ]);
  });

  it('fails closed when a default-branch release dispatch is missing credentials', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(() =>
      getOverrides('--win', {
        GITHUB_REF: 'refs/heads/main',
        WAYLAND_RELEASE_TAG: 'v1.2.3-rc.1',
      })
    ).toThrow('Stable Windows release requires complete Azure signing credentials');
  });

  it('keeps strict signing for a stable tag with complete credentials', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--win', { ...completeAzureEnv, GITHUB_REF: 'refs/tags/v1.2.3' })).toEqual([]);
  });

  it('does not enforce Windows signing for a non-Windows stable-tag build', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--linux', { GITHUB_REF: 'refs/tags/v1.2.3' })).toEqual([]);
  });

  it('does not relax Windows signing when every Azure credential is present', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--win', completeAzureEnv)).toEqual([]);
  });

  it('does not add Windows overrides to a non-Windows build', () => {
    const getOverrides = loadUnsignedWindowsOverrides();

    expect(getOverrides('--linux', {})).toEqual([]);
  });

  it('does not use nonexistent or resource-editing options as signing overrides', () => {
    const source = readRepoFile('scripts/build-with-builder.js');

    expect(source).not.toContain('win.signExecutable');
    expect(source).not.toContain('--config.win.signAndEditExecutable=false');
  });

  it('passes the computed Windows overrides to the electron-builder command', () => {
    const source = readRepoFile('scripts/build-with-builder.js');
    const workflow = loadWorkflow('.github/workflows/_build-reusable.yml');
    const windowsBuild = findStep(workflow, 'Build with electron-builder (Windows)');

    expect(source).toContain('getUnsignedWindowsConfigOverrides(builderArgs, process.env)');
    expect(source).toContain('${configOverrides} ${publishArg}');
    expect(windowsBuild.env?.WAYLAND_RELEASE_TAG).toBe('${{ inputs.release_tag }}');
  });
});

describe('electron-builder production dependency closure', () => {
  it('patches Discord manifests to declare the safe Undici version resolved by Bun', () => {
    const manifest = JSON.parse(readRepoFile('package.json')) as PackageManifest;
    const lockfile = readRepoFile('bun.lock');
    const patches = [
      {
        dependency: '@discordjs/rest@2.6.1',
        path: 'patches/@discordjs%2Frest@2.6.1.patch',
      },
      {
        dependency: 'discord.js@14.26.4',
        path: 'patches/discord.js@14.26.4.patch',
      },
    ];

    expect(manifest.dependencies?.undici).toBe('6.27.0');
    expect(lockfile).toContain('"undici": ["undici@6.27.0"');

    for (const patch of patches) {
      expect(manifest.patchedDependencies?.[patch.dependency]).toBe(patch.path);
      expect(existsSync(repoFile(patch.path))).toBe(true);

      const patchSource = readRepoFile(patch.path);
      expect(patchSource).toContain('-    "undici": "6.24.1"');
      expect(patchSource).toContain('+    "undici": "6.27.0"');
    }
  });
});

describe('packaged updater metadata verification', () => {
  it('treats app-update.yml as a critical non-empty packaged resource', () => {
    const verifier = loadVerifierModule();

    expect(verifier.REQUIRED).toContainEqual({ rel: 'app-update.yml', critical: true, kind: 'file' });
  });

  it('accepts canonical parsed GitHub updater metadata', () => {
    const verifier = loadVerifierModule();

    expect(
      verifier.validateAppUpdateMetadataText(
        'provider: github\nowner: FerroxLabs\nrepo: wayland\nupdaterCacheDirName: wayland-updater\n'
      )
    ).toBe(true);
  });

  it('delegates the main packaged-resource loop to the exported resource verifier', () => {
    const source = readRepoFile('scripts/verify-packaged-resources.js');
    const mainStart = source.indexOf('function main()');
    const mainEnd = source.indexOf('if (require.main === module)', mainStart);

    expect(mainStart).toBeGreaterThanOrEqual(0);
    expect(mainEnd).toBeGreaterThan(mainStart);
    expect(source.slice(mainStart, mainEnd)).toContain('verifyResourceDir(resDir)');
  });

  it('accepts canonical app-update.yml through the resource verifier used by main', () => {
    const verifier = loadVerifierModule();
    const resourceDir = mkdtempSync(path.join(os.tmpdir(), 'wayland-update-metadata-'));
    const requirement = { rel: 'app-update.yml', critical: true, kind: 'file' };

    try {
      writeFileSync(
        path.join(resourceDir, 'app-update.yml'),
        'provider: github\nowner: FerroxLabs\nrepo: wayland\nupdaterCacheDirName: wayland-updater\n'
      );
      expect(verifier.verifyResourceDir(resourceDir, [requirement])).toEqual([{ requirement, ok: true }]);
    } finally {
      rmSync(resourceDir, { recursive: true, force: true });
    }
  });

  it('rejects malformed app-update.yml through the resource verifier used by main', () => {
    const verifier = loadVerifierModule();
    const resourceDir = mkdtempSync(path.join(os.tmpdir(), 'wayland-update-metadata-'));
    const requirement = { rel: 'app-update.yml', critical: true, kind: 'file' };

    try {
      writeFileSync(path.join(resourceDir, 'app-update.yml'), 'provider: github\nowner: attacker\nrepo: wayland\n');
      expect(verifier.verifyResourceDir(resourceDir, [requirement])).toEqual([{ requirement, ok: false }]);
    } finally {
      rmSync(resourceDir, { recursive: true, force: true });
    }
  });

  it.each([
    'provider: generic\nowner: FerroxLabs\nrepo: wayland\n',
    'provider: github\nowner: ShadowsTT\nrepo: wayland\n',
    'provider: github\nowner: FerroxLabs\nrepo: attacker\n',
    'provider: github\nowner: FerroxLabs\n',
    'not: [valid',
  ])('rejects non-canonical or malformed updater metadata: %s', (metadata) => {
    const verifier = loadVerifierModule();

    expect(verifier.validateAppUpdateMetadataText(metadata)).toBe(false);
  });
});
