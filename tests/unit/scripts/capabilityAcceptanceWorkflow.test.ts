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
  it('generates and attests receipts once before any package matrix job starts', () => {
    const config = workflow('_build-reusable.yml');
    const authority = config.jobs['capability-acceptance'];
    const build = config.jobs.build;
    const capture = authority.steps.find((step) => step.name === 'Capture exact candidate')!;
    const generate = authority.steps.find((step) => step.name === 'Generate exact capability acceptance receipts')!;
    const attest = authority.steps.find((step) => step.name === 'Attest exact capability acceptance bytes')!;
    const upload = authority.steps.find((step) => step.name === 'Upload capability acceptance authority')!;

    expect(authority.permissions).toEqual({ contents: 'read', 'id-token': 'write', attestations: 'write' });
    expect(capture.run).toContain('"${commit}" != "${GITHUB_SHA}"');
    expect(capture.run).toContain('git status --porcelain=v1 --untracked-files=all');
    expect(generate.run).toContain('generateCapabilityAcceptanceReceipts.js');
    expect(attest.uses).toBe('actions/attest-build-provenance@v3');
    expect(attest.with!['subject-path']).toBe('${{ runner.temp }}/capability-acceptance/*');
    expect(upload.with!['if-no-files-found']).toBe('error');
    expect(build.needs).toEqual(['code-quality', 'capability-acceptance']);
    expect(build.if).toContain("needs.capability-acceptance.result == 'success'");
  });

  it('downloads the exact authority into every native package job', () => {
    const build = workflow('_build-reusable.yml').jobs.build;
    const download = build.steps.find((step) => step.name === 'Download exact capability acceptance authority')!;

    expect(build.env!.WAYLAND_CAPABILITY_RECEIPTS_DIR).toBe('${{ runner.temp }}/capability-acceptance');
    expect(download.uses).toBe('actions/download-artifact@v7');
    expect(download.with).toEqual({
      name: '${{ needs.capability-acceptance.outputs.artifact-name }}',
      path: '${{ runner.temp }}/capability-acceptance',
    });
  });

  it('grants the two caller workflows only the authority needed to attest', () => {
    for (const name of ['build-and-release.yml', 'build-manual.yml']) {
      const permissions = workflow(name).permissions!;
      expect(permissions['id-token']).toBe('write');
      expect(permissions.attestations).toBe('write');
    }
  });
});
