import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const release = fs.readFileSync('.github/workflows/build-and-release.yml', 'utf8');
const build = fs.readFileSync('.github/workflows/_build-reusable.yml', 'utf8');
const { minimatch } = createRequire(import.meta.url)('minimatch');

describe('release packaging reuse boundaries', () => {
  it.skipIf(process.platform === 'win32')('executes the Mac packaging capacity regressions in CI', () => {
    const result = spawnSync('python3', ['-B', 'tests/regression/test_dmgbuild_checked_copy.py'], {
      encoding: 'utf8',
      timeout: 10000,
    });
    const output = `${result.stdout}\n${result.stderr}`;
    expect(result.status, output).toBe(0);
    expect(output).toMatch(/Ran [1-9]\d* tests/);
    expect(output).toMatch(/\bOK\b/);
  });

  it('reports failed-only retries after completion instead of self-rerunning the producer', () => {
    expect(release).not.toContain('auto-retry-workflow:');
    expect(release).not.toContain('/rerun)');
    expect(release).toContain('gh run rerun $GITHUB_RUN_ID --repo $GITHUB_REPOSITORY --failed');
    expect(release).toContain('Wait for this producer to complete');
  });

  it('keeps ZIP/checkpoint/DMG/manifest/native verification ordered and the checkpoint opaque', () => {
    const phases = [
      '--mac zip',
      'Save verified Mac ZIP',
      'Preserve immutable Mac release checkpoint',
      'Construct DMG from the verified app only',
      'Preserve ZIP and merge',
      'Repair macOS update manifest',
      'Install and smoke real package payload',
    ];
    const positions = phases.map((phase) => build.indexOf(phase));
    expect(positions.every((value) => value >= 0)).toBe(true);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
    expect(build).toContain('path: ${{ runner.temp }}/mac-release-checkpoint/checkpoint.tar');
    expect(build).toContain('macReleaseCheckpointArchive.py unwrap');
    expect(build).toContain('env: *mac_build_env');
    expect(() => load(build)).not.toThrow();
  });

  it('leaves protected acceptance required and final publication as promotion only', () => {
    expect(release).toContain('needs: [release-smoke-gate, release-smoke-gate-windows, final-release-acceptance]');
    expect(release).toContain("needs.final-release-acceptance.result == 'success'");
    expect(release).toContain('producer_run_attempt="$GITHUB_RUN_ATTEMPT"');
    const publish = release.slice(release.indexOf('  publish-release:'), release.indexOf('  publish-getwayland-npm:'));
    expect(publish).toContain('gh release edit');
    expect(publish).not.toContain('build-with-builder');
    expect(release).toContain('publishDraftAssets.cjs prepare');
    expect(release).not.toContain('softprops/action-gh-release');
    expect(release).toContain('publishDraftAssets.cjs upload');
  });

  it('downloads every canonical authority but excludes opaque checkpoints and old raw assemblies', () => {
    const workflow = load(release) as {
      jobs: Record<string, { steps: { name: string; with?: { pattern?: string } }[] }>;
    };
    const pattern = workflow.jobs['assemble-raw-release-acceptance'].steps
      .find((step) => step.name === 'Download exact canonical build artifacts')!
      .with!.pattern!.replaceAll('${{ github.sha }}', 'abc123');
    for (const platform of ['macos', 'windows', 'linux']) {
      for (const arch of ['arm64', 'x64']) expect(minimatch(`${platform}-build-${arch}`, pattern)).toBe(true);
    }
    for (const authority of [
      'capability-acceptance',
      'protected-platform-observations',
      'protected-updater-observations',
    ]) {
      expect(minimatch(`${authority}-abc123`, pattern)).toBe(true);
      expect(minimatch(`${authority}-other`, pattern)).toBe(false);
    }
    expect(minimatch('macos-build-arm64-checkpoint-abc123', pattern)).toBe(false);
    expect(minimatch('raw-release-acceptance-abc123', pattern)).toBe(false);
  });
});
