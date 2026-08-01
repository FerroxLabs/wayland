import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, string> };
type Job = {
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  env?: Record<string, string>;
  outputs?: Record<string, string>;
  steps: Step[];
};

function workflow(name: string): { permissions?: Record<string, string>; jobs: Record<string, Job> } {
  return yaml.load(readFileSync(resolve('.github/workflows', name), 'utf8')) as {
    permissions?: Record<string, string>;
    jobs: Record<string, Job>;
  };
}

describe('capability acceptance build authority', () => {
  it('generates untrusted structured evidence once before package jobs without holding attestation authority', () => {
    const config = workflow('_build-reusable.yml');
    const authority = config.jobs['capability-acceptance'];
    const build = config.jobs.build;
    const capture = authority.steps.find((step) => step.name === 'Capture exact candidate')!;
    const generate = authority.steps.find(
      (step) => step.name === 'Generate structured exact capability acceptance receipts'
    )!;
    const attest = authority.steps.find((step) => step.uses?.startsWith('actions/attest-build-provenance'));
    const upload = authority.steps.find(
      (step) => step.name === 'Upload untrusted capability evidence for protected verification'
    )!;

    expect(authority.permissions).toEqual({ actions: 'read', contents: 'read' });
    expect(capture.run).toContain('"${commit}" != "${GITHUB_SHA}"');
    expect(capture.run).toContain('git status --porcelain=v1 --untracked-files=all');
    expect(generate.run).toContain('generateCapabilityAcceptanceReceipts.js');
    expect(attest).toBeUndefined();
    expect(upload.with!['if-no-files-found']).toBe('error');
    expect(build.needs).toEqual(['code-quality', 'capability-acceptance']);
    expect(build.if).toContain("needs.capability-acceptance.result == 'success'");
  });

  it('downloads the exact authority into every native package job', () => {
    const build = workflow('_build-reusable.yml').jobs.build;
    const download = build.steps.find((step) => step.name === 'Download exact capability acceptance authority')!;
    const exportPath = build.steps.find((step) => step.name === 'Export capability acceptance authority path')!;

    expect(download.uses).toBe('actions/download-artifact@v7');
    expect(download.with).toEqual({
      name: '${{ needs.capability-acceptance.outputs.artifact-name }}',
      path: '${{ runner.temp }}/capability-acceptance',
    });

    // The receipts directory must NOT come back as a job-level `env:` entry: the
    // `runner` context is unavailable there, which invalidates the entire
    // workflow file and makes every run fail before a single job starts. It is
    // exported from a step instead, from the same expression the download uses.
    expect(build.env?.WAYLAND_CAPABILITY_RECEIPTS_DIR).toBeUndefined();
    expect(exportPath.env).toEqual({ RECEIPTS_DIR: '${{ runner.temp }}/capability-acceptance' });
    expect(exportPath.run).toContain('WAYLAND_CAPABILITY_RECEIPTS_DIR=${RECEIPTS_DIR}');
    expect(exportPath.run).toContain('$GITHUB_ENV');
    expect(build.steps.indexOf(exportPath)).toBeGreaterThan(build.steps.indexOf(download));
    const firstConsumer = build.steps.findIndex((step) => step.name?.startsWith('Build with electron-builder'));
    expect(firstConsumer).toBeGreaterThan(build.steps.indexOf(exportPath));
  });

  it('keeps both caller workflows free of attestation authority', () => {
    for (const name of ['build-and-release.yml', 'build-manual.yml']) {
      const permissions = workflow(name).permissions!;
      expect(permissions['id-token']).toBeUndefined();
      expect(permissions.attestations).toBeUndefined();
      expect(permissions.contents).toBe('read');
    }
  });
});
